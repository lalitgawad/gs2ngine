try {
    gs2.common.initializeAppObject();
}
catch (err) {
    gs2.common.handleError(err, "");
}

gs2.wf.updateWfOnPayment();

try {
	var PaymentNbr = gs2.finance.getMaxPaySeqNumber(capId); //Defined in INCLUDES_COMMON R2S-168	
	if (appObj && typeof appObj.praDelegator != "undefined" && appObj.praDelegator != null) {
		appObj.praDelegator(PaymentNbr);				
	}
} 
catch (err) {
	gs2.common.handleError(err, "");
}


     
    