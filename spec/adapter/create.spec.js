require("../spec-helper");
const { expect } = require("chai");
const { setupDB, teardown, buildAdapter } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#create(type, records, [meta])", async function() {
    let db;
    let adapter;

    before(async function() {
      db = await setupDB(null, records);
      adapter = await buildAdapter();
      await adapter.connect();
    });

    after(async function() {
      await teardown(db);
    });

    it("no-ops when records is an empty array", async function() {
      const records = await adapter.create("user", []);
      expect(records).to.deep.equal([]);
    });

    it("maintains type when creating new records");
    it("does not allow using duplicate ids");
    it("generates an id when none is given");
    it("returns the records in the same order as they are created");
  });
});

