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
            gs2.wf.activateTask(capId, "Inspection");
            gs2.common.closeWfTask(capId, "Inspection", "Additional Information Received", "Additional Information Received", "");
        }
        else
        {
            gs2.wf.activateTask(capId, "Application Review");
            gs2.common.closeWfTask(capId, "Application Review", "Additional Information Received", "Additional Information Received", "");
        }
        editCapConditionStatus("Addtional Information Required","Additional Information Required","Condition Met","Not Applied")
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
    }

    this.ISHBDelegator = function () {

    }
    this.ISADelegator = function()
    {

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
    this.IRMADelegator = function () {

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
            var pocItemsArr = this.getPOCItems();
            addASITable("DIFICIENCY LISTING", pocItemsArr, pocCapId);
            gs2.wf.deActivateWfTask(capId, "Supervisory Review");
            gs2.wf.deActivateWfTask(capId, "Application Issuance");
        }
        else if(wfTask == "Supervisory Review" && wfStatus == "Review Complete")
        {
            var licCapId = gs2.rec.createParent(appTypeArray[0],appTypeArray[1],appTypeArray[2],"License");
            gs2.rec.updateAppStatus("Active","", licCapId);
            editAppName("",licCapId);
        }
        else if(wfTask == "Application Review" && wfStatus == "Additional Information Required")
        {
            gs2.wf.deActivateWfTask(capId, "Application Review");
            //gs2.rec.addStdConditionWithComments("Licensing", "Addtional Information Required", "Additional Information Required","Additional Information Required" , wfComment , null);
            addSTDConditionX("Addtional Information Required", "Additional Information Required", capId);
        }
        /*else if(wfTask == "Application Review" && wfStatus == "Additional Information Received")
        {
            gs2.wf.activateTask(capId, "Application Review");
            editCapConditionStatus("Addtional Information Required","Additional Information Required","Condition Met","Not Applied")
        }*/
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
function moveWFTask(ipTask, ipStatus, ipComment, ipNote) // Optional CapID, Process, StatusDate
{
    var vCapId = capId;
    if (arguments.length > 4 && arguments[4] != null) {
        var vCapId = arguments[4];
    }

    if (ipTask == "")
        ipTask = getCurrentTask(vCapId).getTaskDescription();

    var vUseProcess = false;
    var vProcessName = "";
    if (arguments.length > 5 && arguments[5] != null && arguments[5] != "") {
        vProcessName = arguments[5]; // subprocess
        vUseProcess = true;
    }

    var vUseStatusDate = false;
    var vStatusDate = null;
    var vToday = new Date();
    if (arguments.length > 6 && arguments[6] != null && arguments[6] != "") {
        vStatusDate = new Date(arguments[6]);
        vUseStatusDate = true;
    }

    var vWFResult = aa.workflow.getTaskItems(vCapId, ipTask, vProcessName, null, null, null);
    if (vWFResult.getSuccess())
        var vWFObj = vWFResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get workflow object: " + vWFResult.getErrorMessage());
        return false;
    }

    if (!ipStatus)
        ipStatus = "NA";

    if (vWFObj.length == 0)
        return false;

    var vMoved = false;
    for (var vCounter in vWFObj) {
        var vTaskObj = vWFObj[vCounter];
        if (vTaskObj.getTaskDescription().toUpperCase().equals(ipTask.toUpperCase()) && (!vUseProcess || vTaskObj.getProcessCode().equals(vProcessName))) {
            var vTaskStatusObj = aa.workflow.getTaskStatus(vTaskObj, ipStatus).getOutput();
            if (!vTaskStatusObj)
                continue;
            if (vUseStatusDate) {
                var vTaskModel = vTaskObj.getTaskItem();
                vTaskModel.setStatusDate(vStatusDate);
                vTaskModel.setDisposition(ipStatus);
                vTaskModel.setDispositionNote(ipNote);
                vTaskModel.setDispositionComment(ipComment);
                vTaskModel.setDispositionDate(vToday);
                aa.workflow.handleDisposition(vTaskModel, vCapId);
                vMoved = true;
                logMessage("Moved Workflow Task: " + ipTask + " with status " + ipStatus);
                logDebug("Moved Workflow Task: " + ipTask + " with status " + ipStatus);
            } else {
                var vResultAction = vTaskStatusObj.resultAction;
                var vStepNumber = vTaskObj.getStepNumber();
                var vProcessID = vTaskObj.getProcessID();
                var vDispositionDate = aa.date.getCurrentDate();

                if (vUseProcess)
                    aa.workflow.handleDisposition(vCapId, vStepNumber, vProcessID, ipStatus, vDispositionDate, ipNote, ipComment, systemUserObj, vResultAction);
                else
                    aa.workflow.handleDisposition(vCapId, vStepNumber, ipStatus, vDispositionDate, ipNote, ipComment, systemUserObj, vResultAction);

                vMoved = true;
                aa.print("Moved Workflow Task: " + ipTask + " with status " + ipStatus);
                logDebug("Moved Workflow Task: " + ipTask + " with status " + ipStatus);
            }
        }
    }
    return vMoved;
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