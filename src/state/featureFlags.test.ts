import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeatureFlags } from './featureFlags';

describe('featureFlags', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.removeItem('feature-flags-storage');
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.removeItem('feature-flags-storage');
  });

  it('should have default values', () => {
    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current.kycVersion).toBe('v1');
    expect(result.current.showComponentOutlines).toBe(false);
  });

  it('should set kycVersion', () => {
    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current.kycVersion).toBe('v1');

    act(() => {
      result.current.setKycVersion('v2');
    });

    expect(result.current.kycVersion).toBe('v2');
  });


  it('should set showComponentOutlines', () => {
    const { result } = renderHook(() => useFeatureFlags());

    act(() => {
      result.current.setShowComponentOutlines(true);
    });

    expect(result.current.showComponentOutlines).toBe(true);
  });

  it('should persist values to localStorage', () => {
    const { result } = renderHook(() => useFeatureFlags());

    act(() => {
      result.current.setKycVersion('v2');
      result.current.setShowComponentOutlines(true);
    });

    const stored = localStorage.getItem('feature-flags-storage');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.state.kycVersion).toBe('v2');
    expect(parsed.state.showComponentOutlines).toBe(true);
  });

  it('should restore values from localStorage', () => {
    // Set initial values
    const initialData = {
      state: {
        kycVersion: 'v2',
        showComponentOutlines: true,
      },
      version: 0,
    };
    localStorage.setItem('feature-flags-storage', JSON.stringify(initialData));

    const { result } = renderHook(() => useFeatureFlags());

    expect(result.current.kycVersion).toBe('v2');
    expect(result.current.showComponentOutlines).toBe(true);
  });

  it('should update multiple values independently', () => {
    // Clear localStorage to ensure clean state
    localStorage.removeItem('feature-flags-storage');
    const { result, unmount } = renderHook(() => useFeatureFlags());

    // Get initial values
    const initialKycVersion = result.current.kycVersion;
    const initialShowComponentOutlines = result.current.showComponentOutlines;

    // Change showComponentOutlines first to test independence
    act(() => {
      result.current.setShowComponentOutlines(true);
    });

    expect(result.current.showComponentOutlines).toBe(true);
    expect(result.current.kycVersion).toBe(initialKycVersion); // Should remain unchanged

    act(() => {
      result.current.setKycVersion('v2');
    });

    expect(result.current.kycVersion).toBe('v2');
    expect(result.current.showComponentOutlines).toBe(true); // Should remain unchanged
    
    unmount();
  });

  it('should handle toggle of boolean values', () => {
    // Clear localStorage to ensure clean state - do it before creating hook
    localStorage.removeItem('feature-flags-storage');
    const { result, unmount } = renderHook(() => useFeatureFlags());

    // Get initial value
    const initialValue = result.current.showComponentOutlines;

    // Toggle to opposite value
    act(() => {
      result.current.setShowComponentOutlines(!initialValue);
    });

    expect(result.current.showComponentOutlines).toBe(!initialValue);

    // Toggle back
    act(() => {
      result.current.setShowComponentOutlines(initialValue);
    });

    expect(result.current.showComponentOutlines).toBe(initialValue);
    
    unmount();
  });
});

