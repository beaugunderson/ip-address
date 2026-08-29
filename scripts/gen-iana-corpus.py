#!/usr/bin/env python3
"""Regenerate test/data/iana-corpus.json from the IANA special-purpose
address registries.

    scripts/gen-iana-corpus.py            # regenerate from the checked-in CSVs
    scripts/gen-iana-corpus.py --fetch    # refresh the CSVs from iana.org first

For every block in both registries the corpus holds the block's first and
last address, the addresses one step outside it on each side, and one in the
middle, plus every IPv4-mapped and NAT64 well-known form of the IPv4 probes.
Each probe carries the expected answer from the registry (its most specific
block and whether that block is globally reachable) and Python's own
classification for cross-checking. test/iana-corpus-test.ts asserts the
library agrees.
"""

import csv
import ipaddress
import json
import re
import sys
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "test" / "data"
REGISTRIES = {
    4: "https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv",
    6: "https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv",
}


def csv_path(version):
    return DATA / f"iana-ipv{version}-special-registry.csv"


def fetch():
    for version, url in REGISTRIES.items():
        with urllib.request.urlopen(url) as response:
            csv_path(version).write_bytes(response.read())


def reachability(value):
    """Map the registry's 'Globally Reachable' column to True, False, or None.

    N/A (Teredo, 6to4) is not reachable without a relay; a blank cell inherits
    the containing block's answer.
    """
    value = value.strip()
    if value.startswith("True"):
        return True
    if value.startswith("False") or value.startswith("N/A"):
        return False
    return None


def load_blocks(version):
    blocks = []
    with csv_path(version).open() as f:
        for row in csv.DictReader(f):
            for cidr in re.findall(r"[0-9a-fA-F:.]+/\d+", row["Address Block"]):
                blocks.append((ipaddress.ip_network(cidr), row["Name"], reachability(row["Globally Reachable"])))
    return blocks


def registry_answer(address, blocks):
    """The most specific block containing the address, and whether the registry
    marks the address globally reachable (True when no block contains it)."""
    containing = sorted((b for b in blocks if address in b[0]), key=lambda b: b[0].prefixlen, reverse=True)
    name = containing[0][1] if containing else None
    for _, _, reachable in containing:
        if reachable is not None:
            return name, reachable
    return name, True


def probes(net):
    first, last = int(net.network_address), int(net.broadcast_address)
    maxv = (1 << net.max_prefixlen) - 1
    candidates = {first, last, first - 1, last + 1, first + 1, last - 1, first + (last - first) // 2}
    make = net.network_address.__class__
    return [make(c) for c in sorted(candidates) if 0 <= c <= maxv]


def python_view(address):
    return {
        "loopback": address.is_loopback,
        "linkLocal": address.is_link_local,
        "multicast": address.is_multicast,
        "unspecified": address.is_unspecified,
        "global": address.is_global,
    }


EMBEDDING = (ipaddress.ip_network("::ffff:0:0/96"), ipaddress.ip_network("64:ff9b::/96"))


def entry(address, blocks, family):
    name, reachable = registry_answer(address, blocks[family])
    result = {
        "address": str(address),
        "family": family,
        "block": name,
        "global": reachable and not address.is_multicast,
        "python": python_view(address),
    }

    # An IPv4-mapped or NAT64 well-known address answers for the IPv4 address
    # it embeds, so a probe of those blocks takes the embedded address's answer.
    if family == 6 and any(address in net for net in EMBEDDING):
        embedded = ipaddress.IPv4Address(int(address) & 0xFFFFFFFF)
        _, reachable = registry_answer(embedded, blocks[4])
        result["embedded"] = str(embedded)
        result["global"] = reachable and not embedded.is_multicast

    return result


def main():
    if "--fetch" in sys.argv:
        fetch()

    blocks = {4: load_blocks(4), 6: load_blocks(6)}
    corpus = []

    for version in (4, 6):
        for net, _, _ in blocks[version]:
            for address in probes(net):
                corpus.append(entry(address, blocks, version))

    # IPv4-mapped and NAT64 well-known forms answer for the embedded IPv4
    # address, so their expectation is the IPv4 probe's, not the IPv6 block's.
    for v4 in [c for c in corpus if c["family"] == 4]:
        n = int(ipaddress.IPv4Address(v4["address"]))
        for kind, prefix in (("IPv4-mapped", 0xFFFF << 32), ("NAT64 well-known", 0x0064FF9B << 96)):
            address = ipaddress.IPv6Address(prefix | n)
            corpus.append({
                "address": str(address),
                "family": 6,
                "block": f"{kind} form of {v4['address']} ({v4['block']})",
                "embedded": v4["address"],
                "global": v4["global"],
                "python": python_view(address),
            })

    out = DATA / "iana-corpus.json"
    out.write_text(json.dumps(corpus, indent=1) + "\n")
    print(f"{len(corpus)} probes from {len(blocks[4])} IPv4 and {len(blocks[6])} IPv6 blocks -> {out}")


if __name__ == "__main__":
    main()
