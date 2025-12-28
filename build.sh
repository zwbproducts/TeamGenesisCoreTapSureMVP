#!/bin/bash
set -e
echo "==> TapSure Backend Build"
echo "Installing Python dependencies..."
pip install -r python-requirements.txt
echo "✓ Build complete!"
