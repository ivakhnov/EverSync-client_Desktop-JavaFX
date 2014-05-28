package database.sqlite;

import java.sql.ResultSet;
import java.sql.SQLException;

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
	
	public void setRootPath(String path) {
		String sql = "UPDATE ClientModel SET root_path = '" + path + "' WHERE id = 1";
		executeUpd(sql);
	}

}
