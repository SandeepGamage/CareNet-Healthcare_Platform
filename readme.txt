========================================================================
                      CARENET HEALTHCARE PLATFORM
        DEPLOYMENT & RUN GUIDE (SE3020 - DISTRIBUTED SYSTEMS)
========================================================================

CareNet is a cloud-native healthcare platform implemented using a microservices
architecture with Express.js backend services, a React frontend application, 
API Gateway routing, MongoDB databases, and message broker integration.

This guide provides steps to run the application using either Docker Compose 
(recommended for quick evaluation) or Kubernetes (via Minikube).

------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------
- Node.js (v18+)
- Docker Desktop (with Kubernetes enabled) or Minikube
- Git

------------------------------------------------------------------------
1. RUNNING LOCALLY WITH DOCKER COMPOSE
------------------------------------------------------------------------
Docker Compose starts all 9 backend microservices, RabbitMQ, and the React frontend.

Step 1: Open terminal in the project root directory.
Step 2: Start the services by running:
    docker-compose up --build

    (To run in detached/background mode, use: docker-compose up --build -d)

Step 3: Access the platform:
    - Frontend Application: http://localhost:3000
    - API Gateway:          http://localhost:8080
    - RabbitMQ Dashboard:   http://localhost:15672 (Credentials: guest / guest)

Step 4: Stop the environment:
    docker-compose down

    (To stop and destroy volumes to clean the databases, use: docker-compose down -v)

------------------------------------------------------------------------
2. DEPLOYING TO KUBERNETES (MINIKUBE / DOCKER DESKTOP)
------------------------------------------------------------------------
A helper script is provided (`start.bat`) to automate the build, deploy, 
and port-forwarding process.

Using the startup script (Windows):
Step 1: Run the `start.bat` script in the root directory.
Step 2: Choose option [2] "Deploy to Kubernetes with Minikube".
Step 3: The script will:
        - Start Minikube (using the docker driver).
        - Point the docker shell to Minikube.
        - Build local Docker images for all services.
        - Apply Kubernetes Secrets, Deployments, and Services.
        - Spawn port-forwarding bridge tunnels for local access:
            * API Gateway:          http://localhost:8080
            * Appointment Service:  http://localhost:3004
            * Symptom Service:      http://localhost:3008
            * Payment Service:      http://localhost:3005
            * Frontend Client:      http://localhost:5173
Step 4: Keep the terminal windows open to maintain the port-forward tunnels. 
        Open your browser and navigate to http://localhost:5173 to access the platform.

Deploying manually (All Platforms):
Step 1: Build docker images with appropriate tags:
    docker build -t carenet-appointment-service:1.0 ./backend/appointment-service
    docker build -t carenet-doctor-service:1.0 ./backend/doctor-service
    docker build -t patient-service:latest ./backend/patient-service
    docker build -t symptom-service:latest ./backend/ai-symptom-service
    docker build -t auth-service:latest ./backend/auth-service
    docker build -t api-gateway:latest ./backend/api-gateway
    docker build -t payment-service:latest ./backend/payment-service
    docker build -t notification-service:latest ./backend/notification-service
    docker build -t carenet-frontend:latest ./frontend

Step 2: Apply deployments and services:
    kubectl apply -f k8s/deployments/
    kubectl apply -f k8s/services/

Step 3: Port-forward backend services for local frontend interaction:
    kubectl port-forward svc/api-gateway 8080:8080
    kubectl port-forward svc/appointment-service 3004:3004
    kubectl port-forward svc/symptom-service 3008:3008
    kubectl port-forward svc/payment-service 3005:5003
    kubectl port-forward svc/frontend 5173:5173

------------------------------------------------------------------------
3. PROJECT CONFIGURATION & ENVIRONMENT VARIABLES
------------------------------------------------------------------------
- Databases: The platform connects to cloud-hosted MongoDB Atlas.
- API Key Settings: Environment variables are packaged inside the respective 
  Kubernetes secrets files (e.g., `appointment-secret.yaml`, `doctor-secret.yaml`,
  `patient-secret.yaml`, and `payment-service.yaml` under `k8s/deployments/`).
- If you run the services outside Docker, copy the `.env.example` in each service 
  directory to `.env` and fill in the necessary tokens.
