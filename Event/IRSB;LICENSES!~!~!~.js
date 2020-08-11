//Initialize Application object
try {
    gs2.common.initializeAppObject();
    if (appObj) 
    {        
            appObj.IRSBDelegator();
    }
}
catch (err) {
    gs2.common.handleError(err, "");
}