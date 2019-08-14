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

    it.skip("deletes records", async function() {
      const primaryKey = keys.primary;
      // const numberDeleted = await adapter.delete("user", [1, 3]);
      const numberDeleted = await adapter.delete("user", [1]);
      expect(numberDeleted).to.equal(1);
      // console.log("delte 2");
      // const remainingRecords = await adapter.find("user", [1, 2]);
      // console.log("delte 4");
      // expect(remainingRecords.count).to.equal(1);
      // console.log(remainingRecords);
      // expect(remainingRecords.map(record => record[primaryKey])).to.deep.equal([
      //   2
      // ]);
    });
  });
});
