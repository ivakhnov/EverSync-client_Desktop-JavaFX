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
		// Trigger the function which has to be executed after the connection.
		onConnect();
	};

	/**
	 * Request the server for the items (files/folders/...) that are linked to the
	 * given item. The given item is and object of the following form:
	 * {
	 * 		"fileTreeID" 		: x,
	 * 		"itemLocation"		: x,
	 * 		"itemName"			: x,
	 * 		... (see modules/file)
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
	 * Reqest to the server to return a list of files from other clients (no third party services)
	 * with the same file name.
	 */
	function getLocalItemsByName(item) {
		var req = {
			"msgType"		: "Normal Request",
			"methodName"	: "getLocalFilesByName",
			"params"		: {
				"fileName"	: item.itemName
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

	function uploadFile(relativeFilePath) {
		var filePath = _clientModel.getRootPath() + "/" + relativeFilePath;
		console.log("Sending file: " + filePath);
		file = FileSystem.getFile(filePath);
		handshakeMsg = {
			"msgType"	: "Handshake Response",
			"clientId"	: _clientModel.getId()
		};
		var uploadPrepMsg = {
			"msgType"	: "Client Communication",
			"msg"		: "File Upload Preparation",
			"fileSize"	: file.length().toString(),
			"filePath"	: relativeFilePath
		};
		_socket.sendFile(prepareMsg(handshakeMsg), prepareMsg(uploadPrepMsg), file);
	};

	/**
	 * Opens an additional connection to stream the file. This new connection will
	 * go through the handshake procedure.
	 * Note: "preparation" means here that the server requests the client
	 * to download a file!
	 * Also note that the filePath might be undefined, meaning that the msg doesn't contain a file path!!
	 * In this case, the filePath will be set to null (instead of undefined) and sent as a parameter to the
	 * receiveFile method as it would happen in case the filePath was given. However, the receiveFile will
	 * create a temporary file in case the filePath is null. In this case, the temp file will also be opened
	 * immediately, since it's a temp file and is stored nowhere.
	 */
	function downloadPreparation(msg) {
		filePath = msg["filePath"] ? _clientModel.getRootPath() + "/" + msg["filePath"] : null;
		fileSize = msg["fileSize"];
		fileName = msg["fileName"];
		handshakeMsg = {
			"msgType"	: "Handshake Response",
			"clientId"	: _clientModel.getId()
		};
		downloadAcknowledgement = {
			"msgType"	: "Client Communication",
			"msg"		: "Download Acknowledgement"
		};
		FileSystemWatcher.ignoreEventOn(filePath);
		_socket.receiveFile(prepareMsg(handshakeMsg), prepareMsg(downloadAcknowledgement), parseInt(fileSize), fileName, filePath);
	};

	/**
	 * Sends a request to the server to open the file on the device where it is stored
	 */
	function openOnRemote(hostId, fileRemoteLocation) {
		req = {
			"msgType"		: "Normal Request",
			"methodName"	: "openRemotely",
			"params"		: {
				"hostId"	: hostId,
				"filePath"	: fileRemoteLocation
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
	 * Function to be triggered after the synchronization is finished
	 */
	function syncResponse() {
		console.log("Synchronized successfully!");
		return "Synchronized successfully!";
	};

	/**
	 * Sends a request to the server for to get a file from a remote client or service.
	 */
	function copyFromRemoteAndOpen(hostId, fileUri, fileName) {
		var req = {
			"msgType"		: "Normal Request",
			"methodName"	: "copyFromRemoteAndOpen",
			"params"		: {
				"hostId"	: hostId,
				"fileUri"	: fileUri,
				"fileName"	: fileName
			}
		};
		_socket.write(prepareMsg(req));
	};

	/**
	 * Sends a request to the server to ask a plugin how to open this particular item.
	 * After sending the request, the client 'forgets' about it, and its up to a plugin to
	 * decide how to open and to trigger the actual open-function on the client.
	 * @param  {[type]} hostType [type of the host of the selected file: EverSyncClient / ExternalService]
	 * @param  {[type]} hostIds  [Id of the host of the selected file]
	 * @param  {[type]} uris     [Uri of the selected file]
	 * @return {[type]}          [NONE]
	 */
	function askPluginToOpen(hostType, hostId, uri) {
		var msg = {
			"msgType"		: "Normal Request",
			"methodName"	: "askPluginToOpen",
			"params"		: {
				"hostType"		: hostType,
				"hostId"		: hostId,
				"uri"			: uri
			}
		};

		_socket.write(prepareMsg(msg));
	};

	/**
	 * Synchronization if the local file system (or its changes) with to the server
	 * This function will be triggered by the FileSystemWatcher. The server sends a sync response back.
	 */
	function synchronize(eventType, fileName, filePath, fileLastModified) {
		var methodName;
		var path = pathAdapter.relativizeFilePath(pathAdapter.normalizeFilePath(filePath));

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
				"filePath"		: path,
				"lastModified"	: fileLastModified
			}
		};

		console.log("Synchronizing file msg: " + prepareMsg(msg));
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
				console.log("downloadPreparation();");
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
				FileSystem.openFile(_clientModel.getRootPath() + "/" + msg["filePath"]);
				break;
			case "openUrlInBrowser":
				console.log("openUrlInBrowser()");
				FileSystem.openUrlInBrowser(msg["url"]);
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
		getLocalItemsByName : getLocalItemsByName,
		startSyncing : startSyncing,
		openOnRemote : openOnRemote,
		askPluginToOpen : askPluginToOpen,
		copyFromRemoteAndOpen : copyFromRemoteAndOpen
	};

});