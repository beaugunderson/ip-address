#!/usr/bin/env sh

set -e

mkdir -p coverage

./node_modules/.bin/istanbul cover ./node_modules/mocha/bin/_mocha \
  -- --require ts-node/register --inline-diff --reporter spec test/**/*.ts && \
  ./node_modules/codecov.io/bin/codecov.io.js < ./coverage/coverage.json && \
  rm -rf .coverage && \
  ./node_modules/.bin/mochify -R spec
