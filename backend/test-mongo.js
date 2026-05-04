const mongoose = require('mongoose');

const uri1 = 'mongodb+srv://admin:Adarsh123@cluster0.25qvsrk.mongodb.net/marketdatabank?retryWrites=true&w=majority&appName=Cluster0';
const uri2 = 'mongodb+srv://admin:Adarsh@1234@cluster0.25qvsrk.mongodb.net/marketdatabank?retryWrites=true&w=majority&appName=Cluster0';

async function test() {
  try {
    await mongoose.connect(uri1);
    console.log('SUCCESS: Connected with Adarsh123');
    process.exit(0);
  } catch (e) {
    console.log('Failed uri1', e.message);
    try {
      await mongoose.connect(uri2);
      console.log('SUCCESS: Connected with Adarsh@1234');
      process.exit(0);
    } catch (e2) {
      console.log('Failed uri2', e2.message);
      process.exit(1);
    }
  }
}
test();
