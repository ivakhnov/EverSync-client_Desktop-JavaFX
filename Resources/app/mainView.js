/**
 * The main code file
 */

define(["modules/file"], function(FileParser) {
	
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
	var _rootSelection = null; // Selected file in the very first file tree
	var _leafSelection = null; // Selected file in the very last file tree
	var _localImitation = false; // Prevent infinite loops while navigating items on clients as local files

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
							{ id: 'btn', type: 'button', caption: 'Add Link', img: 'icon-page', disabled: true },
							{ type: 'break',  id: 'break2' }
						],
						onClick: function (event) {
							$('#w2ui-popup').w2popup('open', {
								title 	: 'Remote File To Link',
								showMax	: true,
								keyboard: true,    // will close on esc if not modal
								onOpen	: function (event) {
									event.onComplete = function() {
										var Grid = $().w2grid(document.GridConfig());
										Grid.box = $("#w2ui-popup .w2ui-msg-body");
										Grid.render();
										$('.btnLinkSelected').click(function() {
											var uploader = $('.fileUploader');
											for (var i = 0; i < uploader.length; i++) {
												var selected = uploader[i];
												var selectedData = $(selected).data('selected');
												// we are interested in the name and path of a file, not its content
												delete selectedData.content;

												var myRegexp = /Grid_rec_(.*)/;
												var selectedQueueId = myRegexp.exec($(selected).attr('id'))[1][0];
												var queueEl = _clientModel.getLinkQueueItem(selectedQueueId);

												_connController.createLink(queueEl, selectedData);
												_clientModel.removeFromLinkQueue(queueEl);
												decreaseLinkQueue();
												w2popup.close();
											}
										});
									};
								},
								onToggle: function(event) { // event when maximized
									event.onComplete = function() {
										Grid.resize();
									}
								},
								buttons: 	'<button class="btn btnLinkSelected">Link</button> '+
											'<button class="btn" onclick="w2popup.close();">Cancel</button> '
							}); 
						}
					}
				},
				{ type: 'main', size: '100%', resizable: true, style: pstyle }
			]
		});

		document.GridConfig = function() {
			return {
				name: 'linkQueueGrid', 
				columns: [                
					{ field: 'hostId', caption: 'Service', size: '30%' },
					{ field: 'name', caption: 'File Name', size: '30%' },
					{ field: 'nameLabel', caption: 'Label', size: '40%' },
					{ field: 'adate', caption: 'Added On', size: '90px' },
				],
				records: function() {
					var linkQueue = _clientModel.getLinkQueue();
					linkQueue.forEach(function (el, idx) {
						el = $.extend(el, {'recid': idx});
					})
					return linkQueue;
				}(),
				onExpand: function (event) {
					if (w2ui.hasOwnProperty('subgrid-' + event.recid)) w2ui['subgrid-' + event.recid].destroy();
					$('#'+ event.box_id).css({ margin: '0px', padding: '0px', width: '100%' }).animate({ height: '25px' }, 100);
					setTimeout(function () {
						$('<input>').attr({
							id: 'file'+ event.box_id,
							class: 'fileUploader',
							name: 'bar'
						}).appendTo('#'+ event.box_id);
						var parentHeight = $('#file'+ event.box_id).parent().height();
						var parentWidth = $('#file'+ event.box_id).parent().width();
						$('#file'+ event.box_id).css('height', parentHeight);
						$('#file'+ event.box_id).css('width', parentWidth);
						$('#file'+ event.box_id).w2field('file', { max: 1});
					}, 300);
				}
			}
		}
	});

	/**
	 * Help methods
	 */
	initFileTree = function (id, controller, root, content, autoExpand, leftClickFn, rightClickFn) {
		$(id).fileTree({
			connector: controller,
			root: root,
			content : content,
			folderEvent: 'click',
			expandSpeed: 200,
			collapseSpeed: 200,
			autoExpand: autoExpand
		}, leftClickFn, rightClickFn);

	};

	function pruneSelectedFileTrees (startingCntr) {
		for (var i = startingCntr+1; i < _fileTreesCntr; i++) {
			$('#fileTree_'+i).remove();
		}
		_fileTreesCntr = startingCntr + 1;
	};

	function updateRootSelection (file) {
		if (parseInt(file.fileTreeID) === 1) {
			_rootSelection = file;
		}
	}

	function updateLeafSelection (file) {
		if (parseInt(file.fileTreeID) > 1) {
			_leafSelection = file;
		}
	}

	function createFileTree() {
		$('#layout_mainLayout_panel_main > .w2ui-panel-content')
			.append('<div id="fileTree_'+ _fileTreesCntr +'" class="treeContainer"></div>');
	}

	function searchLeafSelectionLocally() {
		return $('#layout_mainLayout_panel_main')
				.find('#fileTree_1')
				.find('a[fileName="'+ _leafSelection.itemName +'"]');
	}

	/**
	 * Construct the context menu which appears when one right clicks on a file.
	 * @param {Object} file: Selected file
	 */
	function constructContextMenu(file) {
		var menuItems = [];
		var menuFns = [];
		var idCounter = 0;
		var hostType = file.hostType;
		var hostIds = file.hostIds;
		var uris = file.uris;
		var localLocation = file.localLocation;
		function addSeparator() {
			menuItems.push({ id: idCounter, text: '--'});
			menuFns.push(function(){});
			idCounter++;
		};

		var canOpenLocal = (hostIds.length == 0) || (hostIds.indexOf(_clientModel.getId()) != -1);
		var canOpenByPlugin = (hostType && hostType != 'EverSyncClient');

		menuItems.push({ id: idCounter, text: 'Open on this device', disabled: !canOpenLocal && !canOpenByPlugin });
		if (canOpenByPlugin) {
			menuFns.push(function() {
				_connController.askPluginToOpen(hostType, hostIds[0], uris[0]);
				// normally those are arrays with only 1 element in it, so feel safe to pick the first one
			});
		} else {
			if (canOpenLocal) {
				menuFns.push(function() {
					var filePath = _clientModel.getRootPath() + "/" + localLocation;
					FileSystem.openFile(filePath);
				});
			} else {
				_connController.copyFromRemoteAndOpen(hostIds[0], uris[0], fileName)
			}
			idCounter++;

			// Check whether it's a remote file or a local file (does it have hosts). If yes, extend context menu.
			if (hostIds.length > 0) {

				menuItems.push({ id: idCounter, text: 'Copy & open here', img: 'icon-page', disabled: canOpenLocal });
				menuFns.push(function() {
					console.log("copying to this device...");
					var onlineCandidates = hostIds.filter(function(n) {
						return _clientModel.getConnectedClients().indexOf(n) != -1;
					});
					var candidate = onlineCandidates[0];
					var candidateIndex = hostIds.indexOf(candidate);
					_connController.copyFromRemoteAndOpen(hostIds[candidateIndex], uris[candidateIndex], file.itemName);
				});
				idCounter++;

				// Construct an array clients which have a local copy
				addSeparator();
				var hostClients = hostIds.filter(function(n) { // filter out the third party services (which are also hosts)
					return _clientModel.getInstalledClients().indexOf(n) != -1;
				});
				for(var x = 0; x < hostClients.length; x++) {
					// Filter your own (the current client)
					if(hostClients[x] == _clientModel.getId()) continue;
					var id = hostClients[x];
					menuItems.push({
						id: idCounter, text: 'Open on '+id,
						img: 'icon-page',
						disabled: (_clientModel.getConnectedClients().indexOf(id) < 0)
					});
					menuFns.push(function() {
						_connController.openOnRemote(id, uris[hostIds.indexOf(id)]);
					});
					idCounter++;
				};
				// // Construct an array for clients which don't have a local copy
				// addSeparator();
				// var clientsWithoutCopy = _clientModel.getInstalledClients().filter(function(el) {
				// 	return hostIds.indexOf(el) < 0;
				// });
				// for(var x = 0; x < clientsWithoutCopy.length; x++) {
				// 	// Filter your own (the current client)
				// 	if(clientsWithoutCopy[x] == _clientModel.getId()) continue;
				// 	var id = clientsWithoutCopy[x];
				// 	menuItems.push({
				// 		id: idCounter, text: 'Copy to & open on '+id,
				// 		img: 'icon-page',
				// 		disabled: (_clientModel.getConnectedClients().indexOf(id) < 0)
				// 	});
				// 	menuFns.push(function() {
				// 		//_connController.copyToRemote(file.itemLocation);
				// 		//_connController.openOnRemote(file.itemLocation);
				// 	});
				// 	idCounter++;
				// };
			};
		};

		return {
			connected : _clientModel.getConnectedClients(),
			installed : _clientModel.getInstalledClients(),
			menuItems : menuItems,
			menuFns : menuFns
		};
	};

	/**
	 * Implement the link-queue visualization
	 */
	function increaseLinkQueue() {
		if (w2ui.mainLayout_top_toolbar.items[1].disabled) {
			w2ui.mainLayout_top_toolbar.enable('btn');
			setTimeout(function () { // needs timeout because w2ui itself uses timeouts
				$('.icon-page').removeClass('w2ui-tb-image');
				$('.icon-page').append('<span class="notification-counter">1</span>');
			}, 25);
		} else {
			var counter = $('.notification-counter');
			var counterVal = parseInt(counter.text());
			counterVal++;
			counter.text(counterVal);
			counter.css({
				opacity: 0.9,
				top: '0px'
			});

			// Animation
			counter.animate({
				opacity: 1,
				top: '3px',
			}, 500);
		}
	};

	function decreaseLinkQueue() {
		if (w2ui.mainLayout_top_toolbar.items[1].disabled)
			return;

		var counter = $('.notification-counter');
		var counterVal = parseInt(counter.text());
		if (counterVal === 1) {
			w2ui.mainLayout_top_toolbar.disable('btn');
		} else {
			counterVal--;
			counter.text(counterVal);
			counter.css({
				opacity: 0.9,
				top: '0px'
			});

			// Animation
			counter.animate({
				opacity: 1,
				top: '3px',
			}, 500);
		}
	};

	 /**
	  * File tree recusion
	  * @param  {[type]} linkedFiles [description]
	  * @param  {[type]} root        [description]
	  * @param  {[type]} autoExpand  [description]
	  * @return {[type]}             [description]
	  */
	function fileTreeRecursion (linkedFiles, root, autoExpand) {
		if ($.isEmptyObject(linkedFiles) && $.isEmptyObject(root) && _localImitation)
			return; // No results available, not on remote services, not on clients.

		if ($.isEmptyObject(linkedFiles) && $.isEmptyObject(root)) {
			if (_rootSelection.itemName === _leafSelection.itemName)
				return;

			var localFileItem = searchLeafSelectionLocally();
			if (localFileItem.length > 0) {
				localFileItem.click();
			} else {
				_localImitation = true;
				_connController.getLocalItemsByName(_leafSelection);
			}
			return;
		};

		createFileTree();

		initFileTree('#fileTree_'+_fileTreesCntr, _fileTreeModule, root, linkedFiles, autoExpand,
			function(file) { // Left click function
				// alert(JSON.stringify(file));
				pruneSelectedFileTrees(parseInt(file.fileTreeID));
				updateRootSelection(file);
				updateLeafSelection(file);
				if (file.hostType === "EverSyncClient" && _rootSelection && _rootSelection.itemName === file.itemName)
					return;
				_connController.getLinkedItems(file);
			},
			function(file) { // Right click function
				var menu = constructContextMenu(file);
				$(file.thisElement).w2menu({
					items: menu.menuItems,
					onSelect: function(event) { return menu.menuFns[event.index](); }
				});
		});

		_localImitation = false;
		_fileTreesCntr++;
	};

	function init(clientModel, connController) {
		_connController = connController;
		_clientModel = clientModel;
		// For the initial file tree column we read the data from the local file system,
		// so this is the appropriate plugin to parse such data.
		_fileTreeModule = 'modules/fileTreeOS';
		fileTreeRecursion(null, clientModel.getRootPath(), false);
		// All the next data will be received from the server.
		_fileTreeModule = 'modules/fileTreePlugin';
	}

	// Return access to some internal functions a.k.a. public members.
	return {
		init : init,
		fileTreeRecursion : fileTreeRecursion,
		increaseLinkQueue : increaseLinkQueue,
		decreaseLinkQueue : decreaseLinkQueue
	};
});