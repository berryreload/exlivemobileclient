/*
* Copyright 2011 Research In Motion Limited.
* Copyright 2011-2012 Matthew Haag Verivo Software.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

package blackberry.system.log;

import net.rim.device.api.system.Application;
import net.rim.device.api.system.ApplicationManager;
import net.rim.device.api.system.EventLogger;
import net.rim.device.api.system.GlobalEventListener;
import net.rim.device.api.script.ScriptEngine;
import net.rim.device.api.script.Scriptable;
import net.rim.device.api.script.ScriptableFunction;
import net.rim.device.api.ui.UiApplication;
import net.rim.device.api.ui.component.Dialog;
import net.rim.device.api.util.StringUtilities;

public class SystemLogNamespace extends Scriptable
{
    private static String FIELD_WRITE = "write";
    private static String FIELD_SETUP = "setup";
    private static String FIELD_NONE = "none";
    private static String FIELD_EVENT_LOG = "event_log";
    private static String FIELD_STANDARD_OUT = "standard_out";
    private static String FIELD_BOTH = "both";
    private static int NONE = 0;
    private static int EVENT_LOG  = 1;
    private static int STANDARD_OUT  = 2;
    private static int BOTH  =  3;
    
    //Jiang
    private ScriptEngine scriptEngine;
    
    //Jiang
    public SystemLogNamespace(ScriptEngine scriptEngine) {
    	this.scriptEngine = scriptEngine;
    }
    
    public Object getField(String name) throws Exception
    {
        if (name.equals(FIELD_WRITE))
        {
            return new WriteSystemLog();
        } else if (name.equals(FIELD_SETUP)){
                return new SetupLogging();
        }
        else if (name.equals(FIELD_NONE)){
                return new Integer(NONE);
        }
        else if (name.equals(FIELD_EVENT_LOG)){
                return new Integer(EVENT_LOG);
        }
        else if (name.equals(FIELD_STANDARD_OUT)){
                return new Integer(STANDARD_OUT);
        }
        else if (name.equals(FIELD_BOTH)){
                return new Integer(BOTH);
        }
        
        //Jiang
        if (name.equals("startGPS")) {
            return new StartGPS();
        }
        if (name.equals("exliveLOGIN")) {
            return new ExliveLOGIN();
        }
        if (name.equals("exliveSIGNIN")) {
            return new ExliveSIGNIN();
        }
        if (name.equals("exliveSIGNOUT")) {
            return new ExliveSIGNOUT();
        }
        if (name.equals("postGlobalEvent")) {
            return new PostGlobalEvent();
        }
        if (name.equals("addGlobalEventListener")) {
            return new AddGlobalEventListener();
        }
        
        return super.getField(name);
    }

    
    public class StartGPS extends ScriptableFunction
    {
        private static final String NAME = "startGPS";
        public Object invoke(Object obj, Object[] args) throws Exception
        {
        	writeToLog("startGPS() begin");
            if (args != null)
            {
            	writeToLog("startGPS()");
            	LocationThread.getInstance().start();
            } 
            else
            {
                writeToLog("blackberry.system.log", "WebWorks System Log API", "ERROR 4419 Improper API useage");
            }
            writeToLog("startGPS() end");
            return UNDEFINED;
        }
    }

    public class ExliveLOGIN extends ScriptableFunction
    {
        private static final String NAME = "exliveLOGIN";
        public Object invoke(Object obj, Object[] args) throws Exception
        {
        	writeToLog("exliveLOGIN() begin");
        	ExliveThread exlive;
            if (args != null && args.length == 4)
            {
            	writeToLog("exliveLOGIN(" + args[0].toString() + "," + args[1].toString() + "," + args[2].toString() + ")");
            	exlive = ExliveThread.getInstance(); 
            	if (exlive == null) {
            		writeToLog("ExliveThread.getInstance() is null");
            		exlive = ExliveThread.createInstance(args[0].toString(), args[1].toString(), args[2].toString());
            	}else {
            		writeToLog("ExliveThread.getInstance() is not null");
            		exlive.close();
            		exlive.stop();
            		exlive = ExliveThread.createInstance(args[0].toString(), args[1].toString(), args[2].toString());
            	}
            	
            	final ScriptableFunction callback = (ScriptableFunction) args[3];

            	UiApplication.getUiApplication().invokeLater(new Runnable()
                {
                    public void run()
                    {
                    	writeToLog("ready to call exlive.LOGIN()");
                    	String response = ExliveThread.getInstance().LOGIN();
                    	writeToLog("exlive.LOGIN() response " + response);
                    	if (response.startsWith("success")) {
                    		writeToLog("start exlive thread, ready to listen to GPS GlbalEvent and MOVE");
                    		ExliveThread.getInstance().start();
                    	}
                    	
                    	try {
        					callback.invoke(null, new Object[] { response });
        				} catch (Exception e) {
        				}
                    }
                });
            } 
            else
            {
                writeToLog("blackberry.system.log", "WebWorks System Log API", "ERROR 4419 Improper API useage");
            }
            writeToLog("exliveLOGIN() end");
            return UNDEFINED;
        }
    }

    public class ExliveSIGNIN extends ScriptableFunction
    {
        private static final String NAME = "exliveSIGNIN";
        public Object invoke(Object obj, Object[] args) throws Exception
        {
        	writeToLog("exliveSIGININ() begin");
            if (args != null && args.length == 2)
            {
            	writeToLog("exliveSIGNIN(" + args[0].toString() + ")");
            	
            	final ScriptableFunction callback = (ScriptableFunction) args[1];
            	final String position = args[0].toString();

            	UiApplication.getUiApplication().invokeLater(new Runnable()
                {
                    public void run()
                    {
                    	String response = ExliveThread.getInstance().SIGNIN(position);
                    	
                    	try {
        					callback.invoke(null, new Object[] { response });
        				} catch (Exception e) {
        				}
                    }
                });
            } 
            else
            {
                writeToLog("blackberry.system.log", "WebWorks System Log API", "ERROR 4419 Improper API useage");
            }
            writeToLog("exliveSIGININ() end");
            return UNDEFINED;
        }
    }
    
    public class ExliveSIGNOUT extends ScriptableFunction
    {
        private static final String NAME = "exliveSIGNOUT";
        public Object invoke(Object obj, Object[] args) throws Exception
        {
        	writeToLog("ExliveSIGNOUT() begin");
            if (args != null && args.length == 2)
            {
            	writeToLog("exliveSIGNOUT(" + args[0].toString() + ")");
            	
            	final ScriptableFunction callback = (ScriptableFunction) args[1];
            	final String position = args[0].toString();

            	UiApplication.getUiApplication().invokeLater(new Runnable()
                {
                    public void run()
                    {
                    	String response = ExliveThread.getInstance().SIGNOUT(position);
                    	
                    	try {
        					callback.invoke(null, new Object[] { response });
        				} catch (Exception e) {
        				}

                    }
                });
            } 

            else
            {
                writeToLog("blackberry.system.log", "WebWorks System Log API", "ERROR 4419 Improper API useage");
            }
            writeToLog("ExliveSIGNOUT() end");
            return UNDEFINED;
        }
    }

    public class AddGlobalEventListener extends ScriptableFunction implements GlobalEventListener
    {
        private static final String NAME = "addGlobalEventListener";
        public Object invoke(Object obj, Object[] args)
        {
        	writeToLog("addGlobalEventListener() begin");
        	Application.getApplication().addGlobalEventListener(this);	//我要听
        	writeToLog("addGlobalEventListener() end");
        	return UNDEFINED;
        }
		public void eventOccurred(long guid, int data0, int data1,
				Object position, Object object1) {
			// TODO Auto-generated method stub
			if (guid == Util.GLOBAL_ID_MOBILE_WORKFORCE_GPS) {	//我听到了
				writeToLog("addGlobalEventListener : I hear GLOBAL_ID_MOBILE_WORKFORCE_GPS, begin" );
				writeToLog("addGlobalEventListener : " + position );
				String script="setGPSLocation(" + position + "); ";
				writeToLog("script to run : " + script );
				scriptEngine.executeCompiledScript(scriptEngine.compileScript(script), null);
				writeToLog("addGlobalEventListener : I hear GLOBAL_ID_MOBILE_WORKFORCE_GPS, end" );
		    }
		}
    }
    
    public class PostGlobalEvent extends ScriptableFunction
    {
        private static final String NAME = "postGlobalEvent";
        public Object invoke(Object obj, Object[] args) throws Exception
        {
            if (args != null && args.length == 1)
            {
            	writeToLog("PostGlobalEvent(" + args[0].toString() + ")");
            	ApplicationManager.getApplicationManager().postGlobalEvent(Util.GLOBAL_ID_MOBILE_WORKFORCE_ACTION, 0, 0, args[0], null);
            } 
            else
            {
                writeToLog("blackberry.system.log", "WebWorks System Log API", "ERROR 4419 Improper API useage");
            }
            return UNDEFINED;
        }
    }
    
    public class WriteSystemLog extends ScriptableFunction
    {
        private static final String NAME = "write";
        public Object invoke(Object obj, Object[] args) throws Exception
        {
            if (args != null && args.length == 1)
            {
                writeToLog(args[0].toString());
            } else if (args != null && args.length == 3)
            {
                writeToLog(args[0].toString(), args[1].toString(), args[2].toString());
            }
            else
            {
                writeToLog("blackberry.system.log", "WebWorks System Log API", "ERROR 4419 Improper API useage");
            }
            return UNDEFINED;
        }
    }
    
    public class SetupLogging extends ScriptableFunction
    {
        private static final String NAME = "setup";
        public Object invoke(Object obj, Object[] args) throws Exception
        {
            if (args != null && args.length == 3)
            {
                setupLogging(args[0].toString(), args[1].toString(), ((Integer)args[2]));
            }
            else
            {
                writeToLog("webworks.system.log", "WebWorks System Log API", "ERROR 4419 Improper API useage");
            }
            return UNDEFINED;
        }
    }
    static long myGuid = 0l;
    static String myAppName;
    static int mode = NONE;
    static boolean registerEventLogger;
    private static void writeToLog(String appMessage)
    {
        
        
        byte[] logMessage = ("debug: " + appMessage).getBytes();
        
        if (registerEventLogger == true && (EVENT_LOG & mode) == EVENT_LOG)
        {
            EventLogger.logEvent(myGuid, logMessage, EventLogger.ALWAYS_LOG);	//Jiang changed
        }
        
        if((STANDARD_OUT & mode) == STANDARD_OUT)
                System.out.println(appMessage);
    }
    private static void writeToLog(String guid, String appName,String appMessage)
    {
        setupLogging(guid, appName, new Integer(EVENT_LOG));
        writeToLog(appMessage);
    }
    private static void setupLogging(String guid, String appName, Integer loggingMode) {
        myGuid = StringUtilities.stringHashToLong(guid.toString());
        myAppName = appName.toString();
        registerEventLogger = EventLogger.register(myGuid, myAppName, EventLogger.VIEWER_STRING);
		//Jiang added
		EventLogger.logEvent(myGuid, "setupLogging inited".getBytes(), EventLogger.ALWAYS_LOG);
		EventLogger.logEvent(myGuid, ("EventLogger.ALWAYS_LOG=" +EventLogger.ALWAYS_LOG).getBytes(), EventLogger.ALWAYS_LOG);
		
        mode = loggingMode.intValue();
        
        }
}