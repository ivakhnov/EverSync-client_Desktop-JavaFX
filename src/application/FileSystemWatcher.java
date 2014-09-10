package application;

import java.nio.file.*;

import static java.nio.file.StandardWatchEventKinds.*;
import static java.nio.file.LinkOption.*;

import java.nio.file.attribute.*;
import java.io.*;
import java.util.*;

import org.apache.commons.collections.*;

import javafx.application.Platform;
import javafx.concurrent.Service;
import javafx.concurrent.Task;
import javafx.scene.web.WebEngine;

import com.sun.media.jai.opimage.SubtractConstCRIF;

import database.sqlite.Database;

public class FileSystemWatcher extends FileSystem {

	private static WebEngine _webEngine;
	private static WatchService _watcher;
	private static Map<WatchKey,Path> _keys;
	private static String _dir;
	private static String _callback;
	private static Bag _ignoreEventsOn;
	private Database _db;

	// Flag which indicates whether adding a new directory has to be shown in the console.
	private boolean _trace = false;

	@SuppressWarnings("unchecked")
	static <T> WatchEvent<T> cast(WatchEvent<?> event) {
		return (WatchEvent<T>)event;
	}

	public FileSystemWatcher(WebEngine webEngine) {
		_webEngine = webEngine;
	}

	/**
	 * This function creates a WatchService and sets the directory which has to be "watched".
	 * @param callback: JavaSCript method of the controller (ServerConn).
	 * @throws IOException 
	 */
	public void init(Database db, String dir) throws IOException {
		_ignoreEventsOn = new HashBag();
		_db = db;
		_dir = constructPath(dir);
		_watcher = FileSystems.getDefault().newWatchService();
		_keys = new HashMap<WatchKey,Path>();

		Path startPath = Paths.get(_dir);
		registerAll(startPath);
		// Enable trace after initial registration
		_trace = true;
	}

	/**
	 * Firstly, the changes to the file system since last application startup will be collected (of course, this might be
	 * the initial startup which is not a problem). Before the application client is started, the files in the controlled 
	 * directory might be created, deleted or modified. After collecting and pushing all those updates to the server,
	 * a JavaFX thread will be created in order to detect further changes during application activity. 
	 * @param callback is the 'synchronize' function from the 'serverConn' 
	 * @throws Exception
	 */
	public void start(String callback) throws Exception {
		_callback = callback;

		// Read all the files from the file system
		List<File> currentFiles = getDirListingRecursive(_dir);

		// Files that are in the database but not in file system
		List<File> toRemove = new ArrayList<File>(_db.getFilesAll());
		toRemove.removeAll(currentFiles);
		_db.removeFiles(toRemove);

		// Files that are in the file system but not in the database
		List<File> toAdd = new ArrayList<File>(currentFiles);
		toAdd.removeAll(_db.getFilesAll());
		_db.addFiles(toAdd);
		// So far, modified files has been considered as deleted and recreated files
		// So, filter of those two lists the files that are modified
		List<File> modified = new ArrayList<File>(toAdd);
		modified.retainAll(toRemove);

		// Get them out of the previous two lists
		toAdd.removeAll(modified);		
		Iterator<File> iter = toRemove.iterator();
		while (iter.hasNext()) {
			File file = new File(iter.next().getPath());
			if (modified.contains(file)) {
				iter.remove();
			}
		}

		// Send the final results to the server
		for(File file : modified) { sendToServer(ENTRY_MODIFY, file.getName().toString(), file.getPath(), file.lastModified()); }
		for(File file : toAdd) { sendToServer(ENTRY_CREATE, file.getName().toString(), file.getPath(), file.lastModified()); }
		for(File file : toRemove) { sendToServer(ENTRY_DELETE, file.getName().toString(), file.getPath(), file.lastModified()); }

		// Create listener in a new JavaFX thread in order to detect further changes in file system
		Service<Void> service = new Service<Void>() {
			@Override
			protected Task<Void> createTask() {
				return new Task<Void>() {
					@Override
					protected Void call() throws Exception {
						//Background work
						processEvents();
						//Keep with the background work
						return null;
					}
				};
			}
		};
		service.start();
	}

	/**
	 * When a file has been created, deleted or modified, this has to be sent to the server.
	 * This method, invokes the JavaScript function of the controller (ServerConn)
	 * in order to send those updates to the server.
	 * @param fileName 
	 * @param eventKind: ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY
	 * @param filePath: Absolute path of the file
	 * @param lastModified: Timestamp when this file has been modified the last time
	 */
	private void sendToServer(WatchEvent.Kind eventKind, String fileName, String filePath, Long lastModified) {
		//System.out.println("==> "+ eventKind.name() + " " + filePath);
		Platform.runLater(new Runnable() {
			@Override
			public void run() {
				_webEngine.executeScript("window." + _callback + "('" + 
						eventKind.name() +"','"+ 
						fileName +"','"+
						filePath +"','"+ 
						lastModified + 
					"');");
			}
		});
	}

	/**
	 * Register the given directory, and all its sub-directories, with the
	 * WatchService.
	 */
	private void registerAll(final Path startPath) throws IOException {
		// register directory and sub-directories
		Files.walkFileTree(startPath, new SimpleFileVisitor<Path>() {
			@Override
			public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs)
					throws IOException
			{
				register(dir);
				return FileVisitResult.CONTINUE;
			}
		});
	}

	/**
	 * Register the given directory with the WatchService
	 */
	private void register(Path dir) throws IOException {
		WatchKey key = dir.register(_watcher, ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY);
		if (_trace) {
			Path prev = _keys.get(key);
			if (prev == null) {
				System.out.format("register: %s\n", dir);
			} else {
				if (!dir.equals(prev)) {
					System.out.format("update: %s -> %s\n", prev, dir);
				}
			}
		}
		_keys.put(key, dir);
	}

	/**
	 * Process all events for keys queued to the watcher
	 */
	private void processEvents() {
		while (true) {

			// wait for key to be signalled
			WatchKey key;
			try {
				key = _watcher.take();
			} catch (InterruptedException x) {
				return;
			}

			Path dir = _keys.get(key);
			if (dir == null) {
				System.err.println("WatchKey not recognized!!");
				continue;
			}

			for (WatchEvent<?> event: key.pollEvents()) {
				WatchEvent.Kind kind = event.kind();

				// TBD - provide example of how OVERFLOW event is handled
				if (kind == OVERFLOW) {
					continue;
				}

				// Context for directory entry event is the file name of entry
				WatchEvent<Path> ev = cast(event);
				Path name = ev.context();
				Path child = dir.resolve(name);

				String fileName = name.getFileName().toString();
				String absolutePath = dir.resolve(name).toString();
				File file = new File(absolutePath);
				Long lastModified = file.lastModified();

				// print out event
				//System.out.println("ev.context() => " + ev.context());
				//System.out.println("dir.resolve(name) => " + dir.resolve(name));
				//System.out.println("event.kind().name() => " + event.kind().name());
				//System.out.println("child => " + child);

				// check if this event has to be sent to the server or be ignored
				if(_ignoreEventsOn.getCount(absolutePath) == 0) {
					sendToServer(event.kind(), fileName, absolutePath, lastModified);
				} else {
					_ignoreEventsOn.remove(absolutePath, 1); // remove one occurrence
				}

				// if directory is created, and watching recursively, then
				// register it and its sub-directories
				if (kind == ENTRY_CREATE) {
					try {
						if (Files.isDirectory(child, NOFOLLOW_LINKS)) {
							registerAll(child);
						}
					} catch (IOException x) {
						// ignore to keep readable
					}
				}
			}

			// reset key and remove from set if directory no longer accessible
			boolean valid = key.reset();
			if (!valid) {
				_keys.remove(key);
			}
		}
	}

	/**
	 * The FileSystemWatcher tries to detect modifications to the files. Every event triggers a mechanism
	 * to synchronize other clients so that they have the updated/modified version of the file. 
	 * However, modification that are made by the EverSync application itself have to be skipped. For example another 
	 * client makes a modification to a file, the new version will be downloaded by the current client so that the file
	 * is modified by the application locally, but it doesn't mean that those local changes have to be send to other 
	 * clients again. Otherwise it would result in an infinite loop if the clients synchronize with each other and 
	 * at the same time keep broadcasting the synchronized modifications. 
	 * @param filePath
	 */
	public static void ignoreEventOn(String filePath) {
		_ignoreEventsOn.add(filePath);
	}

}
