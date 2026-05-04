require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOneAndUpdate(
      { role: 'admin' },
      { email: 'adarshkumar@marketdatabank.com' },
      { new: true }
    );
    console.log('Admin email successfully updated to:', admin.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
