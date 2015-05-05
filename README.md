[![Build Status](https://secure.travis-ci.org/beaugunderson/ip-address.png?branch=master)](http://travis-ci.org/beaugunderson/ip-address) [![Coverage Status](https://img.shields.io/coveralls/beaugunderson/ip-address.svg)](https://coveralls.io/r/beaugunderson/ip-address?branch=master)

## ip-address

`ip-address` is a library for manipulating IPv6 and IPv4 addresses in JavaScript.

### Examples

For node:

```js
var v6 = require('ip-address').v6;

var address = new v6.Address('2001:0:ce49:7601:e866:efff:62c3:fffe');

console.log(address.isValid()); // Prints "true"

var teredo = address.teredo();

console.log(teredo.client4);    // Prints "157.60.0.1"
```

### Current functionality

-    Parsing of most IPv6 notations
-    Parsing of IPv6 Addresses and Ports from URLs with `v6.Address.fromURL(url)`
-    Validity checking
-    Decoding of the [Teredo
     information](http://en.wikipedia.org/wiki/Teredo_tunneling#IPv6_addressing)
     in an address
-    Whether one address is a valid subnet of another
-    What special properties a given address has (multicast prefix, unique
     local address prefix, etc.)
-    Number of subnets of a certain size in a given address
-    Display methods
     -    Hex, binary, and decimal
     -    Canonical form
     -    Correct form
     -    IPv4-compatible (i.e. `::ffff:192.168.0.1`)
-    Works in [node.js](http://nodejs.org/) and the browser (with browserify)
-    1,500+ unit tests with [node.js](http://nodejs.org/) and
     [Mocha](http://visionmedia.github.com/mocha/)

### Used by

-    [anon](https://github.com/edsu/anon) which powers
     [@congressedits](https://twitter.com/congressedits), among
     [many others](https://github.com/edsu/anon#community)
-    [node-swiz](https://github.com/racker/node-swiz) which is used by [Rackspace](http://www.rackspace.com/)
-    [node-socksified](https://github.com/vially/node-socksified)

### TODO

-    [Better documentation](https://github.com/documentationjs/documentation)
