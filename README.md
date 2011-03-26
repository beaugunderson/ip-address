javascript-ipv6
===============

javascript-ipv6 is a library for manipulating IPv6 addresses in JavaScript.

Current functionality
----------------

- Parsing of most IPv6 notations
- Validity checking
- Decoding of the [Teredo information](http://en.wikipedia.org/wiki/Teredo_tunneling#IPv6_addressing) in an address
- Hex, binary, and decimal display
- Zero-padded IPv6 display
- Correct address display
- Translation to IPv4-compatible addresses (i.e. ::0.0.0.0)

Future functionality
--------------------

- Base 64 or 89 encoding?
- Whether one address is a valid subnet of another
- Number of subnets of a certain size in a given address
- What special properties a given address has (multicast prefix, unique local address prefix, etc.)
