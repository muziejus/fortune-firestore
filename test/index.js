const testAdapter = require('fortune/test/adapter')
const adapter = require('../lib')

testAdapter(adapter, {
  projectId: 'fortune-firestore-unit-tests',
  credentials: {
    client_email: "fortune-firestore@example.com",
    private_key: "private_key"
  },
  apiEndpoint: 'http://localhost:8080',
  namespace: 'fortune-adapter-test',
  generateId: () => Math.floor(Math.random() * Math.pow(2, 32)).toString(16)
})
