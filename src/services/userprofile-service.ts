import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { LiveEndpoint } from '../endpoint/LiveEndpoint.js';

const USERPROFILE_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/userprofile-service`;

export function createUserProfileService(userId: string): Service {
  return {
    name: 'userprofile-service',
    endpoints: [
      new LiveEndpoint(
        `${USERPROFILE_SERVICE_URL}/userprofile/personal-information/${userId}`,
        z.looseObject({}),
        'personal_information',
      ),
      new LiveEndpoint(
        `${USERPROFILE_SERVICE_URL}/userprofile/user-settings/`,
        z.looseObject({}),
        'user_settings',
      ),
    ],
  };
}
