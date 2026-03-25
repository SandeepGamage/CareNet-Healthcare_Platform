# 🏥 CareNet — AI-Enabled Smart Healthcare Platform

<div align="center">

![CareNet Banner](https://img.shields.io/badge/CareNet-Healthcare%20Platform-blue?style=for-the-badge&logo=heart&logoColor=white)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Enabled-326CE5?style=flat-square&logo=kubernetes&logoColor=white)](https://kubernetes.io)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**A cloud-native telemedicine platform built with microservices architecture**

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Docs](#-api-documentation) • [Deployment](#-deployment) • [Team](#-team)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Team](#-team)

---

## 🌟 Overview

CareNet is a **cloud-native healthcare appointment and telemedicine platform** built using a microservices architecture. It enables patients to book doctor appointments, attend video consultations, upload medical reports, and receive AI-based preliminary health suggestions.

> 📚 Built as part of **SE3020 – Distributed Systems** | BSc (Hons) in Information Technology | SLIIT | Year 3 Semester 1 — 2026

---

## ✨ Features

| Feature | Description |
|---|---|
| 👤 **Patient Management** | Register, manage profile, upload medical reports, view history |
| 👨‍⚕️ **Doctor Management** | Manage availability, accept/reject appointments, issue prescriptions |
| 📅 **Appointment Booking** | Search doctors, book/modify/cancel appointments, real-time status |
| 🎥 **Video Consultations** | Secure telemedicine sessions via Jitsi Meet |
| 💳 **Payments** | Online consultation fee payments via Stripe sandbox |
| 🔔 **Notifications** | Email and SMS confirmations via SendGrid and Twilio |
| 🤖 **AI Symptom Checker** | AI-powered preliminary health suggestions using OpenAI |
| 🔐 **Authentication** | JWT-based auth with three roles: Patient, Doctor, Admin |

---

## 🏗 Architecture

```
                        ┌─────────────────────┐
                        │   React Frontend     │
                        │   localhost:3000     │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │     API Gateway      │
                        │    localhost:8080    │
                        │  JWT Auth + Routing  │
                        └──────────┬──────────┘
                                   │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────▼────────┐   ┌──────────▼─────────┐   ┌──────────▼─────────┐
│   auth-service   │   │  patient-service   │   │  doctor-service    │
│   port: 3001     │   │   port: 3002       │   │   port: 3003       │
└──────────────────┘   └────────────────────┘   └────────────────────┘
          │                       │                        │
┌─────────▼────────┐   ┌──────────▼─────────┐   ┌──────────▼─────────┐
│appointment-svc   │   │  payment-service   │   │notification-svc    │
│   port: 3004     │   │   port: 3005       │   │   port: 3006       │
└──────────────────┘   └────────────────────┘   └────────────────────┘
          │                       │                        │
┌─────────▼────────┐   ┌──────────▼─────────┐              │
│telemedicine-svc  │   │  ai-symptom-svc    │   ┌──────────▼─────────┐
│   port: 3007     │   │   port: 3008       │   │     RabbitMQ       │
└──────────────────┘   └────────────────────┘   │   port: 5672       │
                                                 └────────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │    MongoDB Atlas    │
                        │  (one DB per service)│
                        └─────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js 18
- **Framework:** Express.js
- **Database:** MongoDB Atlas (one database per service)
- **Authentication:** JWT (JSON Web Tokens)
- **Message Broker:** RabbitMQ (async notifications)
- **Password Hashing:** bcryptjs

### Frontend
- **Framework:** React 18
- **HTTP Client:** Axios
- **Routing:** React Router DOM
- **UI Library:** Material UI

### DevOps
- **Containerization:** Docker + Docker Compose
- **Orchestration:** Kubernetes
- **Registry:** Docker Hub

### Third-party Services
- **Video:** Jitsi Meet
- **Payments:** Stripe (sandbox)
- **Email:** SendGrid / Nodemailer
- **SMS:** Twilio
- **AI:** OpenAI GPT API

---

## 📁 Project Structure

```
CareNet-Healthcare_Platform/
│
├── backend/
│   ├── api-gateway/                # Entry point — JWT check + routing
│   │   ├── index.js
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── auth-service/               # Login, register, JWT issuing
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   └── routes/
│   │   ├── index.js
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── patient-service/            # Patient profiles, reports, history
│   ├── doctor-service/             # Doctor profiles, availability
│   ├── appointment-service/        # Booking, cancellation, status
│   ├── payment-service/            # Stripe payment integration
│   ├── notification-service/       # Email + SMS via RabbitMQ
│   ├── telemedicine-service/       # Jitsi video session management
│   └── ai-symptom-service/         # OpenAI symptom analysis
│
├── frontend/                       # React application
│   └── src/
│
├── k8s/                            # Kubernetes manifests
│   ├── deployments/
│   └── services/
│
├── docker-compose.yml              # Run entire stack locally
├── members.txt
├── submission.txt
├── readme.txt
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Docker Desktop | Latest | [docker.com](https://www.docker.com) |
| Git | Latest | [git-scm.com](https://git-scm.com) |

### 1. Clone the repository

```bash
git clone https://github.com/your-username/CareNet-Healthcare_Platform.git
cd CareNet-Healthcare_Platform
```

### 2. Set up environment variables

Each service needs a `.env` file. Copy the example below into each service folder:

**`backend/appointment-service/.env`**
```env
PORT=3004
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/appointment_db
JWT_SECRET=healthcare_super_secret_key_2026
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

> ⚠️ **Never commit `.env` files to GitHub.** They are already listed in `.gitignore`.

Repeat for each service — see [Environment Variables](#-environment-variables) section for the full list.

### 3. Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up --build -d

# View logs
docker-compose logs -f appointment-service

# Stop all services
docker-compose down
```

### 4. Verify everything is running

```bash
docker ps
```

You should see all services with status `Up`:

| Container | Port |
|---|---|
| api-gateway | 8080 |
| auth-service | 3001 |
| patient-service | 3002 |
| doctor-service | 3003 |
| appointment-service | 3004 |
| payment-service | 3005 |
| notification-service | 3006 |
| telemedicine-service | 3007 |
| ai-symptom-service | 3008 |
| rabbitmq | 5672, 15672 |

### 5. Access the application

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost:3000 |
| 🔀 API Gateway | http://localhost:8080 |
| 🐇 RabbitMQ Dashboard | http://localhost:15672 (guest / guest) |

---

## 📖 API Documentation

All requests go through the **API Gateway at port 8080**.  
Protected routes require a `Bearer` token in the `Authorization` header.

### Auth Service `/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login and get JWT token |
| GET | `/auth/me` | ✅ | Get current user info |

**Register example:**
```json
POST /auth/register
{
  "fullName": "Sandeepa Silva",
  "email": "sandeepa@gmail.com",
  "password": "securepass123",
  "phone": "0771234567",
  "role": "PATIENT"
}
```

---

### Appointment Service `/api/appointments`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/appointments` | PATIENT | Book new appointment |
| GET | `/api/appointments/my` | PATIENT | View my appointments |
| GET | `/api/appointments/doctor` | DOCTOR | View assigned appointments |
| GET | `/api/appointments/slots` | ANY | Get available time slots |
| GET | `/api/appointments/all` | ADMIN | View all appointments |
| GET | `/api/appointments/:id` | ANY | Get single appointment |
| PATCH | `/api/appointments/:id/status` | DOCTOR/ADMIN | Update status |
| DELETE | `/api/appointments/:id` | PATIENT | Cancel appointment |

**Book appointment example:**
```json
POST /api/appointments
Authorization: Bearer <patient_token>

{
  "doctorId": "doc001",
  "doctorName": "Dr. Kamal Perera",
  "specialty": "Cardiology",
  "appointmentDate": "2026-04-15",
  "timeSlot": "09:00 - 09:30",
  "type": "TELEMEDICINE",
  "reason": "Chest pain and shortness of breath",
  "consultationFee": 2500,
  "patientName": "Sandeepa Silva",
  "patientEmail": "sandeepa@gmail.com"
}
```

**Appointment status flow:**
```
PENDING → CONFIRMED → COMPLETED
              ↓
          CANCELLED
```

---

### Patient Service `/api/patients`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/patients/:id` | PATIENT | Get patient profile |
| PUT | `/api/patients/:id` | PATIENT | Update profile |
| POST | `/api/patients/:id/reports` | PATIENT | Upload medical report |
| GET | `/api/patients/:id/history` | PATIENT | View medical history |

---

### Doctor Service `/api/doctors`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/doctors` | ANY | List all doctors |
| GET | `/api/doctors/:id` | ANY | Get doctor profile |
| PUT | `/api/doctors/:id` | DOCTOR | Update profile |
| POST | `/api/doctors/:id/availability` | DOCTOR | Set availability |
| POST | `/api/doctors/:id/prescriptions` | DOCTOR | Issue prescription |

---

### AI Symptom Service `/api/symptoms`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/symptoms/check` | PATIENT | Analyze symptoms |

```json
POST /api/symptoms/check
{
  "symptoms": "I have a severe headache, fever of 38.5°C, and neck stiffness for 2 days"
}
```

---

## 🐳 Deployment

### Docker Compose (Local)

```bash
# Start everything
docker-compose up --build

# Start specific service only
docker-compose up --build appointment-service

# Rebuild after code changes
docker-compose up --build --force-recreate

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clears all data)
docker-compose down -v
```

### Kubernetes

#### Prerequisites
1. Enable Kubernetes in Docker Desktop → Settings → Kubernetes → Enable Kubernetes
2. Verify: `kubectl get nodes` should show one node as `Ready`
3. Push images to Docker Hub first:

```bash
# Login
docker login

# Tag images
docker tag carenet-healthcare_platform-appointment-service \
  yourusername/appointment-service:latest

# Push
docker push yourusername/appointment-service:latest
```

#### Deploy

```bash
# Apply all manifests
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/

# Watch pods starting up
kubectl get pods --watch

# Check services
kubectl get services

# View logs
kubectl logs deployment/appointment-service

# Access the gateway
kubectl port-forward service/api-gateway 8080:8080
```

#### Useful Kubernetes commands

```bash
# Describe a pod (great for debugging)
kubectl describe pod <pod-name>

# Delete and restart a deployment
kubectl rollout restart deployment/appointment-service

# Scale a service
kubectl scale deployment appointment-service --replicas=3

# Remove everything
kubectl delete -f k8s/
```

---

## 🔐 Authentication

The platform uses **JWT (JSON Web Tokens)** for authentication.

1. Register or login via `/auth/register` or `/auth/login`
2. Receive a JWT token in the response
3. Include the token in all subsequent requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Roles

| Role | Permissions |
|---|---|
| **PATIENT** | Book appointments, upload reports, view prescriptions, attend video calls |
| **DOCTOR** | Manage availability, confirm appointments, issue prescriptions, view patient records |
| **ADMIN** | Manage all users, verify doctors, oversee all operations |

---

## 🔧 Environment Variables

### Common to all services
```env
JWT_SECRET=healthcare_super_secret_key_2026
```

### Per-service variables

<details>
<summary>auth-service</summary>

```env
PORT=3001
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/auth_db
JWT_SECRET=healthcare_super_secret_key_2026
JWT_EXPIRES_IN=24h
```
</details>

<details>
<summary>appointment-service</summary>

```env
PORT=3004
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/appointment_db
JWT_SECRET=healthcare_super_secret_key_2026
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```
</details>

<details>
<summary>payment-service</summary>

```env
PORT=3005
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/payment_db
JWT_SECRET=healthcare_super_secret_key_2026
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
```
</details>

<details>
<summary>notification-service</summary>

```env
PORT=3006
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
TWILIO_SID=ACxxxxxxx
TWILIO_TOKEN=xxxxxxx
TWILIO_PHONE=+1234567890
```
</details>

<details>
<summary>ai-symptom-service</summary>

```env
PORT=3008
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
JWT_SECRET=healthcare_super_secret_key_2026
```
</details>

---

## 🧪 Testing

### Generate test JWT tokens

```bash
cd backend/appointment-service
node generate-token.js
```

This outputs PATIENT, DOCTOR, and ADMIN tokens for Postman testing.

### Postman Collection

Import the collection and set these environment variables in Postman:

| Variable | Value |
|---|---|
| `base_url` | `http://localhost:8080` |
| `patient_token` | *(from generate-token.js)* |
| `doctor_token` | *(from generate-token.js)* |
| `admin_token` | *(from generate-token.js)* |
| `appointment_id` | *(from POST response)* |

---

## 📄 License

This project is for academic purposes — **SE3020 Distributed Systems, SLIIT 2026**.

---

<div align="center">
Made with ❤️ by Team CareNet — SLIIT Y3S1 2026
</div>
