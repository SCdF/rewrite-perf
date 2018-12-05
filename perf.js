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

const ROUNDS = 3;
const DROP = 1; // TODO do this better, maybe get rid of highest and lowest instead?
const DIV = ROUNDS - DROP;
const BATCH = 1e3;

const DOC_MIN = complicatedMin();
const DOC_MID = complicatedMid();
const DOC_MAX = complicatedMax();

console.log('Benchmarking different approaches');
console.log(`Processing ${BATCH} times, for ${ROUNDS} rounds, dropping the slowest ${DROP} rounds`);

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
      if (round >= DROP) {
        nanos.push(time);
      }
    }
    return nanos;
  }

  console.log(`===${libname}===`);
  const lib = require(libname);

  const minNanos = run('>min<mid max ', DOC_MIN);
  const midNanos = run(' min>mid<max ', DOC_MID);
  const maxNanos = run(' min mid>max<', DOC_MAX);

  process.stdout.write('\r');

  const batchAverage = nanos => Math.floor(nanos.reduce((a,b) => a + b) / DIV / 1e6);

  console.log(`Average millis per ${BATCH}`);
  console.log(`                 MIN: ${batchAverage(minNanos)}`);
  console.log(`                 MID: ${batchAverage(midNanos)}`);
  console.log(`                 MAX: ${batchAverage(maxNanos)}`);
}

// bench('./rewrite.cleanest');
// bench('./rewrite.original');
bench('./rewrite.fastest');
