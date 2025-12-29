import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { SimulationColumn } from '../models/simulation-column.model';
import { MonteCarloResult, SimulationResult, YearlyData } from '../models/simulation-result.model';
import { ParameterMap, regime } from '../models/parameter.model';

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
     */
    runSimulation(column: SimulationColumn, mode: "real" | "nominal"):
        Observable<SimulationResult> {

        const params = this.mapParameters(column);

        if (mode == 'real') {
            params.rateOfReturn -= params.inflation;
            params.retirementRateOfReturn -= params.inflation;
            params.bullRate = ((1 + params.bullRate) / (1 + params.inflation)) - 1;
            params.bearRate = ((1 + params.bearRate) / (1 + params.inflation)) - 1;
            params.cola = 0;
            params.inflation = 0;
        }

        console.log(JSON.stringify(params));

        const lowLinearRate = params.rateOfReturn - .01;
        const highLinearRate = params.rateOfReturn + .01;
        const lowRetRate = params.retirementRateOfReturn - .01;
        const highRetRate = params.retirementRateOfReturn + .01;

        const laResult = this.performLinearAnalysis(params);

        console.log("do low");
        params.rateOfReturn = lowLinearRate;
        params.retirementRateOfReturn = lowRetRate;
        const lowResult = this.performLinearAnalysis(params);

        console.log("do high");
        params.rateOfReturn = highLinearRate;
        params.retirementRateOfReturn = highRetRate;
        const highResult = this.performLinearAnalysis(params);


        const mcResult = this.performMonteCarloAnalysis(params);

        const result: SimulationResult = {
            columnId: column.id,
            result1: laResult.pop()?.value as number,
            result2: mcResult.success,
            linearResult: laResult,
            laHigh: highResult,
            laLow: lowResult,
            mcResult: mcResult,
            failYears: this.binFailYears(params.retired, params.longevityAge, mcResult)
        };

        return of(result);
    }

    binFailYears(retirementTarget: number, longevityAge: number, mcResults: MonteCarloResult): number[] {

        const duration = longevityAge - retirementTarget;
        const result = new Array(duration).fill(0);

        let success = 2500;   // number of iterations

        for (let i = 0; i < duration; i++) {

            const fails = mcResults.details.filter(d => d.failYear === i).length;
            success -= fails;
            result[i] = success;

        }

        return result;

    }

    performMonteCarloAnalysis(params: ParameterMap): MonteCarloResult {

        let result = 0.0;
        const iterations = 2500;

        // create regimes:
        const bull: regime = { mu: params.bullRate, sigma: .15, continues: .85 };
        const bear: regime = { mu: params.bearRate, sigma: .22, continues: .30 };

        const results: { netWorth: number, failYear: number }[] = [];
        const paths: number[][] = [];
        const failedPaths: number[][] = [];
        const succeededPaths: number[][] = [];

        const age = params.age;
        const netWorth = params.currentPortfolio;
        const targetAge = params.longevityAge;

        const retirementDuration = targetAge - age;

        const yearlyValues: number[][] = Array.from({ length: retirementDuration }, () =>
            new Array(iterations).fill(0)
        );

        const mcStartingValue = params.currentPortfolio;

        let fail = 0;


        for (let i = 0; i < iterations; i++) {

            // this is a single iteration . . . .
            let failYear = -1;
            let failed = false;

            const path = this.generateRegimeSwitchingReturns(retirementDuration, bull, bear);
            paths.push(path);
            let netWorth = mcStartingValue;
            for (let y = 0; y < retirementDuration; y++) {

                netWorth = this.calculateValueForYear(y, params, netWorth, path).result;

                yearlyValues[y][i] = netWorth;

                if (netWorth < 0) {
                    failed = true;
                    if (failYear == -1) failYear = y;
                }

            }

            if (failed) {
                fail++;
                failedPaths.push(path);
            } else {
                succeededPaths.push(path);
            }


            results.push({ netWorth: netWorth, failYear: failYear });

        }

        // simulation complete for scenario - process results
        result = (iterations - fail) / iterations;
        const mcStats = yearlyValues.map((value, number) => {
            return this.analyzeYearResults(value);
        });


        return { success: result * 100, details: results, mcStats, paths, failedPaths, succeededPaths };

    }

    binReturnsDistribution(paths: number[][]): { bins: number[], labels: string[] } {
        const minValue = -0.6;
        const maxValue = 0.8;
        const binWidth = 0.05; // Adjust for more/fewer bins
        const numBins = Math.ceil((maxValue - minValue) / binWidth);

        const bins = new Array(numBins).fill(0);
        const labels: string[] = [];

        // Create labels
        for (let i = 0; i < numBins; i++) {
            const lower = minValue + (i * binWidth);
            const upper = lower + binWidth;
            labels.push(`${(lower * 100).toFixed(0)}%`); // to ${(upper * 100).toFixed(0)}%`);
        }


        // Flatten and count
        paths.forEach(path => {
            path.forEach(value => {
                // Determine which bin this value belongs to
                const binIndex = Math.floor((value - minValue) / binWidth);

                // Handle edge cases
                if (binIndex >= 0 && binIndex < numBins) {
                    bins[binIndex]++;
                } else if (value === maxValue) {
                    // Put max value in last bin
                    bins[numBins - 1]++;
                }
            });
        });

        return { bins, labels };

    }

    analyzeYearResults(arr: number[]) {

        const x = arr.slice().filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
        if (x.length === 0) return;

        const pct = (p: number) => {
            const idx = (x.length - 1) * p;
            const lo = Math.floor(idx);
            const hi = Math.ceil(idx);
            if (lo === hi) return x[lo];
            return x[lo] + (x[hi] - x[lo]) * (idx - lo);
        };

        const mean = x.reduce((s, v) => s + v, 0) / x.length;

        const result = {
            mean: mean,
            p10: pct(0.10),
            p50: pct(0.50),
            p90: pct(0.90)
        }

        return result;

    }

    performLinearAnalysis(params: ParameterMap) {

        const result: YearlyData[] = [];

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
            const answer = this.calculateValueForYear(y, params, workingNetWorth, path);

            result.push({
                year: y + age,
                value: answer.result,
                growth: answer.growth,
                startValue: answer.startValue,
                ssPayment: answer.ssPayment,
                newSavings: answer.newSavings,
                coreExpense: answer.coreExpense,
                flexExpense: answer.flexExpnse,
                healthCare: answer.healthCare,
                capitalEvent: answer.captialEvent,
                pension: answer.pension

            });

            workingNetWorth = answer.result;
        }

        return result;

    }

    calculateValueForYear(year: number, params: ParameterMap, currentNetWorth: number, path: number[]): {
        result: number,
        comment: string,
        growth: number,
        startValue: number,
        ssPayment: number,
        newSavings: number,
        flexExpnse: number,
        coreExpense: number,
        healthCare: number,
        captialEvent: number,
        pension: number
    } {

        const age = params.age;
        const retirementAge = params.retired;
        let ror = 0;

        if (path.length > 0) {
            ror = path[year];
        } else {
            ror = age + year < retirementAge ? params.rateOfReturn : params.retirementRateOfReturn;
            console.log(`age: ${age}: linear ror: ${ror}`);
        }

        

        const startValue = currentNetWorth;

        const capEventOneAge = params.capitalEvent1Age;
        const capEventOneAmt = params.capitalEvent1;
        const capEventTwoAge = params.capitalEvent2Age;
        const capEventTwoAmt = params.capitalEvent2;
        const capEventThreeAge = params.capitalEvent3Age
        const capEventThreeAmt = params.capitalEvent3;

        const currentSavings = params.currentSavingsRate;

        const semiRetiredDuration = params.semiRetirementDuration;
        const semiRetiredIncome = params.semiRetiredIncome;

        const socialSecurity = params.socialSecurityAmount;
        const ssAge = params.socialSecurityAge;

        const cola = params.cola;
        let healthCare = params.healthInsurance * 12;
        const inflation = params.inflation;
        const taxRate = params.taxRate;

        let coreExpenses = params.coreExpenses * 12;
        let flexExpenses = params.flexExpenses * 12;

        const yearlyReduction = params.yearlySpendingReduction;
        const lowerBound = params.lowerBound;
        const upperBound = params.upperBound;
        const widthdrawalTarget = params.targetWithdrawalRate;

        let captialEventAmt = 0;

        // CAPITAL EVENTS
        if (year + age == capEventOneAge) captialEventAmt += (capEventOneAmt * (1 + inflation) ** year);
        if (year + age == capEventTwoAge) captialEventAmt += (capEventTwoAmt * (1 + inflation) ** year);
        if (year + age == capEventThreeAge) captialEventAmt += (capEventThreeAmt * (1 + inflation) ** year);

        currentNetWorth += captialEventAmt;

        // PRE-RETIREMENT SAVINGS
        const newSavings = (year + age < retirementAge) ? (currentSavings * (1 + inflation) ** year) : 0;
        currentNetWorth += newSavings;

        // POST-RETIREMENT WORK / INCOME
        if ((year + age >= retirementAge) && (year + age <= retirementAge + semiRetiredDuration)) currentNetWorth += (semiRetiredIncome * (1 + inflation) ** year);

        // SOCIAL SECURITY
        const ssPayment = year + age >= ssAge ? ((1 + cola) ** year) * socialSecurity : 0;

        const pension = (year + age >= params.pensionAge) ? ((1 + cola) ** year) * params.pensionAmount : 0;

        // HEALTHCARE
        healthCare = ((year + age) < 65) && ((year + age) >= retirementAge) ? (((1 + inflation) ** year) * healthCare) : 0;

        let expenses = 0;

        if (year + age >= retirementAge) {

            flexExpenses *= (1 - yearlyReduction) ** (year - (retirementAge - age)) * (1 + inflation) ** year;
            coreExpenses *= (1 + inflation) ** year;

            if (path.length > 0) {

                if (path[year] < -.01) {
                    flexExpenses *= .70;
                } else if (((flexExpenses + coreExpenses) / currentNetWorth) > widthdrawalTarget * upperBound) {

                    flexExpenses *= .75;

                } else if (((flexExpenses + coreExpenses) / currentNetWorth) < widthdrawalTarget * lowerBound) {

                    flexExpenses *= 1.0;

                }
            }

        } else {
            coreExpenses = 0;
            flexExpenses = 0;
        }

        expenses = coreExpenses + flexExpenses;

        const widthdrawal = (ssPayment - healthCare - expenses + pension) * (1 + taxRate);

        const c2 = `${year + age}: ${widthdrawal} from ${currentNetWorth} with ror: ${ror} -> ${currentNetWorth * (1 + ror)}`;

        currentNetWorth += widthdrawal;
        const growth = currentNetWorth * ror;
        let result = currentNetWorth + growth;
        const comment = `for year ${year} at ${age}: starting value: \$${Math.round(startValue)} widthdrawal: ${widthdrawal}health: ${healthCare} ss: ${ssPayment}expenses: ${expenses}ending value: ${currentNetWorth}`;

        return {
            result: result,
            comment: comment,
            growth, startValue: (startValue - widthdrawal),
            ssPayment,
            newSavings,
            healthCare,
            coreExpense: coreExpenses,
            flexExpnse: flexExpenses,
            captialEvent: captialEventAmt,
            pension
              
        };

    }

    generateRegimeSwitchingReturns(years: number, bear: regime, bull: regime) {
        const out = new Array(years);
        let regime: "bull" | "bear" = "bull"; // 'bull' or 'bear'

        for (let t = 0; t < years; t++) {
            // draw return based on current regime
            const params = (regime === 'bull') ? bull : bear;
            const muLog = Math.log(1 + params.mu) - 0.5 * params.sigma * params.sigma;

            const logR = this.generateLogReturn(muLog, params.sigma);
            const ror = Math.exp(logR) - 1;
            out[t] = ror;

            // transition to next regime
            const u = Math.random();
            if (regime === 'bull') {
                regime = (u < bull.continues) ? 'bull' : 'bear';
            } else {
                regime = (u < bear.continues) ? 'bear' : 'bull';
            }
        }

        return out;
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

    generateLogReturn(muLog: number, sigma: number): number {
        // muLog = average log return
        // sigma = volatility

        const shock = this.randn_();              // bell-curve random number
        const logReturn = muLog + sigma * shock;

        return logReturn;
    }

    applyLogReturn(value: number, muLog: number, sigma: number) {
        const logR = this.generateLogReturn(muLog, sigma);
        const growthFactor = Math.exp(logR); // always > 0

        return value * growthFactor;
    }
}
