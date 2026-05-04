require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Dataset = require('../models/Dataset');
const User = require('../models/User');

const adjectives = ["Global", "Regional", "Local", "National", "Corporate", "Public", "Private", "Urban", "Rural", "Enterprise", "Consumer", "B2B", "Digital", "Market"];
const topics = ["Sales", "Weather", "Health", "Financial", "Crypto", "Traffic", "Demographic", "Education", "Energy", "Retail", "Automotive", "Logistics", "E-commerce", "AI"];
const formats = ["Data", "Statistics", "Metrics", "Records", "Analysis", "Overview", "Report", "Trends", "Insights", "Logs", "Index"];
const periods = ["2020", "2021", "2022", "2023", "2024", "Q1", "Q2", "Q3", "Q4", "Annual", "Monthly", "Weekly", "Historical"];

const allTags = ['finance', 'health', 'tech', 'weather', 'education', 'sales', 'crypto', 'energy', 'logistics', 'retail', 'demographics', 'public', 'research', 'ai'];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTitle() {
  return `${getRandom(adjectives)} ${getRandom(topics)} ${getRandom(formats)} ${getRandom(periods)}`;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to live MongoDB database!');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      throw new Error('Admin user not found. Please register an admin first.');
    }

    // To prevent spamming Cloudinary with 100 file uploads, 
    // we will dynamically clone the file URLs of the existing samples.
    const existingCsv = await Dataset.findOne({ fileType: 'csv' });
    const existingJson = await Dataset.findOne({ fileType: 'json' });

    if (!existingCsv && !existingJson) {
      throw new Error('You must have at least 1 dataset in the DB to clone.');
    }

    console.log('Generating 100 sample datasets...');
    const newDatasets = [];
    
    for (let i = 0; i < 100; i++) {
      const isCsv = Math.random() > 0.3; // 70% CSV, 30% JSON
      const base = isCsv ? (existingCsv || existingJson) : (existingJson || existingCsv);
      
      // Select 2-4 random tags
      const numTags = Math.floor(Math.random() * 3) + 2;
      const tags = [];
      for(let t = 0; t < numTags; t++) {
        tags.push(getRandom(allTags));
      }

      newDatasets.push({
        title: generateTitle() + ` (#${i+1})`,
        description: `This is an automatically generated sample dataset containing comprehensive ${[...new Set(tags)].join(', ')} metrics for testing purposes.`,
        tags: [...new Set(tags)],
        fileUrl: base.fileUrl,
        publicId: base.publicId,
        fileType: base.fileType,
        fileSize: base.fileSize,
        uploadedBy: admin._id,
        status: 'approved', // Automatically approve them
        downloadCount: Math.floor(Math.random() * 5000) // Random fake download counts!
      });
    }

    // Insert all 100 datasets into the live database at once
    await Dataset.insertMany(newDatasets);
    
    console.log('✅ Successfully inserted 100 datasets into the live website!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed datasets:', err);
    process.exit(1);
  }
}

seed();
