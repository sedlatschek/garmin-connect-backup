import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateServiceAndEndpointNames, parseEndpointFilter } from './validate.js';
import { Service } from './types/Service.js';
import { Endpoint } from './endpoint/Endpoint.js';

function makeEndpoint(name: string): Endpoint {
  return { name, schema: z.unknown() };
}

function makeService(name: string, endpointNames: string[]): Service {
  return { name, endpoints: endpointNames.map(makeEndpoint) };
}

const allServices: Service[] = [
  makeService('sleep-service', ['sleep_summary', 'sleep']),
  makeService('wellness-service', ['sleep', 'stress']),
  makeService('hrv-service', ['hrv_summary', 'hrv']),
  makeService('activities', ['activities', 'activity_types']),
];

describe('parseEndpointFilter', () => {
  it('returns undefined serviceName for an unqualified name', () => {
    expect(parseEndpointFilter('sleep')).toEqual({ serviceName: undefined, endpointName: 'sleep' });
  });

  it('returns serviceName and endpointName for a qualified name', () => {
    expect(parseEndpointFilter('sleep-service/sleep')).toEqual({ serviceName: 'sleep-service', endpointName: 'sleep' });
  });
});

describe('validateServiceAndEndpointNames', () => {
  describe('services', () => {
    it('does not throw when services is undefined', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, undefined)).not.toThrow();
    });

    it('does not throw for a valid service name', () => {
      expect(() => validateServiceAndEndpointNames(allServices, ['sleep-service'], undefined)).not.toThrow();
    });

    it('does not throw for multiple valid service names', () => {
      expect(() => validateServiceAndEndpointNames(allServices, ['sleep-service', 'hrv-service'], undefined)).not.toThrow();
    });

    it('throws for an unknown service name', () => {
      expect(() => validateServiceAndEndpointNames(allServices, ['unknown-service'], undefined))
        .toThrow('Unknown service: "unknown-service"');
    });

    it('throws listing all unknown services', () => {
      expect(() => validateServiceAndEndpointNames(allServices, ['foo', 'bar'], undefined))
        .toThrow('Unknown services: "foo", "bar"');
    });

    it('includes available service names in the error message', () => {
      expect(() => validateServiceAndEndpointNames(allServices, ['nope'], undefined))
        .toThrow('Available: sleep-service, wellness-service, hrv-service, activities');
    });
  });

  describe('unqualified endpoints', () => {
    it('does not throw when endpoints is undefined', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, undefined)).not.toThrow();
    });

    it('does not throw for a valid endpoint name', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, ['hrv'])).not.toThrow();
    });

    it('does not throw for a name shared across multiple services', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, ['sleep'])).not.toThrow();
    });

    it('throws for an unknown endpoint name', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, ['unknown_endpoint']))
        .toThrow('Unknown endpoint "unknown_endpoint"');
    });

    it('includes available endpoint names in the error message', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, ['nope']))
        .toThrow('Available:');
    });
  });

  describe('qualified endpoints (service/endpoint)', () => {
    it('does not throw for a valid qualified name', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, ['sleep-service/sleep'])).not.toThrow();
    });

    it('does not throw for both qualified variants of an overlapping name', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, ['sleep-service/sleep', 'wellness-service/sleep'])).not.toThrow();
    });

    it('throws when the service in a qualified name does not exist', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, ['nope-service/sleep']))
        .toThrow('Unknown service "nope-service" in endpoint filter "nope-service/sleep"');
    });

    it('throws when the endpoint does not exist in the specified service', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, ['hrv-service/sleep']))
        .toThrow('Unknown endpoint "sleep" in service "hrv-service"');
    });

    it('includes available endpoints for the service in the error message', () => {
      expect(() => validateServiceAndEndpointNames(allServices, undefined, ['hrv-service/sleep']))
        .toThrow('Available: hrv_summary, hrv');
    });
  });

  it('collects multiple errors before throwing', () => {
    expect(() => validateServiceAndEndpointNames(allServices, ['bad-service'], ['bad_endpoint']))
      .toThrow('Unknown service: "bad-service"');
  });
});
