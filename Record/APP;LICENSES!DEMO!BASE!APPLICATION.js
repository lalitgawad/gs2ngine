/**
 | Program : APP:LICENSES/MY/BASE/APPLICATION
 | Trigger : N/A
 | Event : N/A
 | Usage : Application Object use in events to implement city buiseness
 | Agency :
 | Purpose : Application Object
 | Mark  : New Script
 | Notes : Initial Version
 */

/**
 *
 */

/**
 Application Object for
  APP:Licenses/My/Base/Application
 * @param {string} identity - recordtype
 * @param {string} caller - code context
 */
function APP_OBJ(identity, caller) {
    gCaller = caller;

    this.ObjId = "APP:Licenses/Demo/Base/Application";
    this.Id = identity;
    this.Caller = caller;
    this.publicUser = false;
    this.RecordType = "";
    this.AltId = "";
    this.CapId = null;


    //Common Interface for all object
    /**
     * object in string - for troubleshoot or debug
     * @returns {string}
     */
    this.toString = function () {
        var result = '';
        var sbArray = new Array();
        var scArray = new Array();
        var lf = ";";

        scArray.push("Identity : ");
        sbArray.push(this.Id);
        scArray.push("Caller : ");
        sbArray.push(this.Caller);
        scArray.push("publicUser : ");
        sbArray.push(this.publicUser);
        scArray.push("RecordType : ");
        sbArray.push(this.RecordType);
        scArray.push("AltId : ");
        sbArray.push(this.AltId);

        for (var c in sbArray) {
            result += scArray[c];
            result += sbArray[c];
            result += lf;
        }

        return result;
    }
    /**
     * Initialize
     */

    this.initGlobalObjects = function () {
        try {

        } catch (err) {
            gs2.common.handleError(err, "");
        }
    }

	/**
     * Initialize
     */
    this.Init = function () {
        this.CapId = capId;
        this.publicUser = publicUser;
        this.RecordType = appTypeString + "";
        this.CapId = capId;
        this.initGlobalObjects();
        logDebug("INIT BASE");
    }

	//Initialize
    this.Init();

    /**
     * Get Application Document validation Requirement
     * @returns {array} [ Array of condition to verify and apply
     */
    this.GetAppDocumentRequirement = function () {
        var vDocConditions = new Array();

        return vDocConditions;
    }

    /**
     * Get Application Expiration Rules
     */
    this.GetAppExpiration = function () {
        //logDebug("**WARNING: Failed to GetAppExpiration():");
        var emptyArray = new Array();
        emptyArray[this.RecordType] = {
            "--Initialize": { "expcode": "LAND_ENTITLEMENT", "status": ["Initialize"], "dateEval": null },
            "Application Completeness": { "expcode": "LAND_ENTITLEMENT", "status": ["Plat Number Assigned", "Complete", "Completed"], "dateEval": null }
        };
        return emptyArray;
    }

    /**
     * Fees to Apply after submittion
     */
    this.ApplyAppFees = function () {
        appAddFees();
    }
    /**
     * IFADelegator to call local function(s) for invoice Fee after
     */
    this.IFADelegator = function (){

    }

    /**
     * pra Delegator to call local function(s) for record specific after logic
     */
    this.praDelegator = function () {

    }
    /**
     * Document upload after Delegator to call local function(s) for record specific before logic
     */
    this.DuaDelegator = function() {
        if(doesStatusExistInTaskHistory("Application Review", "Application Approved - Inspection Needed"))
        {
            gs2.common.closeWfTask(capId, "Inspection", "Additional Information Received", "Additional Information Received", "");
            gs2.wf.activateTask(capId, "Inspection");
            aa.workflow.adjustTask(capId, "Inspection", "Y", "N", null, null);
            aa.workflow.adjustTask(capId, "Supervisory Review", "N", "N", null, null);
        }
        else
        {
            gs2.common.closeWfTask(capId, "Application Review", "Additional Information Received", "Additional Information Received", "");
            gs2.wf.activateTask(capId, "Application Review");
            aa.workflow.adjustTask(capId, "Application Review", "Y", "N", null, null);
            aa.workflow.adjustTask(capId, "Supervisory Review", "N", "N", null, null);
            aa.workflow.adjustTask(capId, "Inspection", "N", "N", null, null);
        }
        editCapConditionStatusX("Addtional Information Required","Additional Information Required","Condition Met","Not Applied")
        /*var vDocumentModelArray = aa.env.getValue("DocumentModelList");
        if (vDocumentModelArray.size() > 0) {
            for (var index = 0; index < vDocumentModelArray.size(); index++) {
                var docName = String(vDocumentModelArray.get(index).getDocCategory());
                if (docName == "Engineer Letter - Foundation") {

                }
            }
        }*/
    }

    this.GUADelegator = function()
    {

    }
    /**
     * ASA Delegator to call local function(s) for record specific after logic
     */
    this.AsaDelegator = function () {
        if (!publicUser) {
            gs2.common.closeWfTask(capId, "Application Intake", "Intake Complete", "Intake Complete", "");
        }
        if (!publicUser) {
            democreateAddressUsingFacilityContact();
            demoSendApplicationSubmission();
        }
    }

    this.AsiuaDelegator = function () {

    }


    this.AsbDelegator = function () {

    }

    /**
     * CTRCA Delegator to call local function(s) for record specific after logic
     */
    this.CtrcaDelegator = function () {
        if(balanceDue > 0)
        {
            gs2.common.closeWfTask(capId, "Application Intake", "Payment Complete", "Payment Complete", "");
            gs2.common.closeWfTask(capId, "Application Intake", "Intake Complete", "Intake Complete", "");
        }
        addApplicantToCap4ACA();
        democreateAddressUsingFacilityContact();
		demoSendApplicationSubmission();
    }

    this.ISHBDelegator = function () {

    }
    this.ISADelegator = function()
    {
        gs2.common.closeWfTask(capId, "Inspection", "Inspection Scheduled", "Compliance Inspection Scheduled", "");
        aa.workflow.adjustTask(capId, "Inspection", "Y", "N", null, null);
        aa.workflow.adjustTask(capId, "Supervisory Review", "N", "N", null, null);
        demoSendInspectionScheduled();
    }
    /**
     * IRSB Delegator to call local function(s) for record specific after logic
     */
    this.IRSBDelegator = function () {

    }
    /**
     * IRMB Delegator to call local function(s) for record specific after logic
     */
    this.IRMBDelegator = function () {

    }
    this.ISHADelegator = function () {
		demoSendInspectionScheduled();
    }
    this.IRSADelegator = function () {
        if(inspResult == "Compliant - Finalized")
        {
            gs2.common.closeWfTask(capId, "Inspection", "Pending Inspection Review", inspComment , "");
            aa.workflow.adjustTask(capId, "Inspection", "Y", "N", null, null);
            //gs2.common.closeWfTask(capId, "Inspection", "Compliant", inspComment , "");
            //gs2.rec.updateAppStatus("Compliant - Finalized","");

        }
        else if(inspResult == "Non - Compliant")
        {
            gs2.common.closeWfTask(capId, "Inspection", "Pending Inspection Review", inspComment , "");
            aa.workflow.adjustTask(capId, "Inspection", "Y", "N", null, null);
            //gs2.common.closeWfTask(capId, "Inspection", "Non - Compliant", inspComment , "");
            //gs2.rec.updateAppStatus("Non - Compliant","");
            var pocItemsArr = this.getPOCItems();
            addASITable("DIFICIENCY LISTING", pocItemsArr);
        }
    }
    this.IRMADelegator = function ()
    {
        if(inspResult == "Compliant - Finalized")
        {
            gs2.common.closeWfTask(capId, "Inspection", "Pending Inspection Review", inspComment , "");
            aa.workflow.adjustTask(capId, "Inspection", "Y", "N", null, null);
            //gs2.common.closeWfTask(capId, "Inspection", "Compliant", inspComment , "");
            //gs2.rec.updateAppStatus("Compliant - Finalized","");
        }
        else if(inspResult == "Non - Compliant")
        {
            gs2.common.closeWfTask(capId, "Inspection", "Pending Inspection Review", inspComment , "");
            aa.workflow.adjustTask(capId, "Inspection", "Y", "N", null, null);
            //gs2.common.closeWfTask(capId, "Inspection", "Non - Compliant", inspComment , "");
            //gs2.rec.updateAppStatus("Non - Compliant","");
            var pocItemsArr = this.getPOCItems();
            addASITable("DIFICIENCY LISTING", pocItemsArr);
        }
    }

    this.AsiubDelegator = function (){

    }
    /**
     * Workflow task update before Delegator to call local function(s) for record specific before logic
     */
    this.WtubDelegator = function ()
    {

    }

   /**
     * ASA Async Delegator to call local function(s) for record specific after logic
     */
    this.AsaAsyncDelegator = function () {
        //gs2.common.closeWfTask(capId, "Application Intake", "Intake Complete", "Intake Complete", "");
    }

    /**
     * CTRCA Async Delegator to call local function(s) for record specific after logic
     */
    this.CtrcaAsyncDelegator = function () {

    }

    /**
     * Workflow task update after Delegator to call local function(s) for record specific after logic
     */
    this.WtuaDelegator = function()
    {
        if(wfTask == "Application Review" && wfStatus == "Application Approved - Inspection Needed")
        {
            gs2.insp.createPendingInspection("INSP_CI", "Compliance Inspection");
            //gs2.common.closeWfTask(capId, "Inspection", "Inspection Scheduled", "Compliance Inspection Scheduled", "");
            //updateTask("Inspection","Inspection Scheduled", "Compliance Inspection Scheduled", "");
            //moveWFTask("Inspection","Inspection Scheduled", "Compliance Inspection Scheduled", "");
        }
        else if(wfTask == "Supervisory Review" && wfStatus == "Deficiency Report Issued")
        {
            var pocCapId = gs2.rec.createChild("Licenses","Plan of Correction","NA","NA");
            gs2.rec.updateAppStatus("Awaiting Provider Response","", pocCapId);
            gs2.rec.copyAppName(capId, pocCapId);
            copyAddresses(capId, pocCapId);
            
            gs2.user.linkPublicUserToApplication();
            var capModelScript = aa.cap.getCap(capId).getOutput();
            var capModel = capModelScript.getCapModel();
            var user = capModel.getCreatedBy();
            editCreatedBy(user,pocCapId);
            sendAppToACA4Edit(pocCapId);
            
            //var pocItemsArr = this.getPOCItems();
            //addASITable("DIFICIENCY LISTING", pocItemsArr, pocCapId);
            copyASITable(capId, pocCapId, "DIFICIENCY LISTING");

            gs2.wf.deActivateWfTask(capId, "Supervisory Review");
            gs2.wf.deActivateWfTask(capId, "Application Issuance");

            gs2.common.closeWfTask(pocCapId, "Correction Review", "Pending Review", "Pending Review", "");
            aa.workflow.adjustTask(pocCapId, "Correction Review", "Y", "N", null, null);
            aa.workflow.adjustTask(pocCapId, "Directed POC Review", "N", "N", null, null);

            demoSendPocNotice(pocCapId);
        }
        else if(wfTask == "Application Issuance" && wfStatus == ("Application Approved - Issue Permit" || wfStatus == "Application Approved - Issue License"))
        {
            var licCapId = gs2.rec.createParent(appTypeArray[0],appTypeArray[1],appTypeArray[2],"License");
            gs2.rec.updateAppStatus("Active","", licCapId);
            copyASIFields(capId, licCapId);
            updateExpirationDateFromToday(licCapId, new Date());
            gs2.rec.copyAppName(capId, licCapId);
            copyAddresses(capId, licCapId);
            gs2.user.linkPublicUserToApplication();

			demoSendLicenseIssuance(licCapId);
        }
        else if(wfTask == "Application Review" && wfStatus == "Additional Information Required")
        {
            gs2.wf.deActivateWfTask(capId, "Application Review");
            addSTDConditionX("Addtional Information Required", "Additional Information Required", capId);
			var comments = "Send missing required information"; 
			demoSendAdditinalInfoRequiredForApp(comments);
        }
        else if(wfTask == "Inspection" && wfStatus == "Request Additional Information")
        {
            gs2.wf.deActivateWfTask(capId, "Inspection");
            addSTDConditionX("Addtional Information Required", "Additional Information Required", capId);
			var comments = "Send missing required information"; 
			demoSendAdditinalInfoRequiredForApp(comments);
        }
        else if(wfTask == "Inspection" && wfStatus == "Compliant")
        {
            gs2.rec.updateAppStatus("Compliant - Finalized","");
        }
        else if(wfTask == "Inspection" && wfStatus == "Non - Compliant")
        {
            gs2.rec.updateAppStatus("Non - Compliant","");
        }

    }

    /**
     * validatePage
     */
    this.validatePage = function (controlString) {
        var pbValid = true;
        if (controlString == 'ACA_PROPINFO_PROP_BEFORE') {

        }
        //
        return pbValid;
    }


	this.pageflowDelegator = function (pfName) {
        var hidepage = true;

        switch (pfName) {
            case "ACA_COM_GENERAL_PROJECT_INFO_BEFORE":
            case "ACA_COM_GENERAL_PROJECT_INFO_AFTER":

            default:
                hidepage = false;
                break;
        }
        if (hidepage) {
            aa.env.setValue("ReturnData", "{'PageFlow': {'HidePage' : 'Y'}}");
        }
    }
    this.getPOCItems = function ()
    {
        var vArr = new Array();
        var inspResultObj = aa.inspection.getInspections(capId);
        if (inspResultObj.getSuccess()) {
            var inspList = inspResultObj.getOutput();
            for (xx in inspList) {
                if (inspList[xx].getInspectionStatus() == "Non - Compliant" && inspList[xx].getInspectionType() == "Compliance Inspection" ) {
                    var inspId = inspList[xx].getIdNumber();
                    var vGuideSheets = getGuideSheetObjects(inspId);
                    for(var j in vGuideSheets)
                    {
                        var vGuideSheet = vGuideSheets[j];
                        var CInfo = new Array();
                        vGuideSheet.loadInfo();
                        CInfo = vGuideSheet.info;
                        for(var i in CInfo)
                        {
                            var vRow = new Array();
                            if(CInfo[i] == "CHECKED")
                            {
                                vRow["Observiation / Citation #"] = new asiTableValObj("Observiation / Citation #",vGuideSheet.text+"", "Y");
                                vRow["Comments"] = new asiTableValObj("Comments",""+i, "Y");
                                vRow["Plan of Correction"] = new asiTableValObj("Plan of Correction","", "N");
                                vArr.push(vRow);
                            }
                        }
                    }
                }
            }
        }
        return vArr;
    }
}
//Add standard condition to the specific CapID
function addSTDConditionX(cType, cDesc, vCapID) {

    if (!aa.capCondition.getStandardConditions) {
        logDebug("addStdCondition function is not available in this version of Accela Automation.");
    }
    else {
        standardConditions = aa.capCondition.getStandardConditions(cType, cDesc).getOutput();
        logDebug(standardConditions.length);
        for (i = 0; i < standardConditions.length; i++) {
            standardCondition = standardConditions[i];
            if (standardCondition.getConditionType().toUpperCase() == cType.toUpperCase() && standardCondition.getConditionDesc().toUpperCase() == cDesc.toUpperCase()) {
                standardCondition.setLongDescripton(wfComment);
                var addCapCondResult = aa.capCondition.createCapConditionFromStdCondition(vCapID, standardCondition);

                if (addCapCondResult.getSuccess()) {
                    logDebug("Successfully added condition (" + standardCondition.getConditionDesc() + ")");
                }
                else {
                    logDebug("**ERROR: adding condition (" + standardCondition.getConditionDesc() + "): " + addCapCondResult.getErrorMessage());
                }
            }
        }
    }
}
function updateExpirationDateFromToday(capId, newDate) {
    b1ExpResult = aa.expiration.getLicensesByCapID(capId);
    if ((b1ExpResult.getSuccess())) {
        this.b1Exp = b1ExpResult.getOutput();
        this.b1Exp.setExpStatus("Active");
        aa.expiration.editB1Expiration(this.b1Exp.getB1Expiration());
        var appTypeString = aa.cap.getCap(capId).getOutput().getCapType().toString();
        var years = 1;
        newDate.setFullYear(Number(newDate.getFullYear()) + Number(years));
        var dateString = newDate.getMonth() + 1 + "/" + newDate.getDate() + "/" + newDate.getFullYear();
        var licNum = capId.getCustomID();
        thisLic = new licenseObject(licNum, capId);
        thisLic.setExpiration(dateString);
    }
}
function doesStatusExistInTaskHistory(tName, tStatus) {

    histResult = aa.workflow.getWorkflowHistory(capId, tName, null);
    if (histResult.getSuccess()) {
        var taskHistArr = histResult.getOutput();
        for (var xx in taskHistArr) {
            taskHist = taskHistArr[xx];
            if (tStatus.equals(taskHist.getDisposition()))
                return true;
        }
        return false;

    }
    else {
        logDebug("Error getting task history : " + histResult.getErrorMessage());
    }
    return false;

}
function addApplicantToCap4ACA() {
    puSeq = publicUserID.substring(10);
    var peopleResult = aa.people.getUserAssociatedContact(puSeq).getOutput().toArray();
    contactNum = peopleResult[0].getContactSeqNumber();

    getPerson = aa.people.getPeople(contactNum).getOutput();
    getPerson.setContactType("Applicant");

    addApplicant = aa.people.createCapContactWithRefPeopleModel(capId, getPerson);

}
function editCapConditionStatusX(pType, pDesc, pStatus, pStatusType) {
    if (pType == null) {
        var condResult = aa.capCondition.getCapConditions(capId)
    } else {
        var condResult = aa.capCondition.getCapConditions(capId, pType)
    }
    if (condResult.getSuccess()) {
        var capConds = condResult.getOutput()
    } else {
        logMessage("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
        aa.print("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
        return false
    }
    for (cc in capConds) {
        var thisCond = capConds[cc];
        var cStatus = thisCond.getConditionStatus();
        var cStatusType = thisCond.getConditionStatusType();
        var cDesc = thisCond.getConditionDescription();
        var cImpact = thisCond.getImpactCode();
        logDebug(cStatus + ": " + cStatusType);
        if (cDesc.toUpperCase() == pDesc.toUpperCase()) {
            if (!pStatus.toUpperCase().equals(cStatus.toUpperCase())) {
                thisCond.setConditionStatus(pStatus);
                thisCond.setConditionStatusType(pStatusType);
                thisCond.setImpactCode("");
                aa.capCondition.editCapCondition(thisCond);
            } else {
                aa.print("ERROR: condition found but already in the status of pStatus and pStatusType");
            }
        }
    }
    aa.print("ERROR: no matching condition found");
    return false
}
function sendAppToACA4Edit() {
    // Send to ACA user for EDIT.
    var vCapID = capId;
    if (arguments.length > 0) vCapID = arguments[0];
    var vCap = aa.cap.getCap(vCapID).getOutput().getCapModel();
    vCap.setCapClass("EDITABLE");
    aa.cap.editCapByPK(vCap);
}
function setLicExpirationDate(itemCap) {
    //itemCap - license capId
    //the following are optional parameters
    //calcDateFrom - MM/DD/YYYY - the from date to use in the date calculation
    //dateOverride - MM/DD/YYYY - override the calculation, this date will be used
    //renewalStatus - if other than active override the status


    var licNum = itemCap.getCustomID();

    if (arguments.length == 1) {
        calcDateFrom = null;
        dateOverride = null;
        renewalStatus = null;
    }

    if (arguments.length == 2) {
        calcDateFrom = arguments[1];
        dateOverride = null;
        renewalStatus = null;
    }

    if (arguments.length == 3) {
        calcDateFrom = arguments[1];
        dateOverride = arguments[2];
        renewalStatus = null;
    }

    if (arguments.length == 4) {
        calcDateFrom = arguments[1];
        dateOverride = arguments[2];
        renewalStatus = arguments[3];
    }

    var tmpNewDate = "";

    b1ExpResult = aa.expiration.getLicensesByCapID(itemCap);

    if (b1ExpResult.getSuccess()) {

        this.b1Exp = b1ExpResult.getOutput();
        //Get expiration details
        var expUnit = this.b1Exp.getExpUnit();
        var expInterval = this.b1Exp.getExpInterval();

        if (expUnit == null) {
            logDebug("Could not set the expiration date, no expiration unit defined for expiration code: " + this.b1Exp.getExpCode());
            return false;
        }

        if (expUnit == "Days") {
            tmpNewDate = dateAdd(calcDateFrom, expInterval);
        }

        if (expUnit == "Months") {
            tmpNewDate = dateAddMonths(calcDateFrom, expInterval);
        }

        if (expUnit == "Years") {
            tmpNewDate = dateAddMonths(calcDateFrom, expInterval * 12);
        }
    }

    thisLic = new licenseObject(licNum, itemCap);

    if (dateOverride == null) {
        thisLic.setExpiration(dateAdd(tmpNewDate, 0));
    } else {
        thisLic.setExpiration(dateAdd(dateOverride, 0));
    }

    if (renewalStatus != null) {
        thisLic.setStatus(renewalStatus);
    } else {
        thisLic.setStatus("Active");
    }

    logDebug("Successfully set the expiration date and status");

    return true;

}