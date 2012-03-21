var fs = require('fs'),
    should = require('should');

var v6 = require('../ipv6').v6,
    BigInteger = require('../lib/node/bigint');

function addressIs(addressString, descriptors) {
   var address = new v6.Address(addressString);

   describe(addressString, function() {
      descriptors.forEach(function(descriptor) {
         if (descriptor === 'valid') {
            it('is valid', function() {
               address.should.be.a('object');
               address.parsedAddress.should.be.an.instanceof(Array);

               should.equal(address.parsedAddress.length, 8);

               address.isValid().should.be.true;
            });

            // TODO: These aren't quite ready for primetime yet.
            /*
            it('validates the correct form via regex', function() {
               var re = address.regularExpression();

               re.test(address.correctForm()).should.be.true;
            });

            it('validates the canonical form via regex', function() {
               var re = address.regularExpression();

               re.test(address.canonicalForm()).should.be.true;
            });
            */
         }

         if (descriptor === 'invalid') {
            it('is invalid', function() {
               address.error.should.be.a('string');

               address.isValid().should.be.false;
            });
         }

         if (descriptor === 'canonical') {
            it('is canonical', function() {
               address.isCanonical().should.be.true;

               should.equal(address.addressMinusSuffix.length, 39);
            });
         }

         if (descriptor === 'correct') {
            it('is correct', function() {
               address.isCorrect().should.be.true;
            });
         }

         if (descriptor === 'incorrect') {
            it('is incorrect', function() {
               address.isCorrect().should.be.false;
            });
         }

         if (descriptor === 'ipv4') {
            it('is an ipv4-in-ipv6 address', function() {
               address.is4().should.be.true;
            });
         }
      });
   });
}

function loadJsonBatch(file, classes) {
   // Load the list of test addresses
   var data = fs.readFileSync(file);
   var addresses = JSON.parse(data);

   addresses.forEach(function(address) {
      if (address.conditions === undefined ||
         !address.conditions.length) {
         address.conditions = classes;
      } else {
         address.conditions = address.conditions.concat(classes);
      }

      addressIs(address.address, address.conditions);
   });
}

loadJsonBatch('test/ipv6-good.json', ['valid']);
loadJsonBatch('test/ipv6-bad.json', ['invalid']);
