require("../spec-helper");
const { expect } = require("chai");
const { setup, teardown } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#update(type, updates, [meta]", async function() {
    let db;
    let ref;

    before(async function() {
      db = await setup(null, records);
      ref = db.collection("users");
    });

    after(async function() {
      await teardown();
    });

    it("no-ops when updates is an empty array");
    it("returns 0 when no records were found to update");
    it("updates records and returns the number of updated records");
    it("does update: unset");
    it("does update: pull");
    it("does update: push");
  });
});
