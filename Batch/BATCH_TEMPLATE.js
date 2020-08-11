/*------------------------------------------------------------------------------------------------------/
| Program:  BATCH_TEMPLATE.js  Trigger: Batch
| Event   : N/A
| Usage   : Batch job (<Daily / Weekly / Monthly /Yearly>)
| Agency  : 
| Purpose : Batch to <do something>.
| Notes   : Initial Version
/------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------/
| START: TEST PARAMETERS
/------------------------------------------------------------------------------------------------------*/
//aa.env.setValue("fromDate", "01/01/2000");
//aa.env.setValue("toDate", "");
//aa.env.setValue("appGroup", "Licenses");
//aa.env.setValue("appTypeType", "*");
//aa.env.setValue("appSubtype", "*");
//aa.env.setValue("appCategory", "*");
//aa.env.setValue("expirationStatus", "Active");
//aa.env.setValue("newExpirationStatus", "Expired");
//aa.env.setValue("newApplicationStatus", "Expired");
//aa.env.setValue("includeOrExcludeDeactivateFlagOnLP", "I");
//aa.env.setValue("gracePeriodDays", "0");
//aa.env.setValue("setPrefix", "LIC_EXP_ACTIVE");
//aa.env.setValue("inspSched", "");
//aa.env.setValue("skipAppStatus1", "Returnable,Not Printed,Charged,Returned");
//aa.env.setValue("skipAppStatus2", "Void,Reported,Revoked,Suspended,Closed");
//aa.env.setValue("emailAddress", "");
//aa.env.setValue("sendEmailToContactTypes", "");
//aa.env.setValue("emailTemplate", "");
//aa.env.setValue("deactivateLicense", "");
//aa.env.setValue("lockParentLicense", "");
//aa.env.setValue("showDebug", "Y");
/*------------------------------------------------------------------------------------------------------/
| END: TEST PARAMETERS
/------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------/
| START: USER CONFIGURABLE PARAMETERS
/------------------------------------------------------------------------------------------------------*/
var emailText = "";
var maxSeconds = 4.5 * 60; 	    // number of seconds allowed for batch processing, usually < 5*60
var message = "";
var br = "<br>";
/*------------------------------------------------------------------------------------------------------/
| END: USER CONFIGURABLE PARAMETERS
/------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------/
| BEGIN Includes
/------------------------------------------------------------------------------------------------------*/
SCRIPT_VERSION = 2.0
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_BATCH"));
eval(getScriptText("INCLUDES_CUSTOM"));

function getScriptText(vScriptName) {
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
    return emseScript.getScriptText() + "";
}

/*------------------------------------------------------------------------------------------------------/
| START: Common Variable Definitions
/------------------------------------------------------------------------------------------------------*/
var servProvCode = aa.getServiceProviderCode();
var showDebug = isNull(aa.env.getValue("showDebug"), "N") == "Y";
var batchJobID = 0;
var batchJobName = "";
var batchJobDesc = "";
var batchJobResult = "";
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var sysDate = aa.date.getCurrentDate();
var currentUser = aa.person.getCurrentUser().getOutput();
var startDate = new Date();
var startTime = startDate.getTime(); 		// Start timer
var appTypeArray = new Array();
var showDebug = isNull(aa.env.getValue("showDebug"), "N") == "Y";
/*------------------------------------------------------------------------------------------------------/
| END:Common Variable Definitions
/------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------/
| START: BATCH PARAMETERS
/------------------------------------------------------------------------------------------------------*/
var emailAddress = getParam("emailAddress"); 				// email to send report
var fromDate = getParam("fromDate"); 						// Hardcoded dates.   Use for testing only
var toDate = getParam("toDate"); 							// ""
var lookAheadDays = isNull(aa.env.getValue("lookAheadDays"), "0");   	// Number of days from today
var daySpan = isNull(aa.env.getValue("daySpan"), "0"); 					// Days to search (6 if run weekly, 0 if daily, etc.)
var appGroup = getParam("appGroup"); 						//   app Group to process {Licenses}
var appTypeType = getParam("appTypeType"); 					//   app type to process {Rental License}
var appSubtype = getParam("appSubtype"); 					//   app subtype to process {NA}
var appCategory = getParam("appCategory"); 					//   app category to process {NA}
var expStatus = getParam("expirationStatus")					//   test for this expiration status
var newExpStatus = getParam("newExpirationStatus")				//   update to this expiration status
var newAppStatus = isNull(getParam("newApplicationStatus"), "")				//   update the CAP to this status
var includeOrExcludeDeactivateFlagOnLP = isNull(getParam("includeOrExcludeDeactivateFlagOnLP"), "I"); 	//  Look to this radio button on record LP to qualify for actions
var gracePeriodDays = isNull(getParam("gracePeriodDays"), "0"); 				//	bump up expiration date by this many days
var setPrefix = isNull(getParam("setPrefix"), ""); 						//   Prefix for set ID
var inspSched = isNull(getParam("inspSched"), ""); 						//   Schedule Inspection
var skipAppStatus1 = isNull(getParam("skipAppStatus1"), ""); //   Skip records with one of these application statuses 1
var skipAppStatus2 = isNull(getParam("skipAppStatus2"), ""); //   Skip records with one of these application statuses 2
var emailAddress = isNull(getParam("emailAddress"), ""); 				// email to send report
var sendEmailToContactTypes = isNull(getParam("sendEmailToContactTypes"), ""); // send out emails?
var emailTemplate = isNull(getParam("emailTemplate"), ""); 				// email Template
var deactivateLicense = isNull(getParam("deactivateLicense"), ""); 		// deactivate the LP
var lockParentLicense = isNull(getParam("lockParentLicense"), "");     		// add this lock on the parent license
var createRenewalRecord = getParam("createTempRenewalRecord"); // create a temporary record
var feeSched = getParam("feeSched"); 							//
var feeList = getParam("feeList"); 							// comma delimted list of fees to add
var feePeriod = getParam("feePeriod"); 						// fee period to use {LICENSE}
/*------------------------------------------------------------------------------------------------------/
| END: BATCH PARAMETERS
/------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------/
| START: Variable Definitions
/------------------------------------------------------------------------------------------------------*/
var skipAppStatusArray = (skipAppStatus1 + ',' + skipAppStatus2).split(",");
/*------------------------------------------------------------------------------------------------------/
| END: Variable Definitions
/------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------/
| START: MAIN LOGIC
/-----------------------------------------------------------------------------------------------------*/
var isPartialSuccess = false;
var timeExpired = false;

// no "from" date, assume today + number of days to look ahead
fromDate = dateAdd(isNull(fromDate, new Date()), parseInt(lookAheadDays));
// no "to" date, assume today + number of look ahead days + span
toDate = dateAdd(isNull(toDate, new Date()), parseInt(lookAheadDays) + parseInt(daySpan));

//If required use read common configuration; make sure these are coming from common modules
//var mailFrom = lookup("ACA_EMAIL_TO_AND_FROM_SETTING", "RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
//var acaSite = lookup("ACA_CONFIGS", "ACA_SITE");
//acaSite = acaSite.substr(0, acaSite.toUpperCase().indexOf("/ADMIN"));

var capId = null;
var useAppSpecificGroupName = false; // Use Group name when populating App Specific Info Values

var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), sysDate.getYear(), "");
var currentUser = aa.person.getCurrentUser().getOutput();
var currentUserID = currentUser == null ? "ADMIN" : currentUser.getUserID().toString()

logDebug("Date Range -- fromDate: " + fromDate + ", toDate: " + toDate)

var startTime = startDate.getTime(); 		// Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();

if (appGroup == "")
    appGroup = "*";
if (appTypeType == "")
    appTypeType = "*";
if (appSubtype == "")
    appSubtype = "*";
if (appCategory == "")
    appCategory = "*";
var appType = appGroup + "/" + appTypeType + "/" + appSubtype + "/" + appCategory;

logDebug("Start of Job");
if (!timeExpired) var isSuccess = mainProcess();
logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");
if (isSuccess) {
    aa.print("Passed");
    aa.env.setValue("ScriptReturnCode", "0");
    if (isPartialSuccess) {
        aa.env.setValue("ScriptReturnMessage", "A script timeout has caused partial completion of this process.  Please re-run.");
        aa.eventLog.createEventLog("Batch Job run partial successful.", "Batch Process", batchJobName, sysDate, sysDate, batchJobDesc, batchJobResult, batchJobID);
    } else {
        aa.env.setValue("ScriptReturnMessage", "Batch Job run successfully.");
        aa.eventLog.createEventLog("Batch Job run successfully.", "Batch Process", batchJobName, sysDate, sysDate, batchJobDesc, batchJobResult, batchJobID);
    }
}
else {
    aa.print("Failed");
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", "Batch Job failed: " + emailText);
}

if (emailAddress.length)
    aa.sendMail("noreply@accela.com", emailAddress, "", batchJobName + " Results", emailText);
/*------------------------------------------------------------------------------------------------------/
| END: MAIN LOGIC
/-----------------------------------------------------------------------------------------------------*/

function mainProcess() {
    var vError = null;
    try {
        var vSuccess = checkBatch();
        if (!vSuccess) return false;

        logDebug("****** Start logic ******");

        MyFunctionalLogic();

        logDebug("****** End logic ******");

        return vSuccess;
    }
    catch (vError) {
        logDebug("Runtime error occurred: " + vError);
        return true;
    }
}

function MyFunctionalLogic() {
    //STEP1: Init Somthing

	//Use Elapsed time to verify batch execution time out
	//make sure processing should finish within certain predefined time to make sure server should not go out of resources (e.g; memory leak)

	if (elapsed() > maxSeconds) // only continue if time hasn't expired
	{
		logDebug("A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
		timeExpired = true;
		break;
	}
}
