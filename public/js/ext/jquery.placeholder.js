(function($) {
	$(document).on('change keydown keypress input', '*[data-placeholder]', function() {
		if (this.textContent) {
			this.setAttribute('data-placeholder-content', 'true');
		} else {
			this.removeAttribute('data-placeholder-content');
		}
	});
})(jQuery);