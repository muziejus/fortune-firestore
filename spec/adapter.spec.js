require("./spec-helper");
const { expect } = require("chai");
const { setup, teardown } = require("./helpers");
const { records } = require("./fixtures");

/*
const Adapter = require("fortune/adapter")
const AdapterSingleton = require("fortune/adapter/singleton")
const common = require("fortune/common")
const errors = require("fortune/common/errors")
const message = require("fortune/common/message")
const deepEqual = require("fortune/common/deep_equal")
const map = require("fortune/common/array/map")
const find = require("fortune/common/array/find")
const includes = require("fortune/common/array/includes")
const filter = require("fortune/common/array/filter")

const keys = require("fortune/common/keys")
const denormalizedInverseKey = keys.denormalizedInverse
const primaryKey = keys.primary
*/

describe("Fortune Firestore Adapter", function() {
  let db;
  let ref;

  before(async function() {
    db = await setup(null, records);
    ref = db.collection("users");
  });

  after(async function() {
    await teardown();
  });

  it("cannot access an arbitrary collection", async function() {
    return expect(ref.get()).to.eventually.be.fulfilled;
  });

});
