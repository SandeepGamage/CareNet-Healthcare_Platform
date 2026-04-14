@echo off
SETLOCAL EnableDelayedExpansion
title CareNet Healthcare Platform Setup

:MENU
cls
echo ==========================================================
echo        CARENET HEALTHCARE PLATFORM - STARTUP SCRIPT
echo ==========================================================
echo.
echo Please choose how you want to run the project:
echo.
echo   [1] Run locally with Docker Compose (Faster for coding)
echo   [2] Deploy to locally Kubernetes with Minikube (Production-like)
echo   [3] Stop Docker Compose services
echo   [4] Stop Minikube Cluster
echo   [5] Restart Kubernetes Bridges (Fix connection errors)
   [6] Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto DOCKER_START
if "%choice%"=="2" goto MINIKUBE_START
if "%choice%"=="3" goto DOCKER_STOP
if "%choice%"=="4" goto MINIKUBE_STOP
if "%choice%"=="5" goto RESTART_BRIDGES
if "%choice%"=="6" goto EXIT
echo Invalid choice! Try again.
timeout /t 2 >nul
goto MENU

:: =======================================
:: 1. DOCKER COMPOSE ROUTE
:: =======================================
:DOCKER_START
cls
echo [ Starting Environment with Docker Compose ]
echo.
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running! Please start Docker Desktop.
    pause
    goto MENU
)

set SERVICES=mongodb rabbitmq appointment-service symptom-service payment-service notification-service frontend auth-service api-gateway
echo Starting all services...
docker-compose up -d
echo.
echo [SUCCESS] Your services are running locally!
echo - Gateway:     http://localhost:8000
echo - Frontend:    http://localhost:5173
echo - RabbitMQ UI: http://localhost:15672 (guest/guest)
echo - MongoDB:     localhost:27017
echo.
echo You can use 'docker-compose logs -f' in another terminal to view logs.
pause
goto MENU

:DOCKER_STOP
cls
echo [ Stopping Docker Compose Services ]
docker-compose down
echo.
echo Services stopped!
pause
goto MENU

:: =======================================
:: 2. MINIKUBE / KUBERNETES ROUTE
:: =======================================
:MINIKUBE_START
cls
echo [ Starting Environment with Minikube (Kubernetes) ]
echo.
minikube status | findstr /i "Running" >nul
if %errorlevel% neq 0 (
    echo Starting Minikube cluster...
    minikube start --driver=docker
) else (
    echo Minikube is already running!
)

echo.
echo Connecting Docker to Minikube's internal registry...
@FOR /f "tokens=*" %%i IN ('minikube -p minikube docker-env --shell cmd') DO @%%i

echo Building Docker images inside Minikube (This might take a minute)...
docker build -t carenet-appointment-service:1.0 ./backend/appointment-service
docker build -t symptom-service:latest ./backend/ai-symptom-service
docker build -t auth-service:latest ./backend/auth-service
docker build -t api-gateway:latest ./backend/api-gateway
docker build -t patient-service:latest ./backend/patient-service
@REM docker build -t doctor-service:latest ./backend/doctor-service
docker build -t payment-service:latest ./backend/payment-service
docker build -t notification-service:latest ./backend/notification-service
@REM docker build -t telemedicine-service:latest ./backend/telemedicine-service
@REM Build the frontend image without cache to ensure .env changes are picked up
docker build --no-cache -t carenet-frontend:latest ./frontend

echo.
echo Applying Kubernetes Manifests...
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/

echo.
echo Waiting for core services to be ready...
kubectl wait --for=condition=available deployment/api-gateway --timeout=90s
kubectl wait --for=condition=available deployment/auth-service --timeout=90s
kubectl wait --for=condition=available deployment/frontend --timeout=90s

echo.
echo Opening Bridge Connections to Kubernetes...
start cmd /k "title CareNet Gateway Bridge && echo [*] Gateway Bridge... && kubectl port-forward svc/api-gateway 8000:8080"
start cmd /k "title CareNet Backend Bridge && echo [*] Core Services... && kubectl port-forward svc/appointment-service 3004:3004"
start cmd /k "title CareNet AI Bridge && echo [*] Symptom Checker... && kubectl port-forward svc/symptom-service 3008:3008"
echo (Three terminal windows are opening to link your localhost to the cluster.)
timeout /t 3 >nul

echo.
echo [SUCCESS] Deployment applied to Kubernetes!
echo To open the frontend in your browser natively, opening now...
minikube service frontend
echo.

pause
goto MENU

:MINIKUBE_STOP
cls
echo [ Stopping Minikube Cluster ]
minikube stop
echo.
echo Minikube stopped!
pause
goto MENU

:RESTART_BRIDGES
cls
echo [ Restarting Kubernetes Bridge Connections ]
echo.
start cmd /k "title CareNet Gateway Bridge && echo [*] Gateway Bridge... && kubectl port-forward svc/api-gateway 8000:8080"
start cmd /k "title CareNet Backend Bridge && echo [*] Core Services... && kubectl port-forward svc/appointment-service 3004:3004"
start cmd /k "title CareNet AI Bridge && echo [*] Symptom Checker... && kubectl port-forward svc/symptom-service 3008:3008"
echo.
echo Bridges have been triggered! 
echo Check for three new terminal windows.
timeout /t 3 >nul
goto MENU

:EXIT
echo Goodbye!
exit /b
