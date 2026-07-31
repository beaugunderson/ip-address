// A dependency-free smoke test of the built `dist` output, run by CI on the
// oldest node version `engines` claims. The dev toolchain (mocha, tsx, c8)
// needs a modern node, so the real suite cannot run there; this covers what
// actually breaks a consumer on an old runtime, which is emitted syntax the
// runtime cannot parse. Keep it to es2019 so a failure here is always about
// dist and never about this file.

const assert = require('assert');

const { Address4, Address6, AddressError } = require('../dist/ip-address');

// v4 parsing and forms
const v4 = new Address4('127.0.0.1');

assert.strictEqual(v4.correctForm(), '127.0.0.1');
assert.strictEqual(v4.toHex(), '7f:00:00:01');
assert.strictEqual(v4.bigInt().toString(), '2130706433');
assert.strictEqual(Address4.isValid('127.0.0.1'), true);
assert.strictEqual(Address4.isValid('127.0.0.999'), false);

// v4 subnets
const v4Subnet = new Address4('10.0.0.0/8');

assert.strictEqual(v4Subnet.startAddress().correctForm(), '10.0.0.0');
assert.strictEqual(v4Subnet.endAddress().correctForm(), '10.255.255.255');
assert.strictEqual(new Address4('10.1.2.3').isInSubnet(v4Subnet), true);
assert.strictEqual(new Address4('11.1.2.3').isInSubnet(v4Subnet), false);

// v4 conversions
assert.strictEqual(Address4.fromBigInt(BigInt('2130706433')).correctForm(), '127.0.0.1');
assert.strictEqual(Address4.fromInteger(2130706433).correctForm(), '127.0.0.1');
assert.strictEqual(Address4.fromHex('7f000001').correctForm(), '127.0.0.1');

// v6 parsing and forms
const v6 = new Address6('2001:0db8:0000:0000:0000:0000:0000:0001');

assert.strictEqual(v6.correctForm(), '2001:db8::1');
assert.strictEqual(v6.canonicalForm(), '2001:0db8:0000:0000:0000:0000:0000:0001');
assert.strictEqual(v6.to4in6(), '2001:db8::0.0.0.1');
assert.strictEqual(v6.reverseForm({ omitSuffix: true }).length > 0, true);
assert.strictEqual(Address6.isValid('2001:db8::1'), true);
assert.strictEqual(Address6.isValid('fffff::1'), false);

// v6 subnets and BigInt round-tripping
const v6Subnet = new Address6('2001:db8::/32');

assert.strictEqual(new Address6('2001:db8::1').isInSubnet(v6Subnet), true);
assert.strictEqual(Address6.fromBigInt(v6.bigInt()).correctForm(), '2001:db8::1');
assert.throws(() => Address6.fromBigInt(BigInt(-1)), AddressError);

// v6 from other representations
const bytes = [32, 1, 13, 184, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

assert.strictEqual(Address6.fromAddress4('127.0.0.1').correctForm(), '::ffff:7f00:1');
assert.strictEqual(Address6.fromByteArray(bytes).correctForm(), '2001:db8::1');

// URL parsing: the code path whose nullish coalescing broke node 12 outright
const withPort = Address6.fromURL('http://[2001:db8::1]:8080/foo');

assert.strictEqual(withPort.address.correctForm(), '2001:db8::1');
assert.strictEqual(withPort.port, 8080);

const withoutPort = Address6.fromURL('http://2001:db8::1/');

assert.strictEqual(withoutPort.address.correctForm(), '2001:db8::1');
assert.strictEqual(withoutPort.port, null);

// Errors still carry parse detail
assert.throws(() => new Address4('not an address'), AddressError);

// eslint-disable-next-line no-console
console.log(`node ${process.version}: dist smoke test passed`);
