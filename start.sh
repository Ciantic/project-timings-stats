#!/bin/bash -l

# CD into the script directory
cd "$(dirname "$0")" || exit

# Manual step in KDE: Also disable "Allow this program to be grouped"... it still groups Google Chrome windows

google-chrome-stable --new-window --app=http://localhost:3010/stats
export PORT=3010
export HOST=localhost
export TIMINGS_DB=~/.config/timings/timings.db
deno --config deno.json -P .output/server/index.mjs
# deno --config deno.json -P .output/server/bundle.mjs
