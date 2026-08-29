@echo off
echo =======================================
echo Building Next.js Web Assets...
echo =======================================
call npm run build
if %errorlevel% neq 0 (
    echo =======================================
    echo ERROR: Web build failed! Aborting APK build.
    echo =======================================
    exit /b %errorlevel%
)

echo =======================================
echo Syncing Assets with Capacitor...
echo =======================================
call npx cap sync
if %errorlevel% neq 0 (
    echo =======================================
    echo ERROR: Capacitor sync failed! Aborting APK build.
    echo =======================================
    exit /b %errorlevel%
)

echo =======================================
echo Cleaning and Compiling Android APK...
echo =======================================
cd android
call gradlew.bat clean
if %errorlevel% neq 0 (
    echo =======================================
    echo ERROR: Gradle clean failed! Aborting APK build.
    echo =======================================
    exit /b %errorlevel%
)

call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo =======================================
    echo ERROR: Gradle compilation failed!
    echo =======================================
    exit /b %errorlevel%
)

echo =======================================
echo Build Finished Successfully!
echo =======================================
