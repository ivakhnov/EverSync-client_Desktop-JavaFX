// Place third party dependencies in the lib folder
//
// Configure loading modules from the lib directory,
// except 'app' ones, 
requirejs.config({
	"baseUrl": "./app",
	"paths": {
		"os"	: "../TideSDK",
		"libs"	: "../libs"
	}
});

// Load the main app module to start the app
requirejs(["clientModel", "serverConn", "mainView"], function(clientModel, connController, mainView) {
	clientModel.init();
	connController.connect(clientModel, mainView, function() {
		mainView.init(clientModel, connController);
		// Synchronize with the server each XXX milliseconds
		connController.synchronize();
		// setInterval(function() {connController.synchronize()}, 3000);
	});
});