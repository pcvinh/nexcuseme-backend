var config = require('./__config.js');
var logger = require('./__logging.js');

var jsonwebtoken = require('jsonwebtoken');

var _handleError = function(err) {
	if(!err) return false;
	
	logger.error('Error at Notification modul: ' + err);
	return true;
};

sign = function(object) {
	return jsonwebtoken.sign(object, config.JWT_SECRET)
}

decode = function(token, callback) {
	jsonwebtoken.verify(token, config.JWT_SECRET, function(err, decoded) {
		if(_handleError(err)) return callback(err, null);		
		
		return callback(null, decoded);
	});
	
}

module.exports = {
	sign : sign,
	decode : decode
}