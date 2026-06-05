import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';
import { FourWeekEndpoint } from '../endpoint/FourWeekEndpoint.js';
import { Service } from '../types/Service.js';
import { Components } from '../types/Components.js';
import { DateTime } from 'luxon';
import { Output, OutputWithContent } from '../output/Output.js';

type HandleFourWeekAndDailyEndpointOptions = Components & {
  service: Service
  endpoint: FourWeekEndpoint | DailyEndpoint
  from: DateTime<true>
  to: DateTime<true>
};

export async function handleFourWeekAndDailyEndpoint({ endpoint, service, client, outputCreator, serializer, logger, from, to }: HandleFourWeekAndDailyEndpointOptions): Promise<void> {
  for (const chunk of endpoint.chunk(from, to)) {
    const output: Output = { service, endpoint, ...('date' in chunk ? { date: chunk.date } : { from: chunk.from, to: chunk.to }) };
    if (await outputCreator.outputExists(output)) {
      logger.skip(output, 'already exists');
    } else {
      const outputWithContent: OutputWithContent = { ...output, content: serializer.serialize(await client.get(chunk.url, endpoint.schema)) };
      await outputCreator.add(outputWithContent);
    }
  }
}
