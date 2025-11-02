import { create } from 'zustand';

interface FeatureFlags {
  kycVersion: 'v1' | 'v2';
  setKycVersion: (version: 'v1' | 'v2') => void;
}

export const useFeatureFlags = create<FeatureFlags>((set) => ({
  kycVersion: 'v1',
  setKycVersion: (version) => set({ kycVersion: version }),
}));

