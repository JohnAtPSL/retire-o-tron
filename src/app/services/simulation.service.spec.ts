import { TestBed } from '@angular/core/testing';
import { SimulationService } from './simulation.service';
import { ParameterMap } from '../models/parameter.model';

describe('SimulationService', () => {
  let service: SimulationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimulationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateValueForYear', () => {
    let baseParams: ParameterMap;

    beforeEach(() => {
      // Set up base parameters for testing
      baseParams = {
        age: 55,
        retired: 65,
        currentPortfolio: 500000,
        rateOfReturn: 6,
        retirementRateOfReturn: 5,
        cola: 2.5,
        taxRate: 0.11,
        coreExpenses: 3000,
        flexExpenses: 2000,
        healthInsurance: 800,
        capitalEvent1: 0,
        capitalEvent1Age: 0,
        capitalEvent2: 0,
        capitalEvent2Age: 0,
        capitalEvent3: 0,
        capitalEvent3Age: 0,
        semiRetiredIncome: 0,
        semiRetirementDuration: 0,
        yearlySpendingReduction: 0.01,
        longevityAge: 95,
        currentSavingsRate: 0,
        socialSecurityAmount: 2000,
        socialSecurityAge: 67,
        targetWithdrawalRate: 0.04,
        upperBound: 1.2,
        lowerBound: 0.8,
        applyGuardrails: true,
        applySpendingReduction: true,
        inflation: 0.03
      };
    });

    it('should calculate portfolio growth during working years', () => {
      const year = 0; // First year
      const currentNetWorth = 500000;
      const currentRoR = 0.06;

      const result = service.calculateValueForYear(year, baseParams, currentNetWorth, currentRoR);

      // During working years (age < retirement), should grow by RoR
      // 500000 * (1 + 0.06) = 530000
      expect(result.result).toBeCloseTo(530000, 0);
      expect(result.comment).toContain('starting value');
    });

    it('should include capital events at the correct age', () => {
      const paramsWithCapitalEvent = { ...baseParams, capitalEvent1Age: 55, capitalEvent1: 100000 };
      const year = 0; // Age 55
      const currentNetWorth = 500000;
      const currentRoR = 0.06;

      const result = service.calculateValueForYear(year, paramsWithCapitalEvent, currentNetWorth, currentRoR);

      // Should add capital event: (500000 + 100000) * 1.06 = 636000
      expect(result.result).toBeCloseTo(636000, 0);
    });

    it('should deduct expenses during retirement', () => {
      const retiredParams = { ...baseParams, age: 65, retired: 65 };
      const year = 0; // First year of retirement
      const currentNetWorth = 1000000;
      const currentRoR = 0.05;

      const result = service.calculateValueForYear(year, retiredParams, currentNetWorth, currentRoR);

      // Should deduct expenses and apply RoR
      expect(result.result).toBeLessThan(currentNetWorth * (1 + currentRoR));
      expect(result.comment).toContain('expenses');
    });

    it('should include social security when age is reached', () => {
      const retiredParams = { ...baseParams, age: 67, retired: 65, socialSecurityAge: 67 };
      const year = 2; // Age 67, 2 years into retirement
      const currentNetWorth = 1000000;
      const currentRoR = 0.05;

      const result = service.calculateValueForYear(year, retiredParams, currentNetWorth, currentRoR);

      expect(result.comment).toContain('ss:');
      // Social security should help offset withdrawal
    });

    it('should add healthcare costs before age 65', () => {
      const retiredParams = { ...baseParams, age: 62, retired: 62 };
      const year = 0;
      const currentNetWorth = 1000000;
      const currentRoR = 0.05;

      const result = service.calculateValueForYear(year, retiredParams, currentNetWorth, currentRoR);

      expect(result.comment).toContain('health:');
      // Healthcare costs should be included before age 65
    });

    it('should apply guardrails to adjust spending', () => {
      const retiredParams = { ...baseParams, age: 65, retired: 65 };
      const year = 0;
      // Very low net worth relative to expenses to trigger guardrails
      const currentNetWorth = 100000;
      const currentRoR = 0.05;

      const result = service.calculateValueForYear(year, retiredParams, currentNetWorth, currentRoR);

      // With guardrails, flexible expenses should be reduced
      expect(result.result).toBeGreaterThan(0);
    });

    it('should return a comment with calculation details', () => {
      const year = 0;
      const currentNetWorth = 500000;
      const currentRoR = 0.06;

      const result = service.calculateValueForYear(year, baseParams, currentNetWorth, currentRoR);

      expect(result.comment).toBeTruthy();
      expect(result.comment).toContain('starting value');
      expect(result.comment).toContain('ending value');
      expect(result.comment).toContain('widthdrawal');
    });
  });

  describe('performLinearAnalysis', () => {
    let baseParams: ParameterMap;

    beforeEach(() => {
      // Set up base parameters for testing
      baseParams = {
        age: 55,
        retired: 65,
        currentPortfolio: 500000,
        rateOfReturn: 6,
        retirementRateOfReturn: 5,
        cola: 2.5,
        taxRate: 0.11,
        coreExpenses: 3000,
        flexExpenses: 2000,
        healthInsurance: 800,
        capitalEvent1: 0,
        capitalEvent1Age: 0,
        capitalEvent2: 0,
        capitalEvent2Age: 0,
        capitalEvent3: 0,
        capitalEvent3Age: 0,
        semiRetiredIncome: 0,
        semiRetirementDuration: 0,
        yearlySpendingReduction: 0.01,
        longevityAge: 95,
        currentSavingsRate: 0,
        socialSecurityAmount: 2000,
        socialSecurityAge: 67,
        targetWithdrawalRate: 0.04,
        upperBound: 1.2,
        lowerBound: 0.8,
        applyGuardrails: true,
        applySpendingReduction: true,
        inflation: 0.03
      };
    });

    it('should return a final portfolio value after full retirement duration', () => {
      const result = service.performLinearAnalysis(baseParams);

      // Should return a number representing final portfolio value
      expect(typeof result).toBe('number');
      expect(result).toBeDefined();
    });

    it('should calculate over the correct duration', () => {
      const shortDurationParams = { ...baseParams, age: 65, longevityAge: 75 };
      
      const result = service.performLinearAnalysis(shortDurationParams);

      // Should run for 10 years (75 - 65)
      expect(result).toBeGreaterThan(0);
    });

    it('should handle scenario from working years through retirement', () => {
      const workingParams = { ...baseParams, age: 55, retired: 65, longevityAge: 75 };
      
      const result = service.performLinearAnalysis(workingParams);

      // Should calculate 20 years (10 working + 10 retired)
      expect(result).toBeGreaterThan(0);
    });

    it('should produce different results for different retirement ages', () => {
      const earlyRetirement = { ...baseParams, retired: 60 };
      const laterRetirement = { ...baseParams, retired: 70 };

      const earlyResult = service.performLinearAnalysis(earlyRetirement);
      const laterResult = service.performLinearAnalysis(laterRetirement);

      // Later retirement should have more portfolio growth
      expect(laterResult).toBeGreaterThan(earlyResult);
    });

    it('should produce different results for different rates of return', () => {
      const lowROR = { ...baseParams, rateOfReturn: 3, retirementRateOfReturn: 2 };
      const highROR = { ...baseParams, rateOfReturn: 8, retirementRateOfReturn: 6 };

      const lowResult = service.performLinearAnalysis(lowROR);
      const highResult = service.performLinearAnalysis(highROR);

      // Higher ROR should produce higher portfolio value
      expect(highResult).toBeGreaterThan(lowResult);
    });

    it('should handle a scenario with zero starting portfolio', () => {
      const zeroStartParams = { ...baseParams, currentPortfolio: 0 };

      const result = service.performLinearAnalysis(zeroStartParams);

      // Should still calculate (though result may be negative)
      expect(typeof result).toBe('number');
    });

    it('should handle a very short duration', () => {
      const shortParams = { ...baseParams, age: 94, longevityAge: 95 };

      const result = service.performLinearAnalysis(shortParams);

      // Should calculate for just 1 year
      expect(typeof result).toBe('number');
    });

    it('should use working ROR before retirement and retired ROR after', () => {
      // Test with very different rates to see the effect
      const params = { 
        ...baseParams, 
        age: 64, 
        retired: 65, 
        longevityAge: 66,
        rateOfReturn: 10, // High working rate
        retirementRateOfReturn: 2, // Low retired rate
        currentPortfolio: 100000,
        coreExpenses: 0,
        flexExpenses: 0
      };

      const result = service.performLinearAnalysis(params);

      // Should reflect the transition from high to low ROR
      expect(result).toBeGreaterThan(100000);
    });
  });
});
