#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../frontend"

echo "Installing frontend dependencies..."
npm ci

echo "Type checking..."
npm run typecheck

echo "Building..."
npm run build

echo ""
echo "Frontend built → lectrace/_static/"
