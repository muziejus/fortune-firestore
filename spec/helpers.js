/* eslint no-await-in-loop: 0, camelcase: 0 */
const fs = require("fs");
const Firestore = require("@google-cloud/firestore");
const message = require("fortune/lib/common/message");
const keys = require("fortune/lib/common/keys");
const AdapterSingleton = require("fortune/lib/adapter/singleton");
const FirestoreAdapter = require("../lib");
const { recordTypes } = require("./fixtures");

const projectId = process.env.FIRESTORE_PROJECT_ID;
const client_email = process.env.FIRESTORE_CLIENT_EMAIL;
const private_key = process.env.FIRESTORE_PRIVATE_KEY || Buffer.from(process.env.FIRESTORE_PRIVATE_KEY_HEX, "hex").toString("ascii");

module.exports.buildAdapter = async () => {
  let adapter;
  try {
    adapter = new AdapterSingleton({
      recordTypes,
      message,
      adapter: [
        FirestoreAdapter,
        {
          typeMap: {
            user: "users"
          },
          projectId,
          credentials: {
            client_email,
            private_key
          }
        }
      ]
    });
  } catch (error) {
    return Promise.reject(error);
  }

  return adapter;
};

module.exports.setupDB = async (auth, data) => {
  const db = new Firestore({
    projectId,
    credentials: { client_email, private_key }
  });

  if (data) {
    for (const key in data) {
      if ({}.hasOwnProperty.call(data, key)) {
        const ref = db.doc(key);
        await ref.set(data[key]);
      }
    }
  }

  return db;
};

module.exports.teardown = async db => {
  await db
    .collection("users")
    .get()
    .then(refs =>
      refs.docs.map(doc => {
        db.collection("users")
          .doc(doc.id)
          .delete();
      })
    );
};

module.exports.testIds = records =>
  records.filter(record => {
    const type = typeof record[keys.primary];
    return type !== "string" && type !== "number";
  });
