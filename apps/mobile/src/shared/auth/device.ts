import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getDeviceName = (): string | null => {
  const deviceName = Constants.deviceName;
  if (deviceName && typeof deviceName === 'string') {
    return deviceName;
  }

  return `${Platform.OS}`;
};
