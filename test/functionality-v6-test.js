'use strict';

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var BigInteger = require('jsbn');
var sprintf = require('sprintf').sprintf;

var v6 = require('..').v6;

// A convenience function to convert a list of IPv6 address notations
// to v6.Address instances
function notationsToAddresseses(notations) {
  var addresses = [];

  notations.forEach(function (notation) {
    addresses.push(new v6.Address(notation));
  });

  return addresses;
}

describe('v6', function () {
  describe('An invalid address', function () {
    var topic = new v6.Address('a:abcde::');

    it('is invalid', function () {
      topic.error.should.equal('Address failed regex: abcde');

      topic.valid.should.equal(false);

      topic.isCorrect().should.equal(false);

      should.equal(topic.canonicalForm(), null);
      should.equal(topic.decimal(), null);
      should.equal(topic.bigInteger(), null);
      should.equal(topic.get6to4(), null);

      topic.isTeredo().should.equal(false);
    });
  });

  describe('A correct address', function () {
    var topic = new v6.Address('a:b:c:d:e:f:0:1/64');

    it('contains no uppercase letters', function () {
      /[A-Z]/.test(topic.address).should.equal(false);
    });

    it('validates as correct', function () {
      topic.isCorrect().should.equal(true);

      should.equal(topic.correctForm(), 'a:b:c:d:e:f:0:1');
    });

    it('gets the correct type', function () {
      topic.getType().should.equal('Global unicast');

      topic.isTeredo().should.equal(false);
      topic.isLoopback().should.equal(false);
      topic.isMulticast().should.equal(false);
      topic.isLinkLocal().should.equal(false);
    });

    it('gets the correct scope', function () {
      topic.getScope().should.equal('Global');
    });

    it('gets the correct is6to4 information', function () {
      topic.is6to4().should.equal(false);
    });

    it('has correct bit information', function () {
      topic.getBitsPastSubnet().should.equal(
        '0000000000001110000000000000111100000000000000000000000000000001');

      topic.getBitsBase16(0, 64).should.equal('000a000b000c000d');

      topic.getBitsBase16(0, 128).should.equal(
        '000a000b000c000d000e000f00000001');

      should.equal(topic.getBitsBase16(0, 127), null);

      topic.getBitsBase2().should.equal(
        '0000000000001010000000000000101100000000000011000000000000001101' +
        '0000000000001110000000000000111100000000000000000000000000000001');
    });
  });

  describe('An address with a subnet', function () {
    var topic = new v6.Address('ffff::/64');

    it('is contained by an identical address with an identical subnet',
      function () {
      var same = new v6.Address('ffff::/64');

      topic.isInSubnet(same).should.equal(true);
    });

    it('calculates and formats the subnet size', function () {
      topic.possibleSubnets().should.equal('18,446,744,073,709,551,616');
      topic.possibleSubnets(128).should.equal('18,446,744,073,709,551,616');
      topic.possibleSubnets(96).should.equal('4,294,967,296');
      topic.possibleSubnets(65).should.equal('2');
      topic.possibleSubnets(64).should.equal('1');
      topic.possibleSubnets(63).should.equal('0');
      topic.possibleSubnets(0).should.equal('0');
    });
  });

  describe('Small subnets', function () {
    var topic = new v6.Address('ffff::/64');

    it('is contained by larger subnets', function () {
      for (var i = 63; i > 0; i--) {
        var larger = new v6.Address(sprintf('ffff::/%d', i));

        topic.isInSubnet(larger).should.equal(true);
      }
    });
  });

  describe('Large subnets', function () {
    var topic = new v6.Address('ffff::/8');

    it('is not contained by smaller subnets', function () {
      for (var i = 9; i <= 128; i++) {
        var smaller = new v6.Address(sprintf('ffff::/%d', i));

        topic.isInSubnet(smaller).should.equal(false);
      }
    });
  });

  describe('A canonical address', function () {
    var topic = new v6.Address('000a:0000:0000:0000:0000:0000:0000:000b');

    it('is 39 characters long', function () {
      should.equal(topic.address.length, 39);
    });

    it('validates as canonical', function () {
      topic.isCanonical().should.equal(true);

      should.equal(topic.canonicalForm(),
        '000a:0000:0000:0000:0000:0000:0000:000b');
    });
  });

  describe('A v4-in-v6 address', function () {
    var topic = new v6.Address('::192.168.0.1');

    it('validates', function () {
      topic.isValid().should.equal(true);
    });

    it('is v4', function () {
      topic.is4().should.equal(true);
    });
  });

  describe('An address with a subnet', function () {
    var topic = new v6.Address('a:b::/48');

    it('validates', function () {
      topic.isValid().should.equal(true);
    });

    it('parses the subnet', function () {
      should.equal(topic.subnet, '/48');
    });

    it('is in its own subnet', function () {
      topic.isInSubnet(new v6.Address('a:b::/48')).should.equal(true);
    });

    it('is not in another subnet', function () {
      topic.isInSubnet(new v6.Address('a:c::/48')).should.equal(false);
    });
  });

  describe('An address with a zone', function () {
    var topic = new v6.Address('a::b%abcdefg');

    it('validates', function () {
      topic.isValid().should.equal(true);
    });

    it('parses the zone', function () {
      should.equal(topic.zone, '%abcdefg');
    });
  });

  describe('A teredo address', function () {
    var topic = new v6.Address('2001:0000:ce49:7601:e866:efff:62c3:fffe');

    it('validates as Teredo', function () {
      topic.isTeredo().should.equal(true);
    });

    it('contains valid Teredo information', function () {
      var teredo = topic.teredo();

      should.equal(teredo.prefix, '2001:0000');
      should.equal(teredo.server4, '206.73.118.1');
      should.equal(teredo.flags, '1110100001100110');
      should.equal(teredo.udpPort, '4096');
      should.equal(teredo.client4, '157.60.0.1');
    });
  });

  describe('A 6to4 address', function () {
    var topic = new v6.Address('2002:ce49:7601:1:2de:adff:febe:eeef');

    it('validates as 6to4', function () {
      topic.is6to4().should.equal(true);
    });

    it('contains valid 6to4 information', function () {
      var six2four = topic.six2four();

      should.equal(six2four.prefix, '2002');
      should.equal(six2four.gateway, '206.73.118.1');
    });
  });

  describe('A different notation of the same address', function () {
    var addresses = notationsToAddresseses([
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
      '2001:DB8:0:0:1::1'
    ]);

    it('is parsed to the same result', function () {
      addresses.forEach(function (topic) {
        should.equal(topic.correctForm(), '2001:db8::1:0:0:1');
        should.equal(topic.canonicalForm(),
          '2001:0db8:0000:0000:0001:0000:0000:0001');
        should.equal(topic.v4inv6(), '2001:db8::1:0:0.0.0.1');
        should.equal(topic.decimal(),
          '08193:03512:00000:00000:00001:00000:00000:00001');
        should.equal(topic.binaryZeroPad(),
          '0010000000000001000011011011100000000000000000000000000000000000' +
          '0000000000000001000000000000000000000000000000000000000000000001');
      });
    });
  });

  describe('Address from an IPv4 address', function () {
    var obj = v6.Address.fromAddress4('192.168.0.1');

    it('should parse correctly', function () {
      expect(obj.valid).to.equal(true);
      expect(obj.correctForm()).to.equal('::ffff:c0a8:1');
      expect(obj.v4inv6()).to.equal('::ffff:192.168.0.1');
    });

    it('should generate a 6to4 address', function () {
      expect(obj.get6to4().correctForm()).to.equal('2002:c0a8:1::');
    });
  });

  describe('Address inside a URL or inside a URL with a port', function () {
    it('should work with a host address', function () {
      var obj = v6.Address.fromURL('2001:db8::5');

      expect(obj.address.valid).to.equal(true);
      expect(obj.address.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(null);
    });

    it('should fail with an invalid URL', function () {
      var obj = v6.Address.fromURL('http://2001:db8::5/foo');

      expect(obj.address.isValid()).to.equal(true);
      expect(obj.address.address).equal('2001:db8::5');
      expect(obj.port).to.equal(null);
    });

    it('should work with a basic URL', function () {
      var obj = v6.Address.fromURL('http://2001:db8::5/foo');

      expect(obj.address.isValid()).to.equal(true);
      expect(obj.address.address).equal('2001:db8::5');
      expect(obj.port).to.equal(null);
    });

    it('should work with a basic URL enclosed in brackets', function () {
      var obj = v6.Address.fromURL('http://[2001:db8::5]/foo');

      expect(obj.address.isValid()).to.equal(true);
      expect(obj.address.address).equal('2001:db8::5');
      expect(obj.port).to.equal(null);
    });

    it('should work with a URL with a port', function () {
      var obj = v6.Address.fromURL('http://[2001:db8::5]:80/foo');

      expect(obj.address.isValid()).to.equal(true);
      expect(obj.address.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(80);
    });

    it('should work with a URL with a long port number', function () {
      var obj = v6.Address.fromURL('http://[2001:db8::5]:65536/foo');

      expect(obj.address.isValid()).to.equal(true);
      expect(obj.address.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(65536);
    });

    it('should work with a address with a port', function () {
      var obj = v6.Address.fromURL('[2001:db8::5]:80');

      expect(obj.address.isValid()).to.equal(true);
      expect(obj.address.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(80);
    });

    it('should work with an address with a long port', function () {
      var obj = v6.Address.fromURL('[2001:db8::5]:65536');

      expect(obj.address.isValid()).to.equal(true);
      expect(obj.address.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(65536);
    });

    it('should parse the address but fail with an invalid port', function () {
      var obj = v6.Address.fromURL('[2001:db8::5]:65537');

      expect(obj.address.isValid()).to.equal(true);
      expect(obj.address.address).to.equal('2001:db8::5');
      expect(obj.port).to.equal(null);
    });

    it('should fail with an invalid address and not return a port',
      function () {
      var obj = v6.Address.fromURL('[2001:db8:z:5]:65536');

      expect(obj.error).to.equal('failed to parse address with port');
      expect(obj.port).to.equal(null);
    });
  });

  describe('An address from a BigInteger', function () {
    var topic = v6.Address
      .fromBigInteger(new BigInteger('51923840109643282840007714694758401'));

    it('should parse correctly', function () {
      topic.valid.should.equal(true);

      // TODO: Define this behavior
      // topic.isCorrect().should.equal(true);

      should.equal(topic.correctForm(), 'a:b:c:d:e:f:0:1');
    });
  });
});
