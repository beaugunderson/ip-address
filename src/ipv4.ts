/* eslint-disable no-param-reassign */

import * as common from './common';
import * as constants from './v4/constants';
import { AddressError } from './address-error';

const isCorrect4 = common.isCorrect(constants.BITS);

/**
 * Represents an IPv4 address
 * @param {string} address - An IPv4 address string
 */
export class Address4 {
  address: string;
  addressMinusSuffix: string = '';
  groups: number = constants.GROUPS;
  parsedAddress: string[] = [];
  parsedSubnet: string = '';
  subnet: string = '/32';
  subnetMask: number = 32;
  v4: boolean = true;
  private _binaryZeroPad?: string;

  constructor(address: string) {
    this.address = address;

    const subnet = constants.RE_SUBNET_STRING.exec(address);

    if (subnet) {
      this.parsedSubnet = subnet[0].replace('/', '');
      this.subnetMask = parseInt(this.parsedSubnet, 10);
      this.subnet = `/${this.subnetMask}`;

      if (this.subnetMask < 0 || this.subnetMask > constants.BITS) {
        throw new AddressError('Invalid subnet mask.');
      }

      address = address.replace(constants.RE_SUBNET_STRING, '');
    }

    this.addressMinusSuffix = address;

    this.parsedAddress = this.parse(address);
  }

  /**
   * Returns true if the given string is a valid IPv4 address (with optional
   * CIDR subnet), false otherwise. Host bits in the subnet portion are
   * allowed (e.g. `192.168.1.5/24` is valid); for strict network-address
   * validation compare `correctForm()` to `startAddress().correctForm()`,
   * or use `networkForm()`.
   */
  static isValid(address: string): boolean {
    try {
      // eslint-disable-next-line no-new
      new Address4(address);

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Parses an IPv4 address string into its four octet groups and stores the
   * result on `this.parsedAddress`. Called automatically by the constructor;
   * you typically don't need to call it directly. Throws `AddressError` if
   * the input is not a valid IPv4 address.
   */
  parse(address: string) {
    const groups = address.split('.');

    if (!address.match(constants.RE_ADDRESS)) {
      throw new AddressError('Invalid IPv4 address.');
    }

    return groups;
  }

  /**
   * Returns the address in correct form: octets joined with `.` and any
   * leading zeros stripped (e.g. `192.168.1.1`). For IPv4 this matches the
   * canonical dotted-decimal representation.
   */
  correctForm(): string {
    return this.parsedAddress.map((part) => parseInt(part, 10)).join('.');
  }

  /**
   * Returns true if the address is correct, false otherwise
   * @returns {Boolean}
   */
  isCorrect = isCorrect4;

  /**
   * Construct an `Address4` from an address and a dotted-decimal subnet
   * mask given as separate strings (e.g. as returned by Node's
   * `os.networkInterfaces()`). Throws `AddressError` if the mask is
   * non-contiguous (e.g. `255.0.255.0`).
   * @example
   * var address = Address4.fromAddressAndMask('192.168.1.1', '255.255.255.0');
   * address.subnetMask; // 24
   */
  static fromAddressAndMask(address: string, mask: string): Address4 {
    const bits = common.prefixLengthFromMask(new Address4(mask).bigInt(), constants.BITS);
    return new Address4(`${address}/${bits}`);
  }

  /**
   * Construct an `Address4` from an address and a Cisco-style wildcard mask
   * given as separate strings (e.g. `0.0.0.255` for a `/24`). The wildcard
   * mask is the bitwise inverse of the subnet mask. Throws `AddressError`
   * if the mask is non-contiguous (e.g. `0.255.0.255`).
   * @example
   * var address = Address4.fromAddressAndWildcardMask('10.0.0.1', '0.0.0.255');
   * address.subnetMask; // 24
   */
  static fromAddressAndWildcardMask(address: string, wildcardMask: string): Address4 {
    const wildcard = new Address4(wildcardMask).bigInt();
    const allOnes = (BigInt(1) << BigInt(constants.BITS)) - BigInt(1);
    // eslint-disable-next-line no-bitwise
    const mask = wildcard ^ allOnes;
    const bits = common.prefixLengthFromMask(mask, constants.BITS);
    return new Address4(`${address}/${bits}`);
  }

  /**
   * Construct an `Address4` from a wildcard pattern with trailing `*`
   * octets. The number of trailing wildcards determines the prefix
   * length: each `*` represents 8 bits.
   *
   * Only trailing whole-octet wildcards are supported. Partial-octet
   * wildcards (e.g. `192.168.0.1*`) and interior wildcards (e.g.
   * `192.*.0.1`) throw `AddressError`.
   * @example
   * Address4.fromWildcard('192.168.0.*').subnet;   // '/24'
   * Address4.fromWildcard('192.168.*.*').subnet;   // '/16'
   * Address4.fromWildcard('*.*.*.*').subnet;       // '/0'
   */
  static fromWildcard(input: string): Address4 {
    const groups = input.split('.');

    if (groups.length !== constants.GROUPS) {
      throw new AddressError('Wildcard pattern must have 4 octets');
    }

    let firstWildcard = -1;

    for (let i = 0; i < groups.length; i++) {
      if (groups[i] === '*') {
        if (firstWildcard === -1) {
          firstWildcard = i;
        }
      } else if (firstWildcard !== -1) {
        throw new AddressError(
          'Wildcard `*` must only appear in trailing octets (e.g. `192.168.0.*`)',
        );
      }
    }

    const trailing = firstWildcard === -1 ? 0 : groups.length - firstWildcard;
    const replaced = groups.map((g) => (g === '*' ? '0' : g));
    const subnetBits = constants.BITS - trailing * 8;

    return new Address4(`${replaced.join('.')}/${subnetBits}`);
  }

  /**
   * Converts a hex string to an IPv4 address object. Accepts 8 hex digits
   * with optional `:` separators (e.g. `'7f000001'` or `'7f:00:00:01'`).
   * Throws `AddressError` for any other length or for non-hex characters.
   * @param {string} hex - a hex string to convert
   * @returns {Address4}
   */
  static fromHex(hex: string): Address4 {
    const stripped = hex.replace(/:/g, '');

    if (!/^[0-9a-fA-F]{8}$/.test(stripped)) {
      throw new AddressError('IPv4 hex must be exactly 8 hex digits');
    }

    const groups = [];

    for (let i = 0; i < 8; i += 2) {
      groups.push(parseInt(stripped.slice(i, i + 2), 16));
    }

    return new Address4(groups.join('.'));
  }

  /**
   * Converts an integer into a IPv4 address object. The integer must be a
   * non-negative safe integer in the range `[0, 2**32 - 1]`; otherwise
   * `AddressError` is thrown.
   * @param {integer} integer - a number to convert
   * @returns {Address4}
   */
  static fromInteger(integer: number): Address4 {
    if (!Number.isInteger(integer) || integer < 0 || integer > 0xffffffff) {
      throw new AddressError('IPv4 integer must be in the range 0 to 2**32 - 1');
    }

    return Address4.fromHex(integer.toString(16).padStart(8, '0'));
  }

  /**
   * Return an address from in-addr.arpa form
   * @param {string} arpaFormAddress - an 'in-addr.arpa' form ipv4 address
   * @returns {Adress4}
   * @example
   * var address = Address4.fromArpa(42.2.0.192.in-addr.arpa.)
   * address.correctForm(); // '192.0.2.42'
   */
  static fromArpa(arpaFormAddress: string): Address4 {
    // remove ending ".in-addr.arpa." or just "."
    const leader = arpaFormAddress.replace(/(\.in-addr\.arpa)?\.$/, '');

    const address = leader.split('.').reverse().join('.');

    return new Address4(address);
  }

  /**
   * Converts an IPv4 address object to a hex string
   * @returns {String}
   */
  toHex(): string {
    return this.parsedAddress.map((part) => common.stringToPaddedHex(part)).join(':');
  }

  /**
   * Converts an IPv4 address object to an array of bytes.
   *
   * To get a Node.js `Buffer`, wrap the result: `Buffer.from(address.toArray())`.
   * @returns {Array}
   */
  toArray(): number[] {
    return this.parsedAddress.map((part) => parseInt(part, 10));
  }

  /**
   * Converts an IPv4 address object to an IPv6 address group
   * @returns {String}
   */
  toGroup6(): string {
    const output = [];
    let i;

    for (i = 0; i < constants.GROUPS; i += 2) {
      output.push(
        `${common.stringToPaddedHex(this.parsedAddress[i])}${common.stringToPaddedHex(
          this.parsedAddress[i + 1],
        )}`,
      );
    }

    return output.join(':');
  }

  /**
   * Returns the address as a `bigint`
   * @returns {bigint}
   */
  bigInt(): bigint {
    return BigInt(`0x${this.parsedAddress.map((n) => common.stringToPaddedHex(n)).join('')}`);
  }

  /**
   * Helper function getting start address.
   * @returns {bigint}
   */
  _startAddress(): bigint {
    return BigInt(`0b${this.mask() + '0'.repeat(constants.BITS - this.subnetMask)}`);
  }

  /**
   * The first address in the range given by this address' subnet.
   * Often referred to as the Network Address.
   * @returns {Address4}
   */
  startAddress(): Address4 {
    return Address4.fromBigInt(this._startAddress());
  }

  /**
   * The first host address in the range given by this address's subnet ie
   * the first address after the Network Address
   * @returns {Address4}
   */
  startAddressExclusive(): Address4 {
    const adjust = BigInt('1');
    return Address4.fromBigInt(this._startAddress() + adjust);
  }

  /**
   * Helper function getting end address.
   * @returns {bigint}
   */
  _endAddress(): bigint {
    return BigInt(`0b${this.mask() + '1'.repeat(constants.BITS - this.subnetMask)}`);
  }

  /**
   * The last address in the range given by this address' subnet
   * Often referred to as the Broadcast
   * @returns {Address4}
   */
  endAddress(): Address4 {
    return Address4.fromBigInt(this._endAddress());
  }

  /**
   * The last host address in the range given by this address's subnet ie
   * the last address prior to the Broadcast Address
   * @returns {Address4}
   */
  endAddressExclusive(): Address4 {
    const adjust = BigInt('1');
    return Address4.fromBigInt(this._endAddress() - adjust);
  }

  /**
   * The dotted-decimal form of the subnet mask, e.g. `255.255.240.0` for
   * a `/20`. Returns an `Address4`; call `.correctForm()` for the string.
   * @returns {Address4}
   */
  subnetMaskAddress(): Address4 {
    return Address4.fromBigInt(
      BigInt(`0b${'1'.repeat(this.subnetMask)}${'0'.repeat(constants.BITS - this.subnetMask)}`),
    );
  }

  /**
   * The Cisco-style wildcard mask, e.g. `0.0.0.255` for a `/24`. This is
   * the bitwise inverse of `subnetMaskAddress()`. Returns an `Address4`;
   * call `.correctForm()` for the string.
   * @returns {Address4}
   */
  wildcardMask(): Address4 {
    return Address4.fromBigInt(
      BigInt(`0b${'0'.repeat(this.subnetMask)}${'1'.repeat(constants.BITS - this.subnetMask)}`),
    );
  }

  /**
   * The network address in CIDR string form, e.g. `192.168.1.0/24` for
   * `192.168.1.5/24`. For an address with no explicit subnet the prefix is
   * `/32`, e.g. `networkForm()` on `192.168.1.5` returns `192.168.1.5/32`.
   * @returns {string}
   */
  networkForm(): string {
    return `${this.startAddress().correctForm()}/${this.subnetMask}`;
  }

  /**
   * Converts a BigInt to a v4 address object. The value must be in the
   * range `[0, 2**32 - 1]`; otherwise `AddressError` is thrown.
   * @param {bigint} bigInt - a BigInt to convert
   * @returns {Address4}
   */
  static fromBigInt(bigInt: bigint): Address4 {
    if (bigInt < 0n || bigInt > 0xffffffffn) {
      throw new AddressError('IPv4 BigInt must be in the range 0 to 2**32 - 1');
    }

    return Address4.fromHex(bigInt.toString(16).padStart(8, '0'));
  }

  /**
   * Convert a byte array to an Address4 object.
   *
   * To convert from a Node.js `Buffer`, spread it: `Address4.fromByteArray([...buf])`.
   * @param {Array<number>} bytes - an array of 4 bytes (0-255)
   * @returns {Address4}
   */
  static fromByteArray(bytes: Array<number>): Address4 {
    if (bytes.length !== 4) {
      throw new AddressError('IPv4 addresses require exactly 4 bytes');
    }

    // Validate that all bytes are within valid range (0-255)
    for (let i = 0; i < bytes.length; i++) {
      if (!Number.isInteger(bytes[i]) || bytes[i] < 0 || bytes[i] > 255) {
        throw new AddressError('All bytes must be integers between 0 and 255');
      }
    }

    return this.fromUnsignedByteArray(bytes);
  }

  /**
   * Convert an unsigned byte array to an Address4 object
   * @param {Array<number>} bytes - an array of 4 unsigned bytes (0-255)
   * @returns {Address4}
   */
  static fromUnsignedByteArray(bytes: Array<number>): Address4 {
    if (bytes.length !== 4) {
      throw new AddressError('IPv4 addresses require exactly 4 bytes');
    }

    const address = bytes.join('.');
    return new Address4(address);
  }

  /**
   * Returns the first n bits of the address, defaulting to the
   * subnet mask
   * @returns {String}
   */
  mask(mask?: number): string {
    if (mask === undefined) {
      mask = this.subnetMask;
    }

    return this.getBitsBase2(0, mask);
  }

  /**
   * Returns the bits in the given range as a base-2 string
   * @returns {string}
   */
  getBitsBase2(start: number, end: number): string {
    return this.binaryZeroPad().slice(start, end);
  }

  /**
   * Return the reversed ip6.arpa form of the address
   * @param {Object} options
   * @param {boolean} options.omitSuffix - omit the "in-addr.arpa" suffix
   * @returns {String}
   */
  reverseForm(options?: common.ReverseFormOptions): string {
    if (!options) {
      options = {};
    }

    const reversed = this.correctForm().split('.').reverse().join('.');

    if (options.omitSuffix) {
      return reversed;
    }

    return `${reversed}.in-addr.arpa.`;
  }

  /**
   * Returns true if the given address is in the subnet of the current address
   * @returns {boolean}
   */
  isInSubnet = common.isInSubnet;

  /**
   * Returns true if the given address is a multicast address
   * @returns {boolean}
   */
  isMulticast(): boolean {
    return this.isInSubnet(MULTICAST_V4);
  }

  /**
   * Returns true if the address is in one of the [RFC 1918](https://datatracker.ietf.org/doc/html/rfc1918) private address ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
   * @returns {boolean}
   */
  isPrivate(): boolean {
    return PRIVATE_V4.some((subnet) => this.isInSubnet(subnet));
  }

  /**
   * Returns true if the address is in the loopback range `127.0.0.0/8` ([RFC 1122](https://datatracker.ietf.org/doc/html/rfc1122)).
   * @returns {boolean}
   */
  isLoopback(): boolean {
    return this.isInSubnet(LOOPBACK_V4);
  }

  /**
   * Returns true if the address is in the link-local range `169.254.0.0/16` ([RFC 3927](https://datatracker.ietf.org/doc/html/rfc3927)).
   * @returns {boolean}
   */
  isLinkLocal(): boolean {
    return this.isInSubnet(LINK_LOCAL_V4);
  }

  /**
   * Returns true if the address is the unspecified address `0.0.0.0`.
   * @returns {boolean}
   */
  isUnspecified(): boolean {
    return this.isInSubnet(UNSPECIFIED_V4);
  }

  /**
   * Returns true if the address is the limited broadcast address `255.255.255.255` ([RFC 919](https://datatracker.ietf.org/doc/html/rfc919)).
   * @returns {boolean}
   */
  isBroadcast(): boolean {
    return this.isInSubnet(BROADCAST_V4);
  }

  /**
   * Returns true if the address is in the carrier-grade NAT range `100.64.0.0/10` ([RFC 6598](https://datatracker.ietf.org/doc/html/rfc6598)).
   * @returns {boolean}
   */
  isCGNAT(): boolean {
    return this.isInSubnet(CGNAT_V4);
  }

  /**
   * Returns a zero-padded base-2 string representation of the address
   * @returns {string}
   */
  binaryZeroPad(): string {
    if (this._binaryZeroPad === undefined) {
      this._binaryZeroPad = this.bigInt().toString(2).padStart(constants.BITS, '0');
    }
    return this._binaryZeroPad;
  }

  /**
   * Groups an IPv4 address for inclusion at the end of an IPv6 address
   * @returns {String}
   */
  groupForV6(): string {
    const segments = this.parsedAddress;

    return this.correctForm().replace(
      constants.RE_ADDRESS,
      `<span class="hover-group group-v4 group-6">${segments
        .slice(0, 2)
        .join('.')}</span>.<span class="hover-group group-v4 group-7">${segments
        .slice(2, 4)
        .join('.')}</span>`,
    );
  }
}

const MULTICAST_V4 = new Address4('224.0.0.0/4');
const PRIVATE_V4 = [
  new Address4('10.0.0.0/8'),
  new Address4('172.16.0.0/12'),
  new Address4('192.168.0.0/16'),
];
const LOOPBACK_V4 = new Address4('127.0.0.0/8');
const LINK_LOCAL_V4 = new Address4('169.254.0.0/16');
const UNSPECIFIED_V4 = new Address4('0.0.0.0/32');
const BROADCAST_V4 = new Address4('255.255.255.255/32');
const CGNAT_V4 = new Address4('100.64.0.0/10');
