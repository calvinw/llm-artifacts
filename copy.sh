#!/bin/bash

DOWNLOADS_HTML = ~/Downloads/complete-index-html.html
DOWNLOADS_CSS = ~/Downloads/complete-styles-css.css

# Copy new files from Downloads
if [ -f $DOWNLOADS_HTML ]; then
    cp $DOWNLOADS_HTML ./index.html
    echo "Copied $DOWNLOADS_HTML to current directory as index.html"
else
    echo "$DOWNLOADS_HTML not found, skipping copy"
fi

if [ -f $DOWNLOADS_CSS ]; then
    cp $DOWNLOADS_CSS ./styles.css
    echo "Copied $DOWNLOADS_CSS to current directory as styles.css"
else
    echo "$DOWNLOADS_CSS not found, skipping copy"
fi

# Remove downloaded files
if [ -f $DOWNLOADS_HTML ]; then
    echo "Removing $DOWNLOADS_HTML..."
    rm $DOWNLOADS_HTML
fi

if [ -f $DOWNLOADS_CSS ]; then
    echo "Removing $DOWNLOADS_CSS..."
    rm $DOWNLOADS_CSS
fi

echo "Copy, and removal completed."
