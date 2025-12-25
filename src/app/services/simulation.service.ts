import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { SimulationColumn } from '../models/simulation-column.model';
import { SimulationResult } from '../models/simulation-result.model';
import { ParameterMap } from '../models/parameter.model';

@Injectable({
    providedIn: 'root'
})
export class SimulationService {
    /**
     * Converts parameter array to typed object with full IntelliSense support
     */
    private mapParameters(column: SimulationColumn): ParameterMap {
        const params: any = {};
        column.parameters.forEach(p => {
            params[p.parameterId] = p.value;
        });
        return params as ParameterMap;
    }

    /**
     * Runs a simulation for a given column configuration
     * This is a placeholder - replace with your actual simulation logic
     */
    runSimulation(column: SimulationColumn): Observable<SimulationResult> {
        const params = this.mapParameters(column);

        const portfolioValue = this.performLinearAnalysis(params);

        const result: SimulationResult = {
            columnId: column.id,
            result1: portfolioValue,
            result2: 0.0
        };

        // Simulate 1-2 second delay
        return of(result);
    }

    /**
     * Runs simulations for all columns in parallel
     */
    runAllSimulations(columns: SimulationColumn[]): Observable<SimulationResult[]> {
        // This will be implemented to run simulations in parallel
        // Placeholder for now
        return of([]);
    }

    performLinearAnalysis(params: ParameterMap) {

        const age = params.age;
        const netWorth = params.currentPortfolio;
        const targetAge = params.longevityAge;
        const workingROR = params.rateOfReturn;
        const retiredROR = params.retirementRateOfReturn;
        const retirementAge = params.retired;

        const retirementDuration = targetAge - age;

        let workingNetWorth = netWorth;

        for (let y = 0; y < retirementDuration + 1; y++) {

            // doing this here becuse for monteCarlo we'll calculate the path and push that in as the ROR
            const ror = age + y >= retirementAge ? retiredROR : workingROR;
            const result = this.calculateValueForYear(y, params, workingNetWorth, ror, []);
            workingNetWorth = result.result;

        }

        return workingNetWorth;

        /*
        if(scenarioSheet.getRange(5, c).getValue() == '') return;
    
        const params = scenarioSheet.getRange(6, c, 30).getValues().flat();
    
    
        // core data we need to get started
        const age = params[0];
        let netWorth = params[CFG.Current_Capital];
        const targetAge = params[CFG.Longevity_Age];
        const workingROR = params[CFG.Rate_of_Return];
        const retiredROR = params[CFG.Rate_of_Return_Retired];
        const retirementAge = params[CFG.Retirement_Age];
        
        scenarioSheet.getRange(CFG.linearAnalysisStart, c, 150).clear();
        
    
        const retirementDuration = targetAge - age;
    
        for(let y = 0; y < retirementDuration+1; y++) {
    
          // doing this here becuse for monteCarlo we'll calculate the path and push that in as the ROR
          const ror = age + y >= retirementAge ? retiredROR : workingROR;
          params.push(ror);
    
          const result =  calculateValueForYear(y, params, netWorth, null);
          netWorth = result.result;
    
    
          scenarioSheet.getRange(CFG.linearAnalysisStart + y, c).setValue(netWorth);
          scenarioSheet.getRange(CFG.linearAnalysisStart + y, c).setNote(result.comment);
          scenarioSheet.getRange(CFG.linearAnalysisStart + y, 1).setValue(age + y);
    
        }
    
        scenarioSheet.getRange(CFG.terminalAmount, c).setValue(netWorth);
    
        */


    }

    calculateValueForYear(year: number, params: ParameterMap, currentNetWorth: number, currentRoR: number, path?: []): { result: number, comment: string } {


        const startValue = currentNetWorth;
        const ror = currentRoR;
        const capEventOneAge = params.capitalEvent1Age;
        const capEventOneAmt = params.capitalEvent1;
        const capEventTwoAge = params.capitalEvent2Age;
        const capEventTwoAmt = params.capitalEvent2;
        const currentSavings = params.currentSavingsRate;
        const age = params.age;
        const retirementAge = params.retired;
        const semiRetiredDuration = params.semiRetirementDuration;
        const semiRetiredIncome = params.semiRetiredIncome;
        const socialSecurity = params.socialSecurityAmount;
        const ssAge = params.socialSecurityAge;
        const cola = params.cola;
        const healthCare = params.healthInsurance;
        const inflation = params.inflation;
        const taxRate = params.taxRate;
        let coreExpenses = params.coreExpenses * 12;
        let flexExpenses = params.flexExpenses * 12;
        const yearlyReduction = params.yearlySpendingReduction;
        const lowerBound = params.lowerBound;
        const upperBound = params.upperBound;
        const widthdrawalTarget = params.targetWithdrawalRate;

        // CAPITAL EVENTS
        if (year + age == capEventOneAge) currentNetWorth += capEventOneAmt;
        if (year + age == capEventTwoAge) currentNetWorth += capEventTwoAmt;

        // PRE-RETIREMENT SAVINGS
        if (year + age < retirementAge) currentNetWorth += currentSavings;

        // POST-RETIREMENT WORK / INCOME
        if ((year + age >= retirementAge) && (year + age <= retirementAge + semiRetiredDuration)) currentNetWorth += semiRetiredIncome;

        // SOCIAL SECURITY -- TODO: PARAMETERIZE AGE
        const ssPayment = year + age >= ssAge ? ((1 + cola) ** year) * socialSecurity : 0;

        // HEALTHCARE
        const healthcare = year + age < 65 && year + age >= retirementAge ? (((1 + inflation) ** year) * healthCare) : 0;

        let expenses = 0;

        if (year + age >= retirementAge) {

            if (path != null && path[year] < -.01) {
                flexExpenses *= .75;
            }

            flexExpenses *= (1 - yearlyReduction) ** (year - (retirementAge - age)) * (1 + inflation) ** year;
            coreExpenses *= (1 + inflation) ** year;

            if (((flexExpenses + coreExpenses) / currentNetWorth) > widthdrawalTarget * upperBound) {

                flexExpenses *= .8;

            } else if (((flexExpenses + coreExpenses) / currentNetWorth) < widthdrawalTarget * lowerBound) {

                flexExpenses *= 1.10;
            }

            expenses = coreExpenses + flexExpenses;

        }

        const widthdrawal = (ssPayment - healthcare - expenses) * (1 + taxRate);
        currentNetWorth += widthdrawal;

        const comment = `starting value: \$${Math.round(startValue)} \nwidthdrawal: ${widthdrawal}\nhealth: ${healthcare}\n ss: ${ssPayment}\nexpenses: ${expenses}\nending value: ${currentNetWorth}`;

        let result = currentNetWorth * (1 + ror);
        return { result: result, comment: comment };


        return { result: 0, comment: "" };

    }

}
