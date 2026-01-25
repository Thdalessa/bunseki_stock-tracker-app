import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function testConnection(): Promise<void> {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string, { bufferCommands: false });
    console.log('✅ Successfully connected to MongoDB!');
    console.log('Connection details:', mongoose.connection.name, mongoose.connection.host, mongoose.connection.port);
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:');
    console.error((error as Error).message);
  }
}

testConnection();