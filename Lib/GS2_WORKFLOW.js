gs2.wf = {};
(function () {

    function test() {
        gs2.log('GS2_WORKFLOW Looks good');
        return true;
    }

    /**
     * Add AdHoc Task
     * @param {type} adHocProcess
     * @param {type} adHocTask
     * @param {type} adHocNote
     * @param {string} thisUser - Optional user
     * @param {thisCap} thisCap - Optional Reord Cap
     * @returns {type}
     */
    function addAdHocTask(adHocProcess, adHocTask, adHocNote) {
        //adHocProcess must be same as one defined in R1SERVER_CONSTANT
        //adHocTask must be same as Task Name defined in AdHoc Process
        //adHocNote can be variable
        //Optional 4 parameters = Assigned to User ID must match an AA user
        //Optional 5 parameters = CapID
        var thisCap = capId;
        var thisUser = currentUserID;
        if (arguments.length > 3)
            thisUser = arguments[3]
        if (arguments.length > 4)
            thisCap = arguments[4];
        var userObj = aa.person.getUser(thisUser);
        if (!userObj.getSuccess()) {
            logDebug("Could not find user to assign to");
            return false;
        }
        var taskObj = aa.workflow.getTasks(thisCap).getOutput()[0].getTaskItem()
        taskObj.setProcessCode(adHocProcess);
        taskObj.setTaskDescription(adHocTask);
        taskObj.setDispositionNote(adHocNote);
        taskObj.setProcessID(0);
        taskObj.setAssignmentDate(aa.util.now());
        taskObj.setDueDate(aa.util.now());
        taskObj.setAssignedUser(userObj.getOutput());
        wf = aa.proxyInvoker.newInstance("com.accela.aa.workflow.workflow.WorkflowBusiness").getOutput();
        wf.createAdHocTaskItem(taskObj);
        return true;
    }

    /**
     * to check user can proceed with task
     * validates defined security policy by department
     * @param {string} ipTask - Task Name
     * @returns {boolean} - Success
     * @param {object} vCapID - Optinal Record Cap
     * @param {string} vUserID - Optinal user id
     */
    function isTaskAllowed(ipTask) {
        var vCapID = null;
        if (typeof (capId) != "undefined")
            vCapID = capId;
        if (arguments.length > 1 && arguments[1])
            vCapID = arguments[1];
        var vUserID = null;
        if (typeof (currentUserID) != "undefined")
            vUserID = currentUserID;
        if (arguments.length > 2 && arguments[2])
            vUserID = arguments[2];
        var vTaskDept = getTaskDept(ipTask, vCapID);
        if (vTaskDept == false)
            return false;
        if (vTaskDept == null) //No Assigned Staff Depart ment or Staff User 
            return false;
        var vUserDept = gs2.user.getUserDept(vUserID);
        if (vUserDept == false)
            return false;
        var vTaskAgency = vTaskDept.split("/")[1];
        var vUserAgency = vUserDept.split("/")[1];
        if (vTaskAgency == vUserAgency)
            return true;
        else
            return false;
    }

    /**
     * To get Task Department
     * @param {string} ipTask - Task Name
     * @returns {string} - Department
     * @param {object} vCapID - Optinal Record Cap
      */
    function getTaskDept(ipTask) {
        var vCapID = null;
        if (typeof (capId) != "undefined")
            vCapID = capId;
        if (arguments.length > 1 && arguments[1])
            vCapID = arguments[1];
        var vTaskObjArr = aa.workflow.getTasks(vCapID, ipTask).getOutput();
        if (vTaskObjArr == null || vTaskObjArr.length == 0)
            return false;
        var vTaskObj = vTaskObjArr[0];
        var vAssignedStaff = vTaskObj.getAssignedStaff();
        if (vAssignedStaff == null)
            return null;

        //return vAssignedStaff.getDeptOfUser();
        if (vAssignedStaff.getFullName() && vAssignedStaff.getFullName() != "" && vAssignedStaff.getDeptOfUser() && vAssignedStaff.getDeptOfUser() != "") {
            return vAssignedStaff.getDeptOfUser();
        }
        return null;
    }

    function activateTask(wfstr) {
        var useProcess = false;
        var processName = "";
        if (arguments.length == 2 && arguments[1] && arguments[1] != "") {
            processName = arguments[1];
            useProcess = true;
        }
        var vCapId = capId;
        if (arguments.length == 3 && arguments[2]) {
            vCapId = arguments[2];
        }
        var workflowResult = aa.workflow.getTaskItems(vCapId, wfstr, processName, null, null, null);
        if (workflowResult.getSuccess()) {
            var wfObj = workflowResult.getOutput()
        } else {
            logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
            return false
        }
        var vProcess = processName;
        for (i in wfObj) {
            var fTask = wfObj[i];
            if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
                var stepnumber = fTask.getStepNumber();
                var processID = fTask.getProcessID();
                if (useProcess) {
                    aa.workflow.adjustTask(vCapId, stepnumber, processID, "Y", "N", null, null)
                } else {
                    aa.workflow.adjustTask(vCapId, stepnumber, "Y", "N", null, null)
                }
                logMessage("Activating Workflow Task: " + wfstr);
                logDebug("Activating Workflow Task: " + wfstr)
                if (vProcess == "")
                    vProcess == fTask.getProcessCode();
            }
        }
        var workflowStausList = aa.workflow.getTaskStatusList(vCapId, vProcess, wfstr).getOutput();
        if (exists("Under Review", workflowStausList))
            updateTask(wfstr, "Under Review", "Default Status", "Assigned by System", vProcess, vCapId);
    }

    function taskActivateAndAutoAssign(ipTask, ipDept, ipDays, ipForce) {
        try {
            activateTask(ipTask);
            autoAssign(ipTask, ipDept);
            setWFDueDateByDaysByCalendarType(ipTask, ipDays, capId, ipForce);
        } catch (ex) {
            logDebug(" Error in isCityOwner : " + ex.message);
            return false;
        }
    }

    function setDueDate(vWTask, vCapId) {
        try {
            var taskResult = aa.workflow.getTask(vCapId, vWTask);
            if (taskResult.getSuccess()) {
                var fTask = taskResult.getOutput();
                var vDaysDue = 0;
                if (arguments.length > 2 && arguments[2] != null && arguments[2] != "") {
                    vDaysDue = parseInt(arguments[2]);
                }
                if (vDaysDue == 0)
                    vDaysDue = parseInt(fTask.getDaysDue());

                var calID = gs2.util.isBusinessCalAssociated(vWTask, vCapId);
                var updatedDueDate = null;
                if (calID != -1)
                    updatedDueDate = gs2.util.addBusinessDays(aa.date.getCurrentDate(), vDaysDue, calID);
                else
                    updatedDueDate = dateAdd(aa.date.getCurrentDate(), vDaysDue);

                editTaskDueDateCustom(vWTask, updatedDueDate, vCapId);
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred: : " + err.message);
        }
    }

    function activeTasksCheck() {
        var vCapID = capId;
        if (arguments.length > 0 && arguments[0])
            vCapID = arguments[0];
        var workflowResult = aa.workflow.getTasks(vCapID);
        if (workflowResult.getSuccess()) {
            wfObj = workflowResult.getOutput()
        } else {
            logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
            return false
        }
        for (i in wfObj) {
            fTask = wfObj[i];
            if (fTask.getActiveFlag().equals("Y")) {
                return true
            }
        }
        return false
    }


    //Copied from INCLUDES_ACCELA_FUNCTIONS and customized.
    function branchTask(wfstr, wfstat, wfcomment, wfnote) {
        var useProcess = false;
        var processName = "";
        if (arguments.length > 4 && arguments[4] != "" && arguments[4] != null) {
            processName = arguments[4];
            useProcess = true
        }
        var itemCap = capId;
        if (arguments.length > 5 && arguments[5] != null) {
            itemCap = arguments[5];
        }
        var workflowResult = aa.workflow.getTaskItems(itemCap, wfstr, processName, null, null, null);
        if (workflowResult.getSuccess()) {
            var wfObj = workflowResult.getOutput()
        } else {
            logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
            return false
        }
        if (!wfstat) {
            wfstat = "NA"
        }
        for (i in wfObj) {
            var fTask = wfObj[i];
            if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
                var dispositionDate = aa.date.getCurrentDate();
                var stepnumber = fTask.getStepNumber();
                var processID = fTask.getProcessID();
                if (useProcess) {
                    aa.workflow.handleDisposition(itemCap, stepnumber, processID, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "B")
                } else {
                    aa.workflow.handleDisposition(itemCap, stepnumber, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "B")
                }
                logMessage("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Branching...");
                logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Branching...")
            }
        }
    }


    /**
     * to Deactivate Active Tasks ForParent (Moved as from Accela Dev)
     * @param {string} processName - Workflow group code
     */
    function deactivateActiveTasksForParent(processName) {

        var parentRecord = getParent();
        var parentRecordObject = aa.cap.getCap(parentRecord).getOutput();
        var workflowResult = aa.workflow.getTasks(parentRecordObject);
        if (workflowResult.getSuccess())
            wfObj = workflowResult.getOutput();
        else
        { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

        for (i in wfObj) {
            fTask = wfObj[i];
            if (fTask.getProcessCode().equals(processName) || processName == null)
                if (fTask.getActiveFlag().equals("Y"))
                    deactivateTask(fTask.getTaskDescription());
        }

    }

    function checkIfAnyTaskActive(wfArr) {
        wf = aa.workflow.getTaskItemByCapID(capId, null).getOutput();
        for (var x in wf) {
            fTask = wf[x];
            taskName = fTask.getTaskDescription();
            if (fTask.getActiveFlag() == "Y") {
                for (var y in wfArr) {
                    if (wfArr[y] == taskName)
                        return true;
                }
            }
        }
    }

    function assignWfTask(wfstr, username, vCapId) {
        var processName = "";

        var taskUserResult = aa.person.getUser(username);
        if (taskUserResult.getSuccess()) {
            taskUserObj = taskUserResult.getOutput()
        } else {
            logMessage("**ERROR: Failed to get user object: " + taskUserResult.getErrorMessage());
            return false
        }
        var workflowResult = aa.workflow.getTaskItems(vCapId, wfstr, processName, null, null, null);
        if (workflowResult.getSuccess()) {
            var wfObj = workflowResult.getOutput()
        } else {
            logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
            return false
        }
        for (i in wfObj) {
            var fTask = wfObj[i];
            if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())) {
                fTask.setAssignedUser(taskUserObj);
                var taskItem = fTask.getTaskItem();
                var adjustResult = aa.workflow.assignTask(taskItem);
                logMessage("Assigned Workflow Task: " + wfstr + " to " + username);
                logDebug("Assigned Workflow Task: " + wfstr + " to " + username)
            }
        }
    }

    /**
     * Performs Work Flow update actions on Payment
     */
    function updateReqDocList() {
        /*Added below code to clear the deficiency based on the document upload and to change the status of the tasks if all the documents are received*/
        try {
            var workflowResult = aa.workflow.getTasks(capId);
            if (workflowResult.getSuccess()) {
                var wfObj = workflowResult.getOutput();
                var documentModelArray = aa.env.getValue("DocumentModelList");
                var docModel = documentModelArray.toArray();
                for (i in docModel) {
                    var docName = docModel[i].getDocCategory();
                    if (!matches(docName, "Other", "Other Supporting Documentation", "Other Supporting Documents", "Response Letter"))
                        updateReqDocStatusOnUpload(wfObj, docName, capId);
                }
                for (i in wfObj) {
                    var vWfTask = wfObj[i];
                    var tsiOther = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId, vWfTask.getProcessID(), vWfTask.getStepNumber(), 'Other');
                    if (tsiOther.getSuccess()) {
                        if (tsiOther.getOutput() != null && matches(tsiOther.getOutput().getChecklistComment(), 'CHECKED')) {
                            editTaskSpecific(vWfTask.getTaskDescription(), "Other", null, capId);
                        }
                    }
                }
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred:  DUA:LandDevelopment/*/*/*: ID #4: " + err.message);
        }
    }

    /**
     * deactivates Task for Given Wf Task name and CapId
     * @param {vCapId} capId
     * @param {wfstr} WorkFlowName
     * @param {wfstat} WorkFlow status
     * @param {wfcomment} WorkFlow Comment
     * @param {wfnote} WorkFlow Note
     */
    function closeWfTask(vCapId, wfstr, wfstat, wfcomment, wfnote) {
        try {
            var useProcess = false;
            var processName = "";
            if (arguments.length == 6) {
                processName = arguments[5];
                useProcess = true
            }
            var workflowResult = aa.workflow.getTaskItems(vCapId, wfstr, processName, null, null, null);
            if (workflowResult.getSuccess()) {
                var wfObj = workflowResult.getOutput()
            } else {
                logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
                return false
            }
            if (!wfstat) {
                wfstat = "NA"
            }
            for (i in wfObj) {
                var fTask = wfObj[i];
                if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
                    var dispositionDate = aa.date.getCurrentDate();
                    var stepnumber = fTask.getStepNumber();
                    var processID = fTask.getProcessID();
                    if (useProcess) {
                        aa.workflow.handleDisposition(vCapId, stepnumber, processID, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "Y")
                    } else {
                        aa.workflow.handleDisposition(vCapId, stepnumber, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "Y")
                    }
                    logMessage("Closing Workflow Task: " + wfstr + " with status " + wfstat);
                    logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat)
                }
            }
        }
        catch (err) {
            logDebug("A JavaScript Error occurred: deActivateWfTask: " + err.message);
        }
    }

    /**
     * deactivates Task for Given Wf Task name and CapId
     * @param {capId} capId
     * @returns {String} wf Task Name
     */
    function deActivateWfTask(vCapID, vWfstr) {
        try {
            var taskResult = aa.workflow.getTask(vCapID, vWfstr);
            if (taskResult.getSuccess()) {
                var fTask = taskResult.getOutput();
                var stepnumber = fTask.getStepNumber();
                var completeFlag = fTask.getCompleteFlag();
                aa.workflow.adjustTask(vCapID, stepnumber, "N", completeFlag, null, null)
                logDebug("deactivating Workflow Task: " + vWfstr)
            }
        }
        catch (err) {
            logDebug("A JavaScript Error occurred: deActivateWfTask: " + err.message);
        }
    }

    function setWFDueDateByDaysByCalendarType(ipTask, ipDays) {
        try {
            var vCapID = capId;
            if (arguments.length > 2 && arguments[2])
                vCapID = arguments[2];
            var vForceCalendarDays = false;
            if (arguments.length > 3 && arguments[3])
                vForceCalendarDays = arguments[3];
            var vCalID = -1;
            if (!vForceCalendarDays)
                var vCalID = gs2.util.isBusinessCalAssociated(ipTask, vCapID);
            var vUpdatedDueDate = null;
            if (vCalID == -1)
                vUpdatedDueDate = dateAdd(aa.date.getCurrentDate(), ipDays);
            else
                vUpdatedDueDate = gs2.util.addBusinessDays(aa.date.getCurrentDate(), ipDays, vCalID);
            editTaskDueDateCustom(ipTask, vUpdatedDueDate, vCapID);
        } catch (err) {
            logDebug("A JavaScript Error occurred: : " + err.message);
        }
    }

    /**
    * Updates Due date on upon updating Wf status with Additional Information received
    * @param {vWfTask} Wf Task name
    * @param {vCapId} capId of the record
    */
    function updateDueDateOnWfUpdate(vWTask, vCapId) {
        try {
            var taskResult = aa.workflow.getTask(vCapId, vWTask);
            if (taskResult.getSuccess()) {
                var fTask = taskResult.getOutput();
                var vDaysDue = 0;
                if (capId.customID == vCapId.customID && appObj && typeof appObj.getDurationDays != "undefined" && appObj.getDurationDays != null) {
                    vDaysDue = appObj.getDurationDays(String(fTask.getTaskDescription()));
                }
                if (vDaysDue == 0)
                    vDaysDue = parseInt(fTask.getDaysDue());

                if (vDaysDue > 5)
                    vDaysDue = parseInt((vDaysDue + 1) / 2);
                var vForce = false;
                if (capId.customID == vCapId.customID && appObj && typeof appObj.getForceCalendarDays != "undefined" && appObj.getForceCalendarDays != null) {
                    vForce = appObj.getForceCalendarDays(String(fTask.getTaskDescription()));
                }
                setWFDueDateByDaysByCalendarType(vWTask, vDaysDue, vCapId, vForce);
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred: : " + err.message);
        }
    }

    /**
     * Performs Work Flow update actions on Document Upload
     */
    function updateWfOnDocUplaod() {
        try {
            var workflowResult = aa.workflow.getTasks(capId);
            if (workflowResult.getSuccess()) {
                var wfObj = workflowResult.getOutput();

                for (i in wfObj) {
                    var vWfTask = wfObj[i];
                    var tsiOther = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId, vWfTask.getProcessID(), vWfTask.getStepNumber(), 'Other');
                    if (tsiOther.getSuccess()) {
                        if (tsiOther.getOutput() != null && matches(tsiOther.getOutput().getChecklistComment(), 'CHECKED')) {
                            editTaskSpecific(vWfTask.getTaskDescription(), "Other", null, capId);
                        }
                    }
                    if (matches(vWfTask.getDisposition(), 'Additional Information Required')) {
                        var tsiNoPayment = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId, vWfTask.getProcessID(), vWfTask.getStepNumber(), 'No payment')

                        if (!matches(tsiNoPayment.getOutput().getChecklistComment(), 'CHECKED')) {
                            updateTask(vWfTask.getTaskDescription(), 'Additional Information Received', 'Updated by Script', '');
                            updateDueDateOnWfUpdate(vWfTask.getTaskDescription(), capId);
                        }
                    }
                }
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred:  DUA:LandDevelopment/*/*/*: ID #4: " + err.message);
        }
    }

    /**
     * Performs Work Flow update actions on Payment
     */
    function updateWfOnPayment() {

        try {
            // Get the entire workflow (we are going to parse it)
            var check = aa.workflow.getTasks(capId).getOutput();
            for (y in check) {
                checkWFTask = check[y].getTaskDescription();
                checkWFTaskStat = check[y].getDisposition();
                checkWFTaskProcID = check[y].getProcessID();
                checkWFTaskStep = check[y].getStepNumber();
                aa.print(checkWFTask + ":" + checkWFTaskStat);
                // Now to parse the "No Payment" TSI
                //----------------------------------
                var noPayment = null;
                tsi2 = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId, checkWFTaskProcID, checkWFTaskStep, 'No payment');
                var checkFlag = true;
                var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(capId, checkWFTaskProcID, checkWFTaskStep);
                logDebug("tsiresult" + TSIResult);
                if (tsi2.getSuccess()) {
                    tsi2 = tsi2.getOutput();
                    try {
                        noPayment = tsi2.getChecklistComment();
                    }
                    catch (err) {
                        logDebug("A JavaScript Error occurred: : " + err.message);
                    }
                }
                //aa.print(checkWFTask+":"+checkWFTaskStat+":"+noPayment);
                if ((checkWFTaskStat == 'Additional Info Required' || checkWFTaskStat == 'Additional Information Required')
                    // Also check the value of the TSI on the workflow step.
                    && noPayment == 'CHECKED') {

                    logDebug("Changing the wfTask " + checkWFTask + " and unset the 'No Payment'");

                    // Edit the TSI info Field "No Payment" to "UNCHECKED"
                    editTaskSpecific(checkWFTask, "No payment", null);

                    //Update the Workflow step to "Additional Info Received" only if no payment is checked - JIRA 8375
                    if (TSIResult.getSuccess()) {
                        var TSI = TSIResult.getOutput();
                        for (a1 in TSI) {
                            if (TSI[a1].getCheckboxDesc() != "No payment") {
                                var commentValue = TSI[a1].getChecklistComment();
                                if (commentValue == 'CHECKED') {
                                    logDebug("TSI[a1]" + TSI[a1].getCheckboxDesc());
                                    checkFlag = false;
                                }
                            }
                        }

                        if (checkFlag) {
                            // Update the Workflow step to "Additional Info Received"
                            updateTask(checkWFTask, "Additional Information Received", "Payment Received", "Payment Received");
                            updateDueDateOnWfUpdate(checkWFTask, capId);
                        }
                    }
                }
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred: : " + err.message);
        }
    }

    function getAssignedStaffUserIDByTaskName(ipTask) {
        try {
            var vTaskobj = aa.workflow.getTask(capId, ipTask).getOutput();
            var userid = getWFAssignedStaffUserID(vTaskobj);
            logDebug("getAssignedStaffUserIDByTaskName : fTask = " + vTaskobj + " userid = " + userid);
            return (userid);
        }
        catch (vError) {
            logDebug("getAssignedStaffUserIDByTaskName:  Failed. Error: " + vError.message);
        }
    }

    function autoAssignTaskFromSameUser(ipToTask, ipFromTask) {
        try {
            var vUser = getAssignedStaffUserIDByTaskName(ipFromTask);
            if (vUser)
                assignTask(ipToTask, vUser);
        }
        catch (vError) {
            logDebug("autoAssignTaskFromSameUser:  Failed. Error: " + vError.message);
        }
    }

    //TODO-PRIYA - CONFIG Inject
    //eval(getScriptText("ADDWFMATRIX2"));
    function getWFTaskMatrixInfo(ipRecType, ipFieldNameArray, ipFieldValueArray) {
        try {
            if (ipRecType == null || ipRecType == "")
                return false;
            ipRecType = ipRecType.toUpperCase();
            if (ipFieldNameArray == null || ipFieldNameArray.length == 0 || ipFieldValueArray == null || ipFieldValueArray.length == 0 || ipFieldNameArray.length != ipFieldValueArray.length)
                return false;

            var opWFTasksMatrix = new Array();
            var vWFTasksMatrix = vRecTypeWFTasksMatrix[ipRecType];
            for (var vCounter1 in vWFTasksMatrix) {
                var vWFTaskMatrixRow = vWFTasksMatrix[vCounter1];
                var vMatched = true;
                for (var vCounter2 in ipFieldNameArray) {
                    var vFieldName = ipFieldNameArray[vCounter2];
                    var vFieldValue = ipFieldValueArray[vCounter2];
                    if (vWFTaskMatrixRow[vFieldName] != vFieldValue) {
                        vMatched = false;
                        break;
                    }
                }
                if (vMatched)
                    opWFTasksMatrix.push(vWFTaskMatrixRow);
            }
            return opWFTasksMatrix;
        }
        catch (vError) {
            logDebug("getWFTaskMatrixInfo:  Failed. Error: " + vError.message);
        }
    }

    function getWFAssignedStaffUserID(fTask) {
        try {
            var caseMgr = fTask.getAssignedStaff().getFirstName() + " " + fTask.getAssignedStaff().getLastName();
            var applicUserId = aa.person.getUser(fTask.getAssignedStaff().getFirstName(), fTask.getAssignedStaff().getMiddleName(), fTask.getAssignedStaff().getLastName()).getOutput();
            var userid = applicUserId.getUserID();
            logDebug("getWFAssignedStaffUserID : fTask = " + fTask + " userid = " + userid);
            return (userid);
        }
        catch (vError) {
            logDebug("getWFAssignedStaffUserID:  Failed. Error: " + vError.message);
        }
    }

    function CheckDeficiencyDataFields() {
        var thisArr = new Array();
        loadTaskSpecific(thisArr);

        var WFT_Invalidaddress = "WFADHOC_PROCESS." + wfTask + ".Invalid address";
        var WFT_InvalidLegalDescription = "WFADHOC_PROCESS." + wfTask + ".Invalid Legal Description";
        var WFT_RequestedDocuments = "WFADHOC_PROCESS." + wfTask + ".Requested Documents";
        var WFT_Nopayment = "WFADHOC_PROCESS." + wfTask + ".No payment";
        var WFT_Nosignature = "WFADHOC_PROCESS." + wfTask + ".No signature";
        var WFT_Other = "WFADHOC_PROCESS." + wfTask + ".Other";
        var WFT_Comments = "WFADHOC_PROCESS." + wfTask + ".Comments";

        if (thisArr[WFT_Other] == "CHECKED"
            && thisArr[WFT_Comments] == null) {
            var txt = "If other please add comment.";
            txt = txt.fontsize("5").fontcolor("red").bold();
            showMessage = true;
            comment("<p>" + txt + "</p>");
            cancel = true;
            for (var j in thisArr) {
                logDebug("ID201 #1 " + wfTask + ": " + j + " = " + thisArr[j] + "<br >");
            }
            return; // return from function as no need further check needed.
        }

        if (thisArr[WFT_Invalidaddress] == null &&
            thisArr[WFT_InvalidLegalDescription] == null &&
            thisArr[WFT_RequestedDocuments] == null &&
            thisArr[WFT_Nopayment] == null &&
            thisArr[WFT_Nosignature] == null &&
            thisArr[WFT_Other] == null) {
            var txt = "Please select at least one of the deficiency data fields";
            txt = txt.fontsize("5").fontcolor("red").bold();
            showMessage = true;
            comment("<p>" + txt + "</p>");
            cancel = true;
            for (var j in thisArr) {
                logDebug("ID201 #1 " + wfTask + ": " + j + " = " + thisArr[j] + "<br >");
            }
        }
    }

    function SetTaskDueDate(referenceTask, targetTask, dateAddDays) {
        var workflowResult = aa.workflow.getTasks(capId);
        if (workflowResult.getSuccess()) {
            var wfObj = workflowResult.getOutput();
        } else {
            logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
        }
        for (i in wfObj) {
            var fTask = wfObj[i];
            var tempTaskModel = fTask.getTaskItem();
            //if the task name equals what we're searching for, do actions
            if (fTask.getTaskDescription().toUpperCase().equals(referenceTask.toUpperCase())) {
                logDebug("Setting due date for task " + fTask.getTaskDescription());
                var dispositionDate = aa.date.getCurrentDate();
                var stepnumber = fTask.getStepNumber();
                var processID = fTask.getProcessID();
                var fTaskModel = wfObj[i].getTaskItem();
                var duration = fTaskModel.getDaysDue();
                var dueDate = fTaskModel.getDueDate();
                logDebug("Due Date is" + dueDate);
                var updatedDueDate = dateAdd(null, dateAddDays);
                logDebug("New Due Date" + updatedDueDate);
            }
        }
        editTaskDueDate(targetTask, updatedDueDate);
    }

    //Default Under Review Status Workflow History Function
    function updateDefaultStatusWFHistory(capId, moduleName) {
        var mName = arguments[1];

        if (mName == "LandDevelopment") {
            wfHistResult = aa.workflow.getWorkflowHistory(capId, null);
            var wHist = new Array();
            var wTask = new Array();
            if (wfHistResult.getSuccess()) {
                var taskHistArr = wfHistResult.getOutput();
                for (var h in taskHistArr) {
                    taskHist = taskHistArr[h];
                    var taskName = taskHist.getTaskDescription();
                    taskName = new String(taskName);
                    taskName = taskName.replace(/^\s+|\s+$/g, "");
                    wHist.push(taskName);
                }
            }

            wfResult = aa.workflow.getTasks(capId);
            if (wfResult.getSuccess()) {
                var taskArr = wfResult.getOutput();
                for (var t in taskArr) {
                    task = taskArr[t];
                    if (task.getActiveFlag() == "Y" && task.getDisposition() == "Under Review") {
                        var tName = task.getTaskDescription();
                        tName = new String(tName);
                        tName = tName.replace(/^\s+|\s+$/g, "");
                        wTask.push(tName);
                    }
                }
                for (var w in wTask) {
                    activeTask = wTask[w];
                    var taskHistory = wHist.indexOf(activeTask);
                    if (taskHistory == -1) {
                        updateTask(activeTask, "Under Review", "Status Default", "Status Default");
                    }
                    else {
                        logDebug("Task is already on Workflow History:  " + activeTask + " wHist taskHistory position " + taskHistory);
                    }
                }
            }
        }
        else {
            logDebug("Module is not LandDevelopment.");
        }
    }

    function updateTSIAssign(assignedValue, capId, modifiedTask) {
        try {
            var wf = aa.workflow.getTasks(capId).getOutput();
            for (y in wf) {
                checkWFTask = wf[y].getTaskDescription();
                //if (checkWFTask == "Case Manager Review") {
                if (checkWFTask == modifiedTask) {
                    checkWFTaskProcID = wf[y].getProcessID();
                    checkWFTaskStep = wf[y].getStepNumber();
                    var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(capId, checkWFTaskProcID, checkWFTaskStep);
                    if (TSIResult.getSuccess()) {
                        var TSI = TSIResult.getOutput();
                        for (a1 in TSI) {
                            if (TSI[a1].getCheckboxDesc() == "Assign") {
                                editTaskSpecific(checkWFTask, "Assign", assignedValue);
                            }
                        }
                    }
                }
            }
            return false;
        } catch (err) {
            logDebug("A JavaScript Error occurred: " + err.message + " Line " + err.lineNumber);
        }
    }

    /**
     * update Task DueDate to Adjust the delay caused by Applciant
     * @param {string} updateTaskDueDateIfReq - Work Flow Task Name
     * @param {string} capId - capId
     */
    function updateTaskDueDateIfReq(wfstr, capId) {
        logDebug("Executing updateTaskDueDateIfReq");
        try {
            var recDate = getLastAIRStatusDate(wfstr, capId);
            if (recDate) {
                recDate = gs2.common.convertDateTimeStringtoJSDate(recDate);
                //logDebug(recDate);
                var taskResult = aa.workflow.getTask(capId, wfstr);
                if (taskResult.getSuccess()) {
                    var dueDate = taskResult.getOutput().getDueDate();
                    if (dueDate) {
                        dueDate = new Date(dateAdd(dueDate, 0));
                    }
                    if (recDate < dueDate) {
                        updateTaskDueDateByPosTime(wfstr, 24, capId);
                    }
                }
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred in updateTaskDueDateIfReq: " + err.message);
        }
    }

    /**
     * Get last status date of Work Flow with status Additional Info Required
     * @param {string} updateTaskDueDateIfReq - Work Flow Task Name
     * @param {string} capId - capId
     * @returns {string} recDate- last status date of Work Flow with status Additional Info Required
     */
    function getLastAIRStatusDate(wfstr, capId) {
        var sql = "SELECT TOP 1 REC_DATE FROM GPROCESS_HISTORY Where B1_PER_ID1 = '" + capId.getID1() + "' and B1_PER_ID2 = '" + capId.getID2() + "' and B1_PER_ID3 = '" + capId.getID3() + "' And SD_PRO_DES = '" + wfstr + "' AND SD_APP_DES = 'Additional Information Required' ORDER BY REC_DATE DESC"
        //logDebug(sql);
        var vError = '';
        var conn = null;
        var sStmt = null;
        var rSet = null;
        var recDate = "";

        try {
            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
            var ds = initialContext.lookup("java:/AA");
            conn = ds.getConnection();
            //logDebug(sql);
            sStmt = conn.prepareStatement(sql);
            rSet = sStmt.executeQuery();

            while (rSet.next()) {
                recDate = rSet.getString("REC_DATE");
                break;
            }
        } catch (vError) {
            logDebug("Runtime error occurred: " + vError);
        }
        gs2.util.closeDBQueryObject(rSet, sStmt, conn);
        return recDate;
    }

    function updateReqDocsTSI(wfTask, docType, capId) {
        try {
            var tsiReqDocList = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId, wfTask.getProcessID(), wfTask.getStepNumber(), 'Requested Document List');
            var tsiUpdatedDocs = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId, wfTask.getProcessID(), wfTask.getStepNumber(), 'Updated Document List');
            if (tsiReqDocList.getSuccess() && tsiUpdatedDocs.getSuccess()) {
                var newDocList = "";
                var docList = tsiReqDocList.getOutput().getChecklistComment();
                var docArray = new Array;
                if (docList != null)
                    docArray = docList.split(', ');
                if (!gs2.common.findInArray(docType, docArray)) {
                    newDocList = (docList == null || docList == "") ? docType : docList + ', ' + docType;
                    editTaskSpecific(wfTask.getTaskDescription(), "Requested Document List", newDocList, capId);
                }

                docList = tsiUpdatedDocs.getOutput().getChecklistComment();
                docArray = new Array;
                if (docList != null)
                    docArray = docList.split(', ');
                if (!gs2.common.findInArray(docType, docArray)) {
                    newDocList = (docList == null || docList == "") ? docType : docList + ', ' + docType;
                    editTaskSpecific(wfTask.getTaskDescription(), "Updated Document List", newDocList, capId);
                }
                editTaskSpecific(wfTask.getTaskDescription(), "Requested Documents", "CHECKED", capId);
            }
        } catch (err) {
            logDebug("**updateReqDocsTSI : " + err.message);
        }
    }


    function getwfTask(wfstr) {
        var useProcess = false;
        var processName = "";
        var itemCap = capId;

        if (arguments.length > 4) {
            if (arguments[4] != "") {
                processName = arguments[4]; // subprocess
                useProcess = true;
            }
        }

        var workflowResult = aa.workflow.getTasks(itemCap);
        if (workflowResult.getSuccess()) {
            var wfObj = workflowResult.getOutput();
        }
        else {
            logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
            return false;
        }
        //if (!wfstat) wfstat = "NA";
        for (i in wfObj) {
            var fTask = wfObj[i];
            //aa.print("fTask.getTaskDescription()" + fTask.getTaskDescription());
            //aa.print("fTask Status:" + fTask.getDisposition());

            if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())) {
                return (fTask);
            }
        }
        return (null);
    }

    function getwfTaskStatus(wfstr) {
        fTask = getwfTask(wfstr);
        if (fTask != null) {
            aa.print("fTask Status:" + fTask.getDisposition());
            return fTask.getDisposition();
        }
    }

    //This function will auto assign a task to a user in a department based on a round robin methodology
    //wfTask: Workflow Task Name that need to be auto assigned
    //Department: The department containing the users that will be used for assignment in the format "LICENSING/DCA/CONSERV/MED/NA/SUPV/NA"
    function autoAssign(wfTask, department) {

        var useCap = false;
        var vCapID = capId;
        if (arguments.length == 3) {
            vCapID = arguments[2];
            useCap = true
        }
        //we'll just use a standard choice value that matches the task name
        if (arguments.length < 2 || department == undefined || department == null || department == "") {
            var vWFTaskObj = aa.workflow.getTask(vCapID, wfTask).getOutput();
            var vAsgnStaff = vWFTaskObj.getAssignedStaff();
            var department = vAsgnStaff.getDeptOfUser().toString();
        }
        var stdChoiceVal = department;
        var assignToString = gs2.common.lookup("WorkflowAutoAssign", stdChoiceVal);
        //OBSOLETE - Concurrency degrades performance
        //var assignToString = gs2.util.getNextSequence(department);
        var assignTo = parseInt(assignToString);
        var assignNext = 0;
        var userList = new Array();

        //get the users in the department

        var pList = aa.people.getSysUserListByDepartmentName(department).getOutput()

        //build an array of user IDs

        for (a in pList) {
            if (pList[a].userStatus != "ENABLE")
                continue;
            userList.push(pList[a].getGaUserID());
            logDebug("User ID" + " " + pList[a].getUserID());
            logDebug("ID in Array" + " " + pList[a]);
            logDebug("UserList" + " " + userList);
        }

        //if (assignTo >= 0 && userList.length > 0) {
        //    var assignToIndex = assignTo % userList.length;
        //    assignTask(wfTask, userList[assignToIndex]);
        //}
        // else{
        //     logDebug("Auto Assign Failed :: The Department is not valid or no users are assigned to the department");
        // }
        //make sure we're still in the bounds of the array and assign
        var vUser = "";
        if (assignTo < userList.length) {
            vUser = userList[assignTo];
            //update the standard choice value
            editLookup("WorkflowAutoAssign", stdChoiceVal, assignTo + 1);
        }
            //if outside the bounds of the array, return to the beginning.
        else {
            vUser = userList[0];
            //update the standard choice value
            editLookup("WorkflowAutoAssign", stdChoiceVal, 1);
        }
        //assign the task
        if (!useCap)
            assignTask(wfTask, vUser);
        else
            assignWfTask(wfTask, vUser, vCapID);
        return vUser;
    }

    function taskCloseAllExcept(pStatus, pComment) {
        // Closes all tasks in CAP with specified status and comment
        // Optional task names to exclude
        // 06SSP-00152
        //
        var taskArray = new Array();
        var closeAll = false;
        if (arguments.length > 2) //Check for task names to exclude
        {
            for (var i = 2; i < arguments.length; i++)
                taskArray.push(arguments[i]);
        }
        else
            closeAll = true;

        var workflowResult = aa.workflow.getTasks(capId);
        if (workflowResult.getSuccess())
            var wfObj = workflowResult.getOutput();
        else {
            logDebug("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
            return false;
        }

        var fTask;
        var stepnumber;
        var processID;
        var dispositionDate = aa.date.getCurrentDate();
        var wfnote = " ";
        var wftask;

        for (i in wfObj) {
            fTask = wfObj[i];
            wftask = fTask.getTaskDescription();
            stepnumber = fTask.getStepNumber();
            if (fTask.getActiveFlag() != "Y" || fTask.getCompleteFlag() == "Y")
                continue;
            //processID = fTask.getProcessID();
            if (closeAll) {
                aa.workflow.handleDisposition(capId, stepnumber, pStatus, dispositionDate, wfnote, pComment, systemUserObj, "Y");
                logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
                logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
            }
            else {
                if (!exists(wftask, taskArray)) {
                    aa.workflow.handleDisposition(capId, stepnumber, pStatus, dispositionDate, wfnote, pComment, systemUserObj, "Y");
                    logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
                    logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
                }
            }
        }
    }

    function deactivateActiveTasks(processName) {

        var workflowResult = aa.workflow.getTasks(capId);
        if (workflowResult.getSuccess())
            wfObj = workflowResult.getOutput();
        else {
            logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
            return false;
        }

        for (i in wfObj) {
            fTask = wfObj[i];
            if (fTask.getProcessCode().equals(processName) || processName == null)
                if (fTask.getActiveFlag().equals("Y"))
                    deactivateTask(fTask.getTaskDescription());
        }

    }

    function updateTaskDueDateByPosTime(wfstr, workDayHours, capId) {
        //lwacht: added try/catch; commented out startDate as was causing an
        //        error and was not being used.
        try {
            logDebug("Executing 'updateTaskDueDateByPosTime'.");
            var workflowResult = aa.workflow.getTasks(capId);
            if (workflowResult.getSuccess()) {
                var wfObj = workflowResult.getOutput();
            }
            else {
                logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
            }
            for (i in wfObj) {
                var fTask = wfObj[i];
                var tempTaskModel = fTask.getTaskItem();
                //if the task name equals what we're searching for, do actions
                if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())) {
                    logDebug("Setting due date for task " + fTask.getTaskDescription());
                    var dispositionDate = aa.date.getCurrentDate();
                    var stepnumber = fTask.getStepNumber();
                    var processID = fTask.getProcessID();
                    var fTaskModel = wfObj[i].getTaskItem();
                    var duration = fTaskModel.getDaysDue();
                    var inPos = fTaskModel.getInPossessionTime();
                    //var startDate = fTaskModel.getTimerStartTime();
                    var jsDate = new Date();
                    logDebug("Current Due Date: " + fTaskModel.getDueDate());
                    //add the duration in milliseconds
                    var durationMills = duration * 24 * 60 * 60 * 1000;
                    //startDate.setTime(startDate.getTime() + durationMills);
                    //logDebug("Original Due Date: " + startDate);
                    durationMills = durationMills - ((inPos / workDayHours) * 24 * 60 * 60 * 1000);
                    var durationDays = durationMills / 1000 / 60 / 60 / 24;
                    logDebug("New Task Duration: " + durationDays);
                    var strDate = (jsDate.getMonth() + 1 + "/" + jsDate.getDate() + "/" + jsDate.getFullYear());
                    durationDays = Math.round(durationDays);
                    var dueDate = aa.date.parseDate(strDate);
                    var calID = gs2.util.isBusinessCalAssociated(wfstr, capId);
                    dueDate = (calID != -1) ? gs2.util.addBusinessDays(dueDate, durationDays, calID) : dateAdd(dueDate, durationDays);
                    dueDate = aa.date.parseDate(dueDate);
                    //dueDate = dateAddForWF(dueDate, Math.floor(durationDays));
                    logDebug("New Due Date: " + dueDate.getMonth() + "/" + dueDate.getDayOfMonth() + "/" + dueDate.getYear());
                    wfObj[i].setDueDate(dueDate);
                    fTaskModel = wfObj[i].getTaskItem();
                    aa.workflow.adjustTaskWithNoAudit(fTaskModel);
                }
            }
        }
        catch (err) {
            logDebug("An error occurred in updateTaskDueDateByPosTime: " + err.message);
            logDebug(err.stack);
        }
    }

    function jumpStartWorkflow() {

        itemCap = capId;
        if (arguments.length > 0) itemCap = arguments[0];

        var workflowResult = aa.workflow.getTasks(itemCap);
        if (workflowResult.getSuccess()) {
            wfObj = workflowResult.getOutput();
            if (wfObj != null) {
                for (i in wfObj) {
                    fTask = wfObj[i];
                    if (fTask.getActiveFlag().equals("Y")) {
                        tName = fTask.getTaskDescription();
                        if (!doesStatusExistInTaskHistory(tName, "Under Review")) {
                            updateTask(tName, "Under Review", "set by script", "");
                        }
                    }
                }
            }
        }
        else {
            logDebug("ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
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

    function setRecToClosed() {
        var wFlowTask = "Closure";
        var wNewflowStatus = "Closed";

        if ((isTaskReadyToClose(wFlowTask))) {
            //Update and close task
            closeTask(wFlowTask, wNewflowStatus, "Closed via script", "");
            return true;
        }
        return false;
    }

    function isTaskReadyToClose(wfstr) {
        var useProcess = false;
        var allComplt = true;

        var processName = "";
        var itemCap = capId;
        if (arguments.length > 4) {
            if (arguments[4] != "") {
                processName = arguments[4]; // subprocess
                useProcess = true;
            }
        }

        var workflowResult = aa.workflow.getTasks(itemCap);
        if (workflowResult.getSuccess())
            var wfObj = workflowResult.getOutput();
        else {
            aa.print("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
            return false;
        }

        //if (!wfstat) wfstat = "NA";

        for (i in wfObj) {
            var fTask = wfObj[i];
            logDebug("isTaskReadyToClose: fTask.getTaskDescription()" + fTask.getTaskDescription());
            logDebug("isTaskReadyToClose: fTask Status:" + fTask.getDisposition());
            logDebug("isTaskReadyToClose: fTask Active Flag:" + fTask.getActiveFlag());

            if (fTask.getActiveFlag().equals("Y") && (!fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()))) {
                allComplt = false;
            }
            if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (allComplt) && fTask.getActiveFlag().equals("Y")) {

                return true;
            }
        }
    }

    function getTaskAssignedUser(ipTask) {
        var vTaskObj = aa.workflow.getTask(capId, ipTask).getOutput();
        var vAssignedStaff = vTaskObj.getAssignedStaff();
        var vFName = vAssignedStaff.getFirstName();
        var vMName = vAssignedStaff.getMiddleName();
        var vLName = vAssignedStaff.getLastName();
        var vAssignedUser = aa.person.getUser(vFName, vMName, vLName).getOutput();
        var opAssignedUserId = null;
        if (vAssignedUser)
            opAssignedUserId = vAssignedUser.getUserID();
        return opAssignedUserId;
    }

    function updateTaskStatusOnUpload(wfTask, docType, capId) {
        try {
            var wFTaskStat = wfTask.getDisposition();
            if (matches(wfTask.getDisposition(), 'Additional Information Required')) {
                var tsiNoPayment = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId, wfTask.getProcessID(), wfTask.getStepNumber(), 'No payment')
                var tsiReqDocs = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId, wfTask.getProcessID(), wfTask.getStepNumber(), 'Requested Documents')
                if (tsiNoPayment.getSuccess() && tsiReqDocs.getSuccess()) {
                    try {
                        if (tsiReqDocs.getOutput() != null && matches(tsiReqDocs.getOutput().getChecklistComment(), 'CHECKED')) {
                            var newDocList = "";
                            var tsiReqDocList = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(capId, wfTask.getProcessID(), wfTask.getStepNumber(), 'Requested Document List');
                            if (tsiReqDocList.getSuccess()) {
                                try {
                                    var reqDocArray = tsiReqDocList.getOutput().getChecklistComment().split(', ');
                                    for (var d in reqDocArray) {
                                        var reqDoc = reqDocArray[d];
                                        if (!matches(docType, reqDoc))
                                            newDocList = (newDocList == "") ? reqDoc : newDocList + ", " + reqDoc;
                                    }
                                } catch (err) {
                                    logDebug(err.message);
                                }
                                editTaskSpecific(wfTask.getTaskDescription(), "Requested Document List", newDocList, capId);
                                if (matches(newDocList, "")) {
                                    editTaskSpecific(wfTask.getTaskDescription(), "Requested Documents", null, capId);
                                    updateTask(wfTask.getTaskDescription(), 'Additional Information Received', 'Updated by Script', '');
                                    if (appTypeArray[0] == "LandDevelopment")
                                        updateTaskDueDateIfReq(wfTask.getTaskDescription(), capId);
                                    else
                                        updateDueDateOnWfUpdate(wfTask.getTaskDescription(), capId);
                                    return true;
                                }
                            }
                        } else {
                            if (!matches(tsiNoPayment.getOutput().getChecklistComment(), 'CHECKED')) {
                                updateTask(wfTask.getTaskDescription(), 'Additional Information Received', 'Updated by Script', '');
                                if (appTypeArray[0] == "LandDevelopment")
                                    updateTaskDueDateIfReq(wfTask.getTaskDescription(), capId);
                                else
                                    updateDueDateOnWfUpdate(wfTask.getTaskDescription(), capId);

                                return true;
                            }
                        }
                    } catch (err) {
                        logDebug(err.message);
                    }
                }
            }
        } catch (err) {
            logDebug("**Error from updateTaskStatusOnUpload :" + err.message);
        }
    }

    function updateReqDocStatusOnUpload(wfTasks, docType, capId) {
        try {
            for (i in wfTasks) {
                var wfTask = wfTasks[i];
                if (updateTaskStatusOnUpload(wfTask, docType, capId)) {
                    gs2.rec.updateApplicationStatus(wfTasks, wfTask, capId);
                }
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred: " + err.message);
        }
    }

    function deactivateTaskContaining(targetCapId, keywords) {
        //Optional parameter task keyword to exlude
        var excludeKeywords = null;
        if (arguments.length > 2) {
            excludeKeywords = arguments[2];
        }
        else {
            excludeKeywords = new Array();
        }
        //Get all workflow tasks
        var workflowTasks = aa.workflow.getTasks(targetCapId).getOutput();
        for (i in workflowTasks) {
            var fTask = workflowTasks[i];
            var fTaskDes = fTask.getTaskDescription();

            if (gs2.common.existsCustom1(fTaskDes, keywords) && !gs2.common.existsCustom1(fTaskDes, excludeKeywords)) {
                deactivateTask(fTaskDes);
            }

        }
    }



    function deleteTaskContaining(targetCapId, keywords) {
        //Optional parameter task keyword to exlude
        var excludeKeywords = null;
        if (arguments.length > 2) {
            excludeKeywords = arguments[2];
        }
        else {
            excludeKeywords = new Array();
        }
        //Get all workflow tasks
        var workflowTasks = aa.workflow.getTasks(targetCapId).getOutput();
        for (i in workflowTasks) {
            var fTask = workflowTasks[i];
            var fTaskDes = fTask.getTaskDescription();

            if (gs2.common.existsCustom1(fTaskDes, keywords) && !gs2.common.existsCustom1(fTaskDes, excludeKeywords)) {
                var result = aa.workflow.removeTask(fTask)
                if (!result.getSuccess()) {
                    logDebug("error " + result.getErrorMessage());
                    return false;
                }
                else {
                    //aa.print("Successfully deleted " + fTaskDes)
                    logDebug("Successfully deleted " + fTaskDes)
                }
            }

        }
    }


    function doesRecordHaveActiveTaskWithConfiguredStatus(itemCap, sValue) {
        retValue = false;

        try {
            var workflowResult = aa.workflow.getTasks(itemCap);
            if (workflowResult.getSuccess()) {
                wfObj = workflowResult.getOutput();
                for (i in wfObj) {
                    fTask = wfObj[i];
                    if (fTask.getActiveFlag() == "Y") {

                        statusListResult = aa.workflow.getTaskStatusList(itemCap, "" + fTask.getProcessCode(), "" + fTask.getTaskDescription());
                        if (statusListResult.getSuccess()) {
                            statusArr = statusListResult.getOutput();
                            for (sIndex in statusArr) {
                                thisStatus = "" + statusArr[sIndex];
                                thisStatus = thisStatus.trim();
                                if (thisStatus == sValue) return true;
                            }
                        }
                    }
                }
            }
            else {
                logDebug("Failed to get workflow object: " + workflowResult.getErrorMessage());
                return false;
            }
        }
        catch (err) {
            logDebug(err);
        }
        return retValue;
    }


    function getWFTaskUserAgency(ftask) {
        //logDebug("getWFTaskUserAgency = " + wf[x].getAssignedStaff().getFirstName());

        if (ftask != null && ftask.getAssignedStaff().getFirstName() != null) {
            var agency = ftask.getAssignedStaff().getAgencyCode();

            logDebug("first name = " + ftask.getAssignedStaff().getFirstName());
            logDebug("agency = " + agency);

            if (agency != null)
                return (agency);
        }
        return (servProvCode);
    }
    function getWFTaskUserAgencyName(ftask) {
        if (ftask != null && ftask.getAssignedStaff().getFirstName() != null) {
            var deptOfUser = ftask.getAssignedStaff().getAgencyCode();
            var deptList = aa.people.getDepartmentList(null).getOutput();

            for (var dept in deptList) {
                var d = deptList[dept].getServiceProviderCode() + "/" + deptList[dept].getAgencyCode() + "/" + deptList[dept].getBureauCode() + "/" + deptList[dept].getDivisionCode() + "/" + deptList[dept].getSectionCode() + "/" + deptList[dept].getGroupCode() + "/" + deptList[dept].getOfficeCode();
                if (d.equals(ftask.getAssignedStaff().getDeptOfUser())) {
                    deptOfUser = deptList[dept].getDeptName();
                    break;
                }
            }

            logDebug("getWFTaskUserAgencyName() - Assigned Staff First Name = " + ftask.getAssignedStaff().getFirstName());
            logDebug("getWFTaskUserAgencyName() - Assigned Staff Department Name = " + deptOfUser);

            if (deptOfUser != null)
                return (deptOfUser);
        }
        return (servProvCode);
    }

    function editTaskDueDateCustom(wfstr, wfdate) {
        var vCapID = capId;
        if (arguments.length == 3) {
            vCapId = arguments[2];
        }
        var taskDesc = wfstr;
        if (wfstr == "*") {
            taskDesc = ""
        }
        var workflowResult = aa.workflow.getTaskItems(vCapId, taskDesc, "", null, null, null);
        if (workflowResult.getSuccess()) {
            wfObj = workflowResult.getOutput()
        } else {
            logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
            return false
        }
        for (i in wfObj) {
            var fTask = wfObj[i];
            if ((fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) || wfstr == "*")) {
                wfObj[i].setDueDate(aa.date.parseDate(wfdate));
                var fTaskModel = wfObj[i].getTaskItem();
                var tResult = aa.workflow.adjustTaskWithNoAudit(fTaskModel);
                if (tResult.getSuccess()) {
                    logDebug("Set Workflow Task: " + fTask.getTaskDescription() + " due Date " + wfdate)
                } else {
                    logMessage("**ERROR: Failed to update due date on workflow: " + tResult.getErrorMessage());
                    return false
                }
            }
        }
    }

    //This function will auto assign an User to an WFTask in a department based on a round robin methodology based on discipline and district
    function autoAssignWFTaskByDistrictAndDisciplineRR(vWFTask, department, district, discipline, vCapID, usrobjs) {
        var stdChoiceVal = discipline + "||" + district + "||" + department;
        var assignToString = gs2.common.lookup("DisciplineDistrict RR", stdChoiceVal);
        var assignTo = parseInt(assignToString);
        if (assignToString == undefined || assignTo == usrobjs.length) {
            assignWfTaskByUserObj(vWFTask, usrobjs[0].userObject, vCapID);
            editLookup("DisciplineDistrict RR", stdChoiceVal, "1");
        }
        else {
            assignWfTaskByUserObj(vWFTask, usrobjs[assignTo].userObject, vCapID);
            editLookup("DisciplineDistrict RR", stdChoiceVal, (assignTo + 1) + "");
        }
    }

    //assign task by userObj
    function assignWfTaskByUserObj(wfstr, taskUserObj, vCapId) {
        var processName = "";
        var workflowResult = aa.workflow.getTaskItems(vCapId, wfstr, processName, null, null, null);
        if (workflowResult.getSuccess()) {
            var wfObj = workflowResult.getOutput()
        } else {
            logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
            return false
        }
        for (i in wfObj) {
            var fTask = wfObj[i];
            if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())) {
                fTask.setAssignedUser(taskUserObj);
                var taskItem = fTask.getTaskItem();
                var adjustResult = aa.workflow.assignTask(taskItem);
                aa.print("Assigned to: " + taskUserObj.getUserID());
            }
        }
    }

    // Add working days to an Accela Date object
    // td - Accela scriptDateTime object
    // amt - int number of working days to add
    // returns an Accela scriptDateTime object
    function dateAddForWF(td, amt) {
        var i = 0;
        while (i < Math.abs(amt)) {
            res = aa.calendar.getNextWorkDay(td).getOutput();
            jsDate = new Date(res.getTime());
            td = aa.date.parseDate(jsDate.getMonth() + 1 + "/" + jsDate.getDate() + "/" + jsDate.getFullYear());
            i++;
        }
        return td;
    }

    function updateAppandTaskStatusAsaAA() {
        try {
            if (!publicUser) {
                if (isTaskActive("Application Intake")) {
                    updateAppStatus("Received", "");
                    closeTask("Application Intake", "Received", "Updated via script", "");
                    updateAppStatus("Under Review", ""); //BUILDS-4700
                }
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred: : " + err.message);
        }
    }

    function updateAppandTaskStatusAsaACA() {
        try {
            if (publicUser) {
                if (isTaskActive("Application Intake")) {
                    updateAppStatus("Received Online", "");
                    closeTask("Application Intake", "Received Online", "Closed via script", "Closed via script");
                    updateAppStatus("Under Review", ""); //BUILDS-4700
                }
            }
        } catch (err) {
            logDebug("A JavaScript Error occurred: : " + err.message);
        }
    }    

    gs2.wf.test = test;
    gs2.wf.addAdHocTask = addAdHocTask;
    gs2.wf.isTaskAllowed = isTaskAllowed;
    gs2.wf.getTaskDept = getTaskDept;
    gs2.wf.activateTask = activateTask;
    gs2.wf.taskActivateAndAutoAssign = taskActivateAndAutoAssign;
    gs2.wf.setDueDate = setDueDate;
    gs2.wf.activeTasksCheck = activeTasksCheck;
    gs2.wf.branchTask = branchTask;
    gs2.wf.deactivateActiveTasksForParent = deactivateActiveTasksForParent;
    gs2.wf.checkIfAnyTaskActive = checkIfAnyTaskActive;
    gs2.wf.assignWfTask = assignWfTask;
    gs2.wf.updateReqDocList = updateReqDocList;
    gs2.wf.closeWfTask = closeWfTask;
    gs2.wf.deActivateWfTask = deActivateWfTask;
    gs2.wf.setWFDueDateByDaysByCalendarType = setWFDueDateByDaysByCalendarType;
    gs2.wf.updateDueDateOnWfUpdate = updateDueDateOnWfUpdate;
    gs2.wf.updateWfOnDocUplaod = updateWfOnDocUplaod;
    gs2.wf.updateWfOnPayment = updateWfOnPayment;
    gs2.wf.getAssignedStaffUserIDByTaskName = getAssignedStaffUserIDByTaskName;
    gs2.wf.autoAssignTaskFromSameUser = autoAssignTaskFromSameUser;
    gs2.wf.getWFTaskMatrixInfo = getWFTaskMatrixInfo;
    gs2.wf.getWFAssignedStaffUserID = getWFAssignedStaffUserID;
    gs2.wf.CheckDeficiencyDataFields = CheckDeficiencyDataFields;
    gs2.wf.SetTaskDueDate = SetTaskDueDate;
    gs2.wf.updateDefaultStatusWFHistory = updateDefaultStatusWFHistory;
    gs2.wf.updateTSIAssign = updateTSIAssign;
    gs2.wf.updateTaskDueDateIfReq = updateTaskDueDateIfReq;
    gs2.wf.getLastAIRStatusDate = getLastAIRStatusDate;
    gs2.wf.updateReqDocsTSI = updateReqDocsTSI;
    gs2.wf.getwfTask = getwfTask;
    gs2.wf.getwfTaskStatus = getwfTaskStatus;
    gs2.wf.autoAssign = autoAssign;
    gs2.wf.taskCloseAllExcept = taskCloseAllExcept;
    gs2.wf.deactivateActiveTasks = deactivateActiveTasks;
    gs2.wf.updateTaskDueDateByPosTime = updateTaskDueDateByPosTime;
    gs2.wf.jumpStartWorkflow = jumpStartWorkflow;
    gs2.wf.doesStatusExistInTaskHistory = doesStatusExistInTaskHistory;
    gs2.wf.setRecToClosed = setRecToClosed;
    gs2.wf.isTaskReadyToClose = isTaskReadyToClose;
    gs2.wf.getTaskAssignedUser = getTaskAssignedUser;
    gs2.wf.updateTaskStatusOnUpload = updateTaskStatusOnUpload;
    gs2.wf.updateReqDocStatusOnUpload = updateReqDocStatusOnUpload;
    gs2.wf.deactivateTaskContaining = deactivateTaskContaining;
    gs2.wf.deleteTaskContaining = deleteTaskContaining;
    gs2.wf.doesRecordHaveActiveTaskWithConfiguredStatus = doesRecordHaveActiveTaskWithConfiguredStatus;
    gs2.wf.getWFTaskUserAgency = getWFTaskUserAgency;
    gs2.wf.getWFTaskUserAgencyName = getWFTaskUserAgencyName;
    gs2.wf.editTaskDueDateCustom = editTaskDueDateCustom;
    gs2.wf.autoAssignWFTaskByDistrictAndDisciplineRR = autoAssignWFTaskByDistrictAndDisciplineRR;
    gs2.wf.assignWfTaskByUserObj = assignWfTaskByUserObj;
    gs2.wf.dateAddForWF = dateAddForWF;    
    gs2.wf.updateAppandTaskStatusAsaAA = updateAppandTaskStatusAsaAA;    
    gs2.wf.updateAppandTaskStatusAsaACA = updateAppandTaskStatusAsaACA;    
    
})();


