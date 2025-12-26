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

    private readonly CFG = {
        initialRegime: "bull",
        // Regime model parameters (example values; adjust)
        bull: { mu: 0.09, sigma: 0.15 },
        bear: { mu: 0.01, sigma: 0.22 },

        // Markov transition probabilities
        // pBB: P(bull next year | bull this year)
        // pRR: P(bear next year | bear this year)
        pBB: 0.88,
        pRR: 0.70,

        // Optional: clamp extreme returns (helps avoid nonsensical blow-ups)
        clamp: { min: -0.60, max: 0.80 } // -60% to +80%
    }

    /**
     * Runs a simulation for a given column configuration
     * This is a placeholder - replace with your actual simulation logic
     */
    runSimulation(column: SimulationColumn): Observable<SimulationResult> {
        const params = this.mapParameters(column);

        const portfolioValue = this.performLinearAnalysis(params);

        this.CFG.initialRegime = Math.random() < 0.5 ? 'bull' : 'bear';

        console.log(`analysis for ${column.name}`);
        const success = this.performMonteCarloAnalysis(params);

        const result: SimulationResult = {
            columnId: column.id,
            result1: portfolioValue,
            result2: success
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


    performMonteCarloAnalysis(params: ParameterMap): number {

        let result = 0.0;
        const iterations = 1000;
        const results = [];

        const age = params.age;
        const netWorth = params.currentPortfolio;
        const targetAge = params.longevityAge;

        const retirementDuration = targetAge - age;

        const mcStartingValue = params.currentPortfolio;

        let fail = 0;

        for (let i = 0; i < iterations; i++) {

            this.CFG.initialRegime = 'bull';
            const path = this.generateRegimeSwitchingReturns(retirementDuration);
            let netWorth = mcStartingValue;
            for (let y = 0; y < retirementDuration; y++) {

                netWorth = this.calculateValueForYear(y, params, netWorth, path).result;
                
            }

            if (netWorth < 0) fail++;
            results.push(netWorth);

        }
        result = (iterations-fail)/iterations;

        return result * 100;

    }

    performLinearAnalysis(params: ParameterMap) {

        const age = params.age;
        const netWorth = params.currentPortfolio;
        const targetAge = params.longevityAge;
        const workingROR = params.rateOfReturn;
        const retiredROR = params.retirementRateOfReturn;
        const retirementAge = params.retired;

        const retirementDuration = targetAge - age;

        const path: number[] = [];

        let workingNetWorth = netWorth;
        for (let y = 0; y < retirementDuration + 1; y++) {
            const result = this.calculateValueForYear(y, params, workingNetWorth, path);
            workingNetWorth = result.result;
        }

        return workingNetWorth;

    }

    calculateValueForYear(year: number, params: ParameterMap, currentNetWorth: number, path: number[]): 
        { result: number, comment: string } {

        const age = params.age;
        const retirementAge = params.retired;
        let ror = 0;

        if(path.length > 0) {
          ror = path[year];
        } else {
          ror = age + year < retirementAge ? params.rateOfReturn : params.retirementRateOfReturn;
        }
        
        const startValue = currentNetWorth;
        const capEventOneAge = params.capitalEvent1Age;
        const capEventOneAmt = params.capitalEvent1;
        const capEventTwoAge = params.capitalEvent2Age;
        const capEventTwoAmt = params.capitalEvent2;
        const currentSavings = params.currentSavingsRate;
        
        const semiRetiredDuration = params.semiRetirementDuration;
        const semiRetiredIncome = params.semiRetiredIncome;

        const socialSecurity = params.socialSecurityAmount;
        const ssAge = params.socialSecurityAge;

        const cola = params.cola;
        const healthCare = params.healthInsurance * 12;
        const inflation = params.inflation;
        const taxRate = params.taxRate;

        let coreExpenses = params.coreExpenses * 12;
        let flexExpenses = params.flexExpenses * 12;

        const yearlyReduction = params.yearlySpendingReduction;
        const lowerBound = params.lowerBound;
        const upperBound = params.upperBound;
        const widthdrawalTarget = params.targetWithdrawalRate;

        // CAPITAL EVENTS
        if (year + age == capEventOneAge) currentNetWorth += (capEventOneAmt * (1 + inflation) ** year);
        if (year + age == capEventTwoAge) currentNetWorth += (capEventTwoAmt * (1 + inflation) ** year);

        // PRE-RETIREMENT SAVINGS
        if (year + age < retirementAge) currentNetWorth += (currentSavings * (1 + inflation) ** year);

        // POST-RETIREMENT WORK / INCOME
        if ((year + age >= retirementAge) && (year + age <= retirementAge + semiRetiredDuration)) currentNetWorth += (semiRetiredIncome * (1 + inflation) ** year);

        // SOCIAL SECURITY -- TODO: PARAMETERIZE AGE
        const ssPayment = year + age >= ssAge ? ((1 + cola) ** year) * socialSecurity : 0;

        // HEALTHCARE
        const healthcare = year + age < 65 && year + age >= retirementAge ? (((1 + inflation) ** year) * healthCare) : 0;

        let expenses = 0;

        if (year + age >= retirementAge) {

            flexExpenses *= (1 - yearlyReduction) ** (year - (retirementAge - age)) * (1 + inflation) ** year;
            coreExpenses *= (1 + inflation) ** year;

            if(path.length > 0) {

           
            if (path[year] < -.01) {
                flexExpenses *= .75;
            }

            if (((flexExpenses + coreExpenses) / currentNetWorth) > widthdrawalTarget * upperBound) {

                flexExpenses *= .8;

            } else if (((flexExpenses + coreExpenses) / currentNetWorth) < widthdrawalTarget * lowerBound) {

                flexExpenses *= 1.10;

            } 
        }

        } 
        
        expenses = coreExpenses + flexExpenses;

        const widthdrawal = (ssPayment - healthcare - expenses) * (1 + taxRate);

        const c2 = `${year + age}: ${widthdrawal} from ${currentNetWorth} with ror: ${ror} -> ${currentNetWorth * (1+ror)}`;
        
        currentNetWorth += widthdrawal;
        let result = currentNetWorth * (1 + ror);
        const comment = `for year ${year} at ${age}: starting value: \$${Math.round(startValue)} widthdrawal: ${widthdrawal}health: ${healthcare} ss: ${ssPayment}expenses: ${expenses}ending value: ${currentNetWorth}`;

        if(path.length == 0) {
            console.log(comment);
        }
        
        return { result: result, comment: comment };

    }

    generateRegimeSwitchingReturns(years: number) {
        const out = new Array(years);
        let regime = this.CFG.initialRegime; // 'bull' or 'bear'

        for (let t = 0; t < years; t++) {
            // draw return based on current regime
            const params = (regime === 'bull') ? this.CFG.bull : this.CFG.bear;
            let r = this.drawLogNormalReturn(params.mu, params.sigma);

            // optional clamp
            if (this.CFG.clamp) {
                r = Math.max(this.CFG.clamp.min, Math.min(this.CFG.clamp.max, r));
            }
            out[t] = r;

            // transition to next regime
            regime = this.nextRegime(regime);
        }

        return out;
    }

    /***********************
     * Markov transition
     ***********************/
    nextRegime(current: string) {
        const u = Math.random();
        if (current === 'bull') {
            return (u < this.CFG.pBB) ? 'bull' : 'bear';
        } else {
            return (u < this.CFG.pRR) ? 'bear' : 'bull';
        }
    }

    /***********************
     * Lognormal yearly return
     * r = exp(mu - 0.5*sigma^2 + sigma*Z) - 1
     * where Z ~ N(0,1)
     ***********************/
    drawLogNormalReturn(mu: number, sigma: number) {
        const z = this.randn_();
        return Math.exp(mu - 0.5 * sigma * sigma + sigma * z) - 1;
    }

    /***********************
     * Standard normal (Box-Muller)
     ***********************/
    randn_() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }


}
