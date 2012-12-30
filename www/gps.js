var LOCATION_CELLSITE = 0;
var LOCATION_ASSISTED = 1;
var LOCATION_AUTONOMOUS = 2;
var curLocation = "";
var updateCounter = 0;

<!-- begin of script of google map    ************************ -->
var map;//地图
var vhcMarkerArr;//车辆标注数组  

Array.prototype.del=function(n) {  //n表示第几项，从0开始算起。
//prototype为对象原型，注意这里为对象增加自定义方法的方法。
  if(n<0)  //如果n<0，则不进行任何操作。
    return this;
  else
    return this.slice(0,n).concat(this.slice(n+1,this.length));
    /**//*
      concat方法：返回一个新数组，这个新数组是由两个或更多数组组合而成的。
      　　　　　　这里就是返回this.slice(0,n)/this.slice(n+1,this.length)
     　　　　　　组成的新数组，这中间，刚好少了第n项。
      slice方法： 返回一个数组的一段，两个参数，分别指定开始和结束的位置。
    */
}

  function map_initialize(lat, lng) {
   
    var map_canvas = document.getElementById("map_canvas"); 
	var myLatlng = new google.maps.LatLng(lat, lng);
    
    var myOptions = {
      zoom: 13,
      center: myLatlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl:false,
      mapTypeControl:false
    }

    map = new google.maps.Map(map_canvas, myOptions);
    vhcMarkerArr = new Array();

  }

  //添加标注
  function map_addMarker(lat,lng, vhcId){
	picPath = "map_redmark.gif";
    delMarker(vhcId);
	
 	var image = new google.maps.MarkerImage(picPath); 
	var latlng = new google.maps.LatLng(lat,lng);
   	var marker = new google.maps.Marker({         
		position: latlng,         
		map: map,    		       
		icon: image
	});
	
	var obj = new Object();
	obj.id = vhcID;
	obj.marker = marker;
	vhcMarkerArr.push(obj);	
  }

  //添加标注
  function addMarker(picPath,lat,lng,vhcId,gpstime,posinfo){
  
	delMarker(vhcId);

 	var image = new google.maps.MarkerImage(picPath); 

	var latlng = new google.maps.LatLng(lat,lng);
   	var marker = new google.maps.Marker({         
		position: latlng,         
		map: map,    		       
		icon: image
	});
	
	var obj = new Object();
	obj.id = vhcId;
	obj.marker = marker;
	vhcMarkerArr.push(obj);	

	var contentString = '<div id="content">时间:'+gpstime+'</div>';  
	var infowindow = new google.maps.InfoWindow({     content: contentString });

  	google.maps.event.addListener(marker, 'click', function() {     infowindow.open(map,marker);   }); 
  }
   //删除标注
  function delMarker(vhcId){       

	for(i in vhcMarkerArr){
		if(vhcMarkerArr[i].id==vhcId){
	    		vhcMarkerArr[i].marker.setMap(null);
			vhcMarkerArr = vhcMarkerArr.del(i);
	   		break;
		}
	}
  }
  //飞向指定点	
  function panToPoint(lat,lng){
	var latlng = new google.maps.LatLng(lat,lng);
	map.panTo(latlng);
  }	
<!-- end   of script of google map    ************************ -->

function updateLocationStatus(loc) {
	var ele = document.getElementById("currentLocation");
	ele.innerHTML = loc;
	if (ele.innerHTML !== loc) {
		//pre 4.6 browser - no support for DOM L2
		alert(loc);
	}
}

function updateLocationMap_old(latitude, longitude) {
	if (latitude != '') {
		htmlString = "<img src='http://maps.googleapis.com/maps/api/staticmap?key=AIzaSyBP24UOltpPGbNYDa-sS7YXKEvkxuPHfNs&";
		htmlString = htmlString + "center=" + latitude + "," + longitude + "&";
		htmlString = htmlString + "zoom=15&size=" + gMapSize + "&markers=color:red%7Clabel:S%7C|" + latitude + "," + longitude + "&sensor=false'/>";
		$("#map_canvas").html(htmlString);
	}
}

function updateLocationMap(latitude, longitude) {
	if (latitude != '') {
		//if (map == null) {
		map_initialize(latitude, longitude, 1);
		//}
		map_addMarker(latitude, longitude, 1);
		panToPoint(latitude, longitude);
	}
}

function getCoords() {
	updateCounter = updateCounter + 1;
	try {
		var lat = blackberry.location.latitude;			//Latitude: Positive values indicate northern latitude; negative values indicate southern latitude
		var lon = blackberry.location.longitude;		//Longitude: Positive values indicate eastern longitude; negative values indicate western longitude.
		if (latitude != '') {
			if (curLocation == "CellSite") 
				updateLocationStatus(updateCounter + '基站定位：经度' + latitude + '，纬度' + longitude + "；定位精度不明");
			if (curLocation == "Autonomous")
				updateLocationStatus(updateCounter + '卫星定位：经度' + latitude + '，纬度' + longitude + "；定位精度不明");
			//updateLocationMap(lat, lon);
		}else {
			if (curLocation == "CellSite")
				updateLocationStatus('基站定位：没有获得新的位置');
			if (curLocation == "Autonomous")
				updateLocationStatus('卫星定位：没有获得新的位置');
		}
	} 
	catch(e) {
		debug.log("getCoords", e, debug.exception);
	}
}
function getLocation(aidmode) {
	try {
		if ((window.blackberry === undefined) || (blackberry.location === undefined)) {
			updateLocationStatus('<i>The <b>blackberry.location</b> object is not supported.</i>');
			return false;
		}


		if (blackberry.location.GPSSupported) {
			updateLocationStatus('Retrieving ' + curLocation + ' GPS Coordinates ...');
			blackberry.location.setAidMode(aidmode);		//Mechanism used to obtain the GPS location.
			blackberry.location.onLocationUpdate("getCoords()");	//Jiang Yang 不断刷新GPS信息  
			blackberry.location.refreshLocation();			//Called to make ensure accurate co-ordinates are returned.
			getCoords();
		} 
		else {
			updateLocationStatus('GPS is not supported on this device');
		}
	} 
	catch(e) {
		debug.log("getLocation", e, debug.exception);
	}
}
function getCellSite() {
	curLocation = "CellSite";
	getLocation(LOCATION_CELLSITE);
}
function getAssisted() {
	curLocation = "Assisted";
	getLocation(LOCATION_ASSISTED);
}
function getAutonomous() {
	curLocation = "Autonomous";
	getLocation(LOCATION_AUTONOMOUS);
}

//display the new location
function locationUpdated() {
	try {
		var latitude, longitude, pf, support;

		if ((window.blackberry === undefined) || (blackberry.location === undefined)) {
			updateLocationStatus('<i>The <b>blackberry.location</b> object is not supported.</i>');
			return false;
		}

		latitude = "unknown";
		longitude = "unknown";
		curLocation = "Default";
		pf = navigator.platform;
		if (pf === "BlackBerry") {
			support = blackberry.location.GPSSupported;
			if (support) {
				//refresh the location
				blackberry.location.refreshLocation();
				latitude = blackberry.location.latitude;
				longitude = blackberry.location.longitude;
			}
		}
		updateLocationStatus(curLocation + ' location: ' + latitude + ", " + longitude);
	} 
	catch(e) {
		debug.log("locationUpdated", e, debug.exception);
	}
}