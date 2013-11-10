var ext = {
	track: function(e)
	{
		mixpanel.track($(e).attr('event'));
	}
}