"use client";

import { useInvestmentData, DatasetBounds } from "./use-investment-data";

/**
 * Hook to get dataset bounds without filtering
 * This is used to constrain date pickers to available data range
 */
export function useDatasetBounds(): {
  bounds: DatasetBounds | null;
  loading: boolean;
  error: string | null;
} {
  const { datasetBounds, loading, error } = useInvestmentData();

  return {
    bounds: datasetBounds,
    loading,
    error,
  };
}
