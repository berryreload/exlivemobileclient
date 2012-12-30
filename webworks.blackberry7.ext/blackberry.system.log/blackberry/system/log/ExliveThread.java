package blackberry.system.log;

import java.io.IOException;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

import javax.microedition.io.Connector;
import javax.microedition.io.Datagram;
import javax.microedition.io.UDPDatagramConnection;

import net.rim.device.api.i18n.DateFormat;
import net.rim.device.api.i18n.SimpleDateFormat;
import net.rim.device.api.system.Application;
import net.rim.device.api.system.GlobalEventListener;

/**
 * This class represents the client in a client/server configuration
 */
public final class ExliveThread extends Thread implements GlobalEventListener
{    
    private String exliveserver ="unknown";  	//= "datagram://shanghai.springworks.info:7878;deviceside=true;timeout=5;";
    private String phone = "unknown";
    private String password = "unknown";
	private int LINK_INTERVAL = 20000; //60000 = 60 seconds
	
	String msg_NETWORK_ERROR = "network error";
	String msg_FAILED_TO_LOGIN = "failed to LOGIN";
	String msg_SUCCESS_TO_LOGIN = "success to LOGIN";
	String msg_FAILED_TO_SIGNIN = "failed to SIGNIN";
	String msg_SUCCESS_TO_SIGNIN = "success to SIGNIN";
	String msg_FAILED_TO_SIGNOUT = "failed to SIGNOUT";
	String msg_SUCCESS_TO_SIGNOUT = "success to SIGNOUT";
	String msg_FAILED_TO_LINK = "failed to LINK";
	String msg_SUCCESS_TO_LINK = "success to LINK";
	String msg_FAILED_TO_MOVE = "failed to MOVE";
	String msg_SUCCESS_TO_MOVE = "success to MOVE";
	
    private static ExliveThread _instance = null;
    private static String lock = "lock"; 
    
	private UDPDatagramConnection _conn = null;
    private boolean _running = false;
    
    
    /**
     * Creates a new UDPClient object
     * @param msg The message sent to the server
     */
    private ExliveThread()
    {
    }
    
    public static ExliveThread getInstance() {
    	synchronized(lock) {
    		return _instance;
    	}
	}

    public static ExliveThread createInstance(String exliveserver, String phone, String password) {
    	Util.log("createInstance() begin");
    	synchronized(lock) {
    		if (_instance == null) {
    			Util.log("debug new ExliveThread()");
    			_instance = new ExliveThread();
    		}
	    
    		Util.log("new ExliveThread() ok");
			_instance.exliveserver = exliveserver;
			_instance.phone = phone;
			_instance.password = password;
			
			Util.log("debug createInstance() end");
			return _instance;
    	}
	}
    
    
    public void run () {
    	_running = true;
		Application.getApplication().addGlobalEventListener(_instance);	//我要听
    	while (_running) {
        	try{
        		sleep(LINK_INTERVAL);
	        	LINK();
        	}catch (InterruptedException e) {
        		Util.log("ExliveThread Interrupted");
            	_running = false;
        		Application.getApplication().removeGlobalEventListener(_instance);
        	}
    	}
    	close();
    }
    
    public void stop() {
    	_running = false;
		Application.getApplication().removeGlobalEventListener(_instance);
    }

    public void close() {
        try
        {
            if(_conn != null)
            {
                // Close the connection
            	Util.log("close connection to exlive...");
                _conn.close();
            }
        }
        catch(IOException e){}
        finally{
        	_conn = null;
        }
    }
    
    public String LOGIN()
    {
    	Util.log("LOGIN() begin");
    	
    	String msg = msg_FAILED_TO_LOGIN;
	    try
        {
        	Util.log("connect to exlive server... " + exliveserver);
        	_conn = (UDPDatagramConnection)Connector.open(exliveserver);           
        	Util.log("connected to exlive server");

        	String _cmd = "*EX," + phone + ",LOGIN," + phone + "," + password + "#";
        	Util.log(_cmd);

            // Convert the message to a byte array for sending.
            byte [ ] bufOut = _cmd.getBytes();

            // Create a datagram and send it across the connection.
            Datagram outDatagram = _conn.newDatagram(bufOut, bufOut.length);
            _conn.send(outDatagram);
            
            // Expect a response
            byte[] bufIn = new byte[64];            
            Datagram inDatagram = _conn.newDatagram(bufIn, bufIn.length);
            _conn.receive(inDatagram);
            String response = new String(inDatagram.getData());
            Util.log(response);
            if (response.endsWith("LOGIN,TRUE#")) {
            	msg = msg_SUCCESS_TO_LOGIN;
            }else {
            	//close();
            }
        }
        catch(IOException e)
        {
        	msg = msg_NETWORK_ERROR;
            Util.log(msg +e.toString());
            close();
        }
	    catch(Exception e)
        {
        	Util.log(msg +e.toString());
            close();
        }
        Util.log(msg);
        return msg;
    }
    
    private String LINK()
    {
    	synchronized(lock) {
    		String msg =msg_FAILED_TO_LINK;
    		if (_conn == null)
    			LOGIN();
    	
	    	if (_conn == null)
	    		return msg;
	    	
	        try
	        {
	        	String _cmd = "*EX," + phone + ",LINK#";
	        	Util.log(_cmd);
	            // Convert the message to a byte array for sending.
	            byte [ ] bufOut = _cmd.getBytes();
	            
	            // Create a datagram and send it across the connection.
	            Datagram outDatagram = _conn.newDatagram(bufOut, bufOut.length);
	            _conn.send(outDatagram);
	            
	            // Expect a response
	            byte[] bufIn = new byte[64];            
	            Datagram inDatagram = _conn.newDatagram(bufIn, bufIn.length);
	            _conn.receive(inDatagram);
	            String response = new String(inDatagram.getData());
	            Util.log(response);
	            if (response.endsWith("RECVED,LINK##")) {
	            	msg = msg_SUCCESS_TO_LINK;
	            }else {
	            	close();
	            }
	        }
	        catch(IOException e)
	        {
	        	msg = msg_NETWORK_ERROR;
	            Util.log(msg +e.toString());
	            close();
	        }
		    catch(Exception e)
	        {
	        	Util.log(msg +e.toString());
	            close();
	        }
	        Util.log(msg);
	    	close();
		    return msg;
    	}
    }        

    
    public String SIGNIN(String position)
    {
    	synchronized(lock) {
    		Util.log("SIGNIN(" + position + ") begin");
    		String msg = msg_FAILED_TO_SIGNIN;

    		if (_conn == null)
        		LOGIN();
        		
	    	if (_conn == null)
	    		return msg;
	    	
	    	//'A,3954.8014,N,11623.7998,E,100,100'
	    	LocationDocument doc = new LocationDocument();
	    	doc.setLocationData(position);
	    	position = "A," + doc.getLatitudeString() + ",N," + doc.getLongitudeString() + ",E," + doc.getSpeedString() +"," + doc.getHeadingString();
	        
	    	try
	        {
	        	String _cmd = "*EX," + phone + ",SIGNIN," + getTimeString() + "," + position + "," + getDateString() + ",FBFFFFFF#";
	        	Util.log(_cmd);
	        	
	            // Convert the message to a byte array for sending.
	            byte [ ] bufOut = _cmd.getBytes();
	            
	            // Create a datagram and send it across the connection.
	            Datagram outDatagram = _conn.newDatagram(bufOut, bufOut.length);
	            _conn.send(outDatagram);
	            
	            // Expect a response
	            byte[] bufIn = new byte[64];            
	            Datagram inDatagram = _conn.newDatagram(bufIn, bufIn.length);
	            _conn.receive(inDatagram);
	            String response = new String(inDatagram.getData());
	            Util.log(response);
	            if (response.endsWith("RECVED,SIGNIN#")) {
	            	msg = msg_SUCCESS_TO_SIGNIN;
	            }else {
	            	close();
	            }
	        }
	        catch(IOException e)
	        {
	        	msg = msg_NETWORK_ERROR;
	            Util.log(msg +e.toString());
	            close();
	        }
		    catch(Exception e)
	        {
	        	Util.log(msg +e.toString());
	            close();
	        }
	        Util.log(msg);
		    return msg;
    	}
    }        

    public String SIGNOUT(String position)
    {
    	synchronized(lock) {
	    	Util.log("SIGNOUT(" + position + ") begin");
	    	String msg = msg_FAILED_TO_SIGNOUT;

    		if (_conn == null)
        		LOGIN();
        		
	    	if (_conn == null)
	    		return msg;
	    	
	    	//'A,3954.8014,N,11623.7998,E,100,100'
	    	LocationDocument doc = new LocationDocument();
	    	doc.setLocationData(position);
	    	position = "A," + doc.getLatitudeString() + ",N," + doc.getLongitudeString() + ",E," + doc.getSpeedString() +"," + doc.getHeadingString();
	    	
	        try
	        {
	        	String _cmd = "*EX," + phone + ",SIGNOUT," + getTimeString() + "," + position + "," + getDateString() + ",FBFFFFFF#";
	        	Util.log(_cmd);
	        	
	            // Convert the message to a byte array for sending.
	            byte [ ] bufOut = _cmd.getBytes();
	            
	            // Create a datagram and send it across the connection.
	            Datagram outDatagram = _conn.newDatagram(bufOut, bufOut.length);
	            _conn.send(outDatagram);
	            
	            // Expect a response
	            byte[] bufIn = new byte[64];            
	            Datagram inDatagram = _conn.newDatagram(bufIn, bufIn.length);
	            _conn.receive(inDatagram);
	            String response = new String(inDatagram.getData());
	            Util.log(response);
	            if (response.endsWith("RECVED,SIGNOUT#")) {
	                msg = msg_SUCCESS_TO_SIGNOUT;
	           }else {
	        	   close();
	            }
	        }
	        catch(IOException e)
	        {
	        	msg = msg_NETWORK_ERROR;
	            Util.log(msg +e.toString());
	            close();
	        }
		    catch(Exception e)
	        {
	        	Util.log(msg +e.toString());
	            close();
	        }
	        Util.log(msg);
	        return msg;
    	}
    }        

    private String MOVE(String position)
    {
    	synchronized(lock) {
	    	Util.log("MOVE(" + position + ") begin");
	    	String msg = msg_FAILED_TO_MOVE;

	    	if (_conn == null)
	    		LOGIN();
	    	
	    	if (_conn == null)
	    		return msg;
	    	
	    	//'A,3954.8014,N,11623.7998,E,100,100'
	    	//LocationDocument doc = new LocationDocument();
	    	//doc.setLocationData(position);
	    	//position = "A," + doc.getLatitudeString() + ",N," + doc.getLongitudeString() + ",E," + doc.getSpeedString() +"," + doc.getHeadingString();
	    	
	        try
	        {
	        	String _cmd = "*EX," + phone + ",MOVE," + getTimeString() + "," + position + "," + getDateString() + ",FBFFFFFF#";
	        	Util.log(_cmd);
	        	
	            // Convert the message to a byte array for sending.
	            byte [ ] bufOut = _cmd.getBytes();
	            
	            // Create a datagram and send it across the connection.
	            Datagram outDatagram = _conn.newDatagram(bufOut, bufOut.length);
	            _conn.send(outDatagram);
	            
	            // Expect a response
	            byte[] bufIn = new byte[64];            
	            Datagram inDatagram = _conn.newDatagram(bufIn, bufIn.length);
	            _conn.receive(inDatagram);
	            String response = new String(inDatagram.getData());
	            Util.log(response);
	            if (response.endsWith("RECVED,MOVE#")) {
	            	msg = msg_SUCCESS_TO_MOVE;
	            }else {
	            	close();
	            }
	        }
	        catch(IOException e)
	        {
	        	msg = msg_NETWORK_ERROR;
	            Util.log(msg +e.toString());
	            close();
	        }
		    catch(Exception e)
	        {
	        	Util.log(msg +e.toString());
	            close();
	        }
	        Util.log(msg);
	        return msg;
    	}
    }        

    //053651	时间(格林尼治)	 下午13点36分51秒
    //日期格式 参考：http://stackoverflow.com/questions/4656267/how-to-format-date-in-blackberry
    private String getTimeString() {
    	DateFormat df = new SimpleDateFormat("hhmmss");
    	
    	SimpleDateFormat sdf = new SimpleDateFormat("hhmmss");
    	Date timenow = new Date(System.currentTimeMillis());
    	Calendar cal = Calendar.getInstance();
    	cal.setTimeZone(TimeZone.getTimeZone("GMT+"));
    	cal.setTime(timenow);
    	String formatedTime = sdf.format(cal);
    	//Util.log("date string " + formatedTime);
    	
    	return formatedTime;
    }
    
    //180510	日月年 2010年05月18日 
    //日期格式 参考：http://stackoverflow.com/questions/4656267/how-to-format-date-in-blackberry
    private String getDateString() {
    	DateFormat df = new SimpleDateFormat("ddMMyy");
    	
    	StringBuffer sb = new StringBuffer();
    	df.formatLocal(sb,System.currentTimeMillis());
    	String dateString = sb.toString();
    	//Util.log("date string " + dateString);
    	
    	return dateString;
    }

	public void eventOccurred(long guid, int data0, int data1, Object obj0,
			Object obj1) {
		Util.log("ExliveThread eventOccurred");
	    if (guid == Util.GLOBAL_ID_MOBILE_WORKFORCE_GPS4EXLIVE) {	//我听到了
	    	Util.log("ExliveThread eventOccurred GLOBAL_ID_MOBILE_WORKFORCE_GPS4EXLIVE");
	    	MOVE((String)obj0);
	    }
	}
}
