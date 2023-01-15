/* eslint-disable import/extensions */
/* eslint-disable no-param-reassign */

import chai from 'chai';

import { Address4, Address6 } from '../ip-address';

// @ts-ignore: type assertion is required by node17(ish)+, but not permitted by ts-node unless module: esnext
import invalid4 from './data/invalid-ipv4-addresses.json' assert {type: 'json'};
// @ts-ignore
import invalid6 from './data/invalid-ipv6-addresses.json' assert {type: 'json'};

// @ts-ignore
import valid4 from './data/valid-ipv4-addresses.json' assert {type: 'json'};
// @ts-ignore
import valid6 from './data/valid-ipv6-addresses.json' assert {type: 'json'};

const should = chai.should();

function addressIs(addressString: string, descriptors: string[]) {
  describe(addressString, () => {
    descriptors.forEach((descriptor) => {
      if (descriptor === 'valid-ipv4') {
        const address4 = new Address4(addressString);

        it('is valid', () => {
          address4.should.be.an('object');

          address4.parsedAddress.should.be.an.instanceOf(Array);
          address4.parsedAddress.length.should.equal(4);

          address4.subnetMask.should.be.a('number');

          address4.subnetMask.should.be.at.least(0);
          address4.subnetMask.should.be.at.most(128);
        });

        it('converts to arpa format and back', () => {
          const arpa = address4.reverseForm();
          arpa.length.should.be.at.most(29);

          const arpaWithoutSuffix = address4.reverseForm({ omitSuffix: true });
          arpaWithoutSuffix.length.should.be.at.most(15);

          const converted = Address4.fromArpa(arpa);
          address4.correctForm().should.equal(converted.correctForm());
        });
      }

      if (descriptor === 'valid-ipv6') {
        const address6 = new Address6(addressString);

        it('is valid', () => {
          address6.should.be.an('object');

          address6.zone.should.be.a('string');

          address6.subnet.should.be.a('string');

          address6.subnetMask.should.be.a('number');

          address6.subnetMask.should.be.at.least(0);
          address6.subnetMask.should.be.at.most(128);

          address6.parsedAddress.should.be.an.instanceOf(Array);
          address6.parsedAddress.length.should.equal(8);
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
          should.Throw(() => new Address4(addressString));
        });
      }

      if (descriptor === 'invalid-ipv6') {
        it('is invalid as parsed by v6', () => {
          should.Throw(() => new Address6(addressString));
        });
      }

      if (descriptor === 'canonical') {
        const address6 = new Address6(addressString);

        it('is canonical', () => {
          address6.isCanonical().should.equal(true);

          should.equal(address6.addressMinusSuffix.length, 39);
        });
      }

      if (descriptor === 'correct') {
        const address6 = new Address6(addressString);

        it('is correct', () => {
          address6.isCorrect().should.equal(true);
        });
      }

      if (descriptor === 'correct-ipv4') {
        const address4 = new Address4(addressString);

        it('is correct', () => {
          address4.isCorrect().should.equal(true);
        });
      }

      if (descriptor === 'incorrect') {
        const address6 = new Address6(addressString);

        it('is incorrect', () => {
          address6.isCorrect().should.equal(false);
        });
      }

      if (descriptor === 'incorrect-ipv4') {
        const address4 = new Address4(addressString);

        it('is incorrect', () => {
          address4.isCorrect().should.equal(false);
        });
      }

      if (descriptor === 'has-subnet') {
        const address6 = new Address6(addressString);

        it('parses the subnet', () => {
          address6.subnet.should.match(/^\/\d{1,3}/);
        });
      }

      if (descriptor === 'v4-in-v6') {
        const address6 = new Address6(addressString);

        it('is an ipv4-in-ipv6 address', () => {
          address6.is4().should.equal(true);
        });
      }
    });
  });
}

interface AddressEntry {
  address: string;
  conditions?: string[];
}

function loadJsonBatch(addresses: AddressEntry[], classes: string[], noMerge?: boolean) {
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
