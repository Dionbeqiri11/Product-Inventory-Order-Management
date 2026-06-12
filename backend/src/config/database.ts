import mongoose from 'mongoose';
import { logger } from './logger';

mongoose.set('strictQuery', true);

/**
 * Establish a connection to MongoDB. Resolves once connected so the server only
 * starts accepting traffic after the database is reachable.
 */
export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info('Connected to MongoDB');
  return connection;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
}
