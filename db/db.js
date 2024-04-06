const mysql = require("mysql2");
const Schema = require("./schema.js")
const QueryBuilder = require("./querybuilder.js")

require('dotenv').config();

class Modal {
	constructor(database, tableName) {
		this._database = database;
		this.tableName = tableName;
		this.fields = {};
		this.message = ''
		this.id = null;
	}

    findAll() {
        return this._database.query(`SELECT * FROM ${this.tableName}`).then((response) => response)
    }

	find(id) {
		return this._database.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]).then((response) => {
		    const instance = new Modal(this._database, this.tableName);
		    instance.id = response[0].id;
		    instance.fields = response[0];

            const row = new Proxy(instance, {
                set: (target, property, value) => {
                    if(property !== "fields"){
                        target["fields"][property] = value;
                        return true;
                    }
                },
                get: (target, property) => {
                    return target[property] || target["fields"][property]
                },
            })

            return row
		})
	}

	delete(id) {
		return this._database.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]).then((response) => {
            if(response.affectedRows > 0) {
                const instance = new Modal(this._database, this.tableName)
                instance.message = 'Row Deleted'

                const row = new Proxy(instance, {
                    set: (target, property, value) => {
                        if(property !== "fields"){
                            target["fields"][property] = value;
                            return true;
                        }
                    },
                    get: (target, property) => {
                        return target[property] || target["fields"][property]
                    },
                })

                return row 
            }
		})
	}

	save() {
		const { id, ...fieldsWithoutId } = this.fields;

		if(this.id) {
            return this._database.query(`UPDATE ${this.tableName} SET ? WHERE id = ?`, [fieldsWithoutId, id]).then((response) => {
                if(response.affectedRows > 0) {
                    return this.find(id)
                }
            })
        } else {

            return this._database.query(`INSERT INTO ${this.tableName} SET ?`, [fieldsWithoutId]).then((response) => {
                if(response.affectedRows > 0) {
                    return this.find(response.insertId)
                }
            })
		}
	}

	describe() {
	    return this._database.query(`DESCRIBE ${this.tableName}`).then((response) => response)
	}

	truncate() {
		return this._database.query(`TRUNCATE TABLE ${this.tableName}`).then((response) => console.log(response))
	}

	drop() {
		return this._database.query(`DROP TABLE ${this.tableName}`).then((response) => console.log(response))
	}
}

class Database {
	constructor(config = { host: process.env.HOST, user: process.env.DB_USER, password: process.env.PASSWORD, database: process.env.DATABASE, waitForConnections: true, connectionLimit: 10, queueLimit: 0 }) {
	    console.log("CONFIG", config)
	    if(!Database.instance) {
            this.connection = mysql.createPool(config)

            Database.instance = this
        }
        return Database.instance
    }

	query(sql, args) {
		return new Promise((resolve, reject) => {
			this.connection.getConnection((err, connection) => {
				if (err) {
					return reject(err);
				}

				connection.query(sql, args, (err, results) => {
					connection.release();

					if (err) {
						return reject(err);
					}

					resolve(results);
				});
			});
		});
	}

    modal(tableName) {
		const object = new Modal(this, tableName);
		const schema = Schema(this, tableName)
		const queryBuilder = QueryBuilder(this, tableName) 

        const instance = new Proxy(object, {
            set: (target, property, value) => {
                if(property !== "fields"){
                    target["fields"][property] = value;
                    return true;
                }
            },
            get: (target, property) => {
                if(property in target) {
                    return target[property] || target["fields"][property];
                }

                if(typeof schema[property] === 'function') {
                    return schema[property].bind(schema)
                }

                if(typeof queryBuilder[property] === 'function') {
                    return queryBuilder[property].bind(queryBuilder)
                }
            },
        });

		return instance;
	}

	close() {
	    this.connection.end((err) => {
			if (err) {
				console.error("Error closing MySQL pool:", err);
			} else {
				console.log("MySQL pool closed");
			}
		});
	}
}

module.exports = new Database();

