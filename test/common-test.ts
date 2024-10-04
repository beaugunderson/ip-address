import * as chai from 'chai';
import { testBit } from '../src/common';

const should = chai.should();

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
