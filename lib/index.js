"use strict";

const Firestore = require("@google-cloud/firestore");

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

    find(type, ids, options) {
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
          if (doc) {
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
                  doc[key] = doc[key].map(value =>
                    Buffer.from(value, "base64")
                  );
                } else {
                  doc[key] = Buffer.from(doc[key], "base64");
                }
              }
            });
          }
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
            if (options.exists[field] && fields[field].isArray) {
              results = results.filter(doc => doc[field].length !== 0);
            } else if (options.exists[field] && !fields[field].isArray) {
              results = results.filter(doc => field in doc);
            } else if (!options.exists[field] && fields[field].isArray) {
              results = results.filter(doc => doc[field].length === 0);
            } else {
              results = results.filter(doc => !(field in doc));
            }
          }
        }

        // Searching for non-existent documents gets undefined "records" in
        // the results array.
        results = results.filter(result => typeof result !== "undefined");
        results.count = results.length;
        return results;
      };

      return findDocuments();
    }

    create(type, records, meta) {
      if (!records.length > 0) return super.create();

      const { Promise, db } = this;
      const primaryKey = this.keys.primary;
      const { ConflictError } = this.errors;
      const { typeMap } = this.options;
      const collection = type in typeMap ? typeMap[type] : type;
      const fields = this.recordTypes[type];
      const options = {};
      const dateKeys = Object.keys(fields).filter(
        key => fields[key].type === Date
      );
      const bufferKeys = Object.keys(fields).filter(
        key => fields[key].type === Buffer
      );

      if (meta && meta.session) options.session = meta.session;

      return new Promise((resolve, reject) => {
        const promises = records.map(record => {
          bufferKeys.forEach(key => {
            if (record[key]) {
              if (fields[key].isArray) {
                record[key] = record[key].map(value =>
                  value.toString("base64")
                );
              } else {
                record[key] = record[key].toString("base64");
              }
            }
          });

          for (const field in fields) {
            if (!record[field]) {
              if (fields[field].isArray) {
                record[field] = [];
              } else {
                record[field] = null;
              }
            }
          }

          let reference = db.collection(collection);

          if (record[primaryKey]) {
            db.collection(collection).get();
            reference = reference
              .doc(`${record[primaryKey]}`)
              .create(record)
              .then(() => {
                return db.doc(`${collection}/${record[primaryKey]}`).get();
              })
              .catch(error => {
                if (/Document already exists/.test(error.message)) {
                  reject(new ConflictError(error.message));
                } else {
                  reject(new Error(error.message));
                }
              });
          } else {
            reference = reference
              .add(record)
              // Hijack and set the id property.
              .then(ref => {
                const update = {};
                update[primaryKey] = ref.id;
                return ref.update(update).then(() => ref);
              })
              .then(ref => ref.get());
          }

          return reference
            .then(doc => {
              if (doc && doc.data()) {
                const data = doc.data();
                dateKeys.forEach(key => {
                  if (data[key]) {
                    data[key] = new Firestore.Timestamp(
                      data[key]._seconds,
                      data[key]._nanoseconds
                    ).toDate();
                  }
                });
                bufferKeys.forEach(key => {
                  if (data[key]) {
                    if (fields[key].isArray) {
                      data[key] = data[key].map(value =>
                        Buffer.from(value, "base64")
                      );
                    } else {
                      data[key] = Buffer.from(data[key], "base64");
                    }
                  }
                });
                return data;
              }
            })
            .catch(error => {
              reject(new ConflictError(error));
            });
        });

        return Promise.all(promises)
          .then(resolve)
          .catch(reject);
      });
    }

    update(type, updates, meta) {
      const { Promise, db } = this;
      const { typeMap } = this.options;
      const collection = type in typeMap ? typeMap[type] : type;

      if (updates && updates.length === 0) {
        return 0;
      }

      return Promise.all(
        updates.map(
          update =>
            new Promise(resolve => {
              const options = {};
              const changes = update.replace || {};

              if (meta && meta.session) options.session = meta.session;

              if ("push" in update || "pull" in update) {
                // We need to get the document…
                db.collection(collection)
                  .doc(`${update.id}`)
                  .get()
                  .then(doc => {
                    const data = doc.data();

                    if ("push" in update) {
                      for (const field of Object.keys(update.push)) {
                        const value = update.push[field];
                        if (Array.isArray(value)) {
                          changes[field] = data[field].concat(value);
                        } else {
                          changes[field] = data[field].concat([value]);
                        }
                      }
                    }

                    if ("pull" in update) {
                      for (const field of Object.keys(update.pull)) {
                        const value = update.pull[field];
                        if (Array.isArray(value)) {
                          changes[field] = data[field];
                          value.forEach(poppedValue => {
                            changes[field] = changes[field].filter(
                              v => v !== poppedValue
                            );
                          });
                        } else {
                          changes[field] = data[field].filter(v => v !== value);
                        }
                      }
                    }

                    db.collection(collection)
                      .doc(`${update.id}`)
                      .update(changes)
                      .then(() => resolve(1))
                      .catch(() => resolve(0));
                  });
                return;
              }

              db.collection(collection)
                .doc(`${update.id}`)
                .update(changes)
                .then(() => resolve(1))
                .catch(() => resolve(0));
            })
        )
      ).then(numbers =>
        numbers.reduce((accumulator, number) => accumulator + number, 0)
      );
    }

    delete(type, ids, meta) {
      if (ids && !ids.length > 0) return super.delete();

      const { Promise, db } = this;
      const { typeMap } = this.options;
      const collection = type in typeMap ? typeMap[type] : type;
      const options = {};

      if (meta && meta.session) options.session = meta.session;

      if (ids && ids.length > 0) {
        return Promise.all(
          ids.map(id =>
            db
              .collection(collection)
              .doc(`${id}`)
              .delete()
          )
        ).then(results => results.length);
      }
    }
  };
