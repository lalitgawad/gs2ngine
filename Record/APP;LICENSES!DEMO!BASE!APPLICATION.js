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
		demoSendApplicationSubmission();
    }

    this.ISHBDelegator = function () {

    }
    this.ISADelegator = function()
    {
        gs2.common.closeWfTask(capId, "Inspection", "Inspection Scheduled", "Compliance Inspection Scheduled", "");
        aa.workflow.adjustTask(capId, "Inspection", "Y", "N", null, null);
        aa.workflow.adjustTask(capId, "Supervisory Review", "N", "N", null, null);
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
            gs2.common.closeWfTask(capId, "Inspection", "Compliant", inspComment , "");
            gs2.rec.updateAppStatus("Compliant - Finalized","");

        }
        else if(inspResult == "Non - Compliant")
        {
            gs2.common.closeWfTask(capId, "Inspection", "Non - Compliant", inspComment , "");
            gs2.rec.updateAppStatus("Non - Compliant","");
        }
    }
    this.IRMADelegator = function ()
    {
        if(inspResult == "Compliant - Finalized")
        {
            gs2.common.closeWfTask(capId, "Inspection", "Compliant", inspComment , "");
            gs2.rec.updateAppStatus("Compliant - Finalized","");

        }
        else if(inspResult == "Non - Compliant")
        {
            gs2.common.closeWfTask(capId, "Inspection", "Non - Compliant", inspComment , "");
            gs2.rec.updateAppStatus("Non - Compliant","");
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
            editAppName("",pocCapId);
            sendAppToACA4Edit(pocCapId);
            var pocItemsArr = this.getPOCItems();
            addASITable("DIFICIENCY LISTING", pocItemsArr, pocCapId);
            gs2.wf.deActivateWfTask(capId, "Supervisory Review");
            gs2.wf.deActivateWfTask(capId, "Application Issuance");
			var comments = "Deficiency Report Issued - please submit plan of correction."; 
			demoSendAdditinalInfoRequiredForApp(comments);
        }
        else if(wfTask == "Application Issuance" && wfStatus == "Application Approved - Issue Permit")
        {
            var licCapId = gs2.rec.createParent(appTypeArray[0],appTypeArray[1],appTypeArray[2],"License");
            gs2.rec.updateAppStatus("Active","", licCapId);
            editAppName("",licCapId);
			demoSendLicenseIssuance(licCapId);
        }
        else if(wfTask == "Application Review" && wfStatus == "Additional Information Required")
        {
            gs2.wf.deActivateWfTask(capId, "Application Review");
            //gs2.rec.addStdConditionWithComments("Licensing", "Addtional Information Required", "Additional Information Required","Additional Information Required" , wfComment , null);
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
                    var vGuideSheet = getGuideSheetObjects(inspId)[0];
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