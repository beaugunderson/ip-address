#!/usr/bin/env node

'use strict';

var exec = require('child_process').exec;

var command = [
  'NODE_ENV=test',
  'YOURPACKAGE_COVERAGE=1',
  './node_modules/.bin/mocha',
  '--require blanket',
  '--reporter mocha-lcov-reporter |',
  './node_modules/coveralls/bin/coveralls.js'
].join(' ');

if (process.env.CI !== 'true') {
  process.exit(0);
}

exec(command, function (err, stdout, stderr) {
  if (stdout) {
    console.log(stdout);
  }

  if (stderr) {
    console.error(stderr);
  }

  if (err) {
    console.error('error:', err);

    process.exit(1);
  }
});
