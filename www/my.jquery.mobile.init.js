	<!-- begin of scripts                  ************************ -->
	<!-- JQuery Mobile初始化代码，必须放在jquery.mobile-1.2.0.js之前  -->
	$(document).bind('mobileinit', function(){
		var theme = 'b';
		var object = localStorage.getItem('mysettings_theme_object');
		if (object == null) {
			theme = 'b';
		} else {
			try	{
				object = JSON.parse(object);
				if (object.theme == 0) theme = 'a';
				if (object.theme == 1) theme = 'f';
				if (object.theme == 2) theme = 'b';
				if (object.theme == 3) theme = 'c';
				if (object.theme == 4) theme = 'e';
			} catch(err) {
				//err when developer changed object struction
			}
		}		
		
		//apply overrides here
		// Page
		$.mobile.page.prototype.options.headerTheme  = theme;  // Page header only
		$.mobile.page.prototype.options.contentTheme = theme;
		$.mobile.page.prototype.options.footerTheme  = theme;

		// Listviews
		$.mobile.listview.prototype.options.headerTheme  = theme;  // Header for nested lists
		$.mobile.listview.prototype.options.theme        = theme;  // List items / content
		$.mobile.listview.prototype.options.dividerTheme = theme;  // List divider
		$.mobile.listview.prototype.options.splitTheme   = theme;
		$.mobile.listview.prototype.options.countTheme   = theme;
		$.mobile.listview.prototype.options.filterTheme  = theme;

	});

	<!-- end of scripts                    ************************ -->