require("../spec-helper");
const { expect } = require("chai");
const keys = require("fortune/lib/common/keys");
const { setupDB, teardown, buildAdapter } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#delete(type, [ids], [meta])", async function() {
    let adapter;
    let db;

    before(async function() {
      db = await setupDB(null, records);
      adapter = await buildAdapter();
      await adapter.connect();
    });

    after(async function() {
      await teardown(db);
    });

    it("no-ops when ids is an empty array", async function() {
      const ids = await adapter.delete("user", []);
      expect(ids).to.equal(0);
    });

    it("deletes records", async function() {
      const primaryKey = keys.primary;
      const numberDeleted = await adapter.delete("user", [1, 3]);
      expect(numberDeleted).to.equal(1);
      const records = await adapter.find("user", [1, 2]);
      expect(records.count).to.equal(1);
      expect(records.map(record => record[primaryKey])).to.deep.equal([2]);
    });
  });
});
