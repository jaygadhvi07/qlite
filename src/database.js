const mysql = require("mysql2");

const database = (poolConfig = {
	host: "localhost",
	user: "root",
	password: "Mysql!password1",
	database: "dbpackage",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
}) => {
    return mysql.createPool(poolConfig);
}

class Modal {
	constructor(database, tableName) {
		this._database = database;
		this.tableName = tableName;
		this.fields = {};
		this.message = ''
		this.id = null;
		this.schema = []
		this.timestamp = false;
	}

	create() {
	    const schema = `CREATE TABLE ${this.tableName} (`+this.schema.join(", ") + `${this.timestamp ? ', created TIMESTAMP, updated TIMESTAMP' : ''})`

	    console.log("SCHEMA", schema)

	    return this._database.query(schema).then((response) => {
	        console.log("Response", response)
	    })
    }

    integer(column, PK = false, increment = false) {
        this.schema.push(`${column} INT${increment ? ' AUTO_INCREMENT': ''}${PK ? ' PRIMARY KEY' : ''}`)
        return this.schema
    }

    string(column, size = '255', PK = false) {
        this.schema.push(`${column} VARCHAR(${size})${PK ? ' PRIMARY KEY' : ''}`)
        return this.schema
    }

    text(column) {
        this.schema.push(`${column} TEXT`)
        return this.schema
    }

    enumm(column, values = []) {
        console.log("VALUES", values)
        this.schema.push(`${column} ENUM(${values.map(value => `'${value}'`).join(', ')})`)
        return this.schema
    }

    json(column) {
        this.schema.push(`${column} JSON`)
        return this.schema
    }

    bool(column) {
        this.schema.push(`${column} BOOLEAN`)
        return this.schema
    }

	getAll() {
		return this._database.query(`SELECT * FROM ${this.tableName}`).then((response) => response)
	}

    primary() {
        return this._database.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${this.tableName}' AND COLUMN_KEY = 'PRI'`).then((response) => response) 
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
	constructor() {

	}

	query(sql, args) {
		return new Promise((resolve, reject) => {
			database().getConnection((err, connection) => {
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

        const instance = new Proxy(object, {
            set: (target, property, value) => {
                if(property !== "fields"){
                    target["fields"][property] = value;
                    return true;
                }
            },
            get: (target, property) => {
                return target[property] || target["fields"][property];
            },
        });

		return instance;
	}

	close() {
		database().end((err) => {
			if (err) {
				console.error("Error closing MySQL pool:", err);
			} else {
				console.log("MySQL pool closed");
			}
		});
	}
}

module.exports = new Database();

