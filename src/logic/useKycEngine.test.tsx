import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKycEngine } from './useKycEngine';
import { useFeatureFlags } from '../state/featureFlags';
import type { KycInputWithoutVersion } from './useKycEngine';

describe('useKycEngine', () => {
  beforeEach(() => {
    // Clear localStorage and reset to default state
    localStorage.removeItem('feature-flags-storage');
    useFeatureFlags.setState({
      kycVersion: 'v1',
      showComponentOutlines: false,
    });
  });

  afterEach(() => {
    localStorage.removeItem('feature-flags-storage');
  });

  describe('version selection', () => {
    it.each([
      { version: 'v1', expectedVersion: 'v1' },
      { version: 'v2', expectedVersion: 'v2' },
    ] satisfies Array<{ version: 'v1' | 'v2'; expectedVersion: 'v1' | 'v2' }>)(
      'should return version $expectedVersion when kycVersion is $version',
      ({ version, expectedVersion }) => {
        useFeatureFlags.setState({ kycVersion: version });
        const { result } = renderHook(() => useKycEngine());
        expect(result.current.version).toBe(expectedVersion);
      }
    );
  });

  describe('KYC evaluation - version with input should produce expected output', () => {
    it.each([
      // v1 tests
      {
        version: 'v1',
        input: { riskScore: 30, country: 'US' },
        expectedDecision: 'approve',
        expectedReasonContains: 'Low risk score',
      },
      {
        version: 'v1',
        input: { riskScore: 50, country: 'US' },
        expectedDecision: 'manual_review',
        expectedReasonContains: 'Risk score 50-79',
      },
      {
        version: 'v1',
        input: { riskScore: 85, country: 'US' },
        expectedDecision: 'deny',
        expectedReasonContains: 'Risk score 80+',
      },
      {
        version: 'v1',
        input: { riskScore: 30, country: 'XX' },
        expectedDecision: 'deny',
        expectedReasonContains: 'Restricted country: XX',
      },
      {
        version: 'v1',
        input: { riskScore: 30, country: 'US', isPep: true, velocity: 10 },
        expectedDecision: 'approve',
        expectedReasonContains: 'Low risk score',
      },
      
      // v2 tests
      {
        version: 'v2',
        input: { riskScore: 30, country: 'US' },
        expectedDecision: 'approve',
        expectedReasonContains: 'Low risk profile',
      },
      {
        version: 'v2',
        input: { riskScore: 30, country: 'US', isPep: true },
        expectedDecision: 'manual_review',
        expectedReasonContains: 'PEP (Politically Exposed Person)',
      },
      {
        version: 'v2',
        input: { riskScore: 50, country: 'US' },
        expectedDecision: 'manual_review',
        expectedReasonContains: 'Risk score 50-74',
      },
      {
        version: 'v2',
        input: { riskScore: 80, country: 'US' },
        expectedDecision: 'deny',
        expectedReasonContains: 'Risk score 75+',
      },
      {
        version: 'v2',
        input: { riskScore: 10, country: 'US', sanctionsList: true },
        expectedDecision: 'deny',
        expectedReasonContains: 'On sanctions list',
      },
      {
        version: 'v2',
        input: { riskScore: 30, country: 'US', amount: 150000 },
        expectedDecision: 'manual_review',
        expectedReasonContains: 'Amount exceeds',
      },
      {
        version: 'v2',
        input: { riskScore: 30, country: 'US', velocity: 15 },
        expectedDecision: 'manual_review',
        expectedReasonContains: 'High transaction velocity',
      },
      {
        version: 'v2',
        input: { riskScore: 30, country: 'XX' },
        expectedDecision: 'deny',
        expectedReasonContains: 'Restricted country: XX',
      },
    ] satisfies Array<{
      version: 'v1' | 'v2';
      input: KycInputWithoutVersion;
      expectedDecision: 'approve' | 'manual_review' | 'deny';
      expectedReasonContains: string;
    }>)(
      '$version: input $input should produce $expectedDecision with reason containing "$expectedReasonContains"',
      ({ version, input, expectedDecision, expectedReasonContains }) => {
        useFeatureFlags.setState({ kycVersion: version });
        const { result } = renderHook(() => useKycEngine());

        expect(result.current.version).toBe(version);

        const kycResult = result.current.evaluate(input);

        expect(kycResult.decision).toBe(expectedDecision);
        expect(kycResult.reasons.some(r => r.includes(expectedReasonContains))).toBe(true);
      }
    );
  });

  describe('feature flag changes', () => {
    it('should update when feature flag changes', () => {
      useFeatureFlags.setState({ kycVersion: 'v1' });
      const { result, rerender } = renderHook(() => useKycEngine());

      expect(result.current.version).toBe('v1');

      // Change to v2
      useFeatureFlags.setState({ kycVersion: 'v2' });
      rerender();

      expect(result.current.version).toBe('v2');

      // Test that v2 rules are actually used
      const input = { riskScore: 85, country: 'US' };
      const kycResult = result.current.evaluate(input);

      // v2 should deny at 75+, so 85 should be denied
      expect(kycResult.decision).toBe('deny');
      expect(kycResult.reasons).toContain('Risk score 75+');
    });
  });
});

