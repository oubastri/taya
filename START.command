#!/bin/bash
cd "$(dirname "$0")"

if ! command -v npm &> /dev/null; then
  echo "Node.js isn't installed or isn't in your PATH."
  echo "Install it from https://nodejs.org then double-click this file again."
  echo ""
  read -p "Press Enter to close..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "First-time setup: installing dependencies..."
  npm install
  echo ""
fi

echo "Starting the app..."
echo "When you see 'Ready', open: http://localhost:3000"
echo ""
npm run dev
