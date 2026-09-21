@echo off
echo =================================================================
echo   Testing & Verifying QuakeGuard AI Microservices Status
echo =================================================================
echo.

powershell -Command "^
$services = @(^
    @{ name='API Gateway Router'; url='http://localhost:8080/api/users' },^
    @{ name='User & Auth Service'; url='http://localhost:8081/api/users' },^
    @{ name='OTP & Support Service'; url='http://localhost:8082/api/support-tickets' },^
    @{ name='Assessment & Dual Verification Service'; url='http://localhost:8083/api/assessments' },^
    @{ name='Notification & Alerts Service'; url='http://localhost:8084/api/notifications' }^
);^
foreach ($s in $services) {^
    try {^
        $res = Invoke-RestMethod -Uri $s.url -Method Get -TimeoutSec 3;^
        Write-Host ('[ONLINE] ' + $s.name + ' -> Operational (200 OK)') -ForegroundColor Green;^
    } catch {^
        Write-Host ('[OFFLINE] ' + $s.name + ' -> Not started yet on port (' + $s.url + ')') -ForegroundColor Yellow;^
    }^
}"

echo.
echo =================================================================
echo Verification complete. Run 'run-all-microservices.bat' to start!
echo =================================================================
pause
