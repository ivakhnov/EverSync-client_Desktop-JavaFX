package application;

public class OSValidator {
	private static String _rawOs = System.getProperty("os.name").toLowerCase();
	private static String _os; 
	 
	public OSValidator() {
 
		System.out.println(_rawOs);
 
		if (isWindows()) {
			System.out.println("Windows");
			_os = "Windows";
		} else if (isMac()) {
			System.out.println("Mac");
			_os = "Mac";
		} else if (isUnix()) {
			System.out.println("Unix or Linux");
			_os = "Unix or Linux";
		} else if (isSolaris()) {
			System.out.println("Solaris");
			_os = "Solaris";
		} else {
			System.out.println("Unsupported");
			_os = "Unsupported";
		}
	}
	
	public String getOS() {
		return _os;
	}
 
	public static boolean isWindows() {
 
		return (_rawOs.indexOf("win") >= 0);
 
	}
 
	public static boolean isMac() {
 
		return (_rawOs.indexOf("mac") >= 0);
 
	}
 
	public static boolean isUnix() {
 
		return (_rawOs.indexOf("nix") >= 0 || _rawOs.indexOf("nux") >= 0 || _rawOs.indexOf("aix") > 0 );
 
	}
 
	public static boolean isSolaris() {
 
		return (_rawOs.indexOf("sunos") >= 0);
 
	}
 
}