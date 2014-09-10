package application;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.net.UnknownHostException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Semaphore;

import javafx.application.Platform;
import javafx.concurrent.Service;
import javafx.concurrent.Task;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

import net.alhem.jsockets.SocketHandler;
import net.alhem.jsockets.TcpSocket;
import netscape.javascript.JSObject;


public class ClientSocket {

	private SocketAddress _serverAddress;
	private static WebEngine _webEngine;

	private final Socket _socket;
	private BufferedReader _in;
	private DataOutputStream _out;
	private boolean _socketOpen = false;

	public ClientSocket(String serverAddress, int serverPort, WebEngine webEngine) {
		_webEngine = webEngine;
		_serverAddress = new InetSocketAddress(serverAddress,serverPort);
		_socket = new Socket();
	}


	public void onRead(String callbackFuncName) throws Exception {
		Service<Void> service = new Service<Void>() {
			@Override
			protected Task<Void> createTask() {
				return new Task<Void>() {
					@Override
					protected Void call() throws Exception {
						//Background work
						try {
							while(_socketOpen) {
								String serverMsg = _in.readLine();
								if (serverMsg != null) {
									Platform.runLater(new Runnable() {
										@Override
										public void run() {
											System.out.println("Socket reads message: " + serverMsg);
											_webEngine.executeScript("window." + callbackFuncName + "('" + serverMsg + "');");
										}
									});
								}
							}
						} catch (IOException e) {
							System.out.println("Socket error: No I/O !");
							e.printStackTrace();
						}
						//Keep with the background work
						return null;
					}
				};
			}
		};
		service.start();
	}

	public void write(String msg) {
		try {
			_out.writeBytes(msg);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public void sendFile(File file) {
		try {
			byte[] fileByteArray = new byte[(int) file.length()];
			BufferedInputStream bis = new BufferedInputStream(new FileInputStream(file));
			bis.read(fileByteArray, 0, fileByteArray.length);
			bis.close();
			_out.write(fileByteArray, 0, fileByteArray.length);
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public void receiveFile(String handshakeMsg, String filePath, int fileSize) {
		Platform.runLater(new Runnable() {
			@Override
			public void run() {
				try {
					byte[] fileByteArray = new byte[fileSize];
					
					Socket socket =  new Socket();
					socket.connect(_serverAddress);
					BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
					DataOutputStream out = new DataOutputStream(socket.getOutputStream());
					in.readLine(); // read the handshake message
					out.writeBytes(handshakeMsg); // send the response

					InputStream inStream = socket.getInputStream();
					inStream.read(fileByteArray, 0, fileByteArray.length);
					FileSystemWatcher.ignoreEventOn(filePath);
					FileSystem.setFile(filePath, fileByteArray);

					socket.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		});
	}

	public void connect() throws IOException {
		_socketOpen = true;
		_socket.connect(_serverAddress);
		_in = new BufferedReader(new InputStreamReader(_socket.getInputStream()));
		_out = new DataOutputStream(_socket.getOutputStream());
	}

	public void disconnect() throws IOException {
		_socketOpen = false;
		_socket.close();
		_in = null;
		_out = null;
	}
}