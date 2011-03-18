var FIELDS = 8;

function parseAddress(address) {
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
         return false;
      }
   } else {
      return false;
   }

   return quads;
}

function longRepresentation(address) {
   var temp = [];

   for (var i = 0; i < address.length; i++) {
      temp.push(sprintf("%04x", parseInt(address[i], 16)));
   }

   return temp.join(':');
}

function decimalRepresentation(address) {
   var temp = [];

   for (var i = 0; i < address.length; i++) {
      temp.push(sprintf("%05d", parseInt(address[i], 16)));
   }

   return temp.join(':');
}

function bigInteger(address) {
   var temp = [];

   for (var i = 0; i < address.length; i++) {
      temp.push(sprintf("%04x", parseInt(address[i], 16)));
   }

   console.log(temp.join(''));

   var b = new BigInteger(temp.join(''), 16);

   return b;
}

var addresses = [
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

for (var i = 0; i < addresses.length; i++) {
   var address = parseAddress(addresses[i]);

   console.log(address, address.length);
   console.log(longRepresentation(address));
   console.log(decimalRepresentation(address));

   var b = bigInteger(address);

   console.log(b.toString(16), b);
   console.log(b.toString(), b);
}
