// jQuery File Tree Plugin
//
// Version 1.01
//
// Cory S.N. LaViska
// A Beautiful Site (http://abeautifulsite.net/)
// 24 March 2008
//
// Visit http://abeautifulsite.net/notebook.php?article=58 for more information
//
// Usage: $('.fileTreeDemo').fileTree( options, callback )
//
// Options:  root           - root folder to display; default = /
//           script         - location of the serverside AJAX file to use; default = jqueryFileTree.php
//           folderEvent    - event to trigger expand/collapse; default = click
//           expandSpeed    - default = 500 (ms); use -1 for no animation
//           collapseSpeed  - default = 500 (ms); use -1 for no animation
//           expandEasing   - easing function to use on expand (optional)
//           collapseEasing - easing function to use on collapse (optional)
//           multiFolder    - whether or not to limit the browser to one subfolder at a time
//           loadMessage    - Message to display while initial tree loads (can be HTML)
//
// History:
//
// 1.01 - updated to work with foreign characters in directory/file names (12 April 2008)
// 1.00 - released (24 March 2008)
//
// TERMS OF USE
//
// This plugin is dual-licensed under the GNU General Public License and the MIT License and
// is copyright 2008 A Beautiful Site, LLC.
//
if(jQuery) (function($){

	function parseItemId(element, callback) {
		var elementId = element.parent().attr('id');

		// The selection happens inside one of the many possible File Trees. Each file tree has an id attribute
		// similar to: "fileTree_1" or "fileTree_2" and so on. Here we get the counter of the id (so the number after
		// the underscore) in order to prune the selections dependent from the previous selected file in this particular
		// file tree.
		var counterPosInID = 9;
		// However the ID can contain multiple integers
		// Drop the part before the ID
		var part = elementId.split("_");
		// Drop the part after the first occurence of underscore
		var fileTreeID = part[1];
		// Now fileTreeID contains the ID

		var rel = element.attr('rel') || "";
		// Drop the extension
		///var lastpos = rel.lastIndexOf(".");
		///relWithoutExtension = rel.substring(0, lastpos);
		// Or the name of the item is already in the rel element (in case the name and the item is actually received from
		// the server). Fro example:
		//    "itemName.pluginname"
		// Or the rel element is actually a local path to the item, for example:
		//    "/Users/username/Docuemnts/somefolder/item.ext"
		///var relItems = relWithoutExtension.split(/\/|\\/);
		var itemName = element.attr('fileName') || "";

		var hostIds = element.attr('hostIds') || "";
		hostIds = hostIds.split(',');
		hostIds = hostIds.filter(function(e){return e;}); // Filter out the ALL empty values ("", null, undefined and 0)

		var uris = element.attr('uris') || ""; // uris on remote hosts
		uris = uris.split(',');
		uris = uris.filter(function(e){return e;}); // Filter out the ALL empty values ("", null, undefined and 0)

		// The item location comes after the file tree id, it one before last.
		// Location means: local file system or the name of the plugin for an external service
		var loc = part[part.length - 2];
		var itemLocation = loc + ":" + (rel ? rel : ( hostIds[0] + ":" + uris[0]));

		// "fileTreeID" 		: id of the file tree where this item is showed
		// "itemLocation"		: the full path to the location of a file (including the indication of the device)
		// "localLocation"		: the local path to the file (might be null if the file is on a remote device and has no local path)
		// "itemName"			: name of the file (without extension)
		var itemInfo = {
			"fileTreeID" 		: fileTreeID,
			"itemLocation"		: itemLocation,
			"localLocation"		: rel,
			"itemName"			: itemName,
			"hostIds"			: hostIds,
			"uris"				: uris,
			"thisElement"		: element
		};
		callback(itemInfo);
	};

	$.extend($.fn, {
		fileTree: function(o, leftClickFn, rightClickFn) {

			// Defaults
			if( !o ) var o = {};
			if( o.root == undefined ) o.root = null;
			if( o.content == undefined ) o.content = null;
			if( o.connector == undefined ) o.connector = 'modules/fileTreeOS';
			if( o.folderEvent == undefined ) o.folderEvent = 'click';
			if( o.fileEvent == undefined ) o.fileEvent = 'contextmenu'; // right click
			if( o.expandSpeed == undefined ) o.expandSpeed = 500;
			if( o.collapseSpeed == undefined ) o.collapseSpeed = 500;
			if( o.expandEasing == undefined ) o.expandEasing = null;
			if( o.collapseEasing == undefined ) o.collapseEasing = null;
			if( o.multiFolder == undefined ) o.multiFolder = true;
			if( o.loadMessage == undefined ) o.loadMessage = 'Loading...';

			var selectedFile = null;

			$(this).each( function() {

				function showTree(c, t) {
					$(c).addClass('wait');
					$(".jqueryFileTree.start").remove();
					var parentID = $(c).attr('id');

					// Sample output for test purposes
					// var data = '<ul class="jqueryFileTree" style="display: none;"><li class="file ext_"><a href="#" rel="../../.DS_Store">.DS_Store</a></li><li class="file ext_"><a href="#" rel="../../.localized">.localized</a></li><li class="directory collapsed"><a href="#" rel="../../Aptana Rubles/">Aptana Rubles</a></li><li class="directory collapsed"><a href="#" rel="../../EverSync/">EverSync</a></li><li class="directory collapsed"><a href="#" rel="../../IdeaProjects/">IdeaProjects</a></li><li class="directory collapsed"><a href="#" rel="../../jQueryFileTree/">jQueryFileTree</a></li><li class="directory collapsed"><a href="#" rel="../../JSExtractor2/">JSExtractor2</a></li><li class="directory collapsed"><a href="#" rel="../../Microsoft User Data/">Microsoft User Data</a></li><li class="directory collapsed"><a href="#" rel="../../ReservEAT/">ReservEAT</a></li><li class="directory collapsed"><a href="#" rel="../../SPSSInc/">SPSSInc</a></li><li class="directory collapsed"><a href="#" rel="../../Titanium_Studio_Workspace/">Titanium_Studio_Workspace</a></li><li class="directory collapsed"><a href="#" rel="../../ViberDownloads/">ViberDownloads</a></li><li class="directory collapsed"><a href="#" rel="../../workspace_Eclipse/">workspace_Eclipse</a></li></ul></ul>';

					require([o.connector], function(Connector) {
						/**
						 * Connector to the list of files or folders, for directory browsing.
						 * Parameters of the connector are are in an object.
						 *
						 * t = directory name
						 * files = files retrieved from the server (some connectors read them from File system on the device,
						 * other get it from the server. Therefore it can be null or a JSON)
						 */
						var params = {
							root : t,
							content : o.content
						};
						Connector.dirList(parentID, params, function(data) {
							$(c).find('.start').html('');
							$(c).removeClass('wait').append(data);
							if( o.root == t ) $(c).find('UL:hidden').show();
							else $(c).find('UL:hidden').slideDown({ duration: o.expandSpeed, easing: o.expandEasing });
							bindTree(c);
						});
					});
				}

				function bindTree(t) {
					// Bind the left click event
					$(t).find('LI A').bind(o.folderEvent, function() {
						if( $(this).parent().hasClass('directory') ) {
							if( $(this).parent().hasClass('collapsed') ) {
								// Expand
								if( !o.multiFolder ) {
									$(this).parent().parent().find('UL').slideUp({ duration: o.collapseSpeed, easing: o.collapseEasing });
									$(this).parent().parent().find('LI.directory').removeClass('expanded').addClass('collapsed');
								}
								$(this).parent().find('UL').remove(); // cleanup
								showTree( $(this).parent(), $(this).attr('rel') );
								$(this).parent().removeClass('collapsed').addClass('expanded');
							} else {
								// Collapse
								$(this).parent().find('UL').slideUp({ duration: o.collapseSpeed, easing: o.collapseEasing });
								$(this).parent().removeClass('expanded').addClass('collapsed');
							}
						} else {
							var fileID = $(this).parent().attr('id');

							$('[id='+selectedFile+'] > a').removeClass('selected');
							$(this).addClass('selected');
							selectedFile = fileID;

							parseItemId($(this), function(itemInfo){
								leftClickFn(itemInfo);
							});
						}
						return false;
					});
					// Bind the right click event
					$(t).find('LI A').bind(o.fileEvent, function() {
						if( $(this).parent().hasClass('directory') ) {
							return false; // only files are supported by a file event
						} else {
							parseItemId($(this), function(itemInfo){
								rightClickFn(itemInfo);
							});
						}
						return false;
					});
					// Prevent A from triggering the # on non-click events
					if( o.folderEvent.toLowerCase != 'click' ) $(t).find('LI A').bind('click', function() { return false; });
				}
				// Loading message
				$(this).html('<ul class="jqueryFileTree start"><li class="wait">' + o.loadMessage + '<li></ul>');
				// Get the initial file list
				showTree( $(this), o.root );
			});
		}
	});
})(jQuery);