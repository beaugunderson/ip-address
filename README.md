javascript-ipv6
===============

javascript-ipv6 is a library for manipulating IPv6 addresses in JavaScript:

    > var address = new v6.Address('2001:0:ce49:7601:e866:efff:62c3:fffe')
    > var teredo = address.teredo()
    > teredo.client_v4
      "157.60.0.1"

Current functionality
---------------------

-    Parsing of most IPv6 notations
-    Validity checking
-    Decoding of the [Teredo information](http://en.wikipedia.org/wiki/Teredo_tunneling#IPv6_addressing) in an address
-    Display methods
     -    Hex, binary, and decimal
     -    Canonical form
     -    Correct form
     -    IPv4-compatible (i.e. `::0.0.0.0`)
-    Works in [node.js](http://nodejs.org/) and the browser
-    Unit tests with [node.js](http://nodejs.org/) and [Vows](http://vowsjs.org/)

Future functionality
--------------------

-    Base 64/85 encoding?
-    Whether one address is a valid subnet of another
-    Number of subnets of a certain size in a given address
-    What special properties a given address has (multicast prefix, unique local address prefix, etc.)
-    Reverse lookups? (Whether a domain name has IPv6 glue)

TODO
----

-    Documentation
