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
            helpText: `This is how old you are right now.`
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
            helpText: `This is how old you will be when you want to retire`
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
            helpText: `This is the current value of your retirement savings (e.g. 401(k)s, IRAs, Taxable Brokerage Accounts, etc.)
            I generally don't include things like home equity or emergency savings, but if you're going to use those things
            to fund expenses in retirement, go crazy.`
        },
        {
            id: 'coreExpenses',
            label: 'Core Expenses',
            type: ParameterType.NUMBER,
            group: 'Expenses',
            format: ParameterFormat.CURRENCY,
            defaultValue: 25000,
            min: 0,
            max: 10000000,
            step: 1000,
            helpText: 'These are expenses that will <b>not</b> be adjusted based on market conditions.'
        },
        {
            id: 'flexExpenses',
            label: 'Flex Expenses',
            type: ParameterType.NUMBER,
            group: 'Expenses',
            format: ParameterFormat.CURRENCY,
            defaultValue: 25000,
            min: 0,
            max: 10000000,
            step: 1000,
            helpText: `These are expenses that <b>will be</b> adjusted based on market conditions.  
                        Based on the settings below in the Modeling section, flex expenses will be
                        adjusted downwards after years with negative returns or if you are widthdrawing more than your 
                        <i>Target Widthdrawal Rate</>.`
        },
        {
            id: 'healthInsurance',
            label: 'Health Insurance',
            type: ParameterType.NUMBER,
            group: 'Expenses',
            format: ParameterFormat.CURRENCY,
            defaultValue: 6000,
            min: 0,
            max: 100000,
            step: 1000,
            helpText: `This is the yearly dollar amount you will need to spend for health insurance if your Retirement
            Age is less than 65. This amount is added to your expenses for each year that you are retired before 65.  It 
            does not 'flex'.`
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
            helpText: `A <b>Capital Event</b> represents a big change to your financial circumstances.  
            Examples include selling a business or a house, or buying a house (in which case the value should be negative)
            or an inheritance or taking your 15 kids to DisneyLand (Universal Studios is way better tho).`
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
            helpText: `If you plan on working after you retire, 
                        perhaps being a yoga teacher has been calling to you for years?  Or you\'re finally going to start that Sweedish-Mexican Fusion Food Truck you've always dreamt about? 
                        Enter your yearly income from this adventure here.
                        </br></br></br>
                        (it is suuuuper weird to type 'dreamt', and apparently, according to the google, in the US 'dreamed' is more common, I don't buy it.)`
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
            helpText: `This is the amount you expect to receive from our friends in Washington.  You can look this up here: <a href='www.ssa.gov'>www.ssa.gov</a>.`
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
            helpText:  `This is the age that you will start taking Social Security payments, you can start as early as 62 and wait as long as 70.  If you 
            start at 62, you're going to get less than if you start at 70.  And you have to start at 70.  I'm not sure what happens if you don't cash the checks
            they start sending you at 70, but I've heard that two burly men in dark suits come to your house and force you to buy things on Amazon.`
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
            helpText: `Just kidding - pensions don't exist.  No, wait, I put this in for one person I know who will be getting a big old Teachers Pension.`
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
            helpText: `The age you will be when you start receiving your pension.  The assumption here is that once you start, you won't stop 'till you're dead.`
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
            helpText: `This is the <b>average</b> rate of return you expect over the course of your working years.  Generally it is a little higher than what you
            would expect to make in your retired years because when you are retired you'll likely be a bit more conservative.  This is a <b>nominal<b> rate of return
            which means that it does not take inflation into account.  It is used to perform the Linear Analysis.  If you select the <b>Nominal</b> toggle in the upper
            right hand corner, then the Linear Analysis will use this rate and increase your expenses, captial events and other items by the amount you specifiy in <b>Inflation</b>
            below.  If you select the <b>Real</b> toggle in the upper left, then we'll subtract the <b>Inflation</b> amount below from this rate and we won't inflate your expenses.`
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
            helpText: `This is the <b>average</b> rate of return you expect over the course of your retired years.  Generally it is a little lower than what you
            would expect to make in your working years because when you are retired you'll likely be a bit more conservative.  This is a <b>nominal<b> rate of return
            which means that it does not take inflation into account.  It is used to perform the Linear Analysis.  If you select the <b>Nominal</b> toggle in the upper
            right hand corner, then the Linear Analysis will use this rate and increase your expenses, captial events and other items by the amount you specifiy in <b>Inflation</b>
            below.  If you select the <b>Real</b> toggle in the upper left, then we'll subtract the <b>Inflation</b> amount below from this rate and we won't inflate your expenses.`
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
            helpText: ``
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
            helpText: ``
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
            helpText: ``
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
            helpText: ``
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
            helpText: ``
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
            helpText: ``
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
            helpText: ``
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
            helpText: ``
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
            helpText: ``
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
            helpText: `Generally, research shows that people reduce their retirement spending by about 1% per year, you can adjust this as you see fit.  If you want a constant rate of 
            spending that never decreases, just set it to Zero (0).`
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
            helpText: `For the Monte Carlo Analysis, this is the rate of return you expect in Bull Markets, which is when the market is performing well / going generally up.`
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
            helpText: `For the Monte Carlo Analysis, this is the rate of return you expect in Bear Markets, which is when the market is <b>not</b> performing well / going generally down.`
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
            helpText: `This is the age you plan to live to before the dark spectre of Death comes for you.`
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
            helpText: `This is how much you are socking a way for retirement every year, when <b>Nominal</b> is selected, it increases at the same rate as inflation.`
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
            helpText: `When you have <b>Apply Guardrails</b> turned on this value is used to determine if you need to flex your expenses down.  For example, if it is set
            at the default value of 4%, and your expenses in a given year are higher than 4% of your total portfolio, then the amount of your Flex Expenses will be reduced.  This
            only applies to the Monte Carlo Analysis.`
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
            helpText: `I haven't written the helpText for this one yet . . . stay tuned`
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
            helpText: `I haven't written the helpText for this one yet . . . stay tuned`
        },
        {
            id: 'applyGuardrails',
            label: 'Apply Guardrails',
            type: ParameterType.BOOLEAN,
            group: 'Modeling',
            defaultValue: true,
            helpText: `I haven't written the helpText for this one yet . . . stay tuned`
        },
        {
            id: 'secenarioName',
            label: 'Scenario Name',
            type: ParameterType.STRING,
            group: 'Basics',
            defaultValue: '',
            helpText: `This is the name of the scenario - e.g. 'Win PowerBall Jackpot Next Year', 'Marry into British Royalty (but not the poor kind)' or 'Die Penniless and Alone'`
        }
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
