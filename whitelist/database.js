// const mysql = require('mysql');
const mysql2 = require('mysql2/promise');
const config = require('../config.json');

const sql = {};

var connection = mysql2.createConnection({
    host: config.db.host,
    database: config.db.database,
    user: config.db.username,
    password: config.db.password
});

async function connect() {
    if(connection && connection.state !== 'disconnected')
        return connection;

    const con = await mysql2.createConnection({
        host: config.db.host,
        database: config.db.database,
        user: config.db.username,
        password: config.db.password
    });
    console.log("Conexão com Banco de dados!");

    connection = con;
    
    return con;
}

sql.connect = function() {
    // connection.connect(function(err) {
    //     if (err){ 
    //         console.log("Banco de dados: ERRO!");
    //         throw err;
    //     }
    //     console.log("Banco de dados: CONECTADO!");
    // });

    // connection.end();
}

sql.whitelistUSerId = async function(userId) {
    const conn = await connect();
    const id = parseInt(userId);
    if(id > 0) {
        var sql = `UPDATE vrp_users SET whitelisted = 1 WHERE id = ${id}`;
        conn.execute(sql);
    } else {
        console.error(`ID do usuário deve ser numerico: "${userId}"`);
    }
}

sql.searchIdFivemByIdDiscord = async function(userId) {
    const conn = await connect();
    const id = parseInt(userId);
    if(id > 0) {
        var sql = `SELECT user_id FROM vrp_user_ids WHERE identifier = 'discord:${userId}'`;
        
        let [[user_id]] = await conn.execute(sql);

        return user_id;
    }

}


module.exports = sql;
