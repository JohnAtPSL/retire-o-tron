import { Injectable } from '@angular/core';
import { ParameterDefinition, ParameterType, ParameterFormat } from '../models/parameter.model';

@Injectable({
    providedIn: 'root'
})
export class ParameterRegistryService {
    private parameters: ParameterDefinition[] = [
        // Basics Group
        {
            id: 'age',
            label: 'Age',
            type: ParameterType.NUMBER,
            group: 'Basics',
            defaultValue: 50,
            min: 18,
            max: 100,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'retired',
            label: 'Retirement Age',
            type: ParameterType.NUMBER,
            group: 'Basics',
            defaultValue: 65,
            min: 18,
            max: 100,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'currentPortfolio',
            label: 'Current Portfolio',
            type: ParameterType.NUMBER,
            group: 'Finance',
            format: ParameterFormat.CURRENCY,
            defaultValue: 1000000,
            min: 0,
            max: 100000000,
            step: 100,
            helpText: 'blarrg!!!'
        },
        // Finance Group
        // {
        //   id: 'portfolio',
        //   label: 'Portfolio Type',
        //   type: ParameterType.DROPDOWN,
        //   group: 'Finance',
        //   defaultValue: '401k',
        //   dropdownOptions: [
        //     { label: '401(k)', value: '401k' },
        //     { label: 'IRA', value: 'ira' },
        //     { label: 'Both', value: 'both' }
        //   ]
        // },

        {
            id: 'coreExpenses',
            label: 'Core Expenses',
            type: ParameterType.NUMBER,
            group: 'Expenses',
            format: ParameterFormat.CURRENCY,
            defaultValue: 4000,
            min: 0,
            max: 50000,
            step: 1000,
            helpText: 'blarrg!!!'
        },
        {
            id: 'flexExpenses',
            label: 'Flex Expenses',
            type: ParameterType.NUMBER,
            group: 'Expenses',
            format: ParameterFormat.CURRENCY,
            defaultValue: 4000,
            min: 0,
            max: 500000,
            step: 1000,
            helpText: 'blarrg!!!'
        },
        {
            id: 'healthInsurance',
            label: 'Health Insurance',
            type: ParameterType.NUMBER,
            group: 'Expenses',
            format: ParameterFormat.CURRENCY,
            defaultValue: 500,
            min: 0,
            max: 100000,
            step: 1000,
            helpText: 'blarrg!!!'
        },
        {
            id: 'capitalEvent1',
            label: 'Capital Event 1',
            type: ParameterType.NUMBER,
            group: 'Capital Events',
            format: ParameterFormat.CURRENCY,
            defaultValue: 0,
            min: -10000000,
            max: 10000000,
            step: 1000,
            helpText: 'blarrg!!!'
        },
        {
            id: 'semiRetiredIncome',
            label: 'Semi Retired Income',
            type: ParameterType.NUMBER,
            group: 'Semi Retirement',
            format: ParameterFormat.CURRENCY,
            defaultValue: 0,
            min: -10000000,
            max: 10000000,
            helpText: 'blarrg!!!'
        },
        {
            id: 'socialSecurityAmount',
            label: 'Social Security Amount',
            type: ParameterType.NUMBER,
            group: 'Fixed Benefit',
            format: ParameterFormat.CURRENCY,
            defaultValue: 24000,
            min: 0,
            max: 100000,
            step: 100,
            helpText: 'blarrg!!!'
        },
        {
            id: 'socialSecurityAge',
            label: 'Social Security Age',
            type: ParameterType.NUMBER,
            group: 'Fixed Benefit',
            defaultValue: 70,
            min: 62,
            max: 70,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'pensionAmount',
            label: 'Pension Amount',
            type: ParameterType.NUMBER,
            group: 'Fixed Benefit',
            format: ParameterFormat.CURRENCY,
            defaultValue: 0,
            min: 0,
            max: 100000,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'pensionAge',
            label: 'Pension Age',
            type: ParameterType.NUMBER,
            group: 'Fixed Benefit',
            defaultValue: 60,
            min: 50,
            max: 70,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'rateOfReturn',
            label: 'Rate of Return',
            type: ParameterType.NUMBER,
            group: 'Rates',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: 0.06,
            min: 0,
            max: 0.20,
            step: 0.001,
            helpText: 'blarrg!!!'
        },
        {
            id: 'retirementRateOfReturn',
            label: 'Retirement Rate of Return',
            type: ParameterType.NUMBER,
            group: 'Rates',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: 0.05,
            min: 0,
            max: 0.20,
            step: 0.001,
            helpText: 'blarrg!!!'
        },
        {
            id: 'inflation',
            label: 'Inflation',
            type: ParameterType.NUMBER,
            group: 'Rates',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: 0.0325,
            min: 0,
            max: 0.20,
            step: 0.0001,
            helpText: 'blarrg!!!'
        },
        {
            id: 'cola',
            label: 'COLA',
            type: ParameterType.NUMBER,
            group: 'Rates',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: 0.025,
            min: 0,
            max: 0.05,
            step: 0.0001,
            helpText: 'blarrg!!!'
        },
        {
            id: 'taxRate',
            label: 'Tax Rate',
            type: ParameterType.NUMBER,
            group: 'Rates',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: 0.11,
            min: 0,
            max: 0.60,
            step: 0.0001,
            helpText: 'blarrg!!!'
        },
        {
            id: 'capitalEvent1Age',
            label: 'Capital Event 1 Age',
            type: ParameterType.NUMBER,
            group: 'Capital Events',
            defaultValue: 65,
            min: 18,
            max: 100,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'capitalEvent2',
            label: 'Capital Event 2',
            type: ParameterType.NUMBER,
            group: 'Capital Events',
            format: ParameterFormat.CURRENCY,
            defaultValue: 0,
            min: -10000000,
            max: 10000000,
            step: 1000,
            helpText: 'blarrg!!!'
        },
        {
            id: 'capitalEvent2Age',
            label: 'Capital Event 2 Age',
            type: ParameterType.NUMBER,
            group: 'Capital Events',
            defaultValue: 65,
            min: 18,
            max: 100,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'capitalEvent3',
            label: 'Capital Event 3',
            type: ParameterType.NUMBER,
            group: 'Capital Events',
            format: ParameterFormat.CURRENCY,
            defaultValue: 0,
            min: -10000000,
            max: 10000000,
            step: 1000,
            helpText: 'blarrg!!!'
        },
        {
            id: 'capitalEvent3Age',
            label: 'Capital Event 3 Age',
            type: ParameterType.NUMBER,
            group: 'Capital Events',
            defaultValue: 65,
            min: 18,
            max: 100,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'semiRetirementDuration',
            label: 'Semi Retirement Duration',
            type: ParameterType.NUMBER,
            group: 'Semi Retirement',
            defaultValue: 0,
            min: 0,
            max: 50,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'yearlySpendingReduction',
            label: 'Yearly Spending Reduction',
            type: ParameterType.NUMBER,
            group: 'Rates',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: .01,
            min: 0,
            max: 0.99,
            step: 0.001,
            helpText: 'blarrg!!!'
        },
        {
            id: 'bullRate',
            label: 'Bull Market ROR',
            type: ParameterType.NUMBER,
            group: 'Rates',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: .095,
            min: 0,
            max: 0.99,
            step: 0.001,
            helpText: 'blarrg!!!'
        },
        {
            id: 'bearRate',
            label: 'Bear Market ROR',
            type: ParameterType.NUMBER,
            group: 'Rates',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: -.020,
            min: -0.99,
            max: 0.99,
            step: 0.001,
            helpText: 'blarrg!!!'
        },
        {
            id: 'longevityAge',
            label: 'Longevity Age',
            type: ParameterType.NUMBER,
            group: 'Basics',
            defaultValue: 88,
            min: 18,
            max: 120,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'currentSavingsRate',
            label: 'Current Yearly Savings',
            type: ParameterType.NUMBER,
            group: 'Finance',
            format: ParameterFormat.CURRENCY,
            defaultValue: 20000,
            min: 0,
            max: 10000000,
            step: 1,
            helpText: 'blarrg!!!'
        },
        {
            id: 'targetWithdrawalRate',
            label: 'Target Withdrawal Rate',
            type: ParameterType.NUMBER,
            group: 'Modeling',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: 0.04,
            min: 0,
            max: 0.20,
            step: 0.001,
            helpText: 'blarrg!!!'
        },
        {
            id: 'upperBound',
            label: 'Upper Bound',
            type: ParameterType.NUMBER,
            group: 'Modeling',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: 1.20,
            min: 0,
            max: 2.0,
            step: 0.01,
            helpText: 'blarrg!!!'
        },
        {
            id: 'lowerBound',
            label: 'Lower Bound',
            type: ParameterType.NUMBER,
            group: 'Modeling',
            format: ParameterFormat.PERCENTAGE,
            defaultValue: 0.80,
            min: 0,
            max: 2.0,
            step: 0.01,
            helpText: 'blarrg!!!'
        },
        {
            id: 'applyGuardrails',
            label: 'Apply Guardrails',
            type: ParameterType.BOOLEAN,
            group: 'Modeling',
            defaultValue: true,
            helpText: 'blarrg!!!'
        },
    ];

    getParameters(): ParameterDefinition[] {
        return this.parameters;
    }

    getParameterById(id: string): ParameterDefinition | undefined {
        return this.parameters.find(p => p.id === id);
    }

    getGroups(): string[] {
        return [...new Set(this.parameters.map(p => p.group))];
    }

    getParametersByGroup(group: string): ParameterDefinition[] {
        return this.parameters.filter(p => p.group === group && p!.hidden != true);
    }
}
