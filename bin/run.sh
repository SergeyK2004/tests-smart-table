#!/bin/bash

cd "$REPO"
npm install

cd "$DIR_TESTS"
npm install

npx playwright install chromium
npm run test
