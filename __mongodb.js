/* __mongodb wrapper */
var config = require('./__config.js');
var logger = require('./__logging.js');

var MongoClient = require('mongodb').MongoClient;
const conString = 'mongodb://' + config.NOSQL_DB_USERNAME + ':' + config.NOSQL_DB_PASSWORD + '@' + config.NOSQL_DB_HOST + '/' + config.NOSQL_DB_NAME;
var db;


var _handleError = function(err) {
    if (!err) return false;

    logger.error('Error from query __mongodb.js: ' + err);
    return true;
};

MongoClient.connect(conString, function(err, database) {
    if (_handleError(err)) return;

    db = database;
    console.log("NOSQL Database connected.");
});


// Query an object from database
query = function(collection, condition, lim, callback) {
    if (lim) {
        db.collection(collection).find(condition).limit(lim).toArray(function(err, result) {
            callback(null, result);
        });
    } else {
        db.collection(collection).find(condition).toArray(function(err, result) {
            callback(null, result);
        });
    }
}

// Insert an object to database
insert = function(collection, object, callback) {
    db.collection(collection).insert(object, function(err, result) {
        if (_handleError(err)) return callback(err);

        callback(null, result);
    });
}

update = function(collection, condition, object, options, callback) {
    db.collection(collection).update(condition, object, options, function(err, result) {
        if (_handleError(err)) return callback(err);

        callback(null, result);
    });
}

module.exports = {
    query: query,
    insert: insert,
    update: update,
}