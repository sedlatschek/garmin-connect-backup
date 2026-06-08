import { Service } from './types/Service.js';
import { GarminConnectBackupError } from './error/GarminConnectBackupError.js';

export type EndpointFilter = { serviceName: string, endpointName: string } | { serviceName: undefined, endpointName: string };

export function parseEndpointFilter(filter: string): EndpointFilter {
  const slash = filter.indexOf('/');
  if (slash === -1) return { serviceName: undefined, endpointName: filter };
  return { serviceName: filter.slice(0, slash), endpointName: filter.slice(slash + 1) };
}

export function validateServiceAndEndpointNames(
  allServices: Service[],
  enabledServices: string[] | undefined,
  enabledEndpoints: string[] | undefined,
): void {
  const errors: string[] = [];

  if (enabledServices) {
    const allServiceNames = allServices.map(s => s.name);
    const unknown = enabledServices.filter(name => !allServiceNames.includes(name));
    if (unknown.length > 0) {
      errors.push(
        `Unknown service${unknown.length > 1 ? 's' : ''}: ${unknown.map(n => `"${n}"`).join(', ')}. Available: ${allServiceNames.join(', ')}`,
      );
    }
  }

  if (enabledEndpoints) {
    const allEndpointNames = [...new Set(allServices.flatMap(s => s.endpoints.map(e => e.name)))];
    for (const filter of enabledEndpoints) {
      const { serviceName, endpointName } = parseEndpointFilter(filter);
      if (serviceName !== undefined) {
        const service = allServices.find(s => s.name === serviceName);
        if (!service) {
          errors.push(
            `Unknown service "${serviceName}" in endpoint filter "${filter}". Available services: ${allServices.map(s => s.name).join(', ')}`,
          );
        } else if (!service.endpoints.some(e => e.name === endpointName)) {
          errors.push(
            `Unknown endpoint "${endpointName}" in service "${serviceName}". Available: ${service.endpoints.map(e => e.name).join(', ')}`,
          );
        }
      } else if (!allEndpointNames.includes(endpointName)) {
        errors.push(
          `Unknown endpoint "${endpointName}". Available: ${allEndpointNames.join(', ')}`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new GarminConnectBackupError(errors.join('\n'));
  }
}
