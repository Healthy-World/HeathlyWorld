var app = 
{
	settings: {},
	
	baseInitializeContext: function() {
        var getPath = function() {
            return window.location.pathname.toLowerCase();
        };

        var baseUrl = function(url) {
            return url.replace(/[0-9s/]/g, '');
        };

        var path = getPath();

        // top nav bar selection based on url
        var links = $('.navbar ul.nav > li > a');
        for (var i = 0; i < links.length; i++) {
            var link = $(links[i]);
            if (baseUrl(link.attr('href')) == baseUrl(path)) {
                link.parent().addClass('selected');
            }
        }
	}
}

$(document).ready(function() {
    app.baseInitializeContext();
});