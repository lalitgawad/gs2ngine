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
        gs2.wf.activateTask(capId, "Corrective Review");
        gs2.common.closeWfTask(capId, "Corrective Review", "Additional Information Received", "Additional Information Received", "");
        aa.workflow.adjustTask(capId, "Corrective Review", "Y", "N", null, null);
        //editCapConditionStatus("Addtional Information Required","Additional Information Required","Condition Met","Not Applied");
    }

    this.activatePostPermitOnDocUpload = function(){
        try {
            var vDocumentModelArray = aa.env.getValue("DocumentModelList");
            var docupload = false;
            if (vDocumentModelArray.size() > 0) {
                for (var index = 0; index < vDocumentModelArray.size(); index++) {
                    var docName = String(vDocumentModelArray.get(index).getDocCategory());
                    if (matches(docName, "Construction Plan", "Floor Plan Existing", "Monument Engineered Plan", "Site Plan", "Traffic Plan", "Tree Preservation Plan")){
                        docupload = true;
                    }
                }
            }
            if (docupload) {
                if(isTaskActive("Permit Issued") && isTaskStatus("Permit Issued", "Issued")){
                    closeTask("Permit Issued", "Post Permit Review Required", "Closed via script", "Closed via script");
                    activateTask("Post Permit Completeness Review");
                    updateTask("Post Permit Completeness Review", "Under Review", "Updated by Script", "");
                    var vDaysDue = this.getDurationDays();;
                    var updatedDueDate = dateAdd(aa.date.getCurrentDate(), vDaysDue);
                    var calID = isBusinessCalAssociated("Post Permit Completeness Review", capId);
                    if (calID != -1) {
                        updatedDueDate = addBusinessDays(aa.date.getCurrentDate(), vDaysDue, calID);
                    }
                    editTaskDueDate("Post Permit Completeness Review", updatedDueDate);
                    //REVISIT
                    autoAssign("Post Permit Completeness Review", "COSA/DSD/BLD/PR/NA/ADMIN/NA");
                    aa.workflow.adjustTask(capId, "Closure", "N", "N", null, null);
                }
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred: DuaDelegator: " + err.message);
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
        if (!publicUser) {
        }
        if(publicUser){
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
        this.appSubmissionActions();

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
    this.AEADelegator = function () {
        gs2.wf.activateTask(capId, "Corrective Review");
        gs2.common.closeWfTask(capId, "Corrective Review", "Additional Information Received", "Additional Information Received", "");
        aa.workflow.adjustTask(capId, "Corrective Review", "Y", "N", null, null);
        revokeAppACAEdit();
    }
    /**
     * Workflow task update after Delegator to call local function(s) for record specific after logic
     */
    this.WtuaDelegator = function () {
        if(wfTask == "Correction Review" && wfStatus == "Implementation Complete")
        {
            this.resultNonCompliantInspection();
            var pCapId = getParent();
            gs2.wf.activateTask(pCapId, "Supervisory Review");
            aa.workflow.adjustTask(pCapId, "Supervisory Review", "Y", "N", null, null);
            copyASITable(capId, pCapId, "DIFICIENCY LISTING");
        }
        else if(wfTask == "Correction Review" && wfStatus == "Additional Information Required")
        {
            gs2.wf.deActivateWfTask(capId, "Correction Review");
            sendAppToACA4Edit();
            //gs2.rec.addStdConditionWithComments("Licensing", "Addtional Information Required", "Additional Information Required","Additional Information Required" , wfComment , null);
            //addSTDConditionX("Addtional Information Required", "Additional Information Required", capId);
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