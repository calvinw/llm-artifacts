#!/bin/bash

# Check if a backup name was provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup-name>"
    exit 1
fi

# Create the ignore directory if it doesn't exist
mkdir -p ignore

# Create the backup directory with the provided name
backup_dir="ignore/$1"
if [ -d "$backup_dir" ]; then
    echo "Error: Backup directory '$backup_dir' already exists"
    exit 1
fi

mkdir -p "$backup_dir"

# List of files to backup
files=(
    "index.html"
    "artifact-editor.js"
    "artifact-editor-styles.css"
    "chat-engine.js"
    "defaults.js"
    "fetch-models.js"
)

# Copy each file to the backup directory
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$backup_dir/"
        echo "Backed up: $file"
    else
        echo "Warning: File '$file' not found"
    fi
done

echo "Backup complete in: $backup_dir"
