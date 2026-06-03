import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';
import { FourWeekEndpoint } from '../endpoint/FourWeekEndpoint.js';
import { Service } from '../types/Service.js';
import { join } from 'node:path';
import { Components } from '../types/Components.js';
import { DateTime } from 'luxon';

type HandleFourWeekAndDailyEndpointOptions = Components & {
  service: Service
  endpoint: FourWeekEndpoint | DailyEndpoint
  from: DateTime<true>
  to: DateTime<true>
};

export async function handleFourWeekAndDailyEndpoint({ endpoint, service, client, output, serializer, logger, from, to }: HandleFourWeekAndDailyEndpointOptions): Promise<void> {
  for (const chunk of endpoint.chunk(from, to)) {
    const file = join(service.name, chunk.fileName);
    if (await output.exists(file)) {
      logger.skip(file, 'already exists');
    } else {
      await output.add(file, serializer.serialize(await client.get(chunk.url, endpoint.schema)));
    }
  }
}
