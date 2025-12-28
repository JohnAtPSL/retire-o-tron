export interface YearlyData {
  year: number;
  value: number;
  growth: number;
  startValue: number;
  ssPayment: number;
  newSavings: number;
  coreExpense: number;
  flexExpense: number;
  healthCare: number;
  capitalEvent: number;
}

export interface SimulationResult {
  columnId: string;
  result1: number;
  result2: number;
  isCalculating?: boolean;
  error?: string;
  linearResult?: YearlyData[];
  mcResult?: MonteCarloResult;
  failYears?: number[];
}

export interface MonteCarloResult {
    success: number;
    details: { netWorth: number; failYear: number }[];
    mcStats: ({ mean: number; p10: number; p50: number; p90: number } | undefined)[];
    paths: number[][];
    failedPaths: number[][];
    succeededPaths: number[][];
}