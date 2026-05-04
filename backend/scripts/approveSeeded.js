require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Dataset = require('../models/Dataset');

async function approve() {
  await mongoose.connect(process.env.MONGO_URI);
  const res = await Dataset.updateMany(
    { title: { $in: ['Tech Stocks Daily Report 2024', 'Global Cryptocurrency Market Cap'] } },
    { $set: { status: 'approved' } }
  );
  console.log('Approved:', res.modifiedCount);
  process.exit(0);
}
approve();
