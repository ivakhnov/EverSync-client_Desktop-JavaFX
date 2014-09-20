//
// Loading installed plugins
//
// Version 1.0
//
// Evgeni Ivakhnov
// https://github.com/ivakhnov
// 15 September 2014
//
//

// Load the style sheets of the installed plugins (to display the associated icons for example).
// Use the config file to get the path to the folder with installed plugins.

define(["config", "modules/pathAdapterOs"], function(config, pathAdapter) {

	function tryInstallFile(fileFullPath){
		fileFullPath = pathAdapter.filePathToOs(fileFullPath);
		var extension = fileFullPath.split(".").pop();

		switch(extension) {
			case "js":
				var script = document.createElement('script');
				script.setAttribute('type', 'text/javascript');
				//script.setAttribute('onload', 'scriptLoaded');
				script.setAttribute('src', fileFullPath);
				document.getElementsByTagName('head')[0].appendChild(script);
			break;
			case "css":
				var link = document.createElement('link');
				link.setAttribute('type', 'text/css');
				link.setAttribute('rel', 'stylesheet');
				link.setAttribute('href', fileFullPath);
				document.getElementsByTagName('head')[0].appendChild(link);
			break;
			default:
				return "Skip the file";
		}
	};

	return {

		load: function() {

			var pluginFolders = FileSystem.getDirListing(config.PluginsFoldersPath);
			// Loop through folders to select files
			if(pluginFolders !== null) {
				for (var i=0; i<pluginFolders.length; i++){
					var pluginFolder = pluginFolders[i];
					if (pluginFolder.isDirectory()) {
						var pluginFiles = FileSystem.getDirListing(pluginFolder.getAbsolutePath());
						for(var x=0; x<pluginFiles.length; x++) {
							var el = pluginFiles[x];
							var fullpath = el.getAbsolutePath();
							tryInstallFile(fullpath);
						}
					}
				}
			}
		}
	};
});