import { Serializer } from '../serializer/Serializer.js';
import { GarminConnectClient } from '../client/GarminConnectClient.js';
import { Output } from '../output/Output.js';
import { Service } from '../Service.js';
import { join } from 'node:path';
import { OUTPUT_DIR } from '../constants.js';
import { PaginatedEndpoint } from '../endpoint/PaginatedEndpoint.js';

type HandlePaginatedEndpointOptions<T> = {
  client: GarminConnectClient
  service: Service
  endpoint: PaginatedEndpoint<T>
  output: Output
  serializer: Serializer
};

export async function handlePaginatedEndpoint<T>({ client, service, endpoint, output, serializer }: HandlePaginatedEndpointOptions<T>): Promise<void> {
  for await (const item of endpoint.chunks(client)) {
    const summaryFile = join(OUTPUT_DIR, service.name, item.summaryFileName);
    console.info(`> Backing up ${summaryFile}...`);
    await output.add(summaryFile, serializer.serialize(item.summaryData));

    if (item.detailFileName && item.detailUrl) {
      const detailFile = join(OUTPUT_DIR, service.name, item.detailFileName);
      if (await output.exists(detailFile)) {
        console.info(`> Skipping ${detailFile} (already exists)`);
      } else {
        console.info(`> Backing up ${detailFile}...`);
        await output.add(detailFile, serializer.serialize(await client.get(item.detailUrl, item.detailSchema)));
      }
    }
  }
}
