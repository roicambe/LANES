# LANES OSRM Setup Script (Windows PowerShell)
# This script downloads the latest Philippines OpenStreetMap data and builds the OSRM routing graph using MLD (Multi-Level Dijkstra).

$ErrorActionPreference = "Stop"

$DataDir = "$PSScriptRoot\data\osrm"
$PbfUrl = "https://download.geofabrik.de/asia/philippines-latest.osm.pbf"
$PbfFile = "$DataDir\philippines-latest.osm.pbf"

Write-Host "Creating data directory at $DataDir..." -ForegroundColor Cyan
if (!(Test-Path -Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir | Out-Null
}

if (!(Test-Path -Path $PbfFile)) {
    Write-Host "Downloading OpenStreetMap data for the Philippines (this may take a while)..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $PbfUrl -OutFile $PbfFile
    Write-Host "Download complete!" -ForegroundColor Green
} else {
    Write-Host "PBF file already exists. Skipping download." -ForegroundColor Green
}

Write-Host "Extracting graph (osrm-extract)..." -ForegroundColor Cyan
docker run -t -v "$DataDir`:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/philippines-latest.osm.pbf

Write-Host "Partitioning graph for MLD (osrm-partition)..." -ForegroundColor Cyan
docker run -t -v "$DataDir`:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/philippines-latest.osrm

Write-Host "Customizing graph for MLD (osrm-customize)..." -ForegroundColor Cyan
docker run -t -v "$DataDir`:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/philippines-latest.osrm

Write-Host "OSRM Graph successfully built!" -ForegroundColor Green
Write-Host "You can now start OSRM by running: docker-compose up -d" -ForegroundColor Green
