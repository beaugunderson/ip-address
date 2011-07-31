require.paths.push('..');

var vows = require('vows'),
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

vows.describe('v6.Address').addBatch({
   '::a': addressIs(['valid', 'correct']),

   // Good addresses

   '0000:0000:0000:0000:0000:0000:0000:0000': addressIs(['valid', 'incorrect']),
   '0000:0000:0000:0000:0000:0000:0000:0001': addressIs(['valid', 'incorrect']),
   '0:0:0:0:0:0:0:0': addressIs(['valid', 'incorrect']),
   '0:0:0:0:0:0:0:1': addressIs(['valid', 'incorrect']),
   '0:0:0:0:0:0:0::': addressIs(['valid', 'incorrect']),
   '0:0:0:0:0:0:13.1.68.3': addressIs(['valid', 'incorrect']),
   '0:0:0:0:0:0::': addressIs(['valid', 'incorrect']),
   '0:0:0:0:0::': addressIs(['valid', 'incorrect']),
   '0:0:0:0:0:FFFF:129.144.52.38': addressIs(['valid', 'incorrect']),
   '0:0:0:0:1:0:0:0': addressIs(['valid', 'incorrect']),
   '0:0:0:0::': addressIs(['valid', 'incorrect']),
   '0:0:0::': addressIs(['valid', 'incorrect']),
   '0:0::': addressIs(['valid', 'incorrect']),
   '0:1:2:3:4:5:6:7': addressIs(['valid', 'correct']),
   '0::': addressIs(['valid', 'incorrect']),
   '0:a:b:c:d:e:f::': addressIs(['valid', 'incorrect']),
   '1080:0:0:0:8:800:200c:417a': addressIs(['valid', 'incorrect']),
   '1080::8:800:200c:417a': addressIs(['valid', 'correct']),
   '1111:2222:3333:4444:5555:6666:123.123.123.123': addressIs(['valid']),
   '1111:2222:3333:4444:5555:6666:7777:8888': addressIs(['valid', 'correct']),
   '1111:2222:3333:4444:5555:6666:7777::': addressIs(['valid', 'incorrect']),
   '1111:2222:3333:4444:5555:6666::': addressIs(['valid', 'correct']),
   '1111:2222:3333:4444:5555:6666::8888': addressIs(['valid', 'incorrect']),
   '1111:2222:3333:4444:5555::': addressIs(['valid', 'correct']),
   '1111:2222:3333:4444:5555::123.123.123.123': addressIs(['valid']),
   '1111:2222:3333:4444:5555::7777:8888': addressIs(['valid', 'incorrect']),
   '1111:2222:3333:4444:5555::8888': addressIs(['valid', 'correct']),
   '1111:2222:3333:4444::': addressIs(['valid', 'correct']),
   '1111:2222:3333:4444::123.123.123.123': addressIs(['valid']),
   '1111:2222:3333:4444::6666:123.123.123.123': addressIs(['valid']),
   '1111:2222:3333:4444::6666:7777:8888': addressIs(['valid', 'incorrect']),
   '1111:2222:3333:4444::7777:8888': addressIs(['valid', 'correct']),
   '1111:2222:3333:4444::8888': addressIs(['valid', 'correct']),
   '1111:2222:3333::': addressIs(['valid', 'correct']),
   '1111:2222:3333::123.123.123.123': addressIs(['valid']),
   '1111:2222:3333::5555:6666:123.123.123.123': addressIs(['valid']),
   '1111:2222:3333::5555:6666:7777:8888': addressIs(['valid']),
   '1111:2222:3333::6666:123.123.123.123': addressIs(['valid']),
   '1111:2222:3333::6666:7777:8888': addressIs(['valid']),
   '1111:2222:3333::7777:8888': addressIs(['valid']),
   '1111:2222:3333::8888': addressIs(['valid']),
   '1111:2222::': addressIs(['valid']),
   '1111:2222::123.123.123.123': addressIs(['valid']),
   '1111:2222::4444:5555:6666:123.123.123.123': addressIs(['valid']),
   '1111:2222::4444:5555:6666:7777:8888': addressIs(['valid']),
   '1111:2222::5555:6666:123.123.123.123': addressIs(['valid']),
   '1111:2222::5555:6666:7777:8888': addressIs(['valid']),
   '1111:2222::6666:123.123.123.123': addressIs(['valid']),
   '1111:2222::6666:7777:8888': addressIs(['valid']),
   '1111:2222::7777:8888': addressIs(['valid']),
   '1111:2222::8888': addressIs(['valid']),
   '1111::': addressIs(['valid']),
   '1111::123.123.123.123': addressIs(['valid']),
   '1111::3333:4444:5555:6666:123.123.123.123': addressIs(['valid']),
   '1111::3333:4444:5555:6666:7777:8888': addressIs(['valid']),
   '1111::4444:5555:6666:123.123.123.123': addressIs(['valid']),
   '1111::4444:5555:6666:7777:8888': addressIs(['valid']),
   '1111::5555:6666:123.123.123.123': addressIs(['valid']),
   '1111::5555:6666:7777:8888': addressIs(['valid']),
   '1111::6666:123.123.123.123': addressIs(['valid']),
   '1111::6666:7777:8888': addressIs(['valid']),
   '1111::7777:8888': addressIs(['valid']),
   '1111::8888': addressIs(['valid']),
   '1:2:3:4:5:6:1.2.3.4': addressIs(['valid']),
   '1:2:3:4:5:6:7:8': addressIs(['valid']),
   '1:2:3:4:5:6::': addressIs(['valid']),
   '1:2:3:4:5:6::8': addressIs(['valid']),
   '1:2:3:4:5::': addressIs(['valid']),
   '1:2:3:4:5::1.2.3.4': addressIs(['valid']),
   '1:2:3:4:5::7:8': addressIs(['valid']),
   '1:2:3:4:5::8': addressIs(['valid']),
   '1:2:3:4::': addressIs(['valid']),
   '1:2:3:4::1.2.3.4': addressIs(['valid']),
   '1:2:3:4::5:1.2.3.4': addressIs(['valid']),
   '1:2:3:4::7:8': addressIs(['valid']),
   '1:2:3:4::8': addressIs(['valid']),
   '1:2:3::': addressIs(['valid']),
   '1:2:3::1.2.3.4': addressIs(['valid']),
   '1:2:3::5:1.2.3.4': addressIs(['valid']),
   '1:2:3::7:8': addressIs(['valid']),
   '1:2:3::8': addressIs(['valid']),
   '1:2::': addressIs(['valid']),
   '1:2::1.2.3.4': addressIs(['valid']),
   '1:2::5:1.2.3.4': addressIs(['valid']),
   '1:2::7:8': addressIs(['valid']),
   '1:2::8': addressIs(['valid']),
   '1::': addressIs(['valid']),
   '1::1.2.3.4': addressIs(['valid']),
   '1::2:3': addressIs(['valid']),
   '1::2:3:4': addressIs(['valid']),
   '1::2:3:4:5': addressIs(['valid']),
   '1::2:3:4:5:6': addressIs(['valid']),
   '1::2:3:4:5:6:7': addressIs(['valid']),
   '1::5:1.2.3.4': addressIs(['valid']),
   '1::5:11.22.33.44': addressIs(['valid']),
   '1::7:8': addressIs(['valid']),
   '1::8': addressIs(['valid']),
   '2001:0000:1234:0000:0000:C1C0:ABCD:0876': addressIs(['valid']),
   '2001:0000:4136:e378:8000:63bf:3fff:fdd2': addressIs(['valid']),
   '2001:0DB8:0000:CD30:0000:0000:0000:0000/60': addressIs(['valid']),
   '2001:0DB8:0:CD30::/60': addressIs(['valid']),
   '2001:0DB8::CD30:0:0:0:0/60': addressIs(['valid']),
   '2001:0db8:0000:0000:0000:0000:1428:57ab': addressIs(['valid']),
   '2001:0db8:0000:0000:0000::1428:57ab': addressIs(['valid']),
   '2001:0db8:0:0:0:0:1428:57ab': addressIs(['valid']),
   '2001:0db8:0:0::1428:57ab': addressIs(['valid']),
   '2001:0db8:1234:0000:0000:0000:0000:0000': addressIs(['valid']),
   '2001:0db8:1234::': addressIs(['valid']),
   '2001:0db8:1234:ffff:ffff:ffff:ffff:ffff': addressIs(['valid']),
   '2001:0db8:85a3:0000:0000:8a2e:0370:7334': addressIs(['valid']),
   '2001:0db8::1428:57ab': addressIs(['valid']),
   '2001::CE49:7601:2CAD:DFFF:7C94:FFFE': addressIs(['valid']),
   '2001::CE49:7601:E866:EFFF:62C3:FFFE': addressIs(['valid']),
   '2001:DB8:0:0:8:800:200C:417A': addressIs(['valid']),
   '2001:DB8::8:800:200C:417A': addressIs(['valid']),
   '2001:db8:85a3:0:0:8a2e:370:7334': addressIs(['valid']),
   '2001:db8:85a3::8a2e:370:7334': addressIs(['valid']),
   '2001:db8::': addressIs(['valid']),
   '2001:db8::1428:57ab': addressIs(['valid']),
   '2001:db8:a::123': addressIs(['valid']),
   '2002::': addressIs(['valid']),
   '2608::3:5': addressIs(['valid']),
   '2608:af09:30:0:0:0:0:134': addressIs(['valid']),
   '2608:af09:30::102a:7b91:c239:baff': addressIs(['valid']),
   '2::10': addressIs(['valid']),
   '3ffe:0b00:0000:0000:0001:0000:0000:000a': addressIs(['valid']),
   '7:6:5:4:3:2:1:0': addressIs(['valid']),
   '::': addressIs(['valid']),
   '::/128': addressIs(['valid']),
   '::0': addressIs(['valid']),
   '::0:0': addressIs(['valid']),
   '::0:0:0': addressIs(['valid']),
   '::0:0:0:0': addressIs(['valid']),
   '::0:0:0:0:0': addressIs(['valid']),
   '::0:0:0:0:0:0': addressIs(['valid']),
   '::0:0:0:0:0:0:0': addressIs(['valid']),
   '::0:a:b:c:d:e:f': addressIs(['valid']),
   '::1': addressIs(['valid']),
   '::1/128': addressIs(['valid']),
   '::123.123.123.123': addressIs(['valid']),
   '::13.1.68.3': addressIs(['valid']),
   '::2222:3333:4444:5555:6666:123.123.123.123': addressIs(['valid']),
   '::2222:3333:4444:5555:6666:7777:8888': addressIs(['valid']),
   '::2:3': addressIs(['valid']),
   '::2:3:4': addressIs(['valid']),
   '::2:3:4:5': addressIs(['valid']),
   '::2:3:4:5:6': addressIs(['valid']),
   '::2:3:4:5:6:7': addressIs(['valid']),
   '::2:3:4:5:6:7:8': addressIs(['valid']),
   '::3333:4444:5555:6666:7777:8888': addressIs(['valid']),
   '::4444:5555:6666:123.123.123.123': addressIs(['valid']),
   '::4444:5555:6666:7777:8888': addressIs(['valid']),
   '::5555:6666:123.123.123.123': addressIs(['valid']),
   '::5555:6666:7777:8888': addressIs(['valid']),
   '::6666:123.123.123.123': addressIs(['valid']),
   '::6666:7777:8888': addressIs(['valid']),
   '::7777:8888': addressIs(['valid']),
   '::8': addressIs(['valid']),
   '::8888': addressIs(['valid']),
   '::FFFF:129.144.52.38': addressIs(['valid']),
   '::ffff:0:0': addressIs(['valid']),
   '::ffff:0c22:384e': addressIs(['valid']),
   '::ffff:12.34.56.78': addressIs(['valid']),
   '::ffff:192.0.2.128': addressIs(['valid']),
   '::ffff:192.168.1.1': addressIs(['valid']),
   '::ffff:192.168.1.26': addressIs(['valid']),
   '::ffff:c000:280': addressIs(['valid']),
   'FE80::/10': addressIs(['valid']),
   'FEC0::/10': addressIs(['valid']),
   'FF00::/8': addressIs(['valid']),
   'FF01:0:0:0:0:0:0:101': addressIs(['valid']),
   'FF01::101': addressIs(['valid']),
   'FF02:0000:0000:0000:0000:0000:0000:0001': addressIs(['valid']),
   'a:b:c:d:e:f:0::': addressIs(['valid']),
   'fe80:0000:0000:0000:0204:61ff:fe9d:f156': addressIs(['valid']),
   'fe80:0:0:0:204:61ff:254.157.241.86': addressIs(['valid']),
   'fe80:0:0:0:204:61ff:fe9d:f156': addressIs(['valid']),
   'fe80::': addressIs(['valid']),
   'fe80::1': addressIs(['valid']),
   'fe80::204:61ff:254.157.241.86': addressIs(['valid']),
   'fe80::204:61ff:fe9d:f156': addressIs(['valid']),
   'fe80::217:f2ff:254.7.237.98': addressIs(['valid']),
   'fe80::217:f2ff:fe07:ed62': addressIs(['valid']),
   'fedc:ba98:7654:3210:fedc:ba98:7654:3210': addressIs(['valid']),
   'ff02::1': addressIs(['valid']),
   'ffff::': addressIs(['valid']),
   'ffff::3:5': addressIs(['valid']),
   'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff': addressIs(['valid']),

   // Bad addresses

   "':10.0.0.1": addressIs(['invalid']),
   '': addressIs(['invalid']),
   '-1': addressIs(['invalid']), // Too few groups, invalid characters (but it's an integer)
   '02001:0000:1234:0000:0000:C1C0:ABCD:0876': addressIs(['invalid']),
   '1.2.3.4': addressIs(['invalid']),
   '1.2.3.4:1111:2222:3333:4444::5555': addressIs(['invalid']),
   '1.2.3.4:1111:2222:3333::5555': addressIs(['invalid']),
   '1.2.3.4:1111:2222::5555': addressIs(['invalid']),
   '1.2.3.4:1111::5555': addressIs(['invalid']),
   '1.2.3.4::': addressIs(['invalid']),
   '1.2.3.4::5555': addressIs(['invalid']),
   '1111': addressIs(['invalid']),
   '11112222:3333:4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   '11112222:3333:4444:5555:6666:7777:8888': addressIs(['invalid']),
   '1111:': addressIs(['invalid']),
   '1111:1.2.3.4': addressIs(['invalid']),
   '1111:2222': addressIs(['invalid']),
   '1111:22223333:4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   '1111:22223333:4444:5555:6666:7777:8888': addressIs(['invalid']),
   '1111:2222:': addressIs(['invalid']),
   '1111:2222:1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333': addressIs(['invalid']),
   '1111:2222:33334444:5555:6666:1.2.3.4': addressIs(['invalid']),
   '1111:2222:33334444:5555:6666:7777:8888': addressIs(['invalid']),
   '1111:2222:3333:': addressIs(['invalid']),
   '1111:2222:3333:1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:4444': addressIs(['invalid']),
   '1111:2222:3333:44445555:6666:1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:44445555:6666:7777:8888': addressIs(['invalid']),
   '1111:2222:3333:4444:': addressIs(['invalid']),
   '1111:2222:3333:4444:1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:4444:5555': addressIs(['invalid']),
   '1111:2222:3333:4444:55556666:1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:4444:55556666:7777:8888': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:66661.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:66667777:8888': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:00.00.00.00': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:000.000.000.000': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:1.2.3.4.5': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:255.255.255255': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:255.255255.255': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:255255.255.255': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:256.256.256.256': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:7777': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:77778888': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:7777:': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:7777:1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:7777:8888:': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:7777:8888:1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:7777:8888:9999': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:7777:8888::': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:7777:::': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666::1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666::8888:': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:::': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:6666:::8888': addressIs(['invalid']),
   '1111:2222:3333:4444:5555::7777:8888:': addressIs(['invalid']),
   '1111:2222:3333:4444:5555::7777::': addressIs(['invalid']),
   '1111:2222:3333:4444:5555::8888:': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:::': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:::1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:4444:5555:::7777:8888': addressIs(['invalid']),
   '1111:2222:3333:4444::5555:': addressIs(['invalid']),
   '1111:2222:3333:4444::6666:7777:8888:': addressIs(['invalid']),
   '1111:2222:3333:4444::6666:7777::': addressIs(['invalid']),
   '1111:2222:3333:4444::6666::8888': addressIs(['invalid']),
   '1111:2222:3333:4444::7777:8888:': addressIs(['invalid']),
   '1111:2222:3333:4444::8888:': addressIs(['invalid']),
   '1111:2222:3333:4444:::': addressIs(['invalid']),
   '1111:2222:3333:4444:::6666:1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:4444:::6666:7777:8888': addressIs(['invalid']),
   '1111:2222:3333::5555:': addressIs(['invalid']),
   '1111:2222:3333::5555:6666:7777:8888:': addressIs(['invalid']),
   '1111:2222:3333::5555:6666:7777::': addressIs(['invalid']),
   '1111:2222:3333::5555:6666::8888': addressIs(['invalid']),
   '1111:2222:3333::5555::1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333::5555::7777:8888': addressIs(['invalid']),
   '1111:2222:3333::6666:7777:8888:': addressIs(['invalid']),
   '1111:2222:3333::7777:8888:': addressIs(['invalid']),
   '1111:2222:3333::8888:': addressIs(['invalid']),
   '1111:2222:3333:::': addressIs(['invalid']),
   '1111:2222:3333:::5555:6666:1.2.3.4': addressIs(['invalid']),
   '1111:2222:3333:::5555:6666:7777:8888': addressIs(['invalid']),
   '1111:2222::4444:5555:6666:7777:8888:': addressIs(['invalid']),
   '1111:2222::4444:5555:6666:7777::': addressIs(['invalid']),
   '1111:2222::4444:5555:6666::8888': addressIs(['invalid']),
   '1111:2222::4444:5555::1.2.3.4': addressIs(['invalid']),
   '1111:2222::4444:5555::7777:8888': addressIs(['invalid']),
   '1111:2222::4444::6666:1.2.3.4': addressIs(['invalid']),
   '1111:2222::4444::6666:7777:8888': addressIs(['invalid']),
   '1111:2222::5555:': addressIs(['invalid']),
   '1111:2222::5555:6666:7777:8888:': addressIs(['invalid']),
   '1111:2222::6666:7777:8888:': addressIs(['invalid']),
   '1111:2222::7777:8888:': addressIs(['invalid']),
   '1111:2222::8888:': addressIs(['invalid']),
   '1111:2222:::': addressIs(['invalid']),
   '1111:2222:::4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   '1111:2222:::4444:5555:6666:7777:8888': addressIs(['invalid']),
   '1111::3333:4444:5555:6666:7777:8888:': addressIs(['invalid']),
   '1111::3333:4444:5555:6666:7777::': addressIs(['invalid']),
   '1111::3333:4444:5555:6666::8888': addressIs(['invalid']),
   '1111::3333:4444:5555::1.2.3.4': addressIs(['invalid']),
   '1111::3333:4444:5555::7777:8888': addressIs(['invalid']),
   '1111::3333:4444::6666:1.2.3.4': addressIs(['invalid']),
   '1111::3333:4444::6666:7777:8888': addressIs(['invalid']),
   '1111::3333::5555:6666:1.2.3.4': addressIs(['invalid']),
   '1111::3333::5555:6666:7777:8888': addressIs(['invalid']),
   '1111::4444:5555:6666:7777:8888:': addressIs(['invalid']),
   '1111::5555:': addressIs(['invalid']),
   '1111::5555:6666:7777:8888:': addressIs(['invalid']),
   '1111::6666:7777:8888:': addressIs(['invalid']),
   '1111::7777:8888:': addressIs(['invalid']),
   '1111::8888:': addressIs(['invalid']),
   '1111:::': addressIs(['invalid']),
   '1111:::3333:4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   '1111:::3333:4444:5555:6666:7777:8888': addressIs(['invalid']),
   '123': addressIs(['invalid']),
   '12345::6:7:8': addressIs(['invalid']),
   '124.15.6.89/60': addressIs(['invalid']),
   '1:2:3:4:5:6:7:8:9': addressIs(['invalid']),
   '1:2:3::4:5:6:7:8:9': addressIs(['invalid']),
   '1:2:3::4:5::7:8': addressIs(['invalid']),
   '1::1.2.256.4': addressIs(['invalid']),
   '1::1.2.3.256': addressIs(['invalid']),
   '1::1.2.3.300': addressIs(['invalid']),
   '1::1.2.3.900': addressIs(['invalid']),
   '1::1.2.300.4': addressIs(['invalid']),
   '1::1.2.900.4': addressIs(['invalid']),
   '1::1.256.3.4': addressIs(['invalid']),
   '1::1.300.3.4': addressIs(['invalid']),
   '1::1.900.3.4': addressIs(['invalid']),
   '1::256.2.3.4': addressIs(['invalid']),
   '1::260.2.3.4': addressIs(['invalid']),
   '1::2::3': addressIs(['invalid']),
   '1::300.2.3.4': addressIs(['invalid']),
   '1::300.300.300.300': addressIs(['invalid']),
   '1::3000.30.30.30': addressIs(['invalid']),
   '1::400.2.3.4': addressIs(['invalid']),
   '1::5:1.2.256.4': addressIs(['invalid']),
   '1::5:1.2.3.256': addressIs(['invalid']),
   '1::5:1.2.3.300': addressIs(['invalid']),
   '1::5:1.2.3.900': addressIs(['invalid']),
   '1::5:1.2.300.4': addressIs(['invalid']),
   '1::5:1.2.900.4': addressIs(['invalid']),
   '1::5:1.256.3.4': addressIs(['invalid']),
   '1::5:1.300.3.4': addressIs(['invalid']),
   '1::5:1.900.3.4': addressIs(['invalid']),
   '1::5:256.2.3.4': addressIs(['invalid']),
   '1::5:260.2.3.4': addressIs(['invalid']),
   '1::5:300.2.3.4': addressIs(['invalid']),
   '1::5:300.300.300.300': addressIs(['invalid']),
   '1::5:3000.30.30.30': addressIs(['invalid']),
   '1::5:400.2.3.4': addressIs(['invalid']),
   '1::5:900.2.3.4': addressIs(['invalid']),
   '1::900.2.3.4': addressIs(['invalid']),
   '1:::3:4:5': addressIs(['invalid']),
   '2001:0000:1234: 0000:0000:C1C0:ABCD:0876': addressIs(['invalid']),
   '2001:0000:1234:0000:00001:C1C0:ABCD:0876': addressIs(['invalid']),
   '2001:0000:1234:0000:0000:C1C0:ABCD:0876  0': addressIs(['invalid']),
   '2001:1:1:1:1:1:255Z255X255Y255': addressIs(['invalid']),
   '2001::FFD3::57ab': addressIs(['invalid']),
   '2001:DB8:0:0:8:800:200C:417A:221': addressIs(['invalid']),
   '2001:db8:85a3::8a2e:37023:7334': addressIs(['invalid']),
   '2001:db8:85a3::8a2e:370k:7334': addressIs(['invalid']),
   '3ffe:0b00:0000:0001:0000:0000:000a': addressIs(['invalid']),
   '3ffe:b00::1::a': addressIs(['invalid']),
   ':': addressIs(['invalid']),
   ':1.2.3.4': addressIs(['invalid']),
   ':1111:2222:3333:4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   ':1111:2222:3333:4444:5555:6666:7777:8888': addressIs(['invalid']),
   ':1111:2222:3333:4444:5555:6666:7777::': addressIs(['invalid']),
   ':1111:2222:3333:4444:5555:6666::': addressIs(['invalid']),
   ':1111:2222:3333:4444:5555:6666::8888': addressIs(['invalid']),
   ':1111:2222:3333:4444:5555::': addressIs(['invalid']),
   ':1111:2222:3333:4444:5555::1.2.3.4': addressIs(['invalid']),
   ':1111:2222:3333:4444:5555::7777:8888': addressIs(['invalid']),
   ':1111:2222:3333:4444:5555::8888': addressIs(['invalid']),
   ':1111:2222:3333:4444::': addressIs(['invalid']),
   ':1111:2222:3333:4444::1.2.3.4': addressIs(['invalid']),
   ':1111:2222:3333:4444::5555': addressIs(['invalid']),
   ':1111:2222:3333:4444::6666:1.2.3.4': addressIs(['invalid']),
   ':1111:2222:3333:4444::6666:7777:8888': addressIs(['invalid']),
   ':1111:2222:3333:4444::7777:8888': addressIs(['invalid']),
   ':1111:2222:3333:4444::8888': addressIs(['invalid']),
   ':1111:2222:3333::': addressIs(['invalid']),
   ':1111:2222:3333::1.2.3.4': addressIs(['invalid']),
   ':1111:2222:3333::5555': addressIs(['invalid']),
   ':1111:2222:3333::5555:6666:1.2.3.4': addressIs(['invalid']),
   ':1111:2222:3333::5555:6666:7777:8888': addressIs(['invalid']),
   ':1111:2222:3333::6666:1.2.3.4': addressIs(['invalid']),
   ':1111:2222:3333::6666:7777:8888': addressIs(['invalid']),
   ':1111:2222:3333::7777:8888': addressIs(['invalid']),
   ':1111:2222:3333::8888': addressIs(['invalid']),
   ':1111:2222::': addressIs(['invalid']),
   ':1111:2222::1.2.3.4': addressIs(['invalid']),
   ':1111:2222::4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   ':1111:2222::4444:5555:6666:7777:8888': addressIs(['invalid']),
   ':1111:2222::5555': addressIs(['invalid']),
   ':1111:2222::5555:6666:1.2.3.4': addressIs(['invalid']),
   ':1111:2222::5555:6666:7777:8888': addressIs(['invalid']),
   ':1111:2222::6666:1.2.3.4': addressIs(['invalid']),
   ':1111:2222::6666:7777:8888': addressIs(['invalid']),
   ':1111:2222::7777:8888': addressIs(['invalid']),
   ':1111:2222::8888': addressIs(['invalid']),
   ':1111::': addressIs(['invalid']),
   ':1111::1.2.3.4': addressIs(['invalid']),
   ':1111::3333:4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   ':1111::3333:4444:5555:6666:7777:8888': addressIs(['invalid']),
   ':1111::4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   ':1111::4444:5555:6666:7777:8888': addressIs(['invalid']),
   ':1111::5555': addressIs(['invalid']),
   ':1111::5555:6666:1.2.3.4': addressIs(['invalid']),
   ':1111::5555:6666:7777:8888': addressIs(['invalid']),
   ':1111::6666:1.2.3.4': addressIs(['invalid']),
   ':1111::6666:7777:8888': addressIs(['invalid']),
   ':1111::7777:8888': addressIs(['invalid']),
   ':1111::8888': addressIs(['invalid']),
   ':2222:3333:4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   ':2222:3333:4444:5555:6666:7777:8888': addressIs(['invalid']),
   ':3333:4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   ':3333:4444:5555:6666:7777:8888': addressIs(['invalid']),
   ':4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   ':4444:5555:6666:7777:8888': addressIs(['invalid']),
   ':5555:6666:1.2.3.4': addressIs(['invalid']),
   ':5555:6666:7777:8888': addressIs(['invalid']),
   ':6666:1.2.3.4': addressIs(['invalid']),
   ':6666:7777:8888': addressIs(['invalid']),
   ':7777:8888': addressIs(['invalid']),
   ':8888': addressIs(['invalid']),
   '::-1': addressIs(['invalid']), // Invalid characters (but it's an integer)
   '::.': addressIs(['invalid']),
   '::..': addressIs(['invalid']),
   '::...': addressIs(['invalid']),
   '::...4': addressIs(['invalid']),
   '::..3.': addressIs(['invalid']),
   '::..3.4': addressIs(['invalid']),
   '::.2..': addressIs(['invalid']),
   '::.2.3.': addressIs(['invalid']),
   '::.2.3.4': addressIs(['invalid']),
   '::1...': addressIs(['invalid']),
   '::1.2..': addressIs(['invalid']),
   '::1.2.256.4': addressIs(['invalid']),
   '::1.2.3.': addressIs(['invalid']),
   '::1.2.3.256': addressIs(['invalid']),
   '::1.2.3.300': addressIs(['invalid']),
   '::1.2.3.900': addressIs(['invalid']),
   '::1.2.300.4': addressIs(['invalid']),
   '::1.2.900.4': addressIs(['invalid']),
   '::1.256.3.4': addressIs(['invalid']),
   '::1.300.3.4': addressIs(['invalid']),
   '::1.900.3.4': addressIs(['invalid']),
   '::1111:2222:3333:4444:5555:6666::': addressIs(['invalid']),
   '::2222:3333:4444:5555:6666:7777:1.2.3.4': addressIs(['invalid']),
   '::2222:3333:4444:5555:6666:7777:8888:': addressIs(['invalid']),
   '::2222:3333:4444:5555:6666:7777:8888:9999': addressIs(['invalid']),
   '::2222:3333:4444:5555:7777:8888::': addressIs(['invalid']),
   '::2222:3333:4444:5555:7777::8888': addressIs(['invalid']),
   '::2222:3333:4444:5555::1.2.3.4': addressIs(['invalid']),
   '::2222:3333:4444:5555::7777:8888': addressIs(['invalid']),
   '::2222:3333:4444::6666:1.2.3.4': addressIs(['invalid']),
   '::2222:3333:4444::6666:7777:8888': addressIs(['invalid']),
   '::2222:3333::5555:6666:1.2.3.4': addressIs(['invalid']),
   '::2222:3333::5555:6666:7777:8888': addressIs(['invalid']),
   '::2222::4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   '::2222::4444:5555:6666:7777:8888': addressIs(['invalid']),
   '::256.2.3.4': addressIs(['invalid']),
   '::260.2.3.4': addressIs(['invalid']),
   '::300.2.3.4': addressIs(['invalid']),
   '::300.300.300.300': addressIs(['invalid']),
   '::3000.30.30.30': addressIs(['invalid']),
   '::3333:4444:5555:6666:7777:8888:': addressIs(['invalid']),
   '::400.2.3.4': addressIs(['invalid']),
   '::4444:5555:6666:7777:8888:': addressIs(['invalid']),
   '::5555:': addressIs(['invalid']),
   '::5555:6666:7777:8888:': addressIs(['invalid']),
   '::6666:7777:8888:': addressIs(['invalid']),
   '::7777:8888:': addressIs(['invalid']),
   '::8888:': addressIs(['invalid']),
   '::900.2.3.4': addressIs(['invalid']),
   ':::': addressIs(['invalid']),
   ':::1.2.3.4': addressIs(['invalid']),
   ':::2222:3333:4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   ':::2222:3333:4444:5555:6666:7777:8888': addressIs(['invalid']),
   ':::3333:4444:5555:6666:7777:8888': addressIs(['invalid']),
   ':::4444:5555:6666:1.2.3.4': addressIs(['invalid']),
   ':::4444:5555:6666:7777:8888': addressIs(['invalid']),
   ':::5555': addressIs(['invalid']),
   ':::5555:6666:1.2.3.4': addressIs(['invalid']),
   ':::5555:6666:7777:8888': addressIs(['invalid']),
   ':::6666:1.2.3.4': addressIs(['invalid']),
   ':::6666:7777:8888': addressIs(['invalid']),
   ':::7777:8888': addressIs(['invalid']),
   ':::8888': addressIs(['invalid']),
   '::ffff:192x168.1.26': addressIs(['invalid']),
   '::ffff:2.3.4': addressIs(['invalid']),
   '::ffff:257.1.2.3': addressIs(['invalid']),
   'FF01::101::2': addressIs(['invalid']),
   'FF02:0000:0000:0000:0000:0000:0000:0000:0001': addressIs(['invalid']),
   'XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:1.2.3.4': addressIs(['invalid']),
   'XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX': addressIs(['invalid']),
   'a::b::c': addressIs(['invalid']), // Too many elisions
   'a::g': addressIs(['invalid']), // Invalid characters
   'a:a:a:a:a:a:a:a:a': addressIs(['invalid']), // Too many groups
   'a:aaaaa::': addressIs(['invalid']), // An octet with too many characters
   'a:b': addressIs(['invalid']), // Too few groups
   'a:b:c:d:e:f:g:0': addressIs(['invalid']), // Invalid characters
   'fe80:0000:0000:0000:0204:61ff:254.157.241.086': addressIs(['invalid']),
   'ffff:': addressIs(['invalid']), // One octet ending in a colon
   'ffff::ffff::ffff': addressIs(['invalid']), // Too many elisions
   'ffgg:ffff:ffff:ffff:ffff:ffff:ffff:ffff': addressIs(['invalid']), // Invalid characters in a canonical address
   'ldkfj': addressIs(['invalid']),

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
            assert.equal(a.v4_form(), '2001:db8::1:0:0.0.0.1');
            assert.equal(a.decimal(), '08193:03512:00000:00000:00001:00000:00000:00001');
            assert.equal(a.binaryZeroPad(), '0010000000000001000011011011100000000000000000000000000000000000' +
               '0000000000000001000000000000000000000000000000000000000000000001');
         }
      }
   }
}).export(module);
