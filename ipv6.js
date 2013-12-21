if (typeof exports !== 'undefined') {
  var sprintf = require('sprintf').sprintf;
  var BigInteger = require('./lib/node/bigint').BigInteger;
}

var v4 = this.v4 = {};
var v6 = this.v6 = {};

v4.GROUPS = 4;
v6.GROUPS = 8;

v4.BITS = 32;
v6.BITS = 128;

v6.SCOPES = {
  0: 'Reserved',
  1: 'Interface local',
  2: 'Link local',
  4: 'Admin local',
  5: 'Site local',
  8: 'Organization local',
  15: 'Global',
  16: 'Reserved'
};

v4.RE_ADDRESS = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/g;
v4.RE_SUBNET_STRING = /\/\d{1,2}$/;

v6.RE_BAD_CHARACTERS = /([^0-9a-f:\/%])/ig;
v6.RE_BAD_ADDRESS = /([0-9a-f]{5,}|:{3,}|[^:]:$|^:[^:]|\/$)/ig;

v6.RE_SUBNET_STRING = /\/\d{1,3}(?=%|$)/;
v6.RE_ZONE_STRING = /%.*$/;

v6.RE_URL = new RegExp(/([0-9a-f:]+)/);
v6.RE_URL_WITH_PORT = new RegExp(/\[([0-9a-f:]+)\]:([0-9]{1,5})/);

// Convenience functions
function map(array, fn) {
  var results = [];
  var i;

  for (i = 0; i < array.length; i++) {
    results.push(fn(array[i], i));
  }

  return results;
}

function repeatString(s, n) {
  var result = '';
  var i;

  for (i = 0; i < n; i++) {
    result += s;
  }

  return result;
}

function addCommas(number) {
  var r = /(\d+)(\d{3})/;

  while (r.test(number)) {
    number = number.replace(r, '$1,$2');
  }

  return number;
}

function spanLeadingZeroesSimple(group) {
  return group.replace(/^(0+)/, '<span class="zero">$1</span>');
}

function spanLeadingZeroes4(n) {
  n = n.replace(/^(0{1,})([1-9]+)$/, '<span class="parse-error">$1</span>$2');
  n = n.replace(/^(0{1,})(0)$/, '<span class="parse-error">$1</span>$2');

  return n;
}

function simpleRegularExpression(addressArray) {
  var output = [];
  var i;

  for (i = 0; i < addressArray.length; i++) {
    var segment = addressArray[i];

    if (segment.length < 4) {
      output.push(sprintf('0{0,%d}%s', 4 - segment.length, segment));
    } else {
      output.push(segment);
    }
  }

  return output.join(':');
}

function zeroPad(s, n) {
  return String(repeatString(0, n) + s).slice(n * -1);
}

function isInSubnet(address) {
  // XXX: This is a hunch
  if (this.subnetMask < address.subnetMask) {
    return false;
  }

  if (this.mask(address.subnetMask) === address.mask()) {
    return true;
  }

  return false;
}

/*
 * Instantiates an IPv4 address
 */
v4.Address = function (address) {
  this.valid = false;
  this.address = address;
  this.groups = v4.GROUPS;

  this.v4 = true;

  this.subnet = '/32';
  this.subnetMask = 32;

  var subnet = v4.RE_SUBNET_STRING.exec(address);

  if (subnet) {
    this.parsedSubnet = subnet[0].replace('/', '');
    this.subnetMask = parseInt(this.parsedSubnet, 10);
    this.subnet = '/' + this.subnetMask;

    if (this.subnetMask < 0 || this.subnetMask > v4.BITS) {
      this.valid = false;
      this.error = "Invalid subnet mask.";

      return;
    }

    address = address.replace(v4.RE_SUBNET_STRING, '');
  }

  this.addressMinusSuffix = address;

  this.parsedAddress = this.parse(address);
};

/*
 * Parses a v4 address
 */
v4.Address.prototype.parse = function (address) {
  var groups = address.split('.');

  if (address.match(v4.RE_ADDRESS)) {
    this.valid = true;
  } else {
    this.error = 'Invalid IPv4 address.';
  }

  return groups;
};

/*
 * Returns true if the address is valid
 */
v4.Address.prototype.isValid = function () {
  return this.valid;
};

/*
 * Returns the correct form of an address
 */
v4.Address.prototype.correctForm = function () {
  return this.parsedAddress.map(function (part) {
    return parseInt(part, 10);
  }).join('.');
};

/*
 * Returns true if the address is correct, false otherwise
 */
v4.Address.prototype.isCorrect = function () {
  return this.addressMinusSuffix === this.correctForm() &&
    (this.subnetMask === 32 ||
      this.parsedSubnet === String(this.subnet.replace('/')));
};

/*
 * Converts a hex string to an IPv4 address object
 */
v4.Address.fromHex = function (hex) {
  var padded = zeroPad(hex.replace(/:/g, ''), 8);
  var groups = [];
  var i;

  for (i = 0; i < 8; i += 2) {
    var h = padded.slice(i, i + 2);

    groups.push(parseInt(h, 16));
  }

  return new v4.Address(groups.join('.'));
};

/*
 * Converts an integer into a IPv4 address object
 */
v4.Address.fromInteger = function (integer) {
  return v4.Address.fromHex(integer.toString(16));
};

/*
 * Converts an IPv4 address object to a hex string
 */
v4.Address.prototype.toHex = function () {
  return this.parsedAddress.map(function (part) {
    return sprintf('%02x', parseInt(part, 10));
  }).join(':');
};

/*
 * Converts an IPv4 address object to an array of bytes
 */
v4.Address.prototype.toArray = function () {
  return this.parsedAddress.map(function (part) {
    return parseInt(part, 10);
  });
};

/*
 * Converts an IPv4 address object to an IPv6 address group
 */
v4.Address.prototype.toV6Group = function () {
  var output = [];
  var i;

  for (i = 0; i < v4.GROUPS; i += 2) {
    var hex = sprintf('%02x%02x',
      parseInt(this.parsedAddress[i], 10),
      parseInt(this.parsedAddress[i + 1], 10));

    output.push(sprintf('%x', parseInt(hex, 16)));
  }

  return output.join(':');
};

/*
 * Returns the address as a BigInteger
 */
v4.Address.prototype.bigInteger = function () {
  if (!this.valid) {
    return;
  }

  return new BigInteger(map(this.parsedAddress, function (n) {
    return sprintf("%02x", parseInt(n, 10));
  }).join(''), 16);
};

/*
 * The first address in the range given by this address' subnet.
 * Often referred to as the Network Address.
 */
v4.Address.prototype.startAddress = function () {
  var startAddress = new BigInteger(this.mask() + repeatString(0,
    v4.BITS - this.subnetMask), 2);

  return v4.Address.fromBigInteger(startAddress);
};

/*
 * The last address in the range given by this address' subnet
 * Often referred to as the Broadcast
 */
v4.Address.prototype.endAddress = function () {
  var endAddress = new BigInteger(this.mask() + repeatString(1,
    v4.BITS - this.subnetMask), 2);

  return v4.Address.fromBigInteger(endAddress);
};

/*
 * Converts a BigInteger to a v4 address object
 */
v4.Address.fromBigInteger = function (bigInteger) {
  return v4.Address.fromInteger(parseInt(bigInteger.toString(), 10));
};

/*
 * Returns the first n bits of the address, defaulting to the
 * subnet mask
 */
v4.Address.prototype.mask = function (opt_mask) {
  if (opt_mask === undefined) {
    opt_mask = this.subnetMask;
  }

  return this.getBitsBase2(0, opt_mask);
};

/*
 * Returns the bits in the given range as a base-2 string
 */
v4.Address.prototype.getBitsBase2 = function (start, end) {
  return this.binaryZeroPad().slice(start, end);
};

/*
 * Returns true if the given address is in the subnet of the current address
 */
v4.Address.prototype.isInSubnet = isInSubnet;

/*
 * Returns a zero-padded base-2 string representation of the address
 */
v4.Address.prototype.binaryZeroPad = function () {
  return zeroPad(this.bigInteger().toString(2), v4.BITS);
};

/*
 * Instantiates an IPv6 address
 */
v6.Address = function (address, opt_groups) {
  if (opt_groups === undefined) {
    this.groups = v6.GROUPS;
  } else {
    this.groups = opt_groups;
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
      this.error = "Invalid subnet mask.";

      return;
    }

    address = address.replace(v6.RE_SUBNET_STRING, '');
  } else if (/\//.test(address)) {
    this.valid = false;
    this.error = "Invalid subnet mask.";

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

/*
 * Converts a BigInteger to a v6 address object
 */
v6.Address.fromBigInteger = function (bigInteger) {
  var hex = zeroPad(bigInteger.toString(16), 32);
  var groups = [];
  var i;

  for (i = 0; i < 8; i++) {
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
  if (url.indexOf('[') !== -1 && url.indexOf(']') !== -1) {
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
 * Returns true if the address is valid, false otherwise
 */
v6.Address.prototype.isValid = function () {
  return this.valid;
};

/*
 * Returns true if the address is correct, false otherwise
 */
v6.Address.prototype.isCorrect = function () {
  return this.addressMinusSuffix === this.correctForm() &&
    (this.subnetMask === 128 ||
      this.parsedSubnet === String(this.subnet.replace('/')));
};

/*
 * Returns true if the address is a link local address, false otherwise
 */
v6.Address.prototype.isLinkLocal = function () {
  // Zeroes are required, i.e. we can't check isInSubnet with 'fe80::/10'
  if (this.getBitsBase2(0, 64) ===
    "1111111010000000000000000000000000000000000000000000000000000000") {
    return true;
  }

  return false;
};

/*
 * Returns true if the address is in the canonical form, false otherwise
 */
v6.Address.prototype.isCanonical = function () {
  return this.addressMinusSuffix === this.canonicalForm();
};

/*
 * Returns true if the address is a multicast address, false otherwise
 */
v6.Address.prototype.isMulticast = function () {
  return this.getType() === 'Multicast';
};

/*
 * Returns true if the address is a v4-in-v6 address, false otherwise
 */
v6.Address.prototype.is4 = function () {
  return this.v4;
};

/*
 * Returns true if the address is a Teredo address, false otherwise
 */
v6.Address.prototype.isTeredo = function () {
  if (this.isInSubnet(new v6.Address('2001::/32'))) {
    return true;
  }

  return false;
};

/*
 * Returns true if the address is a 6to4 address, false otherwise
 */
v6.Address.prototype.is6to4 = function () {
  if (this.isInSubnet(new v6.Address('2002::/16'))) {
    return true;
  }

  return false;
};

/*
 * Returns true if the address is a loopback address, false otherwise
 */
v6.Address.prototype.isLoopback = function () {
  return this.getType() === 'Loopback';
};

/*
 * Returns the Microsoft UNC transcription of the address
 */
v6.Address.prototype.microsoftTranscription = function () {
  return sprintf('%s.ipv6-literal.net',
    this.correctForm().replace(/:/g, '-'));
};

/*
 * Returns the address in link form with a default port of 80
 */
v6.Address.prototype.href = function (opt_port) {
  if (opt_port === undefined) {
    opt_port = '';
  } else {
    opt_port = sprintf(':%s', opt_port);
  }

  return sprintf('http://[%s]%s/', this.correctForm(), opt_port);
};

/*
 * Returns the first n bits of the address, defaulting to the
 * subnet mask
 */
v6.Address.prototype.mask = function (opt_mask) {
  if (opt_mask === undefined) {
    opt_mask = this.subnetMask;
  }

  return this.getBitsBase2(0, opt_mask);
};

/*
 * Returns a link suitable for conveying the address via a URL hash
 */
v6.Address.prototype.link = function (options) {
  if (!options) {
    options = {};
  }

  if (options.className === undefined) {
    options.className = '';
  }

  if (options.prefix === undefined) {
    options.prefix = '/#address=';
  }

  if (options.v4 === undefined) {
    options.v4 = false;
  }

  var formFunction = this.correctForm;

  if (options.v4) {
    formFunction = this.v4inv6;
  }

  if (options.className) {
    return sprintf('<a href="%1$s%2$s" class="%3$s">%2$s</a>',
      options.prefix, formFunction.call(this), options.className);
  }

  return sprintf('<a href="%1$s%2$s">%2$s</a>', options.prefix,
    formFunction.call(this));
};

/*
 * Returns the number of possible subnets of a given size in the address
 */
v6.Address.prototype.possibleAddresses = function (opt_subnetSize) {
  if (opt_subnetSize === undefined) {
    opt_subnetSize = 0;
  }

  return addCommas(new BigInteger('2', 10).pow((v6.BITS - this.subnetMask) -
    (v6.BITS - opt_subnetSize)).toString(10));
};

/*
 * Returns true if the given address is in the subnet of the current address
 */
v6.Address.prototype.isInSubnet = isInSubnet;

/*
 * Create an IPv6-mapped address given an IPv4 address
 */
v6.Address.fromAddress4 = function (address4) {
  return new v6.Address('::ffff:' + address4);
};

/*
 * The first address in the range given by this address' subnet
 */
v6.Address.prototype.startAddress = function () {
  var startAddress = new BigInteger(this.mask() + repeatString(0,
    v6.BITS - this.subnetMask), 2);

  return v6.Address.fromBigInteger(startAddress);
};

/*
 * The last address in the range given by this address' subnet
 */
v6.Address.prototype.endAddress = function () {
  var endAddress = new BigInteger(this.mask() + repeatString(1,
    v6.BITS - this.subnetMask), 2);

  return v6.Address.fromBigInteger(endAddress);
};

/*
 * Returns the scope of the address
 */
v6.Address.prototype.getScope = function () {
  var scope = v6.SCOPES[this.getBits(12, 16)];

  if (this.getType() === "Global unicast") {
    if (scope !== "Link local") {
      scope = "Global";
    }
  }

  return scope;
};

/*
 * Returns the type of the address
 */
v6.Address.prototype.getType = function () {
  // TODO: Refactor this
  // TODO: Add ff0x::fb, etc. for multicast DNS
  var TYPES = {
    'ff01::1/128': 'Multicast (All nodes on this interface)',
    'ff01::2/128': 'Multicast (All routers on this interface)',
    'ff02::1/128': 'Multicast (All nodes on this link)',
    'ff02::2/128': 'Multicast (All routers on this link)',
    'ff05::2/128': 'Multicast (All routers in this site)',
    'ff02::5/128': 'Multicast (OSPFv3 AllSPF routers)',
    'ff02::6/128': 'Multicast (OSPFv3 AllDR routers)',
    'ff02::9/128': 'Multicast (RIP routers)',
    'ff02::a/128': 'Multicast (EIGRP routers)',
    'ff02::d/128': 'Multicast (PIM routers)',
    'ff02::16/128': 'Multicast (MLDv2 reports)',
    'ff01::fb/128': 'Multicast (mDNSv6)',
    'ff02::fb/128': 'Multicast (mDNSv6)',
    'ff05::fb/128': 'Multicast (mDNSv6)',
    'ff02::1:2/128': 'Multicast (All DHCP servers and relay agents on this link)',
    'ff05::1:2/128': 'Multicast (All DHCP servers and relay agents in this site)',
    'ff02::1:3/128': 'Multicast (All DHCP servers on this link)',
    'ff05::1:3/128': 'Multicast (All DHCP servers in this site)',
    '::/128': 'Unspecified',
    '::1/128': 'Loopback',
    'ff00::/8': 'Multicast',
    'fe80::/10': 'Link-local unicast'
  };

  var type = 'Global unicast';
  var p;

  for (p in TYPES) {
    if (TYPES.hasOwnProperty(p)) {
      if (this.isInSubnet(new v6.Address(p))) {
        type = TYPES[p];

        break;
      }
    }
  }

  return type;
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
    return;
  }

  return zeroPad(this.getBits(start, end).toString(16), length / 4);
};

/*
 * Returns the bits that are set past the subnet mask length
 */
v6.Address.prototype.getBitsPastSubnet = function () {
  return this.getBitsBase2(this.subnetMask, v6.BITS);
};

/*
 * Returns the string with each character contained in a <span>
 */
v6.Address.spanAll = function (s, opt_offset) {
  if (opt_offset === undefined) {
    opt_offset = 0;
  }

  var letters = s.split('');

  return map(letters, function (n, i) {
    return sprintf('<span class="digit value-%s position-%d">%s</span>', n,
      i + opt_offset,
      v6.Address.spanAllZeroes(n)); // XXX Use #base-2 .value-0 instead?
  }).join('');
};

/*
 * Returns the string with all zeroes contained in a <span>
 */
v6.Address.spanAllZeroes = function (s) {
  return s.replace(/(0+)/g, '<span class="zero">$1</span>');
};

/*
 * Returns the string with leading zeroes contained in a <span>
 */
v6.Address.spanLeadingZeroes = function (address) {
  var groups = address.split(':');

  groups = map(groups, function (g) {
    return spanLeadingZeroesSimple(g);
  });

  return groups.join(':');
};

/*
 * Groups an address
 */
v6.Address.simpleGroup = function (addressString, offset) {
  var groups = addressString.split(':');

  if (!offset) {
    offset = 0;
  }

  groups = map(groups, function (g, i) {
    if (/group-v4/.test(g)) {
      return g;
    }

    return sprintf('<span class="hover-group group-%d">%s</span>',
      i + offset,
      spanLeadingZeroesSimple(g));
  });

  return groups.join(':');
};

/*
 * Groups an address
 */
v6.Address.group = function (addressString) {
  var address6 = new v6.Address(addressString);
  var address4 = address6.address.match(v4.RE_ADDRESS);
  var i;

  if (address4) {
    // The IPv4 case
    var segments = address4[0].split('.');

    address6.address = address6.address.replace(v4.RE_ADDRESS,
      sprintf('<span class="hover-group group-v4 group-6">%s</span>' +
        '.' +
        '<span class="hover-group group-v4 group-7">%s</span>',
        segments.slice(0, 2).join('.'),
        segments.slice(2, 4).join('.')));
  }

  if (address6.elidedGroups === 0) {
    // The simple case
    return v6.Address.simpleGroup(address6.address);
  }

  // The elided case
  var output = [];

  var halves = address6.address.split('::');

  if (halves[0].length) {
    output.push(v6.Address.simpleGroup(halves[0]));
  } else {
    output.push('');
  }

  var classes = ['hover-group'];

  for (i = address6.elisionBegin; i < address6.elisionBegin +
    address6.elidedGroups; i++) {
    classes.push(sprintf('group-%d', i));
  }

  output.push(sprintf('<span class="%s"></span>', classes.join(' ')));

  if (halves[1].length) {
    output.push(v6.Address.simpleGroup(halves[1], address6.elisionEnd));
  } else {
    output.push('');
  }

  return output.join(':');
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
    return sprintf("%s.ip6.arpa.", reversed);
  }

  return 'ip6.arpa.';
};

/*
 * Returns the correct form of the address
 */
v6.Address.prototype.correctForm = function () {
  if (!this.parsedAddress) {
    return;
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

  var zeroLengths = map(zeroes, function (n) {
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
  return zeroPad(this.bigInteger().toString(2), v6.BITS);
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
          map(temp4.parsedAddress, spanLeadingZeroes4).join('.'));

        return;
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
    return;
  }

  var badCharacters = address.match(v6.RE_BAD_CHARACTERS);

  if (badCharacters) {
    this.valid = false;
    this.error = sprintf("Bad character%s detected in address: %s",
      badCharacters.length > 1 ? 's' : '', badCharacters.join(''));

    this.parseError = address.replace(v6.RE_BAD_CHARACTERS,
      '<span class="parse-error">$1</span>');

    return;
  }

  var badAddress = address.match(v6.RE_BAD_ADDRESS);

  if (badAddress) {
    this.valid = false;
    this.error = sprintf("Address failed regex: %s", badAddress.join(''));

    this.parseError = address.replace(v6.RE_BAD_ADDRESS,
      '<span class="parse-error">$1</span>');

    return;
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
      this.error = "Error parsing groups";

      return;
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
    this.error = "Too many :: groups found";

    return;
  }

  groups = map(groups, function (g) {
    return sprintf('%x', parseInt(g, 16));
  });

  if (groups.length !== this.groups) {
    this.valid = false;
    this.error = "Incorrect number of groups found";

    return;
  }

  groups.forEach(function (group, i) {
    if (groups.length > 4 && !this.v4) {
      this.valid = false;
      this.error = sprintf("Group %d is too long", i + 1);

      return;
    }
  });

  this.valid = true;

  return groups;
};

/*
 * Generate a regular expression string that can be used to find or validate all
 * variations of this address.
 */
v6.Address.prototype.regularExpressionString = function (opt_subString) {
  if (opt_subString === undefined) {
    opt_subString = false;
  }

  var i;
  var output = [];

  var address6 = new v6.Address(this.correctForm());

  if (address6.elidedGroups === 0) {
    // The simple case
    output = simpleRegularExpression(address6.parsedAddress);
  } else if (address6.elidedGroups === 8) {
    output.push('::|');

    // TODO: Validate this
    for (i = 0; i < address6.elidedGroups; i++) {
      var pipe = '|';

      if (i === address6.elidedGroups - 1) {
        pipe = '';
      }

      output.push(sprintf('(0{1,4}:){%d}:%s', address6.elidedGroups, pipe));
    }
  } else {
    // The elided case

    // TODO: Allow sloppy elision
    // TODO: Compute all possible elisions
    var halves = address6.address.split('::');

    if (halves[0].length) {
      output = output.concat(simpleRegularExpression(halves[0].split(':')));
      output.push(':');
    }

    output.push(sprintf('((0{1,4}:){%d}|:)', address6.elidedGroups));

    if (halves[1].length) {
      output = output.concat(simpleRegularExpression(halves[1].split(':')));
    }
  }

  if (!opt_subString) {
    output = [].concat('\\b', output, '\\b');
  }

  return output.join('');
};

/*
 * Generate a regular expression that can be used to find or validate all
 * variations of this address.
 */
v6.Address.prototype.regularExpression = function () {
  return new RegExp(this.regularExpressionString(), 'i');
};

/*
 * Returns the canonical form of the address
 */
v6.Address.prototype.canonicalForm = function () {
  if (!this.valid) {
    return;
  }

  return map(this.parsedAddress, function (n) {
    return sprintf("%04x", parseInt(n, 16));
  }).join(':');
};

/*
 * Returns the decimal form of the address
 */
v6.Address.prototype.decimal = function () {
  if (!this.valid) {
    return;
  }

  return map(this.parsedAddress, function (n) {
    return sprintf("%05d", parseInt(n, 16));
  }).join(':');
};

/*
 * Returns the address as a BigInteger
 */
v6.Address.prototype.bigInteger = function () {
  if (!this.valid) {
    return;
  }

  return new BigInteger(map(this.parsedAddress, function (n) {
    return sprintf("%04x", parseInt(n, 16));
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
