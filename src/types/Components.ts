import { GarminConnectClient } from '../client/GarminConnectClient.js';
import { Logger } from '../logger/Logger.js';
import { Output } from '../output/Output.js';
import { Serializer } from '../serializer/Serializer.js';

export type Components = {
  logger: Logger
  output: Output
  serializer: Serializer
  client: GarminConnectClient
};
