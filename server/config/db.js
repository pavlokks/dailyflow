import mongoose from 'mongoose';

let hasConnected = false;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.warn('MongoDB connection skipped: MONGO_URI is not defined in server/.env');
      return false;
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    hasConnected = true;
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error(`MongoDB is unavailable: ${error.message}`);
    console.error('Express server is still running. Start MongoDB and restart the backend when ready.');
    return false;
  }
};

mongoose.connection.on('error', (error) => {
  console.error(`MongoDB runtime error: ${error.message}`);
});

mongoose.connection.on('disconnected', () => {
  if (hasConnected) {
    console.warn('MongoDB disconnected');
  }
});

export default connectDB;
