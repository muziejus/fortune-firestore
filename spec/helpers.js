/* eslint no-await-in-loop: 0, camelcase: 0 */
const fs = require("fs");
const firebase = require("@firebase/testing");
const message = require("fortune/lib/common/message");
const AdapterSingleton = require("fortune/lib/adapter/singleton");
const FirestoreAdapter = require("../lib");
const { recordTypes } = require("./fixtures");

const projectId = "fortune-firestore-spec";
const client_email = "fortune-firestore@example.com";
const private_key = "private_key";
const port = 8080;
const coverageUrl = `http://localhost:${port}/emulator/v1/projects/${projectId}:ruleCoverage.html`;

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

module.exports.setup = async (auth, data) => {
  const rules = fs.readFileSync(
    "./spec/firestore-files/firestore.rules",
    "utf8"
  );
  const app = await firebase.initializeTestApp({
    projectId,
    auth
  });

  const db = app.firestore();

  await firebase.loadFirestoreRules({
    projectId,
    rules
  });

  // Mock documents before rules
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

module.exports.teardown = async () => {
  await Promise.all(firebase.apps().map(app => app.delete()));
  console.log(`View rule coverage information at ${coverageUrl}\n`);
};
