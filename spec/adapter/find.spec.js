require("../spec-helper");
const { expect } = require("chai");
const keys = require("fortune/lib/common/keys");
const { setupDB, teardown, buildAdapter, testIds } = require("../helpers");
const { defaultRecords } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#find(type, [ids], [options], [meta])", async function() {
    let db;
    let adapter;
    const primaryKey = keys.primary;
    const deadbeef = Buffer.from("deadbeef", "hex");
    const key1 = Buffer.from("cafe", "hex");

    before(async function() {
      db = await setupDB(null, defaultRecords);
      adapter = await buildAdapter();
      await adapter.connect();
    });

    after(async function() {
      await teardown(db);
    });

    it("no-ops when ids is an empty array", async function() {
      const records = await adapter.find("user", []);
      expect(records).to.deep.equal([]);
    });

    it("returns a single record correctly with proper types", async function() {
      const records = await adapter.find("user", [1]);
      expect(records.count).to.equal(1);
      expect(records[0][primaryKey]).to.equal(1);
      expect(records[0].birthday).to.be.instanceof(Date);
      expect(records[0].isAlive).to.be.a("boolean");
      expect(records[0].age).to.be.a("number");
      expect(records[0].junk).to.deep.equal({ things: ["a", "b", "c"] });
      expect(Object.keys(records[0])).to.not.include("__user_nemesis_inverse");
    });

    it("returns the second document with proper typing", async function() {
      const records = await adapter.find("user", [2]);
      expect(records.count).to.equal(1);
      expect(records[0][primaryKey]).to.equal(2);
      expect(records[0].picture).to.be.instanceof(Buffer);
      expect(records[0].picture).to.deep.equal(deadbeef);
      expect(
        records[0].privateKeys.map(key => key.toString("hex"))
      ).to.deep.equal(["cafe", "babe"]);
    });

    it("returns the whole collection when ids is undefined", async function() {
      const records = await adapter.find("user");
      expect(records.count).to.equal(2);
      expect(testIds(records).length).to.equal(0);
    });

    it("returns the correct records when options includes a numerical range", async function() {
      let records = await adapter.find("user", null, {
        range: { age: [36, 38] }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("john");
      records = await adapter.find("user", null, {
        range: { age: [null, 36] }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("john");
    });

    it("returns the correct records when options includes a string range", async function() {
      let records = await adapter.find("user", null, {
        range: { name: ["i", "k"] }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("john");
      records = await adapter.find("user", null, {
        range: { name: ["j", null] }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("john");
    });

    it("returns the correct records when options includes a date range", async function() {
      let records = await adapter.find("user", null, {
        range: { birthday: [null, new Date()] }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("bob");
      records = await adapter.find("user", null, {
        range: { birthday: [new Date(Date.now() - 10 * 1000), new Date()] }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("bob");
    });

    it("returns the correct records when options includes an array range", async function() {
      let records = await adapter.find("user", null, {
        range: { privateKeys: [1, 2] }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("john");
      records = await adapter.find("user", null, {
        range: { privateKeys: [1, null] }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("john");
    });

    it("returns the correct records when options includes a string matcher", async function() {
      // This match returns every record where the name is in the array sent over.
      // It stricks me that this can't be done w/o an OR, which means that
      // this relies on branching queries. This won't happen
      // right away…
      const records = await adapter.find("user", null, {
        match: { name: ["john", "xyz"], age: 36 }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("john");
    });

    it("returns the correct records when options includes a link matcher", async function() {
      const records = await adapter.find("user", null, {
        match: { friends: 2 }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("bob");
    });

    it("returns the correct records when options includes a buffer matcher", async function() {
      const records = await adapter.find("user", null, {
        match: { picture: deadbeef }
      });
      expect(records.count).to.equal(1);
      expect(records[0].picture).to.deep.equal(deadbeef);
    });

    it("returns the correct records when options includes an array matcher #1", async function() {
      const records = await adapter.find("user", null, {
        match: { privateKeys: key1 }
      });
      expect(records.count).to.equal(1);
      expect(records[0][primaryKey]).to.equal(2);
    });

    it("returns the correct records when options includes an array matcher #2", async function() {
      const records = await adapter.find("user", null, {
        match: { privateKeys: [key1] }
      });
      expect(records.count).to.equal(1);
      expect(records[0][primaryKey]).to.equal(2);
    });

    it("returns no records when the criteria match no records", async function() {
      const records = await adapter.find("user", null, {
        match: { name: "bob", age: 36 }
      });
      expect(records.length).to.equal(0);
    });

    it("returns the correct records when matching on field existence", async function() {
      const records = await adapter.find("user", null, {
        exists: { picture: true }
      });
      expect(records[0][primaryKey]).to.equal(2);
    });

    it("returns the correct records when matching on field inexistence", async function() {
      const records = await adapter.find("user", null, {
        exists: { picture: false }
      });
      expect(records[0][primaryKey]).to.equal(1);
    });

    it("returns the correct records when matching on an empty array", async function() {
      let records = await adapter.find("user", null, {
        exists: { privateKeys: true }
      });
      expect(records[0][primaryKey]).to.equal(2);
      records = await adapter.find("user", null, {
        exists: { privateKeys: false }
      });
      expect(records[0][primaryKey]).to.equal(1);
    });

    it("sorts records ascending when options includes a sort ascending property", async function() {
      const records = await adapter.find("user", null, { sort: { age: true } });
      expect(records.map(r => r.age)).to.deep.equal([36, 42]);
    });

    it("sorts records descending when options includes a sort descending property", async function() {
      const records = await adapter.find("user", null, {
        sort: { age: false }
      });
      expect(records.map(r => r.age)).to.deep.equal([42, 36]);
    });

    it("sorts records by combination when options includes combined sorting properties", async function() {
      const records = await adapter.find("user", null, {
        sort: { age: true, name: true }
      });
      expect(records.map(r => r.age)).to.deep.equal([36, 42]);
    });

    it("limits and offsets results when options includes limit and offset properties", async function() {
      const records = await adapter.find("user", null, {
        offset: 1,
        limit: 1,
        sort: { name: true }
      });
      expect(records.length).to.equal(1);
      expect(records[0].name).to.equal("john");
    });

    /* These all rely on `adapter.features.logicalOperators` being set, 
     * so as these are an optional adapter feature, I can skip them.
     * There's no way Firestore can do { and: [] }-type queries.
    it("does find: fields #1");
    it("does find: fields #2");
    it("does find: logical not #1");
    it("does find: logical not #2");
    it("does find: logical not #3");
    it("does find: logical and #1");
    it("does find: logical or #1");
    it("does find: logical or #2");
    it("tracks multiple logical operators #1");
    it("tracks multiple logical operators #2");
    */
  });
});
