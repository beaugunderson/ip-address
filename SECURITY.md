# Security policy

## Reporting a vulnerability

Report privately through [GitHub's private vulnerability reporting](https://github.com/beaugunderson/ip-address/security/advisories/new). Please don't open a public issue for a suspected vulnerability.

The most useful report is a short proof of concept: the input string, the method you called, what came back, and what you expected instead. If the problem is that this library disagrees with something else about what an address means, name the other parser. A resolver, a URL implementation, another library. That is what makes the disagreement reproducible.

Reports are acknowledged as soon as practical. Confirmed issues get a fix, a release, and a published advisory with a CVE. Reporters are credited by GitHub handle unless they would rather not be.

## Supported versions

Fixes go out against the latest published version. There are no long-term support branches, so upgrading is the supported path.

## Scope

In scope is anything that makes this library report something untrue about an address. A validation gap. A parse result that disagrees with the resolver the address will actually be handed to. A classifier returning the wrong answer for well-formed input. A crash on input that should have been rejected cleanly.

Out of scope are vulnerabilities in packages that depend on this one, and reports whose only substance is that an application used these methods as its sole defense. The next section explains why.

## Classifiers are not an SSRF defense

`isPrivate()`, `isLoopback()`, `isLinkLocal()`, `isInSubnet()` and their siblings answer a question about an address that has already been parsed. That makes them one useful layer in a Server-Side Request Forgery guard. It does not make them a guard.

Within that layer, ask one question, not several. `isGlobal()` is false for multicast, for every block the IANA special-purpose registries mark as not globally reachable, and for IPv6 space outside the `2000::/3` global unicast allocation, and an IPv4-mapped or NAT64 address answers for the IPv4 address it embeds. A guard written as an OR of named classifiers (`isPrivate() || isLoopback() || isLinkLocal() || …`) covers only the ranges it names, and the registries hold more ranges than there are names: `0.0.0.0/8`, the IETF protocol assignments in `192.0.0.0/24` and `2001::/23`, the documentation and benchmarking blocks, the discard-only prefix `100::/64`, the deprecated site-local `fec0::/10`. `test/data/iana-corpus.json` pins `isGlobal()` to the registries at every block boundary.

```js
if (!address.isGlobal()) reject();
```

Plenty gets past them, because plenty never reaches this library at all: a hostname that resolves to an internal address, a DNS record that changes between your check and your connection, a redirect to somewhere new.

`isValid()` returning `false` deserves particular care. It means "not a valid literal of this family". It does not mean "will not reach an internal host". `2130706433`, `0x7f000001` and `127.1` are all rejected here, and all three resolve to loopback. A guard that treats a rejected string as safe to pass along has an opening.

A guard that holds up resolves the hostname itself and checks the resolved address against the socket it is about to open, on every hop. Use these methods inside that, not instead of it.
