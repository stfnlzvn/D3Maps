var promise = require('bluebird'); //   A popular promise library used for PSQL
var options = { promiseLib: promise }; //Overrides express's default (ES6) promise library
var c = require('./.auth');
const path = require('path');

var pgp = require('pg-promise')(options); //    PostgreSQL integration library

var cn = {
	host: 	c.host,
	port: 	c.port,
	database: c.dbname,
	user: 	c.user,
	password: c.password
};

var db = null;

db = pgp(cn); 
// Helper for linking to external query files:
function sql(file) {
    const fullPath = path.join(__dirname, file);
    return new pgp.QueryFile(fullPath, {minify: false, params: { dir: path.resolve(__dirname, '..')}});
}

// Create a QueryFile globally, once per file:
const sql_load = sql('./sql.sql');
//console.log('Data loading started');
db.any(sql_load)
  .then(user=> {
      console.log('Data loading finished');
  })
  .catch(error=> {
      if (error instanceof pgp.errors.QueryFileError) {
      	console.log(error);
          // => the error is related to our QueryFile
      }
  });

var ddb = function() {
	if (db == null) {
		db = pgp(cn);   // DB instance
	}
	return db;
};

exports.db = ddb();
