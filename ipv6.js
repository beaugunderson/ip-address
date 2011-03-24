var FIELDS = 8;
var RE_BAD_CHARACTERS = /[^0-9a-f:\/]/i;

var v6 = {};
var v4 = {};

v4.Address = function(address) {

};

v4.Address.fromHex = function(hex) {
   var padded = String("00000000" + hex).slice(-8);

   var ip = [];

   for (var i = 0; i < 8; i += 2) {
      var h = padded.slice(i, i + 2);

      ip.push(parseInt(h, 16));
   }

   return ip.join('.');
};

v6.Address = function(address) {
   this.address = address;

   this.parsed_address = this.parse(address);
};

v6.Address.prototype.isValid = function() {
   return this.valid;
};

v6.Address.prototype.zeroPad = function() {
   var s = this.bigInteger().toString(2);

   return String(
      "0000000000000000" +
      "0000000000000000" +
      "0000000000000000" +
      "0000000000000000" +
      "0000000000000000" +
      "0000000000000000" +
      "0000000000000000" +
      "0000000000000000" + s).slice(-128);
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

   for (var i = 0; i < quads.length; i++) {
      if (quads[i].length > 4) {
         this.valid = false;

         return;
      }
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

v6.Address.prototype.teredo = function() {
   var s = this.zeroPad().split('');

   var b = $.map(this.zeroPad().split(''), function(i) {
      return parseInt(i);
   });

   /*
      - Bits 0 to 31 are set to the Teredo prefix (normally 2001:0000::/32).
      - Bits 32 to 63 embed the primary IPv4 address of the Teredo server that is used.
      - Bits 64 to 79 can be used to define some flags. Currently only the higher order bit is used; it is set to 1 if the Teredo client is located behind a cone NAT, 0 otherwise. For Microsoft's Windows Vista and Windows Server 2008 implementations, more bits are used. In those implementations, the format for these 16 bits is "CRAAAAUG AAAAAAAA", where "C" remains the "Cone" flag. The "R" bit is reserved for future use. The "U" bit is for the Universal/Local flag (set to 0). The "G" bit is Individual/Group flag (set to 0). The A bits are set to a 12-bit randomly generated number chosen by the Teredo client to introduce additional protection for the Teredo node against IPv6-based scanning attacks.
      - Bits 80 to 95 contains the obfuscated UDP port number. This is the port number that is mapped by the NAT to the Teredo client with all bits inverted.
      - Bits 96 to 127 contains the obfuscated IPv4 address. This is the public IPv4 address of the NAT with all bits inverted.
   */

   var prefix = String("00000000" + new BigInteger(s.slice(0, 32).join(''), 2).toString(16)).slice(-8);
   var server_v4 = v4.Address.fromHex(new BigInteger(s.slice(32, 64).join(''), 2).toString(16));

   var flags = s.slice(64, 80);
   var udp_port = new BigInteger(s.slice(80, 96).join(''), 2);

   var udp_port_dec = udp_port.xor(new BigInteger('ffff', 16)).toString();

   var client_v4 = new BigInteger(s.slice(96, 128).join(''), 2);
   var client_v4_ip = v4.Address.fromHex(client_v4.xor(new BigInteger('ffffffff', 16)).toString(16));

   return {
      prefix: sprintf('%s:%s', prefix.slice(0, 4), prefix.slice(4, 8)),
      server_v4: server_v4,
      flags: flags.join(''),
      udp_port: udp_port_dec,
      client_v4: client_v4_ip
   };
}

var addresses = [
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
   "ffff:",
   "ffff::ffff::ffff",
   "ffgg:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
   "2608:af09:30::102a:7b91:c239b:baff"
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
         output("bin BigInteger", address.zeroPad());

         if (/2001:0000/.test(address.long())) {
            output("teredo decode", JSON.stringify(address.teredo(), '', 1));
         }
      }

      output();
   }
});
