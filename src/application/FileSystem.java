package application;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


public class FileSystem {
	
	protected String constructPath(String dir) {
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
			List<File> list = Arrays.asList(root.listFiles());
			return (File[]) list.toArray();
		} catch (Exception e) {
			throw new Exception("Reading an non-existing filepath on the client!"); 
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

}