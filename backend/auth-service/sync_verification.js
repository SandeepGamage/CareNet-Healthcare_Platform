const mongoose = require('mongoose');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');

const MONGO_URI = 'mongodb+srv://carenet_db:carenet123@ac-hbu8zyt-shard-00-02.bqkmeme.mongodb.net/CareNet_DB?retryWrites=true&w=majority';

async function syncVerificationStatus() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all verified doctor profiles
    const verifiedDoctorProfiles = await Doctor.find({ isVerified: true });
    console.log(`Found ${verifiedDoctorProfiles.length} verified doctor profiles.`);

    for (const profile of verifiedDoctorProfiles) {
      const result = await User.findByIdAndUpdate(profile.userId, { isVerified: true });
      if (result) {
        console.log(`Synced isVerified for user: ${result.email}`);
      }
    }

    console.log('Sync complete!');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

syncVerificationStatus();
