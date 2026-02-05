#!/bin/bash -l

# CD into the script directory
cd "$(dirname "$0")" || exit

# Manual step in KDE: Also disable "Allow this program to be grouped"... it still groups Google Chrome windows

google-chrome-stable --new-window --app=http://localhost:3030/stats --app-id=5
export PORT=3030
export HOST=localhost
export TIMINGS_DB=_data/timings.db
deno x vinxi dev
