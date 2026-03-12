const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://Vercel-Admin-database-asuma-bot-v1:ZkC0e1tsptBnKSZB@database-asuma-bot-v1.dm6gdlr.mongodb.net/?retryWrites=true&w=majority", {
      dbName: 'asuma_bot',
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
