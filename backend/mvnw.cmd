@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper Startup Batch script
@REM ----------------------------------------------------------------------------
@echo off
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

if exist %WRAPPER_JAR% (
    java "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" -cp %WRAPPER_JAR% %WRAPPER_LAUNCHER% %*
) else (
    echo Maven wrapper jar not found at %WRAPPER_JAR%
    exit /b 1
)
