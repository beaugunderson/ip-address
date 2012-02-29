var fs = require('fs'),
    vows = require('vows'),
    assert = require('assert');

var v6 = require('../ipv6').v6,
    BigInteger = require('../lib/node/bigint');

/* Fails if the generated regular expression doesn't validate */
function assertCanonicalFormValidatesRegEx() {
   return function(e, address) {
      var re = address.regularExpression();

      console.log(address.canonicalForm(), address.regularExpressionString());

      assert.isTrue(re.test(address.canonicalForm()));
   }
}

/* Fails if the generated regular expression doesn't validate */
function assertCorrectFormValidatesRegEx() {
   return function(e, address) {
      var re = address.regularExpression();

      console.log(address.correctForm(), address.regularExpressionString());

      assert.isTrue(re.test(address.correctForm()));
   }
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

/* Fails if the address is not canonical */
function assertIsCanonical() {
   return function(e, address) {
      assert.isTrue(address.isCanonical());
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
      assert.equal(address.parsedAddress.length, 8);

      assert.isTrue(address.isValid());
   };
}

/* Fails if the address is not v4 */
function assertIsIPv4() {
   return function(e, address) {
      assert.isTrue(address.is4());
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

         // TODO: These aren't quite ready for primetime yet.
         //context['should validate canonical form via regex'] = assertCanonicalFormValidatesRegEx();
         //context['should validate correct form via regex'] = assertCorrectFormValidatesRegEx();
      }

      if (descriptor == 'invalid') {
         context['should not validate'] = assertIsInvalid();
      }

      if (descriptor == 'canonical') {
         context['is canonical'] = assertIsCanonical();
      }

      if (descriptor == 'correct') {
         context['is correct'] = assertIsCorrect();
      }

      if (descriptor == 'incorrect') {
         context['is incorrect'] = assertIsIncorrect();
      }

      if (descriptor == 'ipv4') {
         context['is an ipv4-in-ipv6 address'] = assertIsIPv4();
      }
   }

   return context;
}

function loadJsonBatch(file, classes) {
   // Load the list of test addresses
   var data = fs.readFileSync(file);
   var json = JSON.parse(data);

   var batch = {};

   for (var key in json.addresses) {
      var address = json.addresses[key];

      if (address.conditions === undefined ||
         !address.conditions.length) {
         address.conditions = classes;
      } else {
         address.conditions = address.conditions.concat(classes);
      }

      batch[key] = addressIs(address.conditions);
   }

   return batch;
}

vows.describe('v6.Address - Good and bad addresses')
   .addBatch(loadJsonBatch('test/ipv6-good.json', ['valid']))
   .addBatch(loadJsonBatch('test/ipv6-bad.json', ['invalid']))
      .export(module);
