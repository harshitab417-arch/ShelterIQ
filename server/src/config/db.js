const mongoose = require('mongoose');

let isInMemoryFallback = false;

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drdo_shelter_thermal';
    mongoose.set('strictQuery', false);
    
    // Set connection timeout short so fallback activates quickly if MongoDB service is not running locally
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected successfully: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[Database Warning] Could not connect to local MongoDB (${err.message}).`);
    console.warn('[Database Fallback] System running in High-Performance In-Memory Data Store mode.');
    isInMemoryFallback = true;
  }
};

const checkIsFallback = () => isInMemoryFallback;

module.exports = { connectDB, checkIsFallback };
