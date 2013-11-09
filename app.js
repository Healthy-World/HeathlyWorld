var domain = require('domain'),
    logger = require('./util/logger');
var server = null;

var serverDomain = domain.create();
serverDomain.on('error', function(err) {
    logger().error('Server error:\n', err.stack);
    if (server) {
        server.close();
    }
    setTimeout(function() {
        process.exit(1); // exit with failure code
    }, 1000).unref();
});

serverDomain.run(function() {
    var express = require('express'),
        http = require('http'),
        path = require('path'),
        fs = require("fs"),
        dust = require('dustjs-linkedin'),
        cons = require('consolidate'),
        domainMiddleware = require('express-domain-middleware'),
        i18n = require('i18n'),
        config = require('./config');

    var app = express();

    i18n.configure({
        locales: ['en'],
        defaultLocale: 'en',
        directory: (__dirname + '/locales'),
        updateFiles: app.settings.env === 'development'
    });

    app.engine('dust', cons.dust);
    app.configure(function() {
        app.set('domain', config.get('domain'));
        app.set('port', process.env.PORT || config.get('port'));
        app.set('views', __dirname + '/views');
        app.set('view engine', 'dust');
        app.set('template_engine', 'dust');
        app.use(express.favicon());
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.cookieParser('wigglybits'));
        app.use(express.logger(app.settings.env !== 'production' ? 'dev' : 'default'));
        app.use(i18n.init);
        app.use(domainMiddleware);
        app.use(app.router);

        // Static resources
        var getStatic = function(dirname, age) {
            return express.static(path.join(__dirname, dirname), {
                maxAge: age
            });
        };

        var ageConstant = {
            hour: 1000 * 60 * 60
        };

        app.use(express.compress()); // compression of static files
        app.use('/imgs/', getStatic('public/imgs', ageConstant.hour));
        app.use('/css/', getStatic('public/css', ageConstant.hour));
        app.use('/js/', getStatic('public/js', ageConstant.hour));
        app.use('/views/', getStatic('public/views', ageConstant.hour));

        // Handle 404 error
        app.use(function(req, res, next) {
            if (req.flash) {
                res.locals.message = req.flash();
            }
            res.status(404).render('errors/404', {
                title: "Page not found"
            });
        });

        // Handle 500 error
        app.use(function(err, req, res, next) {
            var reqDetails = {
                method: req.method,
                url: req.url,
                headers: req.headers
            };
            logger().error('Request processing failed:', '\n', reqDetails, '\n', err.stack);
            res.status(err.status || 500).render('errors/500', {
                title: 'Internal server error'
            });
        });
    });

    app.locals.inspect = require('util').inspect;
    app.locals.serverEnv = app.settings.env;
    app.locals.assetsLibUrlBase = config.get('assetsLibUrlBase');
    app.locals.googleAnalyticsID = config.get('googleAnalyticsID');
    app.locals.sessionTokenCookieName = config.get('sessionTokenCookieName');
    app.locals.sessionUserCookieName = config.get('sessionUserCookieName');
    app.locals.i18n = i18n;

    fs.readdirSync("./controllers/").forEach(function(file) {
        try {
            require("./controllers/" + file)(app);
            logger().info(file, 'loaded.');
        } catch (e) {
            logger().error('error loading', file);
        }
    });

    require('./util/custom-dustjs-helpers').init(dust);

    // Initialize dust templates compiler
    require('opencare-duster').init(logger(), [
        function(templateContent) {
            // Pre-processor for translating i18n resources before compilation
            var i18nHelpers = templateContent.match(/\{@i18n\}.+?\{\/i18n\}/g) || [];
            for (var i = 0; i < i18nHelpers.length; i++) {
                var i18nHelper = i18nHelpers[i];
                var i18nProp = i18nHelper.replace(/\{.+?\}/g, '');
                while (templateContent.indexOf(i18nHelper) !== -1) {
                    templateContent = templateContent.replace(i18nHelper, i18n.__(i18nProp));
                }
            }
            return templateContent;
        }
    ]);

    server = http.createServer(app);
    server.listen(app.get('port'), function() {
        logger().info("Express server listening on port", app.get('port'), '(' + app.settings.env + ')');
    });
});