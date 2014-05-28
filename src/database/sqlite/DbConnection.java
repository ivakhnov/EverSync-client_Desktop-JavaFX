package database.sqlite;

import java.sql.*;
import java.util.logging.Logger;


public abstract class DbConnection {

	// Logger for debugging purposes
	protected static Logger log = Logger.getLogger(DbConnection.class.getName());
	
	// JDBC driver name and database URL
	static final String JDBC_DRIVER = "org.sqlite.JDBC";
	static final String DB_URL = "jdbc:sqlite:EverSync.sqlite";


	public Connection _conn = null;
	public Statement _stmt = null;

	public DbConnection() {
		try {
			setConnection();
			setStatement();
		} catch (Exception e) {
			log.info("Could not connect to the database!");
			e.printStackTrace();
		}
	}

	private void setConnection() throws Exception {
		Class.forName(JDBC_DRIVER);
		_conn = DriverManager.getConnection(DB_URL);
	}


	private void setStatement() throws Exception {
		if (_conn == null) {
			setConnection();
		}
		_stmt = _conn.createStatement();
	}

	// For insert,update,delete 
	public void executeUpd(String instruction) {
		try {
			_stmt.executeUpdate(instruction);
		} catch (SQLException e) {
			log.info("Could not execute update query: " + instruction);
			e.printStackTrace();
		}
	}

	// For getting the data from the database
	public ResultSet executeQry(String instruction) {
		ResultSet rs = null;
		try {
			rs = _stmt.executeQuery(instruction);
		} catch (SQLException e) {
			log.info("Could not execute query: " + instruction);
			e.printStackTrace();
		}
		return rs;
	}
	
	// Check if a table exist
	@SuppressWarnings("finally")
	public boolean existCheck(String tableName) {
		boolean res = false;
		try {
			DatabaseMetaData dbm = _conn.getMetaData();
			// check if "employee" table is there
			ResultSet tables = dbm.getTables(null, null, tableName, null);
			if (tables.next()) {
				// Table exists
				res = true;
			}
		} finally {
			return res;
		}
	}

	// Check if a table is empty
	public boolean emptyCheck(String tableName) throws SQLException {
		ResultSet cursor = _stmt.executeQuery("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = '" + tableName + "'");
		if (!cursor.first()) {
			return false;
		}
		int count = cursor.getInt(0);
		cursor.close();
		return count > 0;
	}

	public void closeConnection() {
		try { _conn.close(); } catch (Exception ignore) {}
	}
}
