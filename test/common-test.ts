import * as chai from 'chai';
import { testBit } from '../src/common';

// eslint-disable-next-line import/extensions
import pkg from '../package.json';

const should = chai.should();

describe('the byte array API', () => {
  it('keeps its signed and unsigned split only until 11.0.0', () => {
    // Address6.fromByteArray accepts signed bytes and folds them to unsigned,
    // Address4.fromByteArray rejects them, and toUnsignedByteArray returns what
    // toByteArray already returns. A major version is where those differences
    // can be settled, so this fails there rather than relying on anyone
    // remembering to look.
    const major = Number(pkg.version.split('.')[0]);

    major.should.be.below(
      11,
      'ip-address is at 11.x, so collapse the byte array API: make Address6.fromByteArray ' +
        'reject anything outside 0-255 as Address4.fromByteArray does, delete unsignByte and ' +
        'the -128 floor from src/ipv6.ts, and reduce fromUnsignedByteArray and ' +
        'toUnsignedByteArray to deprecated aliases. Then delete this test.',
    );
  });
});

describe('testBit', () => {
  it('should return value per specific bit', () => {
    should.equal(testBit('0', 1), false);
    should.equal(testBit('1', 1), true);

    should.equal(testBit('1010', 1), false);
    should.equal(testBit('1010', 2), true);
    should.equal(testBit('1010', 3), false);
    should.equal(testBit('1010', 4), true);
    // Length bigger than the size of string
    should.equal(testBit('1010', 5), false);
  });
});
