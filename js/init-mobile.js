jQuery( document ).bind( 'mobileinit', function(){
	jQuery.mobile.loader.prototype.options.text = "Cargando";
	jQuery.mobile.loader.prototype.options.textVisible = true;
	jQuery.mobile.loader.prototype.options.theme = "a";
	jQuery.mobile.loader.prototype.options.html = "";
	jQuery.mobile.ajaxEnabled = false;
//	jQuery.mobile.hashListeningEnabled = false;
//	jQuery.mobile.pushStateEnabled = false;
	jQuery.mobile.defaultPageTransition = 'fade';
/*	$.mobile.hashListeningEnabled = false;
    $.mobile.pushStateEnabled = true;
    $.mobile.changePage.defaults.changeHash = false;*/
});