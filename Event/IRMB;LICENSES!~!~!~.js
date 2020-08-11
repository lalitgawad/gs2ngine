//Initialize Application object

try {

    gs2.common.initializeAppObject();
    if (appObj) {
        appObj.IRMBDelegator();
    }
}
catch (err) {
    gs2.common.handleError(err, "");
}