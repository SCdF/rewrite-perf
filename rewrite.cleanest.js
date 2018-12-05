'use strict';

var IDB_NULL = Number.MIN_SAFE_INTEGER;
var IDB_FALSE = Number.MIN_SAFE_INTEGER + 1;
var IDB_TRUE = Number.MIN_SAFE_INTEGER + 2;

//
// IndexedDB only allows valid JS names in its index paths, whereas JSON allows
// for any string at all. This converts invalid JS names to valid ones, to allow
// for them to be indexed.
//
// For example, "foo-bar" is a valid JSON key, but cannot be a valid JS name
// (because that would be read as foo minus bar).
//
// Very high level rules for valid JS names are:
//  - First character cannot start with a number
//  - Otherwise all characters must be be a-z, A-Z, 0-9, $ or _.
//  - We allow . unless the name represents a single field, as that represents
//    a deep index path.
//
// This is more aggressive than it needs to be, but also simpler.
//
// There are more complete solutions available, such as using:
//
//   https://mothereff.in/js-variables
//
// As a base to properly validate, but it's very complicated and would only be
// worth looking into if act of rewriting slowed things down and we wanted to
// reduce the instances in which the `bad` var below is hit.
//

// Additional regex notes over the above comment:
//  - MULTI_INVALID needs the \. detection at the front so it captures it correctly
//  - Apart from that they are the same RegExp, except that . is valid in MULTI_INVALID
//    (except for if preceeded by \ or at the start)
var SINGLE_INVALID =   /[^a-zA-Z0-9_$]+|(^[^a-zA-Z_$])/g
var MULTI_INVALID = /(\\\.)|[^a-zA-Z0-9_$\.]+|(^[^a-zA-Z_$])/g

var correctCharacters = function(match) {
  var good = '';
  for (var i = 0; i < match.length; i++) {
    good += '_c' + match.charCodeAt(i) + '_';
  }
  return good;
}

function sanitise(name, singleField) {
  if (singleField) {
    return name.replace(SINGLE_INVALID, correctCharacters);
  } else {
    return name.replace(MULTI_INVALID, correctCharacters);
  }
}

function rewrite(data) {
  var isArray = Array.isArray(data);
  var clone = isArray
    ? []
    : {};

  Object.keys(data).forEach(function (key) {
    var safeKey = isArray ? key : sanitise(key, true);

    if (data[key] === null) {
      clone[safeKey] = IDB_NULL;
    } else if (typeof data[key] === 'boolean') {
      clone[safeKey] = data[key] ? IDB_TRUE : IDB_FALSE;
    } else if (typeof data[key] === 'object') {
      clone[safeKey] = rewrite(data[key]);
    } else {
      clone[safeKey] = data[key];
    }
  });

  return clone;
}

module.exports = {
  rewrite: rewrite,
  sanitise: sanitise
};
