try {
	gs2.common.initializeAppObject();
}
catch (err) {
	gs2.common.handleError(err, "");
}

try {
	gs2.doc.updateReqDocs4CTRCA();
} catch (err) {
	logDebug("A JavaScript Error occurred: CTRCA:AQM/*/*/*: Creation of Documnet Conditions: " + err.message);
}

if (!gpf.async_) {
	try {
		gs2.wf.updateAppandTaskStatusAsaACA();
	} catch (err) {
		logDebug("A JavaScript Error occurred: CTRCA:AQM/*/*/*: Defect 53: " + err.message);
	}
}

if (publicUser) {
	try {
		gs2.rec.SetExpirationDate(capId, "Initialize", "Initialize");
	} catch (err) {
		logDebug("**WARNING: CTRCA:AQM/*/*/*: #ID-SetExpirationDate: " + err.message);
	}
}

try {
	if (appObj) {
		appObj.CtrcaDelegator();
	}
} catch (err) {
	logDebug("A JavaScript Error occurred: " + appTypeString + " :appObj.CtrcaDelegator(): " + err.message);
}

if (gpf.async_) {
	try {
		gs2.async.asaCtrcaWrapper();
	} catch (err) {
		logDebug("**WARNING: CTRCA:AQM/*/*/*: #ID-asaCtrcaWrapper:  " + err.message);
	}
}
