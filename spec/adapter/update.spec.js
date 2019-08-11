require("../spec-helper");
const { expect } = require("chai");
const { setup, teardown, buildAdapter } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#update(type, updates, [meta]", async function() {
    let adapter;

    before(async function() {
      adapter = await buildAdapter();
      await setup(null, records);
    });

    after(async function() {
      await teardown();
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
