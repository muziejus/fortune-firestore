require("../spec-helper");
const { expect } = require("chai");
const keys = require("fortune/lib/common/keys");
const { ConflictError } = require("fortune/lib/common/errors");
const { testIds, setupDB, teardown, buildAdapter } = require("../helpers");
const { defaultRecords } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#create(type, records, [meta])", async function() {
    let db;
    let adapter;
    const primaryKey = keys.primary;

    beforeEach(async function() {
      db = await setupDB(null, defaultRecords);
      adapter = await buildAdapter();
      await adapter.connect();
    });

    afterEach(async function() {
      await teardown(db);
    });

    it("no-ops when records is an empty array", async function() {
      const records = await adapter.create("user", []);
      expect(records).to.deep.equal([]);
    });

    it("maintains type when creating new records", async function() {
      const deadbeef = Buffer.from("deadbeef", "hex");
      const date = new Date();
      const records = await adapter.create("user", [
        {
          id: 3,
          picture: deadbeef,
          birthday: date
        }
      ]);
      expect(records[0].picture).to.deep.equal(deadbeef);
      expect(Math.abs(records[0].birthday.getTime() - date.getTime())).to.be.lt(
        1000
      );
    });

    it("does not allow using duplicate ids", async function() {
      const records = await adapter.find("user");
      expect(records).to.have.length(2);
      expect(adapter.create("user", [{ id: 1 }])).to.be.rejectedWith(
        ConflictError
      );
    });

    it("generates an id when none is given", async function() {
      let records = await adapter.create("user", [{ name: "joe" }]);
      const id = records[0][primaryKey];
      expect(testIds([id])).to.have.length(1);
      expect(records[0].picture).to.be.null;
      expect(records[0].nicknames).to.deep.equal([]);
      records = await adapter.find("user", [id]);
      expect(records).to.have.length(1);
      expect(records[0][primaryKey]).to.equal(id);
      expect(testIds([id])).to.have.length(1);
    });

    it("returns the records in the same order as they are created", async function() {
      const records = await adapter.create("user", [
        { name: "a" },
        { name: "b" },
        { name: "c" }
      ]);
      expect(records.map(record => record.name)).to.deep.equal(["a", "b", "c"]);
    });
  });
});
