/* eslint no-await-in-loop: 0 */
const fs = require("fs");
const firebase = require("@firebase/testing");

const projectId = "fortune-firestore-spec";
const port = 8080;
const coverageUrl = `http://localhost:${port}/emulator/v1/projects/${projectId}:ruleCoverage.html`;

module.exports.setup = async (auth, data) => {
  const rules = fs.readFileSync("./spec/firestore-files/firestore.rules", "utf8");
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
