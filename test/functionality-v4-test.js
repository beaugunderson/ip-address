var sprintf = require('sprintf').sprintf;
var should = require('chai').should();

var v4 = require('../ipv6').v4;

// A convenience function to convert a list of IPv4 address notations
// to v4.Address instances
function notationsToAddresseses(notations) {
  var addresses = [];

  notations.forEach(function (notation) {
    addresses.push(new v4.Address(notation));
  });

  return addresses;
}

describe('v4', function () {
  describe('A correct address', function () {
    var topic = new v4.Address('127.0.0.1');

    it('validates as correct', function () {
      topic.isCorrect().should.equal(true);

      should.equal(topic.correctForm(), '127.0.0.1');
    });
  });

  describe('An address with a subnet', function () {
    var topic = new v4.Address('127.0.0.1/16');

    it('is contained by an identical address with an identical subnet',
      function () {
      var same = new v4.Address('127.0.0.1/16');

      topic.isInSubnet(same).should.equal(true);
    });
  });

  describe('A small subnet', function () {
    var topic = new v4.Address('127.0.0.1/16');

    it('is contained by larger subnets', function () {
      for (var i = 15; i > 0; i--) {
        var larger = new v4.Address(sprintf('127.0.0.1/%d', i));

        topic.isInSubnet(larger).should.equal(true);
      }
    });
  });

  describe('A large subnet', function () {
    var topic = new v4.Address('127.0.0.1/8');

    it('is not contained by smaller subnets', function () {
      for (var i = 9; i <= 32; i++) {
        var smaller = new v4.Address(sprintf('127.0.0.1/%d', i));

        topic.isInSubnet(smaller).should.equal(false);
      }
    });
  });

  describe('An integer v4 address', function () {
    var topic = new v4.Address.fromInteger(432432423);

    it('validates', function () {
      topic.isValid().should.equal(true);
    });

    it('parses correctly', function () {
      topic.address.should.equal('25.198.101.39');

      topic.subnet.should.equal('/32');
      topic.subnetMask.should.equal(32);
    });

    it('should match an address from its hex representation', function () {
      var hex = v4.Address.fromHex('19c66527');

      hex.address.should.equal('25.198.101.39');

      hex.subnet.should.equal('/32');
      hex.subnetMask.should.equal(32);
    });
  });

  describe('An address with a subnet', function () {
    var topic = new v4.Address('127.0.0.1/16');

    it('validates', function () {
      topic.isValid().should.equal(true);
    });

    it('parses the subnet', function () {
      should.equal(topic.subnet, '/16');
    });

    it('is in its own subnet', function () {
      topic.isInSubnet(new v4.Address('127.0.0.1/16')).should.equal(true);
    });

    it('is not in another subnet', function () {
      topic.isInSubnet(new v4.Address('192.168.0.1/16')).should.equal(false);
    });
  });

  describe('Creating an address from a BigInteger', function () {
    var topic = v4.Address.fromBigInteger(2130706433);

    it('should parse correctly', function () {
      topic.isValid().should.equal(true);
      topic.correctForm().should.equal('127.0.0.1');
    });
  });

  describe('Converting an address to a BigInteger', function () {
    var topic = new v4.Address('127.0.0.1');

    it('should convert properly', function () {
      topic.bigInteger().intValue().should.equal(2130706433);
    });
  });

  describe('Creating an address from hex', function () {
    var topic = v4.Address.fromHex('7f:00:00:01');

    it('should parse correctly', function () {
      topic.isValid().should.equal(true);
      topic.correctForm().should.equal('127.0.0.1');
    });
  });

  describe('Converting an address to hex', function () {
    var topic = new v4.Address('127.0.0.1');

    it('should convert correctly', function () {
      topic.toHex().should.equal('7f:00:00:01');
    });
  });

  describe('Converting an address to an array', function () {
    var topic = new v4.Address('127.0.0.1');

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
      "127.0.0.1/32",
      "127.0.0.1/032",
      "127.000.000.001/032",
      "127.000.000.001/32",
      "127.0.0.1",
      "127.000.000.001",
      "127.000.0.1"
    ]);

    it('is parsed to the same result', function () {
      addresses.forEach(function (topic) {
        should.equal(topic.correctForm(), '127.0.0.1');
        should.equal(topic.subnetMask, 32);
      });
    });
  });
});
