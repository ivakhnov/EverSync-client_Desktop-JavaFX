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
//			 autoExpand 	- automatically expanding the folders (nested)
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
			if( o.autoExpand == undefined) o.autoExpand = true;
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
							if (o.autoExpand) {
								$(c).find(".directory.collapsed").each(function (i, f) {
									$(f).removeClass('collapsed').addClass('expanded');
									showTree($(f), $(f).children().attr('rel'));
								});
							}
						});
					});
				}

				function bindTree(t) { require(["modules/file"], function(FileParser) {
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

							FileParser.parseItem($(this), function(itemInfo){
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
							FileParser.parseItem($(this), function(itemInfo){
								rightClickFn(itemInfo);
							});
						}
						return false;
					});
					// Prevent A from triggering the # on non-click events
					if( o.folderEvent.toLowerCase != 'click' ) $(t).find('LI A').bind('click', function() { return false; });
				})};

				// Loading message
				$(this).html('<ul class="jqueryFileTree start"><li class="wait">' + o.loadMessage + '<li></ul>');
				// Get the initial file list
				showTree( $(this), o.root );
			});
		}
	});
})(jQuery);