/*------------------------------------------------------------------------------------------------------/
| Program : ApplicationSpecificInfoUpdateAfterV3.0.js
| Event   : ApplicationSpecificInfoUpdateAfter
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var controlString = "ApplicationSpecificInfoUpdateAfter";               // Standard choice for control
var preExecute = "PreExecuteForAfterEvents"             // Standard choice to execute first (for globals, etc)
var documentOnly = false;                       // Document Only -- displays hierarchy of std choice steps

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 3.0;

var useSA = false;
var SA = null;
var SAScript = null;
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE");
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") {
    useSA = true;
    SA = bzr.getOutput().getDescription();
    bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT");
    if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }
}

if (SA) {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA));
    eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA));
    eval(getScriptText(SAScript,SA));
}
else {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
    eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
}

eval(getScriptText("INCLUDES_CUSTOM"));

if (documentOnly) {
    doStandardChoiceActions(controlString,false,0);
    aa.env.setValue("ScriptReturnCode", "0");
    aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
    aa.abortScript();
}

var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);

var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";
var doStdChoices = true;  // compatibility default
var doScripts = false;
var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;
if (bzr) {
    var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE");
    doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";
    var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT");
    doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";
}


function getScriptText(vScriptName){
    var servProvCode = aa.getServiceProviderCode();
    if (arguments.length > 1) servProvCode = arguments[1]; // use different serv prov code
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    try {
        var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN");
        return emseScript.getScriptText() + "";
    } catch(err) {
        return "";
    }
}

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0);  // run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
//
//  Get the Standard choices entry we'll use for this App type
//  Then, get the action/criteria pairs for this app
//

if (doStdChoices) doStandardChoiceActions(controlString,true,0);


//
//  Next, execute and scripts that are associated to the record type
//

if (doScripts) doScriptActions();

//
// Check for invoicing of fees
//
if (feeSeqList.length)
{
    invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
    if (invoiceResult.getSuccess())
        logMessage("Invoicing assessed fee items is successful.");
    else
        logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
}


updateFileDate();


function updateFileDate()
{
    var itemCap = capId;

    capResult = aa.cap.getCap(itemCap)

    if (!capResult.getSuccess())
    {logDebug("**WARNING: error getting cap : " + capResult.getErrorMessage()) ; return false }
    myCap = capResult.getOutput();

    var newdate=getAppSpecific("Event Start Date");

    myCap.setFileDate(aa.date.parseDate(newdate));

    capModel = capResult.getOutput().getCapModel();

    setDateResult = aa.cap.editCapByPK(capModel);

    if (!setDateResult.getSuccess())
    { logDebug("**WARNING: error setting cap name : " + setNameResult.getErrorMessage()) ; return false }


    return true;
}

//New Fee calc with 1-discount percentage rate
var trafficNr = getAppSpecific("Number of Traffic Officers");
var trafficHr = getAppSpecific("Hours per Traffic Officer");
var trafficRa = getAppSpecific("Traffic Officer Rate");
var securityNr = getAppSpecific("Number of Security Officers");
var securityHr = getAppSpecific("Hours per Security Officer");
var securityRa = getAppSpecific("Security Officer Rate");
var fireNr = getAppSpecific("Number of Fire Personnel");
var fireHr = getAppSpecific("Hours per Fire Personnel");
var fireRa = getAppSpecific("Fire Personnel Rate");
var eventNr = getAppSpecific("Number of Event Marshals");
var eventHr = getAppSpecific("Hours per Event Marshal");
var eventRa = getAppSpecific("Event Marshal Rate");
var parkingNr = getAppSpecific("Number of Parking Lot Attendants");
var parkingHr = getAppSpecific("Hours per Parking Lot Attendant");
var parkingRa = getAppSpecific("Parking Lot Attendant Rate");
var discount = 1-getAppSpecific("Discount")/100;
var trafficFee = trafficNr*trafficHr*trafficRa*discount;
var securityFee = securityNr*securityHr*securityRa*discount;
var fireFee = fireNr*fireHr*fireRa*discount;
var eventFee = eventNr*eventHr*eventRa*discount;
var parkingFee = parkingNr*parkingHr*parkingRa*discount;
var constantFee = getAppSpecific("Constant Fee");

//HCPD-11, HCPD-10 Implementation by GCOM START
var reCalcFlag = getAppSpecific("Do you want to re-calculate the permit fees?");

if(reCalcFlag == 'Yes')
{
    removeAllFees(capId);
    addAllFees("SE_PERMITFEE","FINAL",1,"N");
    var discount = 0;
    var feeObj = aa.finance.getFeeItemByCapID(capId);
    feeObj = feeObj.getOutput();
    var flag = false;
    for(x in feeObj)
    {
        flag = true;
        if(feeObj[x].getFeeCod() == "COSTOFFICER" && (feeObj[x].getFeeitemStatus() == "INVOICED" || feeObj[x].getFeeitemStatus() == "NEW"))
        {
            discount = parseFloat(feeObj[x].getFee());
            break;
        }
    }
    if(discount > 0)
    {
        editAppSpecific("Discount",parseInt(AInfo["Discount"]) * -1, capId);
        removeAllFees(capId);
        addAllFees("SE_PERMITFEE","FINAL",1,"N");
        editAppSpecific("Discount",AInfo["Discount"], capId);
    }
    editAppSpecific("Do you want to re-calculate the permit fees?", 'No', capId);
}

var estnum = parseInt(getAppSpecific("Estimated number of participants"));
var estnumDummy = parseInt(getAppSpecific("Estimated number of participants Dummy"));
if(estnumDummy!=""
    && estnumDummy!=null
    && estnum!=estnumDummy
    && isDuplicateCommunication(capId.getCustomID()+"","1HCONSITECONTACTCHANGE"))
{
    var params = aa.util.newHashtable();
    getRecordParams4Notification(params);
    getContactParams4Notification(params,"Applicant");
    sendNotification(null,null,null,"1HCPARTICIPANTSNRCHANGE",params,null);
}

function removeAllFees(itemCap) // Removes all non-invoiced fee items for a CAP ID
{
    getFeeResult = aa.finance.getFeeItemByCapID(itemCap);
    if (getFeeResult.getSuccess())
    {
        var feeList = getFeeResult.getOutput();
        for (feeNum in feeList)
        {
            if (feeList[feeNum].getFeeitemStatus().equals("NEW"))
            {
                var feeSeq = feeList[feeNum].getFeeSeqNbr();

                var editResult = aa.finance.removeFeeItem(itemCap, feeSeq);
                if (editResult.getSuccess())
                {
                    logDebug("Removed existing Fee Item: " + feeList[feeNum].getFeeCod());
                }
                else
                { logDebug( "**ERROR: removing fee item (" + feeList[feeNum].getFeeCod() + "): " + editResult.getErrorMessage()); break }
            }
            if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
            {
                logDebug("Invoiced fee "+feeList[feeNum].getFeeCod()+" found, not removed");
            }
        }
    }
    else
    { logDebug( "**ERROR: getting fee items (" + feeList[feeNum].getFeeCod() + "): " + getFeeResult.getErrorMessage())}

}
/**
 * Returns boolean if the notification was already sent for a record id
 * @param altID, Notificaiton-Name
 * @returns boolean
 */
function isDuplicateCommunication(altId,trigger_event)
{
    var vError = '';
    var conn = null;
    var sStmt = null;
    var rSet = null;
    var msg = '';

    var sql = "SET NOCOUNT ON;SELECT * FROM G7MESSAGE_ENTITY WHERE ENTITY_ID='"+altId+"' AND CM_ID IN (SELECT RES_ID FROM G7CM_MESSAGE WHERE TRIGGER_EVENT = '"+trigger_event+"');";
    try {
        var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
        var ds = initialContext.lookup("java:/HOCOTEC");
        conn = ds.getConnection();
        sStmt = conn.prepareStatement(sql);
        rSet = sStmt.executeQuery();
        while(rSet.next()) {
            conn.close();
            closeDBQueryObject(rSet, sStmt, conn);
            return true;
        }

    } catch (vError) {
        logDebug("Runtime error occurred: " + vError);
    }
    closeDBQueryObject(rSet, sStmt, conn);
    return false;
}
function closeDBQueryObject(sStmt, conn) {
    try {
        if (sStmt) {
            sStmt.close();
            sStmt = null;
        }
    } catch (vError) {
        aa.print("Failed to close the database prepare statement object." + vError);
    }
    try {
        if (conn) {
            conn.close();
            conn = null;
        }
    } catch (vError) {
        aa.print("Failed to close the database connection." + vError);
    }
}
//HCPD-11, HCPD-10 Implementation by GCOM END

/*
if (trafficFee)
{
updateFee("TRAFFIC","TESTSE","FINAL", 1,"N","N");
}
if (securityFee)
{
updateFee("SECURITY","TESTSE","FINAL", 1,"N","N");
}
if (fireFee)
{
updateFee("FIRE","TESTSE","FINAL", 1,"N","N");
}
if (eventFee)
{
updateFee("EVENTMARSHAL","TESTSE","FINAL", 1,"N","N");
}
if (parkingFee)
{
updateFee("PARKINGLOT","TESTSE","FINAL", 1,"N","N");
}
if (constantFee)
{
updateFee("CONSTANT","TESTSE","FINAL", 1,"N","N");
}
*/
/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0)
{
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
}
else
{
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug)  aa.env.setValue("ScriptReturnMessage", debug);
}


/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

