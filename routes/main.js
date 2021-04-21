const passport = require('passport');
const keys = require("../config/keys");
const requireAuth = passport.authenticate('jwt', { session: false });

const mongoose = require("mongoose");
const Proxy = mongoose.model("proxies");
const Ticker = mongoose.model("tickers");
const Video = mongoose.model("videos");
const Channel = mongoose.model("channels");
const Group = mongoose.model("groups");
const User = mongoose.model("user");

const Avatar = require('avatar-builder');
const cloudinary = require('cloudinary').v2;
let streamifier = require('streamifier');

const avatar = Avatar.githubBuilder(128);
const { v4: uuidv4 } = require('uuid');

const _ = require("lodash");

cloudinary.config({ 
	cloud_name: keys.cloudName, 
	api_key: keys.apiKey, 
	api_secret: keys.apiSecret
});

module.exports = app => {

	app.post(
		"/assign_avatar",
		requireAuth,
		(req, res) => {
			avatar.create(uuidv4()).then(
				buffer => {
					let cld_upload_stream = cloudinary.uploader.upload_stream(
						{
						  folder: "cashmachine/avatars"
						},
						function(error, result) {
							console.log(error, result);

							User.update(
								{
									_id: req.user._id
								},
								{
									$set: { avatar: result.url, avatarDefault: true }
								},
								async (err, info) => {
									if (err) res.status(400).send({ error: "true", error: err });
									if (info) {
										User.findOne({ _id: req.user._id }, async (err, user) => {
											if (user) {
												res.json({ success: "true", info: info, user: user });
											}
										});
									}
								}
							);
						}
					);
					streamifier.createReadStream(buffer).pipe(cld_upload_stream);
				}
			);
		}
	);

	app.get(
        "/user_details",
        requireAuth,
		(req, res) => {
            res.send(req.user)
		}
	);

	app.post(
		"/update_username",
		requireAuth,
		(req, res) => {
			if(/[^a-zA-Z0-9]/.test(req.body.username.toLowerCase())) {
				res.json({ success: "Don't even try"});
			} else {
				User.update(
					{
						_id: req.user._id
					},
					{
						$set: { username: req.body.username.toLowerCase() }
					},
					async (err, info) => {
						if (err) res.status(400).send({ error: "true", error: err });
						if (info) {
							User.findOne({ _id: req.user._id }, async (err, user) => {
								if (user) {
									res.json({ success: "true", info: info, user: user });
								}
							});
						}
					}
				);
			}
		}
	)

	app.post("/validate_username", async (req, res) => {
		const { username } = req.body;
		return User.find(
			{
				"username": { $eq: username.toLowerCase() }
			},
			async (err, result) => {
				if (!_.isEmpty(result)) return res.status(500).send("Already exists");
				res.json({ status: "ok" });
			}
		);
	});

	

	// ===========================================================================

	app.get("/collections/counts", async (req, res) => {
		const { criteria, sortProperty, offset, limit, order } = req.body;
		let adjustSortProperty 
		if (sortProperty == "createdAt") {
			adjustSortProperty = sortProperty
		} else {
			adjustSortProperty = "metadata." + sortProperty
		}
		const queryProxies = Proxy.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		const queryTickers = Ticker.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);
			
		const queryVideos = Video.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);
		
		const queryChannels = Channel.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		const queryGroups = Group.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[
				queryProxies.countDocuments(), 
				queryTickers.countDocuments(), 
				queryVideos.countDocuments(),
				queryChannels.countDocuments(),
				queryGroups.countDocuments()
			]
		).then(
			results => {
				return res.json({
					proxies: results[0],
					tickers: results[1],
					videos: results[2],
					channels: results[3],
					groups: results[4]
				});
			}
		);
	});

	
};

const buildQuery = criteria => {
	const query = {};

	return query
};


