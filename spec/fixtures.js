/* eslint camelcase: 0 */
const keys = require("fortune/lib/common/keys");

const denormalizedInverseKey = keys.denormalizedInverse;

function Integer(x) {
  return (x | 0) === x;
}

Integer.prototype = Number();

const buffer =
  Buffer.from || ((input, encoding) => Buffer.from(input, encoding));
const deadbeef = buffer("deadbeef", "hex").toString("base64");
const key1 = buffer("cafe", "hex").toString("base64");
const key2 = buffer("babe", "hex").toString("base64");

const recordTypes = {
  user: {
    name: { type: String },
    age: { type: Integer },
    isAlive: { type: Boolean },
    birthday: { type: Date },
    junk: { type: Object },
    picture: { type: Buffer },
    privateKeys: { type: Buffer, isArray: true },
    nicknames: { type: String, isArray: true },
    friends: { link: "user", isArray: true, inverse: "friends" },
    nemesis: { link: "user", inverse: "__user_nemesis_inverse" },
    __user_nemesis_inverse: {
      link: "user",
      isArray: true,
      inverse: "nemesis",
      [denormalizedInverseKey]: true
    },
    bestFriend: { link: "user", inverse: "bestFriend" }
  }
};

const records = {
  "users/1": {
    id: 1,
    name: "bob",
    age: 42,
    isAlive: true,
    junk: { things: ["a", "b", "c"] },
    birthday: new Date(),
    privateKeys: [],
    friends: [2],
    bestFriend: 2
  },
  "users/2": {
    id: 2,
    name: "john",
    age: 36,
    isAlive: false,
    picture: deadbeef,
    privateKeys: [key1, key2],
    friends: [1],
    bestFriend: 1
  }
};

module.exports = { recordTypes, records };
