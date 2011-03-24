javascript-ipv6
===============

Doesn't do much yet but I'd like it to be a useful library for manipulating IPV6 addresses in JavaScript.

Future functionality might include:

- Whether a given address is valid
- Whether one address is a valid subnet of another
- Number of subnets of a certain size in a given address
- What special properties a given address has (multicast prefix, unique local address prefix, etc.)
- Decoding of the [Teredo information](http://en.wikipedia.org/wiki/Teredo_tunneling#IPv6_addressing) in an address
- Translation to and from IPv4-compatible addresses (i.e. ::0.0.0.0)
