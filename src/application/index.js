// Place third party dependencies in the lib folder
//
// Configure loading modules from the lib directory,
// except 'app' ones,
requirejs.config({
	"baseUrl": "../../Resources/app",
	"paths": {
		"libs"	: "../../Resources/libs"
	}
});


// Load the main app module to start the app
requirejs(["clientModel", "serverConn", "mainView"], function(clientModel, connController, mainView) {
	clientModel.init();
	connController.connect(clientModel, mainView, function() {
		mainView.init(clientModel, connController);
		connController.startSyncing();
	});
});