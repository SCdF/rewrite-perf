# Performance testing rewrite.js

I was finding it really difficult working out how to expose [rewrite.js](https://github.com/SCdF/pouchdb/blob/find-idb-next/packages/node_modules/pouchdb-adapter-indexeddb/src/rewrite.js) to testing frameworks directly, so whatever I just ripped it out and tested it directly.

A giant assumption is that this code works the same in Node.JS as it does in the browser where it's going to run.

This may be a fallacy.


```sh
node ./perf.js
```
