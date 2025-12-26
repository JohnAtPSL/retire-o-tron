import { TestBed } from '@angular/core/testing';
import { SimulationService } from './simulation.service';
import { ParameterMap } from '../models/parameter.model';


function setDefaultRates(params: ParameterMap): ParameterMap {
  params.cola = .025;
  params.rateOfReturn = .06;
  params.retirementRateOfReturn = .05;
  params.inflation = .3;
  return params;
}


describe('SimulationService', () => {
  let service: SimulationService;
  let baseParams: ParameterMap;


  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimulationService);

    baseParams = {
      age: 55,
      retired: 65,
      currentPortfolio: 1000,
      rateOfReturn: 0.0,
      retirementRateOfReturn: 0.0,
      cola: 0.0,
      taxRate: 0.0,
      coreExpenses: 0,
      flexExpenses: 0,
      healthInsurance: 0,
      capitalEvent1: 0,
      capitalEvent1Age: 0,
      capitalEvent2: 0,
      capitalEvent2Age: 0,
      capitalEvent3: 0,
      capitalEvent3Age: 0,
      semiRetiredIncome: 0,
      semiRetirementDuration: 0,
      yearlySpendingReduction: 0.0,
      longevityAge: 95,
      currentSavingsRate: 0,
      socialSecurityAmount: 0,
      socialSecurityAge: 0,
      targetWithdrawalRate: 0.00,
      upperBound: 1.2,
      lowerBound: 0.8,
      applyGuardrails: true,
      applySpendingReduction: true,
      inflation: 0.0
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  it('should return unchanged portfolio if everything is zeroed out', () => {
    const year = 0; // First year
    const currentNetWorth = 1000;
    

    const result = service.calculateValueForYear(year, baseParams, currentNetWorth, []);

    expect(result.result).toEqual(currentNetWorth);
    expect(result.comment).toContain('starting value');
  });

  it('should calculate portfolio growth correctly', () => {
    const year = 0; // First year
    const currentNetWorth = 1000;
    baseParams.rateOfReturn = .07;

    const result = service.calculateValueForYear(year, baseParams, currentNetWorth, []);

    expect(result.result).toEqual(1070.0);
    expect(result.comment).toContain('starting value');
  });

  it('should calculate retired portfolio growth correctly', () => {
    const year = 12; // second year of retirement
    const currentNetWorth = 1000;
    baseParams.rateOfReturn = .07;
    baseParams.retirementRateOfReturn = .05;

    const result = service.calculateValueForYear(year, baseParams, currentNetWorth, []);

    expect(result.result).toEqual(1050.0);
    expect(result.comment).toContain('starting value');
  });


  it('should include capital events at the correct age', () => {
    const paramsWithCapitalEvent = { ...baseParams, capitalEvent1Age: 55, capitalEvent1: 100000 };
    const year = 0; // Age 55
    const currentNetWorth = 500000;

    const result = service.calculateValueForYear(year, paramsWithCapitalEvent, currentNetWorth, []);

    // Should add capital event: (500000 + 100000);
    expect(result.result).toEqual(600000);
  });

  it('should deduct expenses during retirement', () => {
    const retiredParams = { ...baseParams, retired: 65, retirementRateOfReturn: 0.05, coreExpenses: 50 };
    const year = 20; // First year of retirement
    const currentNetWorth = 10000;
    const currentRoR = 0.05;

    const result = service.calculateValueForYear(year, retiredParams, currentNetWorth, []);

    // Should deduct expenses and apply RoR
    expect(result.result).toEqual((currentNetWorth - (50 * 12)) * (1 + currentRoR));
    expect(result.comment).toContain('expenses');
  });

  it('should include social security when age is reached', () => {
    const retiredParams = { ...baseParams, age:55, retired: 65, socialSecurityAge: 65, socialSecurityAmount:1000 };
    const year = 12;
    const currentNetWorth = 5000;

    const result = service.calculateValueForYear(year, retiredParams, currentNetWorth, []);

    expect(result.result).toEqual(6000);

  });

  it('should add healthcare costs before age 65', () => {
    const retiredParams = { ...baseParams, age: 62, retired: 62, healthInsurance: 500 };
    const year = 0;
    const currentNetWorth = 5000;

    const result = service.calculateValueForYear(year, retiredParams, currentNetWorth, []);

    expect(result.result).toEqual(-1000);

  });

});