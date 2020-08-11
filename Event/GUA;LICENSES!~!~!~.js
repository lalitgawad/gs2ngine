//Initialize Application object
try {
    gs2.common.initializeAppObject();
    if (appObj) 
    {
    	if(typeof appObj.GUADelegator != "undefined" && appObj.GUADelegator != null )
        	appObj.GUADelegator();
        var inspObj = aa.inspection.getInspection(capId, guidesheetModel.activityNumber).getOutput();
        if(CInfo['Additional plans required'] == "CHECKED")
            inspObj.getInspection().getActivity().setOvertime("Y");
        else
            inspObj.getInspection().getActivity().setOvertime("N");
        aa.inspection.editInspection(inspObj);
    }
}
catch (err) {
    gs2.common.handleError(err, "");
}