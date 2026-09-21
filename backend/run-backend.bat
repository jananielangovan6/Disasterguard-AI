@echo off
echo ========================================================
echo   Starting QuakeGuard AI Database Backend (Spring Boot)
echo ========================================================
cd /d "%~dp0"
call "%~dp0mvnw.cmd" spring-boot:run
pause
