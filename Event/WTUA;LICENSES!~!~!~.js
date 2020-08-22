//Initialize Application object
try {
    gs2.common.initializeAppObject();
}
catch (err) {
    gs2.common.handleError(err, "");
}

try {
    gs2.wf.setRecToClosed();
    //REVISIT
	//autoAssignUser();
}
catch (err) {
    logDebug("A JavaScript Error occurred: WTUA:LICENSES/*/*/*: #ID-UNK: " + err.message);
}

var objWTUA = appObj.WtuaDelegator(); 
if (objWTUA) logDebug("objWTUA: " + objWTUA);


if (matches(wfStatus, "Additional Information Required")) {
    appSpecificLogic = true;
    //priya
    //sendAdditionalInfoEmail();
}  


try {
	//REVISIT
    //workflowPossessionTime();
}
catch (err) {
    logDebug("A JavaScript Error occurred: WTUA:LICENSES/*/*/*: #ID-UNK: " + err.message);
}

//Added below code to address requirements
try {
    if (wfStatus == "Additional Information Received") {
        gs2.wf.updateTaskDueDateIfReq(wfTask, capId);
	}
}
catch (err) {
    logDebug("A JavaScript Error occurred: WTUA:LICENSES/*/*/*: #ID-UNK: " + err.message);
}

try {
    gs2.rec.SetExpirationDate(capId, wfTask, wfStatus);
}
catch (err) {
    logDebug("**WARNING: WTUA:LICENSES/*/*/*: #ID-UNK: " + err.message);
}

//changes
try {
    wfTasks = aa.workflow.getTaskItemByCapID(capId, null).getOutput();
    for (i in wfTasks) {
        var vWFTask = wfTasks[i];
        if (vWFTask.getActiveFlag() == "Y" && matches(vWFTask.getDisposition(), 'Additional Information Required')) {
            updateAppStatus("Additional Info Required", "Updated via Script", capId);
            break;
        }
    }
}
catch (err) {
    logDebug("**WARNING: WTUA:LICENSES/*/*/*: #ID-Update App Status: " + err.message);
}

