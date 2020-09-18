import * as common from '../common';
import * as v6 from './constants';

/**
 * Returns true if the address is valid, false otherwise
 * @memberof Address6
 * @instance
 * @returns {boolean}
 */
export const isValid = function (this: Address6) {
  return this.valid;
};

/**
 * Returns true if the given address is in the subnet of the current address
 * @memberof Address6
 * @instance
 * @returns {boolean}
 */
export const isInSubnet = common.isInSubnet;

/**
 * Returns true if the address is correct, false otherwise
 * @memberof Address6
 * @instance
 * @returns {boolean}
 */
export const isCorrect = common.isCorrect(v6.BITS);

/**
 * Returns true if the address is in the canonical form, false otherwise
 * @memberof Address6
 * @instance
 * @returns {boolean}
 */
export const isCanonical = common.falseIfInvalid(function () {
  return this.addressMinusSuffix === this.canonicalForm();
});

/**
 * Returns true if the address is a link local address, false otherwise
 * @memberof Address6
 * @instance
 * @returns {boolean}
 */
export const isLinkLocal = common.falseIfInvalid(function (this: Address6) {
  // Zeroes are required, i.e. we can't check isInSubnet with 'fe80::/10'
  if (this.getBitsBase2(0, 64) ===
    '1111111010000000000000000000000000000000000000000000000000000000') {
    return true;
  }

  return false;
});

/**
 * Returns true if the address is a multicast address, false otherwise
 * @memberof Address6
 * @instance
 * @returns {boolean}
 */
export const isMulticast = common.falseIfInvalid(function () {
  return this.getType() === 'Multicast';
});

/**
 * Returns true if the address is a v4-in-v6 address, false otherwise
 * @memberof Address6
 * @instance
 * @returns {boolean}
 */
export const is4 = common.falseIfInvalid(function () {
  return this.v4;
});

/**
 * Returns true if the address is a Teredo address, false otherwise
 * @memberof Address6
 * @instance
 * @returns {boolean}
 */
export const isTeredo = common.falseIfInvalid(function () {
  return this.isInSubnet(new this.constructor('2001::/32'));
});

/**
 * Returns true if the address is a 6to4 address, false otherwise
 * @memberof Address6
 * @instance
 * @returns {boolean}
 */
export const is6to4 = common.falseIfInvalid(function () {
  return this.isInSubnet(new this.constructor('2002::/16'));
});

/**
 * Returns true if the address is a loopback address, false otherwise
 * @memberof Address6
 * @instance
 * @returns {boolean}
 */
export const isLoopback = common.falseIfInvalid(function () {
  return this.getType() === 'Loopback';
});
