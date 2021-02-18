const passport = require('passport');
const requireAuth = passport.authenticate('jwt', { session: false });

module.exports = app => {
	app.get(
        "/user_details",
        requireAuth,
		(req, res) => {
			console.log(req.user, res.user)
		}
	);
};

