export enum ParameterType {
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DROPDOWN = 'dropdown'
}

export enum ParameterFormat {
  NUMBER = 'number',
  PERCENTAGE = 'percentage',
  CURRENCY = 'currency'
}

export interface DropdownOption {
  label: string;
  value: string | number;
}

export interface ParameterDefinition {
  id: string;
  label: string;
  type: ParameterType;
  group: string;
  defaultValue: number | boolean | string;
  format?: ParameterFormat;
  dropdownOptions?: DropdownOption[];
  min?: number;
  max?: number;
  step?: number;
}

export interface ParameterValue {
  parameterId: string;
  value: number | boolean | string;
}

// Type-safe parameter map - add all your parameter IDs here with their types
export interface ParameterMap {
  age: number;
  retired: number;
  currentPortfolio: number;
  rateOfReturn: number;
  retirementRateOfReturn: number;
  cola: number;
  taxRate: number;
  coreExpenses: number;
  flexExpenses: number;
  healthInsurance: number;
  capitalEvent1: number;
  capitalEvent1Age: number;
  capitalEvent2: number;
  capitalEvent2Age: number;
  capitalEvent3: number;
  capitalEvent3Age: number;
  semiRetiredIncome: number;
  semiRetirementDuration: number;
  yearlySpendingReduction: number;
  longevityAge: number;
  currentSavingsRate: number;
  socialSecurityAmount: number;
  socialSecurityAge: number;
  targetWithdrawalRate: number;
  upperBound: number;
  lowerBound: number;
  applyGuardrails: boolean;
  applySpendingReduction: boolean;
  inflation: number;
}
