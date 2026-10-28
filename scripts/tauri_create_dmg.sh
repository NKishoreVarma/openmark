#!/usr/bin/env bash

create-dmg \
    --volname "openmark installer" \
    --volicon "./crates/openhuman-app/icons/icon.icns" \
    --background "./crates/openhuman-app/images/background-dmg.svg" \
    --window-size 540 380 \
    --icon-size 100 \
    --icon "openmark.app" 138 225 \
    --hide-extension "openmark.app" \
    --app-drop-link 402 225 \
    --no-internet-enable \
    "$1" \
    "$2"
