// Import the mongoose library for MongoDB interactions
import mongoose from "mongoose";
import { env } from "process";

// Retrieve the MongoDB connection URI from environment variables, defaulting to an empty string if not set
const MONGODB_URI = process.env.MONGODB_URI || "";

// Declare a global variable to cache the mongoose connection and promise
// This prevents multiple connections in serverless environments like Next.js
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// Access the global cache variable
let cached = global.mongooseCache;

// If the cache doesn't exist, initialize it with null values
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

// Export an asynchronous function to connect to the MongoDB database
export const connectToDatabase = async () => {
  // Check if the MongoDB URI is defined; throw an error if not
  if (!MONGODB_URI)
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env"
    );

  // If a connection already exists in the cache, return it to avoid creating a new one
  if (cached.conn) {
    return cached.conn;
  }

  // If no connection promise exists, create one by connecting to MongoDB
  // bufferCommands: false prevents mongoose from buffering commands before connection
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }

  // Await the connection promise and store the connection in cache
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // If connection fails, reset the promise to allow retrying
    cached.promise = null;
    throw error;
  }

  // Log successful connection with environment and URI for debugging
  console.log("Connected to Database" + process.env.NODE_ENV + MONGODB_URI);
  // Return the established connection
  return cached.conn;
};
