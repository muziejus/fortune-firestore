/* eslint no-useless-call: 1, unicorn/explicit-length-check: 1 */
"use strict";

const debug = require("debug")("adapter");
const Firestore = require("@google-cloud/firestore");

const helpers = require("./helpers");

const { inputRecord } = helpers;
const { outputRecord } = helpers;
const { mapValues } = helpers;
const { idKey } = helpers;
const { generateId } = helpers;
const { generateQuery } = helpers;
const { deleteCollection } = helpers;

const adapterOptions = new Set(["generateId", "typeMap", "enableTransactions"]);

/**
 * Firestore Adapter options
 *
 * To connect to Firestore, one of the following three combinations of
 * parameters must be present:
 *
 * 1. keyFilename as a JSON file.
 * 2. projectId, credentials.client_email, and credentials.private_key
 * 3. keyFilename as .pem or .p12 file, projectId, and credentials.client_email
 *
 * @typedef {Object} options
 * @property {string} [projectId] - The Google Cloud Platform / Firebase projectId.
 * @property {string} [credentials.client_email] - The client_email provided by Google.
 * @property {string} [credentials.private_key] - The private_key provided by Google.
 * @property {string} [keyFilename] - The JSON keyfile provided by Google.
 * @property {object} [typeMap] - An object that maps type names (keys) to collection names (values). For example: { user: "users" }.
 * @property {string} [namespace] - The namespace to which transactions should be isolated.
 * @property {function} [generateId] - A function that generates an id key on a new record, accepting one argument, the record type.
 * @property {boolean} [enableTransactions] - Use transactions for handling requests. Default: false.

/**
 * Firestore adapter class
 *
 * @param {Adapter} Adapter - A Fortune Adapter
 * @return {FirestoreAdapter} A Google Cloud Firestore Adapter
 *
 */
module.exports = Adapter =>
  class FirestoreAdapter extends Adapter {
    connect() {
      const { Promise, options } = this;
      return new Promise((resolve, reject) => {
        if (!("typeMap" in options)) options.typeMap = {};
        if (!("enableTransactions" in options))
          options.enableTransactions = false;

        if (!("generateId" in options)) options.generateId = generateId;

        const parameters = {};

        for (const key in options)
          if (!adapterOptions.has(key)) parameters[key] = options[key];

        try {
          this.db = new Firestore(parameters);
          return resolve();
        } catch (error) {
          reject(error);
        }
      });
    }

    disconnect() {
      delete this.db;
    }

    find(type, ids, options, meta) {
      // Handle no-op.
      if (ids && !ids.length > 0) return super.find();

      options = options || {};
      const { Promise, db } = this;
      const { typeMap } = this.options;
      const fields = this.recordTypes[type];
      const collection = type in typeMap ? typeMap[type] : type;
      const dateKeys = Object.keys(fields).filter(
        key => fields[key].type === Date
      );
      const bufferKeys = Object.keys(fields).filter(
        key => fields[key].type === Buffer
      );

      const findDocuments = async () => {
        let results;
        if (ids) {
          results = await Promise.all(
            ids.map(id =>
              db
                .collection(collection)
                .doc(`${id}`)
                .get()
            )
          ).then(refs => refs.map(doc => doc.data()));
        } else {
          let collectionRef = db.collection(collection);
          if (options.range) {
            for (const field of Object.keys(options.range)) {
              const value = options.range[field];
              if (!fields[field].isArray) {
                // Here for when array range matching returns.
                if (value[0] instanceof Date) {
                  value[0] = Firestore.Timestamp.fromDate(value[0]);
                }

                if (value[1] instanceof Date) {
                  value[1] = Firestore.Timestamp.fromDate(value[1]);
                }

                if (value[0] !== null) {
                  collectionRef = collectionRef.where(field, ">=", value[0]);
                }

                if (value[1] !== null) {
                  collectionRef = collectionRef.where(field, "<=", value[1]);
                }
              }
            }
          }

          if (options.match) {
            // MongoDB adapter makes space for or: `if ('or' in options.match)`
            // But that doesn't seem to be tested...
            for (const field of Object.keys(options.match)) {
              const value = options.match[field];
              if (fields[field].link) {
                // The matcher is to a linked table
                const relatedCollection =
                  fields[field].inverse || typeMap[field[field].link];
                if (fields[field].isArray) {
                  collectionRef = collectionRef.where(
                    relatedCollection,
                    "array-contains",
                    value
                  );
                } else {
                  collectionRef = collectionRef.where(
                    relatedCollection,
                    "==",
                    value
                  );
                }
              } else if (fields[field].type === Buffer) {
                // Hijack for Buffers
                if (fields[field].isArray) {
                  if (Array.isArray(value)) {
                    collectionRef = collectionRef.where(
                      field,
                      "array-contains",
                      value[0].toString("base64")
                    );
                  } else {
                    collectionRef = collectionRef.where(
                      field,
                      "array-contains",
                      value.toString("base64")
                    );
                  }
                } else {
                  collectionRef = collectionRef.where(
                    field,
                    "==",
                    value.toString("base64")
                  );
                }
              } else if (!Array.isArray(value)) {
                // The test passes an array…
                // "Logical OR queries. In this case, you should create a
                // separate query for each OR condition and merge the query
                // results in your app"
                // Ignore having arrays passed in for now. A solution may appear later.
                collectionRef = collectionRef.where(field, "==", value);
              }
            }
          }

          if (options.sort) {
            for (const field of Object.keys(options.sort)) {
              const value = options.sort[field];
              if (value) {
                collectionRef = collectionRef.orderBy(field);
              } else {
                collectionRef = collectionRef.orderBy(field, "desc");
              }
            }
          }

          if (options.limit) {
            collectionRef = collectionRef.limit(options.limit);
          }

          if (options.offset) {
            collectionRef = collectionRef.offset(options.offset);
          }

          results = await collectionRef
            .get()
            .then(refs => refs.docs.map(doc => doc.data()));
        }

        for (const doc of results) {
          dateKeys.forEach(key => {
            if (doc[key]) {
              doc[key] = new Firestore.Timestamp(
                doc[key]._seconds,
                doc[key]._nanoseconds
              ).toDate();
            }
          });
          bufferKeys.forEach(key => {
            if (doc[key]) {
              if (fields[key].isArray) {
                doc[key] = doc[key].map(value => Buffer.from(value, "base64"));
              } else {
                doc[key] = Buffer.from(doc[key], "base64");
              }
            }
          });
        }

        if (options.range) {
          // Return to range to pick up when an array is sent to query an array.
          for (const field of Object.keys(options.range)) {
            const value = options.range[field];
            if (
              fields[field].isArray &&
              Array.isArray(value) &&
              value.length === 2
            ) {
              if (value[0] !== null) {
                results = results.filter(doc => doc[field][value[0] - 1]);
              }

              if (value[1] !== null) {
                results = results.filter(doc => !doc[field][value[1]]);
              }
            }
          }
        }

        if (options.match) {
          // Return to match to pick up when arrays are sent as matchers
          for (const field of Object.keys(options.match)) {
            const value = options.match[field];
            if (Array.isArray(value) && !fields[field].isArray) {
              results = results.filter(doc => value.includes(doc[field]));
            }
          }
        }

        if (options.exists) {
          for (const field of Object.keys(options.exists)) {
            if (options.exists[field]) {
              if (fields[field].isArray) {
                results = results.filter(doc => doc[field].length !== 0);
              } else {
                results = results.filter(doc => field in doc);
              }
            } else {
              if (fields[field].isArray) {
                results = results.filter(doc => doc[field].length === 0);
              } else {
                results = results.filter(doc => !(field in doc));
              }
            }
          }
        }

        results.count = results.length;
        return results;
      };

      return findDocuments();
    }

    create(type, records, meta) {
      if (!records.length > 0) return super.create();

      const { Promise } = this;
      const { ConflictError } = this.errors;
      const { typeMap } = this.options;
      const collection = type in typeMap ? typeMap[type] : type;
      const options = {};

      if (meta && meta.session) options.session = meta.session;

      return new Promise((resolve, reject) => {
        const promises = records.map(record =>
          this.db
            .collection(collection)
            .doc()
            .set(record)
        );
        return Promise.all(promises)
          .then(resolve)
          .catch(reject);
        /*

        this.db
          .collection(collection)
          .insertMany(
            records.map(inputRecord.bind(this, type)),
            options,
            (error, result) =>
              error
                ? // Cryptic error code for unique constraint violation.
                  reject(
                    error.code === 11000
                      ? new ConflictError("Duplicate key.")
                      : error
                  )
                : resolve(result.ops.map(outputRecord.bind(this, type)))
          )
          */
      });
    }

    update(type, updates, meta) {
      const { Promise } = this;
      const { typeMap } = this.options;
      const primaryKey = this.keys.primary;
      const collection = type in typeMap ? typeMap[type] : type;

      return Promise.all(
        updates.map(
          update =>
            new Promise((resolve, reject) => {
              const modifiers = {};
              const options = {};

              if (meta && meta.session) options.session = meta.session;

              if ("replace" in update && Object.keys(update.replace).length > 0)
                modifiers.$set = update.replace;

              if ("push" in update)
                modifiers.$push = mapValues(update.push, value =>
                  Array.isArray(value) ? { $each: value } : value
                );

              if ("pull" in update)
                modifiers.$pull = mapValues(update.pull, value =>
                  Array.isArray(value) ? { $in: value } : value
                );

              // Custom update operators have precedence.
              Object.assign(modifiers, update.operate);

              // Short circuit no-op.
              if (Object.keys(modifiers).length === 0) {
                resolve(0);
                return;
              }

              this.db.collection(collection).updateOne(
                {
                  [idKey]: update[primaryKey]
                },
                modifiers,
                options,
                (error, result) =>
                  error ? reject(error) : resolve(result.result.n)

              );
            })
        )
      ).then(numbers =>
        numbers.reduce((accumulator, number) => accumulator + number, 0)
      );
    }

    delete(type, ids, meta) {
      if (ids && !ids.length > 0) return super.delete();

      const { Promise } = this;
      const { typeMap } = this.options;
      const collection = type in typeMap ? typeMap[type] : type;
      const options = {};

      if (meta && meta.session) options.session = meta.session;

      return new Promise((resolve, reject) => {
        // return this.db
        //   .collection(collection)
        //   .get()
        //   .then(r => r.docs.map(d => d.data()));
        // });

        if (ids && ids.length > 0) {
          return Promise.all(
            ids.map(id =>
              this.db
                .collection(collection)
                .doc(id)
                .delete()
            )
          ).then(() => resolve);
        }

        // return deleteCollection(this.db, collection)
        //   .then(() => resolve())
        //   .catch(() => reject());
        // this.db
        //   .collection(collection)
        //   .deleteMany(
        //     ids && ids.length ? { [idKey]: { $in: ids } } : {},
        //     options,
        //     (error, result) =>
        //       error ? reject(error) : resolve(result.result.n)
        //   )
      });
    }

    beginTransaction() {
      const self = this;
      const { Promise } = this;

      if (!self.options.enableTransactions) return Promise.resolve(self);

      // Start a session in this closure.
      const session = self.client.startSession();
      session.startTransaction();

      // Augment the requests with the session.
      return {
        find(type, ids, options, meta) {
          if (meta === null) meta = {};
          meta.session = session;
          return self.find.call(self, type, ids, options, meta);
        },
        create(type, records, meta) {
          if (meta === null) meta = {};
          meta.session = session;
          return self.create.call(self, type, records, meta);
        },
        update(type, updates, meta) {
          if (meta === null) meta = {};
          meta.session = session;
          return self.update.call(self, type, updates, meta);
        },
        delete(type, ids, meta) {
          if (meta === null) meta = {};
          meta.session = session;
          return self.update.call(self, type, ids, meta);
        },
        endTransaction(error) {
          return (error
            ? session.abortTransaction()
            : session.commitTransaction()
          ).then(() => {
            session.endSession();
          });
        }
      };
    }
  };
