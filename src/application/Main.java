package application;

import java.io.File;
import java.io.IOException;
import java.net.URL;

import javafx.application.Application;
import javafx.beans.value.ChangeListener;
import javafx.beans.value.ObservableValue;
import javafx.scene.Scene;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import net.alhem.jsockets.Socket;
import net.alhem.jsockets.SocketHandler;
import net.alhem.jsockets.StdLog;
import net.alhem.jsockets.StdoutLog;
import net.alhem.jsockets.TcpSocket;
import netscape.javascript.JSException;
import netscape.javascript.JSObject;

import org.w3c.dom.Document;

import database.sqlite.Database;


public class Main extends Application {

	public static void main(String[] args) { launch(args); }
	@Override public void start(Stage primaryStage) {
		final WebView webView = new WebView();
		final WebEngine webEngine = webView.getEngine();

		//final URL uri = getClass().getResource("webview.html");
		final URL uri = getClass().getResource("index.html");
		webEngine.load(uri.toExternalForm());

		webEngine.documentProperty().addListener(new ChangeListener<Document>() {
			@Override public void changed(ObservableValue<? extends Document> prop, Document oldDoc, Document newDoc) {
				//enableFirebug(webEngine);
			}
		});
		primaryStage.setScene(new Scene(webView));
		primaryStage.show();
		
		//===========//
		// TEST CODE //
		//===========//
		
		//===========//
		
		// For debugging purposes, we start each time with a new, empty database
		// Therefore, delete the existing one
		//File dbFile = new File("EverSync.sqlite");
		//dbFile.delete();

		// Install Java-JavaScript Bridge
		JSObject window = (JSObject) webEngine.executeScript("window");
		try {
			window.setMember("OSValidator", new OSValidator());
			window.setMember("FileSystem", new FileSystem());
			window.setMember("Database", new Database());
			window.setMember("FileSystemWatcher", new FileSystemWatcher(webEngine));

			ClientSocket sock = new ClientSocket("localhost", 8080, webEngine);
			window.setMember("clientSocket", sock);
		} catch (JSException e) {
			// TODO Auto-generated catch block
			System.out.println("Could not connect to the server");
			e.printStackTrace();
		}
	}

	/**
	 * Enables Firebug Lite for debugging a webEngine.
	 * @param engine the webEngine for which debugging is to be enabled.
	 */
	private static void enableFirebug(final WebEngine webEngine) {
		webEngine.executeScript("if (!document.getElementById('FirebugLite')){E = document['createElement' + 'NS'] && document.documentElement.namespaceURI;E = E ? document['createElement' + 'NS'](E, 'script') : document['createElement']('script');E['setAttribute']('id', 'FirebugLite');E['setAttribute']('src', 'https://getfirebug.com/' + 'firebug-lite.js' + '#startOpened');E['setAttribute']('FirebugLite', '4');(document['getElementsByTagName']('head')[0] || document['getElementsByTagName']('body')[0]).appendChild(E);E = new Image;E['setAttribute']('src', 'https://getfirebug.com/' + '#startOpened');}"); 
	}
}