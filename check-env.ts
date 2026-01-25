import * as dotenv from 'dotenv';

dotenv.config();

console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
if (process.env.MONGODB_URI) {
  console.log('URI starts with:', process.env.MONGODB_URI.substring(0, 20) + '...');
}