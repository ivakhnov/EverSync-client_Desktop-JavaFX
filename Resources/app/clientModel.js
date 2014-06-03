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
			Database.setId(id);
		},

		getRootPath: function() {
			return _rootPath;
		},

		setRootPath: function(path) {
			_rootPath = path;
			Database.setRootPath(path);
		},

		getOs: function() {
			return _os;
		},

		/**
		 * Mainly used to detect the file system on the client
		 */
		init: function() {
			_os = OSValidator.getOS();
			_id = Database.getId();
			_rootPath = Database.getRootPath();
		}
	};

});