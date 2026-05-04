require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const Dataset = require('../models/Dataset');
const User = require('../models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to live MongoDB database!');

    // Find an admin user to attribute the datasets to
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      throw new Error('Admin user not found in the database. Please register an admin first.');
    }

    const samples = [
      {
        path: path.join(__dirname, '../../samples/sample_tech_stocks.csv'),
        title: 'Tech Stocks Daily Report 2024',
        description: 'Historical daily stock prices (Open, High, Low, Close, Volume) for top tech giants including Apple, Microsoft, Google, Amazon, and Nvidia.',
        tags: ['finance', 'stocks', 'tech', 'market'],
        fileType: 'csv'
      },
      {
        path: path.join(__dirname, '../../samples/sample_crypto_market.json'),
        title: 'Global Cryptocurrency Market Cap',
        description: 'Current real-time market data for the top performing cryptocurrencies including Bitcoin, Ethereum, Solana, and more.',
        tags: ['crypto', 'finance', 'web3'],
        fileType: 'json'
      }
    ];

    for (const sample of samples) {
      console.log(`Uploading file for '${sample.title}' to Cloudinary...`);
      
      // Upload raw file to Cloudinary
      const result = await cloudinary.uploader.upload(sample.path, {
        resource_type: 'raw',
        folder: 'marketdatabank_raw'
      });
      
      const stats = fs.statSync(sample.path);

      // Save to MongoDB
      const dataset = new Dataset({
        title: sample.title,
        description: sample.description,
        tags: sample.tags,
        fileUrl: result.secure_url,
        fileType: sample.fileType,
        fileSize: stats.size,
        uploadedBy: admin._id
      });

      await dataset.save();
      console.log(`✅ Successfully added Dataset to live website: ${sample.title}`);
    }

    console.log('\nAll datasets have been successfully seeded to the live website!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed datasets:', err);
    process.exit(1);
  }
}

seed();
