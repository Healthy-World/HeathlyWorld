var dustHelpers = require('dustjs-helpers'); // it is not used but need to initialize custom helpers

exports.init = function(dust) {
    dust.helpers['eval'] = function (chunk, context, bodies, params) {
        var expression = '';
        chunk.tap(function (data) {
            expression += data;
            return '';
        }).render(bodies.block, context).untap();

        return chunk.write(eval(expression));
    };

    dust.helpers["i18n"] = function(chunk, context, bodies, params) {
        var translated = '';
        var prop = '';
        chunk.tap(function(data) {
            prop += data;
            return '';
        }).render(bodies.block, context).untap();

        if (prop && prop !== '') {
            var i18n = context.stack.head.i18n;
            if (typeof i18n !== 'undefined') {
                translated = i18n.__(prop);
            } else {
                translated = prop;
            }
        }
        return chunk.write(translated);
    }
};