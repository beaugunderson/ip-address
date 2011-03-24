var FIELDS = 8;
var RE_BAD_CHARACTERS = /[^0-9a-f:\/]/;

var v6 = {};

v6.Address = function(address) {
   this.address = address;

   this.parsed_address = this.parse(address);
};

v6.Address.prototype.isValid = function() {
   return this.valid;
};

v6.Address.prototype.parse = function(address) {
   if (RE_BAD_CHARACTERS.test(address)) {
      this.valid = false;

      return;
   }

   var address_array = address.split('::');
   var quads;

   if (address_array.length == 2) {
      var first = address_array[0].split(':');
      var last = address_array[1].split(':');

      var remaining = FIELDS - (first.length + last.length);

      for (var i = 0; i < first.length; i++) {
         if (first[i] == "") {
            first[i] = 0;
         }
      }

      for (var i = 0; i < last.length; i++) {
         if (last[i] == "") {
            last[i] = 0;
         }
      }

      for (var i = 0; i < remaining; i++) {
         first.push(0);
      }

      quads = first.concat(last);
   } else if (address_array.length == 1) {
      quads = address.split(':');

      if (quads.length != 8) {
         this.valid = false;

         return;
      }
   } else {
      this.valid = false;

      return;
   }

   this.valid = true;

   return quads;
};

v6.Address.prototype.long = function() {
   if (!this.valid) {
      return;
   }

   var temp = [];

   for (var i = 0; i < this.parsed_address.length; i++) {
      temp.push(sprintf("%04x", parseInt(this.parsed_address[i], 16)));
   }

   return temp.join(':');
};

v6.Address.prototype.decimal = function() {
   if (!this.valid) {
      return;
   }

   var temp = [];

   for (var i = 0; i < this.parsed_address.length; i++) {
      temp.push(sprintf("%05d", parseInt(this.parsed_address[i], 16)));
   }

   return temp.join(':');
};

v6.Address.prototype.bigInteger = function() {
   if (!this.valid) {
      return;
   }

   var temp = [];

   for (var i = 0; i < this.parsed_address.length; i++) {
      temp.push(sprintf("%04x", parseInt(this.parsed_address[i], 16)));
   }

   var b = new BigInteger(temp.join(''), 16);

   return b;
};

var addresses = [
   "ffff:",
   "ffff::ffff::ffff",
   "ffgg:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
   "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
   "fedc:ba98:7654:3210:fedc:ba98:7654:3210",
   "2608:af09:30::102a:7b91:c239b:baff",
   "2608:af09:30:0:0:0:0:134",
   "1080:0:0:0:8:800:200c:417a",
   "1080::8:800:200c:417a",
   "0:1:2:3:4:5:6:7",
   "7:6:5:4:3:2:1:0",
   "2608::3:5",
   "ffff::3:5",
   "::1",
   "0:0:0:0:0:0:0:0",
   "::"
];

function output(t, s) {
   if (!t || s == undefined) {
      $("body").append("<p>&nbsp;</p>");

      return;
   }

   $("body").append(sprintf("<p><span>%s:</span> %s</p>", t, s));
}

$(function() {
   for (var i = 0; i < addresses.length; i++) {
      var address = new v6.Address(addresses[i]);

      output("input address", address.address);
      output("valid", address.isValid());

      if (address.isValid()) {
         output("parsed address", address.parsed_address.join(':'));
         output("long", address.long());
         output("decimal", address.decimal());

         output("hex BigInteger", address.bigInteger().toString(16));
         output("dec BigInteger", address.bigInteger().toString());
      }

      output();
   }
});
