"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FirestoreInvestmentDocument,
  InvestmentDataPoint,
  InvestmentMetrics,
  ChartDataPoint,
} from "@/types/investment";
import { DateRange } from "react-day-picker";

export interface DatasetBounds {
  minDate: Date;
  maxDate: Date;
  totalDataPoints: number;
}

const FIRESTORE_URL =
  "https://firestore.googleapis.com/v1/projects/racional-exam/databases/(default)/documents/investmentEvolutions/user1?key=AIzaSyArGiRgGd2MfE65_9sjE2QX49gt1sP0GmA";

// Helper function to parse Firestore values
function parseFirestoreValue(value: any): number {
  if (value.integerValue !== undefined) {
    return parseInt(value.integerValue, 10);
  }
  if (value.doubleValue !== undefined) {
    return value.doubleValue;
  }
  return 0;
}

// Transform Firestore document to typed data
function transformFirestoreData(doc: FirestoreInvestmentDocument): InvestmentDataPoint[] {
  return doc.fields.array.arrayValue.values.map((item) => {
    const fields = item.mapValue.fields;
    return {
      date: fields.date.timestampValue,
      contributions: parseFirestoreValue(fields.contributions),
      dailyReturn: parseFirestoreValue(fields.dailyReturn),
      portfolioIndex: parseFirestoreValue(fields.portfolioIndex),
      portfolioValue: parseFirestoreValue(fields.portfolioValue),
    };
  });
}

// Calculate investment metrics from data points
function calculateMetrics(data: InvestmentDataPoint[]): InvestmentMetrics {
  if (data.length === 0) {
    return {
      totalPortfolioValue: 0,
      totalContributions: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      dailyReturn: 0,
      portfolioIndex: 0,
      lastUpdateDate: "",
    };
  }

  const latestData = data[data.length - 1];
  const totalGainLoss = latestData.portfolioValue - latestData.contributions;
  const totalGainLossPercentage = latestData.contributions > 0 ? (totalGainLoss / latestData.contributions) * 100 : 0;

  return {
    totalPortfolioValue: latestData.portfolioValue,
    totalContributions: latestData.contributions,
    totalGainLoss,
    totalGainLossPercentage,
    dailyReturn: latestData.dailyReturn,
    portfolioIndex: latestData.portfolioIndex,
    lastUpdateDate: latestData.date,
  };
}

// Transform data for chart visualization
function transformToChartData(data: InvestmentDataPoint[]): ChartDataPoint[] {
  return data.map((point) => ({
    date: new Date(point.date).toISOString().split("T")[0], // Format as YYYY-MM-DD
    portfolioValue: point.portfolioValue,
    contributions: point.contributions,
    gains: point.portfolioValue - point.contributions,
  }));
}

// Filter data by date range
function filterDataByDateRange(data: InvestmentDataPoint[], dateRange: DateRange | undefined): InvestmentDataPoint[] {
  if (!dateRange?.from || !dateRange?.to) {
    return data;
  }

  const startDate = new Date(dateRange.from);
  const endDate = new Date(dateRange.to);

  // Set time to ensure proper comparison
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return data.filter((point) => {
    const pointDate = new Date(point.date);
    return pointDate >= startDate && pointDate <= endDate;
  });
}

export function useInvestmentData(dateRange?: DateRange | undefined) {
  const [rawData, setRawData] = useState<InvestmentDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null);
  // Filtered data based on date range
  const filteredData = useMemo(() => {
    return filterDataByDateRange(rawData, dateRange);
  }, [rawData, dateRange]);

  // Metrics calculated from filtered data
  const metrics = useMemo(() => {
    if (filteredData.length === 0) return null;
    return calculateMetrics(filteredData);
  }, [filteredData]);

  // Chart data from filtered data
  const chartData = useMemo(() => {
    return transformToChartData(filteredData);
  }, [filteredData]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(FIRESTORE_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const firestoreDoc: FirestoreInvestmentDocument = await response.json();

        if (!isMounted) return;

        const investmentData = transformFirestoreData(firestoreDoc);
        setRawData(investmentData);
        setLastUpdateDate(firestoreDoc.updateTime);
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching investment data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const refetch = () => {
    setLoading(true);
    setError(null);
    // Re-trigger the useEffect by forcing a re-render
    window.location.reload();
  };

  // Dataset bounds for date range constraints
  const datasetBounds = useMemo((): DatasetBounds | null => {
    if (rawData.length === 0) return null;

    const dates = rawData.map((point) => new Date(point.date));
    return {
      minDate: new Date(Math.min(...dates.map((d) => d.getTime()))),
      maxDate: new Date(Math.max(...dates.map((d) => d.getTime()))),
      totalDataPoints: rawData.length,
    };
  }, [rawData]);

  return {
    data: filteredData,
    chartData,
    metrics,
    loading,
    error,
    refetch,
    updatedAt: lastUpdateDate,
    totalDataPoints: rawData.length,
    filteredDataPoints: filteredData.length,
    datasetBounds,
  };
}
