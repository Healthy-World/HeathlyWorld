var domain = require('domain'),
    logger = require('./logger');

exports.handleRequestInDomain = function(req, res, handler) {
    var requestDomain = domain.create();
    requestDomain.add(req);
    requestDomain.add(res);

    requestDomain.on('error', function(err) {
        var reqDetails = {
            method: res.req.method,
            url: res.req.url,
            headers: res.req.headers
        };
        logger().error('Request processing failed:', '\n', reqDetails, '\n', err.stack);
        res.status(500).render('errors/500', {
            title: 'Internal server error'
        });
    });

    requestDomain.run(function() {
        handler();
    });
};