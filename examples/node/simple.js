var v6 = require('ipv6').v6;

var address = new v6.Address('a::b');

console.log(address.canonicalForm());
