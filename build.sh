#!/bin/bash
set -e
echo "==> TapSure Backend Build"
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt
echo "✓ Build complete!"
