@echo off
echo VOG Tekstil Deployment Helper
echo ----------------------------
echo 1. Installing dependencies...
call npm install
echo ----------------------------
echo 2. Running license check...
node src/services/licenseService.js
echo ----------------------------
echo Ready to serve from 'dist' folder.
pause
