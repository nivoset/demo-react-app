import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKycEngine } from './useKycEngine';
import { useFeatureFlags } from '../state/featureFlags';

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

  it('should use v1 rules when kycVersion is v1', () => {
    useFeatureFlags.setState({ kycVersion: 'v1' });
    
    const { result } = renderHook(() => useKycEngine());

    expect(result.current.version).toBe('v1');

    const input = {
      riskScore: 30,
      country: 'US',
    };

    const kycResult = result.current.evaluate(input);

    // Should approve with low risk score
    expect(kycResult.decision).toBe('approve');
    expect(kycResult.reasons).toContain('Low risk score');
  });

  it('should use v2 rules when kycVersion is v2', () => {
    useFeatureFlags.setState({ kycVersion: 'v2' });
    
    const { result } = renderHook(() => useKycEngine());

    expect(result.current.version).toBe('v2');

    const input = {
      riskScore: 30,
      country: 'US',
      isPep: true,
    };

    const kycResult = result.current.evaluate(input);

    // Should require manual review for PEP
    expect(kycResult.decision).toBe('manual_review');
    expect(kycResult.reasons).toContain('PEP (Politically Exposed Person)');
  });

  it('should add version discriminator to input for v1', () => {
    useFeatureFlags.setState({ kycVersion: 'v1' });
    
    const { result } = renderHook(() => useKycEngine());

    const input = {
      riskScore: 50,
      country: 'US',
      amount: 1000,
    };

    const kycResult = result.current.evaluate(input);

    // Should use v1 logic - medium risk score should require manual review
    expect(kycResult.decision).toBe('manual_review');
    expect(kycResult.reasons).toContain('Risk score 50-79');
  });

  it('should add version discriminator to input for v2', () => {
    useFeatureFlags.setState({ kycVersion: 'v2' });
    
    const { result } = renderHook(() => useKycEngine());

    const input = {
      riskScore: 50,
      country: 'US',
      isPep: false,
      velocity: 5,
    };

    const kycResult = result.current.evaluate(input);

    // Should use v2 logic - same risk score should require manual review
    expect(kycResult.decision).toBe('manual_review');
    expect(kycResult.reasons).toContain('Risk score 50-74');
  });

  it('should update when feature flag changes', () => {
    useFeatureFlags.setState({ kycVersion: 'v1' });
    const { result, rerender } = renderHook(() => useKycEngine());

    expect(result.current.version).toBe('v1');

    // Change to v2
    useFeatureFlags.setState({ kycVersion: 'v2' });
    rerender();

    expect(result.current.version).toBe('v2');

    // Test that v2 rules are actually used
    const input = {
      riskScore: 85,
      country: 'US',
    };

    // Switch to v2 and test
    const kycResult = result.current.evaluate(input);
    
    // v2 should deny at 75+, so 85 should be denied
    expect(kycResult.decision).toBe('deny');
    expect(kycResult.reasons).toContain('Risk score 75+');
  });

  it('should handle v2-specific fields when in v1 mode', () => {
    useFeatureFlags.setState({ kycVersion: 'v1' });
    
    const { result } = renderHook(() => useKycEngine());

    // Input includes v2-specific fields but should be passed to v1
    const input = {
      riskScore: 30,
      country: 'US',
      isPep: true, // v2 field - should be ignored in v1
      velocity: 10, // v2 field - should be ignored in v1
    };

    const kycResult = result.current.evaluate(input);

    // v1 should approve (PEP is not checked in v1)
    expect(kycResult.decision).toBe('approve');
    expect(kycResult.reasons).toContain('Low risk score');
  });

  it('should use v1 rules for high risk score denial', () => {
    useFeatureFlags.setState({ kycVersion: 'v1' });
    
    const { result } = renderHook(() => useKycEngine());

    const input = {
      riskScore: 85,
      country: 'US',
    };

    const kycResult = result.current.evaluate(input);

    // v1 denies at 80+
    expect(kycResult.decision).toBe('deny');
    expect(kycResult.reasons).toContain('Risk score 80+');
  });

  it('should use v2 rules for high risk score denial', () => {
    useFeatureFlags.setState({ kycVersion: 'v2' });
    
    const { result } = renderHook(() => useKycEngine());

    const input = {
      riskScore: 80,
      country: 'US',
    };

    const kycResult = result.current.evaluate(input);

    // v2 denies at 75+
    expect(kycResult.decision).toBe('deny');
    expect(kycResult.reasons).toContain('Risk score 75+');
  });

  it('should use v1 rules for restricted country', () => {
    useFeatureFlags.setState({ kycVersion: 'v1' });
    
    const { result } = renderHook(() => useKycEngine());

    const input = {
      riskScore: 30,
      country: 'XX', // Restricted country
    };

    const kycResult = result.current.evaluate(input);

    // Should deny for restricted country
    expect(kycResult.decision).toBe('deny');
    expect(kycResult.reasons).toContain('Restricted country: XX');
  });

  it('should use v2 rules for sanctions list (highest priority)', () => {
    useFeatureFlags.setState({ kycVersion: 'v2' });
    
    const { result } = renderHook(() => useKycEngine());

    const input = {
      riskScore: 10,
      country: 'US',
      sanctionsList: true,
    };

    const kycResult = result.current.evaluate(input);

    // Should deny for sanctions list even with low risk
    expect(kycResult.decision).toBe('deny');
    expect(kycResult.reasons).toContain('On sanctions list');
  });

  it('should use v2 rules for amount threshold', () => {
    useFeatureFlags.setState({ kycVersion: 'v2' });
    
    const { result } = renderHook(() => useKycEngine());

    const input = {
      riskScore: 30,
      country: 'US',
      amount: 150000, // Exceeds threshold
    };

    const kycResult = result.current.evaluate(input);

    // Should require manual review for high amount
    expect(kycResult.decision).toBe('manual_review');
    expect(kycResult.reasons.some(r => r.includes('Amount exceeds'))).toBe(true);
  });

  it('should use v2 rules for velocity threshold', () => {
    useFeatureFlags.setState({ kycVersion: 'v2' });
    
    const { result } = renderHook(() => useKycEngine());

    const input = {
      riskScore: 30,
      country: 'US',
      velocity: 15, // Exceeds threshold
    };

    const kycResult = result.current.evaluate(input);

    // Should require manual review for high velocity
    expect(kycResult.decision).toBe('manual_review');
    expect(kycResult.reasons.some(r => r.includes('High transaction velocity'))).toBe(true);
  });
});

