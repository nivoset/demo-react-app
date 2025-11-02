import { useMemo } from 'react';
import { useFeatureFlags } from '../state/featureFlags';
import { evaluateKycV1, type KycInput, type KycResult } from './kycRules.v1';
import { evaluateKycV2, type KycInputV2 } from './kycRules.v2';

export interface UseKycEngine {
  evaluate: (input: KycInput | KycInputV2) => KycResult;
  version: 'v1' | 'v2';
}

/**
 * Custom hook that selects the appropriate KYC rule version based on feature flag
 * and exposes an evaluate method that uses the correct rules.
 */
export function useKycEngine(): UseKycEngine {
  const { kycVersion } = useFeatureFlags();

  const evaluate = useMemo(() => {
    return (input: KycInput | KycInputV2): KycResult => {
      if (kycVersion === 'v2') {
        return evaluateKycV2(input as KycInputV2);
      }
      return evaluateKycV1(input);
    };
  }, [kycVersion]);

  return {
    evaluate,
    version: kycVersion,
  };
}

