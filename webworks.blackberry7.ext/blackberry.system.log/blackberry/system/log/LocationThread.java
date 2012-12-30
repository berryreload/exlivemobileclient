package blackberry.system.log;

import javax.microedition.location.Criteria;
import javax.microedition.location.LocationException;
import javax.microedition.location.LocationProvider;

import net.rim.device.api.gps.GPSInfo;

public class LocationThread extends Thread{

    // Represents period of the position query, in seconds
    private static int _interval = 6;

    private LocationProvider _locationProvider = null;
	
    private static LocationThread instance = null;
    Criteria criteria = new Criteria();
	private LocationListenerImpl _locationListener = null;
	
	private boolean _running = true;
	
    private LocationThread() {
    	
    }
	
    
	public static LocationThread getInstance() {
		if (instance == null) {
				instance = new LocationThread();
		}
		return instance;
	}
    
	public void stop () {
		_running = false;
	}
	
	public void run () {
    	_running = true;
    	startLocationUpdate();
    	
    	while (_running) {
        	try {
				sleep(60000); //60000 = 60 seconds
			} catch (InterruptedException e) {
				Util.log("LocationThread Interrupted " + e);
			}
    	}
    }
	
	
	public static LocationDocument getFakeLocation() {
        LocationDocument doc = new LocationDocument(); 
        doc.setLocationData(31.241462,121.490893, 100,100);	//the bund of Shanghai
        
        return doc;
	}
	/**
     * Invokes the Location API with Standalone criteria
     * 
     * @return True if the <code>LocationProvider</code> was successfully started, false otherwise
     */
    private boolean startLocationUpdate()
    {
        boolean returnValue = false;
        
        Util.log("startLocationUpdate()...");
        if(!(GPSInfo.getDefaultGPSMode() == GPSInfo.GPS_MODE_NONE))
        {
            try
            {
                criteria.setCostAllowed(false);

                Util.log("LocationProvider.getInstance(criteria)...");
                _locationProvider = LocationProvider.getInstance(criteria);
                //Jiang Yang http://stackoverflow.com/questions/4831625/locationupdated-is-not-being-called-in-blackberry
                _locationProvider.setLocationListener( null, 0, 0, 0 );
                _locationProvider.reset();
                
                if(_locationProvider != null)
                {
                    /*
                     * Only a single listener can be associated with a provider,
                     * and unsetting it involves the same call but with null.
                     * Therefore, there is no need to cache the listener
                     * instance request an update every second.
                     */
                	Util.log("_locationProvider is not null");
                	_locationListener = new LocationListenerImpl();
                	Util.log("created LocationListenerImpl()");
                    _locationProvider.setLocationListener(_locationListener, _interval, -1, -1);
                    Util.log("setLocationListener(_locationListener, _interval, -1, -1))");
                    returnValue = true;
                }
                else
                {
                	Util.log("Failed to obtain a location provider, exiting...");
                }

            }
            catch(final LocationException le)
            {
                Util.log("Failed to instantiate LocationProvider object, exiting..." + le.toString());
            }
        }
        else
        {
        	Util.log("GPS is not supported on this device, exiting...");
        }

        return returnValue;
    }



}
