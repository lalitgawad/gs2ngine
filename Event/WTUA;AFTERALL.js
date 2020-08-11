//WTUA After Aall Event
try
{
	//
}
catch (err)
{
	logDebug("A JavaScript Error occurred: WTUA:AFTERALL: #ID-UNK: " + err.message);
}


//Default Under Review Status Workflow History Function WTUA all
try {
	var appTypeResult = cap.getCapType();
	var appTypeString = appTypeResult.toString(); 			// Convert application type to string 
	var appTypeArray = appTypeString.split("/"); 			// Array of application type string
	var moduleName = appTypeArray[0];
	gs2.wf.updateDefaultStatusWFHistory(capId, moduleName);
	}catch (err) {
        logDebug("WARNING JavaScript Error occurred: WTUA:AFTERALL: " + err.message);
		}