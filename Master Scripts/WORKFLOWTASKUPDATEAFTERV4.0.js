/*------------------------------------------------------------------------------------------------------/
| SVN $Id: WorkflowTaskUpdateAfter.js 6515 2012-03-16 18:15:38Z john.schomp $
| Program : WorkflowTaskUpdateAfterV2.0.js
| Event   : WorkflowTaskUpdateAfter
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
var controlString = "WorkflowTaskUpdateAfter";              // Standard choice for control
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
var wfTask = aa.env.getValue("WorkflowTask");               // Workflow Task Triggered event
var wfStatus = aa.env.getValue("WorkflowStatus");           // Status of workflow that triggered event
var wfDate = aa.env.getValue("WorkflowStatusDate");         // date of status of workflow that triggered event
var wfDateMMDDYYYY = wfDate.substr(5,2) + "/" + wfDate.substr(8,2) + "/" + wfDate.substr(0,4);  // date of status of workflow that triggered event in format MM/DD/YYYY
var wfProcessID = aa.env.getValue("ProcessID");             // Process ID of workflow
var wfStep ; var wfComment ; var wfNote ; var wfDue ; var wfHours;          // Initialize
var wfProcess ;                             // Initialize
// Go get other task details
var wfObj = aa.workflow.getTasks(capId).getOutput();
for (i in wfObj)
{
    fTask = wfObj[i];
    if (fTask.getTaskDescription().equals(wfTask) && (fTask.getProcessID() == wfProcessID))
    {
        wfStep = fTask.getStepNumber();
        wfProcess = fTask.getProcessCode();
        wfComment = fTask.getDispositionComment();
        wfNote = fTask.getDispositionNote();
        wfDue = fTask.getDueDate();
        wfHours = fTask.getHoursSpent();
        wfTaskObj = fTask
    }
}
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTask.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);

/* Added for version 1.7 */
var wfStaffUserID = aa.env.getValue("StaffUserID");
var timeAccountingArray = new Array()
if(aa.env.getValue("TimeAccountingArray") != "")
    timeAccountingArray =  aa.env.getValue("TimeAccountingArray");
var wfTimeBillable = aa.env.getValue("Billable");
var wfTimeOT = aa.env.getValue("Overtime");
logDebug("wfStaffUserID = " + wfStaffUserID);
logDebug("wfTimeBillable = " + wfTimeBillable);
logDebug("wfTimeOT = " + wfTimeOT);
logDebug("wfHours = " + wfHours);

if (timeAccountingArray != null || timeAccountingArray !='')
{
    for(var i=0;i<timeAccountingArray.length;i++)
    {
        var timeLogModel = timeAccountingArray[i];
        var timeLogSeq = timeLogModel.getTimeLogSeq();
        var dateLogged = timeLogModel.getDateLogged();
        var startTime = timeLogModel.getStartTime();
        var endTime = timeLogModel.getEndTime();
        var timeElapsedHours = timeLogModel.getTimeElapsed().getHours();
        var timeElapsedMin = timeLogModel.getTimeElapsed().getMinutes();

        logDebug("TAtimeLogSeq = " + timeLogSeq);
        logDebug("TAdateLogged = " + dateLogged);
        logDebug("TAstartTime = " + startTime);
        logDebug("TAendTime = " + endTime);
        logDebug("TAtimeElapsedHours = " + timeElapsedHours);
        logDebug("TAtimeElapsedMin = " + timeElapsedMin);
    }
}
//HCPD variable for N-S district
var southnorth = getTaskSpecific_g("SEC Approval","District");
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


if((wfTask=="Special Operations Bureau Captain Review" || wfTask=="Investigations and Special Operations Command Major Review")  && wfStatus=="Returned to SEC")
{
    loopTask("SEC Approval","Review in process","update via script","","");
    activateTask("SEC Approval");
}
if((wfTask=="Special Operations Bureau Captain Review" || wfTask=="Investigations and Special Operations Command Major Review")  && wfStatus=="Returned to Emergency Response Division Lieutenant")
{
    loopTask("Emergency Response Division Lieutenant Review","Review in process","update via script","","");
    activateTask("Emergency Response Division Lieutenant Review");
}
if((wfTask=="Special Operations Bureau Captain Review" || wfTask=="Investigations and Special Operations Command Major Review")  && wfStatus=="Returned to Specialized Support Sergeant")
{
    loopTask("Specialized Support Sergeant Review","Review in process","update via script","","");
    activateTask("Specialized Support Sergeant Review");
    getTaskSpecific_pk();
}
if((wfTask=="Special Operations Bureau Captain Review" || wfTask=="Investigations and Special Operations Command Major Review")  && wfStatus=="Returned to Traffic Enforcement Section Sergeant")
{
    loopTask("Traffic Enforcement Section Sergeant Review","Review in process","update via script","","");
    activateTask("Traffic Enforcement Section Sergeant Review");
    getTaskSpecific_pk();
}
if((wfTask=="Special Operations Bureau Captain Review" || wfTask=="Investigations and Special Operations Command Major Review")  && wfStatus=="Returned to Traffic Management Division Lieutenant")
{
    loopTask("Traffic Management Division Lieutenant Review","Review in process","update via script","","");
    activateTask("Traffic Management Division Lieutenant Review");
}
function getTaskSpecific_pk()
{
    var workflowResult = aa.workflow.getTaskItems(capId, "SEC Approval", null, null, null, null);//aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else
        aa.print("eerrr ");

    //
    // Loop through workflow tasks
    //
    for (i in wfObj)
    {
        fTask = wfObj[i];
        stepnumber = fTask.getStepNumber();
        processID = fTask.getProcessID();
        if (fTask.getTaskDescription()=="SEC Approval")
        {

            TSIResult = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId,processID,stepnumber,"Staffing");//aa.taskSpecificInfo.getTaskSpecificInfoByTask(capId, processID, stepnumber);
            if (TSIResult.getSuccess())
            {
                var TSI = TSIResult.getOutput();

                if (TSI != null)
                {
                    TSInfoModel = TSI.getTaskSpecificInfoModel();
                    var TSIvalue = TSInfoModel.getChecklistComment();
                    if(TSIvalue=="Traffic")
                    {
                        deactivateTask("Specialized Support Sergeant Review");
                        //closeTask("Specialized Support Sergeant Review","","","");
                    }
                    else if (TSIvalue=="Security")
                    {deactivateTask("Traffic Enforcement Section Sergeant Review");
                    }
                }

            }

        }
    }

}

var waivepermitfee = getTaskSpecific_g("SEC Review","Waived Application Fee");
if(wfTask=="SEC Review" && wfStatus=="Application Accepted" && waivepermitfee=="No")

{
    updateFee("APPFEE","SPECIALEVENT","FINAL",50,"Y","N");
    var params = aa.util.newHashtable();
    getRecordParams4Notification(params);
    getContactParams4Notification(params,"Applicant");
    logDebug("getBalanceDue:" + getBalanceDue());
    addParameter(params, "$$appFEE$$", "$" + getBalanceDue());
    sendNotification(null,null,null,"1HCFEE",params,null);
}



function getTaskSpecific_g(TSItask,TSIcol)
{
    var workflowResult = aa.workflow.getTaskItems(capId, TSItask, null, null, null, null);//aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else
        aa.print("eerrr ");

    //
    // Loop through workflow tasks
    //
    for (i in wfObj)
    {
        fTask = wfObj[i];
        stepnumber = fTask.getStepNumber();
        processID = fTask.getProcessID();
        if (fTask.getTaskDescription()==TSItask)
        {

            TSIResult = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId,processID,stepnumber,TSIcol);//aa.taskSpecificInfo.getTaskSpecificInfoByTask(capId, processID, stepnumber);
            if (TSIResult.getSuccess())
            {
                var TSI = TSIResult.getOutput();

                if (TSI != null)
                {
                    TSInfoModel = TSI.getTaskSpecificInfoModel();
                    var TSIvalue = TSInfoModel.getChecklistComment();
                    return TSIvalue;
                }

            }

        }
    }

}

//send multiple docs to S-N district head upon Chief approval
var doclist = aa.document.getCapDocumentList(capId, "Admin").getOutput();
var params = aa.util.newHashtable();
getRecordParams4Notification(params);
getContactParams4Notification(params,"Applicant");

var fileNames0 = new Array();
if (doclist!=null)
{
    for (i = 0; i < doclist.length; i++)
    {
        if (doclist[i].toString().match(/Event Plan\/OPS*/)||doclist[i].toString().match(/Approval Packet*/))
        {fileNames0.push(aa.document.downloadFile2Disk(doclist[i],"Police","","",true).getOutput());}
    }
}
//get Event Permit report file
var filePermit = sendReport4EmailP(capId,null,"Auto Special Event Permit Final","2HCBATCH14NOTIFYOFFICER", params,"RECORD_ID",capId.getCustomID());
//aa.print ("THE PERMIT: "+filePermit);
fileNames0.push(filePermit);

function sendReport4EmailP(itemCap,seofficeremail,reportName,emailTemplate, eparams) {
    var reportSent = false;
    var itemCap = capId;
    var id1 = itemCap.ID1;

    var id2 = itemCap.ID2;

    var id3 = itemCap.ID3;

    var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);

    //Send the report via email
    var rFile;
    var parameters = aa.util.newHashMap();

    for (var i = 5; i < arguments.length ; i = i+2)
    {
        parameters.put(arguments[i],arguments[i+1]);
        aa.print("Report parameter: " + arguments[i] + " = " + arguments[i+1]);
    }

    rFile = generateReport_rpt(itemCap,reportName,parameters);
    aa.print("Report file1: " + rFile);
    if (rFile && rFile!=null) {
        var rFiles = new Array();
        rFiles.push(rFile);
        //aa.document.sendEmailAndSaveAsDocument("policepermits@howardcountymd.gov",seofficeremail, null, "2HCBATCH14NOTIFYOFFICER", eparams, capIDScriptModel, rFiles);
        //sendNotification(null,null,null,emailTemplate,params,rFiles);
        //sendNotification(mailFrom,conObj.people.getEmail(),"",emailTemplate,eParams,rFile,itemCap);
        return rFile;
    }
    //}
    else {
        reportSent = false;
    }
    if (!reportSent) {
        return null;
    }
}

var fileNames=fileNames0.filter(function( element ) {
    return element !=null;
});

if (wfTask=="SEC Final Review"  && wfStatus=="Approved" && southnorth=="Southern" )
{
    aa.document.sendEmailByTemplateName(null, null, null, "1HCCHIEFAPPROVEDISTS", params, fileNames);
}
else if (wfTask=="SEC Final Review"  && wfStatus=="Approved" && southnorth=="Northern")
{
    aa.document.sendEmailByTemplateName(null, null, null, "1HCCHIEFAPPROVEDISTN", params, fileNames);
}
else if (wfTask=="SEC Final Review"  && wfStatus=="Approved" && southnorth=="Southern and Northern")
{
    aa.document.sendEmailByTemplateName(null, null, null, "1HCCHIEFAPPROVEDIST", params, fileNames);
}

//send email to equipment group if record Has Equipment
//aa.print(getAppSpecific("Has Equipment"));
if (wfTask=="SEC Final Review"  && wfStatus=="Approved" && (getAppSpecific("Has Equipment")=="CHECKED"||getAppSpecific("Has Equipment")=="Yes"))
{
    aa.document.sendEmailByTemplateName(null, null, null, "1HCCHIEFAPPROVEDISTEQ", params, fileNames);
}

//send different emails depending on Required conditions
var altID = capId.getCustomID();
var condrq = getCAPConditions (null,null,null,"Required",altID);
if (wfTask=="Chief of Police Review"  && wfStatus=="Approved" && condrq.length!=0)
{
    sendNotification(null,null,null,"1HCCHIEFPENDING",params,null);
}
else if (wfTask=="Chief of Police Review"  && wfStatus=="Approved" && condrq.length==0)
{
    sendNotification(null,null,null,"1HCCHIEFPENDINGNO",params,null);
}

//send out SHA email upon captain approval
var fileNamesSHA0 = new Array();
if (doclist!=null)
{
    for (i = 0; i < doclist.length; i++)
    {
        if (doclist[i].toString().match(/Event Plan\/OPS*/)||doclist[i].toString().match(/SHA*/))
        {fileNamesSHA0.push(aa.document.downloadFile2Disk(doclist[i],"Police","","",true).getOutput());}
    }
}
var fileNamesSHA=fileNamesSHA0.filter(function( element ) {
    return element !=null;
});

if (wfTask=="Special Operations Bureau Captain Review"  && wfStatus=="Approved" && getAppSpecific("SHA Application filed")=="Yes" )
{
    aa.document.sendEmailByTemplateName(null, null, null, "1HCCAPTAINAPPROVESHA", params, fileNamesSHA);
}

//Send no fee email upon Application Acceptance
if(wfTask=="SEC Review" && wfStatus=="Application Accepted" && waivepermitfee=="Yes") {sendNotification(null,null,null,"1HCFEENO",params,null);}

//TEMP: notify applicant of approval conditions
//if (wfTask=="Investigations and Special Operations Command Major Review"  && wfStatus=="Approved")
//{
//  sendNotification(null,null,null,"1HCCONDITION",params,null);
//}

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
//email parameters
var params = aa.util.newHashtable();
getRecordParams4Notification(params);
getContactParams4Notification(params,"Applicant");

//email sending
if((wfTask=="SEC Approval")  && wfStatus=="Approved")
{
    getTaskSpecific_email();
}

if(appMatch("Police/Special Event/Bike Race/NA")&& wfTask=="Investigations and Special Operations Command Major Review"  && wfStatus=="Returned to SEC" && getDocType()==true )
{
    sendNotification(null,null,null,"1HCMAJORBIKESEC",params,null);
}
else if(appMatch("Police/Special Event/Bike Race/NA")&& wfTask=="Investigations and Special Operations Command Major Review"  && wfStatus=="Returned to SEC" && getDocType()==false )
{
    sendNotification(null,null,null,"1HCMAJORBIKESECNO",params,null);

}





function getTaskSpecific_email()
{
    var workflowResult = aa.workflow.getTaskItems(capId, "SEC Approval", null, null, null, null);//aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else
        aa.print("eerrr ");

    //
    // Loop through workflow tasks
    //
    for (i in wfObj)
    {
        fTask = wfObj[i];
        stepnumber = fTask.getStepNumber();
        processID = fTask.getProcessID();
        if (fTask.getTaskDescription()=="SEC Approval")
        {

            TSIResult = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId,processID,stepnumber,"Staffing");//aa.taskSpecificInfo.getTaskSpecificInfoByTask(capId, processID, stepnumber);
            if (TSIResult.getSuccess())
            {
                var TSI = TSIResult.getOutput();

                if (TSI != null)
                {
                    TSInfoModel = TSI.getTaskSpecificInfoModel();
                    var TSIvalue = TSInfoModel.getChecklistComment();
                    if(TSIvalue=="Traffic")
                    {
                        sendNotification(null,null,null,"1HCSECTRAFFIC",params,null);
                    }
                    else if (TSIvalue=="Security")
                    {
                        sendNotification(null,null,null,"1HCSECSECURITY",params,null);

                    }
                    else
                    {
                        sendNotification(null,null,null,"1HCSECSECURITY",params,null);
                        sendNotification(null,null,null,"1HCSECTRAFFIC",params,null);
                    }
                }

            }
            TSIFee = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId,processID,stepnumber,"Waived Application Fee");
            if (TSIFee.getSuccess())
            {
                var TSIF = TSIFee.getOutput();

                if (TSIF != null)
                {
                    TSIFInfoModel = TSIF.getTaskSpecificInfoModel();
                    var TSIFvalue = TSIFInfoModel.getChecklistComment();
                    if(TSIFvalue=="Yes")
                    {
                        sendNotification(null,null,null,"1HCFEENO",params,null);
                    }

                }

            }
        }
    }

}
function getDocType()
{
    var isdocExist=false;
    var docListArray =new Array();
    var docs = aa.document.getDocumentListByEntity(capId.toString(), null).getOutput();
    if (docs != null)
    {
        var tempDocs = docs.toArray();
        for (doc in tempDocs) {
            docListArray.push(tempDocs[doc].getDocCategory());

        }
    }
    for (jj in docListArray)
    {
        if(docListArray[jj]=="General Liability Insurance")
        {
            isdocExist=true;
        }
        else{
            isdocExist=false;
        }
    }
    return isdocExist;
}

function getBalanceDue()
{
    var invArray = aa.finance.getInvoiceByCapID(capId, null).getOutput()
    for (var invCount in invArray) {
        var thisInvoice = invArray[invCount];
        var balDue = thisInvoice.getInvoiceModel().getBalanceDue();
        if (balDue > 0) {
            return balDue;
        }
    }
}





//HCPD-4 Implemented by GCOM START
if(wfTask=="SEC Approval" && wfStatus=="Approved")
{
    var flag = getTaskSpecific_g("SEC Review","Is this event a concert at Merriweather Post Pavilion?");
    if(flag == 'Yes')
    {
        var conType = "Applicant";
        var contactArray = getContactArray();
        for(ca in contactArray) {
            thisContact = contactArray[ca];
            if (thisContact["contactType"] == conType) {
                addParameter(params, "$$ApplicantSalutation$$", thisContact["peopleModel"].getSalutation())
            }
        }
        sendReport4Email( capId,"Auto Special Event Permit Final","1HCENVIRHEALTH", params,"RECORD_ID",capId.getCustomID(),"CONTACT_TYPE","Applicant","TASK","SEC Approval","STATUS","Approved");
    }
}
//HCPD-4 Implemented by GCOM END

//HCPD-12 Implemented by GCOM START
if(wfTask== "Fire and Rescue Services Review" && wfStatus=="Approved")
{
    if(isTaskActiveX("Traffic Enforcement Section Sergeant Review")
        || isTaskActiveX("Specialized Support Sergeant Review"))
    {
        aa.workflow.adjustTask(capId, "Special Operations Bureau Captain Review", "N", "N", null, null);
    }
}
function isTaskActiveX(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTaskItems(capId, wfstr, processName, null, null, "Y");
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
        return false;
    }

    for (i in wfObj) {
        fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName)))
            if (fTask.getActiveFlag().equals("Y"))
                return true;
            else
                return false;
    }
}
//HCPD-12 Implemented by GCOM END

//HCPD-23 Implemented by GCOM START
if(wfTask=="Special Operations Bureau Captain Review" && wfStatus=="Approved" && AInfo["Waived Permit Fee"] == "No")
{

    var params = aa.util.newHashtable();
    getRecordParams4Notification(params);
    getContactParams4Notification(params,"Applicant");
    var trafficTotal = isNull( getAppSpecific("Traffic Total"));
    var securityTotal = isNull(getAppSpecific("Security Total"));
    var fireTotal = isNull(getAppSpecific("Fire Personnel Total"));
    var constantFee = isNull(getAppSpecific("Constant Fee"));

    var credit = parseFloat(isNull(getAppSpecific("Traffic Total")));
    credit += parseFloat(isNull(getAppSpecific("Security Total")));
    credit += parseFloat(isNull(getAppSpecific("Fire Personnel Total")));
    credit += parseFloat(isNull(getAppSpecific("Constant Fee")));
    if( parseFloat(isNull(getAppSpecific("Discount"))) < 0)
    {
        credit = ((credit* parseFloat(isNull(getAppSpecific("Discount"))))/100).toFixed(2);
        credit = Math.abs(credit);
        credit +=  Math.abs(parseFloat(isNull(getAppSpecific("Constant Fee"))));
    }
    if(credit < 0)
        credit = 0;

    var feeObj = aa.finance.getFeeItemByCapID(capId);
    feeObj = feeObj.getOutput();
    var flag = false;
    for(x in feeObj)
    {
        flag = true;
        if(feeObj[x].getFeeCod() == "TRAFFIC" && (feeObj[x].getFeeitemStatus() == "INVOICED" || feeObj[x].getFeeitemStatus() == "NEW"))
            trafficTotal = feeObj[x].getFee();
        else if(feeObj[x].getFeeCod() == "SECURITY" && (feeObj[x].getFeeitemStatus() == "INVOICED" || feeObj[x].getFeeitemStatus() == "NEW"))
            securityTotal = feeObj[x].getFee();
        else if(feeObj[x].getFeeCod() == "FIRE" && (feeObj[x].getFeeitemStatus() == "INVOICED" || feeObj[x].getFeeitemStatus() == "NEW"))
            fireTotal = feeObj[x].getFee();
        else if(feeObj[x].getFeeCod() == "CONSTANT" && (feeObj[x].getFeeitemStatus() == "INVOICED" || feeObj[x].getFeeitemStatus() == "NEW"))
        {
            constantFee = Math.abs(parseFloat(feeObj[x].getFee()));
        }
        else if(feeObj[x].getFeeCod() == "COSTOFFICER" && (feeObj[x].getFeeitemStatus() == "INVOICED" || feeObj[x].getFeeitemStatus() == "NEW"))
            credit = Math.abs(parseFloat(feeObj[x].getFee()));
        //logDebug(feeObj[x].getFee() + " " + feeObj[x].getFeeCod() + " " + feeObj[x].getFeeDescription());
    }
    if(flag)
        credit = credit + constantFee;

    var capDetail = "";
    var balance = 0;
    var capDetailObjResult = aa.cap.getCapDetail(capId); 		// Detail
    if (capDetailObjResult.getSuccess()) {
        capDetail = capDetailObjResult.getOutput();
        balance = capDetail.getBalance();
    }
    if(balance < 0)
        balance = 0;
    addParameter(params, "$$trafficNo$$",  isNull(getAppSpecific("Number of Traffic Officers")));
    addParameter(params, "$$trafficHrs$$", "" + isNull(getAppSpecific("Hours per Traffic Officer")));
    addParameter(params, "$$trafficTotal$$", "$" +trafficTotal);
    addParameter(params, "$$securityNo$$", isNull(getAppSpecific("Number of Security Officers")));
    addParameter(params, "$$securityHrs$$", "" + isNull(getAppSpecific("Hours per Security Officer")));
    addParameter(params, "$$securityTotal$$", "$" + securityTotal);

    addParameter(params, "$$fireNo$$", isNull(getAppSpecific("Number of Fire Personnel")));
    addParameter(params, "$$fireHrs$$", "" + isNull(getAppSpecific("Hours per Fire Personnel")));
    addParameter(params, "$$fireTotal$$", "$" + fireTotal);

    addParameter(params, "$$constantFee$$", "$" + Math.abs(constantFee));
    addParameter(params, "$$discountPercentage$$", Math.abs(isNull(getAppSpecific("Discount"))) + "%");

    addParameter(params, "$$credit$$", "$" + credit.toFixed(2)  );

    addParameter(params, "$$balanceDueX$$", "$" + balance);

    sendNotification(null,null,null,"1HCCAPTAINFEE",params,null);
    sendNotification(null,null,null,"1HCCAPTAINAPPROVE",params,null);


}
function isNull(pTestValue) {
    if (pTestValue == null || pTestValue == "")
        return "0";
    else
        return pTestValue;
}
//HCPD-23 Implemented by GCOM START