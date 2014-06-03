package database.sqlite;

import java.sql.Statement;

public class DbCreation {

	private static final String CLIENT_MODEL = 
			"CREATE TABLE ClientModel ( id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "+
										"client_id TEXT, " +
										"root_path TEXT )";
	private static final String FILES = 
			"CREATE TABLE Files ( path TEXT PRIMARY KEY, "+
								" last_modified INTEGER NOT NULL)";
	
	public DbCreation(Statement stmt) throws Exception {
		// Execute the queries
		stmt.executeUpdate(CLIENT_MODEL);
		stmt.executeUpdate(FILES);
	}

}
