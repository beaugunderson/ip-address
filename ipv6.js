if (typeof exports !== 'undefined') {
   var sprintf = require('sprintf').sprintf,
       BigInteger = require('./lib/node/bigint').BigInteger;
}

var v6 = this.v6 = {};
var v4 = this.v4 = {};

v6.GROUPS = 8;
v4.GROUPS = 4;

v6.RE_V4 = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/g;

v6.RE_BAD_CHARACTERS = /([^0-9a-f:\/%])/ig;
v6.RE_BAD_ADDRESS = /([0-9a-f]{5,}|:{3,}|[^:]:)$/ig;

v6.RE_SUBNET_STRING = /\/\d{1,3}/;
v6.RE_PERCENT_STRING = /%.*$/;

function map(array, f) {
   var results = [];

   for (var i = 0; i < array.length; i++) {
      results.push(f(array[i], i));
   }

   return results;
};

v4.Address = function(address) {
   this.address = address;
   this.groups = v4.GROUPS;
   this.parsed_address = this.parse(address);
};

v4.Address.prototype.parse = function(address) {
   var groups = address.split('.');

   return groups;
};

v4.Address.prototype.toHex = function() {
   var output = [];

   for (var i = 0; i < v4.GROUPS; i += 2) {
      var hex = sprintf('%02x%02x',
         parseInt(this.parsed_address[i], 10),
         parseInt(this.parsed_address[i + 1], 10));

      output.push(sprintf('%x', parseInt(hex, 16)));
   }

   return output.join(':');
}

v4.Address.fromHex = function(hex) {
   var padded = String("00000000" + hex.replace(/:/g, '')).slice(-8);

   var groups = [];

   for (var i = 0; i < 8; i += 2) {
      var h = padded.slice(i, i + 2);

      groups.push(parseInt(h, 16));
   }

   return new v4.Address(groups.join('.'));
};

v6.Address = function(address, groups) {
   this.address = address;

   if (groups == undefined) {
      this.groups = v6.GROUPS;
   } else {
      this.groups = groups;
   }

   this.subnet_string = '';
   this.percent_string = '';
   this.error = '';

   this.parsed_address = this.parse(address);

   this.correct = address == this.correct_form();
   this.canonical = address == this.canonical_form();
};

v6.Address.compact = function(address, slice) {
   var s1 = [];
   var s2 = [];

   for (var i = 0; i < address.length; i++) {
      if (i < slice[0]) {
         s1.push(address[i]);
      } else if (i > slice[1]) {
         s2.push(address[i]);
      }
   }

   return s1.concat(['compact']).concat(s2);
};

v6.Address.prototype.isValid = function() {
   return this.valid;
};

v6.Address.prototype.isCorrect = function() {
   return this.correct;
};

v6.Address.prototype.isCanonical = function() {
   return this.canonical;
};

v6.Address.prototype.isTeredo = function() {
   if (/2001:0000/.test(this.canonical_form())) {
      return true;
   }

   return false;
};

function spanLeadingZeroesInner(group) {
   return group.replace(/^(0+)/, '<span class="zero">$1</span>');
}

v6.Address.spanLeadingZeroes = function(address) {
   var groups = address.split(':');

   groups = $.map(groups, function(g, i) {
      return spanLeadingZeroesInner(g);
   });

   return groups.join(':');
};

v6.Address.simpleGroup = function(addressString, offset) {
   var groups = addressString.split(':');

   if (!offset) {
      offset = 0;
   }

   groups = map(groups, function(g, i) {
      if (/group-v4/.test(g)) {
         return g;
      }

      return sprintf('<span class="hover-group group-%d">%s</span>', i + offset,
         spanLeadingZeroesInner(g));
   });

   return groups.join(':');
};

v6.Address.group = function(addressString) {
   var address = new v6.Address(addressString);
   var v4_address = address.address.match(v6.RE_V4);

   // The IPv4 case
   if (v4_address) {
      var segments = v4_address[0].split('.');

      address.address = address.address.replace(v6.RE_V4, sprintf('<span class="hover-group group-v4 group-6">%s</span>' +
         '.' +
         '<span class="hover-group group-v4 group-7">%s</span>',
         segments.slice(0, 2).join('.'),
         segments.slice(2, 4).join('.')));
   }

   if (address.elided_groups == 0) {
      // The simple case
      return v6.Address.simpleGroup(address.address);
   } else {
      // The elided case
      var output = [];

      var halves = address.address.split('::');

      if (halves[0].length) {
         output.push(v6.Address.simpleGroup(halves[0]));
      } else {
         output.push('');
      }

      var classes = ['hover-group'];

      for (var i = address.elision_begin; i < address.elision_begin + address.elided_groups; i++) {
         classes.push(sprintf('group-%d', i));
      }

      output.push(sprintf('<span class="%s"></span>', classes.join(' ')));

      if (halves[1].length) {
         output.push(v6.Address.simpleGroup(halves[1], address.elision_end));
      } else {
         output.push('');
      }

      return output.join(':');
   }
};

v6.Address.prototype.correct_form = function() {
   if (!this.parsed_address) {
      return;
   }

   var groups = [];

   var zero_counter = 0;
   var zeroes = [];

   var last_value = null;

   for (var i = 0; i < this.parsed_address.length; i++) {
      var value = parseInt(this.parsed_address[i], 16);

      if (value === 0) {
         zero_counter++;
      }

      if (value !== 0 && zero_counter > 0) {
         if (zero_counter > 1) {
            zeroes.push([i - zero_counter, i - 1]);
         }

         zero_counter = 0;
      }

      last_value = value;
   }

   // Do we end with a string of zeroes?
   if (zero_counter > 1) {
      zeroes.push([this.parsed_address.length - zero_counter, this.parsed_address.length - 1]);
   }

   var zero_lengths = map(zeroes, function(n) {
      return (n[1] - n[0]) + 1;
   });

   last_value = null;
   var different = false;

   if (zeroes.length > 0) {
      var max = Math.max.apply(Math, zero_lengths);
      var index = zero_lengths.indexOf(max);

      groups = v6.Address.compact(this.parsed_address, zeroes[index]);
   } else {
      groups = this.parsed_address;
   }

   for (var i = 0; i < groups.length; i++) {
      if (groups[i] != 'compact') {
         groups[i] = parseInt(groups[i], 16).toString(16);
      }
   }

   var correct = groups.join(':');

   correct = correct.replace(/^compact$/, '::');
   correct = correct.replace(/^compact|compact$/, ':');
   correct = correct.replace(/compact/, '');

   return correct;
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
   var subnet_string = v6.RE_SUBNET_STRING.exec(address);

   if (subnet_string) {
      this.subnet_mask = parseInt(subnet_string[0].replace('/', ''));
      this.subnet_string = subnet_string[0];

      if (this.subnet_mask < 0 || this.subnet_mask > 128) {
         this.valid = false;
         this.error = "Invalid subnet mask.";

         return;
      }

      address = address.replace(v6.RE_SUBNET_STRING, '');
   }

   var percent_string = v6.RE_PERCENT_STRING.exec(address);

   if (percent_string) {
      this.percent_string = percent_string[0];

      address = address.replace(v6.RE_PERCENT_STRING, '');
   }

   var v4_address = address.match(v6.RE_V4);

   if (v4_address) {
      var v4_temp = new v4.Address(v4_address[0]);

      address = address.replace(v6.RE_V4, v4_temp.toHex());
   }

   var bad_characters = address.match(v6.RE_BAD_CHARACTERS);

   if (bad_characters) {
      this.valid = false;
      this.error = sprintf("Bad character%s detected in address: %s", bad_characters.length > 1 ? 's' : '', bad_characters.join(''));

      this.parse_error = address.replace(v6.RE_BAD_CHARACTERS, sprintf('<span class="parse-error">$1</span>'));

      return;
   }

   var bad_regex = address.match(v6.RE_BAD_ADDRESS);

   if (bad_regex) {
      this.valid = false;
      this.error = sprintf("Address failed regex: %s", bad_regex.join(''));

      this.parse_error = address.replace(v6.RE_BAD_ADDRESS, sprintf('<span class="parse-error">$1</span>'));

      return;
   }

   var groups = [];

   var address_array = address.split('::');

   if (address_array.length == 2) {
      var first = address_array[0].split(':');
      var last = address_array[1].split(':');

      if (first.length == 1 &&
         first[0] == '') {
         first = [];
      }

      if (last.length == 1 &&
         last[0] == '') {
         last = [];
      }

      var remaining = this.groups - (first.length + last.length);

      if (!remaining) {
         this.valid = false;
         this.error = "Error parsing groups";

         return;
      }

      this.elided_groups = remaining;

      this.elision_begin = first.length;
      this.elision_end = first.length + this.elided_groups;

      for (var i = 0; i < first.length; i++) {
         groups.push(first[i]);
      }

      for (var i = 0; i < remaining; i++) {
         groups.push(0);
      }

      for (var i = 0; i < last.length; i++) {
         groups.push(last[i]);
      }
   } else if (address_array.length == 1) {
      groups = address.split(':');

      this.elided_groups = 0;
   } else {
      this.valid = false;
      this.error = "Too many :: groups found";

      return;
   }

   groups = map(groups, function(g) {
      return sprintf('%x', parseInt(g, 16));
   });

   if (groups.length != this.groups) {
      this.valid = false;
      this.error = "Incorrect number of groups found";

      return;
   }

   for (var i = 0; i < groups.length; i++) {
      if (groups[i].length > 4 && !v4_address) {
         this.valid = false;
         this.error = sprintf("Group %d is too long", i + 1);

         return;
      }
   }

   this.valid = true;

   return groups;
};

v6.Address.prototype.canonical_form = function() {
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

v6.Address.prototype.v4_form = function() {
   var s = this.zeroPad().split('');

   var v4_address = v4.Address.fromHex(new BigInteger(s.slice(96, 128).join(''), 2).toString(16));
   var v6_address = new v6.Address(this.parsed_address.slice(0, 6).join(':'), 6);

   var c = v6_address.correct_form();

   var infix = '';

   if (!/:$/.test(c)) {
      infix = ':';
   }

   return v6_address.correct_form() + infix + v4_address.address;
};

v6.Address.prototype.teredo = function() {
   var s = this.zeroPad().split('');

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
      server_v4: server_v4.address,
      client_v4: client_v4_ip.address,
      flags: flags.join(''),
      udp_port: udp_port_dec
   };
};
