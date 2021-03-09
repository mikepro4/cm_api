const _ = require("lodash");
const mongoose = require("mongoose");
const Group = mongoose.model("groups");

module.exports = app => {

	// ===========================================================================

	app.post("/groups/search", async (req, res) => {
		const { criteria, sortProperty, offset, limit, order } = req.body;
		let adjustSortProperty 
		if (sortProperty == "createdAt") {
			adjustSortProperty = sortProperty
		} else {
			adjustSortProperty = "metadata." + sortProperty
		}
		const query = Group.find(buildQuery(criteria))
			.sort({ [adjustSortProperty]: order })
			.skip(offset)
			.limit(limit);

		return Promise.all(
			[query, Group.find(buildQuery(criteria)).countDocuments()]
		).then(
			results => {
				return res.json({
					all: results[0],
					count: results[1],
					offset: offset,
					limit: limit
				});
			}
		);
	});

	// ===========================================================================

	app.post("/groups/create", async (req, res) => {
		const group = await new Group({
			createdAt: new Date(),
			metadata: req.body.metadata,
		}).save();
		res.json(group);
	});

	// ===========================================================================

	app.post("/groups/update", async (req, res) => {
		Group.update(
			{
				_id: req.body.groupId
			},
			{
				$set: { metadata: req.body.newGroup }
			},
			async (err, info) => {
				if (err) res.status(400).send({ error: "true", error: err });
				if (info) {
					Group.findOne({ _id: req.body.groupId }, async (err, group) => {
						if (group) {
							res.json({ success: "true", info: info, group: group });
						}
					});
				}
			}
		);
	});

	// ===========================================================================

	app.post("/groups/delete", async (req, res) => {
		Group.remove({ _id: req.body.groupId }, async (err) => {
			if (err) return res.send(err);
			res.json({
				success: "true",
				message: "deleted group"
			});
		});
	});

	// ===========================================================================

	app.post("/groups/details", async (req, res) => {
		Group.findOne({ _id: req.body.groupId }, async (err, group) => {
			if (group) {
				res.json(group);
			}
		});
	});

};

const buildQuery = criteria => {
	const query = {};

	return query
};
