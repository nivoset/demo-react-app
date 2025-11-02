import type { KycDecision, KycInput, KycResult } from './kycRules.v1';

export interface KycInputV2 extends KycInput {
  isPep?: boolean; // Politically Exposed Person
  velocity?: number; // Number of transactions in last 24h
  sanctionsList?: boolean; // On sanctions list
}

/**
 * KYC Rules v2 - Enhanced rule-based evaluation
 * Adds PEP checks, amount thresholds, velocity thresholds, and sanctions list
 */
export function evaluateKycV2(input: KycInputV2): KycResult {
  const reasons: string[] = [];
  let decision: KycDecision = 'approve';

  // Sanctions list check - highest priority
  if (input.sanctionsList) {
    decision = 'deny';
    reasons.push('On sanctions list');
    return { decision, reasons };
  }

  // PEP check - requires manual review
  if (input.isPep) {
    decision = 'manual_review';
    reasons.push('PEP (Politically Exposed Person)');
  }

  // High risk score threshold (lowered for v2)
  if (input.riskScore >= 75) {
    decision = 'deny';
    reasons.push('Risk score 75+');
    return { decision, reasons };
  }

  // Medium risk score threshold
  if (input.riskScore >= 50 && input.riskScore < 75) {
    if (decision === 'approve') {
      decision = 'manual_review';
    }
    reasons.push('Risk score 50-74');
  }

  // Amount threshold check
  const amountThreshold = 100000;
  if (input.amount && input.amount > amountThreshold) {
    if (decision === 'approve') {
      decision = 'manual_review';
    }
    reasons.push(`Amount exceeds ${amountThreshold.toLocaleString()}`);
  }

  // Velocity threshold check
  const velocityThreshold = 10;
  if (input.velocity && input.velocity > velocityThreshold) {
    if (decision === 'approve') {
      decision = 'manual_review';
    }
    reasons.push(`High transaction velocity: ${input.velocity} in 24h`);
  }

  // Country-based restrictions (same as v1 but can be extended)
  const restrictedCountries = ['XX', 'YY', 'ZZ'];
  if (restrictedCountries.includes(input.country)) {
    decision = 'deny';
    reasons.push(`Restricted country: ${input.country}`);
    return { decision, reasons };
  }

  // Combined risk factors
  if (input.riskScore >= 60 && input.amount && input.amount > amountThreshold * 0.5) {
    if (decision === 'approve') {
      decision = 'manual_review';
    }
    if (!reasons.some(r => r.includes('Risk score') || r.includes('Amount'))) {
      reasons.push('Combined risk factors: medium risk score + high amount');
    }
  }

  if (decision === 'approve' && input.riskScore < 50 && !input.isPep) {
    reasons.push('Low risk profile');
  }

  return { decision, reasons };
}

