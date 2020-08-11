/*------------------------------------------------------------------------------------------------------/
| Program : WS_CTRCA_ASA.js
| Event   : N/A
| Usage   : Custom EMSE Script to run from CTRCA as async
| Notes   : Initial Version
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| Variables
/------------------------------------------------------------------------------------------------------*/
var CONSTRUCT_API_CALL = true;
var jsonresponsemessage = ""; 						// Message String for JSON response
var cancel = false;
var startDate = new Date();
var startTime = startDate.getTime();
var message = ""; 						// Message String
var debug = ""; 							// Debug String
var br = "<BR />"; 						// Break Tag
var feeSeqList = new Array(); 					// invoicing fee list
var paymentPeriodList = new Array(); 				// invoicing pay periods
/*------------------------------------------------------------------------------------------------------/
| Add Includes
/------------------------------------------------------------------------------------------------------*/
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_CUSTOM"));
eval(getScriptText("INCLUDES_CUSTOM_GLOBALS"));
eval(getScriptText("INCLUDES_GLOBAL_COMMONS"));

function getScriptText(vScriptName) {
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
    return emseScript.getScriptText() + "";
}
/*------------------------------------------------------------------------------------------------------/
| END Includes
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START Read Parameters From Construct API
/------------------------------------------------------------------------------------------------------*/
//aa.env.setValue("showDebug", "Y");
//aa.env.setValue("CurrentUserID", "PUBLICUSER98483");
//aa.env.setValue("ipRecordNumber", "ADDR-COD-18-000020");
var pRecordNum = aa.env.getValue("ipRecordNumber");
/*------------------------------------------------------------------------------------------------------/
| END Read Parameters
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START  Parameter validation
/------------------------------------------------------------------------------------------------------*/
function isNotValidParamaters() {
    var notvalid = isNull(pRecordNum, "") == "";

    return notvalid;
}
function addParamatersInOutput() {
    if (showDebug) {
        //Debug for Construct API
        aa.env.setValue("xpRecordNumber", pRecordNum);
        logDebug("xpRecordNumber : " + pRecordNum)
    }
}
/*------------------------------------------------------------------------------------------------------/
| END Parameter validation
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var vEventName = aa.env.getValue("EventName");
var isSuccess = false; 						// Script sucess
var showDebug = isNull(aa.env.getValue("showDebug"), "N") == "Y"; // Set to true to see debug messages in popup window
var showMessage = false; 					// Set to true to see results in popup window
var controlString = ""; 							// Standard choice for control
var documentOnly = false; 					// Document Only -- displays hierarchy of std choice steps
var useAppSpecificGroupName = false; 		// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false; 		// Use Group name when populating Task Specific Info Values
var enableVariableBranching = false; 		// Allows use of variable names in branching.  Branches are not followed in Doc Only
var maxEntries = 99; 						// Maximum number of std choice entries.  Entries must be Left Zero Padded
var gRecordNum = pRecordNum;

addParamatersInOutput();
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/

if (isNotValidParamaters()) {
    logDebug("**ERROR - Supplied parameters are wrong");
    logJsonMessage("**ERROR - Supplied parameters are wrong");
}
else {
    /*------------------------------------------------------------------------------------------------------/
    | Parameter dependent Variables
    /------------------------------------------------------------------------------------------------------*/
    var capId = aa.cap.getCapID(gRecordNum).getOutput();
    capId = getCorrectedCapID4V10(capId);
    var cap = aa.cap.getCapBasicInfo(capId).getOutput();
    var servProvCode = capId.getServiceProviderCode()       		// Service Provider Code
    var publicUser = false;
    var publicUserID = null;
    var currentUserID = aa.env.getValue("CurrentUserID");
    if (currentUserID.indexOf("PUBLICUSER") == 0) {
        publicUserID = currentUserID;
        currentUserID = "ADMIN";
        publicUser = true
    }  // ignore public users
    if (currentUserID == null || currentUserID == '') {
        currentUserID = "ADMIN";
    }

    var capIDString = capId.getCustomID(); 				// alternate cap id string
    var systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
    var appTypeResult = cap.getCapType();
    var appTypeString = appTypeResult.toString(); 			// Convert application type to string ("G/A/B/C")
    var appTypeArray = appTypeString.split("/"); 			// Array of application type string
    var currentUserGroup;
    var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput()
    if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
    var capName = cap.getSpecialText();
    var capStatus = cap.getCapStatus();
    var sysDate = aa.date.getCurrentDate();
    var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), sysDate.getYear(), "");
    var parcelArea = 0;

    var fileDateObj = null;
    var fileDate = null;
    var balanceDue = 0,
    fileDateObj = cap.getFileDate();
    fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();

    var acaSite = lookup("ACA_CONFIGS", "ACA_SITE");
    acaSite = acaSite.substr(0, acaSite.toUpperCase().indexOf("/ADMIN"));
    var acaUrl = acaSite;
    var sysFromEmail = "noreply@sanantonio.gov";

    var platEmail = aa.env.getValue("PlatEmail");

    var AInfo = new Array(); 					// Create array for tokenized variables
    loadAppSpecific(AInfo);
    loadASITables();

    /*------------------------------------------------------------------------------------------------------/
    | Debug Block: Comment to gain performance
    /------------------------------------------------------------------------------------------------------*/
    //logDebug("<B>EMSE Script Results for " + capIDString + "</B>");
    //logDebug("capId = " + capId.getClass());
    //logDebug("cap = " + cap.getClass());
    //logDebug("currentUserID = " + currentUserID);
    //logDebug("currentUserGroup = " + currentUserGroup);
    //logDebug("systemUserObj = " + systemUserObj.getClass());
    //logDebug("appTypeString = " + appTypeString);
    //logDebug("capName = " + capName);
    //logDebug("capStatus = " + capStatus);
    //logDebug("sysDate = " + sysDate.getClass());
    //logDebug("sysDateMMDDYYYY = " + sysDateMMDDYYYY);
    //logDebug("parcelArea = " + parcelArea);
    //logDebug("estValue = " + estValue);
    //logDebug("calcValue = " + calcValue);
    //logDebug("feeFactor = " + feeFactor);
    //logDebug("houseCount = " + houseCount);
    //logDebug("feesInvoicedTotal = " + feesInvoicedTotal);
    //logDebug("balanceDue = " + balanceDue);
    //logGlobals(AInfo);

    /*------------------------------------------------------------------------------------------------------/
    | <===========Main=Loop================>
    |
    /-----------------------------------------------------------------------------------------------------*/
    runScriptActions();
    /*------------------------------------------------------------------------------------------------------/
    | <===========END=Main=Loop================>
    /-----------------------------------------------------------------------------------------------------*/
}

if (debug.indexOf("**ERROR") > -1 || jsonresponsemessage.indexOf("**ERROR") > -1) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
    aa.env.setValue("ErrorCode", "1");
    aa.env.setValue("ErrorMessage", debug);
    aa.env.setValue("message", jsonresponsemessage);
    aa.env.setValue("isSuccess", false);
}
else {
    aa.env.setValue("isSuccess", isSuccess);
    aa.env.setValue("message", jsonresponsemessage);
    if (jsonresponsemessage == "") {
        aa.env.setValue("message", "OK");
    }
    if (cancel) {
        aa.env.setValue("ErrorCode", "-2");
        aa.env.setValue("ScriptReturnCode", "-2");
    }
    else {
        aa.env.setValue("ErrorCode", "0");
        aa.env.setValue("ScriptReturnCode", "0");
    }
    if (showMessage) aa.env.setValue("ErrorMessage", message);
    if (showDebug) aa.env.setValue("ErrorMessage", debug);
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}
function logJsonMessage(dstr) {
    jsonresponsemessage += dstr + br;
}

function runScriptActions() {
    try {
        var retmsg = stratCtrcaLogic();

        if (retmsg != "") {
            isSuccess = false;
            logJsonMessage(retmsg);
        } else {
            isSuccess = true;
        }

    }
    catch (vError) {
        logDebug("**ERROR - Runtime error occurred:  " + vError);
        logJsonMessage("**ERROR - Runtime error occurred:  " + vError);
    }
}

function stratCtrcaLogic() {
    logDebug("ENTER: stratAsaLogic");
    var retmsg = "";

    try {
        gs2.common.initializeAppObject();
        //REVISIT
		globalCommonObj = new GLOBAL_COMMON_OBJ();
		logDebug("GLOBAL_COMMON_OBJ " + globalCommonObj);
    }
    catch (err) {
        gs2.common.handleError(err, "");
    }

    try {
        try {
			gs2.wf.updateAppandTaskStatusAsaACA();
        } catch (err) {
            logDebug("A JavaScript Error occurred: CTRCA:LandDevelopment/*/*/*: Defect 53: " + err.message);
        }

        try {
            autoAssignUserASA();
        }
        catch (err) {
            gs2.common.handleError(err, "");
        }

        sendEmail1AsyncACA();

        try {
            if (appObj) {
                appObj.CtrcaAsyncDelegator();
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred: " + appTypeString + " :appObj.CtrcaAsyncDelegator(): " + err.message);
        }

        try {
            //This Function is in includes edr script
            createParrallelReviewSubTask();
        } catch (err) {
            logDebug("**WARNING: CTRCA:LANDDEVELOPMENT/*/*/*: #ID-CreateEdrefSubTskWrapper: " + err.message);
        }
		
        //Add if statement for Parks if Commercial WS_CTRCA_ASA
        try {
            if (AInfo["Is the proposed use of the property Non Single Family?"] == "CHECKED" && publicUser && (appMatch("LandDevelopment/Land Entitlement/Plat/Minor") || appMatch("LandDevelopment/Land Entitlement/Plat/Amend") || appMatch("LandDevelopment/Land Entitlement/Plat/Major"))) {
                deactivateParks();
            }
        } catch (err) {
            logDebug("WARNING JavaScript Error occurred: CTRCA LandDevelopment WS_CTRCA_ASA: " + err.message);
        }
		
		//Default Under Review Status Workflow History Function CTRCA LandDevelopment WS_CTRCA_ASA
		try {
			if (publicUser) {
			var moduleName = appTypeArray[0];
			gs2.wf.updateDefaultStatusWFHistory(capId, moduleName);
			}
			}catch (err) {
				logDebug("WARNING JavaScript Error occurred: CTRCA LandDevelopment WS_CTRCA_ASA: " + err.message);
				}

        
    }
    catch (err) {
        retmsg = "**ERROR in stratAsaLogic:" + err.message;
        logDebug("**ERROR in stratAsaLogic:" + err.message);
    }
    logDebug("EXIT: stratAsaLogic");
    return retmsg;
}

