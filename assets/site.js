/* global anchors */

// add anchor links to headers
anchors.options.placement = 'left';
anchors.add();

// Filter UI
var tocElements = document.getElementById('toc').getElementsByTagName('a');
document.getElementById('filter-input').addEventListener('keyup', function(e) {

  // enter key
  if (e.keyCode === 13) {
    // go to the first displayed item in the toc
    for (var i = 0; i < tocElements.length; i++) {
      var element = tocElements[i];
      if (!element.classList.contains('hide')) {
        location.replace(element.href);
        return e.preventDefault();
      }
    }
  }

  var match = function() { return true; },
    value = this.value.toLowerCase();

  if (!value.match(/^\s*$/)) {
    match = function(text) { return text.toLowerCase().indexOf(value) !== -1; };
  }

  for (var i = 0; i < tocElements.length; i++) {
    var element = tocElements[i];
    if (match(element.innerHTML)) {
      element.classList.remove('hide');
    } else {
      element.classList.add('hide');
    }
  }
});
