/**
 * The main code file
 */

define(["modules/pathAdapterOs"], function(pathAdapter) {
	$(document).ready(function() {
		/**
		 * Main initializations
		 */
		var pstyle = 'background-color: #F5F6F7; border: 1px solid #dfdfdf; padding: 5px; white-space:nowrap;';

		$('#mainLayout').w2layout({
			name: 'mainLayout',
			panels: [
				{ type: 'top', size:35, style: pstyle,
					toolbar: {
						items: [
							{ type: 'break',  id: 'break1' },
							{ id: 'bt3', type: 'button', caption: 'Add Link', img: 'icon-add' },
							{ type: 'break',  id: 'break2' }
						],
						onClick: function (event) {
							console.log('event');
						}
					}
				},
				{ type: 'main', size: '100%', resizable: true, style: pstyle }
			]
		});
		$('#layout_mainLayout_panel_top > .w2ui-panel-content').remove();
	});


	/**
	 * Variables
	 */

	// Depending on the organization of the data, it has to be parsed by an appropriate
	// module. For example the structure of the data read from the local file system is
	// different from the structure of the data received from the server. Therefore different
	// modules are needed to parse it, since the visualization is almost the same of all the data,
	// even though it's from different sources.
	var _fileTreeModule = null;
	var _connController = null;
	var _clientModel = null;
	var _fileTreesCntr = 1; // The file trees will keep spawning, so global counter to keep track of them


	/**
	 * Help methods
	 */
	initFileTree = function (id, controller, root, content, leftClickFn, rightClickFn) {
		$(id).fileTree({
			connector: controller,
			root: root,
			content : content,
			folderEvent: 'click',
			expandSpeed: 200,
			collapseSpeed: 200
		}, leftClickFn, rightClickFn);

	};

	function pruneSelectedFileTrees (startingCntr) {
		for (var i = startingCntr+1; i < _fileTreesCntr; i++) {
			$('#fileTree_'+i).remove();
		}
		_fileTreesCntr = startingCntr + 1;
	};

	/**
	 * Construct the context menu which appears when one right clicks on a file.
	 * @param {Object} file: Selected file
	 */
	function constructContextMenu(file) {
		var menuItems = [];
		var menuFns = [];
		var idCounter = 0;
		var hostIds = file.hostIds;

		function addSeparator() {
			menuItems.push({ id: idCounter, text: '--'});
			menuFns.push(function(){});
			idCounter++;
		};

		menuItems.push({ id: idCounter, text: 'Open on this device', icon: 'fa-star' });
		menuFns.push(function() {
			if(file.localLocation !== "") {
				console.log("Opening file...");
				FileSystem.openFile(_clientModel.getRootPath() + "/" + file.localLocation);
			} else {
				console.log("file downloaden en dan openen..");
			}
		});
		idCounter++;

		menuItems.push({ id: idCounter, text: 'Copy to this device', img: 'icon-page', hidden: (hostIds.indexOf(_clientModel.getId()) > -1) });
		menuFns.push(function() {
			console.log("copying to this device...");
		});
		idCounter++;

		// Filter out your own Id
		var hostIds = hostIds.filter(function(el) {
			return el != _clientModel.getId();
		});

		// Construct an array clients which have a local copy
		addSeparator();
		for(var x = 0; x < hostIds.length; x++) {
			var id = hostIds[x];
			menuItems.push({
				id: idCounter, text: 'Open on '+id,
				img: 'icon-page',
				disabled: (_clientModel.getConnectedClients().indexOf(id) < 0)
			});
			menuFns.push(function() {
				_connController.openOnRemote(file.itemLocation);
			});
			idCounter++;
		};
		// Construct an array for clients which don't have a local copy
		addSeparator();
		var clientWithoutCopy = _clientModel.getInstalledClients().filter(function(el) {
			return hostIds.indexOf(el) < 0;
		});
		for(var x = 0; x < clientWithoutCopy.length; x++) {
			var id = clientWithoutCopy[x];
			menuItems.push({
				id: idCounter, text: 'Copy & open '+id,
				img: 'icon-page',
				disabled: (_clientModel.getConnectedClients().indexOf(id) < 0)
			});
			menuFns.push(function() {
				//_connController.copyToRemote(file.itemLocation);
				//_connController.openOnRemote(file.itemLocation);
			});
			idCounter++;
		};

		return {
			connected : _clientModel.getConnectedClients(),
			installed : _clientModel.getInstalledClients(),
			menuItems : menuItems,
			menuFns : menuFns
		};
	};

	function fileTreeRecursion (linkedFiles, root) {
		$('#layout_mainLayout_panel_main > .w2ui-panel-content').append('<div id="fileTree_'+ _fileTreesCntr +'" class="treeContainer"></div>');

		initFileTree('#fileTree_'+_fileTreesCntr, _fileTreeModule, root, linkedFiles,
			function(file) { // Left click function
				// alert(JSON.stringify(file));
				pruneSelectedFileTrees(parseInt(file.fileTreeID));
				_connController.getLinkedItems(file);
			},
			function(file) { // Right click function
				// Filter out the ALL empty values ("", null, undefined and 0)
				file.hostIds = file.hostIds.filter(function(e){return e;});
				// Check whether it's a remote file or a local file (does it have hosts). If yes, enable context menu.
				if (file.hostIds.length > 0) {
					var menu = constructContextMenu(file);
					$(file.thisElement).w2menu({
						items: menu.menuItems,
						onSelect: function(event) { return menu.menuFns[event.index](); }
					});
				}
		});

		_fileTreesCntr++;
	};

	function init(clientModel, connController) {
		_connController = connController;
		_clientModel = clientModel;
		// For the initial file tree column we read the data from the local file system,
		// so this is the appropriate plugin to parse such data.
		_fileTreeModule = 'modules/fileTreeOS';
		fileTreeRecursion(null, clientModel.getRootPath());
		// All the next data will be received from the server.
		_fileTreeModule = 'modules/fileTreePlugin';
	}

	// Return access to some internal functions a.k.a. public members.
	return {
		init : init,
		fileTreeRecursion : fileTreeRecursion
	};


});