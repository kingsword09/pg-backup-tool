@echo off
REM Windows local build script for pg-backup-tool
REM This script sets up PostgreSQL binaries for Windows local development

echo Starting Windows local build...

REM Set environment variables from the calling script
set PLATFORM_ID=%id%
set TARGET=%target%

echo Building for platform: %PLATFORM_ID%
echo Target: %TARGET%

REM Create build directory
set BUILD_DIR=%~dp0..\node_modules\.build
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

REM Create artifact directory structure
set ARTIFACT_DIR=%BUILD_DIR%\pg-tools-v-local-%PLATFORM_ID%
if not exist "%ARTIFACT_DIR%" mkdir "%ARTIFACT_DIR%"
if not exist "%ARTIFACT_DIR%\bin" mkdir "%ARTIFACT_DIR%\bin"
if not exist "%ARTIFACT_DIR%\lib" mkdir "%ARTIFACT_DIR%\lib"

echo.
echo ========================================
echo Windows Local Build Setup
echo ========================================
echo.
echo For Windows development, you have two options:
echo.
echo 1. Use existing pre-built binaries from npm packages
echo    - Run: pnpm install
echo    - The Windows binaries should be available in node_modules
echo.
echo 2. Download PostgreSQL binaries manually:
echo    - Download PostgreSQL from: https://www.postgresql.org/download/windows/
echo    - Extract pg_dump.exe and pg_restore.exe to: %ARTIFACT_DIR%\bin\
echo    - Copy required DLLs to: %ARTIFACT_DIR%\lib\
echo.
echo Current artifact directory: %ARTIFACT_DIR%
echo.

REM Check if we already have binaries in the npm packages
set NPM_BIN_DIR=%~dp0..\npm\windows-x64\bin
if exist "%NPM_BIN_DIR%\pg_dump.exe" (
    echo Found existing Windows binaries in npm packages
    echo Copying to artifact directory...
    copy "%NPM_BIN_DIR%\*" "%ARTIFACT_DIR%\bin\" >nul 2>&1

    set NPM_LIB_DIR=%~dp0..\npm\windows-x64\lib
    if exist "%NPM_LIB_DIR%" (
        xcopy "%NPM_LIB_DIR%\*" "%ARTIFACT_DIR%\lib\" /E /I /Q >nul 2>&1
    )

    echo Windows binaries copied successfully
) else (
    echo No pre-built Windows binaries found
    echo Please ensure the @pg-ts/pg-backup-tool-windows-x64 package is installed
    echo Or manually place pg_dump.exe and pg_restore.exe in: %ARTIFACT_DIR%\bin\
)

echo.
echo Windows build setup completed
echo Artifact directory: %ARTIFACT_DIR%
