# Fortune Firestore Adapter

[![Build Status](https://img.shields.io/travis/com/wandertext/fortune-firestore)](https://travis-ci.com/wandertext/fortune-firestore)
[![npm Version](https://img.shields.io/npm/v/fortune-firestore)](https://www.npmjs.com/package/fortune-firestore)
[![License](https://img.shields.io/github/license/wandertext/fortune-firestore)](https://raw.githubusercontent.com/wandertext/fortune-firestore/master/LICENSE)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

This is a [Firestore](https://cloud.google.com/firestore/) adapter for
[Fortune](http://fortune.js.org/). It uses Google’s [official Node.js client
for Google Cloud Firestore](https://github.com/googleapis/nodejs-firestore).

It is ported from
[fortunejs/mongodb](https://github.com/fortunejs/fortune-mongodb) and
incoporates some design ideas from the third-party [Google Cloud
Datastore](https://github.com/patrinhani-ciandt/fortune-datastore) adapter.


## Usage

Install the `fortune-firestore` package with `yarn` or `npm`:

```
$ yarn add fortune-firestore
```

```
$ npm install fortune-firestore
```

Then use it with Fortune:

```js
import fortune from "fortune";
import firestoreAdapter from "fortune-firestore";

const store = fortune({ ... }, {
  adapter: [
    firestoreAdapter,
    {
			projectId: "my firebase/google cloud project id",
			keyFilename: "",
			namespace: "fortune-adapter-test"
    }
  ]
});
```


## Options

**Adapter options**:

TK.

## License

This software is licensed under the [MIT License](//github.com/wandertext/fortune-firestore/blob/master/LICENSE).
