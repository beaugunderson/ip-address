diff_match_patch.prototype.diff_ourHtml = function(diffs) {
   var html = [];
   var i = 0;

   var pattern_amp = /&/g;
   var pattern_lt = /</g;
   var pattern_gt = />/g;
   var pattern_para = /\n/g;

   for (var x = 0; x < diffs.length; x++) {
      var op = diffs[x][0];    // Operation (insert, delete, equal)
      var data = diffs[x][1];  // Text of change.
      var text = data.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;')
      .replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');

      switch (op) {
         case DIFF_INSERT:
            html[x] = '<ins class="diff">' + text + '</ins>';
            break;
         case DIFF_DELETE:
            html[x] = '<del class="diff">' + text + '</del>';
            break;
         case DIFF_EQUAL:
            html[x] = '<span class="diff">' + text + '</span>';
            break;
      }

      if (op !== DIFF_DELETE) {
         i += data.length;
      }
   }

   return html.join('');
};

function update_address() {
   var o = $('#address').val();
   var a = new v6.Address(o);

   if (a.isValid()) {
      $('#valid').text('true');
      $('#correct').text(a.isCorrect());
      $('#canonical').text(a.isCanonical());

      $('#original').text(o);

      var p = a.parsed_address.join(':');
      var p2 = diff(o, p);

      $('#parsed').html(p2);

      var co = a.correct_form();
      var co2 = diff(o, co);

      $('#correct-form').html(co2);

      var ca = a.canonical_form();
      var ca2 = diff(o, ca);

      $('#canonical-form').html(ca2);

      $('#ipv4-form').text(a.v4_form());

      $('#decimal-groups').text(a.decimal());
      $('#base-16').text(a.bigInteger().toString(16));
      $('#base-10').text(a.bigInteger().toString());

      var z = [a.zeroPad().slice(0, 64), a.zeroPad().slice(64,128)];

      $('#base-2').html(z.join('<br />'));

      if (a.isTeredo()) {
         $('#teredo').text(JSON.stringify(a.teredo(), '', 3));
      } else {
         $('#teredo').text('Not a Teredo address.');
      }

      $.getJSON('/arin/ip/' + a.correct_form(), function(data) {
         $('#arin').text(JSON.stringify(data, '', 3));
      });
   } else {
      $('.output').text('');

      $('#valid').text('false');
   }

   update_diff();
   update_arin();
}

function diff(a, b) {
   var dmp = new diff_match_patch();

   var d = dmp.diff_main(a, b);

   return dmp.diff_ourHtml(d);
}

function set_address(address) {
   $('#address').val(address);

   update_address();

   return false;
}

function update_arin() {
   if ($('#show-arin').is(':checked')) {
      $('.arin').show()
   } else {
      $('.arin').hide()
   }
}

function update_diff() {
   if ($('#show-diff').is(':checked')) {
      $('ins.diff').addClass('visible');
      $('del.diff').show();
   } else {
      $('ins.diff').removeClass('visible');
      $('del.diff').hide();
   }
}

$(function() {
   update_arin();

   $('#show-arin').click(function() {
      update_arin();
   });

   $('#show-diff').click(function() {
      update_diff();
   });

   $('#correct-example').click(function() {
      return set_address('2608::3:5');
   });

   $('#canonical-example').click(function() {
      return set_address('000a:000b:000c:000d:0000:0000:0000:0000');
   });

   $('#teredo-example').click(function() {
      return set_address('2001::ce49:7601:e866:efff:62c3:fffe');
   });

   $('#address').keyup(function() {
      update_address();
   });
});
