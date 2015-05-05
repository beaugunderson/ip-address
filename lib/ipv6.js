'use strict';

var BigInteger = require('jsbn');
var common = require('./common.js');
var find = require('lodash.find');
var merge = require('lodash.merge');
var sprintf = require('sprintf').sprintf;

var v4 = require('./ipv4.js').v4;

var v6 = exports.v6 = {
  helpers: require('./v6/helpers.js')
};

merge(v6, require('./v6/constants.js'));

function addCommas(number) {
  var r = /(\d+)(\d{3})/;

  while (r.test(number)) {
    number = number.replace(r, '$1,$2');
  }

  return number;
}

function spanLeadingZeroes4(n) {
  n = n.replace(/^(0{1,})([1-9]+)$/, '<span class="parse-error">$1</span>$2');
  n = n.replace(/^(0{1,})(0)$/, '<span class="parse-error">$1</span>$2');

  return n;
}

/*
 * Instantiates an IPv6 address
 */
v6.Address = function (address, optionalGroups) {
  if (optionalGroups === undefined) {
    this.groups = v6.GROUPS;
  } else {
    this.groups = optionalGroups;
  }

  this.v4 = false;

  this.subnet = '/128';
  this.subnetMask = 128;

  this.zone = '';

  this.address = address;

  var subnet = v6.RE_SUBNET_STRING.exec(address);

  if (subnet) {
    this.parsedSubnet = subnet[0].replace('/', '');
    this.subnetMask = parseInt(this.parsedSubnet, 10);
    this.subnet = '/' + this.subnetMask;

    if (isNaN(this.subnetMask) ||
      this.subnetMask < 0 ||
      this.subnetMask > v6.BITS) {
      this.valid = false;
      this.error = 'Invalid subnet mask.';

      return;
    }

    address = address.replace(v6.RE_SUBNET_STRING, '');
  } else if (/\//.test(address)) {
    this.valid = false;
    this.error = 'Invalid subnet mask.';

    return;
  }

  var zone = v6.RE_ZONE_STRING.exec(address);

  if (zone) {
    this.zone = zone[0];

    address = address.replace(v6.RE_ZONE_STRING, '');
  }

  this.addressMinusSuffix = address;

  this.parsedAddress = this.parse(this.addressMinusSuffix);
};

merge(v6.Address.prototype, require('./v6/attributes.js'));
merge(v6.Address.prototype, require('./v6/html.js'));
merge(v6.Address.prototype, require('./v6/regular-expressions.js'));

/*
 * Converts a BigInteger to a v6 address object
 */
v6.Address.fromBigInteger = function (bigInteger) {
  var hex = common.zeroPad(bigInteger.toString(16), 32);
  var groups = [];
  var i;

  for (i = 0; i < v6.GROUPS; i++) {
    groups.push(hex.slice(i * 4, (i + 1) * 4));
  }

  return new v6.Address(groups.join(':'));
};

/*
 * Converts a URL (optional port number) to an address object
 */
v6.Address.fromURL = function (url) {
  var host;
  var port;
  var result;

  // If we have brackets parse them and find a port
  if (url.indexOf('[') !== -1 && url.indexOf(']:') !== -1) {
    result = v6.RE_URL_WITH_PORT.exec(url);

    if (result === null) {
      return {
        error: 'failed to parse address with port',
        address: null,
        port: null
      };
    }

    host = result[1];
    port = result[2];
  // If there's a URL extract the address
  } else if (url.indexOf('/') !== -1) {
    // Remove the protocol prefix
    url = url.replace(/^[a-z0-9]+:\/\//, '');

    // Parse the address
    result = v6.RE_URL.exec(url);

    if (result === null) {
      return {
        error: 'failed to parse address from URL',
        address: null,
        port: null
      };
    }

    host = result[1];
  // Otherwise just assign the URL to the host and let the library parse it
  } else {
    host = url;
  }

  // If there's a port convert it to an integer
  if (port) {
    port = parseInt(port, 10);

    //squelch out of range ports
    if (port < 0 || port > 65536) {
      port = null;
    }
  } else {
    // Standardize `undefined` to `null`
    port = null;
  }

  return {
    address: new v6.Address(host),
    port: port
  };
};

/*
 * Create an IPv6-mapped address given an IPv4 address
 */
v6.Address.fromAddress4 = function (address4) {
  return new v6.Address('::ffff:' + address4);
};

/*
 * A helper function to compact an array
 */
v6.Address.compact = function (address, slice) {
  var s1 = [];
  var s2 = [];
  var i;

  for (i = 0; i < address.length; i++) {
    if (i < slice[0]) {
      s1.push(address[i]);
    } else if (i > slice[1]) {
      s2.push(address[i]);
    }
  }

  return s1.concat(['compact']).concat(s2);
};

/*
 * Returns the Microsoft UNC transcription of the address
 */
v6.Address.prototype.microsoftTranscription = function () {
  return sprintf('%s.ipv6-literal.net',
    this.correctForm().replace(/:/g, '-'));
};

/*
 * Returns the first n bits of the address, defaulting to the
 * subnet mask
 */
v6.Address.prototype.mask = function (optionalMask) {
  if (optionalMask === undefined) {
    optionalMask = this.subnetMask;
  }

  return this.getBitsBase2(0, optionalMask);
};

/*
 * Returns the number of possible subnets of a given size in the address
 */
v6.Address.prototype.possibleSubnets = function (optionalSubnetSize) {
  if (optionalSubnetSize === undefined) {
    optionalSubnetSize = 128;
  }

  var availableBits = v6.BITS - this.subnetMask;
  var subnetBits = Math.abs(optionalSubnetSize - v6.BITS);
  var subnetPowers = availableBits - subnetBits;

  if (subnetPowers < 0) {
    return '0';
  }

  return addCommas(new BigInteger('2', 10).pow(subnetPowers).toString(10));
};

/*
 * The first address in the range given by this address' subnet
 */
v6.Address.prototype.startAddress = function () {
  var startAddress = new BigInteger(this.mask() +
    common.repeatString(0, v6.BITS - this.subnetMask), 2);

  return v6.Address.fromBigInteger(startAddress);
};

/*
 * The last address in the range given by this address' subnet
 */
v6.Address.prototype.endAddress = function () {
  var endAddress = new BigInteger(this.mask() +
    common.repeatString(1, v6.BITS - this.subnetMask), 2);

  return v6.Address.fromBigInteger(endAddress);
};

/*
 * Returns the scope of the address
 */
v6.Address.prototype.getScope = function () {
  var scope = v6.SCOPES[this.getBits(12, 16)];

  if (this.getType() === 'Global unicast' &&
      scope !== 'Link local') {
    scope = 'Global';
  }

  return scope;
};

/*
 * Returns the type of the address
 */
v6.Address.prototype.getType = function () {
  var self = this;

  function isType(name, type) {
    return self.isInSubnet(new v6.Address(type));
  }

  return find(v6.TYPES, isType) || 'Global unicast';
};

/*
 * Returns the bits in the given range as a BigInteger
 */
v6.Address.prototype.getBits = function (start, end) {
  return new BigInteger(this.getBitsBase2(start, end), 2);
};

/*
 * Returns the bits in the given range as a base-2 string
 */
v6.Address.prototype.getBitsBase2 = function (start, end) {
  return this.binaryZeroPad().slice(start, end);
};

/*
 * Returns the bits in the given range as a base-16 string
 */
v6.Address.prototype.getBitsBase16 = function (start, end) {
  var length = end - start;

  if (length % 4 !== 0) {
    return null;
  }

  return common.zeroPad(this.getBits(start, end).toString(16), length / 4);
};

/*
 * Returns the bits that are set past the subnet mask length
 */
v6.Address.prototype.getBitsPastSubnet = function () {
  return this.getBitsBase2(this.subnetMask, v6.BITS);
};

/*
 * Returns the reversed ip6.arpa form of the address
 */
v6.Address.prototype.reverseForm = function () {
  var characters = Math.floor(this.subnetMask / 4);

  var reversed = this.canonicalForm()
    .replace(/:/g, '')
    .split('')
    .slice(0, characters)
    .reverse()
    .join('.');

  if (characters > 0) {
    return sprintf('%s.ip6.arpa.', reversed);
  }

  return 'ip6.arpa.';
};

/*
 * Returns the correct form of the address
 */
v6.Address.prototype.correctForm = function () {
  if (!this.parsedAddress) {
    return null;
  }

  var i;
  var groups = [];

  var zeroCounter = 0;
  var zeroes = [];

  for (i = 0; i < this.parsedAddress.length; i++) {
    var value = parseInt(this.parsedAddress[i], 16);

    if (value === 0) {
      zeroCounter++;
    }

    if (value !== 0 && zeroCounter > 0) {
      if (zeroCounter > 1) {
        zeroes.push([i - zeroCounter, i - 1]);
      }

      zeroCounter = 0;
    }
  }

  // Do we end with a string of zeroes?
  if (zeroCounter > 1) {
    zeroes.push([this.parsedAddress.length - zeroCounter,
      this.parsedAddress.length - 1]);
  }

  var zeroLengths = zeroes.map(function (n) {
    return (n[1] - n[0]) + 1;
  });

  if (zeroes.length > 0) {
    var max = Math.max.apply(Math, zeroLengths);
    var index = zeroLengths.indexOf(max);

    groups = v6.Address.compact(this.parsedAddress, zeroes[index]);
  } else {
    groups = this.parsedAddress;
  }

  for (i = 0; i < groups.length; i++) {
    if (groups[i] !== 'compact') {
      groups[i] = parseInt(groups[i], 16).toString(16);
    }
  }

  var correct = groups.join(':');

  correct = correct.replace(/^compact$/, '::');
  correct = correct.replace(/^compact|compact$/, ':');
  correct = correct.replace(/compact/, '');

  return correct;
};

/*
 * Returns a zero-padded base-2 string representation of the address
 */
v6.Address.prototype.binaryZeroPad = function () {
  return common.zeroPad(this.bigInteger().toString(2), v6.BITS);
};

// TODO: Improve the semantics of this helper function
v6.Address.prototype.parse4in6 = function (address) {
  var groups = address.split(':');
  var lastGroup = groups.slice(-1)[0];

  var address4 = lastGroup.match(v4.RE_ADDRESS);

  if (address4) {
    var temp4 = new v4.Address(address4[0]);

    for (var i = 0; i < temp4.groups; i++) {
      if (/^0[0-9]+/.test(temp4.parsedAddress[i])) {
        this.valid = false;
        this.error = 'IPv4 addresses can not have leading zeroes.';

        this.parseError = address.replace(v4.RE_ADDRESS,
          temp4.parsedAddress.map(spanLeadingZeroes4).join('.'));

        return null;
      }
    }

    this.v4 = true;

    groups[groups.length - 1] = temp4.toV6Group();

    address = groups.join(':');
  }

  return address;
};

// TODO: Make private?
v6.Address.prototype.parse = function (address) {
  address = this.parse4in6(address);

  if (this.error) {
    return null;
  }

  var badCharacters = address.match(v6.RE_BAD_CHARACTERS);

  if (badCharacters) {
    this.valid = false;
    this.error = sprintf('Bad character%s detected in address: %s',
      badCharacters.length > 1 ? 's' : '', badCharacters.join(''));

    this.parseError = address.replace(v6.RE_BAD_CHARACTERS,
      '<span class="parse-error">$1</span>');

    return null;
  }

  var badAddress = address.match(v6.RE_BAD_ADDRESS);

  if (badAddress) {
    this.valid = false;
    this.error = sprintf('Address failed regex: %s', badAddress.join(''));

    this.parseError = address.replace(v6.RE_BAD_ADDRESS,
      '<span class="parse-error">$1</span>');

    return null;
  }

  var groups = [];

  var halves = address.split('::');

  if (halves.length === 2) {
    var first = halves[0].split(':');
    var last = halves[1].split(':');

    if (first.length === 1 &&
      first[0] === '') {
      first = [];
    }

    if (last.length === 1 &&
      last[0] === '') {
      last = [];
    }

    var remaining = this.groups - (first.length + last.length);

    if (!remaining) {
      this.valid = false;
      this.error = 'Error parsing groups';

      return null;
    }

    this.elidedGroups = remaining;

    this.elisionBegin = first.length;
    this.elisionEnd = first.length + this.elidedGroups;

    first.forEach(function (group) {
      groups.push(group);
    });

    for (var i = 0; i < remaining; i++) {
      groups.push(0);
    }

    last.forEach(function (group) {
      groups.push(group);
    });
  } else if (halves.length === 1) {
    groups = address.split(':');

    this.elidedGroups = 0;
  } else {
    this.valid = false;
    this.error = 'Too many :: groups found';

    return null;
  }

  groups = groups.map(function (g) {
    return sprintf('%x', parseInt(g, 16));
  });

  if (groups.length !== this.groups) {
    this.valid = false;
    this.error = 'Incorrect number of groups found';

    return null;
  }

  this.valid = true;

  return groups;
};

/*
 * Returns the canonical form of the address
 */
v6.Address.prototype.canonicalForm = function () {
  if (!this.valid) {
    return null;
  }

  return this.parsedAddress.map(function (n) {
    return sprintf('%04x', parseInt(n, 16));
  }).join(':');
};

/*
 * Returns the decimal form of the address
 */
v6.Address.prototype.decimal = function () {
  if (!this.valid) {
    return null;
  }

  return this.parsedAddress.map(function (n) {
    return sprintf('%05d', parseInt(n, 16));
  }).join(':');
};

/*
 * Returns the address as a BigInteger
 */
v6.Address.prototype.bigInteger = function () {
  if (!this.valid) {
    return null;
  }

  return new BigInteger(this.parsedAddress.map(function (n) {
    return sprintf('%04x', parseInt(n, 16));
  }).join(''), 16);
};

/*
 * Returns the v4-in-v6 form of the address
 */
v6.Address.prototype.v4inv6 = function () {
  var binary = this.binaryZeroPad().split('');

  var address4 = v4.Address.fromHex(new BigInteger(binary.slice(96, 128)
    .join(''), 2).toString(16));
  var address6 = new v6.Address(this.parsedAddress.slice(0, 6).join(':'), 6);

  var correct = address6.correctForm();

  var infix = '';

  if (!/:$/.test(correct)) {
    infix = ':';
  }

  return address6.correctForm() + infix + address4.address;
};

/*
 * Returns an object containing the Teredo properties of the address
 */
v6.Address.prototype.teredo = function () {
  /*
  - Bits 0 to 31 are set to the Teredo prefix (normally 2001:0000::/32).
  - Bits 32 to 63 embed the primary IPv4 address of the Teredo server that
    is used.
  - Bits 64 to 79 can be used to define some flags. Currently only the
    higher order bit is used; it is set to 1 if the Teredo client is
    located behind a cone NAT, 0 otherwise. For Microsoft's Windows Vista
    and Windows Server 2008 implementations, more bits are used. In those
    implementations, the format for these 16 bits is "CRAAAAUG AAAAAAAA",
    where "C" remains the "Cone" flag. The "R" bit is reserved for future
    use. The "U" bit is for the Universal/Local flag (set to 0). The "G" bit
    is Individual/Group flag (set to 0). The A bits are set to a 12-bit
    randomly generated number chosen by the Teredo client to introduce
    additional protection for the Teredo node against IPv6-based scanning
    attacks.
  - Bits 80 to 95 contains the obfuscated UDP port number. This is the
    port number that is mapped by the NAT to the Teredo client with all
    bits inverted.
  - Bits 96 to 127 contains the obfuscated IPv4 address. This is the
    public IPv4 address of the NAT with all bits inverted.
  */
  var prefix = this.getBitsBase16(0, 32);

  var udpPort = this.getBits(80, 96).xor(new BigInteger('ffff', 16)).toString();

  var server4 = v4.Address.fromHex(this.getBitsBase16(32, 64));
  var client4 = v4.Address.fromHex(this.getBits(96, 128)
    .xor(new BigInteger('ffffffff', 16)).toString(16));

  var flags = this.getBits(64, 80);
  var flagsBase2 = this.getBitsBase2(64, 80);

  var coneNat = flags.testBit(15);
  var reserved = flags.testBit(14);
  var groupIndividual = flags.testBit(8);
  var universalLocal = flags.testBit(9);
  var nonce = new BigInteger(flagsBase2.slice(2, 6) +
    flagsBase2.slice(8, 16), 2).toString(10);

  return {
    prefix: sprintf('%s:%s', prefix.slice(0, 4), prefix.slice(4, 8)),
    server4: server4.address,
    client4: client4.address,
    flags: flagsBase2,
    coneNat: coneNat,
    microsoft: {
      reserved: reserved,
      universalLocal: universalLocal,
      groupIndividual: groupIndividual,
      nonce: nonce
    },
    udpPort: udpPort
  };
};

/*
 * Returns an object containing the 6to4 properties of the address
 */
v6.Address.prototype.six2four = function () {
  /*
  - Bits 0 to 15 are set to the 6to4 prefix (2002::/16).
  - Bits 16 to 48 embed the IPv4 address of the 6to4 gateway that is used.
  */

  var prefix = this.getBitsBase16(0, 16);

  var gateway = v4.Address.fromHex(this.getBitsBase16(16, 48));

  return {
    prefix: sprintf('%s', prefix.slice(0, 4)),
    gateway: gateway.address
  };
};

/*
 * Returns a v6 6to4 address from a v6 v4inv6 address.
 */
v6.Address.prototype.get6to4 = function () {
  if (!this.is4()) {
    return null;
  }

  var addr6to4 = [
    '2002',
    this.getBitsBase16(96, 112),
    this.getBitsBase16(112, 128),
    '',
    '/16'
  ].join(':');

  return new v6.Address(addr6to4);
};
