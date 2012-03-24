var fs = require('fs'),
    sprintf = require('sprintf').sprintf,
    should = require('should');

var v6 = require('../ipv6').v6,
    BigInteger = require('../lib/node/bigint');

// A convenience function to convert a list of IPv6 address notations
// to v6.Address instances
function notationsToAddresseses(notations) {
   var addresses = [];

   notations.forEach(function(notation) {
      addresses.push(new v6.Address(notation));
   });

   return addresses;
}

describe('A correct address', function() {
   var topic = new v6.Address('a::b');

   it('contains no uppercase letters', function() {
      /[A-Z]/.test(topic.address).should.be.false;
   });

   it('validates as correct', function() {
      topic.isCorrect().should.be.true;

      should.equal(topic.correctForm(), 'a::b');
   });
});

describe('An address with a subnet', function() {
   var topic = new v6.Address('ffff::/64');

   it('is contained by an identical address with an identical subnet', function() {
      var same = new v6.Address('ffff::/64');

      topic.isInSubnet(same).should.be.true;
   });
});

describe('Small subnets', function() {
   var topic = new v6.Address('ffff::/64');

   it('is contained by larger subnets', function() {
      for (var i = 63; i > 0; i--) {
         var larger = new v6.Address(sprintf('ffff::/%d', i));

         topic.isInSubnet(larger).should.be.true;
      }
   });
});

describe('Large subnets', function() {
   var topic = new v6.Address('ffff::/8');

   it('is not contained by smaller subnets', function() {
      for (var i = 9; i <= 128; i++) {
         var smaller = new v6.Address(sprintf('ffff::/%d', i));

         topic.isInSubnet(smaller).should.be.false;
      }
   });
});

describe('A canonical address', function() {
   var topic = new v6.Address('000a:0000:0000:0000:0000:0000:0000:000b');

   it('is 39 characters long', function() {
      should.equal(topic.address.length, 39);
   });

   it('validates as canonical', function() {
      topic.isCanonical().should.be.true;

      should.equal(topic.canonicalForm(), '000a:0000:0000:0000:0000:0000:0000:000b');
   });
});

describe('A v4-in-v6 address', function() {
   var topic = new v6.Address('::192.168.0.1');

   it('validates', function() {
      topic.isValid().should.be.true;
   });

   it('is v4', function() {
      topic.is4().should.be.true;
   });
});

describe('An address with a subnet', function() {
   var topic = new v6.Address('a::b/48');

   it('validates', function() {
      topic.isValid().should.be.true;
   });

   it('parses the subnet', function() {
      should.equal(topic.subnet, '/48');
   });

   it('is in its own subnet', function() {
      topic.isInSubnet(new v6.Address('a::b/48')).should.be.true;
   });

   it('is not in another subnet', function() {
      topic.isInSubnet(new v6.Address('a::c/48')).should.be.true;
   });
});

describe('An address with a zone', function() {
   var topic = new v6.Address('a::b%abcdefg');

   it('validates', function() {
      topic.isValid().should.be.true;
   });

   it('parses the zone', function() {
      should.equal(topic.zone, '%abcdefg');
   });
});

describe('A teredo address', function() {
   var topic = new v6.Address('2001:0000:ce49:7601:e866:efff:62c3:fffe');

   it('validates as Teredo', function() {
      topic.isTeredo().should.be.true;
   });

   it('contains valid Teredo information', function() {
      var teredo = topic.teredo();

      should.equal(teredo.prefix, '2001:0000');
      should.equal(teredo.server4, '206.73.118.1');
      should.equal(teredo.flags, '1110100001100110');
      should.equal(teredo.udpPort, '4096');
      should.equal(teredo.client4, '157.60.0.1');
   });
});

describe('A 6to4 address', function() {
   var topic = new v6.Address('2002:ce49:7601:1:2de:adff:febe:eeef');

   it('validates as 6to4', function() {
      topic.is6to4().should.be.true;
   });

   it('contains valid 6to4 information', function() {
      var six2four = topic.six2four();

      should.equal(six2four.prefix, '2002');
      should.equal(six2four.gateway, '206.73.118.1');
   });
});

describe('A different notation of the same address', function() {
   var addresses = notationsToAddresseses([
      "2001:db8:0:0:1:0:0:1/128",
      "2001:db8:0:0:1:0:0:1/128%eth0",
      "2001:db8:0:0:1:0:0:1%eth0",
      "2001:db8:0:0:1:0:0:1",
      "2001:0db8:0:0:1:0:0:1",
      "2001:db8::1:0:0:1",
      "2001:db8::0:1:0:0:1",
      "2001:0db8::1:0:0:1",
      "2001:db8:0:0:1::1",
      "2001:db8:0000:0:1::1",
      "2001:DB8:0:0:1::1"
   ]);

   it('is parsed to the same result', function() {
      addresses.forEach(function(topic) {
         should.equal(topic.correctForm(), '2001:db8::1:0:0:1');
         should.equal(topic.canonicalForm(), '2001:0db8:0000:0000:0001:0000:0000:0001');
         should.equal(topic.v4inv6(), '2001:db8::1:0:0.0.0.1');
         should.equal(topic.decimal(), '08193:03512:00000:00000:00001:00000:00000:00001');
         should.equal(topic.binaryZeroPad(), '0010000000000001000011011011100000000000000000000000000000000000' +
                                             '0000000000000001000000000000000000000000000000000000000000000001');
      });
   });
});
