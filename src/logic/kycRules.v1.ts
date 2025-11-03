export type KycDecision = 'approve' | 'manual_review' | 'deny';

// Base input fields for v1 (without discriminator)
export interface KycInputBase {
  riskScore: number;
  country: string;
  amount?: number;
}

// Discriminated union type for v1
export interface KycInput extends KycInputBase {
  version: 'v1';
}

export interface KycResult {
  decision: KycDecision;
  reasons: string[];
}

/**
 * KYC Rules v1 - Simple rule-based evaluation
 * - riskScore >= 80 => deny
 * - riskScore 50-79 => manual_review
 * - Certain countries => deny
 */
export function evaluateKycV1(input: KycInput): KycResult {
  const reasons: string[] = [];
  let decision: KycDecision = 'approve';

  // High risk score threshold
  if (input.riskScore >= 80) {
    decision = 'deny';
    reasons.push('Risk score 80+');
    return { decision, reasons };
  }

  // Medium risk score threshold
  if (input.riskScore >= 50 && input.riskScore < 80) {
    decision = 'manual_review';
    reasons.push('Risk score 50-79');
  }

  // Country-based restrictions
  const restrictedCountries = ['XX', 'YY', 'ZZ']; // Placeholder countries
  if (restrictedCountries.includes(input.country)) {
    decision = 'deny';
    reasons.push(`Restricted country: ${input.country}`);
    return { decision, reasons };
  }

  if (decision === 'approve' && input.riskScore < 50) {
    reasons.push('Low risk score');
  }

  return { decision, reasons };
}

