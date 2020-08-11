//Initialize Application object
try {
    gs2.common.initializeAppObject();
}
catch (err) {
    gs2.common.handleError(err, "");
}
try 
{
    if (appObj) 
	{        
            appObj.ApplyAppASIUAFees();
            appObj.AsiuaDelegator();
	}
} catch (err) {
    logDebug("A JavaScript Error occurred: ASIUA:LICENSES/*/*/* : appObj.ApplyAppASIUAFees(): " + err.message);
}
