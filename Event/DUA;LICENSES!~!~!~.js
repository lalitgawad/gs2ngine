try {
    if (!appObj) {
        gs2.common.initializeAppObject();
    }

    if(typeof appObj.DuaDelegator != "undefined" && appObj.DuaDelegator != null )
        appObj.DuaDelegator();
}
catch (err) {
    gs2.common.handleError(err, "");
}
