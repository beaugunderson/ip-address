import * as chai from 'chai';
import { Address4 } from '../src/ipv4';

const should = chai.should();

// A convenience function to convert a list of IPv4 address notations
// to Address4 instances
function notationsToAddresseses(notations: string[]): Address4[] {
  return notations.map((notation) => new Address4(notation));
}

describe('v4', () => {
  describe('An invalid address', () => {
    it('is invalid', () => {
      should.Throw(() => new Address4('127.0.0'));
      should.equal(Address4.isValid('127.0.0'), false);
    });
  });

  describe('A correct address', () => {
    const topic = new Address4('127.0.0.1');

    it('validates as correct', () => {
      topic.isCorrect().should.equal(true);

      should.equal(topic.correctForm(), '127.0.0.1');
      should.equal(Address4.isValid('127.0.0.1'), true);
    });

    it('should group', () => {
      topic
        .groupForV6()
        .should.equal(
          '<span class="hover-group group-v4 group-6">127.0</span>.' +
            '<span class="hover-group group-v4 group-7">0.1</span>',
        );
    });
  });

  describe('An address with a subnet', () => {
    const topic = new Address4('127.0.0.1/16');

    it('is contained by an identical address with an identical subnet', () => {
      const same = new Address4('127.0.0.1/16');

      topic.isInSubnet(same).should.equal(true);
    });
  });

  describe('A small subnet', () => {
    const topic = new Address4('127.0.0.1/16');

    it('is contained by larger subnets', () => {
      for (let i = 15; i > 0; i--) {
        const larger = new Address4(`127.0.0.1/${i}`);

        topic.isInSubnet(larger).should.equal(true);
      }
    });
  });

  describe('A large subnet', () => {
    const topic = new Address4('127.0.0.1/8');

    it('is not contained by smaller subnets', () => {
      for (let i = 9; i <= 32; i++) {
        const smaller = new Address4(`127.0.0.1/${i}`);

        topic.isInSubnet(smaller).should.equal(false);
      }
    });
  });

  describe('An integer v4 address', () => {
    const topic = Address4.fromInteger(432432423);

    it('parses correctly', () => {
      topic.address.should.equal('25.198.101.39');

      topic.subnet.should.equal('/32');
      topic.subnetMask.should.equal(32);
    });

    it('should match an address from its hex representation', () => {
      const hex = Address4.fromHex('19c66527');

      hex.address.should.equal('25.198.101.39');

      hex.subnet.should.equal('/32');
      hex.subnetMask.should.equal(32);
    });
  });

  describe('An address with a subnet', () => {
    const topic = new Address4('127.0.0.1/16');

    it('parses the subnet', () => {
      should.equal(topic.subnet, '/16');
    });

    it('has a correct start address', () => {
      should.equal(topic.startAddress().correctForm(), '127.0.0.0');
    });

    it('has a correct start address hosts only', () => {
      should.equal(topic.startAddressExclusive().correctForm(), '127.0.0.1');
    });

    it('has a correct end address', () => {
      should.equal(topic.endAddress().correctForm(), '127.0.255.255');
    });

    it('has a correct end address hosts only', () => {
      should.equal(topic.endAddressExclusive().correctForm(), '127.0.255.254');
    });

    it('has a correct subnet mask address', () => {
      should.equal(topic.subnetMaskAddress().correctForm(), '255.255.0.0');
    });

    it('is in its own subnet', () => {
      topic.isInSubnet(new Address4('127.0.0.1/16')).should.equal(true);
    });

    it('is not in another subnet', () => {
      topic.isInSubnet(new Address4('192.168.0.1/16')).should.equal(false);
    });
  });

  describe('subnetMaskAddress', () => {
    it('returns 0.0.0.0 for /0', () => {
      should.equal(new Address4('0.0.0.0/0').subnetMaskAddress().correctForm(), '0.0.0.0');
    });

    it('returns 255.0.0.0 for /8', () => {
      should.equal(new Address4('10.0.0.1/8').subnetMaskAddress().correctForm(), '255.0.0.0');
    });

    it('returns 255.255.240.0 for /20', () => {
      should.equal(
        new Address4('127.0.0.2/20').subnetMaskAddress().correctForm(),
        '255.255.240.0',
      );
    });

    it('returns 255.255.255.255 for /32 (default)', () => {
      should.equal(
        new Address4('192.168.1.1').subnetMaskAddress().correctForm(),
        '255.255.255.255',
      );
    });
  });

  describe('fromAddressAndMask', () => {
    it('translates 255.255.255.0 to /24', () => {
      const topic = Address4.fromAddressAndMask('192.168.1.1', '255.255.255.0');
      topic.subnetMask.should.equal(24);
      topic.subnet.should.equal('/24');
      should.equal(topic.addressMinusSuffix, '192.168.1.1');
    });

    it('translates 0.0.0.0 to /0', () => {
      Address4.fromAddressAndMask('192.168.1.1', '0.0.0.0').subnetMask.should.equal(0);
    });

    it('translates 255.255.255.255 to /32', () => {
      Address4.fromAddressAndMask('192.168.1.1', '255.255.255.255').subnetMask.should.equal(32);
    });

    it('round-trips through subnetMaskAddress()', () => {
      const original = new Address4('10.0.0.1/20');
      const mask = original.subnetMaskAddress().correctForm();
      Address4.fromAddressAndMask('10.0.0.1', mask).subnetMask.should.equal(20);
    });

    it('rejects a non-contiguous mask', () => {
      (() =>
        Address4.fromAddressAndMask('192.168.1.1', '255.0.255.0')).should.throw(
        'Invalid subnet mask.',
      );
    });

    it('rejects a mask with bytes out of range', () => {
      (() => Address4.fromAddressAndMask('192.168.1.1', '256.0.0.0')).should.throw();
    });

    it('does not change isValid() behavior for mask-form input', () => {
      Address4.isValid('192.168.1.1/255.255.255.0').should.equal(false);
    });
  });

  describe('wildcardMask', () => {
    it('returns 255.255.255.255 for /0', () => {
      should.equal(new Address4('0.0.0.0/0').wildcardMask().correctForm(), '255.255.255.255');
    });

    it('returns 0.255.255.255 for /8', () => {
      should.equal(new Address4('10.0.0.1/8').wildcardMask().correctForm(), '0.255.255.255');
    });

    it('returns 0.0.15.255 for /20', () => {
      should.equal(new Address4('127.0.0.2/20').wildcardMask().correctForm(), '0.0.15.255');
    });

    it('returns 0.0.0.3 for /30', () => {
      should.equal(new Address4('127.0.0.2/30').wildcardMask().correctForm(), '0.0.0.3');
    });

    it('returns 0.0.0.0 for /32 (default)', () => {
      should.equal(new Address4('192.168.1.1').wildcardMask().correctForm(), '0.0.0.0');
    });

    it('is the inverse of subnetMaskAddress', () => {
      for (let i = 0; i <= 32; i++) {
        const topic = new Address4(`10.0.0.1/${i}`);
        const mask = topic.subnetMaskAddress().bigInt();
        const wildcard = topic.wildcardMask().bigInt();
        // eslint-disable-next-line no-bitwise
        const allOnes = (BigInt(1) << BigInt(32)) - BigInt(1);
        // eslint-disable-next-line no-bitwise
        (mask ^ wildcard).should.equal(allOnes);
      }
    });
  });

  describe('networkForm', () => {
    it('returns 0.0.0.0/0 for /0', () => {
      should.equal(new Address4('10.0.0.1/0').networkForm(), '0.0.0.0/0');
    });

    it('returns 10.0.0.0/8 for 10.0.0.1/8', () => {
      should.equal(new Address4('10.0.0.1/8').networkForm(), '10.0.0.0/8');
    });

    it('returns 205.65.224.104/29 for the issue #39 example', () => {
      should.equal(new Address4('205.65.224.110/29').networkForm(), '205.65.224.104/29');
    });

    it('returns 192.168.1.0/24 for 192.168.1.5/24', () => {
      should.equal(new Address4('192.168.1.5/24').networkForm(), '192.168.1.0/24');
    });

    it('returns the address itself with /32 when no subnet is given', () => {
      should.equal(new Address4('192.168.1.5').networkForm(), '192.168.1.5/32');
    });

    it('round-trips through the Address4 constructor', () => {
      const original = new Address4('10.20.30.40/12');
      const round = new Address4(original.networkForm());
      round.correctForm().should.equal('10.16.0.0');
      round.subnetMask.should.equal(12);
    });
  });

  describe('fromAddressAndWildcardMask', () => {
    it('translates 0.0.0.255 to /24', () => {
      const topic = Address4.fromAddressAndWildcardMask('192.168.1.1', '0.0.0.255');
      topic.subnetMask.should.equal(24);
      topic.subnet.should.equal('/24');
      should.equal(topic.addressMinusSuffix, '192.168.1.1');
    });

    it('translates 0.0.0.3 to /30 (Cisco ACL example)', () => {
      Address4.fromAddressAndWildcardMask(
        '192.168.1.1',
        '0.0.0.3',
      ).subnetMask.should.equal(30);
    });

    it('translates 255.255.255.255 to /0', () => {
      Address4.fromAddressAndWildcardMask(
        '192.168.1.1',
        '255.255.255.255',
      ).subnetMask.should.equal(0);
    });

    it('translates 0.0.0.0 to /32', () => {
      Address4.fromAddressAndWildcardMask(
        '192.168.1.1',
        '0.0.0.0',
      ).subnetMask.should.equal(32);
    });

    it('round-trips through wildcardMask()', () => {
      const original = new Address4('10.0.0.1/20');
      const wildcard = original.wildcardMask().correctForm();
      Address4.fromAddressAndWildcardMask('10.0.0.1', wildcard).subnetMask.should.equal(20);
    });

    it('rejects a non-contiguous wildcard mask', () => {
      (() =>
        Address4.fromAddressAndWildcardMask('192.168.1.1', '0.255.0.255')).should.throw(
        'Invalid subnet mask.',
      );
    });
  });

  describe('fromWildcard', () => {
    it('parses 192.168.0.* as /24', () => {
      const topic = Address4.fromWildcard('192.168.0.*');
      topic.subnet.should.equal('/24');
      topic.startAddress().correctForm().should.equal('192.168.0.0');
      topic.endAddress().correctForm().should.equal('192.168.0.255');
    });

    it('parses 192.168.*.* as /16', () => {
      const topic = Address4.fromWildcard('192.168.*.*');
      topic.subnet.should.equal('/16');
      topic.startAddress().correctForm().should.equal('192.168.0.0');
      topic.endAddress().correctForm().should.equal('192.168.255.255');
    });

    it('parses 10.*.*.* as /8', () => {
      Address4.fromWildcard('10.*.*.*').subnet.should.equal('/8');
    });

    it('parses *.*.*.* as /0', () => {
      Address4.fromWildcard('*.*.*.*').subnet.should.equal('/0');
    });

    it('parses a no-wildcard address as /32', () => {
      const topic = Address4.fromWildcard('192.168.1.1');
      topic.subnet.should.equal('/32');
      topic.correctForm().should.equal('192.168.1.1');
    });

    it('rejects an interior wildcard', () => {
      (() => Address4.fromWildcard('*.168.0.1')).should.throw(
        'Wildcard `*` must only appear in trailing octets',
      );
      (() => Address4.fromWildcard('192.*.0.1')).should.throw(
        'Wildcard `*` must only appear in trailing octets',
      );
    });

    it('rejects a partial-octet wildcard', () => {
      (() => Address4.fromWildcard('192.168.0.1*')).should.throw('Invalid IPv4 address.');
    });

    it('rejects a pattern with the wrong number of octets', () => {
      (() => Address4.fromWildcard('192.168.*')).should.throw(
        'Wildcard pattern must have 4 octets',
      );
      (() => Address4.fromWildcard('192.168.0.0.*')).should.throw(
        'Wildcard pattern must have 4 octets',
      );
    });

    it('rejects an out-of-range octet in the prefix', () => {
      (() => Address4.fromWildcard('999.168.0.*')).should.throw('Invalid IPv4 address.');
    });
  });

  describe('Creating an address from a BigInt', () => {
    const topic = Address4.fromBigInt(BigInt('2130706433'));

    it('should parse correctly', () => {
      topic.correctForm().should.equal('127.0.0.1');
    });
  });

  describe('Converting an address to a BigInt', () => {
    const topic = new Address4('127.0.0.1');

    it('should convert properly', () => {
      topic.bigInt().toString(10).should.equal('2130706433');
    });
  });

  describe('Creating an address from hex', () => {
    const topic = Address4.fromHex('7f:00:00:01');

    it('should parse correctly', () => {
      topic.correctForm().should.equal('127.0.0.1');
    });
  });

  describe('Converting an address to hex', () => {
    const topic = new Address4('127.0.0.1');

    it('should convert correctly', () => {
      topic.toHex().should.equal('7f:00:00:01');
    });
  });

  describe('Converting an address to an array', () => {
    const topic = new Address4('127.0.0.1');

    it('should convert correctly', () => {
      const a = topic.toArray();

      a.should.be.an.instanceOf(Array).and.have.lengthOf(4);

      a[0].should.equal(127);
      a[1].should.equal(0);
      a[2].should.equal(0);
      a[3].should.equal(1);
    });
  });

  describe('Creating an address from a byte array', () => {
    it('should parse correctly from valid byte array', () => {
      const topic = Address4.fromByteArray([127, 0, 0, 1]);
      topic.correctForm().should.equal('127.0.0.1');
    });

    it('should parse correctly from different valid byte array', () => {
      const topic = Address4.fromByteArray([192, 168, 1, 1]);
      topic.correctForm().should.equal('192.168.1.1');
    });

    it('should handle maximum values correctly', () => {
      const topic = Address4.fromByteArray([255, 255, 255, 255]);
      topic.correctForm().should.equal('255.255.255.255');
    });

    it('should throw error for negative bytes', () => {
      should.Throw(() => Address4.fromByteArray([-1, -128, 0, 1]), 'All bytes must be integers between 0 and 255');
    });

    it('should throw error for bytes over 255', () => {
      should.Throw(() => Address4.fromByteArray([256, 0, 0, 1]), 'All bytes must be integers between 0 and 255');
    });

    it('should throw error for non-integer bytes', () => {
      should.Throw(() => Address4.fromByteArray([127.5, 0, 0, 1]), 'All bytes must be integers between 0 and 255');
    });

    it('should throw error for array with wrong length', () => {
      should.Throw(() => Address4.fromByteArray([127, 0, 0]), 'IPv4 addresses require exactly 4 bytes');
      should.Throw(() => Address4.fromByteArray([127, 0, 0, 1, 2]), 'IPv4 addresses require exactly 4 bytes');
      should.Throw(() => Address4.fromByteArray([]), 'IPv4 addresses require exactly 4 bytes');
    });
  });

  describe('Creating an address from an unsigned byte array', () => {
    it('should parse correctly', () => {
      const topic = Address4.fromUnsignedByteArray([127, 0, 0, 1]);
      topic.correctForm().should.equal('127.0.0.1');
    });

    it('should throw error for array with wrong length', () => {
      should.Throw(() => Address4.fromUnsignedByteArray([127, 0, 0]), 'IPv4 addresses require exactly 4 bytes');
      should.Throw(() => Address4.fromUnsignedByteArray([127, 0, 0, 1, 2]), 'IPv4 addresses require exactly 4 bytes');
    });
  });

  describe('A different notation of the same address', () => {
    const addresses = notationsToAddresseses([
      '127.0.0.1/32',
      '127.000.000.001/32',
      '127.0.0.1',
      '127.000.000.001',
      '127.000.0.1',
    ]);

    it('is parsed to the same result', () => {
      addresses.forEach((topic) => {
        should.equal(topic.correctForm(), '127.0.0.1');
        should.equal(topic.subnetMask, 32);
      });
    });
  });

  describe('A multicast address', () => {
    const multicastAddresses = notationsToAddresseses([
      '224.0.1.0',
      '224.0.1.255',
      '224.0.2.0',
      '224.0.255.255',
      '224.3.0.0',
      '224.4.255.255',
      '232.0.0.0',
      '232.255.255.255',
      '233.0.0.0',
      '233.251.255.255',
      '233.252.0.0',
      '233.255.255.255',
      '234.0.0.0',
      '234.255.255.255',
      '239.0.0.0',
      '239.255.255.255',
    ]);

    it('is detected as multicast', () => {
      multicastAddresses.forEach((topic) => {
        should.equal(topic.isMulticast(), true);
      });
    });
  });

  describe('A unicast address', () => {
    const unicastAddresses = notationsToAddresseses([
      '124.0.1.0',
      '124.0.1.255',
      '124.0.2.0',
      '124.0.255.255',
      '124.3.0.0',
      '124.4.255.255',
      '132.0.0.0',
      '132.255.255.255',
      '133.0.0.0',
      '133.251.255.255',
      '133.252.0.0',
      '133.255.255.255',
      '134.0.0.0',
      '134.255.255.255',
      '139.0.0.0',
      '139.255.255.255',
    ]);

    it('is not detected as multicast', () => {
      unicastAddresses.forEach((topic) => {
        should.equal(topic.isMulticast(), false);
      });
    });
  });

  describe('isPrivate', () => {
    it('detects RFC 1918 ranges', () => {
      notationsToAddresseses([
        '10.0.0.0',
        '10.255.255.255',
        '172.16.0.0',
        '172.16.0.1',
        '172.31.255.255',
        '192.168.0.0',
        '192.168.1.1',
        '192.168.255.255',
      ]).forEach((topic) => {
        should.equal(topic.isPrivate(), true);
      });
    });

    it('rejects non-private addresses including range boundaries', () => {
      notationsToAddresseses([
        '8.8.8.8',
        '9.255.255.255',
        '11.0.0.0',
        '172.15.255.255',
        '172.32.0.0',
        '192.167.255.255',
        '192.169.0.0',
      ]).forEach((topic) => {
        should.equal(topic.isPrivate(), false);
      });
    });
  });

  describe('isLoopback', () => {
    it('detects 127.0.0.0/8', () => {
      notationsToAddresseses(['127.0.0.0', '127.0.0.1', '127.255.255.255']).forEach((topic) => {
        should.equal(topic.isLoopback(), true);
      });
    });

    it('rejects non-loopback addresses', () => {
      notationsToAddresseses(['126.255.255.255', '128.0.0.0', '8.8.8.8']).forEach((topic) => {
        should.equal(topic.isLoopback(), false);
      });
    });
  });

  describe('isLinkLocal', () => {
    it('detects 169.254.0.0/16', () => {
      notationsToAddresseses(['169.254.0.0', '169.254.1.1', '169.254.255.255']).forEach((topic) => {
        should.equal(topic.isLinkLocal(), true);
      });
    });

    it('rejects addresses outside 169.254.0.0/16', () => {
      notationsToAddresseses(['169.253.255.255', '169.255.0.0', '8.8.8.8']).forEach((topic) => {
        should.equal(topic.isLinkLocal(), false);
      });
    });
  });

  describe('isUnspecified', () => {
    it('detects 0.0.0.0', () => {
      should.equal(new Address4('0.0.0.0').isUnspecified(), true);
    });

    it('rejects non-zero addresses', () => {
      notationsToAddresseses(['0.0.0.1', '1.0.0.0', '8.8.8.8']).forEach((topic) => {
        should.equal(topic.isUnspecified(), false);
      });
    });
  });

  describe('isBroadcast', () => {
    it('detects 255.255.255.255', () => {
      should.equal(new Address4('255.255.255.255').isBroadcast(), true);
    });

    it('rejects non-broadcast addresses including subnet broadcasts', () => {
      notationsToAddresseses(['255.255.255.254', '192.168.1.255', '8.8.8.8']).forEach((topic) => {
        should.equal(topic.isBroadcast(), false);
      });
    });
  });

  describe('isCGNAT', () => {
    it('detects 100.64.0.0/10', () => {
      notationsToAddresseses(['100.64.0.0', '100.64.0.1', '100.127.255.255']).forEach((topic) => {
        should.equal(topic.isCGNAT(), true);
      });
    });

    it('rejects addresses outside 100.64.0.0/10', () => {
      notationsToAddresseses(['100.63.255.255', '100.128.0.0', '8.8.8.8']).forEach((topic) => {
        should.equal(topic.isCGNAT(), false);
      });
    });
  });
});
