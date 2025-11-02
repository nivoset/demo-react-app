import type { KycDecision } from '../logic/kycRules.v1';

interface KycDecisionBadgeProps {
  decision: KycDecision;
}

/**
 * UI Component: Displays KYC decision with appropriate styling
 * This is a pure presentation component - no business logic
 */
export function KycDecisionBadge({ decision }: KycDecisionBadgeProps) {
  const getBadgeStyles = (decision: KycDecision) => {
    switch (decision) {
      case 'approve':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'manual_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'deny':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLabel = (decision: KycDecision) => {
    switch (decision) {
      case 'approve':
        return 'Approved';
      case 'manual_review':
        return 'Manual Review';
      case 'deny':
        return 'Denied';
      default:
        return 'Unknown';
    }
  };

  return (
    <span
      data-component="KycDecisionBadge"
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getBadgeStyles(
        decision
      )}`}
    >
      {getLabel(decision)}
    </span>
  );
}

