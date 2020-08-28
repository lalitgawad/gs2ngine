/*---------------------------------------------------------------------
| THE BELOW SCRIPT SHOULD BE ALWAYS AT THE END OF THE FILE.
---------------------------------------------------------------------*/
/*---------------------------------------------------------------------
| Defect 000 - Inspection Scheduler Audit Log Creating Issue if User
|              Id start with either 1 or 2 or 3
---------------------------------------------------------------------*/
//Initialize Application object
try {
    gs2.common.initializeAppObject();
    if (appObj) 
    {       
            appObj.ISADelegator();
    }
}
catch (err) {
    gs2.common.handleError(err, "");
}

