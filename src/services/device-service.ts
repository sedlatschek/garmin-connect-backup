import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { LiveEndpoint } from '../endpoint/LiveEndpoint.js';

const DEVICE_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/device-service`;

export function createDeviceService(userId: string): Service {
  const deviceSchema = z.array(z.looseObject({}));
  return {
    name: 'device-service',
    endpoints: [
      new LiveEndpoint(`${DEVICE_SERVICE_URL}/deviceregistration/devices/all/${userId}`, deviceSchema, 'devices'),
    ],
  };
}
