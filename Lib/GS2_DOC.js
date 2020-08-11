gs2.doc = {};
(function () {

    function test() {
        gs2.log('GS2_DOC Looks good');
        return true;
    }

    /**
	 * ReqDoc_OBJ - Object for Document Validation
	 * @param {Array} docTypeArray - array of document type (multiples mean atlest once)
	 * @param {string} validationType - R: Always Required; C: Conditinal Required;
	 * @param {type} warningMessage - Custome Message to display
	 */
    function ReqDoc_OBJ(vdocTypeArray, vvalidationType, vwarningMessage) {
        this.docTypeArray = vdocTypeArray; //array
        this.validationType = vvalidationType;   //string: R or C
        this.warningMessage = vwarningMessage;   //string
    }

    /**
     * To check is valid number
     * @param {value type} inputValue - number value
     * @returns {boolean} - success
     */
    function getUploadedDocuments() {
        try {
            if (capId != null) {
                var vDocUpldUser = currentUserID;
                if (publicUser) {
                    vDocUpldUser = "ADMIN";
                }
                var vExistingDocs = aa.document.getCapDocumentList(capId, vDocUpldUser).getOutput();
                for (var vIndex in vExistingDocs) {
                    var vDocCategory = vExistingDocs[vIndex].getDocCategory();
                    vUploadedDocuments[vDocCategory] = true;
                }
            }
        }
        catch (vError) {
            logDebug("ERROR: Filling Uploaded Documents Array. " + vError.message);
        }
    }

    /**
     * Loads the documents from ASI in to an Array
     */
    function getUploadedDocumentsAtACASub() {
        try {
            if (capId != null) {
                var vDocUpldUser = currentUserID;
                if (publicUser) {
                    vDocUpldUser = "ADMIN";
                }
                var vDocList = getAppSpecific("UploadedDocTypes");
                var vExistingDocs = new Array();
                if (vDocList)
                    vExistingDocs = vDocList.split("~~");
                for (var vIndex in vExistingDocs) {
                    var vDocCategory = vExistingDocs[vIndex];
                    vUploadedDocuments[vDocCategory] = true;
                }
            }
        }
        catch (vError) {
            logDebug("ERROR: Executing getUploadedDocumentsAtACASub. " + vError.message);
        }
    }

    function appendDocumentDescription(ipDocInfo, ipAgencyList) {
        var vDesc = ipAgencyList;
        if (ipDocInfo.getDocDescription())
            vDesc = vDesc + String.fromCharCode(10) + ipDocInfo.getDocDescription();
        ipDocInfo.setDocDescription(vDesc);
        aa.document.updateDocument(ipDocInfo);
    }

    /**
     * to get Attached Document By Category
     * @param {string} category - document category
     * @param {object} capId - record id
     * @returns {Array}  - file list with full path
     * @Usage - 
     */
    function getAttachedDocumentByCategory(category, capId) {
        var fileList = [];
        var vDocs = aa.document.getDocumentListByEntity(capId, "CAP").getOutput().toArray();
        for (var x in vDocs) {
            var vDoc = vDocs[x];
            var vFileName = vDoc.getFileName();
            var vDocCat = vDoc.getDocCategory();

            if (vDocCat == category) {
                var fileHandle = aa.document.downloadFile2Disk(vDoc, vDoc.getModuleName(), "", "", true).getOutput();
                logDebug("fileHandle: " + fileHandle);
                fileList.push(fileHandle);
            }
        }
        return (fileList);
    }

    /**
     * Updates the habitat Version with the value provided
     * @param {Number} documentNbr
     * @returns {Document Model} docModel
     */
    function getDocumentModelByPk(documentNbr) {
        var docResult = aa.document.getDocumentByPK(documentNbr);
        if (docResult.getSuccess()) {
            var docModel = docResult.getOutput();
            return docModel;
        } else {
            logDebug(docResult.getErrorMessage());
        }

        return null;
    }


    /**
     * Gets the document template field value
     * @param {Document Model} docModel -
     * @param {template Group Name} groupName
     * @param {template Sub Group Name} subGroupName
     * @param {template Field Name} fieldName
     * @returns {Number} version- Filed Value
     */
    function getFieldValue(docModel, groupName, subGroupName, fieldName) {
        if (!docModel.getTemplate())
            return -1;

        var tmpforms = (docModel.getTemplate().getTemplateForms().toArray());
        for (var t in tmpforms) {
            //if(tmpforms[t].getGroupName() == "ASI_HABITAT"){
            if (tmpforms[t].getGroupName() == groupName) {
                var subgroups = tmpforms[t].getSubgroups().toArray();
                for (var s in subgroups) {
                    //if (subgroups[s].getSubgroupName() == "HABITAT_DOC_ATTR") {
                    if (subgroups[s].getSubgroupName() == subGroupName) {
                        var fields = subgroups[s].getFields().toArray();
                        for (var f in fields) {
                            var field = fields[f];
                            //if (field.getFieldName() == "Version"){
                            if (field.getFieldName() == fieldName) {
                                var version = field.getDefaultValue();
                                return (version) ? version : -1;
                            }
                        }
                    }
                }
            }
        }
    }

    function crupdDocConditions(ipDocCond, ipDocCondReason, ipStatus) {
        var vCapID = capId;
        if (arguments.length > 3 && arguments[3])
            vCapID = arguments[3];

        var vStatusType = "Applied";
        var vMultDocArr = ipDocCond;
        for (var vMultCount in vMultDocArr) {

            var vMultDoc = vMultDocArr[vMultCount];
            var vCondObj = gs2.rec.getCapConditionsByGroupType("Conditional Documents", "Conditional Documents", vMultDoc, null, vCapID);
            if (vCondObj) {
                vCondObj.setConditionStatus(ipStatus);
                vCondObj.setConditionStatusType(vStatusType);

                if (ipDocCondReason != null && ipDocCondReason != '') {
                    vCondObj.setConditionComment(ipDocCondReason);
                }

                aa.capCondition.editCapCondition(vCondObj);
            }
            else {
                /**
                * JIRA-7937: Remove code specific implementation and update the addStdConditionWithComments in INCLUDES_CUSTOM
                */
                gs2.rec.addStdConditionWithComments("Conditional Documents", "Conditional Documents", vMultDoc, ipDocCondReason, null, null);
            }
        }
    }

    function saveUploadedDocTypeList4CTRCA() {
        var vDocEntityType = "TMP_CAP";
        cap = aa.cap.getCap(capId).getOutput();
        if (cap.isCompleteCap())
            vDocEntityType = "CAP";
        var vDocList = aa.document.getDocumentListByEntity(capId, vDocEntityType).getOutput();
        var vDocArray = new Array();
        var vUploadedDocs = "";
        if (vDocList) {
            vDocArray = vDocList.toArray();
            for (var vCounter1 in vDocArray) {
                var vDoc = vDocArray[vCounter1];
                if (vUploadedDocs == "")
                    vUploadedDocs = vDoc.getDocCategory();
                else
                    vUploadedDocs = vUploadedDocs + "~~" + vDoc.getDocCategory();
            }
        }
        editAppSpecific("UploadedDocTypes", vUploadedDocs);
    }

    function updateReqDocs4CTRCA() {
        //doScriptActions("REQDOC");
        var vDocConditions = new Array();
        if (appObj) {
            vDocConditions = appObj.GetAppDocumentRequirement();
        }
        if (vDocConditions.length > 0) {
            var vDocList = getAppSpecific("UploadedDocTypes");
            var vDocArray = new Array();
            if (vDocList)
                vDocArray = vDocList.split("~~");
            for (var vCounter1 in vDocConditions) {
                var vStatus = "Not Uploaded";
                var vDocCondObj = vDocConditions[vCounter1];
                var vDocReqFlag = vDocCondObj.validationType;
                var vMultDocArr = vDocCondObj.docTypeArray;
                var vDocCondReason = vDocCondObj.warningMessage;

                for (var vMultCount in vMultDocArr) {
                    var vMultDoc = vMultDocArr[vMultCount];
                    for (var vCounter2 in vDocArray) {
                        var vDoc = vDocArray[vCounter2];
                        if (vDoc == vMultDoc) {
                            vStatus = "Uploaded";
                            break;
                        }
                    }
                }
                if (vStatus == "Not Uploaded") {
                    crupdDocConditions(vDocCondObj.docTypeArray, vDocCondReason, "Applied");
                }
            }
        }
    }

    function checkAlternativeDocExistsACA() {
        var capResult = aa.cap.getCap(capId);
        var cap = capResult.getOutput();
        var appTypeResult = cap.getCapType();
        var appTypeString = appTypeResult.toString();

        var vDocConditions = new Array();
        if (appObj) {
            vDocConditions = appObj.GetAppDocumentRequirement();
        }
        if (vDocConditions.length > 0) {
            var vDocEntityType = "TMP_CAP";
            cap = aa.cap.getCap(capId).getOutput();
            if (cap.isCompleteCap())
                vDocEntityType = "CAP";
            var vDocList = aa.document.getDocumentListByEntity(capId, vDocEntityType).getOutput();
            var vDocArray = new Array();
            if (vDocList)
                vDocArray = vDocList.toArray();
            for (var vCounter1 in vDocConditions) {
                var vDocCondObj = vDocConditions[vCounter1];
                var vMultDocArr = vDocCondObj.docTypeArray;
                var vDocCondReason = vDocCondObj.warningMessage;
                var eitherDocFound = false;
                var vShowMultDoc = "";

                if (vMultDocArr.length > 1) {
                    for (var vMultCount in vMultDocArr) {
                        var vMultDoc = vMultDocArr[vMultCount];
                        for (var vCounter2 in vDocArray) {
                            var vDoc = vDocArray[vCounter2];
                            if (vDoc.getDocCategory() == vMultDoc) {
                                eitherDocFound = true;
                                break;
                            }
                        }
                        if (vMultCount == 0)
                            vShowMultDoc = vMultDoc;
                        else
                            vShowMultDoc = vShowMultDoc + "' OR '" + vMultDoc;
                    }

                    if (!eitherDocFound) {
                        gs2.common.convertACAErrorToMessage();
                        comment("<b>Following document(s) need to be uploaded:</b>");
                    }
                    var vMessage = "'" + vShowMultDoc + "'";
                    if (vDocCondReason != "")
                        vMessage = vMessage + " " + vDocCondReason;
                    comment(vMessage);
                }
            }
        }
    }

    function validateAlternativeDocExistsAA(appTypeString) {
        try {
            eval(getScriptText("APP:" + appTypeString));
            appObj = new APP_OBJ(appTypeString, "SCRIPT");
            logDebug("APP_OBJ " + appObj);

            var vDocList = [];

            var documentModelArray = aa.env.getValue("DocumentModelList");
            var docModel = documentModelArray.toArray();
            for (var x in docModel) {
                var docInfo = docModel[x];
                vDocList.push(docInfo.getDocCategory());
            }

            var vDocConditions = new Array();
            if (appObj) {
                vDocConditions = appObj.GetAppDocumentRequirement();
            }
            if (vDocConditions.length > 0) {
                for (var vCounter1 in vDocConditions) {
                    var vDocCondObj = vDocConditions[vCounter1];
                    var vMultDocArr = vDocCondObj.docTypeArray;
                    var vDocCondReason = vDocCondObj.warningMessage;
                    var eitherDocFound = false;
                    var vShowMultDoc = "";

                    if (vMultDocArr.length > 0) {
                        for (var vMultCount in vMultDocArr) {
                            var vMultDoc = vMultDocArr[vMultCount];
                            for (var vCounter2 in vDocList) {
                                var vDoc = vDocList[vCounter2];
                                if (vDoc == vMultDoc) {
                                    eitherDocFound = true;
                                    break;
                                }
                            }
                            if (vMultCount == 0)
                                vShowMultDoc = vMultDoc;
                            else
                                vShowMultDoc = vShowMultDoc + "' OR '" + vMultDoc;
                        }
                        var vMessage = "'" + vShowMultDoc + "'";

                        if (!eitherDocFound) {
                            cancel = true;
                            showMessage = true;
                            comment("Following documents need to be uploaded:");
                            comment(vMessage);
                        }
                    }
                }
            }
        }
        catch (err) {
            logDebug("Warning: A JavaScript Error occurred: validateAlternativeDocExistsAA(): " + err.message);
        }
    }
    function calcReqDocs(ipShowCheckUpdate) {
        //doScriptActions("REQDOC");
        var vDocConditions = new Array();
        if (appObj) {
            vDocConditions = appObj.GetAppDocumentRequirement();
        }

        if (vDocConditions.length > 0) {
            var vDocEntityType = "TMP_CAP";
            cap = aa.cap.getCap(capId).getOutput();
            if (cap.isCompleteCap())
                vDocEntityType = "CAP";
            var vDocList = aa.document.getDocumentListByEntity(capId, vDocEntityType).getOutput();
            var vDocArray = new Array();
            if (vDocList)
                vDocArray = vDocList.toArray();
            for (var vCounter1 in vDocConditions) {
                var vStatus = "Not Uploaded";
                var vDocCondObj = vDocConditions[vCounter1];
                var vDocReqFlag = vDocCondObj.validationType;
                if (vDocReqFlag == "C")
                    continue;

                var vMultDocArr = vDocCondObj.docTypeArray;
                var vDocCondReason = vDocCondObj.warningMessage;

                var vShowMultDoc = "";
                for (var vMultCount in vMultDocArr) {
                    var vMultDoc = vMultDocArr[vMultCount];
                    for (var vCounter2 in vDocArray) {
                        var vDoc = vDocArray[vCounter2];
                        if (vDoc.getDocCategory() == vMultDoc) {
                            vStatus = "Uploaded";
                            break;
                        }
                    }
                    if (vMultCount == 0)
                        vShowMultDoc = vMultDoc;
                    else
                        vShowMultDoc = vShowMultDoc + "' OR '" + vMultDoc;
                }
                if (vStatus == "Not Uploaded") {
                    if (ipShowCheckUpdate == "Update")
                        crupdDocConditions(vDocCondObj.docTypeArray, vDocCondReason, "Applied");
                    else {
                        if (cancel == false) {
                            showMessage = true;
                            cancel = true;
                            if (ipShowCheckUpdate == "Show")
                                gs2.common.convertACAErrorToMessage();
                            comment("<b>Following documents need to be uploaded:</b>");
                        }
                        var vMessage = "'" + vShowMultDoc + "'";
                        if (vDocCondReason != "")
                            vMessage = vMessage + " " + "<br>" + vDocCondReason;
                        comment(vMessage);
                    }
                }
            }
            var v1stCondDoc = true;
            for (var vCounter1 in vDocConditions) {
                var vStatus = "Not Uploaded";
                var vDocCondObj = vDocConditions[vCounter1];
                var vDocReqFlag = vDocCondObj.validationType;
                if (vDocReqFlag == "R")
                    continue;
                var vMultDocArr = vDocCondObj.docTypeArray;
                var vDocCondReason = vDocCondObj.warningMessage;
                var vShowMultDoc = "";
                for (var vMultCount in vMultDocArr) {
                    var vMultDoc = vMultDocArr[vMultCount];
                    for (var vCounter2 in vDocArray) {
                        var vDoc = vDocArray[vCounter2];
                        if (vDoc.getDocCategory() == vMultDoc) {
                            vStatus = "Uploaded";
                            break;
                        }
                    }
                    if (vMultCount == 0)
                        vShowMultDoc = vMultDoc;
                    else
                        vShowMultDoc = vShowMultDoc + "' OR '" + vMultDoc;
                }
                if (vStatus == "Not Uploaded") {
                    if (ipShowCheckUpdate == "Check")
                        continue;
                    if (ipShowCheckUpdate == "Update")
                        crupdDocConditions(vDocCondObj.docTypeArray, vDocCondReason, "Applied");
                    else {
                        if (v1stCondDoc) {
                            showMessage = true;
                            cancel = true;
                            v1stCondDoc = false;
                            if (ipShowCheckUpdate == "Show")
                                gs2.common.convertACAErrorToMessage();
                            comment("<b>The following documents are required but can be provided after submission:</b>");
                        }
                        var vMessage = "'" + vShowMultDoc + "'";
                        if (vDocCondReason != "")
                            vMessage = vMessage + " " + vDocCondReason;
                        comment(vMessage);
                    }
                }
            }
        }
    }


    gs2.doc.test = test;
    gs2.doc.ReqDoc_OBJ = ReqDoc_OBJ;
    gs2.doc.getUploadedDocuments = getUploadedDocuments;
    gs2.doc.getUploadedDocumentsAtACASub = getUploadedDocumentsAtACASub;
    gs2.doc.appendDocumentDescription = appendDocumentDescription;
    gs2.doc.getAttachedDocumentByCategory = getAttachedDocumentByCategory;
    gs2.doc.getDocumentModelByPk = getDocumentModelByPk;
    gs2.doc.getFieldValue = getFieldValue;
    gs2.doc.crupdDocConditions = crupdDocConditions;
    gs2.doc.saveUploadedDocTypeList4CTRCA = saveUploadedDocTypeList4CTRCA;
    gs2.doc.updateReqDocs4CTRCA = updateReqDocs4CTRCA;
    gs2.doc.checkAlternativeDocExistsACA = checkAlternativeDocExistsACA;
    gs2.doc.validateAlternativeDocExistsAA = validateAlternativeDocExistsAA;
    gs2.doc.calcReqDocs = calcReqDocs;

})();


