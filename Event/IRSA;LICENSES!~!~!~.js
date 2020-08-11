//Initialize Application object
try {
    gs2.common.initializeAppObject();
    if (appObj) 
    {        
            appObj.IRSADelegator();
    }
}
catch (err) {
    gs2.common.handleError(err, "");
}

/*---------------------------------------------------------------------
| THE BELOW SCRIPT SHOULD BE ALWAYS AT THE END OF THE FILE.
---------------------------------------------------------------------*/
/*---------------------------------------------------------------------
| Defect 000 - Inspection Scheduler Audit Log Creating Issue if User
|              Id start with either 1 or 2 or 3
---------------------------------------------------------------------*/
try {
    if (!publicUser) {
        // If current user id begins with either 0, 1, 2 or 3
        if (currentUserID == null || currentUserID == '') {
            currentUserID = "ADMIN";
        }

        if(!isNaN(currentUserID))
        {
            var firstChar = currentUserID.substring(0,1);
            if(parseInt(firstChar) < 4)
            {
                inspScheduleAuditLogAsyncWrapper();
            }
        }
    }
} catch (err) {
    logDebug("**WARNING: IRSA:LICENSES/*/*/*: #ID01-inspScheduleAuditLogAsyncWrapper:  " + err.message);
}


//REVISIT
function inspScheduleAuditLogAsyncWrapper() {
    try
    {
        logDebug("ENTER: inspScheduleAuditLogAsyncWrapper");
        var psShowDebug = 'N';
        if (isYesOnSelected(showDebug + '')) {
            psShowDebug = 'Y';
        }

        var userFullName = systemUserObj.getFullName();
        if (userFullName == null || userFullName == '')
        {
            userFullName = systemUserObj.getFirstName() + ' ' + systemUserObj.getLastName();
        }

        var envParameters = aa.util.newHashMap();
        envParameters.put("showDebug", psShowDebug);    
        envParameters.put("userFullName", userFullName);
        envParameters.put("schedulerID", currentUserID);
        envParameters.put("ipRecordNumber", capIDString);

        var scriptName = "WS_ASYNC_UPDATE_INSP_SCHEDULER";
        aa.runAsyncScript(scriptName, envParameters);
        logDebug("EXIT: inspScheduleAuditLogAsyncWrapper");
    }
    catch(err)
    {
        logDebug("**WARNING: IRSA:LICENSES/*/*/*: #ID02-inspScheduleAuditLogAsyncWrapper:  " + err.message);
    }
}
