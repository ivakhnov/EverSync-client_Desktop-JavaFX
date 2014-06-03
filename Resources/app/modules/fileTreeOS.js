//
// jQuery File Tree Connector to OS Files
//
// Version 1.0
//
// Evgeni Ivakhnov
// https://github.com/ivakhnov
// 15 February 2014
//
//
//
// Output a list of files for jQuery File Tree
//


//define(['os/File'], function(os) {
define(function() {
return {

	// Every connector has three arguments. The parentID of the file tree, it actual parameters and a callback.
	// The params is an object with the actual parameters. In this case, it can only have one single value, the directory
	// name.
	dirList: function(parentID, params, callback) {
		var fileSystemIdentifier = "LOCALFILESYSTEM";
		var directory = params.root;

		var dirFiles = FileSystem.getDirListing(directory);
		var folders = '';
		var files = '';

		if(dirFiles !== null) {
			for (var i=0; i<dirFiles.length; i++){
				var el = dirFiles[i];
				var fullpath = el.getAbsolutePath();
				var name = fullpath.replace(/^.*[\\\/]/, '');

				// Get the extension:
				//var file = el.substring(el.lastIndexOf("/"));
				var extension = name.substring(name.indexOf(".")); // .tar.gz
				//var extension = el.extension();

				var id = parentID+'_'+fileSystemIdentifier+'_'+i;

				if (el.isDirectory()) folders += '<li id='+id+' class="directory collapsed"><a href="#" rel="'+fullpath+'">'+name+'</a></li>';
				else files += '<li id='+id+' class="file ext_'+extension+'"><a href="#" rel="'+fullpath+'">'+name+'</a></li>';
			}
		}

		var res = '<ul class="jqueryFileTree" style="display: none;">';
		res += folders;
		res += files;
		res += '</ul>';

		callback(res);
	}
};
});