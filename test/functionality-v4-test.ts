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

    it('is in its own subnet', () => {
      topic.isInSubnet(new Address4('127.0.0.1/16')).should.equal(true);
    });

    it('is not in another subnet', () => {
      topic.isInSubnet(new Address4('192.168.0.1/16')).should.equal(false);
    });
  });

  describe('Creating an address from a BigInteger', () => {
    const topic = Address4.fromBigInteger(BigInt('2130706433'));

    it('should parse correctly', () => {
      topic.correctForm().should.equal('127.0.0.1');
    });
  });

  describe('Converting an address to a BigInteger', () => {
    const topic = new Address4('127.0.0.1');

    it('should convert properly', () => {
      topic.bigInteger().toString(10).should.equal('2130706433');
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
});
