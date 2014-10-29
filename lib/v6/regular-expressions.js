'use strict';

var sprintf = require('sprintf').sprintf;

var v6 = require('./constants.js');

function simpleRegularExpression(addressArray) {
  var output = [];
  var i;

  for (i = 0; i < addressArray.length; i++) {
    var segment = addressArray[i];

    if (segment.length < 4) {
      output.push(sprintf('0{0,%d}%s', 4 - segment.length, segment));
    } else {
      output.push(segment);
    }
  }

  return output.join(':');
}

function possibleElisions(elidedGroups, moreLeft, moreRight) {
  // There are five possible cases

  var possibilities = [];

  // 1. elision of everything (::)
  if (!moreLeft && !moreRight) {
    possibilities.push('::');
  }

  if (moreLeft && !moreRight ||
      !moreLeft && moreRight) {
    possibilities.push(':');
  }

  if (moreLeft && moreRight) {
    possibilities.push('');
  }

  var left = ':';
  var right = ':';

  if (moreLeft) {
    left = '';
  }

  if (moreRight) {
    right = '';
  }

  // 2. no elision
  possibilities.push(sprintf('(0{1,4}:){%d}0{1,4}', elidedGroups - 1));

  // 3. elision from the left side
  possibilities.push(sprintf('%s(:0{1,4}){1,%d}', left, elidedGroups - 1));

  // 4. elision from the right side
  possibilities.push(sprintf('(0{1,4}:){1,%d}%s', elidedGroups - 1, right));

  // 5. elision from the middle
  // TODO

  return sprintf('(%s)', possibilities.join('|'));
}

/*
 * Generate a regular expression string that can be used to find or validate all
 * variations of this address.
 */
module.exports.regularExpressionString = function (optionalSubString) {
  if (optionalSubString === undefined) {
    optionalSubString = false;
  }

  var output = [];

  function add(piece) {
    if (Array.isArray(piece)) {
      output = output.concat(piece);
    } else {
      output.push(piece);
    }
  }

  var address6 = new this.constructor(this.correctForm());

  if (address6.elidedGroups === 0) {
    // The simple case
    add(simpleRegularExpression(address6.parsedAddress));
  } else if (address6.elidedGroups === v6.GROUPS) {
    // A completely elided address
    add(possibleElisions(v6.GROUPS));
  } else {
    // A partially elided address
    var halves = address6.address.split('::');

    if (halves[0].length) {
      add(simpleRegularExpression(halves[0].split(':')));
    }

    add(possibleElisions(address6.elidedGroups,
                         halves[0].length !== 0,
                         halves[1].length !== 0));

    if (halves[1].length) {
      add(simpleRegularExpression(halves[1].split(':')));
    }

    output = [output.join(':')];
  }

  if (!optionalSubString) {
    output = [].concat('(^|[^\\w\\:])(', output, ')([^\\w\\:]|$)');
  }

  return output.join('');
};

/*
 * Generate a regular expression that can be used to find or validate all
 * variations of this address.
 */
module.exports.regularExpression = function () {
  return new RegExp(this.regularExpressionString(), 'i');
};
