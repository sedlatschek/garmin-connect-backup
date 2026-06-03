import { Service } from '../types/Service.js';
import { join } from 'node:path';
import { OUTPUT_DIR } from '../constants.js';
import { PaginatedEndpoint } from '../endpoint/PaginatedEndpoint.js';
import { getOptions } from '../options/options.js';
import { Components } from '../types/Components.js';

type HandlePaginatedEndpointOptions<T> = Components & {
  service: Service
  endpoint: PaginatedEndpoint<T>
};

export async function handlePaginatedEndpoint<T>({ client, service, endpoint, output, serializer, logger }: HandlePaginatedEndpointOptions<T>): Promise<void> {
  const { from, to } = getOptions();
  const toEndOfDay = to.endOf('day');

  for await (const item of endpoint.chunks(client)) {
    if (endpoint.dateExtractor) {
      const date = endpoint.dateExtractor(item.summaryData);
      if (date < from) {
        break;
      }
      if (date > toEndOfDay) {
        continue;
      }
    }

    const summaryFile = join(OUTPUT_DIR, service.name, item.summaryFileName);
    await output.add(summaryFile, serializer.serialize(item.summaryData));

    if (item.detailFileName && item.detailUrl) {
      const detailFile = join(OUTPUT_DIR, service.name, item.detailFileName);
      if (await output.exists(detailFile)) {
        logger.skip(detailFile, 'already exists');
      } else {
        await output.add(detailFile, serializer.serialize(await client.get(item.detailUrl, item.detailSchema)));
      }
    }
  }
}
