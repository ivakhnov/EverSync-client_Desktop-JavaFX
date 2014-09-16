//
// jQuery File Tree Connector to plugin data sent from server
//
// Version 1.0
//
// Evgeni Ivakhnov
// https://github.com/ivakhnov
// 16 February 2014
//
//
//
// Output a list of connected files for jQuery File Tree
//


define(function() {
return {

	dirList: function(parentID, params, callback) {

		var plugin = params.root;
		var content = params.content;

		console.log("TEEEEST: " + JSON.stringify(params));
		console.log("TTTTTST: " + parentID);

		// Whether showing the list of all the plugins (initial rendering of a file tree),
		// or showing the linked files of one single plugin.
		// (Initially all the files from the request are like collapsed folders. Each 'folder' can be expanded
		// by clicking on it. So then this code will be executed on the files for this opened/expanded plugin)
		var dirFiles = (plugin == null) ? content : content[plugin];

		// Items can be files OR plugins. Depending on wheter this is the initial execution of the code
		// for a particular filetree, or it has been triggered by clicking on one of the collepsed plugin trees.
		var items = '';

		if(dirFiles !== null) {
			for (var i in dirFiles) {
				var el = dirFiles[i];
				var id = el.id;		// might be null if the element is a plugin folder
				var name = el.name;	// might be null if the element is a plugin
				var extension = (plugin == null) ? name : plugin;

				if (plugin == null) items += '<li id='+parentID+'_'+i+' class="plugin_'+i+' directory collapsed"><a href="#" rel="'+i+'">'+i+'</a></li>';
				else items += '<li id='+parentID+'_'+i+' class="file ext_'+extension+'"><a href="#" rel="">'+name+'</a></li>';
			}
		}

		var res = '<ul class="jqueryFileTree" style="display: none;">';
		res += items;
		res += '</ul>';

		callback(res);
	}
};
});