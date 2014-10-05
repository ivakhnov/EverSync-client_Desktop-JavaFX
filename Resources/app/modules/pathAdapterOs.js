//
// Adapting the file path according to the operating system of the client
//
// Version 1.0
//
// Evgeni Ivakhnov
// https://github.com/ivakhnov
// 20 September 2014
//
//

define(["clientModel"], function(clientModel) {

	// Private help functions

	function escapeRegExp(string) {
		return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	};

	function replaceAll(string, find, replace) {
		return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
	};

	return {

		// Adapting the file path according the the OS
		filePathToOs: function(filePath) {
			var result = filePath;
			if(clientModel.getOs() == "Windows") {
				result = "file:///" + filePath;
			}
			return result;
		},

		// Normalizing the file path to a standard convention used in this application.
		// More concrete, just replace the backslashes if the path is a Windows path
		normalizeFilePath: function(filePath) {
			return filePath.replace(/\\/g, "/");
		},

		// Transform a concrete file path to a relative one.
		// Note that the file path has to be normalized before relativizing it.
		// For example:
		// input:		"/Users/evgeni/EverSync_folder/textfile.txt"
		// rootPath:	"~/EverSync_folder"
		// output:		"textfile.txt"
		relativizeFilePath: function(normalizedFilePath) {
			var rootPath = clientModel.getRootPath();
			rootPath = (rootPath[0] == "~") && rootPath.substring(1); // inline if without no else
			var offset = normalizedFilePath.indexOf(rootPath);
			return normalizedFilePath.substring(offset + rootPath.length + 1);
			// +1 crop off the first slash, otherwise the result would be something like:  "/textfile.txt"
		}
	};
});