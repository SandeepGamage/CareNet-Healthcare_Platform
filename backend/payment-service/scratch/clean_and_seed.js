const mongoose = require('mongoose');
const Transaction = require('../src/models/Transaction');
const Invoice = require('../src/models/Invoice');

const MONGO_URI = 'mongodb+srv://whitedeviltest0940:Qwer11223344@cluster0.bqkmeme.mongodb.net/payment_db?appName=Cluster0';
const targetPatientId = '69dcb87bb5e5b92a058bbbf2';

const seedData = [
  {
    doctorName: 'Dr. Jagath Perera',
    doctorId: '69cf65d36731e76841ba7c90',
    amount: 2500,
    specialty: 'Cardiology',
    date: '2026-04-10',
    type: 'video'
  },
  {
    doctorName: 'Dr. Sandakelum Silva',
    doctorId: '69cf65d36731e76841ba7c91',
    amount: 1500,
    specialty: 'Dermatology',
    date: '2026-04-12',
    type: 'telemedicine'
  },
  {
    doctorName: 'Dr. Nirmala Devi',
    doctorId: '69cf65d36731e76841ba7c92',
    amount: 3000,
    specialty: 'Neurology',
    date: '2026-04-14',
    type: 'in-person'
  },
  {
    doctorName: 'Dr. Jagath Perera',
    doctorId: '69cf65d36731e76841ba7c90',
    amount: 2500,
    specialty: 'Cardiology',
    date: '2026-04-15',
    type: 'video'
  },
  {
    doctorName: 'Dr. Priyantha Banda',
    doctorId: '69cf65d36731e76841ba7c93',
    amount: 1200,
    specialty: 'General Practice',
    date: '2026-04-16',
    type: 'telemedicine'
  }
];

async function cleanAndSeed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Clean existing pending/failed data for the patient
    const deleteResult = await Transaction.deleteMany({
      patientId: targetPatientId,
      status: { $in: ['pending', 'failed'] }
    });
    console.log(`Deleted ${deleteResult.deletedCount} pending/failed transactions.`);

    // 2. Clean associated invoices if any (optional but good for clean slate)
    // No easy way to find invoices without transaction link here unless we loop, 
    // but we'll focus on seeding.

    // 3. Seed new successful transactions
    for (const data of seedData) {
      const appointmentId = new mongoose.Types.ObjectId().toString(); // Dummy appointment ID
      
      const transaction = new Transaction({
        appointmentId,
        patientId: targetPatientId,
        doctorId: data.doctorId,
        payhereOrderId: `PAY-${appointmentId}`,
        amount: data.amount,
        currency: 'LKR',
        status: 'succeeded',
        metadata: {
          doctorName: data.doctorName,
          patientName: 'Hanaan',
          patientEmail: 'hanaan@example.com',
          specialty: data.specialty,
          appointmentDate: data.date,
          consultationType: data.type
        }
      });

      const savedTx = await transaction.save();

      // Create associated invoice
      const invoice = new Invoice({
        transactionId: savedTx._id,
        patientId: targetPatientId,
        lineItems: [{
          description: `Medical Consultation - ${data.doctorName}`,
          quantity: 1,
          unitPrice: data.amount,
          total: data.amount
        }],
        subtotal: data.amount,
        totalAmount: data.amount,
        currency: 'LKR',
        status: 'paid',
        billingDetails: {
          patientName: 'Hanaan',
          email: 'hanaan@example.com'
        },
        doctorDetails: {
          name: data.doctorName,
          specialty: data.specialty
        },
        appointmentDate: data.date,
        pdfBuffer: Buffer.from('Dummy PDF Content') // Just enough to pass buffer check
      });

      const savedInvoice = await invoice.save();
      savedTx.invoiceId = savedInvoice._id;
      await savedTx.save();
      
      console.log(`Seeded transaction and invoice for ${data.doctorName}`);
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error during clean and seed:', err);
    process.exit(1);
  }
}

cleanAndSeed();
