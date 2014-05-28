package database.sqlite;

import java.sql.Statement;

public class DbCreation {

	private static final String CLIENT_MODEL = "CREATE TABLE ClientModel ( id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "+
																			"client_id TEXT, " +
																			"root_path TEXT )";
	
	public DbCreation(Statement stmt) throws Exception {
		super();
		// Execute the queries
		stmt.executeUpdate(CLIENT_MODEL);
	}

}
