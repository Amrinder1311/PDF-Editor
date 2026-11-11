@echo off
REM Rebuilds dist\app.bundle.js after you edit files in js\
REM Needs Node.js (https://nodejs.org). First run downloads esbuild automatically.
cd /d "%~dp0"
call npx --yes esbuild@0.24.0 js/app.js --bundle --format=iife --target=es2020 --outfile=dist/app.bundle.js
echo.
echo Done. Refresh index.html in your browser.
pause
