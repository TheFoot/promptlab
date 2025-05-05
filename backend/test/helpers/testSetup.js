/**
 * Test setup helpers for backend tests
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import sinon from "sinon";

// Setup in-memory MongoDB server
export const setupInMemoryMongoDB = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);

  return { mongod, uri };
};

// Clean up and close connection
export const closeDatabase = async (mongod) => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

// Create a mock for global.logger to avoid console output during tests
export const setupLoggerMock = () => {
  const loggerMock = {
    info: sinon.stub(),
    debug: sinon.stub(),
    warn: sinon.stub(),
    error: sinon.stub(),
    fatal: sinon.stub(),
  };

  // Store original logger if it exists
  const originalLogger = global.logger;

  // Set up mock logger
  global.logger = loggerMock;

  // Return function to restore original logger
  return () => {
    global.logger = originalLogger;
  };
};

// Create a mock of Express request/response objects
export const mockExpressReqRes = (reqOverrides = {}, resOverrides = {}) => {
  const req = {
    body: {},
    params: {},
    query: {},
    ip: "127.0.0.1",
    ...reqOverrides,
  };

  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis(),
    sendFile: sinon.stub().returnsThis(),
    ...resOverrides,
  };

  const next = sinon.stub();

  return { req, res, next };
};

// Clean up all test spies, stubs and mocks
export const restoreAllSinon = () => {
  sinon.restore();
};
