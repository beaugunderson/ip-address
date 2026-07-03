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

  describe('An address with an unknown scope', () => {
    const topic = new Address6('ff03::1');

    it('should return Unknown scope', () => {
      topic.getScope().should.equal('Unknown');
    });
  });

  describe('getScope', () => {
    it('returns the multicast scope nibble for multicast addresses', () => {
      new Address6('ff01::1').getScope().should.equal('Interface local');
      new Address6('ff02::1').getScope().should.equal('Link local');
      new Address6('ff04::1').getScope().should.equal('Admin local');
      new Address6('ff05::2').getScope().should.equal('Site local');
      new Address6('ff08::1').getScope().should.equal('Organization local');
      new Address6('ff0e::1').getScope().should.equal('Global');
    });

    it('returns Link local for fe80::/10 (issue #122)', () => {
      new Address6('fe80::2ff:33ff:feaa:bbcc').getScope().should.equal('Link local');
    });

    it('does not return Link local for 2002::/16 (issue #122)', () => {
      new Address6('2002::').getScope().should.equal('Global');
    });

    it('returns Link local for the loopback address (RFC 4291 §2.5.3)', () => {
      new Address6('::1').getScope().should.equal('Link local');
    });

    it('returns Global for ULA, documentation, 6to4, and ordinary unicast', () => {
      new Address6('fd12:3456:789a::1').getScope().should.equal('Global');
      new Address6('2001:db8::1').getScope().should.equal('Global');
      new Address6('2002:c0a8:1::').getScope().should.equal('Global');
      new Address6('2620:0:2d0:200::7').getScope().should.equal('Global');
    });

    it('returns Unknown for the unspecified address', () => {
      new Address6('::').getScope().should.equal('Unknown');
    });
  });

  describe('getType', () => {
    it('classifies ULA addresses as Unique local', () => {
      new Address6('fc00::').getType().should.equal('Unique local');
      new Address6('fd12:3456:789a::1').getType().should.equal('Unique local');
    });

    it('classifies 2002::/16 as 6to4', () => {
      new Address6('2002:c0a8:1::').getType().should.equal('6to4');
    });

    it('classifies 2001:db8::/32 as Documentation', () => {
      new Address6('2001:db8::1').getType().should.equal('Documentation');
    });

    it('classifies the well-known NAT64 prefix', () => {
      new Address6('64:ff9b::c000:221').getType().should.equal('NAT64 (well-known)');
    });

    it('classifies the local-use NAT64 prefix', () => {
      new Address6('64:ff9b:1::1').getType().should.equal('NAT64 (local-use)');
    });
  });

  describe('isMulticast', () => {
    it('returns true for any multicast address, including specific subtypes', () => {
      ['ff00::', 'ff01::1', 'ff02::1', 'ff05::2', 'ff0e::1'].forEach((notation) => {
        new Address6(notation).isMulticast().should.equal(true);
      });
    });

    it('returns false for non-multicast addresses', () => {
      ['::', '::1', '2001:db8::1', 'fe80::1', 'fd00::1'].forEach((notation) => {
        new Address6(notation).isMulticast().should.equal(false);
      });
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

    it('has a correct subnet mask address', () => {
      should.equal(topic.subnetMaskAddress().correctForm(), 'ffff:ffff:ffff:ffff::');
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

  describe('group() with a zone containing HTML characters', () => {
    const payload = 'fe80::1%<b>';
    const topic = new Address6(payload);

    it('stores the raw zone on the instance', () => {
      should.equal(topic.zone, '%<b>');
    });

    it('does not include the zone in the grouped HTML output', () => {
      const html = topic.group();
      html.should.not.include('<b>');
    });

    it('does not include the zone in the non-elided grouped HTML output', () => {
      const nonElided = new Address6('a:b:c:d:1:2:3:4%<b>');
      const html = nonElided.group();
      html.should.not.include('<b>');
    });
  });

  describe('link() with options containing HTML characters', () => {
    const topic = new Address6('2001:db8::1');

    it('escapes the className', () => {
      const html = topic.link({ className: 'a"b' });
      html.should.include('class="a&quot;b"');
    });

    it('escapes the prefix', () => {
      const html = topic.link({ prefix: 'a"b' });
      html.should.include('href="a&quot;b');
    });
  });

  describe('parse4in6 leading-zero error', () => {
    it('highlights the offending IPv4 octet in parseMessage', () => {
      try {
        // eslint-disable-next-line no-new
        new Address6('::ffff:10.0.01.1');
        throw new Error('expected Address6 constructor to throw');
      } catch (e) {
        (e as any).parseMessage.should.include('<span class="parse-error">0</span>');
        (e as any).parseMessage.should.include('::ffff:');
      }
    });

    it('escapes HTML characters in the prefix', () => {
      try {
        // eslint-disable-next-line no-new
        new Address6('<b>:10.0.01.1');
        throw new Error('expected Address6 constructor to throw');
      } catch (e) {
        const parseMessage = (e as any).parseMessage;
        parseMessage.should.not.include('<b>');
        parseMessage.should.include('&lt;b&gt;');
      }
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

  describe('Internal assertions', () => {
    it('should throw when group() is called with corrupted elidedGroups', () => {
      const topic = new Address6('2001:db8::1');
      (topic as any).elidedGroups = undefined;
      should.Throw(() => topic.group(), 'Assertion failed.');
    });

  });

  describe('to6to4 on a non-v4 address', () => {
    const topic = new Address6('2001:db8::1');

    it('should return null', () => {
      expect(topic.to6to4()).to.equal(null);
    });
  });

  describe('NAT64 (RFC 6052)', () => {
    // Test vectors from RFC 6052 §2.4 (IPv4 192.0.2.33 across all prefix lengths).
    const cases: Array<{ pl: number; prefix: string; encoded: string }> = [
      { pl: 32, prefix: '2001:db8::/32', encoded: '2001:db8:c000:221::' },
      { pl: 40, prefix: '2001:db8:100::/40', encoded: '2001:db8:1c0:2:21::' },
      { pl: 48, prefix: '2001:db8:122::/48', encoded: '2001:db8:122:c000:2:2100::' },
      { pl: 56, prefix: '2001:db8:122:300::/56', encoded: '2001:db8:122:3c0:0:221::' },
      { pl: 64, prefix: '2001:db8:122:344::/64', encoded: '2001:db8:122:344:c0:2:2100:0' },
      { pl: 96, prefix: '2001:db8:122:344::/96', encoded: '2001:db8:122:344::c000:221' },
    ];

    cases.forEach(({ pl, prefix, encoded }) => {
      it(`encodes 192.0.2.33 with a /${pl} prefix`, () => {
        Address6.fromAddress4Nat64('192.0.2.33', prefix).correctForm().should.equal(encoded);
      });

      it(`decodes ${encoded} with a /${pl} prefix`, () => {
        const v4 = new Address6(encoded).toAddress4Nat64(prefix);
        should.exist(v4);
        v4!.correctForm().should.equal('192.0.2.33');
      });
    });

    it('uses the well-known prefix 64:ff9b::/96 by default', () => {
      Address6.fromAddress4Nat64('192.0.2.33').correctForm().should.equal('64:ff9b::c000:221');
      new Address6('64:ff9b::c000:221').toAddress4Nat64()!.correctForm().should.equal('192.0.2.33');
    });

    it('encodes the example from issue #72', () => {
      Address6.fromAddress4Nat64('127.0.0.1').correctForm().should.equal('64:ff9b::7f00:1');
    });

    it('returns null when decoding an address outside the prefix', () => {
      expect(new Address6('2001:db8::1').toAddress4Nat64()).to.equal(null);
    });

    it('throws on an invalid prefix length', () => {
      should.Throw(() => Address6.fromAddress4Nat64('192.0.2.33', '2001:db8::/80'));
      should.Throw(() => new Address6('64:ff9b::1').toAddress4Nat64('2001:db8::/80'));
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

    it('preserves the subnet on the embedded address4', () => {
      expect(obj.address4?.subnetMask).to.equal(30);
      expect(obj.address4?.subnet).to.equal('/30');
    });

    it('round-trips the subnet through to4()', () => {
      const v4 = obj.to4();

      expect(v4.subnetMask).to.equal(30);
      expect(v4.subnet).to.equal('/30');
    });
  });

  describe('to4() subnet derivation', () => {
    it('derives /24 from a /120 v4-mapped address', () => {
      const v6 = Address6.fromAddress4('192.168.0.1/24');

      expect(v6.subnetMask).to.equal(120);
      expect(v6.to4().subnetMask).to.equal(24);
      expect(v6.to4().subnet).to.equal('/24');
    });

    it('keeps /32 for an unprefixed v4-mapped address', () => {
      expect(new Address6('::ffff:192.168.0.1').to4().subnetMask).to.equal(32);
    });

    it('keeps /32 when the v6 mask does not cover the v4 portion', () => {
      // /64 prefix covers none of the trailing 32 bits — degrade to host.
      expect(new Address6('::ffff:192.168.0.1/64').to4().subnetMask).to.equal(32);
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

    it('should work with the highest valid port number', () => {
      const obj = Address6.fromURL('http://[2001:db8::5]:65535/foo');

      expect(obj.address?.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(65535);
    });

    it('should parse the address but fail with a port number one past the valid range', () => {
      const obj = Address6.fromURL('http://[2001:db8::5]:65536/foo');

      expect(obj.address?.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(null);
    });

    it('should work with a address with a port', () => {
      const obj = Address6.fromURL('[2001:db8::5]:80');

      expect(obj.address?.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(80);
    });

    it('should parse the address but fail with an out of range port', () => {
      const obj = Address6.fromURL('[2001:db8::5]:65536');

      expect(obj.address?.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(null);
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

    it('should reject trailing junk in a bracketed URL (#158)', () => {
      const obj = Address6.fromURL('http://[1234:5678::abcdxyz]');

      expect(obj.error).to.equal('failed to parse address from URL');
      expect(obj.address).to.equal(null);
      expect(obj.port).to.equal(null);
    });

    it('should reject trailing junk in an unbracketed URL (#158)', () => {
      const obj = Address6.fromURL('http://1234:5678::abcdxyz');

      expect(obj.error).to.equal('failed to parse address from URL');
      expect(obj.address).to.equal(null);
      expect(obj.port).to.equal(null);
    });

    it('should reject trailing junk in a bracketed URL with a port', () => {
      const obj = Address6.fromURL('http://[1234:5678::abcdxyz]:80');

      expect(obj.error).to.equal('failed to parse address with port');
      expect(obj.address).to.equal(null);
      expect(obj.port).to.equal(null);
    });

    it('should accept v4-in-v6 addresses in URLs', () => {
      const obj = Address6.fromURL('http://[::ffff:192.168.1.1]/foo');

      expect(obj.address?.address).to.equal('::ffff:192.168.1.1');
      expect(obj.port).to.equal(null);
    });

    it('should accept v4-in-v6 addresses in URLs with a port', () => {
      const obj = Address6.fromURL('http://[::ffff:192.168.1.1]:8080/foo');

      expect(obj.address?.address).to.equal('::ffff:192.168.1.1');
      expect(obj.port).to.equal(8080);
    });
  });

  describe('regularExpressionString', () => {
    it('should work without arguments (using defaults)', () => {
      const topic = new Address6('2001:db8::1');
      const re = topic.regularExpressionString();

      re.should.be.a('string');
      re.length.should.be.greaterThan(0);
    });

    it('should work with substringSearch=true', () => {
      const topic = new Address6('2001:db8::1');
      const re = topic.regularExpressionString(true);

      re.should.be.a('string');
      // substring search should not include boundary assertions
      re.should.not.include('(?=^|');
    });
  });

  describe('An address from a BigInt', () => {
    const topic = Address6.fromBigInt(BigInt('51923840109643282840007714694758401'));

    it('should parse correctly', () => {
      should.equal(topic.correctForm(), 'a:b:c:d:e:f:0:1');
    });

    it('should accept the boundary values 0 and 2**128 - 1', () => {
      should.equal(Address6.fromBigInt(0n).correctForm(), '::');
      should.equal(
        Address6.fromBigInt((1n << 128n) - 1n).correctForm(),
        'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      );
    });

    it('should reject negative values', () => {
      (() => Address6.fromBigInt(-1n)).should.throw(
        'IPv6 BigInt must be in the range 0 to 2**128 - 1',
      );
    });

    it('should reject values greater than 2**128 - 1', () => {
      (() => Address6.fromBigInt(1n << 128n)).should.throw(
        'IPv6 BigInt must be in the range 0 to 2**128 - 1',
      );
    });
  });

  describe('subnetMaskAddress', () => {
    it('returns :: for /0', () => {
      should.equal(new Address6('::/0').subnetMaskAddress().correctForm(), '::');
    });

    it('returns ffff:ffff:: for /32', () => {
      should.equal(
        new Address6('2001:db8::/32').subnetMaskAddress().correctForm(),
        'ffff:ffff::',
      );
    });

    it('returns ffff:ffff:ffff:ffff:: for /64', () => {
      should.equal(
        new Address6('2001:db8::/64').subnetMaskAddress().correctForm(),
        'ffff:ffff:ffff:ffff::',
      );
    });

    it('returns ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff for /128 (default)', () => {
      should.equal(
        new Address6('2001:db8::1').subnetMaskAddress().correctForm(),
        'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      );
    });
  });

  describe('fromAddressAndMask', () => {
    it('translates ffff:ffff:ffff:ffff:: to /64', () => {
      const topic = Address6.fromAddressAndMask('2001:db8::1', 'ffff:ffff:ffff:ffff::');
      topic.subnetMask.should.equal(64);
      topic.subnet.should.equal('/64');
      should.equal(topic.addressMinusSuffix, '2001:db8::1');
    });

    it('translates :: to /0', () => {
      Address6.fromAddressAndMask('2001:db8::1', '::').subnetMask.should.equal(0);
    });

    it('translates an all-ones mask to /128', () => {
      Address6.fromAddressAndMask(
        '2001:db8::1',
        'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      ).subnetMask.should.equal(128);
    });

    it('round-trips through subnetMaskAddress()', () => {
      const original = new Address6('2001:db8::/48');
      const mask = original.subnetMaskAddress().correctForm();
      Address6.fromAddressAndMask('2001:db8::', mask).subnetMask.should.equal(48);
    });

    it('rejects a non-contiguous mask', () => {
      (() =>
        Address6.fromAddressAndMask('2001:db8::1', 'ffff::ffff')).should.throw(
        'Invalid subnet mask.',
      );
    });

    it('rejects an invalid mask address', () => {
      (() => Address6.fromAddressAndMask('2001:db8::1', 'not:an:address')).should.throw();
    });

    it('does not change isValid() behavior for mask-form input', () => {
      Address6.isValid('2001:db8::1/ffff:ffff:ffff:ffff::').should.equal(false);
    });
  });

  describe('wildcardMask', () => {
    it('returns ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff for /0', () => {
      should.equal(
        new Address6('::/0').wildcardMask().correctForm(),
        'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      );
    });

    it('returns ::ffff:ffff:ffff:ffff:ffff:ffff for /32', () => {
      should.equal(
        new Address6('2001:db8::/32').wildcardMask().correctForm(),
        '::ffff:ffff:ffff:ffff:ffff:ffff',
      );
    });

    it('returns ::ffff:ffff:ffff:ffff for /64', () => {
      should.equal(
        new Address6('2001:db8::/64').wildcardMask().correctForm(),
        '::ffff:ffff:ffff:ffff',
      );
    });

    it('returns :: for /128 (default)', () => {
      should.equal(new Address6('2001:db8::1').wildcardMask().correctForm(), '::');
    });

    it('is the inverse of subnetMaskAddress', () => {
      for (const i of [0, 16, 32, 48, 64, 80, 96, 112, 128]) {
        const topic = new Address6(`2001:db8::1/${i}`);
        const mask = topic.subnetMaskAddress().bigInt();
        const wildcard = topic.wildcardMask().bigInt();
        // eslint-disable-next-line no-bitwise
        const allOnes = (BigInt(1) << BigInt(128)) - BigInt(1);
        // eslint-disable-next-line no-bitwise
        (mask ^ wildcard).should.equal(allOnes);
      }
    });
  });

  describe('fromAddressAndWildcardMask', () => {
    it('translates ::ffff:ffff:ffff:ffff to /64', () => {
      const topic = Address6.fromAddressAndWildcardMask('2001:db8::1', '::ffff:ffff:ffff:ffff');
      topic.subnetMask.should.equal(64);
      topic.subnet.should.equal('/64');
    });

    it('translates :: to /128', () => {
      Address6.fromAddressAndWildcardMask('2001:db8::1', '::').subnetMask.should.equal(128);
    });

    it('translates an all-ones wildcard to /0', () => {
      Address6.fromAddressAndWildcardMask(
        '2001:db8::1',
        'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      ).subnetMask.should.equal(0);
    });

    it('round-trips through wildcardMask()', () => {
      const original = new Address6('2001:db8::/48');
      const wildcard = original.wildcardMask().correctForm();
      Address6.fromAddressAndWildcardMask('2001:db8::', wildcard).subnetMask.should.equal(48);
    });

    it('rejects a non-contiguous wildcard mask', () => {
      (() =>
        Address6.fromAddressAndWildcardMask('2001:db8::1', 'ffff::ffff')).should.throw(
        'Invalid subnet mask.',
      );
    });
  });

  describe('networkForm', () => {
    it('returns ::/0 for /0', () => {
      should.equal(new Address6('2001:db8::1/0').networkForm(), '::/0');
    });

    it('returns 2001:db8::/32 for 2001:db8::1/32', () => {
      should.equal(new Address6('2001:db8::1/32').networkForm(), '2001:db8::/32');
    });

    it('returns 2001:db8::/64 for 2001:db8::abcd/64', () => {
      should.equal(new Address6('2001:db8::abcd/64').networkForm(), '2001:db8::/64');
    });

    it('returns the address itself with /128 when no subnet is given', () => {
      should.equal(new Address6('2001:db8::1').networkForm(), '2001:db8::1/128');
    });

    it('round-trips through the Address6 constructor', () => {
      const original = new Address6('2001:db8:abcd:ef01::1/48');
      const round = new Address6(original.networkForm());
      round.correctForm().should.equal('2001:db8:abcd::');
      round.subnetMask.should.equal(48);
    });
  });

  describe('fromWildcard', () => {
    it('parses 2001:db8:*:*:*:*:*:* as /32', () => {
      const topic = Address6.fromWildcard('2001:db8:*:*:*:*:*:*');
      topic.subnet.should.equal('/32');
      topic.startAddress().correctForm().should.equal('2001:db8::');
    });

    it('parses 2001:db8:1:2:3:4:5:* as /112', () => {
      Address6.fromWildcard('2001:db8:1:2:3:4:5:*').subnet.should.equal('/112');
    });

    it('parses 2001:db8::* as /112 (with `::` expansion)', () => {
      const topic = Address6.fromWildcard('2001:db8::*');
      topic.subnet.should.equal('/112');
      topic.startAddress().correctForm().should.equal('2001:db8::');
    });

    it('parses *:*:*:*:*:*:*:* as /0', () => {
      Address6.fromWildcard('*:*:*:*:*:*:*:*').subnet.should.equal('/0');
    });

    it('parses a no-wildcard address as /128', () => {
      const topic = Address6.fromWildcard('2001:db8::1');
      topic.subnet.should.equal('/128');
      topic.correctForm().should.equal('2001:db8::1');
    });

    it('rejects an interior wildcard', () => {
      (() => Address6.fromWildcard('*:db8:1:2:3:4:5:6')).should.throw(
        'Wildcard `*` must only appear in trailing groups',
      );
      (() => Address6.fromWildcard('2001:*:1:2:3:4:5:6')).should.throw(
        'Wildcard `*` must only appear in trailing groups',
      );
    });

    it('rejects a partial-group wildcard', () => {
      (() => Address6.fromWildcard('2001:db8:1:2:3:4:5:0*')).should.throw();
    });

    it('rejects a pattern with the wrong number of groups', () => {
      (() => Address6.fromWildcard('2001:db8:*:*:*:*:*')).should.throw(
        'Wildcard pattern must have 8 groups',
      );
    });

    it('rejects multiple `::`', () => {
      (() => Address6.fromWildcard('2001::db8::*')).should.throw(
        "Wildcard pattern cannot contain more than one '::'",
      );
    });

    it('rejects a CIDR suffix', () => {
      (() => Address6.fromWildcard('2001:db8:*:*:*:*:*:*/32')).should.throw(
        'Wildcard pattern must not include a zone or CIDR suffix',
      );
    });

    it('rejects a zone identifier', () => {
      (() => Address6.fromWildcard('fe80::*%eth0')).should.throw(
        'Wildcard pattern must not include a zone or CIDR suffix',
      );
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

  describe('isULA', () => {
    it('detects fc00::/7', () => {
      notationsToAddresseses([
        'fc00::',
        'fc00::1',
        'fcff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
        'fd00::',
        'fd12:3456:789a::1',
        'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      ]).forEach((topic) => {
        should.equal(topic.isULA(), true);
      });
    });

    it('rejects addresses outside fc00::/7 including fe80::/10 and global unicast', () => {
      notationsToAddresseses([
        '::',
        '::1',
        'fbff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
        'fe00::',
        'fe80::1',
        '2001:db8::1',
      ]).forEach((topic) => {
        should.equal(topic.isULA(), false);
      });
    });
  });

  describe('isUnspecified', () => {
    it('detects ::', () => {
      should.equal(new Address6('::').isUnspecified(), true);
    });

    it('rejects non-zero addresses', () => {
      notationsToAddresseses(['::1', '2001:db8::1', 'fc00::']).forEach((topic) => {
        should.equal(topic.isUnspecified(), false);
      });
    });
  });

  describe('isMapped4', () => {
    it('detects ::ffff:0:0/96 regardless of notation', () => {
      notationsToAddresseses([
        '::ffff:0:0',
        '::ffff:127.0.0.1',
        '::ffff:7f00:1',
        '::ffff:7f00:0001',
        '::ffff:c0a8:1',
        '::ffff:192.168.0.1',
        '::ffff:ffff:ffff',
      ]).forEach((topic) => {
        should.equal(topic.isMapped4(), true);
      });
    });

    it('rejects addresses outside ::ffff:0:0/96', () => {
      notationsToAddresseses([
        '::',
        '::1',
        '::1.2.3.4',
        '::1:ffff:0:0',
        '64:ff9b::192.0.2.1',
        '2001:db8::1',
        'fc00::',
      ]).forEach((topic) => {
        should.equal(topic.isMapped4(), false);
      });
    });

    it('agrees with is4 for IPv4-mapped addresses written in dotted-quad', () => {
      const dotted = new Address6('::ffff:127.0.0.1');
      const hex = new Address6('::ffff:7f00:1');

      should.equal(dotted.isMapped4(), true);
      should.equal(hex.isMapped4(), true);
      should.equal(dotted.is4(), true);
      should.equal(hex.is4(), false);
    });
  });

  describe('isDocumentation', () => {
    it('detects 2001:db8::/32', () => {
      notationsToAddresseses([
        '2001:db8::',
        '2001:db8::1',
        '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff',
      ]).forEach((topic) => {
        should.equal(topic.isDocumentation(), true);
      });
    });

    it('rejects addresses outside 2001:db8::/32', () => {
      notationsToAddresseses([
        '2001:db7:ffff:ffff:ffff:ffff:ffff:ffff',
        '2001:db9::',
        '2001::1',
        'fc00::',
      ]).forEach((topic) => {
        should.equal(topic.isDocumentation(), false);
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

    describe('simpleGroup', () => {
      it('should pass through groups containing group-v4', () => {
        const topic = v6.helpers.simpleGroup(
          'ffff:<span class="hover-group group-v4 group-6">192.168</span>.<span class="hover-group group-v4 group-7">0.1</span>',
        );

        topic[0].should.equal(
          '<span class="hover-group group-0">ffff</span>',
        );

        // The group-v4 segment should pass through unchanged
        topic[1].should.equal(
          '<span class="hover-group group-v4 group-6">192.168</span>.<span class="hover-group group-v4 group-7">0.1</span>',
        );
      });

      it('should HTML-escape non-pass-through segments', () => {
        const topic = v6.helpers.simpleGroup('<b>bold</b>');

        topic[0].should.equal(
          '<span class="hover-group group-0">&lt;b&gt;bold&lt;/b&gt;</span>',
        );
      });
    });

    describe('spanAll', () => {
      it('should HTML-escape characters in the class attribute', () => {
        const topic = v6.helpers.spanAll('"');

        topic.should.equal(
          '<span class="digit value-&quot; position-0">&quot;</span>',
        );
      });

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
