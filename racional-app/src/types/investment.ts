// Types for Firestore investment evolution data structure

export interface InvestmentDataPoint {
  date: string; // ISO timestamp
  contributions: number;
  dailyReturn: number;
  portfolioIndex: number;
  portfolioValue: number;
}

export interface FirestoreInvestmentDocument {
  name: string;
  fields: {
    array: {
      arrayValue: {
        values: Array<{
          mapValue: {
            fields: {
              date: { timestampValue: string };
              contributions: { integerValue: string } | { doubleValue: number };
              dailyReturn: { integerValue: string } | { doubleValue: number };
              portfolioIndex: { integerValue: string } | { doubleValue: number };
              portfolioValue: { integerValue: string } | { doubleValue: number };
            };
          };
        }>;
      };
    };
  };
  createTime: string;
  updateTime: string;
}

export interface InvestmentMetrics {
  totalPortfolioValue: number;
  totalContributions: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  dailyReturn: number;
  portfolioIndex: number;
  lastUpdateDate: string;
}

export interface ChartDataPoint {
  date: string;
  portfolioValue: number;
  contributions: number;
  gains: number;
}
