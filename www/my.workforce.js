<!-- begin of scripts                  ************************ -->
<!-- begin of script of initialization ************************ -->

// Global variables here
var gDebugBlackBerry = true;
var gDebugBrowserAlert = false;
var gDeviceModel= "";
var gMapSize = "";

var gGeoLocation = "";	//HTML 5 location
var gGeoDate =  new Date();
var gGPSLocation = "";	//GPS location
var gLastDisplayedGPSLocation = "";
var gGPSDate =  new Date();
var gValidGPSPeriod = 60000;	//60秒内的数据为有效数据
var gTimeToAddGlobalEventListener = 60000;	//60秒后开始侦听GPS并进行MOVE操作

var gTimeoutOfExliveLOGIN = 5; //5秒内登录即告失败
var gExliveServer = "server1.exlive.springworks.info";
var gPhone = "";
var gPassword = "";
var gExliveAccountStatus = "unknown";  //unknown, success, fail

var gAppDownloadLink = 'http://exlive.springworks.info/ota/mobileworkforce/MobileWorkforce.jad';

checkDeviceModel();
addStyleForDevice();

addEventListener('load', doLoad, false);

// Startup and utilities
function doLoad() {
	// setup system and application events
	
	fn_setupLog();
	fn_setupExit();				//exit menu, excape key pressed

	fn_debug("1st time");
	$("#imgScan").bind("img").click( function(){
		doScan();
	});
	
}

<!-- end   of script of initialization ************************ -->


<!-- begin of UI controller            ************************ -->
$('#page_login').live('pageshow', function () {
	fn_addMenus();

	fn_debug("page_login pageshow begin");
	try	{
		mysettings_account_retrieve();
	} catch(err) {
		page_login_reset();
	}
	
	fn_debug("page_login pageshow end");
});

$('#home').live('pageshow', function () {
	fn_addMenus();

	try	{
		mysettings_alert_retrieve();
	} catch(err) {
		mysettings_alert_reset();
	}

	try	{
		mysettings_theme_retrieve();
	} catch(err) {
		mysettings_theme_reset();
	}

	fn_debug("home pageshow end");

});
  
$('#mylocation').live('pageshow', function () {
	fn_addMenus();
	
	fn_debug("mylocation pageshow begin");

	setTimeout(checkSIGNIN(), 500);

	setTimeout(checkLocationToUpdateMap(), 2000);
		
	fn_debug("mylocation pageshow end");
});

$('#mysettings').live('pageshow', function () {
	fn_addMenus();
});

$('#mysettings_account').live('pageshow', function () {
	fn_addMenus();
});

$('#mysettings_alert').live('pageshow', function () {
	fn_addMenus();
});

$('#mysettings_theme').live('pageshow', function () {
	fn_addMenus();
});

$('#mysettings_network').live('pageshow', function () {
	fn_addMenus();
});

$('#page_barcode').live('pageshow', function () {
	fn_addMenus();
	//去掉了，否则页面进去有闪烁
	//content="准备扫描";
	// $("#scan_result").html(content);  	
});


<!-- begin of UI controller            ************************ -->

<!-- begin of script of functions      ************************ -->
//setup BlackBerry device embedded eventlog
function fn_setupLog() {
	try {
		blackberry.system.log.setup ( "MobileWorkforce", "MobileWorkforce", 1 );
	} catch(err) {
		fn_debug("fn_setupLog blackberry.system.log.setup error: " + err);
	}
}

//start GPS tracking in Java background
function fn_startGPS() {
	fn_debug("fn_startGPS blackberry.system.log.startGPS begin");
	try {
		blackberry.system.log.startGPS();
	} catch(err) {
		fn_debug("fn_setupLog blackberry.system.log.startGPS error: " + err);
	}
	fn_debug("fn_startGPS blackberry.system.log.startGPS end");
}

//setup handling of application exit event, BlackBerry escape key
function fn_setupExit() {
	try {
		blackberry.app.event.onExit(fn_HandleExit);
		blackberry.system.event.onHardwareKey(blackberry.system.event.KEY_BACK,	fn_HandleBackKey);
	} catch(err) {
		fn_debug("blackberry.system.event.onExit or onHardwareKey error: " + err);
	}
}

//to listen and act on GPS location from other application
//it would call back setGPSLocation() 
function fn_addGlobalEventListener() {
	// do something here to initialize
	try {
		blackberry.system.log.addGlobalEventListener();
	} catch(err) {
		fn_debug("blackberry.system.log.addGlobalEventListener error: " + err);
	}
}

//called back by fn_addGlobalEventListener JavaScript/Java code
function setGPSLocation(latitude, longitude, accuracy ) {
	fn_debug("setGPSLocation begin");

	gGPSDate = new Date();
	gGPSLocation = latitude + "," + longitude + "," + accuracy; 

	fn_debug("setGPSLocation gGPSLocation new value " + gGPSLocation);
	fn_debug("setGPSLocation end");
}

function setGeoLocation(latitude, longitude, accuracy ) {
	fn_debug("setGeoLocation begin");

	gGeoDate = new Date();
	gGeoLocation = latitude + "," + longitude + "," + accuracy; 

	fn_debug("setGeoLocation geoSLocation new value " + gGeoLocation);
	fn_debug("setGeoLocation end");
}

//check if GPSLocation by GPS and setGPSLocation(), in gValidGPSPeriod
function isGPSLocationReady() {
	date = new Date();
	if (gGPSLocation == "") {
		fn_debug("isGPSLocationReady false, no GPS info");
		return false;
	}
	if ((date.getTime() - gGPSDate.getTime()) < gValidGPSPeriod) {
		fn_debug("isGPSLocationReady true, gGPSLocation " + gGPSLocation);
		return true;
	}else {
		fn_debug("isGPSLocationReady false, gGPSLocation " + gGPSLocation);
		return false;
	}
}


//check if gGeoLocation set by Browser, in gValidGPSPeriod
function isGeoLocationReady() {
	date = new Date();
	if (gGeoLocation == "") {
		fn_debug("isGeoLocationReady false, no Geo info");
		return false;
	}
	if ((date.getTime() - gGeoDate.getTime()) < gValidGPSPeriod) {
		fn_debug("isGeoLocationReady true, gGeoLocation " + gGeoLocation);
		return true;
	}else {
		fn_debug("isGeoLocationReady false, gGeoLocation " + gGeoLocation);
		return false;
	}
}
//check if GPSLocation by GPS and setGPSLocation(), in gValidGPSPeriod
//compare with gLastDisplayedGPSLocation 
//then update status and map on page mylocation
function checkGPSLocationToUpdateMap()
{
	fn_debug("checkGPSLocationToUpdateMap begin");
	
	fn_debug("checkGPSLocationToUpdateMap, gGPSLocation is " + gGPSLocation);
	fn_debug("updateLocationStatus " + gGPSLocation);
	
	//gGPSLocation = "31.241462,121.490893,50"; //外滩
	//处理一下GPS LocationListenerImpl发过来的GPS数据
	index1 = gGPSLocation.indexOf(",");
	latitude = gGPSLocation.substring(0, index1);
	index2 = gGPSLocation.indexOf(",", index1+1);
	longitude = gGPSLocation.substring(index1+1, index2);
	accuracy = gGPSLocation.substring(index2+1, gGPSLocation.length);

	updateLocationStatus('GPS定位：经度' + latitude + '，纬度' + longitude + '，定位精度' + accuracy + '米');
	updateLocationMap(latitude, longitude);
	
	fn_debug("checkGPSLocationToUpdateMap end");
}

function checkHTML5LocationToUpdateMap(){
  if(navigator.geolocation) {
	//updateLocationMap(39.913357,116.396664);	//北京天安门
	updateLocationStatus('浏览器定位中，请稍等。。。');

	navigator.geolocation.getCurrentPosition(function(position) {
		latitude = position.coords.latitude;
		longitude = position.coords.longitude;
		accuracy = position.coords.accuracy;
		setGeoLocation(latitude, longitude, accuracy);
		//updateLocationStatus('浏览器定位：经度' + Math.round(latitude * 1000)/1000 + '，纬度' + Math.round(longitude * 1000)/1000 + "，定位精度" + accuracy + "米");
		updateLocationStatus('浏览器定位：经度' + latitude + '，纬度' + longitude + "，定位精度" + accuracy + "米");
		updateLocationMap(latitude, longitude);
	});
  }else {
   updateLocationStatus('不支持浏览器定位');
  }
}

//checkHTML5LocationToUpdateMap or checkGPSLocationToUpdateMap
function checkLocationToUpdateMap(){
	if (isGPSLocationReady()) {
		checkGPSLocationToUpdateMap();
	}else {
		checkHTML5LocationToUpdateMap();
	}
}

//we support BlackBerry 9850, 9900/9930 only
function checkDeviceModel() {
	var ua = navigator.userAgent;
	if (ua.indexOf("BlackBerry 9900") >= 0) {
		gDeviceModel="blackberry.9900";
	}else if  (ua.indexOf("BlackBerry 9930") >= 0) {
		gDeviceModel="blackberry.9900";
	}else if  (ua.indexOf("BlackBerry 9850") >= 0) {
		gDeviceModel="blackberry.9850";
	}else {
		gDeviceModel = "blackberry.9900";
		position = ua.indexOf("BlackBerry ") + 11;
		model =  ua.substring(position, position + 4);
		alert("您的BlackBerry型号是：" + model + "。目前本应用屏幕适配BlackBerry 9900/9930/9850。");
	}
}

//add style for BlackBerry 9850, 9900/9930
function addStyleForDevice() {
	document.write("<link rel='stylesheet' href='my.style." + gDeviceModel + ".css' />");
		
	if (gDeviceModel == "blackberry.9850") {
		gMapSize = "490x730";	//9850
	}else {
		gMapSize = "610x340";	//9900
	}
}

<!-- begin of script of event handling ************************ -->
  function fn_addBESPushListener() {
	fn_debug("fn_addBESPushListener begin");
    try {
      var ops = {port : 910, wakeUpPage : 'index.html', maxQueueCap : 100};
      blackberry.push.openBESPushListener(ops, fn_onData, fn_onSimChange);
      fn_debug("fn_addBESPushListener() success");
    }catch (err) {
      fn_debug("fn_addBESPushListener() failed, error: " + err);
    }
	fn_debug("fn_addBESPushListener end");
  }
  
  function fn_onData(data) {
    try {
      msg = blackberry.utils.blobToString(data.payload) ;
      msg = Base64.decode(msg) ;
      fn_debug("消息：" + msg);
      return 0; //indicate acceptance of payload for reliable push
    } catch (err) {
      fn_debug("fn_onData " + err);
    }
  }

  function fn_onSimChange() {
    // SIM card is changed!
  }
<!-- end of script of event handling ************************ -->
  
  function fn_addMenus() {
    fn_debug("fn_addMenus begin");
	try {
		// clear the menu items
		blackberry.ui.menu.clearMenuItems();

		// create the menu items
		var menuItem_topSeperator1 = new blackberry.ui.menu.MenuItem(true, 0);
		var menuItem_fn_ReportBug = new blackberry.ui.menu.MenuItem(false,
				10, "移动作业-故障报告", fn_ReportBug);
		var menuItem_fn_OnlineUpdate = new blackberry.ui.menu.MenuItem(false,
				10, "移动作业-在线更新", fn_OnlineUpdate);
		var menuItem_fn_scan = new blackberry.ui.menu.MenuItem(false, 1, "扫描条码", doScan);

		blackberry.ui.menu.addMenuItem(menuItem_topSeperator1);
		blackberry.ui.menu.addMenuItem(menuItem_fn_OnlineUpdate);
		blackberry.ui.menu.addMenuItem(menuItem_fn_ReportBug);
		if ($.mobile.activePage.attr('id') !== "page_login") {
			blackberry.ui.menu.addMenuItem(menuItem_topSeperator1);
			blackberry.ui.menu.addMenuItem(menuItem_fn_scan);
		}
	} catch (e) {
		fn_debug('exception (addMenus): ' + e.name + '; ' + e.message);
	}
	fn_debug("fn_addMenus end");
}

function fn_ReportBug() {
	fn_debug("fn_ReportBug begin");
	
	try {
		var strEmailAddress = "jiyang@rim.com";
		var strSubject = "Mobile Workforce bug report";
		
		var strBody = "Please provide more detail regarding the bug at bellow. \n\r\n\rThank for your support.";
		strBody = strBody + "\n\r";
		strBody = strBody + "\n\rbug description : ";
		strBody = strBody + "\n\r";
		strBody = strBody + "\n\r";
		strBody = strBody + "\n\r";
		strBody = strBody + "\n\rapplication name : " + blackberry.app.name;
		strBody = strBody + "\n\rapplication version : " + blackberry.app.version ;
		strBody = strBody + "\n\rdevice model : " + blackberry.system.model ;
		strBody = strBody + "\n\rdevice software : " + blackberry.system.softwareVersion ;
		var args = new blackberry.invoke.MessageArguments(strEmailAddress,
				strSubject, strBody);
		args.view = blackberry.invoke.MessageArguments.VIEW_NEW;
		blackberry.invoke.invoke(blackberry.invoke.APP_MESSAGES, args);
	} catch (e) {
		fn_debug('exception (fn_ReportBug): ' + e.name + '; ' + e.message);
	}
	
	fn_debug("fn_ReportBug end");
	
}

function fn_OnlineUpdate() {
	fn_debug("fn_OnlineUpdate begin");

	try {
		var args = new blackberry.invoke.BrowserArguments(gAppDownloadLink);
		blackberry.invoke.invoke(blackberry.invoke.APP_BROWSER, args);
	} catch (e) {
		fn_debug('exception (fn_OnlineUpdate): ' + e.name + '; ' + e.message);
	}
	fn_debug("fn_OnlineUpdate end");
}

function fn_debug(msg) {
	if(gDebugBlackBerry) {
		try {
			blackberry.system.log.write(" webworks: " + msg);
		}catch(err) {
			//alert("webworks: blackberry.system.log.write " + err);
		}
	}
	if (gDebugBrowserAlert) {
		alert("webworks: " + msg);
	}
}

<!-- called by event blackberry.app.event.onExit ****** -->
function fn_HandleExit() {
	mypage = $.mobile.activePage.attr('id');
	if (mypage != 'home') {
	  fn_HandleBackKey();
	}
	//alert("请使用主界面最下方的“退出”按钮");
    //fn_exit();  //禁用 黑莓菜单close/关闭，禁用黑莓返回键。请使用程序界面中最下面的 退出 按钮。
}

<!-- called by fn_HandleExit() ****** -->
function fn_exit() {
    blackberry.app.exit();
}

<!-- called by event blackberry.system.event.onHardwareKey(blackberry.system.event.KEY_BACK ... ****** -->
function fn_HandleBackKey() {
	fn_debug("fn_HandleBackKey begin");
	closeMyPage();
	fn_debug("fn_HandleBackKey end");
}

function closeMyPage()
{
	fn_debug("closeMyPage begin");
	fn_debug("activePage is " + $.mobile.activePage.attr('id'));
	switch ($.mobile.activePage.attr('id')) {
		case 'page_login': {
			fn_exit();
		}
		break;
		case 'home': {
			fn_HandleExit();
		}
		break;
		case 'mysettings_account': {
			$.mobile.changePage('#mysettings', { transition: "slide", reverse: true});
		}
		break;
		case 'mysettings_alert': {
			$.mobile.changePage('#mysettings', { transition: "slide", reverse: true});
		}
		break;
		case 'mysettings_theme': {
			$.mobile.changePage('#mysettings', { transition: "slide", reverse: true});
		}
		break;
		case 'mysettings_network': {
			$.mobile.changePage('#mysettings', { transition: "slide", reverse: true});
		}
		break;
		default: {
			$.mobile.changePage('#home', { transition: "slide", reverse: true});
		}
	}
	fn_debug("closeMyPage end");
}


<!-- begin of script of xxx handling ************************ -->
function updateMySettingsAccountStatus(msg) {
	$("#mysettings_account_status").html(msg);
}

function page_login_save() {
	fn_debug("page_login_save begin");
	//var userObject = { username: 24, password: 'Jack Bauer' };
	var object = { server: $("#page_login_server").attr("value"), username: $("#page_login_username").attr("value") , password: $("#page_login_password").attr("value") };
	localStorage.setItem('mysettings_user_object', JSON.stringify(object));
	fn_debug("page_login_save end");
}


function mysettings_account_save() {
	//var userObject = { username: 24, password: 'Jack Bauer' };
	var object = { server: $("#mysettings_account_server").attr("value"), username: $("#mysettings_account_username").attr("value") , password: $("#mysettings_account_password").attr("value") };
	localStorage.setItem('mysettings_user_object', JSON.stringify(object));
	updateMySettingsAccountStatus("保存成功");
}

function mysettings_account_retrieve() {
	fn_debug("mysettings_account_retrieve begin");
	
	var object = localStorage.getItem('mysettings_user_object');
	
	if (object == null) {
	   updateMySettingsAccountStatus("请即刻设置帐号信息");
	
		fn_debug("mysettings_account_retrieve end");

	   return;
	}
	
	object = JSON.parse(object);

	gPhone = trim(object.username);
	gPassword = object.password;

	$("#page_login_server").attr("value", gExliveServer);
	$("#page_login_username").attr("value", gPhone);
	$("#page_login_password").attr("value", gPassword);
	$("#mysettings_account_server").attr("value", gExliveServer);
	$("#mysettings_account_username").attr("value", gPhone);
	$("#mysettings_account_password").attr("value", gPassword);
	updateMySettingsAccountStatus("取得帐号信息，修改设置后请随时保存");

	fn_debug("mysettings_account_retrieve end");
}

function mysettings_account_reset() {
	fn_debug("mysettings_account_reset begin");
	$("#mysettings_account_server").attr("value", "exlive.springworks.info");
	$("#mysettings_account_username").attr("value", "02100000004");
	$("#mysettings_account_password").attr("value", "111111");
	
	fn_debug("mysettings_account_reset end");
}

function page_login_reset() {
	fn_debug("page_login_reset begin");
	$("#page_login_server").attr("value", "exlive.springworks.info");
	$("#page_login_username").attr("value", "02100000004");
	$("#page_login_password").attr("value", "111111");
	
	fn_debug("page_login_reset end");
}

<!-- begin of script of xxx handling ************************ -->
function updateMySettingsAlertStatus(msg) {
	$("#mysettings_alert_status").html(msg);
}

// set the radio button with the given value as being checked
// do nothing if there are no radio buttons
// if the given value does not exist, all the radio buttons
// are reset to unchecked

function mysettings_alert_save() {
	fn_debug("mysettings_alert_save begin");
	
	fn_debug("choice_alert_task value " + $("input[name=choice_alert_task]:checked").val() );
	fn_debug("choice_alert_msg value " + $("input[name=choice_alert_msg]:checked").val() );
	var object = { task: $("input[name=choice_alert_task]:checked").val(), msg: $("input[name=choice_alert_msg]:checked").val() };
	localStorage.setItem('mysettings_alert_object', JSON.stringify(object));
	updateMySettingsAlertStatus("保存成功");
	
	fn_debug("mysettings_alert_save end");
	
}

function mysettings_alert_reset() { 
	fn_debug("mysettings_alert_reset begin");
	$('input:radio[name="choice_alert_task"]').get(0).checked = false;
	$('input:radio[name="choice_alert_task"]').get(1).checked = false;
	$('input:radio[name="choice_alert_task"]').get(2).checked = false;
	$('input:radio[name="choice_alert_msg"]').get(0).checked = false;
	$('input:radio[name="choice_alert_msg"]').get(1).checked = false;
	$('input:radio[name="choice_alert_msg"]').get(2).checked = false;
	
	$('input:radio[name="choice_alert_task"]').get(0).checked = true;
	$('input:radio[name="choice_alert_msg"]').get(0).checked = true;
	fn_debug("mysettings_alert_reset end");
	
}

function mysettings_alert_retrieve() {
	fn_debug("mysettings_alert_retrieve begin");
	
	var object = localStorage.getItem('mysettings_alert_object');
	
	if (object == null) {
		mysettings_alert_reset();
		updateMySettingsAlertStatus("缺省提醒方式设置，修改设置后请随时保存");
		fn_debug("mysettings_alert_retrieve end");
		return;
	}
	
	object = JSON.parse(object);
	$('input:radio[name="choice_alert_task"]').get(0).checked = false;
	$('input:radio[name="choice_alert_task"]').get(1).checked = false;
	$('input:radio[name="choice_alert_task"]').get(2).checked = false;
	$('input:radio[name="choice_alert_msg"]').get(0).checked = false;
	$('input:radio[name="choice_alert_msg"]').get(1).checked = false;
	$('input:radio[name="choice_alert_msg"]').get(2).checked = false;
	
	$('input:radio[name="choice_alert_task"]').get(object.task).checked = true;
	$('input:radio[name="choice_alert_msg"]').get(object.msg).checked = true;
	updateMySettingsAlertStatus("取得提醒方式设置，修改设置后请随时保存");
	fn_debug("mysettings_alert_retrieve end");
	
}

<!-- begin of script of xxx handling ************************ -->
function updateMySettingsThemeStatus(msg) {
	$("#mysettings_theme_status").html(msg);
}

// set the radio button with the given value as being checked
// do nothing if there are no radio buttons
// if the given value does not exist, all the radio buttons
// are reset to unchecked

function mysettings_theme_save() {
updateMySettingsThemeStatus("正在保存成功。。。");
	choice1 =  $("input[name=choices_mysettings_theme]:checked").val();
	var object = { theme: $("input[name=choices_mysettings_theme]:checked").val() };
	
	localStorage.setItem('mysettings_theme_object', JSON.stringify(object));
	updateMySettingsThemeStatus("主题设置保存成功，该设置在程序重新启动后生效。");
}

function mysettings_theme_reset() {
	fn_debug("mysettings_theme_reset begin");
	
	$('input:radio[name="choices_mysettings_theme"]').get(0).checked = false;
	$('input:radio[name="choices_mysettings_theme"]').get(1).checked = false;
	$('input:radio[name="choices_mysettings_theme"]').get(2).checked = false;
	$('input:radio[name="choices_mysettings_theme"]').get(3).checked = false;
	$('input:radio[name="choices_mysettings_theme"]').get(4).checked = false;
	
	$('input:radio[name="choices_mysettings_theme"]').get(2).checked = true;
	if (gDebugBlackBerry) {
		fn_debug("mysettings_theme_reset end");
		}
}

function mysettings_theme_retrieve() {
	fn_debug("mysettings_theme_retrieve begin");
	
	var theme = 'b';
	var object = localStorage.getItem('mysettings_theme_object');
	
	if (object == null) {
		theme = 'b';
		$('input:radio[name="choices_mysettings_theme"]').get(0).checked = false;
		$('input:radio[name="choices_mysettings_theme"]').get(1).checked = false;
		$('input:radio[name="choices_mysettings_theme"]').get(2).checked = false;
		$('input:radio[name="choices_mysettings_theme"]').get(3).checked = false;
		$('input:radio[name="choices_mysettings_theme"]').get(4).checked = false;
		$('input:radio[name="choices_mysettings_theme"]').get(2).checked = true;
	   updateMySettingsThemeStatus("缺省主题置，修改设置后请随时保存");
	} else {
		object = JSON.parse(object);
		$('input:radio[name="choices_mysettings_theme"]').get(object.theme).checked = true;
		if (object.theme == 0) theme = 'a';
		if (object.theme == 1) theme = 'f';
		if (object.theme == 2) theme = 'b';
		if (object.theme == 3) theme = 'c';
		if (object.theme == 4) theme = 'e';
		/*
		$('#mylocation').attr("data-theme", theme);
		$('#mysettings').attr("data-theme", theme);
		$('#mysettings_account').attr("data-theme", theme);
		$('#mysettings_theme').attr("data-theme", theme);
		$('#mysettings_alert').attr("data-theme", theme);
		$('#mysettings_network').attr("data-theme", theme);
		*/
	}		
  
	updateMySettingsThemeStatus("取得主题设置，修改设置后请随时保存");
		
	fn_debug("mysettings_theme_retrieve end");
	
	return theme;
}

function exliveLOGIN_callback(response){
	fn_debug("blackberry.system.log.exliveLOGIN_callback begin");
	gexliveLOGIN = response;
	fn_debug("exliveLOGIN response " + gexliveLOGIN);
	
	if (gexliveLOGIN.indexOf("network") >= 0) {
		fn_debug("blackberry.system.log.exliveLOGIN network error");
		$("#page_login_status").html("网络错误，请手机网络服务并正确设置黑莓TCP APN。");
	}else if (gexliveLOGIN.indexOf("success") >= 0) {
		gExliveAccountStatus = "success";
		fn_debug("blackberry.system.log.exliveLOGIN success");
	}else if (gexliveLOGIN.indexOf("fail") >= 0) {
		gExliveAccountStatus = "fail";
		fn_debug("blackberry.system.log.exliveLOGIN failed");
		updateMySettingsAccountStatus("帐号信息不正确，请联系管理员。");
		$("#page_login_status").html("帐号信息不正确，请联系管理员。");
	}
	fn_debug("gExliveAccountStatus is " + gExliveAccountStatus);
	fn_debug("blackberry.system.log.exliveLOGIN end");
	if (gExliveAccountStatus == "success") {
		fn_debug("gExliveAccountStatus changePage home");
		fn_addBESPushListener();	
		setTimeout(fn_startGPS, gTimeToAddGlobalEventListener);	//60秒后开始侦听GPS
		setTimeout(fn_addGlobalEventListener, gTimeToAddGlobalEventListener);	//60秒后开始侦听GPS并进行MOVE操作
		$("#myhome_status").html("欢迎：" + gPhone); 
		$.mobile.changePage('#home', { transition: "slide", reverse: true});
	}
}
function exliveLOGIN(){
	fn_debug("blackberry.system.log.exliveLOGIN begin");
	page_login_save();
	mysettings_account_retrieve();
	$("#page_login_status").html("正在登录。。。");
	try {
		var serverURL = "datagram://" + gExliveServer + ":7878;deviceside=true;timeout=" + gTimeoutOfExliveLOGIN + ";";
		gExliveAccountStatus == "unknown";
		blackberry.system.log.exliveLOGIN(serverURL, gPhone, gPassword, exliveLOGIN_callback);
	} catch(err) {
		gExliveAccountStatus = "unknown";
		fn_debug("blackberry.system.log.exliveLOGIN error: " + err);
		$("#page_login_status").html("网络错误，请手机网络服务并正确设置黑莓TCP APN。");
	}
}

function closeLoginInfo() {
	fn_debug("closeLoginInfo begin");
	$('#popup_login').popup('close');
	fn_debug("closeLoginInfo end");
}

function popupLoginInfo() {
	fn_debug("popupLoginInfo begin");
	$('#popup_login').popup();
	$('#popup_login').popup("open");
	//window.setTimeout(closeLoginInfo, 5000);
	fn_debug("popupLoginInfo end");
}


function checkSIGNIN_callback(data) {
	fn_debug("_callback begin"); 
	fn_debug("signTime " + data.signInTime);
	fn_debug("signOutTime " + data.signOutTime);
	if (data.signInTime == "") {	//not sign in
		$("span .ui-btn-text", $("#signin_button")).html("签到");
		$('#signin_button').button('refresh');
	} else if (data.signOutTime == "") {	//not sign out
		$("span .ui-btn-text", $("#signin_button")).html("已签到/未签退");  
		$('#signin_button').button('refresh');
	}else {
		$("span .ui-btn-text", $("#signin_button")).html("已签到/已签退");  
		$('#signin_button').button('refresh');
	}
	fn_debug("checkSIGNIN_callback end"); 
}

function checkSIGNIN() {
	fn_debug("checkSIGNIN begin"); 
	jQuery.support.cors = true;
	checkSIGNIN_url = "http://exlive.springworks.info:8080/pgps/empPr/empParamAction_sendEmpParam.action?phone=" + gPhone;
	fn_debug("checkSIGNIN_url " + checkSIGNIN_url); 
	fn_debug("clear cache for " + checkSIGNIN_url); 
	blackberry.widgetcache.clearCache (checkSIGNIN_url) ;
	
	$.getJSON(checkSIGNIN_url, checkSIGNIN_callback);
	fn_debug("checkSIGNIN end"); 
}

function exliveSIGNIN_callback(response){
	fn_debug("exliveSIGNIN_callback begin");
	fn_debug("exliveSIGNIN_callback response " + response);
	checkSIGNIN();
	fn_debug("exliveSIGNIN_callback end");
}

function exliveSIGNOUT_callback(response){
	fn_debug("exliveSIGNOUT_callback begin");
	fn_debug("exliveSIGNOUT_callback response " + response);
	checkSIGNIN();
	fn_debug("exliveSIGNOUT_callback end");
}
function exliveSIGNIN(){
	fn_debug("exliveSIGNIN begin");
	if ($("span .ui-btn-text", $("#signin_button")).html() == "已签到/已签退") {
		fn_debug("already SIGNIN and SIGNOU");
		alert("抱歉，每日只能签到签退一次");
		fn_debug("exliveSIGNIN end");
		return;
	}
	
	var location = "";
	if (isGPSLocationReady()) {
		location = gGPSLocation;
	}else if (isGeoLocationReady()) {
		location = gGeoLocation;
	}else {
		if (gGeoLocation == "") {
			fn_debug("no GeoLocation, alert user to refresh");
			alert('请“刷新”定位后再签到');
		} else {
			fn_debug("GeoLocation data is old, alert user to refresh");
			alert('定位数据过期，请点击“刷新”定位后再签到');
		}
		fn_debug("exliveSIGNIN end");
		return;
	}
	
	fn_debug("would exliveSIGNIN IN/OUT" + location);
	if ($("span .ui-btn-text", $("#signin_button")).html() == "签到") {
		fn_debug("would exliveSIGNIN " + location);
		blackberry.system.log.exliveSIGNIN(location, exliveSIGNIN_callback);
	}else if ($("span .ui-btn-text", $("#signin_button")).html() == "已签到/未签退") {
		fn_debug("would exliveSIGNOUT " + location);
		blackberry.system.log.exliveSIGNOUT(location, exliveSIGNOUT_callback);
	}else {
		fn_debug("already SIGNIN and SIGNOU");
		alert("抱歉，每日只能签到签退一次");
	}
	fn_debug("exliveSIGNIN end");
}

// Scans QR codes and Barcodes 5,6,7
function doScan() {
	// default format = all
	// cheater formats 1d + 2d = all
	var options = {'tryHarder' : true
				  }
	try{
		webworks.media.barcode.scan(onCaptured, onCaptureError, options);
	}catch(e){
		onCaptureError(e);
	}
}

function onCaptured(value) {
	fn_debug("onCaptured begin");
	content="扫描结果：" + value + "";
	$("#scan_result").html(content);  
	
	if ($.mobile.activePage.attr('id') != "page_barcode") {
		fn_debug("onCaptured changePage #page_barcode");
		$.mobile.changePage('#page_barcode', { transition: "slide", reverse: false});
	}
	fn_debug("onCaptured end");
}

function onCaptureError(error) {
	content="抱歉，没能扫描到条码。";
	$("#scan_result").html(content);  
	fn_debug('barcode scan failed, onCaptureError' + error.message + ' : ' + error.code);
}

function trim(str) {
        return str.replace(/^\s+|\s+$/g,"");
}

<!-- end of script of functions        ************************ --> 
<!-- end of scripts                    ************************ -->