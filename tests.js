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
   "ffff::",
   "ffff:",
   "ffff::ffff::ffff",
   "ffgg:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
   "0:0:0:0:1:0:0:0",
   "2608:af09:30::102a:7b91:c239b:baff",
   "2001:db8:0:0:1:0:0:1",
   "2001:0db8:0:0:1:0:0:1",
   "2001:db8::1:0:0:1",
   "2001:db8::0:1:0:0:1",
   "2001:0db8::1:0:0:1",
   "2001:db8:0:0:1::1",
   "2001:db8:0000:0:1::1",
   "2001:DB8:0:0:1::1"
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
         output("correct form", address.correct_form());
         output("canonical", address.canonical_form());
         output("decimal", address.decimal());

         output("hex BigInteger", address.bigInteger().toString(16));
         output("dec BigInteger", address.bigInteger().toString());
         output("bin BigInteger", address.zeroPad());

         if (address.isTeredo()) {
            output("teredo decode", JSON.stringify(address.teredo(), '', 1));
         }
      }

      output();
   }
});
