define(function() {


	var _rootPath = null;
	var _id = null;
	var _os = null;
	
	
	return {
		alreadyInstalled: function() {
			return _id != null;
		},

		getId: function() {
			return _id;
		},

		setId: function(id) {
			_id = id;
		},

		getRootPath: function() {
			return _rootPath;
		},

		setRootPath: function(newPath) {
			_rootPath = newPath;
		},

		getOs: function() {
			return _os;
		},

		getFileTree: function() {
//			var res = [];
//			function iter(dir) {
				//var dirFiles = os.getDirectoryListing(dir);
//				console.log(dirFiles);
//				if(dirFiles !== null) {
//					for (var i=0; i<dirFiles.length; i++){ 
//						var el = dirFiles[i];
//						if (el.isDirectory()) iter(el.nativePath());
//						else res.push(el.nativePath());
//					}
//				}
//			}
			//iter(_rootPath);
			
			//var dirFiles = OperatingSystem.getDirListing("/Documents");
				
			//console.log(dirFiles);
			return "res";
		},

		/**
		 * Mainly used to detect the operating system on the client
		 */
		init: function() {
			//_os = navigator.platform;
			//var testing = OperatingSystem.getDirListingRecursive("/Desktop");
			//var testing = OperatingSystem.getDirListing("/Desktop");
			//console.log("het resultaat: ");
			//console.log(testing[2].lastModified());
			//console.log(testing.size());
			_os = OperatingSystem.getOs();
		}
	}

});