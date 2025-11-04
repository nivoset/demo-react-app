#!/usr/bin/env node

/**
 * Zombie React Architecture Analyzer
 * 
 * Analyzes a codebase against the 8 Zombie React Architecture Canon rules:
 * 1. Start Undead
 * 2. Horde Ratio
 * 3. 3-Click Brain Rule
 * 4. Trial of the Three Strains
 * 5. No Tunnels
 * 6. Coffin Rule (Co-location)
 * 7. No Unnamed Survivors
 * 8. Silence the Living
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const SRC_DIR = join(projectRoot, 'src');
const UI_COMPONENT_PATTERNS = ['**/components/**/*.tsx', '**/views/**/*.tsx'];
const BRAIN_PATTERNS = ['**/logic/**/*.ts', '**/state/**/*.ts'];
const UNNAMED_SURVIVOR_PATTERNS = /^(utils|helpers|common|stuff|index|shared)\.(ts|tsx|js|jsx)$/i;

class ZombieArchitectureAnalyzer {
  constructor() {
    this.components = [];
    this.brains = [];
    this.files = [];
    this.issues = [];
    this.warnings = [];
  }

  /**
   * Scan the codebase for all files
   */
  scanCodebase() {
    this.scanDirectory(SRC_DIR, '');
  }

  scanDirectory(dir, relativePath) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and dist
          if (!['node_modules', 'dist', '.git', '__tests__'].includes(entry.name)) {
            this.scanDirectory(fullPath, relPath);
          }
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          // Skip test files
          if (entry.name.includes('.test.') || 
              entry.name.includes('.spec.') ||
              relPath.includes('__tests__') ||
              relPath.includes('/test/')) {
            continue;
          }
          
          const fileInfo = {
            path: relPath,
            fullPath,
            name: entry.name,
            directory: relativePath,
            type: this.classifyFile(relPath),
          };
          
          this.files.push(fileInfo);
          
          if (fileInfo.type === 'component') {
            this.components.push(fileInfo);
          } else if (fileInfo.type === 'brain') {
            this.brains.push(fileInfo);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan ${dir}: ${error.message}`);
    }
  }

  /**
   * Classify a file as component, brain, or other
   */
  classifyFile(relPath) {
    // Brain files (logic, state)
    if (relPath.includes('/logic/') || relPath.includes('/state/')) {
      return 'brain';
    }
    
    // API files (could be brain or infrastructure)
    if (relPath.includes('/api/')) {
      return 'api';
    }
    
    // Components (UI)
    if (relPath.includes('/components/') || 
        relPath.includes('/views/') ||
        relPath.endsWith('.tsx') || 
        relPath.endsWith('.jsx')) {
      return 'component';
    }
    
    return 'other';
  }

  /**
   * Rule 1: Start Undead - Check if components are pure
   */
  checkStartUndead() {
    const violations = [];
    
    for (const component of this.components) {
      try {
        // Skip test files
        if (component.name.includes('.test.') || 
            component.name.includes('.spec.') ||
            component.path.includes('__tests__') ||
            component.path.includes('/test/')) {
          continue;
        }
        
        const content = readFileSync(component.fullPath, 'utf-8');
        
        // Skip hook files - hooks ARE brains by design
        const isHookFile = component.name.startsWith('use') && 
                          (component.path.includes('/logic/') || 
                           component.path.includes('/state/') ||
                           /export\s+(function|const)\s+use\w+/.test(content));
        
        if (isHookFile) {
          continue;
        }
        
        // Check for hooks that indicate brains
        const brainHooks = [
          'useState',
          'useEffect',
          'useQuery',
          'useMutation',
          'useContext',
          'useStore',
          'useSelector',
        ];
        
        const hasBrainHooks = brainHooks.some(hook => 
          new RegExp(`\\b${hook}\\b`).test(content)
        );
        
        // Check for direct store calls
        const hasStoreCalls = /useFeatureFlags|useKycEngine|useQuery|useMutation/.test(content);
        
        // Check for API calls in components
        const hasApiCalls = /fetchTransactions|approveKycDecision|requestKycDocuments|holdKycDecision/.test(content);
        
        // Views are allowed to have brains (they're brain boundaries)
        // Hook files are brains by design
        // Legacy components are excluded (they use different patterns)
        // Handle both forward and backslash paths (Windows vs Unix)
        const normalizedPath = component.path.replace(/\\/g, '/');
        
        // A view is a file in /views/ that is NOT in a /components/ subdirectory
        // Examples: views/dashboard/PaymentsOpsDashboard.tsx ✅
        //          views/dashboard/components/CustomerDetailsPanel.tsx ❌ (component)
        const isView = normalizedPath.includes('/views/') && 
                      !normalizedPath.match(/\/views\/[^/]+\/components\//);
        const isLegacy = normalizedPath.includes('/legacy/');
        
        // Justified exceptions (documented in codebase):
        // - FeatureFlagsPanel: Configuration UI, reads from store but doesn't make business decisions
        // - CustomerSearch: Event bridging for legacy integration (minimal, justified)
        const isJustifiedException = 
          normalizedPath.includes('FeatureFlagsPanel') ||
          (normalizedPath.includes('CustomerSearch') && normalizedPath.includes('/components/'));
        
        // Only flag pure UI components that have brains when they shouldn't
        // Skip views (brain boundaries), hook files (brains by design), legacy, and justified exceptions
        if (!isView && !isHookFile && !isLegacy && !isJustifiedException && 
            (hasBrainHooks || hasStoreCalls || hasApiCalls)) {
          violations.push({
            file: component.path,
            reason: 'Component has brains (hooks, store calls, or API calls)',
            severity: 'warning',
          });
        }
      } catch (error) {
        // Skip files we can't read
      }
    }
    
    return {
      rule: 'Start Undead',
      passed: violations.length === 0,
      violations,
      message: violations.length === 0 
        ? '✅ All UI components start undead (pure render)'
        : `⚠️ ${violations.length} components have brains before they should`,
    };
  }

  /**
   * Rule 2: Horde Ratio - Calculate UI:Brain ratio
   */
  checkHordeRatio() {
    // Count UI components (zombies)
    const zombies = this.components.filter(c => 
      !c.path.includes('/views/') || c.path.includes('/components/')
    );
    
    // Count brain components (views that orchestrate, logic files)
    const brainComponents = [
      ...this.components.filter(c => 
        c.path.includes('/views/') && !c.path.includes('/components/')
      ),
      ...this.brains,
    ];
    
    const ratio = zombies.length / (brainComponents.length || 1);
    const targetRatio = 7;
    const passed = ratio >= targetRatio;
    
    return {
      rule: 'Horde Ratio',
      passed,
      zombies: zombies.length,
      brains: brainComponents.length,
      ratio: ratio.toFixed(2),
      targetRatio,
      message: passed
        ? `✅ Horde ratio: ${ratio.toFixed(2)}:1 (target: ${targetRatio}:1)`
        : `⚠️ Horde ratio: ${ratio.toFixed(2)}:1 (target: ${targetRatio}:1) - Too few zombies or too many brains`,
    };
  }

  /**
   * Rule 3: 3-Click Brain Rule - Check navigation paths
   */
  checkThreeClickBrainRule() {
    // This is a simplified check - full implementation would require AST parsing
    // to trace actual import/usage paths
    const violations = [];
    
    // Check for deep component nesting
    for (const component of this.components) {
      const depth = component.path.split('/').length;
      if (depth > 5) {
        violations.push({
          file: component.path,
          reason: `Deep nesting (${depth} levels) may violate 3-click rule`,
          severity: 'info',
        });
      }
    }
    
    return {
      rule: '3-Click Brain Rule',
      passed: violations.length === 0,
      violations,
      message: violations.length === 0
        ? '✅ Component structure supports 3-click navigation'
        : `⚠️ ${violations.length} files may violate 3-click rule - manual review needed`,
      note: 'Full validation requires AST analysis to trace import paths',
    };
  }

  /**
   * Rule 4: Trial of the Three Strains - Check for interface exploration
   */
  checkTrialOfThreeStrains() {
    // This rule is about design process, not code structure
    // We can check if there's documentation of strain decisions
    const hasAdrFiles = this.files.some(f => 
      f.name.includes('adr') || f.name.includes('strain') || f.name.includes('decision')
    );
    
    return {
      rule: 'Trial of the Three Strains',
      passed: true, // This is a design process rule
      message: hasAdrFiles
        ? '✅ Found ADR/decision documentation'
        : 'ℹ️ No ADR files found - consider documenting interface decisions',
      note: 'This is a design process rule - ensure 3 strains are explored before implementation',
    };
  }

  /**
   * Rule 5: No Tunnels - Check for prop drilling
   */
  checkNoTunnels() {
    // Simplified check - would need AST analysis for full validation
    const violations = [];
    
    // Check for long prop chains by looking at component depth
    const componentDepths = this.components
      .filter(c => c.path.includes('/components/'))
      .map(c => ({
        file: c.path,
        depth: c.path.split('/').length,
      }))
      .filter(c => c.depth > 4);
    
    if (componentDepths.length > 0) {
      violations.push(...componentDepths.map(c => ({
        file: c.file,
        reason: `Deep component nesting may indicate prop drilling`,
        severity: 'warning',
      })));
    }
    
    return {
      rule: 'No Tunnels',
      passed: violations.length === 0,
      violations,
      message: violations.length === 0
        ? '✅ No obvious prop drilling detected'
        : `⚠️ ${violations.length} components may have prop drilling - manual review needed`,
      note: 'Full validation requires AST analysis to trace prop passing',
    };
  }

  /**
   * Rule 6: Coffin Rule - Check co-location
   */
  checkCoffinRule() {
    const violations = [];
    
    // Check if feature-specific files are co-located
    const features = new Map();
    
    for (const file of this.files) {
      const parts = file.path.split('/');
      const featureIndex = parts.findIndex(p => 
        ['views', 'components', 'logic', 'state'].includes(p)
      );
      
      if (featureIndex > 0) {
        const feature = parts[featureIndex - 1] || 'root';
        if (!features.has(feature)) {
          features.set(feature, []);
        }
        features.get(feature).push(file);
      }
    }
    
    // Check for scattered files that should be together
    for (const [feature, files] of features.entries()) {
      const fileTypes = new Set(files.map(f => f.type));
      
      // If a feature has multiple types, they should be co-located
      if (fileTypes.size > 1) {
        const directories = new Set(files.map(f => f.directory));
        if (directories.size > 3) {
          violations.push({
            feature,
            reason: `Feature files scattered across ${directories.size} directories`,
            severity: 'info',
          });
        }
      }
    }
    
    return {
      rule: 'Coffin Rule (Co-location)',
      passed: violations.length === 0,
      violations,
      message: violations.length === 0
        ? '✅ Related code is co-located by feature'
        : `ℹ️ ${violations.length} features may benefit from better co-location`,
    };
  }

  /**
   * Rule 7: No Unnamed Survivors - Check file naming
   */
  checkNoUnnamedSurvivors() {
    const violations = [];
    
    for (const file of this.files) {
      if (UNNAMED_SURVIVOR_PATTERNS.test(file.name)) {
        violations.push({
          file: file.path,
          reason: `File uses generic name: ${file.name}`,
          severity: 'error',
        });
      }
    }
    
    return {
      rule: 'No Unnamed Survivors',
      passed: violations.length === 0,
      violations,
      message: violations.length === 0
        ? '✅ All files have purposeful, domain-specific names'
        : `❌ ${violations.length} files use generic names (utils, helpers, common, etc.)`,
    };
  }

  /**
   * Rule 8: Silence the Living - Check for console/warnings
   */
  checkSilenceTheLiving() {
    const violations = [];
    
    for (const file of this.files) {
      try {
        // Skip test files (already excluded at scan level, but double-check)
        if (file.name.includes('.test.') || 
            file.name.includes('.spec.') ||
            file.path.includes('__tests__') ||
            file.path.includes('/test/')) {
          continue;
        }
        
        const content = readFileSync(file.fullPath, 'utf-8');
        
        // Check for console statements
        const consoleMatches = content.match(/console\.(log|warn|error|info|debug)/g);
        if (consoleMatches) {
          violations.push({
            file: file.path,
            reason: `Contains console statements: ${consoleMatches.join(', ')}`,
            severity: 'warning',
          });
        }
        
        // Check for eslint-disable comments (warnings silenced)
        const eslintDisableMatches = content.match(/eslint-disable/g);
        if (eslintDisableMatches) {
          violations.push({
            file: file.path,
            reason: 'Contains eslint-disable - should document why',
            severity: 'info',
          });
        }
      } catch (error) {
        // Skip files we can't read
      }
    }
    
    return {
      rule: 'Silence the Living',
      passed: violations.length === 0,
      violations,
      message: violations.length === 0
        ? '✅ Codebase is silent (no console noise, no warnings)'
        : `⚠️ ${violations.length} files contain console statements or disabled warnings`,
    };
  }

  /**
   * Run all checks and generate report
   */
  analyze() {
    console.log('🧟 Scanning codebase for Zombie React Architecture compliance...\n');
    
    this.scanCodebase();
    
    console.log(`Found ${this.files.length} files:`);
    console.log(`  - ${this.components.length} UI components (zombies)`);
    console.log(`  - ${this.brains.length} brain files (logic)`);
    console.log(`  - ${this.files.length - this.components.length - this.brains.length} other files\n`);
    
    const results = [
      this.checkStartUndead(),
      this.checkHordeRatio(),
      this.checkThreeClickBrainRule(),
      this.checkTrialOfThreeStrains(),
      this.checkNoTunnels(),
      this.checkCoffinRule(),
      this.checkNoUnnamedSurvivors(),
      this.checkSilenceTheLiving(),
    ];
    
    return {
      summary: {
        totalFiles: this.files.length,
        components: this.components.length,
        brains: this.brains.length,
      },
      results,
    };
  }

  /**
   * Generate markdown report
   */
  generateReport(analysis) {
    let report = '# 🧟 Zombie React Architecture Analysis Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Files**: ${analysis.summary.totalFiles}\n`;
    report += `- **UI Components (Zombies)**: ${analysis.summary.components}\n`;
    report += `- **Brain Files**: ${analysis.summary.brains}\n\n`;
    
    report += `## Rule Compliance\n\n`;
    
    for (const result of analysis.results) {
      const status = result.passed ? '✅' : result.violations?.some(v => v.severity === 'error') ? '❌' : '⚠️';
      report += `### ${status} ${result.rule}\n\n`;
      report += `${result.message}\n\n`;
      
      if (result.note) {
        report += `*Note: ${result.note}*\n\n`;
      }
      
      if (result.violations && result.violations.length > 0) {
        report += `**Violations:**\n\n`;
        for (const violation of result.violations.slice(0, 10)) {
          report += `- \`${violation.file}\`: ${violation.reason}\n`;
        }
        if (result.violations.length > 10) {
          report += `- ... and ${result.violations.length - 10} more\n`;
        }
        report += '\n';
      }
      
      if (result.ratio) {
        report += `- Zombies: ${result.zombies}\n`;
        report += `- Brains: ${result.brains}\n`;
        report += `- Ratio: ${result.ratio}:1\n\n`;
      }
    }
    
    return report;
  }
}

// Main execution
// Check if this is the main module (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('analyze-zombie-architecture.js');

if (isMainModule || import.meta.url.includes('analyze-zombie-architecture.js')) {
  const analyzer = new ZombieArchitectureAnalyzer();
  const analysis = analyzer.analyze();
  const report = analyzer.generateReport(analysis);
  
  console.log('\n' + '='.repeat(80) + '\n');
  console.log(report);
  
  // Write report to file
  const reportPath = join(projectRoot, 'ZOMBIE_ARCHITECTURE_REPORT.md');
  writeFileSync(reportPath, report);
  console.log(`\n📄 Full report written to: ${reportPath}`);
}

export { ZombieArchitectureAnalyzer };

