//Initialize Application object
try {
    gs2.common.initializeAppObject();
    // Clearing all non-auto accessed fees so that correct fees are applied if the
    // ACA user navigates back and forth before the payment has been made.
    if (publicUser) {
        gs2.finance.ClearAllFees(capId)
    }
    gs2.finance.invoiceAllFees();
}
catch (err) {
    gs2.common.handleError(err, "");
}

try {
    if (publicUser)
        gs2.doc.saveUploadedDocTypeList4CTRCA();
    if (!publicUser) {
        gs2.doc.calcReqDocs("Update");
    }//end if !publicuser
} catch (err) {
    logDebug("A JavaScript Error occurred: #267: " + err.message);
}

if (!gpf.async_) {
    //if (!gpf.asa_apctprim) {
    try {
        if (publicUser) {
            gs2.rec.makeOnlyApllicantPrimary();
        }
    } catch (err) {
        logDebug("A JavaScript Error occurred: #267: " + err.message);
    }
    //}
}

try {
    //sync transaction contacts to reference and turn the sync flag off by default
    //CTRCA: Revisit Edit happens before sunmition
    gs2.contact.setContactsSyncFlag("N");
    gs2.contact.createRefContactsFromCapContactsAndLinkSA(capId, null, null, false, true, gs2.contact.peopleDuplicateCheck);
}
catch (err) {
    logDebug(err, "Error while syncing the contacts");
}

if (!publicUser) {
    gs2.rec.copyApplicantToOtherContacts4AA();
    if (!gpf.async_) {
        //PRIYA
        makeOnlyApllicantPrimary();
    }
}

if (!gpf.async_) {
    gs2.wf.updateAppandTaskStatusAsaAA();
}

try {
    gs2.rec.SetExpirationDate(capId, "Initialize", "Initialize");
} catch (err) {
    logDebug("**WARNING: ASA:LICENSES/*/*/*: #ID-SetExpirationDate: " + err.message);
}

try {
    if (appObj) {
        appObj.AsaDelegator();
    }
} catch (err) {
    logDebug("A JavaScript Error occurred: " + appTypeString + " :appObj.AsaDelegator(): " + err.message);
}

if (!gpf.async_) {
    try {
        if (!publicUser) {
            gs2.user.linkPublicUserToApplication();
        }
    } catch (err) {
        logDebug("A JavaScript Error occurred while linking application with public user: " + err.message);
    }
}

if (gpf.async_) {
    try {
        if (!publicUser) {
            gs2.async.asaAsyncWrapper();
        }
    } catch (err) {
        logDebug("**WARNING: ASA:LICENSES/*/*/*: #ID-asaAsyncWrapper:  " + err.message);
    }
}

try {
    if (vUpdatedRefContacts != '') {
        gs2.async.contactsAsyncWrapper(vUpdatedRefContacts);
    }
} catch (err) {
    logDebug("**WARNING: contactsAsyncWrapper:  " + err.message);
}

