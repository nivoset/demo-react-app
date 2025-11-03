import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FeatureFlags {
  kycVersion: 'v1' | 'v2'; // Internal - controls which KYC rules to use
  showComponentOutlines: boolean;
  setKycVersion: (version: 'v1' | 'v2') => void;
  setShowComponentOutlines: (show: boolean) => void;
}

export const useFeatureFlags = create<FeatureFlags>()(
  persist(
    (set) => ({
      kycVersion: 'v1',
      showComponentOutlines: false,
      setKycVersion: (version) => set({ kycVersion: version }),
      setShowComponentOutlines: (show) => set({ showComponentOutlines: show }),
    }),
    {
      name: 'feature-flags-storage', // localStorage key
    }
  )
);

