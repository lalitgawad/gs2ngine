//sync transaction contacts to reference and turn the sync flag off by default
gs2.contact.setContactsSyncFlag("N");
gs2.contact.createRefContactsFromCapContactsAndLinkSA(capId, null, null, false, true, gs2.contact.peopleDuplicateCheck);

try {
	if (vUpdatedRefContacts !='') {
	    gs2.async.contactsAsyncWrapper(vUpdatedRefContacts);
	}
} catch (err) {
    logDebug("**WARNING: contactsAsyncWrapper:  " + err.message);
}

