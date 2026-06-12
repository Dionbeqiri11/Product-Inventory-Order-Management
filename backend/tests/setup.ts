import { afterAll, afterEach, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Provide required env before any app module loads its config.
process.env.JWT_SECRET ??= 'test-secret';
process.env.MONGO_URI ??= 'mongodb://localhost:27017/test';
process.env.NODE_ENV = 'test';
// Keep test output focused on assertions, not request logs.
process.env.LOG_LEVEL = 'silent';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  // Clear all collections between tests for isolation.
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
