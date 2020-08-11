gs2.async = {};
(function () {

    function test() {
        gs2.log('GS2_ASUNC Looks good');
        return true;
    }

    /**
     * To Send Payment Communication using async emse call
     * @param {Number} PaymentNbr - Payment Number
     * @Usage - Build SA-4949
     */
    function SendPaymentCommunicationWrapper(PaymentNbr) {
        logDebug("ENTER: SendPaymentCommunicationWrapper");
        var psShowDebug = 'N';
        if (gs2.common.isYesOnSelected(showDebug + '')) {
            psShowDebug = 'Y';
        }

        var psPublicUserID = currentUserID;
        if (publicUserID) {
            psPublicUserID = publicUserID;
        }

        var envParameters = aa.util.newHashMap();
        envParameters.put("showDebug", psShowDebug);
        envParameters.put("CurrentUserID", psPublicUserID);
        envParameters.put("ipRecordNumber", capIDString);
        envParameters.put("PaymentNbr", PaymentNbr);

        var scriptName = "WS_EMAIL_COMMUNICATION";
        aa.runAsyncScript(scriptName, envParameters);
        logDebug("EXIT: SendPaymentCommunicationWrapper");
    }

    function asaAsyncWrapper() {
        logDebug("ENTER: asaAsyncWrapper");
        var psShowDebug = 'N';
        if (gs2.common.isYesOnSelected(showDebug + '')) {
            psShowDebug = 'Y';
        }

        var psPublicUserID = currentUserID;
        if (publicUserID) {
            psPublicUserID = publicUserID;
        }

        var envParameters = aa.util.newHashMap();
        envParameters.put("showDebug", psShowDebug);
        envParameters.put("CurrentUserID", psPublicUserID);
        envParameters.put("ipRecordNumber", capIDString);

        var scriptName = "WS_ASYNC_ASA";
        aa.runAsyncScript(scriptName, envParameters);
        logDebug("EXIT: asaAsyncWrapper");
    }

    function asaCtrcaWrapper() {
        logDebug("ENTER: asaCtrcaWrapper");
        var psShowDebug = 'N';
        if (gs2.common.isYesOnSelected(showDebug + '')) {
            psShowDebug = 'Y';
        }

        var psPublicUserID = currentUserID;
        if (publicUserID) {
            psPublicUserID = publicUserID;
        }

        var envParameters = aa.util.newHashMap();
        envParameters.put("showDebug", psShowDebug);
        envParameters.put("CurrentUserID", psPublicUserID);
        envParameters.put("ipRecordNumber", capIDString);

        var scriptName = "WS_CTRCA_ASA";
        aa.runAsyncScript(scriptName, envParameters);
        logDebug("EXIT: asaCtrcaWrapper");
    }

    function praAsyncWrapper() {
        logDebug("ENTER: pRAAsyncWrapper");
        var psShowDebug = 'N';
        if (isYesOnSelected(showDebug + '')) {
            psShowDebug = 'Y';
        }

        var psPublicUserID = currentUserID;
        if (publicUserID) {
            psPublicUserID = publicUserID;
        }

        var envParameters = aa.util.newHashMap();
        envParameters.put("showDebug", psShowDebug);
        envParameters.put("CurrentUserID", psPublicUserID);
        envParameters.put("ipRecordNumber", capIDString);

        var scriptName = "WS_ASYNC_PRA";
        aa.runAsyncScript(scriptName, envParameters);
        logDebug("EXIT: pRAAsyncWrapper");
    }

    function contactsAsyncWrapper(refContactNum) {

        logDebug("ENTER: contactsAsyncWrapper");
        var psShowDebug = 'N';
        if (gs2.common.isYesOnSelected(showDebug + '')) {
            psShowDebug = 'Y';
        }

        var envParameters = aa.util.newHashMap();
        envParameters.put("showDebug", psShowDebug);
        envParameters.put("CurrentUserID", "ADMIN");
        envParameters.put("refNumber", refContactNum);

        var scriptName = "ASYNC_UPDATE_CONTACTS";
        aa.runAsyncScript(scriptName, envParameters);
        logDebug("EXIT: contactsAsyncWrapper");

    }
    function doASyncSendEmails(notificationType) {
        logDebug("ENTER: DoASyncSendEmails : " + notificationType);
        try {
            var psShowDebug = 'N';
            if (isYesOnSelected(showDebug + '')) {
                psShowDebug = 'Y';
            }

            var psPublicUserID = currentUserID;
            if (publicUserID) {
                psPublicUserID = publicUserID;
            }

            var envParameters = aa.util.newHashMap();
            envParameters.put("showDebug", psShowDebug);
            envParameters.put("CurrentUserID", psPublicUserID);
            envParameters.put("ipRecordNumber", capIDString);
            envParameters.put("notification", notificationType);
            envParameters.put("asyncCustomParam", asyncCustomParam);
            envParameters.put("asyncInvParam", asyncInvParam);
            envParameters.put("asyncNotifWFTaskName", asyncNotifWFTaskName);
            envParameters.put("asyncNotifWFTaskProcess", asyncNotifWFTaskProcess);
            envParameters.put("permitCapIDs", permitCapIDs);
            envParameters.put("partialPermitCapID", partialPermitCapID);
            envParameters.put("FTType", FTType);
            envParameters.put("FTExpDate", FTExpDate);


            logDebug("CALLING WS_ASYNC_EMAIL_COMMUNICATION >>> ");
            var scriptName = "WS_ASYNC_EMAIL_COMMUNICATION";
            aa.runAsyncScript(scriptName, envParameters);
            logDebug("EXIT: DoASyncSendEmails");

        }
        catch (err) {
            logDebug("A JavaScript Error occurred");
            gs2.common.handleError(err, "");
        }


    }

    gs2.async.test = test;
    gs2.async.SendPaymentCommunicationWrapper = SendPaymentCommunicationWrapper
    gs2.async.asaAsyncWrapper = asaAsyncWrapper
    gs2.async.asaCtrcaWrapper = asaCtrcaWrapper
    gs2.async.praAsyncWrapper = praAsyncWrapper
    gs2.async.contactsAsyncWrapper = contactsAsyncWrapper
    gs2.async.doASyncSendEmails = doASyncSendEmails

})();


