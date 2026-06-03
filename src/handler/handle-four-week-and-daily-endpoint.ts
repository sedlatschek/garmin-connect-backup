import { Serializer } from '../serializer/Serializer.js';
import { GarminConnectClient } from '../client/GarminConnectClient.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';
import { FourWeekEndpoint } from '../endpoint/FourWeekEndpoint.js';
import { Output } from '../output/Output.js';
import { Service } from '../Service.js';
import { getOptions } from '../options/options.js';
import { join } from 'node:path';
import { OUTPUT_DIR } from '../constants.js';
import { Logger } from '../logger/Logger.js';

type HandleFourWeekAndDailyEndpointOptions = {
  client: GarminConnectClient
  service: Service
  endpoint: FourWeekEndpoint | DailyEndpoint
  output: Output
  serializer: Serializer
  logger: Logger
};

export async function handleFourWeekAndDailyEndpoint({ endpoint, service, client, output, serializer, logger }: HandleFourWeekAndDailyEndpointOptions): Promise<void> {
  const { from, to } = getOptions();
  for (const chunk of endpoint.chunk(from, to)) {
    const file = join(OUTPUT_DIR, service.name, chunk.fileName);
    if (await output.exists(file)) {
      logger.skip(file, 'already exists');
    } else {
      await output.add(file, serializer.serialize(await client.get(chunk.url, endpoint.schema)));
    }
  }
}
