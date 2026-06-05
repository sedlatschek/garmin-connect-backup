import { GarminConnectClient } from '../client/GarminConnectClient.js';
import { Logger } from '../logger/Logger.js';
import { OutputCreator } from '../output/OutputCreator.js';
import { Serializer } from '../serializer/Serializer.js';

export type Components = {
  logger: Logger
  outputCreator: OutputCreator
  serializer: Serializer
  client: GarminConnectClient
};
