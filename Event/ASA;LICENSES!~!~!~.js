//Initialize Application object
try {
    gs2.common.initializeAppObject();
}
catch (err) {
    gs2.common.handleError(err, "");
}
try {
    if (appObj) {
        appObj.AsaDelegator();
    }
} catch (err) {
    logDebug("A JavaScript Error occurred: " + appTypeString + " :appObj.AsaDelegator(): " + err.message);
}
