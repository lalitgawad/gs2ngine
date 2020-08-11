currentUserID = aa.env.getValue("CurrentUserID");

//Initialize Application object
try {
    gs2.common.initializeAppObject();
    if (appObj)
    {
        appObj.ISHBDelegator();
    }
}
catch (err) {
    gs2.common.handleError(err, "");
}

