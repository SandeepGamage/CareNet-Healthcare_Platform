# Payment Service 💳

This microservice handles all financial transactions, Stripe integrations, and automated invoicing for the CareNet Healthcare Platform.

## 🚀 Overview

The Payment Service is built with **Node.js** and **Express**, utilizing **Stripe** for secure payment processing. It supports:
- **Payment Intent Creation**: Securely initiating transactions for patients.
- **Webhook Integration**: Asynchronously handling Stripe events (success, failure, refunds).
- **Automated Invoicing**: Generating professional PDF invoices using `pdfkit`.
- **Refund Management**: Processing partial or full refunds.
- **Role-Based Access Control**: Secure endpoints for Patients, Doctors, and Admins.

## 🛠️ Tech Stack

- **Runtime**: Node.js (Express)
- **Database**: MongoDB (Mongoose)
- **Payment Gateway**: Stripe API
- **Testing**: Jest & Supertest
- **Containerization**: Docker & Kubernetes

## 📦 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB instance (Local or Atlas)
- Stripe Account (API Keys)

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5003
MONGO_URI=mongodb://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=your_secret
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Installation
```bash
npm install
```

### Running the Service
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

### Running Tests
```bash
npm test
```

## 📡 API Endpoints

### Payments
- `POST /api/payments/create-intent` (Patient) - Initialize a Stripe payment.
- `GET /api/payments/history` (Patient) - View own transaction history.
- `GET /api/payments/admin/all` (Admin) - View and filter all transactions.
- `GET /api/payments/appointment/:appointmentId` (Authorized) - Get payment status for a booking.
- `GET /api/payments/invoices/:transactionId` (Authorized) - Download PDF invoice.

### Refunds
- `POST /api/refunds` (Patient/Admin) - Request a refund for a transaction.
- `GET /api/refunds/admin/all` (Admin) - View all refund requests.

## 🐳 Docker & Kubernetes

### Docker Build
```bash
docker build -t payment-service .
```

### Kubernetes Deploy
```bash
kubectl apply -f k8s/deployment.yaml
```

---
*Developed for SE3020 – Distributed Systems Assignment.*
