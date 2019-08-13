require("../spec-helper");
const { expect } = require("chai");
const keys = require("fortune/lib/common/keys");
const { setupDB, teardown, buildAdapter, testIds } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#find(type, [ids], [options], [meta])", async function() {
    let adapter;
    const primaryKey = keys.primary;

    before(async function() {
      await setupDB(null, records);
      adapter = await buildAdapter();
      // const connect = await adapter.connect();
      // console.log("ps", connect);
      await adapter.connect();
    });

    after(async function() {
      await teardown();
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
      // Expect Buffer to be a buffer
      // Expect Buffer to have the value of a buffer
      // Expect array of Buffers to be correct
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

    it.skip("returns the correct records when options includes an array range", async function() {
      // This is going to take a while and rely, perhaps, on getting the Buffer thing to work.
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

    it.skip("returns the correct records when options includes a string matcher", async function() {
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

    /*
    it("returns the correct records when options includes a buffer matcher");
    it("returns the correct records when options includes an array matcher #1");
    it("returns no records when the criteria match no records");
    it("returns the correct records when matching on field existence");
    it("returns the correct records when matching on field inexistence");
    it("returns the correct records when matching on an empty array");
    it(
      "sorts records ascending when options includes a sort ascending property"
    );
    it(
      "sorts records descending when options includes a sort descending property"
    );
    it(
      "sorts records by combination when options includes combined sorting properties"
    );
    it(
      "limits and offsets results when options includes limit and offset properties"
    );
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
