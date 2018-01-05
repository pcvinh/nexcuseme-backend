var config = require('./__config.js');

var amqp = require('amqplib/callback_api');
var conn;
var ch;
var ex = "direct_ex";
amqp.connect('amqp://' + config.RABBITMQ_SERVER, function(err, conn) {
	if(err) {
		console.log(err);
		return;
	}
	conn = conn;
	conn.createChannel(function(err, channel) {
		ch = channel;
	});
});

publish = function(channel, message) {
	var severity = channel;
    var msg = new Buffer(JSON.stringify(message));

    ch.assertExchange(ex, 'direct', {durable: false, autoDelete : true}, function(err, ok) {
		ch.publish(ex, severity, msg);
	});
}

subscribe = function(c , f, callback) {
	var channels;
	if(typeof c === 'string') {
		channels = [c];
	} else {
		channels = c;
	}
		
	ch.assertQueue('', {exclusive: true, autoDelete: true}, function(err, q) {
		for(var i=0; i < channels.length; i++) {
			var severity = channels[i];
			ch.assertExchange(ex, 'direct', {durable: false, autoDelete : true});
			ch.bindQueue(q.queue, ex, severity);
		}
		ch.consume(q.queue, function(msg) {			
			f(null, JSON.parse(msg.content.toString()));
		}, {noAck: true}, function(err, ok) {
			callback(err, ok.consumerTag);
		});
		
	});
}

unsubscribe = function(consumerTag) {
	ch.cancel(consumerTag);
}

module.exports = {
	publish : publish,
	subscribe : subscribe,
	unsubscribe :unsubscribe
}