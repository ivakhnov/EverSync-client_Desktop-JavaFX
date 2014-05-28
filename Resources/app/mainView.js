/**
 * The main code file
 */

define(function() {
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
	var _fileTreesCntr = 1; // The file trees will keep spawning, so global counter to keep track of them


	/**
	 * Help methods
	 */
	initFileTree = function (id, controller, root, content, trigFn) {
		$(id).fileTree({
			connector: controller,
			root: root,
			content : content,
			folderEvent: 'click',
			expandSpeed: 200,
			collapseSpeed: 200
		}, trigFn);

	};


	function pruneSelectedFileTrees (startingCntr) {
		for (var i = startingCntr+1; i < _fileTreesCntr; i++) {
			$('#fileTree_'+i).remove();
		}
		_fileTreesCntr = startingCntr + 1;
	};

	function fileTreeRecursion (linkedFiles, root) {
		$('#layout_mainLayout_panel_main > .w2ui-panel-content').append('<div id="fileTree_'+ _fileTreesCntr +'" class="treeContainer"></div>');

		initFileTree('#fileTree_'+_fileTreesCntr, _fileTreeModule, root, linkedFiles, function(file) {
			// alert(JSON.stringify(file));

			pruneSelectedFileTrees(parseInt(file.fileTreeID));
			_connController.getLinkedItems(file);
		});

		_fileTreesCntr++;
	};

	function init(clientModel, connController) {
		_connController = connController;
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