import { useFeatureFlags } from '../state/featureFlags';

interface FeatureFlagsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Feature Flags Panel - Panel content for managing feature flags
 * Panel visibility and button are controlled by parent component
 */
export function FeatureFlagsPanel({ isOpen, onClose }: FeatureFlagsPanelProps) {
  const {
    view,
    setView,
    kycVersion,
    setKycVersion,
    showComponentOutlines,
    setShowComponentOutlines,
  } = useFeatureFlags();

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 right-0 w-max bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Feature Flags</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-3">
      {/* View Toggle */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
        <span className="text-sm font-semibold text-gray-700">Dashboard View:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setView('view1')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
              view === 'view1'
                ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            View 1
          </button>
          <button
            onClick={() => setView('view2')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
              view === 'view2'
                ? 'bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-300'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            View 2
          </button>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          view === 'view1' 
            ? 'bg-blue-100 text-blue-800 border border-blue-300' 
            : 'bg-purple-100 text-purple-800 border border-purple-300'
        }`}>
          Active: {view === 'view1' ? 'View 1' : 'View 2'}
        </div>
      </div>

      {/* KYC Engine Version Toggle */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
        <span className="text-sm font-semibold text-gray-700">KYC Engine Version:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setKycVersion('v1')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
              kycVersion === 'v1'
                ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            v1
          </button>
          <button
            onClick={() => setKycVersion('v2')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
              kycVersion === 'v2'
                ? 'bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-300'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            v2
          </button>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          kycVersion === 'v1' 
            ? 'bg-blue-100 text-blue-800 border border-blue-300' 
            : 'bg-purple-100 text-purple-800 border border-purple-300'
        }`}>
          Active: {kycVersion.toUpperCase()}
        </div>
        <span className="text-xs text-gray-500 ml-auto">
          (Toggle to see how logic changes affect decision)
        </span>
      </div>

      {/* Component Outlines Toggle */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
        <span className="text-sm font-semibold text-gray-700">Show Component Outlines:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            onClick={() => setShowComponentOutlines(!showComponentOutlines)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showComponentOutlines ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showComponentOutlines ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">
            {showComponentOutlines ? 'On' : 'Off'}
          </span>
        </label>
      </div>
      </div>
    </div>
  );
}

