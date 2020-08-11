sendInspectionScheduleEmail();
/*---------------------------------------------------------------------
| THE BELOW SCRIPT SHOULD BE ALWAYS AT THE END OF THE FILE.
---------------------------------------------------------------------*/
/*---------------------------------------------------------------------
| Defect 000 - Inspection Scheduler Audit Log Creating Issue if User
|              Id start with either 1 or 2 or 3
---------------------------------------------------------------------*/
//Initialize Application object
try {
    gs2.common.initializeAppObject();
    if (appObj) 
    {        
            appObj.ISADelegator();
    }
}
catch (err) {
    gs2.common.handleError(err, "");
}

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
    logDebug("**WARNING: ISA:LICENSES/*/*/*: #ID01-inspScheduleAuditLogAsyncWrapper:  " + err.message);
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
        logDebug("**WARNING: ISA:LICENSES #ID02-inspScheduleAuditLogAsyncWrapper:  " + err.message);
    }
}

//REVISIT
function sendInspectionScheduleEmail(){
	if (validateRecordTypeforScheduleEmailNotification()) {
		try {
			var inspObject = aa.inspection.getInspection(capId, inspId).getOutput(); 
			var inspStatus = inspObject.getInspectionStatus();
			aa.env.setValue("inspId", inspId);		
			if (inspStatus == "Scheduled") {
					commProcObj = new commProcessingOBJ();
					var notificationName = "INSPECTION_SCHEDULED";
					var notificationList = [];
					notificationList.push(notificationName);
					var emailSent = commProcObj.sendNotifications(notificationList);
					logDebug(notificationName+" Notification Sent!")		
			}			
		}
		catch (err) {
			logDebug("A JavaScript Error occurred: ISA:LICENSES: " + err.message);
		}
	}
}

//REVISIT
function validateRecordTypeforScheduleEmailNotification()
	{
		var notificationList = [];
		var validate = false;
		//Sign Permits
		notificationList.push("REVISIT/Permits/Sign Permit Application/Application");
    

		for (n in notificationList){
			if (appMatch(notificationList[n]))
				validate = true;
		}
		return validate;
	}
