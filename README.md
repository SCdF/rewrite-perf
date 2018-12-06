# Performance testing rewrite.js

I was finding it really difficult working out how to expose [rewrite.js](https://github.com/SCdF/pouchdb/blob/find-idb-next/packages/node_modules/pouchdb-adapter-indexeddb/src/rewrite.js) to testing frameworks directly, so whatever I just ripped it out and tested it directly.

A giant assumption is that this code works the same in Node.JS as it does in the browser where it's going to run.

This may be a fallacy.

```sh
scdf at SCdF in ~/Code/SCdF/rewrite-perf on master▲
$ time node perf.js
Benchmarking different approaches
Processing 1000 times, for 10 rounds, over three docs
(ignoring the fastest and slowest batch)
===./rewrite.cleanest===
Average millis per: 1000
               MIN: 1754
               MID: 6431
               MAX: 11721
===./rewrite.original===
Average millis per: 1000
               MIN: 1925
               MID: 4765
               MAX: 9625
===./rewrite.fastest===
Average millis per: 1000
               MIN: 1420
               MID: 4278
               MAX: 8469

real    8m26.385s
user    8m1.971s
sys     0m5.599s
```
