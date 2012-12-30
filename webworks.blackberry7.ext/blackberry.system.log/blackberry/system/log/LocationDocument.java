package blackberry.system.log;

import net.rim.device.api.util.MathUtilities;
import net.rim.device.api.util.Persistable;

public class LocationDocument implements Persistable{
	
	private double latitude = 0;
	private double longitude = 0;
	private float heading = 0;
	private float speed = 0; 
	private long currentTimeMillis = 0;


	public void setCurrentTimeMillis(long currentTimeMillis) {
		this.currentTimeMillis = currentTimeMillis;
	}
	//for Exlive, need transform http://vip4.exlive.cn/synthReports/home/xtwd/jiekou/personal.jsp
	private String latStr;
	private String lngStr;

	public void setLocationData(String data) {
		Util.log("setLocationData " + data + " begin");
		int index1 = data.indexOf(",");
		latitude = Double.parseDouble(data.substring(0, index1));
		
		int index2 = data.indexOf(",", index1+1);
		longitude = Double.parseDouble(data.substring(index1+1, index2));

		setLocationData(latitude, longitude, 0, 0);
		Util.log("setLocationData " + data + " begin");
	}
	
	public void setLocationData(double latitude, double longitude, float speed, float heading) {
		Util.log("setLocationData begin Lat " + this.latitude + " Lng " + this.longitude + 
				" Speed " + this.speed + " Heading " + this.heading);
		this.latitude = latitude;
		this.longitude = longitude;
		this.speed = speed;
		this.heading = heading;
		int az=(int)latitude;
		double ax=latitude-az;
		latStr = az+""+substr(String.valueOf(ax*60));
		int nz = (int)longitude;
		double nx = longitude-nz;
		lngStr = nz+""+substr(String.valueOf(nx*60));
		Util.log("setLocationData end Lat " + this.getLatitudeString() + " Lng " + this.getLongitudeString() + 
				" Speed " + this.getSpeedString() + " Heading " + this.getHeadingString());
	}

	private String substr(String str){
		if(str.length()>7){
			int dex = str.indexOf(".");
			String i = str.substring(0,dex);
			if(i.length()<2)
				i="0"+i;
			String j = str.substring(dex,dex+5);
			return i+j;
		}
		
		return str;
	}

	public String getLatitudeString() {
		//Util.log("latitude " + latitude + "String is " + latStr);
		return latStr;
	}

	public String getLongitudeString() {
		//Util.log("longitude " + longitude + "String is " + lngStr);
		return lngStr;
	}
	public String getHeadingString() {
		//000	方向 360度
		String msg = Integer.toString(1000 + MathUtilities.round(heading));
		//Util.log("heading String " + msg);
		//Util.log("heading String " + msg.substring(1,4));
		return msg.substring(1,4);
	}
	public String getSpeedString() {
		String msg = Float.toString((float) (speed + 0.00001));
		msg = msg.substring(0,3);
			
		//Util.log("speed String " + msg);
		return msg;
	}
	public long getCurrentTimeMillis() {
		return currentTimeMillis;
	}
}
