require.paths.push('..');

var vows = require('vows'),
    assert = require('assert');

var v6 = require('javascript-ipv6').v6,
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

/*
   Still to test:

   "2001:0000:4136:e378:8000:63bf:3fff:fdd2",
   "2001::CE49:7601:E866:EFFF:62C3:FFFE",
   "2001::CE49:7601:2CAD:DFFF:7C94:FFFE",
   "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
   "fedc:ba98:7654:3210:fedc:ba98:7654:3210",
   "2608:af09:30:0:0:0:0:134",
   "1080:0:0:0:8:800:200c:417a",
   "1080::8:800:200c:417a",
   "0:1:2:3:4:5:6:7",
   "7:6:5:4:3:2:1:0",
   "2608::3:5",
   "ffff::3:5",
   "::1",
   "0:0:0:0:0:0:0:0",
   "::",
   "ffff::",
   "ffff:",
   "ffff::ffff::ffff",
   "ffgg:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
   "0:0:0:0:1:0:0:0",
   "2608:af09:30::102a:7b91:c239b:baff",
*/

vows.describe('v6.Address').addBatch({
   'A correct address': {
      topic: new v6.Address('a::b'),

      'contains no uppercase letters': function(a) {
         assert.isFalse(/[A-Z]/.test(a.address));
      },
      'validates as correct': function(a) {
         assert.isTrue(a.isCorrect());
         assert.equal('a::b', a.correct_form());
      }
   },

   'A canonical address': {
      topic: new v6.Address('000a:0000:0000:0000:0000:0000:0000:000b'),

      'is 39 characters long': function(a) {
         assert.equal(a.address.length, 39);
      },
      'validates as canonical': function(a) {
         assert.isTrue(a.isCanonical());
         assert.equal('000a:0000:0000:0000:0000:0000:0000:000b', a.canonical_form());
      }
   },

   'An address with a subnet': {
      topic: new v6.Address('a::b/48'),

      'validates': function (a) {
         assert.isTrue(a.isValid());
      },
      'parses the subnet': function (a) {
         assert.equal('/48', a.subnet_string);
      }
   },

   'An address with a suffix': {
      topic: new v6.Address('a::b%abcdefg'),

      'validates': function (a) {
         assert.isTrue(a.isValid());
      },
      'parses the suffix': function (a) {
         assert.equal('%abcdefg', a.percent_string);
      }
   },

   'A Teredo address': {
      topic: new v6.Address('2001:0000:ce49:7601:e866:efff:62c3:fffe'),

      'validates as Teredo': function(a) {
         assert.isTrue(a.isTeredo());
      },
      'contains valid Teredo information': function(a) {
         var teredo = a.teredo();

         assert.equal('2001:0000', teredo.prefix);
         assert.equal('206.73.118.1', teredo.server_v4);
         assert.equal('1110100001100110', teredo.flags);
         assert.equal('4096', teredo.udp_port);
         assert.equal('157.60.0.1', teredo.client_v4);
      }
   },

   'Invalid addresses': {
      topic: notations_to_addresses([
         'a:b:c:d:e:f:g:0', // Invalid characters
         'a:b', // Too few octets
         'a::b::c', // Too many elisions
         'a::g', // Invalid characters
         '-1', // Too few octets, invalid characters (but it's an integer)
         '::-1', // Invalid characters (but it's an integer)
         'a:a:a:a:a:a:a:a:a' // Too many octets
      ]),

      'do not validate': function (addresses) {
         for (var i = 0, a; a = addresses[i], i < addresses.length; i++) {
            assert.isFalse(a.isValid());
         }
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
            assert.equal('2001:db8::1:0:0:1', a.correct_form());
            assert.equal('2001:0db8:0000:0000:0001:0000:0000:0001', a.canonical_form());
         }
      }
   }
}).export(module);
