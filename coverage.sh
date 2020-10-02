#!/usr/bin/env sh

set -e

mkdir -p coverage

npm run test-ci

npx codecov
