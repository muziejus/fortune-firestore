require("../spec-helper");
const { expect } = require("chai");
const { setup, teardown } = require("../helpers");
const { records } = require("../fixtures");

describe("Fortune Firestore Adapter", function() {
  describe("#create(type, records, [meta])", async function() {
    let db;
    let ref;

    before(async function() {
      db = await setup(null, records);
      ref = db.collection("users");
    });

    after(async function() {
      await teardown();
    });

    it("no-ops when records is an empty array");
    it("maintains type when creating new records");
    it("does not allow using duplicate ids");
    it("generates an id when none is given");
    it("returns the records in the same order as they are created");
  });
});

