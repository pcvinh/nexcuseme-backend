/* __mysql wrapper */

var config = require('./__config.js');
var logger = require('./__logging.js');

var mysql = require('mysql');
var pool  = mysql.createPool({
  host            : config.DB_HOST,
  user            : config.DB_USERNAME,
  password        : config.DB_PASSWORD,
  database        : config.DB_NAME,  		
});

query = function(statement, callback) {
	try {
			var _handleError = function(err) {
				if(!err) return false;
				
				logger.error('Error from query ('+statement+'): ' + err);
				return true;
			};
			
			pool.query(statement, function(err, result) {
				if(_handleError(err)) return callback(err);
				
				callback(null, result);
			});
	} catch(err) {
		return callback(err);
	}
}

insert_or_update = function(table, id, array_fields, array_values, is_insert, callback) {
	try {
		var statement, i = 0;
		if(is_insert) {
			var insert_array_fields = "_id,"+array_fields[i], insert_array_values = id + ",'" + array_values[i] +"'";			
			i++;
			while(i < array_fields.length) {
				insert_array_fields += "," + array_fields[i];
				insert_array_values += ",'" + array_values[i] +"'";
				i++;
			}
			statement = "INSERT INTO " + table + "("+insert_array_fields+") VALUES("+insert_array_values+")";
		} else {
			var update_array = "";
			update_array += array_fields[i] + " = '" + array_values[i] +"'";
			i++;
			while(i < array_fields.length) {
				update_array += " AND " + array_fields[i] + " = " + array_values[i];
				i++;
			}
			statement = "UPDATE " + table + " SET " + update_array + " WHERE _id = " + id;
		}

		var _handleError = function(err) {
			if(!err) return false;

			logger.error('Error from query ('+statement+'): ' + err);
			return true;
		};			
		
		pool.query(statement, function(err, result) {
			if(_handleError(err)) return callback(err);
			
			callback(null, result);
		});
	} catch(err) {
		return callback(err);
	}
}


module.exports = {
	query : query,
	insert_or_update : insert_or_update
}