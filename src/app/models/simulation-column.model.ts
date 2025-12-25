import { ParameterValue } from './parameter.model';

export interface SimulationColumn {
  id: string;
  name: string;
  parameters: ParameterValue[];
}
