@echo off
echo ================================================================
echo   Launching 4 QuakeGuard AI Microservices + API Gateway
echo ================================================================

start "User Service (8081)" cmd /k "cd /d %~dp0user-service && mvnw spring-boot:run"
start "OTP & Support Service (8082)" cmd /k "cd /d %~dp0otp-support-service && mvnw spring-boot:run"
start "Assessment Service (8083)" cmd /k "cd /d %~dp0assessment-service && mvnw spring-boot:run"
start "Notification Service (8084)" cmd /k "cd /d %~dp0notification-service && mvnw spring-boot:run"
start "API Gateway Router (8080)" cmd /k "cd /d %~dp0api-gateway && mvnw spring-boot:run"

echo.
echo All 4 Microservices + API Gateway launched in background windows!
echo API Gateway listening on http://localhost:8080
pause
