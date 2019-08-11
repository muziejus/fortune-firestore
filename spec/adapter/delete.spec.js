require("../spec-helper");
const { expect } = require("chai");
const { setup, teardown, buildAdapter } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#delete(type, [ids], [meta])", async function() {
    let adapter;

    before(async function() {
      adapter = await buildAdapter();
      await setup(null, records);
    });

    after(async function() {
      await teardown();
    });

    it("no-ops when records is an empty array", async function() {
      const records = await adapter.delete("user", []);
      expect(records).to.equal(0);
    });

    it("deletes records");
  });
});
