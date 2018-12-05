'use strict';

var IDB_NULL = Number.MIN_SAFE_INTEGER;
var IDB_FALSE = Number.MIN_SAFE_INTEGER + 1;
var IDB_TRUE = Number.MIN_SAFE_INTEGER + 2;

var ALLOWABLE_SINGLE_FIELD = ['_', '$'];
var ALLOWABLE = ALLOWABLE_SINGLE_FIELD.concat(['.']);

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
// This can almost certainly be performance tuned.
//
function sanitise(name, singleField) {
  var sanitised = '';
  var substringStart = 0;
  var nextBad = false;

  var allowable = singleField ? ALLOWABLE_SINGLE_FIELD :  ALLOWABLE;

  for (var i = 0; i < name.length; i++) {
    var c = name[i];
    var bad = nextBad;
    nextBad = false;

    if (!bad) {
      if (!singleField && c === '\\') {
        nextBad = true;
      } else if (i === 0 && c >= '0' && c <= '9') {
        bad = true;
      } else if (!((c >= '0' && c <= '9') ||
                   (c >= 'a' && c <= 'z') ||
                   (c >= 'A' && c <= 'Z') ||
                    allowable.includes(c))) {
        bad = true;
      }
    }

    if (bad || nextBad) {
      sanitised += name.substring(substringStart, i);
      if (bad) {
        sanitised += '_c' + c.charCodeAt(0) + '_';
      }
      substringStart = i + 1;
    }
  }

  if (sanitised && substringStart !== name.length) {
    sanitised += name.substring(substringStart);
  }

  return sanitised || name;
}

// TODO: this can almost certainly be performance tuned.
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
