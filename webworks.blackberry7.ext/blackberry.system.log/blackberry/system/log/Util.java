package blackberry.system.log;

import net.rim.device.api.system.EventLogger;
import net.rim.device.api.ui.UiApplication;
import net.rim.device.api.ui.component.Dialog;

public class Util {
	public static final String appName = "MobileWorkForce";
	public static final long GUID = 0x9bf085e1e5a02d53L ;
	public static final long GLOBAL_ID_MOBILE_WORKFORCE_ACTION = 0x9a9aabaa018994c0L ;
	public static final long GLOBAL_ID_MOBILE_WORKFORCE_GPS = 	0xf88b377f80e07d60L;
	public static final long GLOBAL_ID_MOBILE_WORKFORCE_GPS4EXLIVE = 	0x22da919150630535L;
    // Create a ResourceBundle object to contain the localized resources.
    //private static ResourceBundle _resources = ResourceBundle.getBundle(BUNDLE_ID, appName);

	public static void loggerInit() {
		EventLogger.register(GUID, appName, EventLogger.VIEWER_STRING);
		log("LoggerInited");
	}

	public static void log(String msg) {
		EventLogger
				.logEvent(GUID, msg.getBytes(), EventLogger.ALWAYS_LOG);
		//alert(msg);
	}

	public static void alert(final String msg) {
        UiApplication.getUiApplication().invokeLater(new Runnable()
        {
            public void run()
            {
                Dialog.alert(msg);
            }
        });
    }

}
