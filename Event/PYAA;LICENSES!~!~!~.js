/*------------------------------------------------------------------------------------------------------/
| Program : 
| Event   : 
| Date    : 
/------------------------------------------------------------------------------------------------------*/
var params = aa.env.getParamValues();
var keys =  params.keys();
var key = null;
while(keys.hasMoreElements())
{
	 key = keys.nextElement();
	 eval("var " + key + " = aa.env.getValue(\"" + key + "\");");
	 logDebug("PYAA Loaded Env Variable: " + key + " = " + aa.env.getValue(key));
}
logDebug("PaymentNbr = " + PaymentNbr);
logDebug("CurrentUserID = " + currentUserID);
var capIDString = capId.getCustomID();
logDebug("capIDString = " + capIDString);		
/*=========================================================
| SAP APPLY PAYMENT TO RECEIVABLE SCRIPT BEGIN
=========================================================*/

try {
        gs2.common.initializeAppObject();
	}
    catch (err) {
        gs2.common.handleError(err, "");
    }

try{

if (appObj && typeof appObj.pyaaDelegator != "undefined" && appObj.pyaaDelegator != null) {
			appObj.pyaaDelegator();				
}
}
catch (err) {
	logDebug("A JavaScript Error occurred to SAP : " + err.message);
}

if (PaymentNbr > 0){
	gs2.finance.GeneratePaymentReceipt(PaymentNbr);
}
