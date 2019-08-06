require("../spec-helper");
const { expect } = require("chai");
const { setup, teardown } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#delete(type, [ids], [meta])", async function() {
    let db;
    let ref;

    before(async function() {
      db = await setup(null, records);
      ref = db.collection("users");
    });

    after(async function() {
      await teardown();
    });

    it("no-ops when ids is an empty array");
    it("deletes records");
  });
});
