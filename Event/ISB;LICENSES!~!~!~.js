//Initialize Application object
try {
    gs2.common.initializeAppObject();
    if (appObj)
    {
        appObj.ISBDelegator();
    }
}
catch (err) {
    gs2.common.handleError(err, "");
}
