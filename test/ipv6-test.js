require.paths.push('..');

var fs = require('fs'),
    vows = require('vows'),
    assert = require('assert');

var v6 = require('ipv6').v6,
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

/* Fails if the address is correct */
function assertIsIncorrect() {
   return function(e, address) {
      assert.isFalse(address.isCorrect());
   }
}

/* Fails if the address is incorrect */
function assertIsCorrect() {
   return function(e, address) {
      assert.isTrue(address.isCorrect());
   }
}

/* Fails if the address is valid */
function assertIsInvalid() {
   return function(e, address) {
      assert.isString(address.error);
      assert.isFalse(address.isValid());
   };
}

/* Fails if the address is invalid */
function assertIsValid() {
   return function(e, address) {
      assert.isObject(address);

      assert.isArray(address.parsedAddress);
      assert.length(address.parsedAddress, 8);

      assert.isTrue(address.isValid());
   };
}

function addressIs(descriptors) {
   var context = {
      topic: function() {
         var addressString = this.context.name;
         var address = new v6.Address(addressString);

         // XXX Proper way to call this?
         this.callback(null, address);
      }
   };

   for (var i = 0; i < descriptors.length; i++) {
      var descriptor = descriptors[i];

      if (descriptor == 'valid') {
         context['should validate'] = assertIsValid();
      }

      if (descriptor == 'invalid') {
         context['should not validate'] = assertIsInvalid();
      }

      if (descriptor == 'correct') {
         context['is correct'] = assertIsCorrect();
      }

      if (descriptor == 'incorrect') {
         context['is incorrect'] = assertIsIncorrect();
      }
   }

   return context;
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

var data = fs.readFileSync('test/addresses.json');
var json = JSON.parse(data);

for (var address in json.addresses) {
   batch[address] = addressIs(json.addresses[address].conditions);
}

vows.describe('v6.Address').addBatch(batch).export(module);
