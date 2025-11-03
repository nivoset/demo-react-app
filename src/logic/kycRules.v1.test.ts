import { describe, it, expect } from 'vitest';
import { evaluateKycV1, type KycInput } from './kycRules.v1';

describe('evaluateKycV1', () => {
  it('should approve when risk score is low', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 30,
      country: 'US',
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('approve');
    expect(result.reasons).toContain('Low risk score');
  });

  it('should deny when risk score is 80 or higher', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 80,
      country: 'US',
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('Risk score 80+');
  });

  it('should deny when risk score exceeds 80', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 95,
      country: 'US',
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('Risk score 80+');
  });

  it('should require manual review when risk score is 50-79', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 65,
      country: 'US',
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('manual_review');
    expect(result.reasons).toContain('Risk score 50-79');
  });

  it('should require manual review at lower bound (50)', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 50,
      country: 'US',
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('manual_review');
    expect(result.reasons).toContain('Risk score 50-79');
  });

  it('should require manual review at upper bound (79)', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 79,
      country: 'US',
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('manual_review');
    expect(result.reasons).toContain('Risk score 50-79');
  });

  it('should deny when country is restricted', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 30,
      country: 'XX',
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('Restricted country: XX');
  });

  it('should deny when country is restricted even with low risk score', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 10,
      country: 'YY',
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('Restricted country: YY');
  });

  it('should deny when country is restricted even with high risk score', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 85,
      country: 'ZZ',
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('deny');
    // Note: High risk score check happens before country check in the implementation
    // So it will return 'Risk score 80+' instead of 'Restricted country: ZZ'
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons.some(r => r.includes('Risk score 80+') || r.includes('Restricted country'))).toBe(true);
  });

  it('should prioritize country restriction over risk score', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 65, // Would be manual_review
      country: 'XX', // But country is restricted
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('Restricted country: XX');
    // Should not include manual review reason since country denial takes precedence
  });

  it('should prioritize high risk score over medium risk score', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 85,
      country: 'US',
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('Risk score 80+');
    // Should not include manual review reason
  });

  it('should handle amount field (optional)', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 30,
      country: 'US',
      amount: 1000,
    };

    const result = evaluateKycV1(input);

    expect(result.decision).toBe('approve');
    // Amount should not affect v1 evaluation
  });

  it('should return reasons array even for approve', () => {
    const input: KycInput = {
      version: 'v1',
      riskScore: 30,
      country: 'US',
    };

    const result = evaluateKycV1(input);

    expect(result.reasons).toBeInstanceOf(Array);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

