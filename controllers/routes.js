var domains = require('../util/domains');

module.exports = function(app) {
	app.get('/about', function(req, res) {
		res.render('about/index', {});
	});

	app.get('/family', function(req, res) {
		res.render('family/index', {});
	});
};