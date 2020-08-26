/**
 | Program : APP:LICENSES/PLAN OF CORRECTION/NA/NA
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
  APP:Licenses/Plan of Correction/NA/NA
 * @param {string} identity - recordtype
 * @param {string} caller - code context
 */
function APP_OBJ(identity, caller) {
    gCaller = caller;

    this.ObjId = "APP:Licenses/Plan of Correction/NA/NA";
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
        /*
        if(isActiveTask("Correction Review"))
        {
            gs2.common.closeWfTask(capId, "Correction Review", "Additional Information Received", "Additional Information Received", "");
            aa.workflow.adjustTask(capId, "Correction Review", "Y", "N", null, null);
            aa.workflow.adjustTask(capId, "Directed POC Review", "N", "N", null, null);
        }
        */
        if(isActiveTask("Directed POC Review"))
        {
            gs2.common.closeWfTask(capId, "Directed POC Review", "Evidence Received", "Evidence Received", "");
            gs2.wf.activateTask(capId, "Directed POC Review");
            aa.workflow.adjustTask(capId, "Directed POC Review", "Y", "N", null, null);
            gs2.rec.updateAppStatus("Evidence Received","", capId);
        }
    }


    this.GUADelegator = function()
    {
        logDebug("All checked boxes: "+ this.getAllChecked());
        this.addInspectionResult(this.getAllChecked());
    }
    /**
     * Performs Payment Received from Cashier After actions for Applciation Record Type
     */
    this.CashierPaymentAfter = function(_cashierObj) {
        this.praDelegator();
    }

    /**
     * Apply Application Fees For ASIUA
     */
    this.ApplyAppASIUAFees = function () {

    }


    /** Workflow **/
    this.AutoAssignUser = function () {

    }

    /**
     * ASA Delegator to call local function(s) for record specific after logic
     */
    this.AsaDelegator = function () {
        if(isActiveTask("Correction Review") && doesStatusExistInTaskHistory("Correction Review", "Additional Information Requested"))
        {
            gs2.common.closeWfTask(capId, "Correction Review", "Additional Information Received", "Additional Information Received", "");
            gs2.wf.activateTask(capId, "Correction Review");
            aa.workflow.adjustTask(capId, "Correction Review", "Y", "N", null, null);
            aa.workflow.adjustTask(capId, "Directed POC Review", "N", "N", null, null);
            revokeAppACAEdit(capId);
        } else {
            gs2.rec.updateAppStatus("Pending Review","", capId);
            revokeAppACAEdit(capId);
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

    }

    this.ISHBDelegator = function () {
        var errorMessageVal = "";
        errorMessageVal += ISBValidations();
        if (errorMessageVal != "") {
            cancel = true;
            showMessage = true;
            comment(errorMessageVal);
        }
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

    }
    this.IRMADelegator = function () {

    }

    this.AsiubDelegator = function (){

    }

   /**
     * ASA Async Delegator to call local function(s) for record specific after logic
     */
    this.AsaAsyncDelegator = function () {

    }

    /**
     * CTRCA Async Delegator to call local function(s) for record specific after logic
     */
    this.CtrcaAsyncDelegator = function () {

    }

    /**
     * Workflow task update after Delegator to call local function(s) for record specific after logic
     */
    this.WtuaDelegator = function () {
        if(wfTask == "Directed POC Review" && wfStatus == "Implementation Complete")
        {
            this.resultNonCompliantInspection();
            var pCapId = getParent();
            gs2.common.closeWfTask(pCapId, "Supervisory Review", "Review Complete", "Supervisory Review Complete", "");
            //aa.workflow.adjustTask(pCapId, "Application Issuance", "Y", "N", null, null);
            removeASITable("DIFICIENCY LISTING", pCapId);
            copyASITable(capId, pCapId, "DIFICIENCY LISTING");
        }
        else if(wfTask == "Correction Review" && wfStatus == "Additional Information Requested")
        {
            gs2.rec.updateAppStatus("Awaiting Provider Response","", capId);
            //gs2.wf.deActivateWfTask(capId, "Correction Review");
            sendAppToACA4Edit();
            var comments = "Send missing required information"; 
            demoSendAdditinalInfoRequiredForPoc(comments);
        }
        else if(wfTask == "Correction Review" && wfStatus == "POC Accepted")
        {
            //aa.workflow.adjustTask(capId, "Directed POC Review", "Y", "N", null, null);
            gs2.rec.updateAppStatus("Awaiting for Evidence","", capId);
            demoSendPocEvidence();
            revokeAppACAEdit(capId);
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

    /**
     * Workflow task update before Delegator to call local function(s) for record specific before logic
     */
    this.WtubDelegator = function () {

    }
    this.resultNonCompliantInspection = function()
    {
        var vCapID = getParent();
        var inspResultObj = aa.inspection.getInspections(vCapID);
        if (inspResultObj.getSuccess()) {
            var inspList = inspResultObj.getOutput();
            for (xx in inspList) {
                if (inspList[xx].getInspectionStatus() == "Non - Compliant" && inspList[xx].getInspectionType() == "Compliance Inspection" )
                {
                    var inspId = inspList[xx].getIdNumber();
                    aa.inspection.resultInspection(vCapID, inspId, "Compliant - Finalized",aa.date.getCurrentDate(), "Compliant - Finalized", "A");
                }
            }
        }
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

}
function copyASITable(pFromCapId, pToCapId, tableName) {
    var itemCap = pFromCapId;

    var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
    var ta = gm.getTablesArray()
    var tai = ta.iterator();
    var tableArr = new Array();
    var ignoreArr = new Array();

    while (tai.hasNext()) {
        var tsm = tai.next();

        var tempObject = new Array();
        var tempArray = new Array();
        var tn = tsm.getTableName() + "";
        var numrows = 0;

        if (tn != tableName)
            continue;

        if (!tsm.rowIndex.isEmpty()) {
            var tsmfldi = tsm.getTableField().iterator();
            var tsmcoli = tsm.getColumns().iterator();
            var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
            var numrows = 1;

            while (tsmfldi.hasNext()) // cycle through fields
            {
                if (!tsmcoli.hasNext()) // cycle through columns
                {
                    var tsmcoli = tsm.getColumns().iterator();
                    tempArray.push(tempObject); // end of record
                    var tempObject = new Array(); // clear the temp obj
                    numrows++;
                }
                var tcol = tsmcoli.next();
                var tval = tsmfldi.next();

                var readOnly = 'N';
                if (readOnlyi.hasNext()) {
                    readOnly = readOnlyi.next();
                }

                var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval ? tval : "", readOnly);
                tempObject[tcol.getColumnName()] = fieldInfo;
                //tempObject[tcol.getColumnName()] = tval;
            }

            tempArray.push(tempObject); // end of record
        }

        addASITable(tn, tempArray, pToCapId);
        logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
    }
}
function sendAppToACA4Edit() {
    // Send to ACA user for EDIT.
    var vCapID = capId;
    if (arguments.length > 0) vCapID = arguments[0];
    var vCap = aa.cap.getCap(vCapID).getOutput().getCapModel();
    vCap.setCapClass("EDITABLE");
    aa.cap.editCapByPK(vCap);
}
// END FUNCTION NAME: sendAppToACA4Edit
function revokeAppACAEdit() {
    // Send to ACA user for EDIT.
    var vCapID = capId;
    if (arguments.length > 0) vCapID = arguments[0];
    var vCap = aa.cap.getCap(vCapID).getOutput().getCapModel();
    vCap.setCapClass("COMPLETE");
    aa.cap.editCapByPK(vCap);
}
function isActiveTask(taskName)
{
    var vCapID = capId;
    if (arguments.length > 1)
        vCapID = arguments[1];

    var vWFResult = aa.workflow.getTasks(vCapID);
    if (vWFResult.getSuccess())
    {
        var vWF = vWFResult.getOutput();
        for (var vCounter in vWF)
        {
            if ((vWF[vCounter].getTaskDescription() == taskName) && (vWF[vCounter].activeFlag == 'Y'))
                return true;
        }
    }
    return false;
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
function removeASITable(tableName) {
    var itemCap = capId;
    if (arguments.length > 1) {
        itemCap = arguments[1]
    }
    var tssmResult = aa.appSpecificTableScript.removeAppSpecificTableInfos(tableName, itemCap, currentUserID);
    if (!tssmResult.getSuccess()) {
        aa.print("**WARNING: error removing ASI table " + tableName + " " + tssmResult.getErrorMessage());
        return false
    } else {
        logDebug("Successfully removed all rows from ASI Table: " + tableName)
    }
}
