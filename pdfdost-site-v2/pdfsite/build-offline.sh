#!/bin/sh
# Rebuilds dist/app.bundle.js after you edit files in js/ (needs Node.js)
cd "$(dirname "$0")" && npx --yes esbuild@0.24.0 js/app.js --bundle --format=iife --target=es2020 --outfile=dist/app.bundle.js
