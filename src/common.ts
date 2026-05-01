import { Address4 } from './ipv4';
import { Address6 } from './ipv6';
import { AddressError } from './address-error';

export interface ReverseFormOptions {
  omitSuffix?: boolean;
}

export function isInSubnet(this: Address4 | Address6, address: Address4 | Address6) {
  if (this.subnetMask < address.subnetMask) {
    return false;
  }

  if (this.mask(address.subnetMask) === address.mask()) {
    return true;
  }

  return false;
}

export function isCorrect(defaultBits: number) {
  return function (this: Address4 | Address6) {
    if (this.addressMinusSuffix !== this.correctForm()) {
      return false;
    }

    if (this.subnetMask === defaultBits && !this.parsedSubnet) {
      return true;
    }

    return this.parsedSubnet === String(this.subnetMask);
  };
}

/**
 * Returns the prefix length (number of leading 1 bits) of a contiguous
 * subnet mask. Throws `AddressError` if the mask is non-contiguous (e.g.
 * `255.0.255.0`).
 */
export function prefixLengthFromMask(value: bigint, totalBits: number): number {
  const binary = value.toString(2).padStart(totalBits, '0');

  if (binary.length > totalBits) {
    throw new AddressError('Invalid subnet mask.');
  }

  const firstZero = binary.indexOf('0');

  if (firstZero === -1) {
    return totalBits;
  }

  if (binary.slice(firstZero).includes('1')) {
    throw new AddressError('Invalid subnet mask.');
  }

  return firstZero;
}

export function numberToPaddedHex(number: number) {
  return number.toString(16).padStart(2, '0');
}

export function stringToPaddedHex(numberString: string) {
  return numberToPaddedHex(parseInt(numberString, 10));
}

/**
 * @param binaryValue Binary representation of a value (e.g. `10`)
 * @param position Byte position, where 0 is the least significant bit
 */
export function testBit(binaryValue: string, position: number): boolean {
  const { length } = binaryValue;

  if (position > length) {
    return false;
  }

  const positionInString = length - position;
  return binaryValue.substring(positionInString, positionInString + 1) === '1';
}
