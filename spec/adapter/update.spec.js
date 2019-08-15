require("../spec-helper");
const { expect } = require("chai");
const keys = require("fortune/lib/common/keys");
const { setupDB, teardown, buildAdapter } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#update(type, updates, [meta]", async function() {
    const primaryKey = keys.primary;
    let adapter;
    let db;

    beforeEach(async function() {
      adapter = await buildAdapter();
      db = await setupDB(null, records);
      await adapter.connect();
    });

    afterEach(async function() {
      await teardown(db);
    });

    it("no-ops when updates is an empty array", async function() {
      const updatesNumber = await adapter.update("user", []);
      expect(updatesNumber).to.equal(0);
    });

    it("returns 0 when no records were found to update", async function() {
      const updatesNumber = await adapter.update("user", [
        { id: 3, replace: { foo: "bar" } }
      ]);
      expect(updatesNumber).to.equal(0);
    });

    it("updates records and returns the number of updated records", async function() {
      const updatesNumber = await adapter.update("user", [
        { id: 1, replace: { name: "billy" } },
        { id: 2, replace: { name: "billy", nicknames: ["pepe"] } }
      ]);
      expect(updatesNumber).to.equal(2);
      const records = await adapter.find("user");
      expect(
        records.filter(record => record[primaryKey] === 2)[0].nicknames
      ).to.deep.equal(["pepe"]);
      expect(records.filter(record => record.name !== "billy")).to.have.length(
        0
      );
    });

    it("does update: unset", async function() {
      const updatesNumber = await adapter.update("user", [
        { id: 1, replace: { name: null } },
        { id: 2, replace: { name: null } }
      ]);
      expect(updatesNumber).to.equal(2);
      const records = await adapter.find("user");
      expect(records.filter(record => record.name !== null)).to.have.length(0);
    });

    it("does update: push", async function() {
      const updatesNumber = await adapter.update("user", [
        { id: 1, push: { friends: 5 } },
        { id: 2, push: { friends: [5] } }
      ]);
      expect(updatesNumber).to.equal(2);
      const records = await adapter.find("user");
      expect(
        records.filter(record => record.friends.includes(5))
      ).to.have.length(records.length);
    });

    it("does update: pull", async function() {
      const updatesNumber = await adapter.update("user", [
        { id: 1, pull: { friends: 2 } },
        { id: 2, pull: { friends: [1] } }
      ]);
      expect(updatesNumber).to.equal(2);
      const records = await adapter.find("user");
      expect(records.filter(record => record.friends.length)).to.have.length(0);
    });
  });
});
