import { create } from 'zustand';

interface FeatureFlags {
  kycVersion: 'v1' | 'v2'; // Internal - controls which KYC rules to use
  view: 'view1' | 'view2'; // User-facing - controls which layout to show
  showComponentOutlines: boolean;
  setKycVersion: (version: 'v1' | 'v2') => void;
  setView: (view: 'view1' | 'view2') => void;
  setShowComponentOutlines: (show: boolean) => void;
}

export const useFeatureFlags = create<FeatureFlags>((set) => ({
  kycVersion: 'v1',
  view: 'view1',
  showComponentOutlines: false,
  setKycVersion: (version) => set({ kycVersion: version }),
  setView: (view) => set({ view }),
  setShowComponentOutlines: (show) => set({ showComponentOutlines: show }),
}));

