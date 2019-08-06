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

/*

const testAdapter = require("fortune/test/adapter")

const adapter = require("../lib")

testAdapter(adapter, {
  projectId: "fortune-firestore-unit-tests",
  credentials: {
    client_email: "fortune-firestore@example.com",
    private_key: "private_key"
  },
  apiEndpoint: "http://localhost:8080",
  namespace: "fortune-adapter-test",
  generateId: () => Math.floor(Math.random() * Math.pow(2, 32)).toString(16)
})

*/

import { expect } from "chai";

