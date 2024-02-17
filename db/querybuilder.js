const mysql = require('mysql2');

class QueryBuilder {
    constructor(database, tableName) {
        this._database = database
        this.tableName = tableName
    }

    distinct() {

    }

    where() {

    }

    orderby() {

    }

    like() {

    }
}

module.exports = new QueryBuilder()
