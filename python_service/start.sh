#!/bin/bash

# Navigate to script directory
cd "$(dirname "$0")"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

# Run app
echo "Starting Face Recognition Service..."
python3 app.py
