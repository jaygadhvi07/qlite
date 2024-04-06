const mysql = require('mysql2')
class Schema {
    constructor(database, tableName) {
        this._database = database
        this.tableName = tableName
        this.schema = []
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

    timestamp(column) {
        this.schema.push(`${column} TIMESTAMP`)
        return this.schema
    }
    
    primary() {
        return this._database.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${this.tableName}' AND COLUMN_KEY = 'PRI'`).then((response) => response) 
    }

    hasOne() {

    }

    hasMany() {

    }

    hasManyToMany(jsonObj) {
        for(const [key, value] of Object.entries(jsonObj)) {
            console.log(`${key}: ${value}`)
            if(key === 'CASCADE_DELETE') {
                this.schema.push(`FOREIGN KEY (${value}) REFERENCES ${key}(${value})`)
            }

            if(key === 'CASCADE_UPDATE') {
                this.schema.push(`FOREIGN KEY (${value}) REFERENCES ${key}(${value})`)
            }
        }
    }

    hasManyToOne() {

    }

    create() {
	    const schema = `CREATE TABLE ${this.tableName} (`+this.schema.join(", ") + `)`;

	    console.log("SCHEMA", schema)

	    /*return this._database.query(schema).then((response) => {
	        console.log("Response", response)
	    })*/
    }

}

module.exports = (database, tableName) => new Schema(database, tableName)
