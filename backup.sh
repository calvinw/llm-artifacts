#!/bin/bash

DOWNLOADS_HTML=~/Downloads/complete-index-html.html
DOWNLOADS_CSS=~/Downloads/complete-styles-css.css
DOWNLOADS_JS=~/Downloads/complete-script-js.js

# Set timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Back up current index.html and styles.css with timestamp
if [ -f index.html ]; then
    cp index.html index.html.backup_$TIMESTAMP
    echo "Backed up index.html to index.html.backup_$TIMESTAMP"
fi

if [ -f styles.css ]; then
    cp styles.css styles.css.backup_$TIMESTAMP
    echo "Backed up styles.css to styles.css.backup_$TIMESTAMP"
fi

if [ -f script.js ]; then
    cp script.js script.js.backup_$TIMESTAMP
    echo "Backed up script.js to script.js.backup_$TIMESTAMP"
fi

