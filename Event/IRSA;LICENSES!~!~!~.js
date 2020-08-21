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
