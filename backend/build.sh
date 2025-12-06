#!/bin/bash
echo "Starting TypeScript build with verbose output..."
echo "Cleaning dist directory..."
rm -rf dist

echo "TypeScript version: $(npx tsc --version)"
echo "Node version: $(node --version)"

echo "Running TypeScript compiler..."
NPX_COMMAND="npx tsc --outDir ./dist --rootDir ./src --verbose"
echo "Executing: $NPX_COMMAND"
$NPX_COMMAND

if [ $? -eq 0 ]; then
  echo "Build succeeded!"
  echo "Contents of dist directory:"
  ls -la dist
else
  echo "Build failed!"
  echo "Trying with alternative options..."
  echo "Executing: npx tsc --build tsconfig.json --verbose"
  npx tsc --build tsconfig.json --verbose
fi
