//Initialize Application object

try {

    gs2.common.initializeAppObject();
}
catch (err) {
    gs2.common.handleError(err, "");
}

loadASITablesBefore();

try {
    if (appObj && appObj.AsbDelegator) {
        appObj.AsbDelegator();
        logDebug("ASB Delegator complete");
    }
} 
catch (err) {
    logDebug("A JavaScript Error occurred: " + appTypeString + " :appObj.AsbDelegator(): " + err.message);
}

if (!publicUser) {
    try {
        gs2.doc.validateAlternativeDocExistsAA(appTypeString);
        if(appTypeArray[3] != "Renewal")
            gs2.rec.validateOnlyOneContact("Applicant");
            gs2.rec.checkReqContactsAA();
        }
    catch (err) {
        logDebug("A JavaScript Error occurred:  ASB:LICENSES/*/*/*: validateRequiredContatctTypeAndAddress: " + err.message);
    }
}

