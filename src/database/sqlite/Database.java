package database.sqlite;

import java.io.File;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class Database extends DbConnection {

	public Database() {
		super();
		// Check if it is a new database file and therefore doesn't contain the 
		// clientModel table.
		if(!existCheck("clientModel")) {
			try {
				new DbCreation(_stmt);
			} catch (Exception e) {
				log.info("Could not create new schema!");
				e.printStackTrace();
			}
		}
	}

	/**
	 * Reads the id record from the ClientModel table, or returns null 
	 * in case the record doesn't exist (new, not filled database).
	 * @return String or null
	 * @throws SQLException 
	 */
	public String getId() throws SQLException {
		String id = null;
		String sql = "SELECT client_id FROM ClientModel";
		ResultSet rs = executeQry(sql);
		if(rs.next()) {
			id = rs.getString(1);
		}
		return id;
	}

	/**
	 * Set the id of the client. (The server assigns id's to the client on initial start up)
	 * @param id
	 */
	public void setId(String id) {
		String sql = "INSERT INTO ClientModel (id, client_id, root_path) " +
				"VALUES (NULL, '"+id+"', NULL)";
		executeUpd(sql);
	}

	/**
	 * Reads the path to the root folder of the application. 
	 * (Is assigned by the server on initial start up, and stored in the database).
	 * @return
	 * @throws SQLException
	 */
	public String getRootPath() throws SQLException {
		String path = null;
		String sql = "SELECT root_path FROM ClientModel";
		ResultSet rs = executeQry(sql);
		if(rs.next()) {
			path = rs.getString(1);
		}
		return path;
	}

	/**
	 * Set a new root path of the client (path to the folder which is controlled by the appliation)
	 * @param path
	 */
	public void setRootPath(String path) {
		String sql = "UPDATE ClientModel SET root_path = '" + path + "' WHERE id = 1";
		executeUpd(sql);
	}

	/**
	 * Method will read all the stored files in the database and return a list with File objects. 
	 * The File class however, have an overriden equals() method, which compares not only the file path which 
	 * is standard behavior, but also the last modified timestamp. This timestamp is also stored in the
	 * database. Therefore, when reading a file object from the database and a file object from the filesystem,
	 * the timestamps will also be compared in order to say wheter the file has been modified. 
	 * @return
	 */
	public List<File> getFilesAll() {
		List<File> files = new ArrayList<File>();
		String sql = "SELECT path, last_modified FROM Files";
		ResultSet rs = executeQry(sql);
		try {
			while(rs.next()) {
				Long storedLastModified = rs.getLong(2);
				// Override equals method in order to compare files not only on their
				// absolute path, but also on the lastModified characteristic.
				File file = new File(rs.getString(1)) {
					
					@Override
					public long lastModified() {
						return storedLastModified;
					}
					@Override
					public boolean equals(Object obj) {
						if ((obj != null) && (obj instanceof File)) {
							File f = (File) obj;
							return ((compareTo(f) == 0) && 
									new Long(lastModified()).equals(new Long(f.lastModified())));
						}
						return false;
					}
				};
				files.add(file);
			}
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return files;
	}

	/**
	 * Stores an instance of a File object in the database, together with its current lastmodified timestamp.
	 * @param file
	 */
	private void addFile(File file) {
		log.info("Adding path to database: " + file.getPath());
		String sql = "INSERT INTO Files (path, last_modified) VALUES ('"+ file.getPath() +"', "+ file.lastModified() +")";
		executeUpd(sql);
	}

	/**
	 * Stores a list of File objects to the database.
	 * @param toAdd
	 */
	public void addFiles(List<File> toAdd) {
		for (File file : toAdd) {
			addFile(file);
		}
	}

	/**
	 * Removes a file from the database. 
	 * @param file: Instance of a File object.
	 */
	public void removeFile(File file) {
		log.info("Removing path from database: " + file.getPath());
		String sql = "DELETE FROM Files WHERE path = '"+ file.getPath() +"'";
		executeUpd(sql);
	}

	/**
	 * Removes multiple files from the database.
	 * @param toRemove: List of File objects.
	 */
	public void removeFiles(List<File> toRemove) {
		for (File file : toRemove) {
			removeFile(file);
		}
	}

}
