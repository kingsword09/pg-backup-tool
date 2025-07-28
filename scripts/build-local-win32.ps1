# Windows local build script for pg-backup-tool (PowerShell version)
# This script sets up PostgreSQL binaries for Windows local development

param(
    [string]$PlatformId = $env:id,
    [string]$Target = $env:target
)

Write-Host "Starting Windows local build..." -ForegroundColor Green
Write-Host "Building for platform: $PlatformId"
Write-Host "Target: $Target"

# Get script directory and root directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

# Create build directory
$BuildDir = Join-Path $RootDir "node_modules\.build"
if (!(Test-Path $BuildDir)) {
    New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null
}

# Create artifact directory structure
$ArtifactDir = Join-Path $BuildDir "pg-tools-v-local-$PlatformId"
$BinDir = Join-Path $ArtifactDir "bin"
$LibDir = Join-Path $ArtifactDir "lib"

@($ArtifactDir, $BinDir, $LibDir) | ForEach-Object {
    if (!(Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "Windows Local Build Setup"
Write-Host "========================================"
Write-Host ""

# Check if we already have binaries in the npm packages
$NpmBinDir = Join-Path $RootDir "npm\windows-x64\bin"
$PgDumpPath = Join-Path $NpmBinDir "pg_dump.exe"

if (Test-Path $PgDumpPath) {
    Write-Host "Found existing Windows binaries in npm packages" -ForegroundColor Green
    Write-Host "Copying to artifact directory..."

    # Copy binaries
    Copy-Item "$NpmBinDir\*" $BinDir -Force

    # Copy libraries if they exist
    $NpmLibDir = Join-Path $RootDir "npm\windows-x64\lib"
    if (Test-Path $NpmLibDir) {
        Copy-Item "$NpmLibDir\*" $LibDir -Recurse -Force
    }

    Write-Host "Windows binaries copied successfully" -ForegroundColor Green
} else {
    Write-Host "No pre-built Windows binaries found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For Windows development, you have these options:"
    Write-Host "1. Ensure the @pg-ts/pg-backup-tool-windows-x64 package is installed"
    Write-Host "2. Download PostgreSQL from: https://www.postgresql.org/download/windows/"
    Write-Host "3. Extract pg_dump.exe and pg_restore.exe to: $BinDir"
    Write-Host "4. Copy required DLLs to: $LibDir"
}

Write-Host ""
Write-Host "Windows build setup completed" -ForegroundColor Green
Write-Host "Artifact directory: $ArtifactDir"

# Verify binaries exist
$FinalPgDump = Join-Path $BinDir "pg_dump.exe"
$FinalPgRestore = Join-Path $BinDir "pg_restore.exe"

if ((Test-Path $FinalPgDump) -and (Test-Path $FinalPgRestore)) {
    Write-Host "✅ Both pg_dump.exe and pg_restore.exe are available" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some binaries are missing:" -ForegroundColor Yellow
    if (!(Test-Path $FinalPgDump)) { Write-Host "  - pg_dump.exe not found" }
    if (!(Test-Path $FinalPgRestore)) { Write-Host "  - pg_restore.exe not found" }
}
