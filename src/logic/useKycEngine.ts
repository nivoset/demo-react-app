import { useMemo } from 'react';
import { useFeatureFlags } from '../state/featureFlags';
import { evaluateKycV1, type KycInput as KycInputV1, type KycInputBase, type KycResult } from './kycRules.v1';
import { evaluateKycV2, type KycInputV2, type KycInputV2Base } from './kycRules.v2';

// Discriminated union type for all KYC inputs
export type KycInput = KycInputV1 | KycInputV2;

// Input type that callers provide (without version discriminator)
// The hook will automatically add the version based on feature flags
export type KycInputWithoutVersion = KycInputBase & Partial<KycInputV2Base>;

export interface UseKycEngine {
  evaluate: (input: KycInputWithoutVersion) => KycResult;
  version: 'v1' | 'v2';
}

/**
 * Custom hook that selects the appropriate KYC rule version based on feature flag
 * and exposes an evaluate method that uses the correct rules.
 * 
 * The hook automatically adds the version discriminator to the input based on
 * the current feature flag, allowing TypeScript to properly narrow the types.
 */
export function useKycEngine(): UseKycEngine {
  const { kycVersion } = useFeatureFlags();

  const evaluate = useMemo(() => {
    return (input: KycInputWithoutVersion): KycResult => {
      // Add version discriminator based on feature flag
      if (kycVersion === 'v2') {
        const inputWithVersion: KycInputV2 = {
          ...input,
          version: 'v2',
        };
        return evaluateKycV2(inputWithVersion);
      }
      
      const inputWithVersion: KycInputV1 = {
        ...input,
        version: 'v1',
      };
      return evaluateKycV1(inputWithVersion);
    };
  }, [kycVersion]);

  return {
    evaluate,
    version: kycVersion,
  };
}

