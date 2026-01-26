import * as dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

async function testConnection(): Promise<void> {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI environment variable is not set");
      process.exit(1);
    }
    console.log("Attempting to connect to MongoDB...");
    +(await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    }));

    console.log("✅ Successfully connected to MongoDB!");
    console.log(
      "Connection details:",
      mongoose.connection.name,
      mongoose.connection.host,
      mongoose.connection.port
    );
    await mongoose.disconnect();
    console.log("Disconnected.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:");
    console.error((error as Error).message);
    process.exit(1);
  }
}

testConnection();
