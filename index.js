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

mongoose.Promise = global.Promise;
const options = {
	 useNewUrlParser: true
 }
mongoose.connect(keys.mongoURI, options);

const app = express();
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

require("./routes/main")(app);
require("./routes/tickerRoutes")(app);



const PORT = process.env.PORT || 5000;
app.listen(PORT);