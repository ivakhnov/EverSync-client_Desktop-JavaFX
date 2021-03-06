define(function() {


	var _rootPath = null;
	var _id = null;
	var _os = null;
	var _installedClients = [];
	var _connectedClients = [];
	var _linkQueue = [];

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
			//_rootPath = "C:\"; // Please note: the path is used in the system as a unique id ==> different paths
			// on different devices makes the same file being considered as two different files.
		},

		getOs: function() {
			return _os;
		},

		setInstalledClients: function(clientsArray){
			_installedClients = clientsArray.filter(function(el) {
				return el != _id;
			});
		},

		getInstalledClients: function() {
			return _installedClients;
		},

		setConnectedClients: function(clientsArray) {
			_connectedClients = clientsArray.filter(function(el) {
				return el != _id;
			});
		},

		getConnectedClients : function() {
			return _connectedClients;
		},

		addToLinkQueue : function(fileInfo) {
			_linkQueue.push(fileInfo); // push at the end
		},

		getLinkQueue : function() {
			return _linkQueue;
		},

		getLinkQueueItem : function(elIdx) {
			if (elIdx >= _linkQueue.length || elIdx < 0) return -1;
			return _linkQueue[elIdx];
		},

		removeFromLinkQueue : function(fileInfo) {
			var elIdx;
			for (var i = 0; i < _linkQueue.length; i++) {
				if (_linkQueue[i]['hostId'] === fileInfo['hostId'] &&
					_linkQueue[i]['name'] === fileInfo['name'])
				{
					elIdx = i;
					break;
				}
			}

			if (typeof elIdx === 'undefined') {
				return false;
			} else {
				_linkQueue.splice(elIdx, 1); // remove 1 element at given idx
				return true;
			}
		},

		getLinkQueueLength : function() {
			return _linkQueue.length;
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