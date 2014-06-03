define(function() {


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
			"methodName"	: "getLinkedItems",
			"params"		: {
				"itemLocation"	: item.itemLocation,
				"itemName"		: item.itemName
			}
		};
		_socket.write(prepareMsg(req));
	};

	/**
	 * A request to the server for all the linked items to a particular item, it can take
	 * several seconds for the server to handle it. After having collected the data, the server
	 * will send a message of the type "Normal Response" with the invocation of this method.
	 * It will just pass the collected data to the view which will render the results.
	 */
	function showLinkedItems(items) {
		console.log("test: ");
		console.log(items);
		_mainView.fileTreeRecursion(items);
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
			case "Normal Response":
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
	 * Synchrnization if the local file system (or its changes) with to the server
	 * This function will be triggered by the FileSystemWatcher. The server sends a sync response back.
	 */
	function synchronize(eventType, filePath, fileLastModified) {
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
				"filePath"		: filePath,
				"lastModified"	: fileLastModified
			}
		};

		_socket.write(prepareMsg(msg));
	}

	/**
	 * Installs the synchronization function and starts the listeners of the operating system to
	 * track teh changes.
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