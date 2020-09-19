/* eslint-disable no-param-reassign */

const should = require('chai').should();
const { Address4, Address6 } = require('../dist/ip-address');

const invalid4 = require('./data/invalid-ipv4-addresses.json');
const invalid6 = require('./data/invalid-ipv6-addresses.json');

const valid4 = require('./data/valid-ipv4-addresses.json');
const valid6 = require('./data/valid-ipv6-addresses.json');

function addressIs(addressString, descriptors) {
  const address4 = new Address4(addressString);
  const address6 = new Address6(addressString);

  describe(addressString, () => {
    descriptors.forEach((descriptor) => {
      if (descriptor === 'valid-ipv4') {
        it('is valid', () => {
          address4.should.be.an('object');

          address4.parsedAddress.should.be.an.instanceOf(Array);
          address4.parsedAddress.length.should.equal(4);

          address4.subnetMask.should.be.a('number');

          address4.subnetMask.should.be.at.least(0);
          address4.subnetMask.should.be.at.most(128);

          should.not.exist(address4.error);
          should.not.exist(address4.parseError);

          address4.isValid().should.equal(true);
        });
      }

      if (descriptor === 'valid-ipv6') {
        it('is valid', () => {
          address6.should.be.an('object');

          address6.zone.should.be.a('string');

          address6.subnet.should.be.a('string');

          address6.subnetMask.should.be.a('number');

          address6.subnetMask.should.be.at.least(0);
          address6.subnetMask.should.be.at.most(128);

          address6.parsedAddress.should.be.an.instanceOf(Array);
          address6.parsedAddress.length.should.equal(8);

          should.not.exist(address6.error);
          should.not.exist(address6.parseError);

          address6.isValid().should.equal(true);
        });

        const re = address6.regularExpression();
        const reSubstring = address6.regularExpression(true);

        it('matches the correct form via regex', () => {
          re.test(address6.correctForm()).should.equal(true);
          reSubstring.test(`abc ${address6.correctForm()} def`).should.equal(true);
        });

        it('matches the canonical form via regex', () => {
          re.test(address6.canonicalForm()).should.equal(true);
          reSubstring.test(`abc ${address6.canonicalForm()} def`).should.equal(true);
        });

        it('matches the given form via regex', () => {
          // We can't match addresses like ::192.168.0.1 yet
          if (address6.is4()) {
            return;
          }

          re.test(addressString).should.equal(true);
          reSubstring.test(`abc ${addressString} def`).should.equal(true);
        });

        it('converts to a byte array and back', () => {
          const byteArray = address6.toByteArray();

          byteArray.length.should.be.at.most(16);

          const converted = Address6.fromByteArray(byteArray);

          address6.correctForm().should.equal(converted.correctForm());
        });

        it('converts to an unsigned byte array and back', () => {
          const byteArray = address6.toUnsignedByteArray();

          byteArray.length.should.be.at.most(16);

          const converted = Address6.fromUnsignedByteArray(byteArray);

          address6.correctForm().should.equal(converted.correctForm());
        });
      }

      if (descriptor === 'invalid-ipv4') {
        it('is invalid as parsed by v4', () => {
          address4.error.should.be.a('string');

          address4.isValid().should.equal(false);
        });
      }

      if (descriptor === 'invalid-ipv6') {
        it('is invalid as parsed by v6', () => {
          address6.error.should.be.a('string');

          address6.isValid().should.equal(false);
          should.not.exist(address6.correctForm());
        });
      }

      if (descriptor === 'canonical') {
        it('is canonical', () => {
          address6.isCanonical().should.equal(true);

          should.equal(address6.addressMinusSuffix.length, 39);
        });
      }

      if (descriptor === 'correct') {
        it('is correct', () => {
          address6.isCorrect().should.equal(true);
        });
      }

      if (descriptor === 'correct-ipv4') {
        it('is correct', () => {
          address4.isCorrect().should.equal(true);
        });
      }

      if (descriptor === 'incorrect') {
        it('is incorrect', () => {
          address6.isCorrect().should.equal(false);
        });
      }

      if (descriptor === 'incorrect-ipv4') {
        it('is incorrect', () => {
          address4.isCorrect().should.equal(false);
        });
      }

      if (descriptor === 'has-subnet') {
        it('parses the subnet', () => {
          address6.subnet.should.match(/^\/\d{1,3}/);
        });
      }

      if (descriptor === 'v4-in-v6') {
        it('is an ipv4-in-ipv6 address', () => {
          address6.is4().should.equal(true);
        });
      }
    });
  });
}

function loadJsonBatch(addresses, classes, noMerge) {
  addresses.forEach((address) => {
    if (address.conditions === undefined || !address.conditions.length || noMerge) {
      address.conditions = classes;
    } else {
      address.conditions = address.conditions.concat(classes);
    }

    addressIs(address.address, address.conditions);
  });
}

describe('Valid IPv4 addresses', () => {
  loadJsonBatch(valid4, ['valid-ipv4']);
  loadJsonBatch(valid4, ['invalid-ipv6'], true);
});

describe('Valid IPv6 addresses', () => {
  loadJsonBatch(valid6, ['valid-ipv6']);
  loadJsonBatch(valid6, ['invalid-ipv4'], true);
});

describe('Invalid IPv4 addresses', () => {
  loadJsonBatch(invalid4, ['invalid-ipv4']);
});

describe('Invalid IPv6 addresses', () => {
  loadJsonBatch(invalid6, ['invalid-ipv6']);
});
