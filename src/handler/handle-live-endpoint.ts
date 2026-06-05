import { LiveEndpoint } from '../endpoint/LiveEndpoint.js';
import { Service } from '../types/Service.js';
import { Components } from '../types/Components.js';
import { Output, OutputWithContent } from '../output/Output.js';
import { HandlerResult } from './HandlerResult.js';
import { DateTime } from 'luxon';

type HandleLiveEndpointOptions = Components & {
  service: Service
  endpoint: LiveEndpoint
};

export async function handleLiveEndpoint({ endpoint, service, client, outputCreator, serializer, logger }: HandleLiveEndpointOptions): Promise<HandlerResult> {
  const output: Output = { service, endpoint, date: DateTime.now() };
  if (await outputCreator.outputExists(output)) {
    logger.skip(output, 'Already exists');
  } else {
    try {
      const outputWithContent: OutputWithContent = { ...output, content: serializer.serialize(await client.get(endpoint.url, endpoint.schema)) };
      await outputCreator.add(outputWithContent);
    } catch (error) {
      logger.error(output, error);
      return { errors: [error] };
    }
  }
  return { errors: [] };
}
