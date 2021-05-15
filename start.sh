#!/usr/bin/env bash

# Check if node_modules exist
# If exists; run file
# Else, install dependencies then run
if [ -d "node_modules" ]; then
    node index
else
    echo "Installing Dependencies.."
    npm install
    
    echo "Starting.."
    node index
fi
