#!/bin/bash

set -e
set -u

rm profile_output_total.* -rf
mkdir -p prof
./lib/cli.js profile --output ./prof/testp.js testp.js

node prof/testp.js
