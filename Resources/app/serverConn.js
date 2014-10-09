define(["modules/pathAdapterOs"], function(pathAdapter) {


	var _socket = null;
	var _clientModel = null;
	var _mainView = null;
	var _onConnectCallback = null;



	function prepareMsg(msgObject) {
		var term = "\n";
		return JSON.stringify(msgObject) + term;
	}

	/**
	 * Functions that will be executed once the client is connected to the server.
	 */
	function onConnect() {
		requirejs(["modules/pluginLoader"], function(pluginLoader) {
			pluginLoader.load();
		});

		_onConnectCallback();
	};

	function handshakeResponse() {
		var res;
		if (_clientModel.alreadyInstalled()) {
			res = {
				"msgType"	: "Handshake Response",
				"clientId"	: _clientModel.getId()
			};
			onConnect();
		} else {
			res = {
				"msgType"	: "Initial Handshake Response"
			};
		};
		_socket.write(prepareMsg(res));
	};

	function installResp() {
		var res = {
			"msgType"	: "Client Installation Response",
			"OS" 		: _clientModel.getOs()
		};
		_socket.write(prepareMsg(res));
	};

	function installAck(msg) {
		_clientModel.setId(msg["clientId"]);
		_clientModel.setRootPath(msg["rootPath"]);
		var installFilesPerPlugin = msg["installationFiles"];

		requirejs(["config"], function(config) {
			for (var pluginName in installFilesPerPlugin) {
				for (var fileName in installFilesPerPlugin[pluginName]) {
					var path = config.PluginsFoldersPath + "/" + pluginName + "/" + fileName;
					FileSystem.setFileFromJSObject(path, installFilesPerPlugin[pluginName][fileName]);
				}
			}
		});
		// Trigger the function which has to be executed after a connection.
		onConnect();
	};

	/**
	 * Request the server for the items (files/folders/...) that are linked to the
	 * given item. The given item is and object of the following form:
	 * {
	 * 		"fileTreeID" 		: x,
	 * 		"itemLocation"		: x,
	 * 		"itemName"			: x
	 * 	};
	 */
	function getLinkedItems(item) {
		var req = {
			"msgType"		: "Normal Request",
			"methodName"	: "getLinkedFiles",
			"params"		: {
				"fileName"	: item.itemName,
				"filePath"	: item.itemLocation
			}
		};
		_socket.write(prepareMsg(req));
	};

	/**
	 * A request to the server for all the linked items to a particular item. It can take
	 * several seconds for the server to handle it. After having collected the data, the server
	 * will send a message of the type "Normal Response" with the invocation of this method.
	 * It will just pass the collected data to the view which will render the results.
	 * (a.k.a. the callback of the "getLinkedItems" which is triggered by the server)
	 */
	function showLinkedItems(items) {
		_mainView.fileTreeRecursion(items);
	};

	function uploadFile(filePath) {
		console.log("Sending file: " + filePath);
		file = FileSystem.getFile(filePath);
		var msg = {
			"msgType"	: "File Upload Preparation",
			"fileSize"	: file.length().toString()
		};
		// Send the file size, then the file
		console.log(msg);
		_socket.write(prepareMsg(msg));
		_socket.sendFile(file);
	};

	/**
	 * Opens an additional connection to stream the file. This new connection will
	 * go through the handshake procedure.
	 * Note: "preparation" means here that the server requests the client
	 * to download a file!
	 */
	function downloadPreparation(msg) {
		filePath = msg["filePath"];
		fileSize = msg["fileSize"];
		handshakeMsg = {
			"msgType"	: "Handshake Response",
			"clientId"	: _clientModel.getId()
		};
		FileSystemWatcher.ignoreEventOn(filePath);
		_socket.receiveFile(prepareMsg(handshakeMsg), filePath, parseInt(fileSize));
	};

	/**
	 * Sends a request to the server to open the file on the device where it is stored
	 */
	function openOnRemote(fileLocation) {
		req = {
			"msgType"		: "Normal Request",
			"methodName"	: "openRemotely",
			"params"		: {
				"filePath"	: fileLocation
			}
		};
		_socket.write(prepareMsg(req));
	};

	/**
	 * Update the local list of the installed clients
	 */
	function setInstalledClients(clientsArray) {
		_clientModel.setInstalledClients(clientsArray);
	};

	/**
	 * Update the local list of the connected clients
	 */
	function setConnectedClients(clientsArray) {
		_clientModel.setConnectedClients(clientsArray);
	};

	/**
	 * Handles the method invocation on the client, which is triggered by the server.
	 * Processes the messages of the type "Normal Response".
	 */
	function messageReflect(msg) {
		var method = msg["methodName"];
		switch(method) {
			case "showLinkedItems":
				console.log("showLinkedItems();");
				showLinkedItems(msg["items"]);
				break;
			case "uploadFile":
				console.log("uploadFile();");
				uploadFile(msg["filePath"]);
				break;
			case "openFile":
				console.log("openFile()");
				FileSystem.openFile(msg["filePath"]);
				break;
			case "setInstalledClients":
				console.log("setInstalledClients();" + msg["clients"]);
				setInstalledClients(msg["clients"]);
				break;
			case "setConnectedClients":
				console.log("setConnectedClients();" + msg["clients"]);
				setConnectedClients(msg["clients"]);
				break;
			default:
				console.log("Unrecognized method requested: " + method);
		};
	};

	/**
	 * Function to be triggered after the synchronization is finished
	 */
	function syncResponse() {
		console.log("Synchronized successfully!");
		return "Synchronized successfully!";
	};

	/**
	 * Synchronization if the local file system (or its changes) with to the server
	 * This function will be triggered by the FileSystemWatcher. The server sends a sync response back.
	 */
	function synchronize(eventType, fileName, filePath, fileLastModified) {
		var methodName;

		switch(eventType) {
			case "ENTRY_CREATE":
				console.log("ENTRY_CREATE");
				methodName = "addFile";
				break;
			case "ENTRY_DELETE":
				console.log("ENTRY_DELETE");
				methodName = "deleteFile";
				break;
			case "ENTRY_MODIFY":
				console.log("ENTRY_MODIFY");
				methodName = "modifyFile";
				break;
			default:
				console.log("Unrecognized changeType on file: " + changeType);
		};

		var msg = {
			"msgType"		: "Normal Request",
			"methodName"	: methodName,
			"params"		: {
				"fileName"		: fileName,
				"filePath"		: pathAdapter.relativizeFilePath(pathAdapter.normalizeFilePath(filePath)),
				"lastModified"	: fileLastModified
			}
		};

		_socket.write(prepareMsg(msg));
	}

	/**
	 * Receive a message string from the server. Parse it to a JSON object.
	 * Read the type of the message, and call the correspondent method
	 * to initiate a response. If the message is just a normal response, pass the message
	 * to the appropriate function, which reflects it to the methods.
	 * @param  {[msgType]} msgString [description]
	 * @return {[msgType]}           [description]
	 */
	function parseMessage(msgString) {
		var msg = JSON.parse(msgString);
		console.log(msg);
		var msgType = msg["msgType"];
		switch(msgType) {
			case "Handshake Request":
				console.log("handshakeResponse();");
				handshakeResponse();
				break;
			case "Client Installation Request":
				console.log("installResp();");
				installResp();
				break;
			case "Client Installation Acknowledgement":
				console.log("installAck();");
				installAck(msg);
				break;
			case "Sync Response":
				console.log("syncResponse();");
				syncResponse();
				break;
			case "Download Preparation":
				downloadPreparation(msg);
				break;
			case "Normal Message":
				console.log("messageReflect();");
				messageReflect(msg);
				break;
			default:
				console.log("Unrecognized message type from server: " + msgType);
		};
	};

	function connect(clientModel, mainView, onConnectCallback) {
		_clientModel = clientModel;
		_mainView = mainView;
		_onConnectCallback = onConnectCallback;
		//_socket = Ti.Network.createTCPSocket('localhost', 8080);
		_socket = clientSocket;
		_socket.connect();
		// Make the parse function global so that it can be called from Java
		window.parseMessage = parseMessage;
		// Give the function name as a string
		_socket.onRead("parseMessage");
	};

	/**
	 * Installs the synchronization function and starts the listeners of the operating system to
	 * track the changes.
	 */
	function startSyncing() {
		FileSystemWatcher.init(Database, _clientModel.getRootPath());
		window.synchronize = synchronize;
		FileSystemWatcher.start("synchronize");
	}

	// Return access to some internal functions a.k.a. public members.
	return {
		connect : connect,
		getLinkedItems : getLinkedItems,
		startSyncing : startSyncing
	};

});