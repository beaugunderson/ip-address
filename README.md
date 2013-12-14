javascript-ipv6 [![Build Status](https://secure.travis-ci.org/beaugunderson/javascript-ipv6.png?branch=master)](http://travis-ci.org/beaugunderson/javascript-ipv6)
===============

javascript-ipv6 is a library for manipulating IPv6 addresses in JavaScript.

Examples
--------

For node:

```js
var v6 = require('ipv6').v6;

var address = new v6.Address('2001:0:ce49:7601:e866:efff:62c3:fffe');

console.log(address.isValid()); // Prints "true"

var teredo = address.teredo();

console.log(teredo.client4);    // Prints "157.60.0.1"
```

For a browser:

```html
<!DOCTYPE html>
<html lang="en">
 <head>
  <title>Simple IPv6 test</title>

  <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>

  <script type="text/javascript" src="/lib/jsbn.js"></script>
  <script type="text/javascript" src="/lib/jsbn2.js"></script>

  <script type="text/javascript" src="/lib/sprintf.js"></script>

  <script type="text/javascript" src="/ipv6/ipv6.js"></script>

  <script type="text/javascript">
   $(function() {
    var address6 = new v6.Address('a::b');

    $('#output').text(address6.canonicalForm());
   });
  </script>
 </head>

 <body>
  The canonical form of <code>a::b</code> is: <code id="output"></code>
 </body>
</html>
```

Current functionality
---------------------

-    Parsing of most IPv6 notations
-    Parsing of IPv6 Addresses and Ports from URLs with `v6.Address.fromURL(url)`
-    Validity checking
-    Decoding of the [Teredo information](http://en.wikipedia.org/wiki/Teredo_tunneling#IPv6_addressing) in an address
-    Whether one address is a valid subnet of another
-    What special properties a given address has (multicast prefix, unique local address prefix, etc.)
-    Number of subnets of a certain size in a given address
-    Display methods
     -    Hex, binary, and decimal
     -    Canonical form
     -    Correct form
     -    IPv4-compatible (i.e. `::ffff:192.168.0.1`)
-    Works in [node.js](http://nodejs.org/) and the browser
-    Unit tests with [node.js](http://nodejs.org/) and [Mocha](http://visionmedia.github.com/mocha/)

Used by
-------

-    [Rackspace](http://www.rackspace.com/) in [node-swiz](https://github.com/racker/node-swiz)
-    [node-socksified](https://github.com/vially/node-socksified)

Future functionality
--------------------

-    Investigate `procstreams` for the CLI tool
-    Base 64/85 encoding?
-    Reverse lookups? (Whether a domain name has IPv6 glue)

TODO
----

-    Documentation
