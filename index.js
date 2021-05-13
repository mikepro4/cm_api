const express = require("express");
const passport = require('passport');
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const keys = require("./config/keys");
const fileUpload = require("express-fileupload")
const PUBLIC_DIR = "public";
const STATIC_DIR = "static";
const timeout = require('connect-timeout')

const { v4: uuidv4 } = require('uuid');

mongoose.Promise = global.Promise;
const options = {
	 useNewUrlParser: true,
     poolSize: 1000
 }
mongoose.connect(keys.mongoURI, options,
    function(err){
        if(err){
            throw err
        }
});

const app = express();
app.use(timeout('15s'))
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cors());
app.use(
	cookieSession({
		maxAge: 30 * 24 * 60 * 60 * 1000,
		keys: [keys.cookieKey]
	})
);

app.use(fileUpload());
app.use(express.static(STATIC_DIR));
app.use(express.static(PUBLIC_DIR));

const Authentication = require('./controllers/authentication');
const passportService = require('./services/passport');
const { isObjectLike } = require("lodash");

const requireAuth = passport.authenticate('jwt', { session: false });
const requireSignin = passport.authenticate('local', { session: false });

app.use(passport.initialize());
app.use(passport.session());

app.get('/', requireAuth, function(req, res) {
  res.send({ message: 'Super secret code is ABC123' });
});
app.post('/signin', requireSignin, Authentication.signin);
app.post('/signup', Authentication.signup);

require("./models/Ticker");
require("./models/Proxy");
require("./models/ProxyLog");
require("./models/Video");
require("./models/VideoLog");
require("./models/Channel");
require("./models/ChannelLog");
require("./models/Group");
require("./models/Scraping");

require("./models/Connection");
require("./models/Notification");
require("./models/Post");
require("./models/Wall");

require("./routes/main")(app);
require("./routes/tickerRoutes")(app);
require("./routes/proxyRoutes")(app);
require("./routes/proxyLogRoutes")(app);
require("./routes/videoRoutes")(app);
require("./routes/videoLogRoutes")(app);
require("./routes/channelRoutes")(app);
require("./routes/channelLogRoutes")(app);
require("./routes/groupRoutes")(app);
require("./routes/scrapingRoutes")(app);
require("./routes/prices")(app);
require("./routes/profileRoutes")(app);
require("./routes/postsRoutes")(app);
require("./routes/publicTickerRoutes")(app);
require("./routes/publicVideoRoutes")(app);
require("./routes/connectionsRoutes")(app);

require('./controllers/csvimport')(app);


const PORT = process.env.PORT || 5000;
const server = app.listen(PORT);

const io = require('socket.io')(server, {
	cors: {
	  origin: '*',
    },
    pingTimeout: 25000
})

io.on('connection',(socket)=>{
    socket.emit('hello',(data)=>{     
        return('hello')
    })

    socket.on('join-room', (userData) => {
        const { roomID, userID } = userData;
        console.log(userData)
        console.log("join room")
        io.emit('new-user-connect', userData);
        
        socket.on('disconnect', () => {
            io.emit('user-disconnected', userID);
        });
        socket.on('broadcast-message', (message) => {
            io.emit('new-broadcast-messsage', {...message, userData});
        });
        socket.on('reconnect-user', () => {
            io.emit('new-user-connect', userData);
        });
        socket.on('display-media', (value) => {
            io.emit('display-media', {userID, value });
        });
        socket.on('user-video-off', (value) => {
            io.emit('user-video-off', value);
        });
    });

})

require("./scraping/search_results") (io);
