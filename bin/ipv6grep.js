#!/usr/bin/env node

'use strict';

var cli = require('cli');

var util = require('util');
var spawn = require('child_process').spawn;

var v6 = require('..').v6;

cli.enable('version', 'status', 'glob');

cli.parse({
  all: ['a', 'Find all addresses'],
  validate: ['v', 'Validate found addresses'],
  substring: ['s', 'Substring match']
});

cli.debug('script: ' + process.argv[1]);

cli.main(function (args, options) {
  cli.debug('args: ' + util.inspect(args));
  cli.debug('options: ' + util.inspect(options));

  var grepArguments = ['-P', '-i', '-n', '--color=always'];
  var stdin = false;

  var address;
  var regex;

  if (args.length === 0 && options.all) {
    // STDIN with all addresses
    grepArguments.push('ADDRESS');
    stdin = true;
  } else if (args.length === 1) {
    // STDIN
    address = new v6.Address(new v6.Address(args[0]).correctForm());
    regex = address.regularExpressionString(options.substring);

    cli.debug('address: ' + util.inspect(address.regularExpression()));

    grepArguments.push(regex);
    stdin = true;
  } else if (args.length > 1) {
    // filename
    address = new v6.Address(new v6.Address(args[0]).correctForm());
    regex = address.regularExpressionString(options.substring);

    var files = args.slice(1, args.length);

    cli.debug('address: ' + util.inspect(address.regularExpression()));
    cli.debug('files: ' + util.inspect(files));

    grepArguments = grepArguments.concat(regex, files);
  }

  cli.debug('grep arguments: ' + util.inspect(grepArguments));

  if (!stdin) {
    var grep = spawn('grep', grepArguments);

    grep.stdout.on('data', function (data) {
      console.log(String(data).trim());
    });

    grep.stderr.on('data', function (data) {
      cli.debug(String(data).trim());
    });

    grep.on('exit', function (code) {
      cli.debug('grep exited: ' + code);
    });
  }
});
