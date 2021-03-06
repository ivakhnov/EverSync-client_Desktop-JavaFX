package application;

import java.awt.Desktop;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileFilter;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import netscape.javascript.JSObject;

public class FileSystem {
	
	public static String constructPath(String dir) {
		char homeDir = '~';
		char firstChar = dir.charAt(0);
		if (firstChar == homeDir) {
			return System.getProperty ("user.home") + dir.substring(1);
		} else {
			return dir;
		}
	}
	
	private File[] readDir(String dir) throws Exception {
		try {
			File root = new File(dir);
			// Skip the hidden files using a filter
			List<File> list = Arrays.asList(root.listFiles(new FileFilter() {
				@Override
				public boolean accept(File file) {
					return !file.isHidden();
				}
			}));
			return (File[]) list.toArray();
		} catch (Exception e) {
			throw new Exception("Reading an non-existing filepath on the client: " + dir); 
		}
	}
	
	private void getDirListingRecursive(String dir, List<File> dirListing) throws Exception {
		File[] list = readDir(dir);

		if (list == null) return;
		for (File f : list) {
			if (f.isDirectory()) {
				getDirListingRecursive(f.getAbsolutePath(), dirListing);
			}
			else {
				dirListing.add(f);
			}
		}
		return;
	}
	
	public File[] getDirListing(String directoryName) throws Exception {
		directoryName = constructPath(directoryName);
		File[] dirListing = readDir(directoryName);
		return dirListing;
	}
	
	// Is in fact a public wrapper for the private function which actually 
	// goes recursively through directories.
	public List<File> getDirListingRecursive(String directoryName) throws Exception {
		directoryName = constructPath(directoryName);
		List<File> dirListingRec = new ArrayList<File>();
		getDirListingRecursive(directoryName, dirListingRec);
		
		return dirListingRec;

	}

	public File getFile(String filePath) {
		File file = new File(constructPath(filePath));
		return file;
	}

	public static void setFile(String filePath, byte[] fileByteArray) {
		filePath = constructPath(filePath);
		try {
			// Firstly create the intermediate directories if they don't exist
			File file = new File(filePath);
			file.getParentFile().mkdirs();
			// Then create the actual file and write to it
			FileOutputStream fos = new FileOutputStream(filePath, false); //false for overwriting
			BufferedOutputStream bos = new BufferedOutputStream(fos);
			bos.write(fileByteArray, 0, fileByteArray.length);
			bos.close();
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	/**
	 *  The Runnable() of the JavaFX thread created in the "receiveFile" method of the ClientSocket class is
	 *  is static, which means that used methods of other classes also have to be static. Therefore the static
	 *  property of the "setFile" method. However, this method is also used in the JavaScript method 
	 *  installAck() of the serverConn.js. In order to call the setFile method from the JavaScript, it has to be
	 *  NOT a static method. Therefore this kind of method redirection.
	 * @param filePath
	 * @param fileByteArray
	 */
	public void setFileFromJSObject(String filePath, JSObject fileArrayJsobject) {
		int length = (int) fileArrayJsobject.eval("this.length");
		byte[] fileByteArray = new byte[length];
		
		for(int i=0; i<length; i++) {
			fileByteArray[i] = (byte) (int) fileArrayJsobject.eval("this["+i+"]");
		}
		setFile(filePath, fileByteArray);
	}
	
	/**
	 * Open file given a particular path
	 * @param filePath
	 */
	public void openFile(String filePath) {
		File file = new File(constructPath(filePath));
		try {
			Desktop.getDesktop().open(file);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	/**
	 * Open a url in the default web browser
	 * @param url
	 */
	public void openUrlInBrowser(String url) {
		if(Desktop.isDesktopSupported()){
			Desktop desktop = Desktop.getDesktop();
			try {
				desktop.browse(new URI(url));
			} catch (IOException | URISyntaxException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		} else {
			Runtime runtime = Runtime.getRuntime();
			try {
				runtime.exec("xdg-open " + url);
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}
	
	public static void createAndOpenTempFile(String fileName, byte[] fileByteArray) {
		try {
			// The fileName is of the following form:
			// filename.txt
			// So here we try to separate the actual file name and the extension
			int nameEndIndex = fileName.indexOf(".");
			String name = "";
			String extension = "";
			if(nameEndIndex > -1) {
				name = fileName.substring(0, nameEndIndex);
				extension = fileName.substring(nameEndIndex + 1);
			}
			// Create a temp file
			File temp = File.createTempFile(fileName, extension); 
			System.err.println("Temp file created: " + temp.getAbsolutePath());
			// Open a handle to it
			RandomAccessFile fh = new RandomAccessFile (temp, "rw");
			try {
				// Writing data to the file
				fh.write(fileByteArray);
			} finally {
				// Close the file
				fh.close();
				// Opening the file
				Desktop.getDesktop().open(temp);
				temp.deleteOnExit();
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
