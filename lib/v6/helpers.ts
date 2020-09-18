import { sprintf } from 'sprintf-js';

/**
 * @returns {String} the string with all zeroes contained in a <span>
 */
export const spanAllZeroes = function (s: string): string {
  return s.replace(/(0+)/g, '<span class="zero">$1</span>');
};

/**
 * @returns {String} the string with each character contained in a <span>
 */
export const spanAll = function (s: string, offset: number = 0): string {
  var letters = s.split('');

  return letters.map(function (n, i) {
    return sprintf('<span class="digit value-%s position-%d">%s</span>', n,
      i + offset,
      spanAllZeroes(n)); // XXX Use #base-2 .value-0 instead?
  }).join('');
};

function spanLeadingZeroesSimple(group: string): string {
  return group.replace(/^(0+)/, '<span class="zero">$1</span>');
}

/**
 * @returns {String} the string with leading zeroes contained in a <span>
 */
export const spanLeadingZeroes = function (address: string): string {
  var groups = address.split(':');

  return groups.map(function (g) {
    return spanLeadingZeroesSimple(g);
  }).join(':');
};

/**
 * Groups an address
 * @returns {String} a grouped address
 */
export const simpleGroup = function (addressString: string, offset: number = 0): string {
  var groups = addressString.split(':');

  return groups.map(function (g, i) {
    if (/group-v4/.test(g)) {
      return g;
    }

    return sprintf('<span class="hover-group group-%d">%s</span>',
      i + offset,
      spanLeadingZeroesSimple(g));
  }).join(':');
};
