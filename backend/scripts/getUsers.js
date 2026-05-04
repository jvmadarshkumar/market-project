require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    
    console.log("--- REGISTERED USERS ---");
    users.forEach((user, i) => {
      console.log(`\nUser #${i + 1}`);
      console.log(`Name:  ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role:  ${user.role}`);
      console.log(`Verified: ${user.isVerified}`);
      console.log(`Password (Hashed): ${user.password}`);
    });
    console.log("\n------------------------");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
