//
// Module to parse FileTree items to a File representation used by other app components.
//
// Version 1.0
//
// Evgeni Ivakhnov
// https://github.com/ivakhnov
// 19 April 2015
//
//

define(function(require) {
	var parseItem = function(element, callback) {
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
		hostIds = hostIds.filter(function(e){return e;}); // Filter out ALL empty values ("", null, undefined and 0)

		var uris = element.attr('uris') || ""; // uris on remote hosts
		uris = uris.split(',');
		uris = uris.filter(function(e){return e;}); // Filter out ALL empty values ("", null, undefined and 0)

		// The item location comes after the file tree id, it one before last.
		// Location means: local file system or the name of the plugin for an external service
		var loc = part[part.length - 2];
		var itemLocation = loc + ":" + (rel ? rel : ( hostIds[0] + ":" + uris[0]));

		var hostType = element.attr('hostType');

		// "fileTreeID" 		: id of the file tree where this item is showed
		// "itemLocation"		: the full path to the location of a file (including the indication of the device)
		// "localLocation"		: the local path to the file (might be null if the file is on a remote device and has no local path)
		// "itemName"			: name of the file (without extension)
		var itemInfo = {
			"fileTreeID" 		: fileTreeID,
			"itemLocation"		: itemLocation,
			"localLocation"		: rel,
			"itemName"			: itemName,
			"hostType"			: hostType,
			"hostIds"			: hostIds,
			"uris"				: uris,
			"thisElement"		: element
		};
		callback(itemInfo);
	};

	return {
		parseItem : parseItem
	};
});