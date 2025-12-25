import { Injectable } from '@angular/core';
import { ParameterDefinition, ParameterType } from '../models/parameter.model';

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
      defaultValue: 65,
      min: 18,
      max: 100,
      step: 1
    },
    {
      id: 'retired',
      label: 'Retired',
      type: ParameterType.BOOLEAN,
      group: 'Basics',
      defaultValue: false
    },
    // Finance Group
    {
      id: 'portfolio',
      label: 'Portfolio Type',
      type: ParameterType.DROPDOWN,
      group: 'Finance',
      defaultValue: '401k',
      dropdownOptions: [
        { label: '401(k)', value: '401k' },
        { label: 'IRA', value: 'ira' },
        { label: 'Both', value: 'both' }
      ]
    },
    {
      id: 'amount',
      label: 'Portfolio Amount',
      type: ParameterType.NUMBER,
      group: 'Finance',
      defaultValue: 500000,
      min: 0,
      max: 10000000,
      step: 1000
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
    return this.parameters.filter(p => p.group === group);
  }
}
