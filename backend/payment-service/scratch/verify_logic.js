const mongoose = require('mongoose');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config({ path: '../.env' }); // Assuming it's run from payment-service/scratch

// Models (Partial for testing)
const Transaction = require('../src/models/Transaction');
const Refund = require('../src/models/Refund');

const APPOINTMENT_ID = 'TEST-APPT-' + Date.now();
const MONGO_URI = 'mongodb+srv://whitedeviltest0940:Qwer11223344@cluster0.bqkmeme.mongodb.net/payment_db?appName=Cluster0';

async function testRefundLogic() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 1. Create a dummy successful transaction
    console.log('Step 1: Creating a successful transaction for appointment:', APPOINTMENT_ID);
    const transaction = await Transaction.create({
      appointmentId: APPOINTMENT_ID,
      patientId: 'patient123',
      doctorId: 'doctor456',
      payhereOrderId: APPOINTMENT_ID,
      amount: 1500,
      currency: 'LKR',
      status: 'succeeded',
      metadata: {
        patientName: 'Test Patient',
        patientEmail: 'test@example.com',
        doctorName: 'Dr. Test'
      }
    });
    console.log('Transaction created:', transaction._id);

    // 2. Simulate the 'auto-request' endpoint logic
    console.log('\nStep 2: Simulating createAutomaticRefund logic...');
    
    // logic from refundController.js
    const transForRefund = await Transaction.findOne({ 
      appointmentId: APPOINTMENT_ID, 
      status: { $in: ['succeeded', 'partially_refunded'] } 
    });

    if (!transForRefund) {
      throw new Error('Transaction not found in simulation!');
    }

    const refund = await Refund.create({
      transactionId: transForRefund._id,
      amount       : transForRefund.amount,
      reason       : 'appointment_cancelled',
      notes        : 'Automatically requested due to appointment rejection (Simulation).',
      status       : 'pending',
      requestedBy  : { userId: 'SYSTEM', role: 'admin' },
    });

    console.log('Refund record created:', refund._id);
    console.log('Refund Status:', refund.status);
    console.log('Transaction ID linked:', refund.transactionId);

    // 3. Cleanup
    console.log('\nStep 3: Cleanup test data...');
    // await Transaction.deleteOne({ _id: transaction._id });
    // await Refund.deleteOne({ _id: refund._id });
    // console.log('Test data cleaned up.');

    console.log('\n=== TEST SUCCESSFUL ===');
    console.log('The refund logic was able to find the transaction and create a pending refund record.');
    
    process.exit(0);
  } catch (error) {
    console.error('TEST FAILED:', error);
    process.exit(1);
  }
}

testRefundLogic();
