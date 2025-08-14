"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { useDatasetBounds } from "./use-dataset-bounds";

export function useDateRangeUrl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bounds } = useDatasetBounds();

  // Get current values from URL
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  // Helper function to parse date string in local timezone
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // Parse individual dates from URL
  const fromDate: Date | undefined = useMemo(() => {
    if (startDate) {
      return parseLocalDate(startDate);
    }
    // Only default to dataset start if bounds exist and no URL params at all
    if (bounds && !endDate) {
      return bounds.minDate;
    }
    return undefined;
  }, [startDate, endDate, bounds]);

  const toDate: Date | undefined = useMemo(() => {
    if (endDate) {
      return parseLocalDate(endDate);
    }
    // Only default to dataset end if bounds exist and no URL params at all
    if (bounds && !startDate) {
      return bounds.maxDate;
    }
    return undefined;
  }, [endDate, startDate, bounds]);

  // Get effective date range
  const getEffectiveDateRange = useCallback((): DateRange | undefined => {
    if (fromDate && toDate) {
      return { from: fromDate, to: toDate };
    }
    return undefined;
  }, [fromDate, toDate]);

  // Helper function to format date for URL (in local timezone)
  const formatDateForUrl = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Update URL with start date
  const setStartDate = useCallback(
    (date: Date | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (date) {
        params.set("start", formatDateForUrl(date));
      } else {
        params.delete("start");
      }

      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Update URL with end date
  const setEndDate = useCallback(
    (date: Date | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (date) {
        params.set("end", formatDateForUrl(date));
      } else {
        params.delete("end");
      }

      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  // set search params to bounds if no params are set
  useEffect(() => {
    if (!startDate && !endDate && bounds) {
      router.push(`?start=${formatDateForUrl(bounds.minDate)}&end=${formatDateForUrl(bounds.maxDate)}`);
    }
  }, [startDate, endDate, bounds, router]);

  return {
    fromDate,
    toDate,
    setStartDate,
    setEndDate,
    dateRange: getEffectiveDateRange(),
    getEffectiveDateRange,
    datasetBounds: bounds,
  };
}
