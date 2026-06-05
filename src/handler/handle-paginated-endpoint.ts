import { Service } from '../types/Service.js';
import { PaginatedEndpoint } from '../endpoint/PaginatedEndpoint.js';
import { Components } from '../types/Components.js';
import { DateTime } from 'luxon';
import { Endpoint } from '../endpoint/Endpoint.js';
import { Output, OutputWithContent } from '../output/Output.js';

type HandlePaginatedEndpointOptions<T> = Components & {
  service: Service
  endpoint: PaginatedEndpoint<T>
  from: DateTime<true>
  to: DateTime<true>
};

export async function handlePaginatedEndpoint<T>({ client, service, endpoint, outputCreator, serializer, logger, from, to }: HandlePaginatedEndpointOptions<T>): Promise<void> {
  const toEndOfDay = to.endOf('day');

  for await (const chunk of endpoint.chunks(client)) {
    const date = chunk.summaryDate;
    if (date < from) {
      break;
    }
    if (date > toEndOfDay) {
      continue;
    }

    const summaryEndpoint: Endpoint = { schema: endpoint.schema, name: chunk.summaryName };
    const summaryOutputWithContent: OutputWithContent = { service, endpoint: summaryEndpoint, date, content: serializer.serialize(chunk.summaryData) };
    await outputCreator.add(summaryOutputWithContent);

    if (chunk.detailName && chunk.detailUrl) {
      const detailEndpoint: Endpoint = { schema: chunk.detailSchema, name: chunk.detailName };
      const detailOutput: Output = { service, endpoint: detailEndpoint, date };
      if (await outputCreator.outputExists(detailOutput)) {
        logger.skip(detailOutput, 'already exists');
      } else {
        const detailOutputWithContent: OutputWithContent = { ...detailOutput, content: serializer.serialize(await client.get(chunk.detailUrl, chunk.detailSchema)) };
        await outputCreator.add(detailOutputWithContent);
      }
    }
  }
}
