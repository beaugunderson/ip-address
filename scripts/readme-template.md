[![CI](https://github.com/beaugunderson/ip-address/actions/workflows/ci.yml/badge.svg)](https://github.com/beaugunderson/ip-address/actions/workflows/ci.yml)
[![codecov]](https://codecov.io/github/beaugunderson/ip-address?branch=master)
[![downloads]](https://www.npmjs.com/package/ip-address)
[![npm]](https://www.npmjs.com/package/ip-address)

[codecov]: https://codecov.io/github/beaugunderson/ip-address/coverage.svg?branch=master
[downloads]: https://img.shields.io/npm/dm/ip-address.svg
[npm]: https://img.shields.io/npm/v/ip-address.svg

## ip-address

`ip-address` is a library for validating and manipulating IPv4 and IPv6 addresses in JavaScript and TypeScript.

### Install

```sh
npm install ip-address
```

### Examples

```ts
import { Address4, Address6 } from 'ip-address';

// Validation
Address4.isValid('192.168.1.1');           // true
Address6.isValid('2001:db8::1');           // true
Address6.isValid('not an address');        // false

// Parsing (throws AddressError on invalid input)
const v4 = new Address4('192.168.1.1/24');
const v6 = new Address6('2001:db8::1/64');

// Subnet membership
const host = new Address4('192.168.1.42');
const network = new Address4('192.168.1.0/24');
host.isInSubnet(network);                  // true

// Subnet range
network.startAddress().correctForm();      // '192.168.1.0'
network.endAddress().correctForm();        // '192.168.1.255'

// Strict network-address check (host bits must be zero).
// isValid() accepts CIDRs with host bits set — '192.168.1.5/24' is a valid
// host-with-subnet, but it isn't a network address.
const cidr = new Address4('192.168.1.5/24');
Address4.isValid('192.168.1.5/24');                                // true
cidr.correctForm() === cidr.startAddress().correctForm();          // false

// Address properties
const link = new Address6('fe80::1');
link.isLinkLocal();                        // true
link.isMulticast();                        // false
link.isLoopback();                         // false

new Address4('192.168.1.1').isPrivate();   // true (RFC 1918)
new Address6('fc00::1').isULA();           // true (RFC 4193)

// Numeric and byte representations
v4.bigInt();                               // 3232235777n
v4.toArray();                              // [192, 168, 1, 1]
v6.canonicalForm();                        // '2001:0db8:0000:0000:0000:0000:0000:0001'

// Embedded IPv4 + Teredo
const teredo = new Address6('2001:0:ce49:7601:e866:efff:62c3:fffe');
teredo.inspectTeredo().client4;            // '157.60.0.1'

// Parse host + port from a URL
Address6.fromURL('http://[2001:db8::1]:8080/').port;  // 8080
```

### Features

- Written in TypeScript with full type definitions; usable from CommonJS and ESM
- Zero runtime dependencies
- Parses all standard IPv4 and IPv6 notations, including subnets and zones
- Parses IPv6 hosts (and ports) from URLs via `Address6.fromURL(url)`
- Subnet membership checks (`isInSubnet`) and range queries (`startAddress` / `endAddress`)
- Special-property checks: private (RFC 1918) / ULA (RFC 4193), loopback, link-local, multicast, broadcast, unspecified, CGNAT, documentation, Teredo, 6to4, v4-in-v6
- Decodes [Teredo](http://en.wikipedia.org/wiki/Teredo_tunneling#IPv6_addressing) and 6to4 tunneling information
- Conversions: canonical/correct form, hex, binary, decimal, byte arrays, BigInt, `in-addr.arpa` / `ip6.arpa`
- Runs in Node.js and the browser
- Thousands of test cases

### Terminology

A few terms used throughout the API can be confusing if you haven't worked deeply with IPv6 before:

- **Correct form** — the shortest valid representation, per [RFC 5952](https://datatracker.ietf.org/doc/html/rfc5952): leading zeros stripped, the longest run of zero groups collapsed to `::`, and hex digits lowercased (e.g. `2001:db8::1`). This is what most software displays.
- **Canonical form** — the fully expanded representation: all 8 groups, each padded to 4 hex digits, no `::` collapsing (e.g. `2001:0db8:0000:0000:0000:0000:0000:0001`). Useful for sorting and byte-exact comparison.
- **Subnet** — the network portion of an address expressed as a CIDR prefix length (e.g. `/24` for IPv4, `/64` for IPv6). `startAddress()` / `endAddress()` return the bounds of the subnet's range.
- **Zone** — the IPv6 scope identifier appended after `%`, used to disambiguate link-local addresses across interfaces (e.g. `fe80::1%eth0`).
- **v4-in-v6** — mixed notation that embeds an IPv4 address as the last 32 bits of an IPv6 address, e.g. `::ffff:192.168.0.1`. Used for IPv4-mapped IPv6 addresses.
- **Teredo** — a tunneling protocol that encodes an IPv4 endpoint, port, and flags inside a `2001::/32` IPv6 address. `inspectTeredo()` decodes those fields.
- **6to4** — a tunneling protocol that embeds an IPv4 address as the second 16 bits of a `2002::/16` IPv6 address. `inspect6to4()` decodes the embedded v4 address.

### API

<!-- API:START -->
<!-- API:END -->

### Security

Vulnerabilities go through [GitHub's private vulnerability reporting](https://github.com/beaugunderson/ip-address/security/advisories/new); [SECURITY.md](./SECURITY.md) has the scope and what to expect. Confirmed issues get a fix, a release, and a public [advisory](https://github.com/beaugunderson/ip-address/security/advisories) with a CVE, rather than a quiet patch.

Releases are built and published by CI through npm trusted publishing. Every version from 10.2.1 onward carries a provenance attestation tying the tarball to the commit and workflow that built it. Check it with `npm audit signatures`.

If you are using the address-property checks as a security control, read [that section of SECURITY.md](./SECURITY.md#classifiers-are-not-an-ssrf-defense) first. `isPrivate()`, `isLoopback()`, `isInSubnet()` and their siblings classify an address that has already been parsed, which makes them one layer of an SSRF guard rather than the whole of it. A hostname that resolves to an internal address, a DNS record that changes after your check, or a redirect will all sail past a guard built only on them.

### Used by

`ip-address` is downloaded ~66 million times per week, mostly via the Node proxy/agent ecosystem. The dependency chain runs through a handful of widely-used packages:

- [**socks**](https://github.com/JoshGlazebrook/socks) (~53M weekly) — SOCKS4/5 client for Node; depends on `ip-address` directly. The single biggest source of downloads.
- [**socks-proxy-agent**](https://github.com/TooTallNate/proxy-agents/tree/main/packages/socks-proxy-agent) (~57M weekly) — `http.Agent` for SOCKS proxies; depends on `socks`. Bundled by virtually every CLI that respects `HTTPS_PROXY`.
- [**npm**](https://github.com/npm/cli) and [**pnpm**](https://github.com/pnpm/pnpm) — both bundle `socks-proxy-agent` through their HTTP fetch stack (`make-fetch-happen` → `@npmcli/agent`), so every Node install on the planet pulls in `ip-address` as a transitive dependency.
- [**Puppeteer**](https://github.com/puppeteer/puppeteer) — `@puppeteer/browsers` uses `proxy-agent` for browser-binary downloads, which routes through `socks-proxy-agent` → `socks` → `ip-address`.
- [**proxy-agent**](https://github.com/TooTallNate/proxy-agents/tree/main/packages/proxy-agent) (~28M weekly) and [**pac-proxy-agent**](https://github.com/TooTallNate/proxy-agents/tree/main/packages/pac-proxy-agent) (~27M weekly) — auto-detecting proxy agents (HTTP/HTTPS/SOCKS/PAC) used widely in scraping, headless-browser, and CI tooling.
- [**cacache**](https://github.com/npm/cacache) (~44M weekly) — npm's content-addressable cache; pulls in the same fetch stack.

Beyond the proxy chain, `ip-address` has been used by Juniper Networks' Contrail, Ably's proxy-protocol implementation, Rackspace's serialization framework, IPFS, and the [SwitchyOmega](https://github.com/FelisCatus/SwitchyOmega) Chrome extension, among many others.
