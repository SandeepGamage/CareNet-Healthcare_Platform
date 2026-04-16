const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Doctor = require('../src/models/doctor');
const { generateTimeSlots, parseNonNegativeNumber } = require('../src/services/doctorService');

const fixDoctors = async () => {
    try {
        console.log('Connecting to MongoDB...');
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not found in environment');
        }
        await mongoose.connect(mongoUri);
        console.log('Connected.');

        const doctors = await Doctor.find();
        console.log(`Found ${doctors.length} doctors.`);

        for (const doc of doctors) {
            console.log(`Processing doctor: ${doc._id} (${doc.specialization})`);
            
            const duration = parseNonNegativeNumber(doc.slotDuration, 'slotDuration', 30);
            let updates = {
                slotDuration: duration
            };

            if (doc.availableHours) {
                console.log(`  Regenerating slots for hours: ${doc.availableHours}`);
                updates.availableSlots = generateTimeSlots(doc.availableHours, duration);
                console.log(`  New slots count: ${updates.availableSlots.length}`);
            } else {
                updates.availableSlots = [];
            }

            await Doctor.findByIdAndUpdate(doc._id, updates);
            console.log(`  Updated doctor ${doc._id}`);
        }

        console.log('All doctors fixed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing doctors:', err);
        process.exit(1);
    }
};

fixDoctors();
