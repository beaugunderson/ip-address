#!/usr/bin/env node

var v6 = require('../ipv6.js').v6;
var v4 = require('../ipv6.js').v4;

var sprintf = require('sprintf').sprintf;
var cli = require('cli');
var cliff = require('cliff');

var options = cli.parse();

var rows = [['Address', 'Valid', 'Correct Form', 'Canonical Form']];

cli.withStdinLines(function(lines, newline) {
   for (var i = 0; i < lines.length; i++) {
      if (lines[i] == '') {
         continue;
      }

      var address = new v6.Address(lines[i]);

      if (options.v) {
         this.output(sprintf('%s = %s\n', lines[i], cliff.inspect(address)));
      } else if (options.c) {
         rows.push([
            lines[i],
            address.isValid() ? 'Yes' : 'No'.red,
            address.isValid() ? address.correctForm() : '',
            address.isValid() ? address.canonicalForm() : ''
         ]);
      } else {
         this.output(sprintf('%s,%s\n', lines[i], address.isValid() ? 'valid' : 'invalid'));
      }
   }

   if (options.c) {
      console.log(cliff.stringifyRows(rows, ['green', 'green', 'green', 'green']));
   }
});
