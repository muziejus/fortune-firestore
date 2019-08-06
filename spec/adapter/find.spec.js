require("../spec-helper");
const { expect } = require("chai");
const { setup, teardown } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#find(type, [ids], [options], [meta])", async function() {
    let db;
    let ref;

    before(async function() {
      db = await setup(null, records);
      ref = db.collection("users");
    });

    after(async function() {
      await teardown();
    });

    it("returns no records when ids is an empty array");
    it("returns a single id correctly with proper types");
    it("returns the second document with proper typing");
    it("returns the whole collection when ids is undefined");
    it("returns the correct records when options includes a numerical range");
    it("returns the correct records when options includes a string range");
    it("returns the correct records when options includes a date range");
    it("returns the correct records when options includes an array range");
    it("returns the correct records when options includes a string matcher");
    it("returns the correct records when options includes a link matcher");
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
  });
});
