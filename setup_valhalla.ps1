# LANES Valhalla Setup Script (Windows PowerShell)
# This script downloads the latest Philippines OpenStreetMap data and places it in the correct directory.
# The Valhalla Docker container will automatically build the routing graph from this file on its first run.

$ErrorActionPreference = "Stop"

$DataDir = "$PSScriptRoot\data\valhalla\custom_files"
$PbfUrl = "https://download.geofabrik.de/asia/philippines-latest.osm.pbf"
$PbfFile = "$DataDir\philippines-latest.osm.pbf"

Write-Host "Creating data directory at $DataDir..." -ForegroundColor Cyan
if (!(Test-Path -Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}

if (!(Test-Path -Path $PbfFile)) {
    Write-Host "Downloading OpenStreetMap data for the Philippines (this may take a while)..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $PbfUrl -OutFile $PbfFile
    Write-Host "Download complete!" -ForegroundColor Green
} else {
    Write-Host "PBF file already exists. Skipping download." -ForegroundColor Green
}

Write-Host "Valhalla data is ready!" -ForegroundColor Green
Write-Host "You can now start the Valhalla routing engine by running: docker-compose up -d" -ForegroundColor Green
Write-Host "Note: On the first boot, Valhalla will take several minutes to build the routing graph from the PBF file." -ForegroundColor Yellow
