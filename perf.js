const NS_PER_SEC = 1e9;

// No rewriting required
const complicatedMin = () => {
  const doc = {};
  for (var i = 0; i < 50; i++) {
    var inner = {};
    for (var j = 0; j < 100; j++) {
      inner["sovery"+j] = j + "cool";
      inner["veryso"] = 'false';
    }
    doc['hello' + i] = inner;
  }
  return doc;
};
// Rough proportins are 50/50 for keywrites and value rewrites.
const complicatedMid = () => {
  const doc = {};
  for (var i = 0; i < 50; i++) {
    var inner = {};
    for (var j = 0; j < 100; j++) {
      // The key here requires rewriting
      inner["sov!ery"+j] = j + "cool";
      // The value here requires rewriting, the key does not
      inner["veryso"] = false;
    }
    // The key here does not
    doc['hello' + i] = inner;
  }
  return doc;
};
// Every field and value needs to be rewritten
const complicatedMax = () => {
  const doc = {};
  for (var i = 0; i < 50; i++) {
    var inner = {};
    for (var j = 0; j < 100; j++) {
      inner["sov!ery"+j] = null;
      inner["v*eryso"+j] = false;
    }
    doc[i+'hello'] = inner;
  }
  return doc;
}

const ROUNDS = 10;
const BATCH = 1e3;

const DOC_MIN = complicatedMin();
const DOC_MID = complicatedMid();
const DOC_MAX = complicatedMax();

console.log('Benchmarking different approaches');
console.log(`Processing ${BATCH} times, for ${ROUNDS} rounds, over three docs`);
console.log('(ignoring the fastest and slowest batch)');

const bench = (libname) => {
  const run = (name, doc) => {
    const nanos = [];
    for (let round = 0; round < ROUNDS; round++) {
      process.stdout.write(`\r${name} ${Math.floor((round / ROUNDS) * 100)}%  `);
      const before = process.hrtime();
      for (let batch = 0; batch < BATCH; batch++) {
        lib.rewrite(doc);
      }
      const after = process.hrtime(before);
      const time = after[0] * NS_PER_SEC + after[1];
      nanos.push(time);
    }
    return nanos;
  }

  const average = nanos => {
    let max, min, count = 0;

    nanos.forEach(nano => {
      if (max === undefined || nano > max) {
        max = nano;
      }
      if (min === undefined || nano < min) {
        min = nano;
      }

      count += nano;
    })

    count = count - max - min;

    return count / (nanos.length - 2);
  }

  console.log(`===${libname}===`);
  const lib = require(libname);

  const minNanos = run(' min______ ', DOC_MIN);
  const midNanos = run(' ___mid___ ', DOC_MID);
  const maxNanos = run(' ______max ', DOC_MAX);

  process.stdout.write('\r');

  const batchMillis = nanos => Math.floor(average(nanos) / 1e6);

  console.log(`Average millis per: ${BATCH}`);
  console.log(`               MIN: ${batchMillis(minNanos)}`);
  console.log(`               MID: ${batchMillis(midNanos)}`);
  console.log(`               MAX: ${batchMillis(maxNanos)}`);
}

const check = (libname) => {
  const assert = require('assert');
  const lib = require(libname);

  const before = {
    "!foo.%": false,
    "foo": "bar",
    "fop": {
      "1bart": null,
      " ": "I'm so sorry"
    }
  }
  const after = {
    _c33_foo_c46__c37_: -9007199254740990,
    foo: 'bar',
    fop: {
      _c49_bart: -9007199254740991,
      _c32_: "I'm so sorry"
    }
  }

  try {
    assert.deepEqual(lib.rewrite(before), after);
  } catch (err) {
    console.error(`${libname} FAILED CHECK`, err);
    process.exit(-1);
  }
}

check('./rewrite.cleanest');
check('./rewrite.original');
check('./rewrite.fastest');

bench('./rewrite.cleanest');
bench('./rewrite.original');
bench('./rewrite.fastest');
