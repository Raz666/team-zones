import { loadDeviceId, saveDeviceId } from './storage';

const DEVICE_ID_PREFIX = 'dvc';

const generateDeviceId = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  return `${DEVICE_ID_PREFIX}_${random}_${Date.now()}`;
};

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await loadDeviceId();

  if (existing) return existing;

  const next = generateDeviceId();
  await saveDeviceId(next);

  return next;
}
