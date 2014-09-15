//
// Configuration file
//
// Version 1.0
//
// Evgeni Ivakhnov
// https://github.com/ivakhnov
// 12 September 2014
//
//

define(function(require) {

	// Initialization
	var dirArray = window.location.pathname.split('/');
	dirArray.splice(dirArray.length - 3);
	var directory = "";
	for (i = 0; i < dirArray.length; i++) {
		directory += "/";
		directory += dirArray[i];
	};

	return {
		AppRootPath : directory,
		PluginsFoldersPath : directory + "/installed_plugins"
	};

});