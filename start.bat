@echo off
SETLOCAL EnableDelayedExpansion
title CareNet Healthcare Platform Setup

:MENU
cls
echo ==========================================================
echo        CARENET HEALTHCARE PLATFORM - STARTUP SCRIPT
echo ==========================================================
echo.
echo   [1] Run locally with Docker Compose (Fast Dev)
echo   [2] Deploy to Kubernetes with Minikube
echo   [3] Stop Docker Compose (Remove volumes)
echo   [4] Stop Minikube Cluster
echo   [5] Restart Kubernetes Bridges
echo   [6] Cleanup Disk (Recommended)
echo   [7] Check Docker Disk Usage
echo   [8] Exit
echo.
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto DOCKER_START
if "%choice%"=="2" goto MINIKUBE_START
if "%choice%"=="3" goto DOCKER_STOP
if "%choice%"=="4" goto MINIKUBE_STOP
if "%choice%"=="5" goto RESTART_BRIDGES
if "%choice%"=="6" goto CLEANUP
if "%choice%"=="7" goto CHECK_DISK
if "%choice%"=="8" goto EXIT

echo Invalid choice!
timeout /t 2 >nul
goto MENU

:: =======================================
:: DOCKER COMPOSE
:: =======================================
:DOCKER_START
cls
echo [ Starting Docker Compose Environment ]
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    pause
    goto MENU
)

echo Starting services...
:: Clear any remote Docker host variables so we use the local Docker daemon
set DOCKER_HOST=
set DOCKER_TLS_VERIFY=
set DOCKER_CERT_PATH=
docker-compose up -d

echo.
echo [SUCCESS] Running!
echo Gateway:  http://localhost:8000
echo Frontend: http://localhost:5173
echo RabbitMQ: http://localhost:15672 (guest/guest)
pause
goto MENU

:DOCKER_STOP
cls
echo [ Stopping Docker Compose + Removing Volumes ]
:: Clear any remote Docker host variables before stopping local compose
set DOCKER_HOST=
set DOCKER_TLS_VERIFY=
set DOCKER_CERT_PATH=
docker-compose down -v
echo Done!
pause
goto MENU

:: =======================================
:: MINIKUBE
:: =======================================
:MINIKUBE_START
cls
echo [ Starting Minikube ]

minikube status | findstr /i "Running" >nul
if %errorlevel% neq 0 (
    minikube start --driver=docker
) else (
    echo Minikube already running
)

echo.
echo Linking Docker to Minikube...
@FOR /f "tokens=*" %%i IN ('minikube -p minikube docker-env --shell cmd') DO @%%i

:: Ensure .env files exist by copying from .env.example when missing
echo Checking for .env files from .env.example...
if exist ".env.example" (
    if not exist ".env" (
        copy ".env.example" ".env" >nul
        echo Created root .env from .env.example
    )
)

for /d %%D in (*) do (
    if exist "%%D\.env.example" (
        if not exist "%%D\.env" (
            copy "%%D\.env.example" "%%D\.env" >nul
            echo Created %%D\.env from %%D\.env.example
        )
    )
)

docker-compose up -d
echo [INFO] Building images...

:: Core Services
docker image inspect carenet-appointment-service:1.0 >nul 2>&1 || docker build -t carenet-appointment-service:1.0 ./backend/appointment-service
docker image inspect carenet-doctor-service:1.0 >nul 2>&1 || docker build -t carenet-doctor-service:1.0 ./backend/doctor-service
docker image inspect patient-service:latest >nul 2>&1 || docker build -t patient-service:latest ./backend/patient-service
docker image inspect symptom-service:latest >nul 2>&1 || docker build -t symptom-service:latest ./backend/ai-symptom-service
docker image inspect auth-service:latest >nul 2>&1 || docker build -t auth-service:latest ./backend/auth-service
docker image inspect api-gateway:latest >nul 2>&1 || docker build -t api-gateway:latest ./backend/api-gateway
docker image inspect payment-service:latest >nul 2>&1 || docker build -t payment-service:latest ./backend/payment-service
docker image inspect notification-service:latest >nul 2>&1 || docker build -t notification-service:latest ./backend/notification-service

:: Optimized Frontend Build (Uses relative /api proxy)
echo [FORCE] Cleaning .env and rebuilding frontend with internal proxy routing...
if exist "frontend\.env" del "frontend\.env"
docker build --build-arg VITE_API_BASE_URL=/api -t carenet-frontend:latest ./frontend

echo.
echo Applying Kubernetes configs...
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/

echo Waiting for pods to initialize...
kubectl wait --for=condition=available deployment/frontend --timeout=90s

echo.
echo [SUCCESS] Deployment complete!
echo.
echo ==========================================================
echo   IMPORTANT: Windows + Docker Driver detected.
echo   I am opening a terminal to bridge the connection.
echo   KEEP THAT WINDOW OPEN while using the website!
echo ==========================================================
echo.
echo Finalizing...
start cmd /k "title CareNet Service Tunnel && echo [*] Tunneling Frontend... && minikube service frontend"

timeout /t 5 >nul
goto MENU

:MINIKUBE_STOP
cls
echo [ Stopping Minikube ]
minikube stop
pause
goto MENU

:: =======================================
:: RESTART BRIDGES
:: =======================================
:RESTART_BRIDGES
cls
echo Restarting service tunnel...
start cmd /k "title CareNet Service Tunnel && minikube service frontend"
pause
goto MENU

:: =======================================
:: CLEANUP (IMPORTANT)
:: =======================================
:CLEANUP
cls
echo [ Cleaning Docker System ]
:: Clear remote Docker host vars to ensure prune targets local daemon
set DOCKER_HOST=
set DOCKER_TLS_VERIFY=
set DOCKER_CERT_PATH=
docker system prune -a -f

echo.
echo [ Cleaning Volumes ]
docker volume prune -f

echo Cleanup complete!
pause
goto MENU

:: =======================================
:: CHECK DISK USAGE
:: =======================================
:CHECK_DISK
cls
echo [ Docker Disk Usage ]
docker system df
pause
goto MENU

:EXIT
echo Goodbye!
exit /b