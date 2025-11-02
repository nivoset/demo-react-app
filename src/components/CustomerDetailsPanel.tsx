import { KycDecisionBadge } from './KycDecisionBadge';
import type { KycResult } from '../logic/kycRules.v1';
import type { Customer } from '../legacy/LegacyCustomerSearch';

interface CustomerDetailsPanelProps {
  customer: Customer | null;
  kycResult: KycResult | null;
  kycVersion: 'v1' | 'v2';
  isProcessing?: boolean;
  onApprove?: () => void;
  onRequestDocs?: () => void;
  onHold?: () => void;
}

/**
 * UI Component: Displays customer details and KYC decision with action buttons
 * Pure presentation component - all business logic handled at page level
 */
export function CustomerDetailsPanel({
  customer,
  kycResult,
  kycVersion,
  isProcessing = false,
  onApprove,
  onRequestDocs,
  onHold,
}: CustomerDetailsPanelProps) {
  if (!customer) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-500">KYC Decision</h3>
        <p className="text-gray-400">Select a customer to view KYC decision</p>
      </div>
    );
  }

  // Visual styling based on KYC version
  const versionStyles = kycVersion === 'v1' 
    ? 'bg-blue-50 border-blue-300' 
    : 'bg-purple-50 border-purple-300';

  return (
    <div 
      className={`p-6 rounded-lg border-2 transition-colors ${versionStyles}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">KYC Decision</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          kycVersion === 'v1' 
            ? 'bg-blue-600 text-white' 
            : 'bg-purple-600 text-white'
        }`}>
          {kycVersion.toUpperCase()}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">{customer.name}</span>
            {kycResult && <KycDecisionBadge decision={kycResult.decision} />}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>ID {customer.id}</div>
            <div>Risk Score {customer.riskScore}</div>
            <div>Country {customer.country}</div>
          </div>
        </div>

        {kycResult && kycResult.reasons.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Reasons</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {kycResult.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onApprove}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Approve
            </button>
            <button
              onClick={onRequestDocs}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Request Docs
            </button>
            <button
              onClick={onHold}
              disabled={isProcessing}
              className="col-span-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Hold
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

