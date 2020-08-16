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
        gs2.common.closeWfTask(capId, "Application Intake", "Intake Complete", "Intake Complete", "");
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

    }

    /**
     * CTRCA Async Delegator to call local function(s) for record specific after logic
     */
    this.CtrcaAsyncDelegator = function () {

    }

    /**
     * Workflow task update after Delegator to call local function(s) for record specific after logic
     */
    this.WtuaDelegator = function ()
    {
        if(wfTask == "Application Review" && wfStatus == "Application Approved - Inspection Needed")
        {
            gs2.insp.createPendingInspection("INSP_CI", "Compliance Inspection");
            //gs2.common.closeWfTask(capId, "Inspection", "Inspection Scheduled", "Compliance Inspection Scheduled", "");
            updateTask("Inspection","Inspection Scheduled", "Compliance Inspection Scheduled", "");
        }
        else if(wfTask == "Supervisory Review" && wfStatus == "Corrective Action issued")
        {
            var pocCapId = gs2.rec.createChild("Licenses","Plan of Correction","NA","NA");
            gs2.rec.updateAppStatus("In Progress","", pocCapId);
            editAppName("",pocCapId);
            var pocItemsArr = this.getPOCItems();
            addASITable("DIFICIENCY LISTING", pocItemsArr, pocCapId);
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
