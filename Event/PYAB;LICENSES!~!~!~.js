var params = aa.env.getParamValues();
var keys =  params.keys();
var key = null;
while(keys.hasMoreElements())
{
 key = keys.nextElement();
 eval("var " + key + " = aa.env.getValue(\"" + key + "\");");
 logDebug("Loaded Env Variable: " + key + " = " + aa.env.getValue(key));
}

logDebug("Calling PYAB....");

var pseqNo = PaymentNbr.toString();
var paymentInfo = aa.finance.getPaymentByPK(capId,aa.util.parseLong(pseqNo),"ADMIN").getOutput();
var paymentMethod = paymentInfo.getPaymentMethod();
logDebug(paymentMethod);
