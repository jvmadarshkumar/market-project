require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Admin not found!');
      process.exit(1);
    }
    
    // Changing the password this way triggers the pre('save') hook to hash it!
    admin.password = 'admin@1234';
    await admin.save();
    
    console.log('Admin password successfully updated and hashed!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
