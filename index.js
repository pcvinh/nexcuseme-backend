var nex = require('./controllers.js');
var logger = require('./__logging.js');
var bearer = require('./__bearer.js');

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs');

var jsonwebtoken = require('jsonwebtoken');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;

app.set('port', (process.env.PORT || 3000));
app.use(bodyParser.json({
    strict: false
})); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing 

app.use(express.static(__dirname + '/public')); // for public folder

app.all('/', function(req, res, next) { // for cross domain allow
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

///////////// passport.js init ////////////////////////
passport.use(new LocalStrategy(function(username, password, cb) {
    nex.signin(username, password, function(err, user) {
        if (err) {
            return cb(err);
        }

        if (!user) {
            return cb(null, false);
        }

        if (user.password != password) {
            return cb(null, false);
        }

        return cb(null, user);
    });
}));

passport.use(new BearerStrategy(function(token, cb) {
    bearer.decode(token, function(err, user) {
        if (err) {
            return cb(err);
        }

        if (!user) {
            return cb(null, false);
        }

        return cb(null, user);
    });
}));

/****************Login & Register *******************/

app.get('/signinup', function(req, res) { // no need to authenticate
    var email = req.query.email,
        password = req.query.password;

    nex.signin(email, password, function(err, result) {
        if (err) {
            res.jsonp('there is error');
        } else {
            res.jsonp(result);
        }
    });
});

app.post('/signup_basic_name', function(req, res) { // no need to authenticate
    var _id = req.body._id,
        name = req.body.name;
    nex.signup_basic_name(_id, name, function(err, result) {
        if (err) {
            res.jsonp('there is error');
        } else {
            res.jsonp(result);
        }
    });
});

var upload = multer({
    dest: './public/uploads/'
});
app.post('/signup_basic_avatar', passport.authenticate('bearer', {
    session: false
}), upload.single('avatar'), function(req, res) {
    var user = req.user;
    logger.info('[POST]/signup_basic_avatar ({user : ' + JSON.stringify(user) + '})', 0);
    var filesUploaded = 0;

    if (req.file) {
        var avatar = req.file.filename;
        nex.signup_basic_avatar(user, avatar, function(err, result) {
            if (err) {
                res.jsonp('there is error');
            } else {
                res.jsonp(result);
            }
        });
    }

});

app.post('/signup_detail', passport.authenticate('bearer', {
    session: false
}), function(req, res) {

});

app.post('/signup_contact', passport.authenticate('bearer', {
    session: false
}), function(req, res) {

});

app.post('/signup_others', passport.authenticate('bearer', {
    session: false
}), function(req, res) {

});

app.get('/init', passport.authenticate('bearer', {
    session: false
}), function(req, res) {
    var user = req.user;

    nex.init(user, function(err, result) {
        if (err) {
            res.jsonp('there is error');
        } else {
            res.jsonp(result);
        }
    });
});

/*************** Init flow API ***********************/

app.get('/getStart', passport.authenticate('bearer', {
    session: false
}), function(req, res) {
    var user = req.user,
        from_id = req.query.from_id;
    if (from_id == 0)
        from_id = null;
    nex.getStart(user, from_id, function(err, result) {
        if (err) {
            res.jsonp('there is error');
        } else {
            res.jsonp(result);
        }
    });
})

app.get('/getStartFromBackup', passport.authenticate('bearer', {
    session: false
}), function(req, res) {
    var user = req.user;
    nex.getThreadsBackup(user, function(err, result) {
        if (err) {
            res.jsonp('there is error');
        } else if (result.ret == 1) { // there is no Backup.
            nex.getLastMessage(user, function(err, result) {
                res.jsonp(result);
            });
        } else {
            res.jsonp(result);
        }
    });
})

app.get('/getNotification', passport.authenticate('bearer', {
    session: false
}), function(req, res) {
    var user = req.user,
        from_id = req.query.from_id,
        filter = {},
        loc = {};
    nex.getNotification(user, filter, loc, from_id, function(err, result) {
        if (err) {
            res.jsonp('there is error');
        } else {
            res.jsonp(result);
        }
    });
})

/*****************Main flow APIs: ********************/

app.post('/sendRequest', passport.authenticate('bearer', {
    session: false
}), function(req, res) {
    var user = req.user;
    var data = req.body;
    nex.sendRequest(user, data, function(err, result) {
        res.jsonp(result);
    })
});

app.post('/sendResponse', passport.authenticate('bearer', {
    session: false
}), function(req, res) {
    var user = req.user;
    var data = req.body;
    nex.sendResponse(user, data, function(err, result) {
        res.jsonp(result);
    })
});

app.post('/sendMessage', passport.authenticate('bearer', {
    session: false
}), function(req, res) {
    var user = req.user;
    var data = req.body;
    nex.sendMessage(user, data, function(err, result) {
        res.jsonp(result);
    })
});


/**************************
 ** Webscoket  **
 **************************/

io.on('connection', function(socket) {
    /*var jwt = require('jsonwebtoken');
	var connections;
	if(socket.handshake.query.connections)
		connections=JSON.parse(socket.handshake.query.connections);
	else 
		return;
	var channels = [];
	for(var i=0; i < connections.length; i++) {
		var decoded = jwt.decode(connections[i].token);
		console.log(connections[i].token + " - " + decoded.ChannelId);
		
		var channelId = decoded.ChannelId;
		if(channelId) {
			pubsub.publish(decoded.ChannelId, { cmd : 0}); // ack STB to polling keep alive		
			channels.push(channelId + "_RC");		
		}
	}
		
    var tag;
	pubsub.subscribe(channels, function(err, Command) { // get the alive or revert command
			console.log(Command);
			socket.emit('alive', Command);
	}, function(err, t) {
		tag = t;
	});
	
	socket.on('disconnect', function(){
		pubsub.unsubscribe(tag);
	});*/

});


//////////////////////////////////////////

http.listen(app.get('port'), function() {
    logger.log("Node app is running at localhost: " + app.get('port'));
    logger.log("Running at folder: " + __dirname);
});