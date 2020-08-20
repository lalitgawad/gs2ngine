/**
 | Program : APP:AQM/INCIDENT/FACILITY/GENERAL
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
  APP:Enforcement/Incident/Facility/General
 * @param {string} identity - recordtype
 * @param {string} caller - code context
 */
function APP_OBJ(identity, caller) {
    gCaller = caller;

    this.ObjId = "APP:AQM/Incident/Facility/General";
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

    }

    this.activatePostPermitOnDocUpload = function(){

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
            var id = AInfo["License Number"];
            var vCapID = aa.cap.getCapID(id).getOutput();
            if(vCapID)
            {
                aa.cap.createAppHierarchy(capId, vCapID);
            }
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
        addApplicantToCap4ACA();
        demoSendIncidentSubmission();
        var id = AInfo["License Number"];
        var vCapID = aa.cap.getCapID(id).getOutput();
        if(vCapID)
        {
            aa.cap.createAppHierarchy(capId, vCapID);
        }
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
function addApplicantToCap4ACA() {
    puSeq = publicUserID.substring(10);
    var peopleResult = aa.people.getUserAssociatedContact(puSeq).getOutput().toArray();
    contactNum = peopleResult[0].getContactSeqNumber();

    getPerson = aa.people.getPeople(contactNum).getOutput();
    getPerson.setContactType("Applicant");

    addApplicant = aa.people.createCapContactWithRefPeopleModel(capId, getPerson);

}
