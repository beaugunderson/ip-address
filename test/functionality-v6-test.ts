import * as chai from 'chai';
import { Address6 } from '../src/ipv6';
import { v6 } from '../src/ip-address';

const { expect } = chai;
const should = chai.should();

// A convenience function to convert a list of IPv6 address notations
// to Address6 instances
function notationsToAddresseses(notations: string[]): Address6[] {
  return notations.map((notation) => new Address6(notation));
}

describe('v6', () => {
  describe('An invalid address', () => {
    it('is invalid', () => {
      should.Throw(() => new Address6('a:abcde::'));
      should.equal(Address6.isValid('a:abcde::'), false);
    });
  });

  describe('a fully ellided /0 address', () => {
    const topic = new Address6('::/0');

    it('gets the correct reverse from', () => {
      topic.reverseForm({ omitSuffix: true }).should.equal('');
      topic.reverseForm().should.equal('ip6.arpa.');
    });
  });

  describe('A link local address', () => {
    const topic = new Address6('fe80::baf6:b1ff:fe15:4885');

    it('gets the correct type', () => {
      topic.getType().should.equal('Link-local unicast');

      topic.isTeredo().should.equal(false);
      topic.isLoopback().should.equal(false);
      topic.isMulticast().should.equal(false);
      topic.isLinkLocal().should.equal(true);
    });
  });

  describe('A correct address', () => {
    const topic = new Address6('a:b:c:d:e:f:0:1/64');

    it('contains no uppercase letters', () => {
      /[A-Z]/.test(topic.address).should.equal(false);
    });

    it('validates as correct', () => {
      topic.isCorrect().should.equal(true);

      should.equal(topic.correctForm(), 'a:b:c:d:e:f:0:1');
      should.equal(Address6.isValid('a:b:c:d:e:f:0:1'), true);
    });

    it('converts to and from a signed byte array', () => {
      const bytes = topic.toByteArray();
      const address = Address6.fromByteArray(bytes);

      address.correctForm().should.equal(topic.correctForm());
    });

    it('converts to and from an unsigned byte array', () => {
      const unsignedBytes = topic.toUnsignedByteArray();
      const address = Address6.fromUnsignedByteArray(unsignedBytes);

      address.correctForm().should.equal(topic.correctForm());
    });

    it('gets the correct type', () => {
      topic.getType().should.equal('Global unicast');

      topic.isTeredo().should.equal(false);
      topic.isLoopback().should.equal(false);
      topic.isMulticast().should.equal(false);
      topic.isLinkLocal().should.equal(false);
    });

    it('gets the correct reverse from', () => {
      topic.reverseForm({ omitSuffix: true }).should.equal('d.0.0.0.c.0.0.0.b.0.0.0.a.0.0.0');

      topic.reverseForm().should.equal('d.0.0.0.c.0.0.0.b.0.0.0.a.0.0.0.ip6.arpa.');
    });

    it('gets the correct scope', () => {
      topic.getScope().should.equal('Global');
    });

    it('gets the correct is6to4 information', () => {
      topic.is6to4().should.equal(false);
    });

    it('gets the correct microsoft transcription', () => {
      topic.microsoftTranscription().should.equal('a-b-c-d-e-f-0-1.ipv6-literal.net');
    });

    it('has correct bit information', () => {
      topic
        .getBitsPastSubnet()
        .should.equal('0000000000001110000000000000111100000000000000000000000000000001');

      topic.getBitsBase16(0, 64).should.equal('000a000b000c000d');

      topic.getBitsBase16(0, 128).should.equal('000a000b000c000d000e000f00000001');

      should.Throw(() => topic.getBitsBase16(0, 127));

      topic
        .binaryZeroPad()
        .should.equal(
          '0000000000001010000000000000101100000000000011000000000000001101' +
            '0000000000001110000000000000111100000000000000000000000000000001',
        );
    });
  });

  describe('An address with a subnet', () => {
    const topic = new Address6('ffff::/64');

    it('is contained by an identical address with an identical subnet', () => {
      const same = new Address6('ffff::/64');

      topic.isInSubnet(same).should.equal(true);
    });

    it('has a correct start address', () => {
      should.equal(topic.startAddress().correctForm(), 'ffff::');
    });

    it('has a correct start address hosts only', () => {
      should.equal(topic.startAddressExclusive().correctForm(), 'ffff::1');
    });

    it('has a correct end address', () => {
      should.equal(topic.endAddress().correctForm(), 'ffff::ffff:ffff:ffff:ffff');
    });

    it('has a correct end address hosts only', () => {
      should.equal(topic.endAddressExclusive().correctForm(), 'ffff::ffff:ffff:ffff:fffe');
    });

    it('calculates and formats the subnet size', () => {
      topic.possibleSubnets().should.equal('18,446,744,073,709,551,616');
      topic.possibleSubnets(128).should.equal('18,446,744,073,709,551,616');
      topic.possibleSubnets(96).should.equal('4,294,967,296');
      topic.possibleSubnets(65).should.equal('2');
      topic.possibleSubnets(64).should.equal('1');
      topic.possibleSubnets(63).should.equal('0');
      topic.possibleSubnets(0).should.equal('0');
    });
  });

  describe('Small subnets', () => {
    const topic = new Address6('ffff::/64');

    it('is contained by larger subnets', () => {
      for (let i = 63; i > 0; i--) {
        const larger = new Address6(`ffff::/${i}`);

        topic.isInSubnet(larger).should.equal(true);
      }
    });
  });

  describe('Large subnets', () => {
    const topic = new Address6('ffff::/8');

    it('is not contained by smaller subnets', () => {
      for (let i = 9; i <= 128; i++) {
        const smaller = new Address6(`ffff::/${i}`);

        topic.isInSubnet(smaller).should.equal(false);
      }
    });
  });

  describe('A canonical address', () => {
    const topic = new Address6('000a:0000:0000:0000:0000:0000:0000:000b');

    it('is 39 characters long', () => {
      should.equal(topic.address.length, 39);
    });

    it('validates as canonical', () => {
      topic.isCanonical().should.equal(true);

      should.equal(topic.canonicalForm(), '000a:0000:0000:0000:0000:0000:0000:000b');
    });
  });

  describe('A v4-in-v6 address', () => {
    const topic = new Address6('::192.168.0.1');

    it('is v4', () => {
      topic.is4().should.equal(true);
    });
  });

  describe('An address with a subnet', () => {
    const topic = new Address6('a:b::/48');

    it('parses the subnet', () => {
      should.equal(topic.subnet, '/48');
    });

    it('is in its own subnet', () => {
      topic.isInSubnet(new Address6('a:b::/48')).should.equal(true);
    });

    it('is not in another subnet', () => {
      topic.isInSubnet(new Address6('a:c::/48')).should.equal(false);
    });
  });

  describe('An address with a zone', () => {
    const topic = new Address6('a::b%abcdefg');

    it('parses the zone', () => {
      should.equal(topic.zone, '%abcdefg');
    });
  });

  describe('A teredo address', () => {
    const topic = new Address6('2001:0000:ce49:7601:e866:efff:62c3:fffe');

    it('validates as Teredo', () => {
      topic.isTeredo().should.equal(true);
    });

    it('contains valid Teredo information', () => {
      const teredo = topic.inspectTeredo();

      should.equal(teredo.prefix, '2001:0000');
      should.equal(teredo.server4, '206.73.118.1');
      should.equal(teredo.flags, '1110100001100110');
      should.equal(teredo.udpPort, '4096');
      should.equal(teredo.client4, '157.60.0.1');
      should.equal(teredo.coneNat, true);

      should.equal(teredo.microsoft.reserved, true);
      should.equal(teredo.microsoft.universalLocal, false);
      should.equal(teredo.microsoft.groupIndividual, false);
      should.equal(teredo.microsoft.nonce, '2662');
    });
  });

  describe('A 6to4 address', () => {
    const topic = new Address6('2002:ce49:7601:1:2de:adff:febe:eeef');

    it('validates as 6to4', () => {
      topic.is6to4().should.equal(true);
    });

    it('contains valid 6to4 information', () => {
      const sixToFourProperties = topic.inspect6to4();

      should.equal(sixToFourProperties.prefix, '2002');
      should.equal(sixToFourProperties.gateway, '206.73.118.1');
    });
  });

  describe('A different notation of the same address', () => {
    const addresses = notationsToAddresseses([
      '2001:db8:0:0:1:0:0:1/128',
      '2001:db8:0:0:1:0:0:1/128%eth0',
      '2001:db8:0:0:1:0:0:1%eth0',
      '2001:db8:0:0:1:0:0:1',
      '2001:0db8:0:0:1:0:0:1',
      '2001:db8::1:0:0:1',
      '2001:db8::0:1:0:0:1',
      '2001:0db8::1:0:0:1',
      '2001:db8:0:0:1::1',
      '2001:db8:0000:0:1::1',
      '2001:DB8:0:0:1::1',
    ]);

    it('is parsed to the same result', () => {
      addresses.forEach((topic) => {
        should.equal(topic.correctForm(), '2001:db8::1:0:0:1');
        should.equal(topic.canonicalForm(), '2001:0db8:0000:0000:0001:0000:0000:0001');
        should.equal(topic.to4in6(), '2001:db8::1:0:0.0.0.1');
        should.equal(topic.decimal(), '08193:03512:00000:00000:00001:00000:00000:00001');
        should.equal(
          topic.binaryZeroPad(),
          '0010000000000001000011011011100000000000000000000000000000000000' +
            '0000000000000001000000000000000000000000000000000000000000000001',
        );
      });
    });
  });

  describe('to4in6', () => {
    it('should produce a valid 4in6 address', () => {
      const topic1 = new Address6('1:2:3:4:5:6:7:8');
      const topic2 = new Address6('1:2:3:4::7:8');

      topic1.to4in6().should.equal('1:2:3:4:5:6:0.7.0.8');
      topic2.to4in6().should.equal('1:2:3:4::0.7.0.8');
    });
  });

  describe('Address from an IPv4 address', () => {
    const obj = Address6.fromAddress4('192.168.0.1/30');

    it('should parse correctly', () => {
      expect(obj.correctForm()).to.equal('::ffff:c0a8:1');
      expect(obj.to4in6()).to.equal('::ffff:192.168.0.1');
      expect(obj.subnetMask).to.equal(126);
    });

    it('should generate a 6to4 address', () => {
      expect(obj.to6to4()?.correctForm()).to.equal('2002:c0a8:1::');
    });

    it('should generate a v4 address', () => {
      expect(obj.to4().correctForm()).to.equal('192.168.0.1');
    });
  });

  describe('Address given in ap6.arpa form', () => {
    const obj = Address6.fromArpa(
      'e.f.f.f.3.c.2.6.f.f.f.e.6.6.8.e.1.0.6.7.9.4.e.c.0.0.0.0.1.0.0.2.ip6.arpa.',
    );

    it('should return an Address6 object', () => {
      expect(obj instanceof Address6).to.equal(true);
    });

    it('should generate a valid v6 address', () => {
      expect(obj.correctForm()).to.equal('2001:0:ce49:7601:e866:efff:62c3:fffe');
    });

    it('should fail with an invalid ip6.arpa length', () => {
      should.Throw(() =>
        Address6.fromArpa('e.f.f.f.3.c.2.6.f.f.f.e.6.6.8.0.6.7.9.4.e.c.0.0.0.0.1.0.0.2.ip6.arpa.'),
      );
    });
  });

  describe('Address inside a URL or inside a URL with a port', () => {
    it('should work with a host address', () => {
      const obj = Address6.fromURL('2001:db8::5');

      expect(obj.address?.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(null);
    });

    it('should fail with an invalid URL', () => {
      const obj = Address6.fromURL('http://zombo/foo');

      expect(obj.error).to.equal('failed to parse address from URL');
      expect(obj.address).to.equal(null);
      expect(obj.port).to.equal(null);
    });

    it('should work with a basic URL', () => {
      const obj = Address6.fromURL('http://2001:db8::5/foo');

      expect(obj.address?.address).equal('2001:db8::5');
      expect(obj.port).to.equal(null);
    });

    it('should work with a basic URL enclosed in brackets', () => {
      const obj = Address6.fromURL('http://[2001:db8::5]/foo');

      expect(obj.address?.address).equal('2001:db8::5');
      expect(obj.port).to.equal(null);
    });

    it('should work with a URL with a port', () => {
      const obj = Address6.fromURL('http://[2001:db8::5]:80/foo');

      expect(obj.address?.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(80);
    });

    it('should work with a URL with a long port number', () => {
      const obj = Address6.fromURL('http://[2001:db8::5]:65536/foo');

      expect(obj.address?.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(65536);
    });

    it('should work with a address with a port', () => {
      const obj = Address6.fromURL('[2001:db8::5]:80');

      expect(obj.address?.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(80);
    });

    it('should work with an address with a long port', () => {
      const obj = Address6.fromURL('[2001:db8::5]:65536');

      expect(obj.address?.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(65536);
    });

    it('should parse the address but fail with an invalid port', () => {
      const obj = Address6.fromURL('[2001:db8::5]:65537');

      expect(obj.address?.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(null);
    });

    it('should fail with an invalid address and not return a port', () => {
      const obj = Address6.fromURL('[2001:db8:z:5]:65536');

      expect(obj.error).to.equal('failed to parse address with port');
      expect(obj.port).to.equal(null);
    });
  });

  describe('An address from a BigInteger', () => {
    const topic = Address6.fromBigInteger(BigInt('51923840109643282840007714694758401'));

    it('should parse correctly', () => {
      should.equal(topic.correctForm(), 'a:b:c:d:e:f:0:1');
    });
  });

  describe('HTML helpers', () => {
    describe('href', () => {
      const topic = new Address6('2001:4860:4001:803::1011');

      it('should generate a URL correctly', () => {
        topic.href().should.equal('http://[2001:4860:4001:803::1011]/');
        topic.href(8080).should.equal('http://[2001:4860:4001:803::1011]:8080/');
      });
    });

    describe('link', () => {
      const topic = new Address6('2001:4860:4001:803::1011');

      it('should generate an anchor correctly', () => {
        topic
          .link()
          .should.equal(
            '<a href="/#address=2001:4860:4001:803::1011">2001:4860:4001:803::1011</a>',
          );

        topic
          .link({ className: 'highlight', prefix: '/?address=' })
          .should.equal(
            '<a href="/?address=2001:4860:4001:803::1011" ' +
              'class="highlight">2001:4860:4001:803::1011</a>',
          );
      });

      it('should generate a v4inv6 anchor correctly', () => {
        const topic4 = new Address6('::ffff:c0a8:1');

        topic4
          .link({ v4: true })
          .should.equal('<a href="/#address=::ffff:192.168.0.1">::ffff:192.168.0.1</a>');
      });
    });

    describe('group', () => {
      it('should group a fully ellided address', () => {
        const topic = new Address6('::');

        topic
          .group()
          .should.equal(
            ':<span class="hover-group group-0 group-1 group-2 ' +
              'group-3 group-4 group-5 group-6 group-7"></span>:',
          );
      });

      it('should group an address with no ellision', () => {
        const topic = new Address6('a:b:c:d:1:2:3:4');

        topic
          .group()
          .should.equal(
            '<span class="hover-group group-0">a</span>:' +
              '<span class="hover-group group-1">b</span>:' +
              '<span class="hover-group group-2">c</span>:' +
              '<span class="hover-group group-3">d</span>:' +
              '<span class="hover-group group-4">1</span>:' +
              '<span class="hover-group group-5">2</span>:' +
              '<span class="hover-group group-6">3</span>:' +
              '<span class="hover-group group-7">4</span>',
          );
      });

      it('should group an ellided address', () => {
        const topic = new Address6('2001:4860:4001:803::1011');

        topic
          .group()
          .should.equal(
            '<span class="hover-group group-0">2001</span>:' +
              '<span class="hover-group group-1">4860</span>:' +
              '<span class="hover-group group-2">4001</span>:' +
              '<span class="hover-group group-3">803</span>:' +
              '<span class="hover-group group-4 group-5 ' +
              'group-6"></span>:' +
              '<span class="hover-group group-7">1011</span>',
          );
      });

      it('should group an IPv4 address', () => {
        const topic = new Address6('::ffff:192.168.0.1');

        topic.is4().should.equal(true);

        topic
          .group()
          .should.equal(
            ':<span class="hover-group group-0 group-1 group-2 group-3 group-4"></span>' +
              ':<span class="hover-group group-5">ffff</span>:' +
              '<span class="hover-group group-v4 group-6">192.168</span>.<span class="hover-group group-v4 group-7">0.1</span>',
          );
      });
    });
  });

  describe('String helpers', () => {
    describe('spanLeadingZeroes', () => {
      it('should span leading zeroes', () => {
        const topic = v6.helpers.spanLeadingZeroes('0000:0000:4444:0001');

        topic.should.equal(
          '<span class="zero">0000</span>:' +
            '<span class="zero">0000</span>:4444:' +
            '<span class="zero">000</span>1',
        );
      });
    });

    describe('spanAll', () => {
      it('should span leading zeroes', () => {
        const topic = v6.helpers.spanAll('001100');

        topic.should.equal(
          '<span class="digit value-0 position-0">' +
            '<span class="zero">0</span></span>' +
            '<span class="digit value-0 position-1">' +
            '<span class="zero">0</span></span>' +
            '<span class="digit value-1 position-2">1</span>' +
            '<span class="digit value-1 position-3">1</span>' +
            '<span class="digit value-0 position-4">' +
            '<span class="zero">0</span></span>' +
            '<span class="digit value-0 position-5">' +
            '<span class="zero">0</span></span>',
        );
      });

      it('should span leading zeroes with offset', () => {
        const topic = v6.helpers.spanAll('001100', 1);

        topic.should.equal(
          '<span class="digit value-0 position-1">' +
            '<span class="zero">0</span></span>' +
            '<span class="digit value-0 position-2">' +
            '<span class="zero">0</span></span>' +
            '<span class="digit value-1 position-3">1</span>' +
            '<span class="digit value-1 position-4">1</span>' +
            '<span class="digit value-0 position-5">' +
            '<span class="zero">0</span></span>' +
            '<span class="digit value-0 position-6">' +
            '<span class="zero">0</span></span>',
        );
      });
    });
  });
});
