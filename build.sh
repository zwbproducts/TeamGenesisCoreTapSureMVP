#!/bin/bash
set -e
echo "Installing Python dependencies from backend/requirements.txt..."
pip install -r backend/requirements.txt
echo "Build complete!"
