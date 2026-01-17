import { useContext } from 'react';

import { DEFAULT_FLAGS } from './defaults';
import { evaluateFlag } from './evaluator';
import { FlagsContext, getRuntimeSnapshot } from './FlagsContext';

export function useFlag(flagName: string): boolean {
  const context = useContext(FlagsContext);
  const snapshot = context?.snapshot ?? getRuntimeSnapshot();

  return evaluateFlag(flagName, {
    defaults: DEFAULT_FLAGS,
    remote: snapshot.remote,
    overrides: snapshot.overrides,
    deviceId: snapshot.deviceId,
  });
}
