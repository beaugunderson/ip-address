#!/usr/bin/env sh

set -e

npx tsc

./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha \
  -- -R spec && \
  ./node_modules/codecov.io/bin/codecov.io.js < ./coverage/coverage.json && \
  rm -rf .coverage && \
  ./node_modules/.bin/mochify -R spec
