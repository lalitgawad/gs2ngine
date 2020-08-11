/**
| Program : INCLUDES_CUSTOM_GLOBALS
| Trigger : NA
| Event : NA
| Usage : EMSE Scripting
| Agency : 
| Purpose : Global Custom Variable declaration and setting
| Mark  : Revised Script
| Notes : initial Version (Accela Dev)
|       : Defined Surcharge calculation vars
|       : Defined application object vars
|       : Defined GIS Rules Object
*/

//Following like is just for DEV environment
if (matches(currentUserID, "GCOM1")) {
	showDebug = 3;
	var vDebugMsgNum = 1;
}

var sysFromEmail = "noreply@gcomsoft.com";

var acaUrl = lookup("ACA_CONFIGS", "OFFICIAL_WEBSITE_URL");
var LICENSESTATE = "NY";
var agencyName = "GCOM Software LC, NY"; // This value added by KFord for use in script 011.
// if servProvCode is not defined
if (!servProvCode) {
    var servProvCode = aa.getServiceProviderCode();
}
// default agency value
var agencyName = servProvCode;

var AddressRefID = null;
var AddressUID = null;

//Business Object for reocrd
var appObj = null;
var GS2_SCRIPT = "SCRIPT";
var GS2_BATCH = "BATCH";
var GS2_EXPR = "EMSE";
var gCaller = GS2_SCRIPT; //default

if(false) {
	//Work flow Object for Record
	var wfConfigObj = null;
	var wfProcObj = null;

	//WorkFlow Map for Doc upload
	var wfMapObj = null;

	//Auto Assign Object for Record
	var autoAssignConfigObj = null;
	var autoAssignProcessObj = null;


	//Notification Object
	//var commConfigObj = null;
	var commProcObj = null;
	var notificationObj = {};
	var asyncCustomParam = "";
	var asyncInvParam = "";
	var commProcAsyncObj = null;
	var asyncNotifWFTaskName = "";
	var asyncNotifWFTaskProcess = "";
	var printShopNotify = "";
	var permitCapIDs = "";
	var partialPermitCapID = "";
	var FTType = "";
	var FTExpDate = "";

	var primaryContact = 'Applicant';

	//Application Snapshot report
	var applnReport = null;

	//ContactMap
	var contactMap = aa.util.newHashMap();

	//GIS Rules Object
	var gGistRules = null

	// Fill Uploaded Documents Array
	var vUploadedDocuments = new Array();
	var vUpdatedRefContacts = "";
	var AGENCY_HOLIDAY_EVENT_NAMES = ["Weekend", "Holiday"];

	//Declaring Global Common and Global License Object
	var globalCommonObj = null;
	var globalLicenseObj = null;
}

var gpf = {
    "async_": true,
    "asb_": false,

    "asa_": false,
    "asa_gisasit": false,
    "asa_doc": false,
    "asa_apctprim": false,
    "asa_EdrefSub": false,
    "asa_workflow": false,
    "asa_email": false,

    "ctrca_": false,
    "ctrca_workflow": false,
    "ctrca_gisasit": false,
    "ctrca_doc": false,
    "ctrca_EdrefSub": false,
    "ctrca_email": false,
    "ctrca_paymentreceipt": false
};

/*function debugMessage(ipMsgVar)
{
	if (!showDebug)
		return;
	var vMsgVal = null;
	try
	{
		vMsgVal = eval(ipMsgVar);
	}
	catch(vError)
	{
	}
	var vDispMsg = ipMsgVar;
	if (vMsgVal != null && vMsgVal != ipMsgVar)
		vDispMsg = "Variable " + vDispMsg + ":= " + vMsgVal;
	logDebug("Message By:= " + currentUserID + ": In Script:= " + vScriptName + ":" + String.fromCharCode(13) + String.fromCharCode(10) + "Message Num:= " + vDebugMsgNum + ": " + vDispMsg);
	vDebugMsgNum++;
}*/