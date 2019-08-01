# Fortune Firestore Adapter

This is a [Firestore](https://cloud.google.com/firestore/) adapter for
[Fortune](http://fortune.js.org/). It uses Google’s [official Node.js client
for Google Cloud Firestore](https://github.com/googleapis/nodejs-firestore).

It is forked from
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
