'use strict';

var common = require('../common.js');
var v6 = require('./constants.js');

/*
 * Returns true if the address is valid, false otherwise
 */
exports.isValid = function () {
  return this.valid;
};

/*
 * Returns true if the given address is in the subnet of the current address
 */
exports.isInSubnet = common.isInSubnet;

/*
 * Returns true if the address is correct, false otherwise
 */
exports.isCorrect = common.isCorrect(v6.BITS);

/*
 * Returns true if the address is in the canonical form, false otherwise
 */
exports.isCanonical = common.falseIfInvalid(function () {
  return this.addressMinusSuffix === this.canonicalForm();
});

/*
 * Returns true if the address is a link local address, false otherwise
 */
exports.isLinkLocal = common.falseIfInvalid(function () {
  // Zeroes are required, i.e. we can't check isInSubnet with 'fe80::/10'
  if (this.getBitsBase2(0, 64) ===
    '1111111010000000000000000000000000000000000000000000000000000000') {
    return true;
  }

  return false;
});

/*
 * Returns true if the address is a multicast address, false otherwise
 */
exports.isMulticast = common.falseIfInvalid(function () {
  return this.getType() === 'Multicast';
});

/*
 * Returns true if the address is a v4-in-v6 address, false otherwise
 */
exports.is4 = common.falseIfInvalid(function () {
  return this.v4;
});

/*
 * Returns true if the address is a Teredo address, false otherwise
 */
exports.isTeredo = common.falseIfInvalid(function () {
  return this.isInSubnet(new this.constructor('2001::/32'));
});

/*
 * Returns true if the address is a 6to4 address, false otherwise
 */
exports.is6to4 = common.falseIfInvalid(function () {
  return this.isInSubnet(new this.constructor('2002::/16'));
});

/*
 * Returns true if the address is a loopback address, false otherwise
 */
exports.isLoopback = common.falseIfInvalid(function () {
  return this.getType() === 'Loopback';
});
