import type { Plugin } from 'vite';
import { parse } from '@babel/parser';
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';

// Import traverse - handle the export structure
import * as traverseModule from '@babel/traverse';
const traverseFn = (traverseModule as any).default || traverseModule;

// Import generate - handle the export structure
import * as generateModule from '@babel/generator';
const generateFn = (generateModule as any).default || generateModule;

interface ComponentInfo {
  name: string;
  hooks: Set<string>;
  componentPath: NodePath<t.FunctionDeclaration | t.VariableDeclarator>;
}

/**
 * Vite plugin that automatically adds data-component and data-business-logic attributes
 * to React components during build time.
 * 
 * Rules:
 * - Adds data-component={componentName} to ALL components (first JSX element returned)
 * - Adds data-business-logic={filename} if component uses hooks other than useRef, useEffect, useMemo
 */
export function componentAttributesPlugin(): Plugin {
  return {
    name: 'component-attributes',
    enforce: 'pre',
    transform(code, id) {
      // Only process React/TypeScript component files
      if (!id.match(/\.(tsx|jsx)$/) || id.includes('node_modules')) {
        return null;
      }

      try {
        // Parse the code
        const ast = parse(code, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx', 'decorators-legacy'],
        });

        // Extract filename without extension for data-business-logic value
        const fileName = id.split('/').pop()?.replace(/\.(tsx|jsx)$/, '') || 'unknown';

        const components = new Map<string, ComponentInfo>();
        let hasModifications = false;

        // First pass: Find all components and their hook usage
        // Use the traverse function - handle both named and default exports
        const traverse = typeof traverseFn === 'function' ? traverseFn : (traverseFn as any).default;
        if (!traverse || typeof traverse !== 'function') {
          console.error(`[component-attributes] traverse is not a function in ${fileName}, type: ${typeof traverseFn}`);
          return null;
        }
        traverse(ast, {
          // Handle function declarations: function Component() { ... }
          FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
            const node = path.node;
            if (node.id && /^[A-Z]/.test(node.id.name)) {
              const hooks = new Set<string>();

              // Find all hook calls in the component
              path.traverse({
                CallExpression(hookPath: NodePath<t.CallExpression>) {
                  const callee = hookPath.node.callee;
                  if (t.isIdentifier(callee) && callee.name.startsWith('use')) {
                    hooks.add(callee.name);
                  }
                },
              });

              components.set(node.id.name, {
                name: node.id.name,
                hooks,
                componentPath: path as NodePath<t.FunctionDeclaration | t.VariableDeclarator>,
              });
            }
          },
          // Handle variable declarations: const Component = () => { ... }
          VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
            const node = path.node;
            if (
              t.isIdentifier(node.id) &&
              /^[A-Z]/.test(node.id.name) &&
              (t.isArrowFunctionExpression(node.init) ||
                t.isFunctionExpression(node.init))
            ) {
              const hooks = new Set<string>();

              const func = node.init as t.ArrowFunctionExpression | t.FunctionExpression;

              // Traverse the function body to find hooks
              if (t.isBlockStatement(func.body)) {
                path.traverse({
                  CallExpression(hookPath: NodePath<t.CallExpression>) {
                    // Skip if this call is outside our function scope
                    if (!hookPath.findParent((p: NodePath) => p.node === func.body)) return;

                    const callee = hookPath.node.callee;
                    if (t.isIdentifier(callee) && callee.name.startsWith('use')) {
                      hooks.add(callee.name);
                    }
                  },
                });
              } else if (t.isJSXElement(func.body)) {
                // Arrow function with implicit return - no hooks possible here
              }

              components.set(node.id.name, {
                name: node.id.name,
                hooks,
                componentPath: path,
              });
            }
          },
        });


        // Second pass: For each component, find its return statements and add attributes
        for (const component of components.values()) {
          const path = component.componentPath;
          const jsxReturnStatements: NodePath<t.ReturnStatement>[] = [];

          // Find ALL return statements that return JSX (skip null returns)
          if (t.isFunctionDeclaration(path.node)) {
            // Find return statements only in the function body, not nested functions
            const body = path.node.body;
            if (t.isBlockStatement(body)) {
              // Collect all return statements
              const returnStatements: NodePath<t.ReturnStatement>[] = [];
              path.get('body').traverse({
                ReturnStatement(returnPath: NodePath<t.ReturnStatement>) {
                  // Make sure we're not inside a nested function
                  const parent = returnPath.getFunctionParent();
                  if (!parent || parent.node === path.node) {
                    returnStatements.push(returnPath);
                  }
                },
              });
              // Collect ALL return statements that return JSX (skip null returns)
              for (const returnStmt of returnStatements) {
                const returnValue = returnStmt.node.argument;
                // Skip null returns (early returns)
                if (returnValue && t.isNullLiteral(returnValue)) {
                  continue;
                }
                if (returnValue && 
                    (t.isJSXElement(returnValue) || 
                     t.isJSXFragment(returnValue) || 
                     t.isConditionalExpression(returnValue))) {
                  jsxReturnStatements.push(returnStmt);
                }
              }
            }
          } else if (t.isVariableDeclarator(path.node)) {
            const init = path.node.init;
            if (init && (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init))) {
              const func = init;
              
              if (t.isArrowFunctionExpression(func) && t.isJSXElement(func.body)) {
                // Implicit return - will be handled below
              } else if (t.isBlockStatement(func.body)) {
                // Collect all return statements
                const returnStatements: NodePath<t.ReturnStatement>[] = [];
                path.get('init').get('body').traverse({
                  ReturnStatement(returnPath: NodePath<t.ReturnStatement>) {
                    // Make sure we're not inside a nested function
                    const parent = returnPath.getFunctionParent();
                    if (!parent || parent.node === func) {
                      returnStatements.push(returnPath);
                    }
                  },
                });
                // Collect ALL return statements that return JSX (skip null returns)
                for (const returnStmt of returnStatements) {
                  const returnValue = returnStmt.node.argument;
                  // Skip null returns (early returns)
                  if (returnValue && t.isNullLiteral(returnValue)) {
                    continue;
                  }
                  if (returnValue && 
                      (t.isJSXElement(returnValue) || 
                       t.isJSXFragment(returnValue) || 
                       t.isConditionalExpression(returnValue))) {
                    jsxReturnStatements.push(returnStmt);
                  }
                }
              }
            }
          }

          // Helper function to add attributes to a JSX element
          function addAttributesToJSXElement(
            jsxElement: t.JSXElement,
            comp: ComponentInfo,
            fName: string
          ) {
            const existingAttributes = jsxElement.openingElement.attributes;

            // Check if attributes already exist
            const hasDataComponent = existingAttributes.some(
              (attr) =>
                t.isJSXAttribute(attr) &&
                t.isJSXIdentifier(attr.name) &&
                attr.name.name === 'data-component'
            );

            const hasDataBusinessLogic = existingAttributes.some(
              (attr) =>
                t.isJSXAttribute(attr) &&
                t.isJSXIdentifier(attr.name) &&
                attr.name.name === 'data-business-logic'
            );

            // ALWAYS add data-component to ALL components
            if (!hasDataComponent) {
              const componentAttr = t.jsxAttribute(
                t.jsxIdentifier('data-component'),
                t.stringLiteral(comp.name)
              );
              jsxElement.openingElement.attributes.push(componentAttr);
              hasModifications = true;
            }

            // Only add data-business-logic if component uses hooks OTHER than useRef, useEffect, useMemo
            const allowedHooks = new Set(['useRef', 'useEffect', 'useMemo']);
            const businessLogicHooks = Array.from(comp.hooks).filter(
              (h) => !allowedHooks.has(h)
            );
            
            // Only add attribute if there are hooks that indicate business logic
            // Use the filename as the value
            if (!hasDataBusinessLogic && businessLogicHooks.length > 0) {
              const businessLogicAttr = t.jsxAttribute(
                t.jsxIdentifier('data-business-logic'),
                t.stringLiteral(fName)
              );
              jsxElement.openingElement.attributes.push(businessLogicAttr);
              hasModifications = true;
            }
          }

          // Handle implicit return for arrow functions
          if (t.isVariableDeclarator(path.node)) {
            const init = path.node.init;
            if (init && t.isArrowFunctionExpression(init) && t.isJSXElement(init.body)) {
              // For implicit returns, add to the JSX element directly
              const jsxElement = init.body;
              addAttributesToJSXElement(jsxElement, component, fileName);
            }
          }

          // Process all JSX return statements - add attributes to each one
          for (const returnStmtPath of jsxReturnStatements) {
            const returnNode = returnStmtPath.node;
            const returnValue = returnNode.argument;
            if (!returnValue) continue;

            let jsxElement: t.JSXElement | null = null;

            if (t.isJSXElement(returnValue)) {
              jsxElement = returnValue;
            } else if (t.isJSXFragment(returnValue)) {
              const firstChild = returnValue.children.find((child) =>
                t.isJSXElement(child)
              ) as t.JSXElement | undefined;
              if (firstChild) jsxElement = firstChild;
            } else if (t.isConditionalExpression(returnValue)) {
              if (t.isJSXElement(returnValue.consequent)) {
                jsxElement = returnValue.consequent;
              } else if (t.isJSXElement(returnValue.alternate)) {
                jsxElement = returnValue.alternate;
              }
            }

            if (jsxElement) {
              addAttributesToJSXElement(jsxElement, component, fileName);
            }
          }
        }

        if (hasModifications) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const generate = typeof generateFn === 'function' ? generateFn : (generateFn as any).default;
          const output = generate(ast, { retainLines: false }, code);
          return {
            code: output.code,
            map: output.map,
          };
        }

        return null;
      } catch (error) {
        // If parsing fails, return original code
        console.warn(`[component-attributes] Failed to parse ${id}:`, error);
        return null;
      }
    },
  };
}
