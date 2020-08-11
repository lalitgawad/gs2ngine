//aa.print("=================AccountID|Amount|TransactionType|TransactionID=================");
var returnList = aa.env.getValue("transactionList");
var size = returnList.length;
cancel = true;
showMessage = true;
comment("<font  color='red'>Escrow account action(s) are not allowed. Please use create or amendment application to submit the request.</font>");

