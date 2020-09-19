import { Address4 } from './ipv4';
import { Address6 } from './ipv6';

// A wrapper function that returns false if the address is not valid; used to
// avoid boilerplate checks for `if (!this.valid) { return false; }`
export function falseIfInvalid<F extends (...args: any[]) => any>(fn: F) {
  return <F>function (this: Address4 | Address6, ...args: any[]) {
    if (!this.valid) {
      return false;
    }

    return fn.apply(this, args);
  };
}

export const isInSubnet = falseIfInvalid(function (
  this: Address4 | Address6,
  address: Address4 | Address6
) {
  if (this.subnetMask < address.subnetMask) {
    return false;
  }

  if (this.mask(address.subnetMask) === address.mask()) {
    return true;
  }

  return false;
});

export const isCorrect = function (defaultBits: number) {
  return falseIfInvalid(function (this: Address4 | Address6) {
    if (this.addressMinusSuffix !== this.correctForm()) {
      return false;
    }

    if (this.subnetMask === defaultBits && !this.parsedSubnet) {
      return true;
    }

    return this.parsedSubnet === String(this.subnetMask);
  });
};
