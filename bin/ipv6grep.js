#!/usr/bin/env node

var v6 = require('../ipv6.js').v6;
var v4 = require('../ipv6.js').v4;

var sprintf = require('sprintf').sprintf;
var cli = require('cli');
var cliff = require('cliff');

var util = require('util');
var spawn = require('child_process').spawn;

cli.enable('version', 'status', 'glob');

cli.parse({
   all: ['a', 'Find all addresses'],
   validate: ['v', 'Validate found addresses'],
   substring: ['s', 'Substring match']
});

cli.debug('script: ' + process.ARGV[1]);

cli.main(function(args, options) {
   cli.debug('args: ' + util.inspect(args));
   cli.debug('options: ' + util.inspect(options));

   var grepArguments = ['-E', '-n', '--color=always'];
   var stdin = false;

   if (args.length == 0 && options.all) {
      // STDIN with all addresses
      grepArguments.push('ADDRESS');
      stdin = true;
   } else if (args.length == 1) {
      // STDIN
      var address = new v6.Address(new v6.Address(args[0]).correctForm());
      var regex = address.regularExpressionString(options.substring);

      cli.debug('address: ' + util.inspect(address.regularExpression()));

      grepArguments.push(regex);
      stdin = true;
   } else if (args.length > 1) {
      // filename
      var address = new v6.Address(new v6.Address(args[0]).correctForm());
      var regex = address.regularExpressionString(options.substring);

      var files = args.slice(1, args.length);

      cli.debug('address: ' + util.inspect(address.regularExpression()));
      cli.debug('files: ' + util.inspect(files));

      grepArguments = grepArguments.concat(regex, files)
   }

   cli.debug('grep arguments: ' + util.inspect(grepArguments));

   if (!stdin) {
      var grep = spawn('grep', grepArguments);

      grep.stdout.on('data', function (data) {
         console.log(String(data).trim());
      });

      grep.on('exit', function (code) {
         cli.debug('grep exited: ' + code);
      });

      //grep.stdin.end();
   }

   //cli.withStdinLines(function(lines, newline) {
   //});
});
