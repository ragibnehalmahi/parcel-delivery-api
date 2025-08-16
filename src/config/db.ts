import mongoose from 'mongoose';
import { env } from 'process';
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ DB connection failed:', error);
    process.exit(1);
  }
};
