//Initialize Application object
try {
    gs2.common.initializeAppObject();
}
catch (err) {
    gs2.common.handleError(err, "");
}

// Apply Task Permissions by Agency
if (!gs2.wf.isTaskAllowed(wfTask))
{
	//showMessage = true;
	//comment("You do not have Permission to work on this Task.");
	//cancel = true;
}

//ID-3 AD Rewrite
//Modified To Check AppType and THEN match proper wfTask/Status
try {
	var cancelWTUB = gs2.finance.CheckOutstandingBalance(); // function in INCLUDES_WORKFLOW
	logDebug("Will WTUB be cancelled? " + cancelWTUB);

	if (cancelWTUB && appTypeArray[3] == "Garage Sale") {
		showMessage = true;
		comment("Workflow cannot proceed until all fees are paid. Current balance is: $" + balanceDue.toFixed(2));
		cancel = true;
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred:  WTUB:LICENSES/*/*/*: Cancel W/ Outstanding Balance: " + err.message);
}

try {
	var returnVal = appObj.WtubDelegator();
	if (returnVal && returnVal.cancel == true){
		logDebug("returnVal.cancel = " + returnVal.cancel);
		logDebug("returnVal.message = " + returnVal.message);
		showMessage=true;
		comment(returnVal.message);
		cancel = true;
	}
	
}catch (err){ 
	logDebug("A JavaScript Error occurred: appObj.WtubDelegator: " + err.message);
}
