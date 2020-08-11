/*------------------------------------------------------------------------------------------------------/
| Program : WS_ASYNC_EMAIL_COMMUNICATION.js
| Event   : N/A
| Usage   : Custom EMSE Script to introduce a delay in email generation from ACA.
| Notes   : 03/07/2018,     Karthik M,     Initial Version
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| Variables
/------------------------------------------------------------------------------------------------------*/
var CONSTRUCT_API_CALL = true;
var jsonresponsemessage = "";                       // Message String for JSON response
var cancel = false;
var startDate = new Date();
var startTime = startDate.getTime();
var message = "";                       // Message String
var debug = "";                             // Debug String
var br = "<BR />";                      // Break Tag
var feeSeqList = new Array();                   // invoicing fee list
var paymentPeriodList = new Array();                // invoicing pay periods
/*------------------------------------------------------------------------------------------------------/
| Add Includes
/------------------------------------------------------------------------------------------------------*/
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_CUSTOM"));
eval(getScriptText("INCLUDES_CUSTOM_GLOBALS"));


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
// aa.env.setValue("showDebug", "Y");
// aa.env.setValue("CurrentUserID", "KMANIKANDAN");
  // aa.env.setValue("ipRecordNumber", "FIR-FSP-APP20-22500251");
  // aa.env.setValue("notification", "PERMIT_ISSUED");

var pRecordNum = aa.env.getValue("ipRecordNumber");
var notification = aa.env.getValue("notification");
asyncCustomParam = aa.env.getValue("asyncCustomParam");
asyncInvParam = aa.env.getValue("asyncInvParam");
asyncNotifWFTaskName = aa.env.getValue("asyncNotifWFTaskName");
asyncNotifWFTaskProcess = aa.env.getValue("asyncNotifWFTaskProcess");
permitCapIDs = aa.env.getValue("permitCapIDs");
partialPermitCapID = aa.env.getValue("partialPermitCapID");
var FTType = aa.env.getValue("FTType");
var FTExpDate = aa.env.getValue("FTExpDate");



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
        aa.print("xpRecordNumber : " + pRecordNum)
    }
}
/*------------------------------------------------------------------------------------------------------/
| END Parameter validation
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var isSuccess = false;                      // Script sucess
var showDebug = isNull(aa.env.getValue("showDebug"), "N") == "Y"; // Set to true to see debug messages in popup window
var showMessage = false;                    // Set to true to see results in popup window
var controlString = "";                             // Standard choice for control
var documentOnly = false;                   // Document Only -- displays hierarchy of std choice steps
var useAppSpecificGroupName = false;        // Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;       // Use Group name when populating Task Specific Info Values
var enableVariableBranching = false;        // Allows use of variable names in branching.  Branches are not followed in Doc Only
var maxEntries = 99;                        // Maximum number of std choice entries.  Entries must be Left Zero Padded
var gRecordNum = pRecordNum;

addParamatersInOutput();
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/

if (isNotValidParamaters()) {
    aa.print("**ERROR - Supplied parameters are wrong");
    logJsonMessage("**ERROR - Supplied parameters are wrong");
}
else {
    /*------------------------------------------------------------------------------------------------------/
    | Parameter dependent Variables
    /------------------------------------------------------------------------------------------------------*/
    var capId = aa.cap.getCapID(gRecordNum).getOutput();
    capId = getCorrectedCapID4V10(capId);
    var cap = aa.cap.getCapBasicInfo(capId).getOutput();
    var servProvCode = capId.getServiceProviderCode()               // Service Provider Code
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

    var capIDString = capId.getCustomID();              // alternate cap id string
    var systemUserObj = aa.person.getUser(currentUserID).getOutput();   // Current User Object
    var appTypeResult = cap.getCapType();
    var appTypeString = appTypeResult.toString();           // Convert application type to string ("G/A/B/C")
    var appTypeArray = appTypeString.split("/");            // Array of application type string
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

    //var platEmail = aa.env.getValue("PlatEmail");

    var AInfo = new Array();                    // Create array for tokenized variables
    loadAppSpecific(AInfo);
    loadASITables();

    /*------------------------------------------------------------------------------------------------------/
    | Debug Block: Comment to gain performance
    /------------------------------------------------------------------------------------------------------*/
    //aa.print("<B>EMSE Script Results for " + capIDString + "</B>");
    //aa.print("capId = " + capId.getClass());
    //aa.print("cap = " + cap.getClass());
    //aa.print("currentUserID = " + currentUserID);
    //aa.print("currentUserGroup = " + currentUserGroup);
    //aa.print("systemUserObj = " + systemUserObj.getClass());
    //aa.print("appTypeString = " + appTypeString);
    //aa.print("capName = " + capName);
    //aa.print("capStatus = " + capStatus);
    //aa.print("sysDate = " + sysDate.getClass());
    //aa.print("sysDateMMDDYYYY = " + sysDateMMDDYYYY);
    //aa.print("parcelArea = " + parcelArea);
    //aa.print("estValue = " + estValue);
    //aa.print("calcValue = " + calcValue);
    //aa.print("feeFactor = " + feeFactor);
    //aa.print("houseCount = " + houseCount);
    //aa.print("feesInvoicedTotal = " + feesInvoicedTotal);
    //aa.print("balanceDue = " + balanceDue);
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
        aa.print("::::THIS IS FROM THE ASYNC SCRIPT ::::")

         var retmsg = "";
         var validateNotification = this.validateAsyncNotificationTypes(notification);
         if(validateNotification){   
             if (notification != "PERMIT_ISSUED" && notification != "PERMIT_CLOSEOUT")
             {
                if(!commProcAsyncObj)
                    initializeCommAsyncObject();
                retmsg = commProcAsyncObj.sendNotifications();
             }
             else if (notification == "PERMIT_ISSUED" || notification == "PERMIT_CLOSEOUT"){
                 var pCAPIDs = new Array();

             sleep(30000);

                if(permitCapIDs){
                    aa.print("permitCapIDs::> "+permitCapIDs);
                    if(permitCapIDs.indexOf(",") == -1)
                        pCAPIDs[0] = permitCapIDs
                    else
                        pCAPIDs = permitCapIDs.split(",");

                    for(i in pCAPIDs){
                        aa.env.setValue("vCapID", pCAPIDs[i]);
                        aa.print("::vCapID::" + pCAPIDs[i]);
                        if(!commProcAsyncObj)
                            initializeCommAsyncObject();
                        retmsg = commProcAsyncObj.sendNotifications();
                    }
                }
                else{
                    if(!commProcAsyncObj)
                        initializeCommAsyncObject();
                    retmsg = commProcAsyncObj.sendNotifications();
                }
             }
         }    
         else
         {
            payretmsg = CallEmailCommunicationLogic();
            aa.print("notification <<<<+"+notification);
            if (notification == "HISTORIC")
                retmsg = sendHistoricNotificationEmail();
            else if (notification == "SCHOOL_DISTRICT")
                retmsg = sendSchoolDistrictNotificationEmail();
                // Commented below
            else if (notification == "MILITARY_NOTIFICATION")
                retmsg = sendMilitaryNotificationEmail();
         }
        aa.print("::::ASYNC SCRIPT END::::")

        if (retmsg != "") {
            isSuccess = false;
            logJsonMessage(retmsg);
        } else {
            isSuccess = true;
        }

    }
    catch (vError) {
        aa.print("**ERROR - Runtime error occurred:  " + vError);
        logJsonMessage("**ERROR - Runtime error occurred:  " + vError);
    }
}

function validateAsyncNotificationTypes(notificationType){
    var notificationList = [];
        var validate = false;
        notificationList.push("GARAGE_SALE_PERMIT_NOTIFICATION");
        notificationList.push("GARAGE_SALE_PERMIT_NOTIFICATION_R");
        notificationList.push("ESCROW_ACCOUNT_CLOSURE");
        notificationList.push("APPLICATION_FINAL_DECISION");
        notificationList.push("REFUND_APPROVAL");
        notificationList.push("ADDITIONAL_INFORMATION_REQUIRED");
        notificationList.push("ADDITIONAL_INFORMATION_REQUIRED_NEW");
        notificationList.push("APPLICATION_INTAKE_AND_FEE_PAYMENT");
        notificationList.push("ADDITIONAL_FEES_ASSESSED");    
        notificationList.push("PERMIT_ADDITIONAL_FEES_ASSESSED");  
        notificationList.push("REGISTRATION_LICENSE_CONFIRMATION");
        notificationList.push("INSPECTION_STATUS_UPDATED");
        notificationList.push("PERMIT_ISSUED");
        notificationList.push("PERMIT_ISSUED_RIP");
        notificationList.push("PERMIT_CLOSEOUT");
        notificationList.push("CPS_RELEASE_NOTIFICATION");
        notificationList.push("CODE_INSPECTION_STATUS_UPDATE");
        notificationList.push("PARTIAL_PERMIT_APPROVAL");
        notificationList.push("TEMPORARY_CERTIFICATE_OF_OCCUPANCY");
        notificationList.push("PROTOTYPE_PLAN_APPROVED");
        notificationList.push("SCHEDULE_READY_NOTICE");
        notificationList.push("FAST_TRACK_ISSUANCE");

        aa.print("### NOTIFICATION --> "+notificationType+" ### NOTIFICATIONLIST --> "+notificationList)
        for (n in notificationList){
            if (notificationType == notificationList[n])
                validate = true;
        }
        return validate;


}
function sendSchoolDistrictNotificationEmail() {
    aa.print("ENTER: sendSchoolDistrictNotificationEmail ");
    var retmsg = "";
    try {
        sendSchoolDistrictNotification();
    }
    catch (err) {
        retmsg = "**ERROR in sendSchoolDistrictNotificationEmail:" + err.message;
        aa.print("**ERROR in sendSchoolDistrictNotificationEmail:" + err.message);
    }
    aa.print("EXIT: sendSchoolDistrictNotificationEmail");
    return retmsg;
}

function sendHistoricNotificationEmail() {
    var retmsg = "";
    try {
        sendHistoricNotificationFromACA();
    }
    catch (err) {
        retmsg = "**ERROR in sendHistoricNotificationEmail:" + err.message;        
    }    
    return retmsg;
}

//New function for sending Military Notification.
function sendMilitaryNotificationEmail() {
    aa.print("ENTER: sendMilitaryNotificationEmail ");
    var retmsg = "";
    try {
        sendMilitaryNotification();
    }
    catch (err) {
        retmsg = "**ERROR in sendMilitaryNotificationEmail:" + err.message;
        aa.print("**ERROR in sendMilitaryNotificationEmail:" + err.message);
    }
    aa.print("EXIT: sendMilitaryNotificationEmail");
    return retmsg;
}


function sleep(milsec){
 var startTime = new Date().getTime();
 for(var i = 0; i < 40000; i++){   
   if((new Date().getTime() - startTime) > milsec){        
     break;
   }
 }
}