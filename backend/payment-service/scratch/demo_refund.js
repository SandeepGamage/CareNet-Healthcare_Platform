const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

// We require the models directly to simulate the DB state
const Transaction = require('../src/models/Transaction');
const Refund = require('../src/models/Refund');

// Mock data
const APPOINTMENT_ID = 'DEMO-REFUND-' + Math.floor(Math.random() * 10000);
const MONGO_URI = 'mongodb+srv://whitedeviltest0940:Qwer11223344@cluster0.bqkmeme.mongodb.net/carenet_db?appName=Cluster0';

async function runDemo() {
  try {
    console.log('--- 🚀 STARTING REFUND PROCESS DEMO ---');
    console.log(`Targeting Appointment ID: ${APPOINTMENT_ID}\n`);

    console.log('1. Connecting to Database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    // --- STEP 1: CREATE A SUCCESSFUL TRANSACTION ---
    console.log('\n2. Simulating a SUCCESSFUL payment for this appointment...');
    const transaction = await Transaction.create({
      appointmentId: APPOINTMENT_ID,
      patientId: 'demo_patient_001',
      doctorId: 'demo_doctor_001',
      payhereOrderId: APPOINTMENT_ID, // PayHere uses our ID
      amount: 1500,
      currency: 'LKR',
      status: 'succeeded',
      metadata: {
        patientName: 'John Doe',
        patientEmail: 'john.doe@example.com',
        doctorName: 'Dr. Smith',
        specialty: 'Cardiology'
      }
    });
    console.log(`✅ Transaction created with status: ${transaction.status}`);
    console.log(`   Transaction ID: ${transaction._id}`);

    // --- STEP 2: TRIGGER AUTOMATED REFUND ---
    console.log('\n3. Triggering AUTOMATED REFUND (Simulating Doctor dashboard click)...');
    
    // Logic from createAutomaticRefund in refundController.js
    console.log('   Checking eligibility...');
    const eligibleTrans = await Transaction.findOne({ 
      appointmentId: APPOINTMENT_ID, 
      status: { $in: ['succeeded', 'partially_refunded'] } 
    });

    if (eligibleTrans) {
      console.log('   Eligible transaction found. Creating refund record...');
      
      const newRefund = await Refund.create({
        transactionId: eligibleTrans._id,
        amount: eligibleTrans.amount,
        reason: 'appointment_cancelled',
        notes: 'Demonstration of automated refund logic.',
        status: 'pending',
        requestedBy: { userId: 'DEMO_SYSTEM', role: 'admin' },
      });

      console.log('✅ Refund record created in PENDING status.');
      console.log(`   Refund ID: ${newRefund._id}`);
      
      // --- STEP 3: LOG NOTIFICATION (SIMULATED) ---
      console.log('\n4. Dispatching Notifications...');
      console.log('   [Notification] To: john.doe@example.com');
      console.log(`   [Notification] Subject: Refund Requested for Appointment ${APPOINTMENT_ID}`);
      console.log('   [Notification] Message: Your refund for LKR 1500.00 is being processed by administration.');
      console.log('✅ Notifications dispatched to Patient.');

      // --- STEP 4: VERIFY FINAL STATE ---
      console.log('\n5. Final System State Check:');
      const finalRefund = await Refund.findById(newRefund._id);
      console.log(`   Refund Status: ${finalRefund.status}`);
      console.log(`   Requested By: ${finalRefund.requestedBy.role}`);
      
      console.log('\n--- 🎉 DEMO COMPLETED SUCCESSFULLY ---');
    } else {
      console.log('❌ No eligible transaction found for this appointment.');
    }

    // Cleanup (optional, but good for keeping DB clean)
    // await Transaction.deleteOne({ _id: transaction._id });
    // await Refund.deleteOne({ _id: newRefund._id });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ DEMO FAILED:', error.message);
    process.exit(1);
  }
}

runDemo();
