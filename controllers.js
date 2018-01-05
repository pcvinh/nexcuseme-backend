var config = require('./__config.js');
var db = require('./__mongodb.js');
var logger = require('./__logging.js');
var bearer = require('./__bearer.js');

const {
    ObjectId
} = require('mongodb'); // or ObjectID 
// or var ObjectId = require('mongodb').ObjectId if node version < 6

var request = require('request');
var hash = require('password-hash'); // Importance Note: will try to use bcrypt later.
var _ = require('lodash');

signin = function(email, password, callback) {
    var condition = {
        email: email
    };
    db.query('USER', condition, 1, function(err, result) {
        if (err) return callback(err);

        if (result.length > 0) { // SIGN IN. check password. 
            if (hash.verify(password, result[0].password)) { // sign in success. return token.
                if (result[0].name) { // Sign IN success
                    var access_token = bearer.sign({
                        _id: result[0]._id,
                        name: result[0].name,
                        avatar: result[0].avatar
                    });
                    callback(null, {
                        ret: 0,
                        access_token: access_token,
                        _id: result[0]._id,
                        avatar: result[0].avatar,
                        name: result[0].name
                    });
                } else { // There is no name, need to register name
                    callback(null, {
                        ret: 1,
                        _id: result[0]._id
                    });
                }
            } else { // sign in false.
                callback(null, {
                    ret: 2
                });
            }
        } else { // there is no record for this user, SIGN UP then login by return token
            var hash_password = hash.generate(password);
            _signup(email, hash_password, callback);
        }
    });
}

_signup = function(email, hash_password, callback) {
    var request_data = {
        email: email,
        password: hash_password
    };
    db.insert('USER', request_data, function(err, request_result) {
        if (err) return callback(err);

        callback(null, {
            ret: 1,
            _id: request_result.insertedIds[0]
        });
    });
}

signup_basic_name = function(_id, name, callback) {
    var condition = {
        _id: new ObjectId(_id)
    };
    var update = {
        $set: {
            name: name
        }
    };
    db.update('USER', condition, update, {}, function(err, result) {
        if (err) return callback(err);

        var access_token = bearer.sign({
            _id: _id,
            name: name
        });
        callback(null, {
            ret: 0,
            access_token: access_token,
            _id: _id,
            name: name
        });
    });
}

signup_basic_avatar = function(user, avatar, callback) {
    var condition = {
        _id: new ObjectId(user._id)
    };
    var update = {
        $set: {
            avatar: avatar
        }
    };

    db.update('USER', condition, update, {}, function(err, result) {
        if (err) return callback(err);

        var access_token = bearer.sign({
            _id: user._id,
            name: user.name,
            avatar: avatar
        });
        callback(null, {
            ret: 0,
            access_token: access_token,
            _id: user._id,
            name: user.name,
            avatar: avatar
        });
    });
}

//////////////////////////////////////////////////////
getStart = function(user, from_id, callback) {
    var limit = null;
    if (from_id) {
        var condition = {
            receiver_id: new ObjectId(user._id),
            _id: {
                $gt: new ObjectId(from_id)
            }
        };
    } else {
        var condition = {
            receiver_id: new ObjectId(user._id)
        };
        limit = 10;
    }

    db.query('MESSAGES', condition, limit, function(err, result) {
        if (err) return callback(err);

        callback(null, result);
    });
}

getThreadsBackup = function(user, callback) {
    var threads;
    if (threads) {
        var result = {
            ret: 0,
            threads: threads
        };
    } else {
        var result = {
            ret: 1
        };
    }

    callback(null, result);
}

getLastMessage = function(user, callback) {
    var condition = {
        $query: {
            receiver_id: new ObjectId(user._id)
        },
        $orderby: {
            _id: -1
        }
    };
    db.query('MESSAGES', condition, 1, function(err, result) {
        if (result[0]) {
            var result = {
                ret: 1,
                last_msg: result[0]
            };
        } else {
            var result = {
                ret: 1,
                last_msg: {
                    _id: 0
                }
            };
        }
        callback(null, result);
    });
}

getNotification = function(user, filter, loc, from_id, callback) {
    var limit = null;
    if (from_id && from_id != 'null') {
        var condition = {
            $query: {
                "requestor._id": {
                    $ne: new ObjectId(user._id)
                },
                _id: {
                    $gt: new ObjectId(from_id)
                }
            },
            $orderby: {
                _id: -1
            }
        };
        limit = 20;
    } else {
        var condition = {
            $query: {
                "requestor._id": {
                    $ne: new ObjectId(user._id)
                }
            },
            $orderby: {
                _id: -1
            }
        };
        limit = 30;
    }

    db.query('REQUESTS', condition, null, function(err, result) {
        callback(null, result);
    });
}

sendRequest = function(user, data, callback) {
    var time_now = new Date();
    var request_data = {
        requestor: {
            _id: new ObjectId(user._id),
            name: user.name,
            avatar: user.avatar
        },
        msg: data.msg,
        cat: data.cat,
        subcat: data.subcat,
        label: data.label,
        expiry: data.expiry,
        others: data.others,
        tx: data.tx,
        time: time_now
    };
    db.insert('REQUESTS', request_data, function(err, request_result) {
        callback(null, {
            ret: 0,
            _id: request_result.insertedIds[0],
            time: time_now
        });
    });
}

sendResponse = function(user, data, callback) {
    var time_now = new Date();
    var transaction_response_data = {
        responder: {
            _id: new ObjectId(user._id),
            name: user.name,
            avatar: user.avatar
        },
        request_id: new ObjectId(data.request_id),
        tx: data.tx,
        state: 0
    };
    var message_response_data = {
        sender_id: new ObjectId(user._id),
        receiver_id: new ObjectId(data.requestor_id),
        msg: data.msg,
        tx0: {
            start: {
                request_id: new ObjectId(data.request_id),
                responder: {
                    _id: new ObjectId(user._id),
                    name: user.name,
                    avatar: user.avatar
                }
            }
        }
    };
    db.insert('TRANSACTIONS', transaction_response_data, function(err, tx_result) {
        tx_id = tx_result.insertedIds[0];
        message_response_data.tx_id = new ObjectId(tx_id);
        message_response_data.time = time_now;
        db.insert('MESSAGES', message_response_data, function(err, msg_result) {
            callback(null, {
                ret: 0,
                _id: msg_result.insertedIds[0],
                tx_id: tx_id,
                time: time_now
            });
        });
    });
}

sendMessage = function(user, data, callback) {
    var time_now = new Date();
    msg_data = {
        tx_id: new ObjectId(data.tx_id),
        sender_id: new ObjectId(user._id),
        receiver_id: new ObjectId(data.receiver_id),
        msg: data.msg,
        time: time_now
    };
    db.insert('MESSAGES', msg_data, function(err, msg_result) {
        callback(null, {
            ret: 0,
            _id: msg_result.insertedIds[0],
            time: time_now
        });
    });
}

//////////////////////////////////////
module.exports = {
    getStart: getStart,
    getThreadsBackup: getThreadsBackup,
    getLastMessage: getLastMessage,
    getNotification: getNotification,

    sendRequest: sendRequest,
    sendResponse: sendResponse,
    sendMessage: sendMessage,

    signin: signin,
    signup_basic_name: signup_basic_name,
    signup_basic_avatar: signup_basic_avatar,
}