var fs = require('fs'),
    sprintf = require('sprintf').sprintf,
    vows = require('vows'),
    assert = require('assert');

var v6 = require('../ipv6').v6,
    BigInteger = require('../lib/node/bigint');

// A convenience function to convert a list of IPv6 address notations
// to v6.Address instances
function notations_to_addresses(notations) {
   var addresses = [];

   for (var i = 0; i < notations.length; i++) {
      addresses.push(new v6.Address(notations[i]));
   }

   return addresses;
}

var batch = {
   'A correct address': {
      topic: new v6.Address('a::b'),

      'contains no uppercase letters': function(a) {
         assert.isFalse(/[A-Z]/.test(a.address));
      },
      'validates as correct': function(a) {
         assert.isTrue(a.isCorrect());
         assert.equal(a.correctForm(), 'a::b');
      }
   },

   'Identical subnets': {
      topic: new v6.Address('ffff::/64'),

      'are contained by identical subnets': function(a) {
         var same = new v6.Address('ffff::/64');

         assert.isTrue(a.isInSubnet(same));
      }
   },

   'Small subnets': {
      topic: new v6.Address('ffff::/64'),

      'are contained by larger subnets': function(a) {
         for (var i = 63; i > 0; i--) {
            var larger = new v6.Address(sprintf('ffff::/%d', i));

            assert.isTrue(a.isInSubnet(larger));
         }
      }
   },

   'Large subnets': {
      topic: new v6.Address('ffff::/8'),

      'are not contained by smaller subnets': function(a) {
         for (var i = 9; i <= 128; i++) {
            var smaller = new v6.Address(sprintf('ffff::/%d', i));

            assert.isFalse(a.isInSubnet(smaller));
         }
      }
   },

   'A canonical address': {
      topic: new v6.Address('000a:0000:0000:0000:0000:0000:0000:000b'),

      'is 39 characters long': function(a) {
         assert.equal(a.address.length, 39);
      },
      'validates as canonical': function(a) {
         assert.isTrue(a.isCanonical());
         assert.equal(a.canonicalForm(), '000a:0000:0000:0000:0000:0000:0000:000b');
      }
   },

   'A v4 in v6 address': {
      topic: new v6.Address('::192.168.0.1'),

      'validates': function(a) {
         assert.isTrue(a.isValid());
      },
      'is v4': function(a) {
         assert.isTrue(a.is4());
      }
   },

   'An address with a subnet': {
      topic: new v6.Address('a::b/48'),

      'validates': function (a) {
         assert.isTrue(a.isValid());
      },
      'parses the subnet': function (a) {
         assert.equal(a.subnet, '/48');
      },
      'is in its own subnet': function (a) {
         assert.isTrue(a.isInSubnet(new v6.Address('a::b/48')));
      },
      'is not in a another subnet': function (a) {
         assert.isTrue(a.isInSubnet(new v6.Address('a::c/48')));
      }
   },

   'An address with a zone': {
      topic: new v6.Address('a::b%abcdefg'),

      'validates': function (a) {
         assert.isTrue(a.isValid());
      },
      'parses the zone': function (a) {
         assert.equal(a.zone, '%abcdefg');
      }
   },

   'A Teredo address': {
      topic: new v6.Address('2001:0000:ce49:7601:e866:efff:62c3:fffe'),

      'validates as Teredo': function(a) {
         assert.isTrue(a.isTeredo());
      },
      'contains valid Teredo information': function(a) {
         var teredo = a.teredo();

         assert.equal(teredo.prefix, '2001:0000');
         assert.equal(teredo.server4, '206.73.118.1');
         assert.equal(teredo.flags, '1110100001100110');
         assert.equal(teredo.udpPort, '4096');
         assert.equal(teredo.client4, '157.60.0.1');
      }
   },

   'Different notations of the same address': {
      topic: notations_to_addresses([
         "2001:db8:0:0:1:0:0:1",
         "2001:0db8:0:0:1:0:0:1",
         "2001:db8::1:0:0:1",
         "2001:db8::0:1:0:0:1",
         "2001:0db8::1:0:0:1",
         "2001:db8:0:0:1::1",
         "2001:db8:0000:0:1::1",
         "2001:DB8:0:0:1::1"
      ]),

      'are parsed to the same result': function (addresses) {
         for (var i = 0, a; a = addresses[i], i < addresses.length; i++) {
            assert.equal(a.correctForm(), '2001:db8::1:0:0:1');
            assert.equal(a.canonicalForm(), '2001:0db8:0000:0000:0001:0000:0000:0001');
            assert.equal(a.v4inv6(), '2001:db8::1:0:0.0.0.1');
            assert.equal(a.decimal(), '08193:03512:00000:00000:00001:00000:00000:00001');
            assert.equal(a.binaryZeroPad(), '0010000000000001000011011011100000000000000000000000000000000000' +
                                            '0000000000000001000000000000000000000000000000000000000000000001');
         }
      }
   }
};

vows.describe('v6.Address - Functionality')
   .addBatch(batch)
   .export(module);
