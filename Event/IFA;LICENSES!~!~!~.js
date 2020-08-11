//Log All Environmental Variables as  globals
var params = aa.env.getParamValues();
var keys =  params.keys();
var key = null;
while(keys.hasMoreElements())
{
	key = keys.nextElement();
	eval("var " + key + " = aa.env.getValue(\"" + key + "\");");
	logDebug("Loaded Env Variable: " + key + " = " + aa.env.getValue(key));
}

capIDString = capId.getCustomID();
appTypeResult = cap.getCapType();
appTypeString = appTypeResult.toString();
appTypeArray = appTypeString.split("/");

//sendAdditionalFeeAssessedEmail
var feeItemList = aa.finance.getFeeItemByCapID(capId).getOutput();
if(feeItemList.length > 0){	
	gs2.async.doASyncSendEmails("ADDITIONAL_FEES_ASSESSED");
}

//Initialize Application object
try {
	gs2.common.initializeAppObject();
	if (appObj)
	{
		appObj.IFADelegator();
	}
}
catch (err) {
	gs2.common.handleError(err, "");
}
