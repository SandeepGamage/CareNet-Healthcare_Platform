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

echo.
echo [INFO] Building images ONLY if not exists...

docker image inspect carenet-appointment-service:1.0 >nul 2>&1 || docker build -t carenet-appointment-service:1.0 ./backend/appointment-service
docker image inspect symptom-service:latest >nul 2>&1 || docker build -t symptom-service:latest ./backend/ai-symptom-service
docker image inspect auth-service:latest >nul 2>&1 || docker build -t auth-service:latest ./backend/auth-service
docker image inspect api-gateway:latest >nul 2>&1 || docker build -t api-gateway:latest ./backend/api-gateway
docker image inspect payment-service:latest >nul 2>&1 || docker build -t payment-service:latest ./backend/payment-service
docker image inspect notification-service:latest >nul 2>&1 || docker build -t notification-service:latest ./backend/notification-service
docker image inspect carenet-frontend:latest >nul 2>&1 || docker build -t carenet-frontend:latest ./frontend

echo.
echo Applying Kubernetes configs...
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/

echo Waiting for services...
kubectl wait --for=condition=available deployment/api-gateway --timeout=90s

echo.
echo Opening bridges...
start cmd /k "kubectl port-forward svc/api-gateway 8000:8080"
start cmd /k "kubectl port-forward svc/appointment-service 3004:3004"
start cmd /k "kubectl port-forward svc/symptom-service 3008:3008"

echo.
echo Opening frontend...
minikube service frontend

pause
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
echo Restarting bridges...
start cmd /k "kubectl port-forward svc/api-gateway 8000:8080"
start cmd /k "kubectl port-forward svc/appointment-service 3004:3004"
start cmd /k "kubectl port-forward svc/symptom-service 3008:3008"
pause
goto MENU

:: =======================================
:: CLEANUP (IMPORTANT)
:: =======================================
:CLEANUP
cls
echo [ Cleaning Docker System ]
docker system prune -a -f

echo.
echo [ Cleaning Volumes ]
docker volume prune -f

echo.
echo [ Optional: Delete Minikube cache ]
echo This will REMOVE all Kubernetes data!
set /p confirm="Delete Minikube? (y/n): "
if /i "%confirm%"=="y" (
    minikube delete
)

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