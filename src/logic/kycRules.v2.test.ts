import { describe, it, expect } from 'vitest';
import { evaluateKycV2, type KycInputV2 } from './kycRules.v2';

describe('evaluateKycV2', () => {
  it('should approve when risk score is low and no other risk factors', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 30,
      country: 'US',
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('approve');
    expect(result.reasons).toContain('Low risk profile');
  });

  it('should deny when sanctions list is true (highest priority)', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 10,
      country: 'US',
      sanctionsList: true,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('On sanctions list');
  });

  it('should deny when sanctions list is true even with low risk score', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 5,
      country: 'US',
      sanctionsList: true,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('On sanctions list');
  });

  it('should require manual review when isPep is true', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 30,
      country: 'US',
      isPep: true,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('manual_review');
    expect(result.reasons).toContain('PEP (Politically Exposed Person)');
  });

  it('should deny when risk score is 75 or higher', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 75,
      country: 'US',
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('Risk score 75+');
  });

  it('should deny when risk score exceeds 75', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 90,
      country: 'US',
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('Risk score 75+');
  });

  it('should require manual review when risk score is 50-74', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 60,
      country: 'US',
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('manual_review');
    expect(result.reasons).toContain('Risk score 50-74');
  });

  it('should require manual review when amount exceeds threshold', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 30,
      country: 'US',
      amount: 150000,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('manual_review');
    expect(result.reasons.some(r => r.includes('Amount exceeds'))).toBe(true);
  });

  it('should not require manual review when amount is below threshold', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 30,
      country: 'US',
      amount: 50000,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('approve');
  });

  it('should require manual review when velocity exceeds threshold', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 30,
      country: 'US',
      velocity: 15,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('manual_review');
    expect(result.reasons.some(r => r.includes('High transaction velocity'))).toBe(true);
  });

  it('should not require manual review when velocity is below threshold', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 30,
      country: 'US',
      velocity: 5,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('approve');
  });

  it('should deny when country is restricted', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 30,
      country: 'XX',
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('Restricted country: XX');
  });

  it('should require manual review for combined risk factors', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 65,
      country: 'US',
      amount: 60000, // 0.5 * threshold
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('manual_review');
    // Should have combined risk factors or individual risk factors
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('should prioritize sanctions list over PEP', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 30,
      country: 'US',
      isPep: true,
      sanctionsList: true,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('On sanctions list');
  });

  it('should prioritize sanctions list over high risk score', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 80,
      country: 'US',
      sanctionsList: true,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('deny');
    expect(result.reasons).toContain('On sanctions list');
  });

  it('should require manual review when PEP and medium risk score', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 60,
      country: 'US',
      isPep: true,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('manual_review');
    expect(result.reasons).toContain('PEP (Politically Exposed Person)');
  });

  it('should handle all optional fields', () => {
    const input: KycInputV2 = {
      version: 'v2',
      riskScore: 30,
      country: 'US',
      isPep: false,
      velocity: 5,
      sanctionsList: false,
      amount: 50000,
    };

    const result = evaluateKycV2(input);

    expect(result.decision).toBe('approve');
    expect(result.reasons).toBeInstanceOf(Array);
  });
});

