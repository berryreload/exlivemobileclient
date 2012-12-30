package blackberry.system.log;

import javax.microedition.location.Location;
import javax.microedition.location.LocationListener;
import javax.microedition.location.LocationProvider;


import net.rim.device.api.system.ApplicationManager;

/**
 * Implementation of the LocationListener interface. Listens for updates to
 * the device location and displays the results.
 */
public class LocationListenerImpl implements LocationListener
{
	private boolean fakeData = false;
	public LocationListenerImpl() {
	
	}
	

    /**
     * @see javax.microedition.location.LocationListener#locationUpdated(LocationProvider,Location)
     */
    public void locationUpdated(LocationProvider provider, Location location)
    {
    	Util.log("timely locationUpdated...");
        if(location.isValid())
        {
        	Util.log("location is Valid");
            float heading = location.getCourse();
            double _longitude = location.getQualifiedCoordinates().getLongitude();
            double double_latitude = location.getQualifiedCoordinates().getLatitude();
            float altitude = location.getQualifiedCoordinates().getAltitude();
            float speed = location.getSpeed();

        	//exlive要计算过的GPS数据
	        LocationDocument doc = new LocationDocument(); 
	        doc.setCurrentTimeMillis(System.currentTimeMillis());
	        doc.setLocationData(location.getQualifiedCoordinates().getLatitude(),
	        				location.getQualifiedCoordinates().getLongitude(),
	        				location.getSpeed(),
	        				location.getCourse()
	        				);
	        String position = "A," + doc.getLatitudeString() + ",N," + doc.getLongitudeString() + ",E," + doc.getSpeedString() +"," + doc.getHeadingString();
        	Util.log("postGlobalEvent GLOBAL_ID_MOBILE_WORKFORCE_GPS4EXLIVE " + position );
        	ApplicationManager.getApplicationManager().postGlobalEvent(Util.GLOBAL_ID_MOBILE_WORKFORCE_GPS4EXLIVE, 0,0, position, null);

        	//google地图显示 gps没有计算过的数据
        	position = location.getQualifiedCoordinates().getLatitude() + "," +
        			location.getQualifiedCoordinates().getLongitude()  + "," +
        			location.getQualifiedCoordinates().getHorizontalAccuracy();
        	ApplicationManager.getApplicationManager().postGlobalEvent(Util.GLOBAL_ID_MOBILE_WORKFORCE_GPS, 0,0, position, null);
        	Util.log("postGlobalEvent GLOBAL_ID_MOBILE_WORKFORCE_GPS " + position );
        	
        }else {
        	Util.log("location is not Valid");
    		Util.log("send global msg of location Beijing");
    		if (fakeData) {
	    		LocationDocument doc = LocationThread.getFakeLocation();
	        	String position = "A," + doc.getLatitudeString() + ",N," + doc.getLongitudeString() + ",E," + doc.getSpeedString() +"," + doc.getHeadingString();
	        	ApplicationManager.getApplicationManager().postGlobalEvent(Util.GLOBAL_ID_MOBILE_WORKFORCE_GPS4EXLIVE, 0,0, position, null);
	        	Util.log("postGlobalEvent GLOBAL_ID_MOBILE_WORKFORCE_GPS4EXLIVE " + position );
	        	position = 31.241462 + "," +
	        			 121.490893  + "," +
	        			 50 ;	//the bund of Shanghai
	        	Util.log("postGlobalEvent GLOBAL_ID_MOBILE_WORKFORCE_GPS " + position );
	        	ApplicationManager.getApplicationManager().postGlobalEvent(Util.GLOBAL_ID_MOBILE_WORKFORCE_GPS, 0,0, position, null);
    		}
        }
    }


    /**
     * @see javax.microedition.location.LocationListener#providerStateChanged(LocationProvider, int)
     */
    public void providerStateChanged(LocationProvider provider, int newState)
    {
        if(newState == LocationProvider.TEMPORARILY_UNAVAILABLE)
        {
            provider.reset();
        }
    }
}
