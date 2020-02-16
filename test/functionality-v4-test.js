'use strict';

var sprintf = require('sprintf-js').sprintf;
var should = require('chai').should();

var Address4 = require('../lib/ipv4.js');

// A convenience function to convert a list of IPv4 address notations
// to Address4 instances
function notationsToAddresseses(notations) {
  var addresses = [];

  notations.forEach(function (notation) {
    addresses.push(new Address4(notation));
  });

  return addresses;
}

describe('v4', function () {
  describe('An non-string input', function () {
    var topic = new Address4(undefined);

    it('is invalid', function () {
      topic.error.should.equal('Invalid argument, address should be a stirng');

      topic.valid.should.equal(false);

      topic.isCorrect().should.equal(false);

      should.equal(topic.bigInteger(), null);
    });

  });

  describe('An invalid address', function () {
    var topic = new Address4('127.0.0');

    it('is invalid', function () {
      topic.error.should.equal('Invalid IPv4 address.');

      topic.valid.should.equal(false);

      topic.isCorrect().should.equal(false);

      should.equal(topic.bigInteger(), null);
    });

  });

  describe('A correct address', function () {
    var topic = new Address4('127.0.0.1');

    it('validates as correct', function () {
      topic.isCorrect().should.equal(true);

      should.equal(topic.correctForm(), '127.0.0.1');
    });
  });

  describe('An address with a subnet', function () {
    var topic = new Address4('127.0.0.1/16');

    it('is contained by an identical address with an identical subnet',
      function () {
        var same = new Address4('127.0.0.1/16');

        topic.isInSubnet(same).should.equal(true);
      });
  });

  describe('A small subnet', function () {
    var topic = new Address4('127.0.0.1/16');

    it('is contained by larger subnets', function () {
      for (var i = 15; i > 0; i--) {
        var larger = new Address4(sprintf('127.0.0.1/%d', i));

        topic.isInSubnet(larger).should.equal(true);
      }
    });
  });

  describe('A large subnet', function () {
    var topic = new Address4('127.0.0.1/8');

    it('is not contained by smaller subnets', function () {
      for (var i = 9; i <= 32; i++) {
        var smaller = new Address4(sprintf('127.0.0.1/%d', i));

        topic.isInSubnet(smaller).should.equal(false);
      }
    });
  });

  describe('An integer v4 address', function () {
    var topic = Address4.fromInteger(432432423);

    it('validates', function () {
      topic.isValid().should.equal(true);
    });

    it('parses correctly', function () {
      topic.address.should.equal('25.198.101.39');

      topic.subnet.should.equal('/32');
      topic.subnetMask.should.equal(32);
    });

    it('should match an address from its hex representation', function () {
      var hex = Address4.fromHex('19c66527');

      hex.address.should.equal('25.198.101.39');

      hex.subnet.should.equal('/32');
      hex.subnetMask.should.equal(32);
    });
  });

  describe('An address with a subnet', function () {
    var topic = new Address4('127.0.0.1/16');

    it('validates', function () {
      topic.isValid().should.equal(true);
    });

    it('parses the subnet', function () {
      should.equal(topic.subnet, '/16');
    });

    it('has a correct start address', function () {
      should.equal(topic.startAddress().correctForm(), '127.0.0.0');
    });

    it('has a correct start address hosts only', function () {
      should.equal(topic.startAddressExclusive().correctForm(), '127.0.0.1');
    });

    it('has a correct end address', function () {
      should.equal(topic.endAddress().correctForm(), '127.0.255.255');
    });

    it('has a correct end address hosts only', function () {
      should.equal(topic.endAddressExclusive().correctForm(), '127.0.255.254');
    });

    it('is in its own subnet', function () {
      topic.isInSubnet(new Address4('127.0.0.1/16')).should.equal(true);
    });

    it('is not in another subnet', function () {
      topic.isInSubnet(new Address4('192.168.0.1/16')).should.equal(false);
    });
  });

  describe('Creating an address from a BigInteger', function () {
    var topic = Address4.fromBigInteger(2130706433);

    it('should parse correctly', function () {
      topic.isValid().should.equal(true);
      topic.correctForm().should.equal('127.0.0.1');
    });
  });

  describe('Converting an address to a BigInteger', function () {
    var topic = new Address4('127.0.0.1');

    it('should convert properly', function () {
      topic.bigInteger().intValue().should.equal(2130706433);
    });
  });

  describe('Creating an address from hex', function () {
    var topic = Address4.fromHex('7f:00:00:01');

    it('should parse correctly', function () {
      topic.isValid().should.equal(true);
      topic.correctForm().should.equal('127.0.0.1');
    });
  });

  describe('Converting an address to hex', function () {
    var topic = new Address4('127.0.0.1');

    it('should convert correctly', function () {
      topic.toHex().should.equal('7f:00:00:01');
    });
  });

  describe('Converting an address to an array', function () {
    var topic = new Address4('127.0.0.1');

    it('should convert correctly', function () {
      var a = topic.toArray();

      a.should.be.an.instanceOf(Array).and.have.lengthOf(4);

      a[0].should.equal(127);
      a[1].should.equal(0);
      a[2].should.equal(0);
      a[3].should.equal(1);
    });
  });

  describe('A different notation of the same address', function () {
    var addresses = notationsToAddresseses([
      '127.0.0.1/32',
      '127.0.0.1/032',
      '127.000.000.001/032',
      '127.000.000.001/32',
      '127.0.0.1',
      '127.000.000.001',
      '127.000.0.1'
    ]);

    it('is parsed to the same result', function () {
      addresses.forEach(function (topic) {
        should.equal(topic.correctForm(), '127.0.0.1');
        should.equal(topic.subnetMask, 32);
      });
    });
  });

  describe('A multicast address', function () {
    var multicastAddresses = notationsToAddresseses([
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
      '239.255.255.255'
    ]);

    it('is detected as multicast', function () {
      multicastAddresses.forEach(function (topic) {
        should.equal(topic.isMulticast(), true);
      });
    });
  });

  describe('A unicast address', function () {
    var unicastAddresses = notationsToAddresseses([
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
      '139.255.255.255'
    ]);

    it('is not detected as multicast', function () {
      unicastAddresses.forEach(function (topic) {
        should.equal(topic.isMulticast(), false);
      });
    });
  });
});
