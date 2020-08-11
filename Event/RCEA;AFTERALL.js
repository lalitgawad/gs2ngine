try {
	var refContactNo = ContactModel.getContactSeqNumber();
    if (refContactNo !='') 
    {
        gs2.async.contactsAsyncWrapper(refContactNo);        
    }
} catch (err) {
    logDebug("**WARNING: contactsAsyncWrapper:  " + err.message);
}

