var fs = require('fs'),
    sprintf = require('sprintf').sprintf;

var v6 = require('../ipv6').v6,
    BigInteger = require('../lib/node/bigint');

var a = new v6.Address('::');
var b = new v6.Address('a:b:c:d::');

console.log(a.regularExpressionString());
console.log(b.regularExpressionString());

var ar = new RegExp(a.regularExpressionString());
var br = new RegExp(a.regularExpressionString());

console.log(ar.test('::'));
console.log(ar.test('0:0:0:0:0:0:0:0'));

console.log(br.test('a:b:c:d::'));
console.log(br.test('a:b:c:d:0000:0000:0000:0000'));
console.log(br.test('a:b:c:d:0:0:0:0'));
