export enum ParameterType {
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DROPDOWN = 'dropdown'
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
  dropdownOptions?: DropdownOption[];
  min?: number;
  max?: number;
  step?: number;
}

export interface ParameterValue {
  parameterId: string;
  value: number | boolean | string;
}
