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

	// Private

	function collapseDevicesPerFile(dirFiles) {
		var results = [];
		for(var x = 0; x < dirFiles.length; x++) {
			var file = dirFiles[x];
			var fileName = file["name"];
			var fileUri = file["uri"];
			var fileHostId = file["hostId"];

			var result = results.filter(function(obj) { //(obj["uri"] == fileUri) &&
				return ((obj["name"] == fileName) &&
						(obj["hostType"] == "EverSyncClient"));
			});
			// The filter returns an array, obviously
			if(result.length == 0) {
				var currHostId = file["hostId"];
				delete file["hostId"]; // Then delete one single id
				file["hostIds"] = [ currHostId ]; // And replace it with an array of id's
				// do the same for fileUri's
				var currUri = file["uri"];
				delete file["uri"];
				file["uris"] = [ currUri ];
				results.push(file);
			} else {
				result[0]["hostIds"].push(fileHostId);
				result[0]["uris"].push(fileUri);
			}
		}
		return results;
	};

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
		var dirFiles = (plugin == null) ? content : collapseDevicesPerFile(content[plugin]);

		// Items can be files OR plugins. Depending on wheter this is the initial execution of the code
		// for a particular filetree, or it has been triggered by clicking on one of the collepsed plugin trees.
		var items = '';

		if(dirFiles !== null) {
			for (var i in dirFiles) {
				var el = dirFiles[i];
				var id = el.id;		// might be null if the element is a plugin folder
				var name = el.name;	// might be null if the element is a plugin

				var fullPath = el["uri"] || "";
				var hostIds = el["hostIds"] || "";
				var uris = el["uris"] || "";

				if (plugin == null) items += '<li id='+parentID+'_'+i+' class="plugin_'+i+' directory collapsed"><a href="#" rel="'+i+'">'+i+'</a></li>';
				else {
					var extension = el["extension"] || name.split(".").pop(); // *.tar.gz will be just *.gz
					// take the first (or any other) element, and then take the extension of it.

					items += '<li id='+parentID+'_'+i+' class="file ext_'+extension+'"><a href="#" rel="'+ fullPath +'" hostIds="'+ hostIds +'" uris="'+ uris +'" fileName="'+name+'">'+name+'</a></li>';
				}
			}
		}

console.log(items);
		var res = '<ul class="jqueryFileTree" style="display: none;">';
		res += items;
		res += '</ul>';

		callback(res);
	}
};
});