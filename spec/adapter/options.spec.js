require("../spec-helper");
const { expect } = require("chai");
const { setupDB, teardown, buildAdapter } = require("../helpers");
const { defaultRecords } = require("../fixtures");

describe("Fortune Firestore Adapter options", function() {
  describe("bufferEncoding", async function() {
    let db;
    let adapter;
    const bufferEncoding = "hex";

    before(async function() {
      db = await setupDB(null, defaultRecords);
      adapter = await buildAdapter({ bufferEncoding });
      await adapter.connect();
    });

    it("uses the set encoding when pushing and pulling Buffers", async function() {
      const deadbeef = Buffer.from("deadbeef", "base64");
      const records = await adapter.create("user", [
        {
          id: 3,
          picture: deadbeef,
        }
      ]);
      expect(records[0].picture).to.deep.equal(deadbeef);
      const rawRecord = await db.doc("users/3").get().then(doc => doc.data());
      expect(Buffer.from(rawRecord.picture, bufferEncoding)).to.deep.equal(deadbeef);
    });

    after(async function() {
      await teardown(db);
    });

  });

  describe("convertTimestamps", async function() {
    let adapter;
    let db;

    before(async function() {
      db = await setupDB(null, defaultRecords);
      adapter = await buildAdapter({ convertTimestamps: false });
      await adapter.connect();
    });

    it("keeps Timestamps as timestamps when false", async function() {
      const birthday = new Date();
      const records = await adapter.create("user", [
        {
          id: 3,
          birthday
        }
      ]);
      expect(records[0].birthday).to.have.own.property("_seconds");
      expect(records[0].birthday).to.have.own.property("_nanoseconds");
    });

    after(async function() {
      await teardown(db);
    });

  });

  describe("nullUndefinedFields", async function() {
    let adapter;
    let db;

    before(async function() {
      db = await setupDB(null, defaultRecords);
      adapter = await buildAdapter({ nullUndefinedFields: false });
      await adapter.connect();
    });

    it("does not null or [] undefined fields on create when false", async function() {
      const records = await adapter.create("user", [
        {
          id: 3
        }
      ]);
      expect(records[0].picture).to.be.undefined;
      expect(records[0].nickames).to.be.undefined;
    })



    after(async function() {
      await teardown(db);
    });

  });
});

