# Fortune Firestore Adapter

[![Build Status](https://img.shields.io/travis/com/muziejus/fortune-firestore)](https://travis-ci.com/muziejus/fortune-firestore)
[![npm Version](https://img.shields.io/npm/v/fortune-firestore)](https://www.npmjs.com/package/fortune-firestore)
[![License](https://img.shields.io/github/license/muziejus/fortune-firestore)](https://raw.githubusercontent.com/muziejus/fortune-firestore/master/LICENSE)
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
    { // options
      projectId: "my firebase/google cloud project id",
      keyFilename: "path/to/some/keyFile.json",
      credentials: {
        client_email:
        "some-email-from-google@project-id.iam.gserviceaccount.com",
        private_key: "some long private key"
      }
    }
  ]
});
```

## Connecting to Firestore

For the adapter to connect to Firestore, as it’s implemented, one of the
following three combinations of options must be present, as above:

1. `keyFilename` as a JSON file.
1. `projectId`, `credentials.client_email`, and `credentials.private_key`, as
   likely harvested from the keyFile.
3. `keyFilename` as .pem or .p12 file, `projectId`, and
   `credentials.client_email`

### Getting a keyFile

Both Firebase and Google Cloud Platform use the GCP interface to manage
service accounts, so you should log in to the [GCP
console](https://console.cloud.google.com).

1. Select the appropriate project for the adapter.
1. Navigate to “IAM & Admin” and then “Service accounts.”
1. Click on an appropriate service account or create a new one. If you create
   a new one, it should have the “Cloud Datastore User” role at a minimum.
1. Generate a key by clicking on “+ Create Key.” This will give you the option
   of downloading a JSON keyFile or a .p12 keyFile.

This keyFile, by itself, is sufficient to connect to Firestore. However,
seeing as you should **never commit** this file, it may make more sense to
harvest a few keys from it and use them as environment variables. The
properties to harvest into your environment are `project_id`, `private_key`,
and `client_email`.

Note that `private_key` is likely to have special characters that may break
with some continuous integration solutions like Travis. My solution in
`spec/helpers.js` is to encode the private key as a hex string, paste that
blob into Travis, and then convert that back to ascii within the script.

## Options

In addition to the credentials indicated above, the adapter anticipates four
options:

* `typeMap`: An object that maps type names (keys) to collection names
  (values). For example: `{user: "users"}`. If unset, it assumes the type
  passed from Fortune has the same name as the collection in Firestore.
* `bufferEncoding`: Fortune provides for saving `Buffer`-type blobs in
  records. Firestore does not, without using their custom `Blob` type.
  Instead, the adapter converts all fields indicated as `type: Buffer` in the
  record types to strings. This option sets the encoding for that conversion.
  The default is `"base64"`.
* `convertTimestamps`: Firestore receives `Date`s and converts them to
  [`Timestamp`s](https://googleapis.dev/nodejs/firestore/latest/Timestamp.html).
  By default, this option is set to `true`, meaning that when records are
  fetched, the adapter converts the `Timestamp`s Firestore has saved to
  `Date`s. 
* `nullUndefinedFields`: Firestore doesn’t know about the schema you have
  registered with Fortune. It will make a record with as many fields as are
  passed in the `create()` method. Fortune, however, expects undefined fields
  to be set as `null` or `[]` (if they are arrays). This parameter, which
  defaults to `true` can be deactivated, keeping the skinny records.

## Contributing, etc.

Please do. I ported this by writing to the tests that Fortune provides, but I
have not yet tested the adapter in the wild.

## License

This software is licensed under the [MIT License](//github.com/muziejus/fortune-firestore/blob/master/LICENSE).
