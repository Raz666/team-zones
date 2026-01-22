import type { LocalOverrides, RemoteFlagsPayload } from './types';

export type FlagEvaluationContext = {
  defaults: Record<string, boolean>;
  remote: RemoteFlagsPayload | null;
  overrides: LocalOverrides;
  deviceId: string | null;
};

export function evaluateFlag(flagName: string, context: FlagEvaluationContext): boolean {
  const override = context.overrides[flagName];
  if (typeof override === 'boolean') return override;

  const remoteFlag = context.remote?.flags[flagName];
  if (remoteFlag && context.deviceId && remoteFlag.allow?.includes(context.deviceId)) {
    return true;
  }

  if (remoteFlag) return remoteFlag.enabled;

  if (Object.prototype.hasOwnProperty.call(context.defaults, flagName)) {
    return context.defaults[flagName];
  }

  return false;
}

export function evaluateAllFlags(context: FlagEvaluationContext): Record<string, boolean> {
  const keys = new Set<string>();
  for (const key of Object.keys(context.defaults)) keys.add(key);

  if (context.remote) {
    for (const key of Object.keys(context.remote.flags)) keys.add(key);
  }

  for (const key of Object.keys(context.overrides)) keys.add(key);

  const result: Record<string, boolean> = {};
  for (const key of keys) {
    result[key] = evaluateFlag(key, context);
  }

  return result;
}

if (__DEV__) {
  const assertCase = (label: string, received: boolean, expected: boolean) => {
    if (received !== expected) {
      console.warn(`Flag evaluator self-check failed: ${label}`, { received, expected });
    }
  };

  assertCase(
    'override beats allow',
    evaluateFlag('testFlag', {
      defaults: { testFlag: false },
      overrides: { testFlag: false },
      deviceId: 'device-1',
      remote: {
        version: 1,
        updatedAt: 'now',
        flags: {
          testFlag: { enabled: true, allow: ['device-1'] },
        },
      },
    }),
    false,
  );

  assertCase(
    'allow beats enabled',
    evaluateFlag('testFlag', {
      defaults: { testFlag: false },
      overrides: {},
      deviceId: 'device-1',
      remote: {
        version: 1,
        updatedAt: 'now',
        flags: {
          testFlag: { enabled: false, allow: ['device-1'] },
        },
      },
    }),
    true,
  );

  assertCase(
    'default fallback works',
    evaluateFlag('testFlag', {
      defaults: { testFlag: true },
      overrides: {},
      deviceId: 'device-1',
      remote: null,
    }),
    true,
  );
}
