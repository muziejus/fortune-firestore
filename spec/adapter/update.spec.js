require("../spec-helper");
const { expect } = require("chai");
const { setupDB, teardown, buildAdapter } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#update(type, updates, [meta]", async function() {
    let adapter;
    let db;

    before(async function() {
      adapter = await buildAdapter();
      db = await setupDB(null, records);
      await adapter.connect();
    });

    after(async function() {
      await teardown(db);
    });

    it("no-ops when updates is an empty array", async function() {
      const updates = await adapter.create("user", []);
      expect(updates).to.deep.equal([]);
    });

    it("returns 0 when no records were found to update");
    it("updates records and returns the number of updated records");
    it("does update: unset");
    it("does update: pull");
    it("does update: push");
  });
});
