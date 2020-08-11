gs2.finance = {};
(function () {

    function test() {
        gs2.log('GS2_FINANCE Looks good');
        return true;
    }

    function isFeeAssessed() {
        var waiverFees = getiCRIPFeeList(capId);
        var vFees = aa.fee.getFeeItems(capId).getOutput();
        for (var vCounter in vFees) {
            var vFee = vFees[vCounter];
            if ((vFee.getFeeitemStatus() == "NEW") || vFee.getFeeitemStatus() == "INVOICED") {
                return true;
            }
        }
        return false;
    }

    function isFeeFullyPaid(ipFeeCode) {
        try {
            var opResult = false;
            var vCapId = capId;
            if (arguments.length > 1 && arguments[1])
                vCapId = argeuments[1];
            var vFeeArr = aa.fee.getFeeItems(vCapId, ipFeeCode, "INVOICED").getOutput();
            var vTotalFee = 0;
            var vTotalPmt = 0;
            var opPmtAmt = 0;
            for (var vCounter in vFeeArr) {
                var vFee = vFeeArr[vCounter];
                vTotalFee = vTotalFee + vFee.fee;
                vTotalPmt = vTotalPmt + getPaidAmountByFeeSeqNbr(vFee.feeSeqNbr);
            }
            opResult = (vTotalPmt >= vTotalFee);
            return opResult;
        }
        catch (vError) {
            logDebug("Error in function isFeeFullyPaid: " + vError.message);
        }
    }

    function getPaidAmountByFeeSeqNbr(ipFeeSeqNbr) {
        try {
            var vCapId = capId;
            if (arguments.length > 1 && arguments[1])
                vCapId = argeuments[1];
            var vPmtArr = aa.finance.getPaymentFeeItems(vCapId, null).getOutput();
            var opPmtAmt = 0;
            for (var vCounter in vPmtArr) {
                var vPmt = vPmtArr[vCounter];
                if (vPmt.feeSeqNbr != ipFeeSeqNbr)
                    continue;
                opPmtAmt = opPmtAmt + vPmt.feeAllocation;
            }
            return opPmtAmt;
        }
        catch (vError) {
            logDebug("Error in function getPaidAmountByFeeSeqNbr: " + vError.message);
        }
    }


    /**** Fee methods/objects ***/
    /**
     * Method to clear all non auto assessed fees
     * @param {type} capId
     */
    function ClearAllFees(capId) {
        logDebug("ENTER: ACA_ClearAllFees");
        try {
            var feeItemList = aa.finance.getFeeItemByCapID(capId).getOutput();
            for (x in feeItemList) {
                var feeItem = feeItemList[x];
                var feeDef = getFeeDefByCode(feeItem.feeSchudle, feeItem.feeCod, null);
                logDebug("FEE Code" + feeItem.feeCod + " AutoAssessFlag : " + feeDef.autoAssessFlag);
                if (feeDef.autoAssessFlag == "N") {
                    removeFee(feeItem.feeCod, "FINAL");
                }
            }
        } catch (ex) {
            logDebug("**** Error occurred:  ACA_ClearAllFees: " + ex.message);
        }
        logDebug("EXIT: ACA_ClearAllFees");
    }

    /**
     * Fee Def object use in various fees implemenation like surcharge calculation
     */
    function FeeDef() {
        this.feeschedule = null;
        this.formula = null;

        this.accCodeL1 = null;
        this.accCodeL2 = null;
        this.accCodeL3 = null;

        this.feeUnit = null;
        this.feeDesc = null;
        this.feeCode = null;
        this.comments = null;
        this.version = null;

        this.autoAssessFlag = "N";

        this.calcDevSurcharge = false;
        this.calcTechSurcharge = false;
    }

    /**
     * To get Fee Def By Fee Code
     * This uis to read all fee configuration
     * @param {string} fsched
     * @param {string} feeCode
     * @param {string} feeversion
     * @returns {object} - Fee Defination Object (FeeDef)
     */
    function getFeeDefByCode(fsched, feeCode, feeversion) {
        if (typeof aa != "undefined") {
            var arrFeesResult = aa.finance.getFeeItemList(null, fsched, feeversion, null, null);

            if (arrFeesResult.getSuccess()) {
                var arrFees = arrFeesResult.getOutput();
                for (var xx in arrFees) {
                    var fCode = arrFees[xx].getFeeCod();
                    if (fCode.equals(feeCode)) {
                        var f = new FeeDef();
                        f.feeschedule = fsched;
                        f.feeCode = fCode;
                        f.feeDesc = arrFees[xx].getFeeDes();
                        f.formula = arrFees[xx].getFormula();

                        f.accCodeL1 = arrFees[xx].getAccCodeL1();
                        f.accCodeL2 = arrFees[xx].getAccCodeL2();
                        f.accCodeL3 = arrFees[xx].getAccCodeL3();

                        f.subGroup = arrFees[xx].getSubGroup();

                        var rft = arrFees[xx].getrFreeItem();
                        f.comments = rft.getComments();
                        f.autoAssessFlag = rft.autoAssessFlag;

                        if (f.accCodeL2 && f.accCodeL2.length() > 0) {
                            f.accCodeL2.split("-").forEach(function (surcharge) {
                                if (surcharge == "D")
                                    f.calcDevSurcharge = true;
                                else if (surcharge == "T")
                                    f.calcTechSurcharge = true;
                            });
                        }

                        return f;
                    }
                } // for xx
            }
            else {
                logDebug("Error getting fee schedule " + arrFeesResult.getErrorMessage());
                return null;
            }
        }
        return null;
    }

    /**
     * Resolve Issue: Cannot insert duplicate key in X4FEEITEM_INVOICE;
     * Quantity need to adjust in update fee which was auto assessed in submission
     * @param {string} fcode - Fee Code
     * @param {string} fsched - Fee Schedule
     * @param {string} fperiod - Fee Perid
     * @param {string} fqty - Quantity
     * @param {string} finvoice - Invoice Y/N
     * @param {string} pDuplicate - is duplicate
     * @param {string} pFeeSeq - Fee Sequence
     * @returns {Number} - Fee Sequence Number
     */
    function updateFee(fcode, fsched, fperiod, fqty, finvoice, pDuplicate, pFeeSeq) {
        logDebug("Enter: Custom updateFee");
        if (pDuplicate == null || pDuplicate.length == 0) {
            pDuplicate = "Y"
        } else {
            pDuplicate = pDuplicate.toUpperCase()
        }
        var invFeeFound = false;
        var adjustedQty = fqty;
        var feeSeq = null;
        feeUpdated = false;
        if (pFeeSeq == null) {
            getFeeResult = aa.finance.getFeeItemByFeeCode(capId, fcode, fperiod)
        } else {
            getFeeResult = aa.finance.getFeeItemByPK(capId, pFeeSeq)
        }
        if (getFeeResult.getSuccess()) {
            if (pFeeSeq == null) {
                var feeList = getFeeResult.getOutput()
            } else {
                var feeList = new Array();
                feeList[0] = getFeeResult.getOutput()
            }
            for (feeNum in feeList) {
                if (feeList[feeNum].getFeeitemStatus().equals("INVOICED")) {
                    if (pDuplicate == "Y") {
                        logDebug("updateFee - Invoiced fee " + fcode + " found, subtracting invoiced amount from update qty.");
                        adjustedQty = adjustedQty - feeList[feeNum].getFeeUnit();
                        invFeeFound = true
                    } else {
                        invFeeFound = true;
                        logDebug("updateFee - Invoiced fee " + fcode + " found.  Not updating this fee. Not assessing new fee " + fcode)
                    }
                }
                if (feeList[feeNum].getFeeitemStatus().equals("NEW")) {
                    adjustedQty = adjustedQty - feeList[feeNum].getFeeUnit()
                    logDebug("updateFee - New fee " + fcode + " found, subtracting invoiced amount from update qty.");
                }
            }

            logDebug("updateFee - adjustedQty = " + adjustedQty);

            for (feeNum in feeList) {
                if (feeList[feeNum].getFeeitemStatus().equals("NEW") && !feeUpdated) {
                    var feeSeq = feeList[feeNum].getFeeSeqNbr();
                    var editResult = aa.finance.editFeeItemUnit(capId, adjustedQty + feeList[feeNum].getFeeUnit(), feeSeq);
                    feeUpdated = true;
                    if (editResult.getSuccess()) {
                        logDebug("updateFee - Updated Qty on Existing Fee Item: " + fcode + " to Qty: " + fqty);
                        if (finvoice == "Y") {
                            if (!exists(feeSeq, feeSeqList)) {
                                feeSeqList.push(feeSeq);
                                paymentPeriodList.push(fperiod);
                            }
                        }
                    } else {
                        logDebug("**ERROR: updating qty on fee item (" + fcode + "): " + editResult.getErrorMessage());
                        break
                    }
                }
            }
        } else {
            logDebug("**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())
        }
        if (!feeUpdated && adjustedQty != 0 && (!invFeeFound || invFeeFound && pDuplicate == "Y")) {
            feeSeq = addFee(fcode, fsched, fperiod, adjustedQty, finvoice)
        } else {
            feeSeq = null
        }
        updateFeeItemInvoiceFlag(feeSeq, finvoice);
        logDebug("End: Custom updateFee");
        return feeSeq
    }

    /* Invoice the newly added fees, most likely use in Async calls.
    */
    function inviceAssesedFees() {
        try {
            if (feeSeqList != null && feeSeqList.length > 0) {
                var _invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
                if (_invoiceResult.getSuccess())
                    logDebug("Invoicing assessed fee items is successful.");
                else
                    logDebug("**ERROR: Invoicing the fee items assessed to app was not successful.  Reason: " + _invoiceResult.getErrorMessage());
            }
        }
        catch (err) {
            logDebug("A JavaScript Error occurred:  inviceAssesedFees: " + err.message);
        }
    }

    function updatePayorName4Escrow(ipPaySeq) {
        var vPayorName = getPayorName4Escrow(ipPaySeq);
        gs2.util.executeUpdDelSQLQuery("update F4ACCT_TRANSACTION set PAYOR = '" + vPayorName + "' where SERV_PROV_CODE = '" + aa.getServiceProviderCode() + "' and PAYMENT_SEQ_NBR = " + ipPaySeq);
    }

    //This function gets the latest PaymentSeqNumber for the given capId
    function getMaxPaySeqNumber(capId) {
        var paymentItems = aa.finance.getPaymentByCapID(capId, null).getOutput();
        var paymentInfos = [];
        var epocMax = 0;
        var paySeqMAx = 0;

        for (x in paymentItems) {
            var paymentItem = paymentItems[x];
            var paymentInfo = {};
            paymentInfo.PaymentSeqNumber = paymentItem.getPaymentSeqNbr();
            paymentInfo.EpochMilliseconds = paymentItem.getPaymentDate().getEpochMilliseconds();
            paymentInfos.push(paymentInfo);
        }

        for (x in paymentInfos) {
            if (paymentInfos[x].EpochMilliseconds > epocMax) {
                epocMax = paymentInfos[x].EpochMilliseconds;
                paySeqMAx = paymentInfos[x].PaymentSeqNumber;
            }
        }
        return paySeqMAx;
    }

    function getPayorName4Escrow(ipPaySeq) {
        var opPayorName = "";
        var vOpArray = gs2.util.executeSelectQuery("select PAYEE,CASHIER_ID from F4PAYMENT where SERV_PROV_CODE = '" + aa.getServiceProviderCode() + "' and PAYMENT_SEQ_NBR = " + ipPaySeq, "PAYEE,CASHIER_ID");
        if (vOpArray.length > 0) {
            if (publicUser) {
                var vPublicAAUser = vOpArray[0]["CASHIER_ID"];
                opPayorName = gs2.user.getName4PublicUser(vPublicAAUser);
            }
            else
                opPayorName = vOpArray[0]["PAYEE"];
        }
        return opPayorName;
    }

    function getPendingFeeList(capId) {
        var PaidFeeItemList = [];
        var BalanceFeeItemList = [];
        try {
            var paymentFeeItems = aa.finance.getPaymentFeeItems(capId, null).getOutput();
            for (var i = 0; i < paymentFeeItems.length; i++) {
                var paymentItem = aa.finance.getPaymentByPK(capId, paymentFeeItems[i].getPaymentSeqNbr(), "ADMIN").getOutput();
                var FeeItemScriptModel = aa.finance.getFeeItemByPK(capId, paymentFeeItems[i].getFeeSeqNbr()).getOutput();
                if (paymentItem.getPaymentStatus() == "Paid" && FeeItemScriptModel.getFeeitemStatus() == "INVOICED") {
                    PaidFeeItemList.push(FeeItemScriptModel.getFeeSeqNbr().toString());

                }
            }
            var feeItemList = aa.finance.getFeeItemInvoiceList(capId, null).getOutput();
            for (var i = 0; i < feeItemList.length; i++) {
                var fseq = feeItemList[i].getFeeSeqNbr().toString();
                if (PaidFeeItemList.indexOf(fseq.trim()) == -1) {
                    BalanceFeeItemList.push(feeItemList[i]);
                }
            }
            return BalanceFeeItemList;
        }
        catch (e) {
            logDebug("WFvoidPendingFees :  Failed to get pending Fees" + e.message);
            return BalanceFeeItemList;
        }
    }
    //GIS Correction Void pending Fees - End

    function WFInviceVoidedFee(capId, FeeItemList) {
        try {
            for (var i = 0; i < FeeItemList.length; i++) {
                var FeeItemSequnceNumber = Number(FeeItemList[i]);
                var FeeItemScriptModel = aa.finance.getFeeItemByPK(capId, FeeItemSequnceNumber).getOutput();
                var feeSeqList = [];
                feeSeqList.push(FeeItemSequnceNumber);
                var paymentPeriodList = [];
                paymentPeriodList.push(FeeItemScriptModel.getPaymentPeriod());
                var createInvoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
            }
        }
        catch (e) {
            logDebug("WFvoidPendingFees :  Failed to Invoice voided Fee" + e.message);
        }
    }

    function WFvoidPendingFees(capId) {
        var returnResult = {};
        returnResult.StatusCd = "0000";
        returnResult.StatusDesc = "Success";
        returnResult.result = [];
        try {
            var BalanceFeeItemList = getPendingFeeList(capId);
            var FeeItemsToVoid = [];
            var feeSeqList = [];
            for (var i = 0; i < BalanceFeeItemList.length; i++) {
                if (BalanceFeeItemList[i].getFeeitemStatus() == "INVOICED") {
                    FeeItemsToVoid.push(BalanceFeeItemList[i].getFeeSeqNbr());
                }
            }
            for (var i = 0; i < FeeItemsToVoid.length; i++) {
                var FeeItemSequnceNumber = Number(FeeItemsToVoid[i]);
                var voidResult = aa.finance.voidFeeItem(capId, FeeItemSequnceNumber);
                if (voidResult.getSuccess()) {
                    feeSeqList.push(FeeItemSequnceNumber);
                }
                else {
                    logDebug("WFvoidPendingFees : Failed to void pending Fees : Void unsuccessful");
                }
            }
            returnResult.result = feeSeqList;
            return returnResult;
        }
        catch (e) {
            logDebug("WFvoidPendingFees :  Failed to void pending Fees" + e.message);
            returnResult.StatusCd = "0001";
            returnResult.StatusDesc = "Void Failed";
            return returnResult;
        }
    }

    function CheckOutstandingBalance() {
        if (!appObj) {
            gs2.common.initializeAppObject();
        }

        var objCheckCriteria = appObj.OutstandingBalanceCheckCriteria;
        if (objCheckCriteria) {
            logDebug(objCheckCriteria.debugText);
            if (gs2.common.matchesinArray(wfTask, objCheckCriteria.wfTask)   // In wfTask
                && (!gs2.common.matchesinArray(wfStatus, objCheckCriteria.wfStatus)) // not in wfStatus
                && balanceDue > 0) {
                return (true);
            }
        }
        return (false);
    }


    function UpdateFeeDesc(capId, feeSeq, newDesc) {
        var feeItem = aa.finance.getFeeItemByPK(capId, feeSeq).getOutput();
        if (feeItem != null) {
            var feeObj = feeItem.getF4FeeItem();
            aa.print(feeObj.getFeeDescription());
            feeObj.setFeeDescription(newDesc)
            aa.finance.editFeeItem(feeObj);
            logDebug("#666 UpdateFeeDesc: Success.");
        }
    }


    function GeneratePaymentReceipt(PaymentNbr) {
        var pReturn = aa.finance.getPaymentByPK(capId, PaymentNbr, currentUserID);

        if (pReturn.getSuccess()) {
            pR = pReturn.getOutput();
            logDebug("pReturn.getSuccess() - PaymentSeq: " + pR.getPaymentSeqNbr())
            var generateReceiptResult = aa.finance.generateReceipt(capId, aa.date.getCurrentDate(), PaymentNbr, pR.getCashierID(), null);
            //pR.getPaymentSeqNbr()
            if (!generateReceiptResult.getSuccess()) {
                logDebug("Unable to generate Receipt");
            }
            else {
                logDebug("Receipt generated successfully.....");
                if (!validateRecordTypeOnPayment()) {
                    logDebug("Sending Generated Receipt ....");
                    gs2.async.SendPaymentCommunicationWrapper(PaymentNbr);
                }
                //SendPaymentCommunication(currentUserID, capIDString, PaymentNbr);
                logDebug("PYAA/PRA Success...")
            }
        }
        else {
            logDebug("PYAA/PRA not success yet...")
        }
    }


    function validateRecordTypeOnPayment() {
        var notificationList = [];
        var validate = false;
        notificationList.push("REVISIT/Permits/Garage Sale/Application");


        logDebug("INCLUDES_CUSTOM >>> validateRecordTypeOnPayment NOTIFICATIONLIST --> " + notificationList)
        for (n in notificationList) {
            if (appMatch(notificationList[n]))
                validate = true;
        }
        return validate;
    }


    function SendPaymentCommunication(currentUserID) {
        if (currentUserID) {
            logDebug("Executing ID-2 (CTRCA)");
            var paymentSeqNbr = 0;

            if (arguments.length == 2) {
                var altId = arguments[1];
                capId = aa.cap.getCapID(altId).getOutput();
                capId = gs2.util.getCorrectedCapID4V10(capId);
                cap = aa.cap.getCapBasicInfo(capId).getOutput();
            }

            if (arguments.length == 3) {
                paymentSeqNbr = arguments[2];
            }

            //var fileList = getFeePaymentReceipts(capId);
            var fileList = [];
            if (paymentSeqNbr && paymentSeqNbr > 0)
                fileList = getPaymentReceiptReportByPaymentSeqNbr(capId, paymentSeqNbr);
            else
                fileList = getLastPaymentReceipt(capId);

            var contArr = new Array();
            var contEmail = false;

            var capScriptModel = aa.cap.getCap(capId);
            var capProject = "";
            if (capScriptModel.getSuccess()) {
                capProject = capScriptModel.getOutput().getSpecialText();
                capProject = (capProject) ? " - " + capProject : "";
            }

            var dubCheckemails = "";
            contArr = gs2.contact.getContactArrayWithTemplate(); //Opt out email option
            for (x in contArr) {
                contEmail = contArr[x]["email"];
                if (contEmail && dubCheckemails.indexOf(contEmail) == -1) {

                    var emailParameters = aa.util.newHashtable();
                    gs2.notification.getRecordParams4Notification(emailParameters);
                    gs2.notification.getACARecordParam4Notification(emailParameters, acaUrl);

                    //gs2.common.addParameter(emailParameters, "$$recordType$$", appTypeResult.getAlias());
                    gs2.common.addParameter(emailParameters, "$$recordType$$", aa.cap.getCap(capId).getOutput().getCapType().getAlias());
                    //gs2.common.addParameter(emailParameters, "$$recordType$$", capIDString);
                    gs2.common.addParameter(emailParameters, "$$projectName$$", capProject);
                    gs2.common.addParameter(emailParameters, "$$ACAURL$$", acaUrl);
                    /*
                    if (testemail) {
                        contEmail = testemail;
                    }
                    */
                    //Opt out email option
                    var vResult = gs2.util.sendNotificationToContact(sysFromEmail, contArr[x], "", "APPLICATION RECEIVED", emailParameters, fileList, capId);
                    if (vResult)
                        dubCheckemails = dubCheckemails + "," + contEmail;
                }
                else {
                    logDebug("No Contact emails found");
                }

            }
        }
    }

    function getFeePaymentReceipts(capId) {
        logDebug("Executing getFeePaymentReceipts");

        var fileList = []
        var FeeItemList = [];
        var paymentFeeItems = aa.finance.getPaymentFeeItems(capId, null).getOutput();

        logDebug("Fee Count = " + paymentFeeItems.length);
        var receiptNbr = 0;

        for (var i = 0; i < paymentFeeItems.length; i++) {
            var seqNbr = paymentFeeItems[i].getPaymentSeqNbr();
            var feeSeqNbr = paymentFeeItems[i].getFeeSeqNbr()
            var paymentItem = aa.finance.getPaymentByPK(capId, seqNbr, "ADMIN").getOutput();
            var currReceiptNbr = paymentItem.getReceiptNbr().toString();

            if (receiptNbr != currReceiptNbr) {
                var FeeItemScriptModel = aa.finance.getFeeItemByPK(capId, feeSeqNbr).getOutput();

                if (paymentItem.getPaymentStatus() == "Paid" && FeeItemScriptModel.getFeeitemStatus() == "INVOICED") {
                    var FeeItem = {};
                    FeeItem.FeeItemDescription = "" + FeeItemScriptModel.getFeeDescription();
                    FeeItem.PaymentMethod = "" + paymentItem.getPaymentMethod();
                    FeeItem.InvoiceNumber = paymentFeeItems[i].getInvoiceNbr().toString();
                    FeeItem.FeeItemSeqNumber = paymentFeeItems[i].getFeeSeqNbr().toString();
                    // FeeItem.Amount = paymentFeeItems[i].getFeeAllocation().toString();
                    FeeItem.Amount = FeeItemScriptModel.getFee().toString();
                    var paymentDate = paymentItem.getPaymentDate();
                    var paymentDateStr = paymentDate.getMonth() + "/" + paymentDate.getDayOfMonth() + "/" + paymentDate.getYear();
                    FeeItem.PaymentDate = paymentDateStr;
                    FeeItem.PaymentNumber = paymentItem.getPaymentSeqNbr().toString();
                    FeeItem.ReceiptNumber = paymentItem.getReceiptNbr().toString();

                    if (FeeItemScriptModel.getPaymentPeriod() == "AR")
                        FeeItem.FeeItemType = "Receivable";
                    else
                        FeeItem.FeeItemType = "Non-Receivable";

                    FeeItemList.push(FeeItem);
                }
            }
            receiptNbr = currReceiptNbr;
        }

        if (FeeItemList.length > 0) {
            for (var i = 0; i < FeeItemList.length; i++) {
                var FeeItem = FeeItemList[i];
                /*
                logDebug(aa.getServiceProviderCode());
                logDebug(FeeItem.ReceiptNumber);
                logDebug(capId.customID);
                */
                var reportParameters = aa.util.newHashtable();
                gs2.common.addParameter(reportParameters, "agencyId", aa.getServiceProviderCode());
                gs2.common.addParameter(reportParameters, "receiptNbr", FeeItem.ReceiptNumber);
                gs2.common.addParameter(reportParameters, "capId", capId.customID);

                var reportFile = gs2.util.generateReport(capId, "ACA Recipt", "LandDevelopment", reportParameters);

                logDebug("post generate report");

                if (reportFile) {
                    fileList.push(reportFile)
                }
            }
        }

        return (fileList);
    }

    function getLastPaymentReceipt(capId) {
        logDebug("Executing getLastPaymentReceipt");

        var fileList = []
        var maxReceiptNumberArr = new Array();
        var maxReceiptNumber = 0;

        var paymentItems = getPaymentList(capId);
        if (paymentItems != null && paymentItems.length > 0) {
            logDebug("Executing getLastPaymentReceipt: paymentItems.length = " + paymentItems.length);
            for (var x = 0; x < paymentItems.length; x++) {
                var paymentItem = paymentItems[x];
                maxReceiptNumberArr.push(paymentItem.ReceiptNumber);
                logDebug("Executing getLastPaymentReceipt: paymentItem.ReceiptNumber = " + paymentItem.ReceiptNumber);
            }
            maxReceiptNumber = Math.max.apply(Math, maxReceiptNumberArr).toString();
        }
        logDebug("maxReceiptNumber = " + maxReceiptNumber);
        if (maxReceiptNumber > 0) {
            var reportFile = getPaymentReceiptReport(capId, maxReceiptNumber);
            if (reportFile) {
                fileList.push(reportFile)
            }
        }

        return (fileList);
    }

    function getPaymentReceipts(capId) {
        logDebug("Executing getPaymentReceipts");

        var fileList = []
        var PaymentList = getPaymentList(capId);
        if (PaymentList.length > 0) {
            for (var i = 0; i < PaymentList.length; i++) {
                var payItem = PaymentList[i];
                var reportParameters = aa.util.newHashtable();
                gs2.common.addParameter(reportParameters, "agencyId", aa.getServiceProviderCode());
                gs2.common.addParameter(reportParameters, "receiptNbr", payItem.ReceiptNumber);
                gs2.common.addParameter(reportParameters, "capId", capId.customID);

                var reportFile = getPaymentReceiptReport(capId, payItem.ReceiptNumber);
                if (reportFile) {
                    fileList.push(reportFile)
                }
            }
        }
        logDebug("getPaymentReceipts  = " + fileList.length);
        return (fileList);
    }

    function getPaymentList(capId) {
        logDebug("Executing getPaymentList");

        var PaymentList = [];
        var payResult = aa.finance.getPaymentByCapID(capId, null).getOutput();
        if (payResult) {
            //logDebug("Payment Count = " + payResult.length);
            var receiptNbr = 0;

            for (var i = 0; i < payResult.length; i++) {
                var payItem = payResult[i];
                var currReceiptNbr = payItem.getReceiptNbr().toString();
                if (receiptNbr != currReceiptNbr) {
                    var PaymentItem = {};
                    PaymentItem.ReceiptNumber = currReceiptNbr;
                    logDebug("PaymentItem.ReceiptNumber = " + PaymentItem.ReceiptNumber);
                    PaymentItem.PaymentSeqNbr = payItem.getPaymentSeqNbr();
                    PaymentItem.PaymentMethod = payItem.getPaymentMethod();
                    PaymentItem.Amount = payItem.getPaymentAmount();
                    PaymentList.push(PaymentItem);
                }
                receiptNbr = currReceiptNbr;
            }
        }
        return (PaymentList);
    }

    function getPaymentReceiptReportByPaymentSeqNbr(capId, paymentSeqNbr) {
        var fileList = []
        var receiptNbr = 0;
        var paymentItems = getPaymentList(capId);
        if (paymentItems != null && paymentItems.length > 0) {
            logDebug("Executing getPaymentReceiptReportByPaymentSeqNbr: paymentItems.length = " + paymentItems.length);
            for (var x = 0; x < paymentItems.length; x++) {
                var paymentItem = paymentItems[x];
                if (paymentItem.PaymentSeqNbr == paymentSeqNbr) {
                    receiptNbr = paymentItem.ReceiptNumber;
                    logDebug("paymentSeqNbr = " + paymentSeqNbr);
                    logDebug("receiptNbr = ") + receiptNbr;
                    break;
                }
            }

            logDebug("receiptNbr = " + receiptNbr);
            if (receiptNbr > 0) {
                var reportFile = getPaymentReceiptReport(capId, receiptNbr);
                if (reportFile) {
                    fileList.push(reportFile)
                }
            }
        }
        return (fileList);
    }

    function getPaymentReceiptReport(capId, receiptNbr) {
        logDebug("Executing getPaymentReceiptReport");

        var reportParameters = aa.util.newHashtable();
        gs2.common.addParameter(reportParameters, "agencyId", aa.getServiceProviderCode());
        gs2.common.addParameter(reportParameters, "receiptNbr", receiptNbr);
        gs2.common.addParameter(reportParameters, "capId", capId.customID);
        var reportFile = gs2.util.generateReport(capId, "ACA Recipt", "LandDevelopment", reportParameters);
        logDebug("post generate report");
        return (reportFile);
    }

    function invoiceAllFees() {
        var vFeeItems = aa.fee.getFeeItems(capId).getOutput();
        for (var vCounter in vFeeItems) {
            var vFeeItem = vFeeItems[vCounter];
            if (vFeeItem.feeitemStatus != "NEW")
                continue;
            feeSeqList.push(vFeeItem.feeSeqNbr);
            paymentPeriodList.push(vFeeItem.paymentPeriod);
        }
    }

    function invoiceAllCapFees() {
        if (feeSeqList.length) {
            var invoiceRes = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
            if (invoiceRes.getSuccess())
                logMessage("Invoicing assessed fee items is successful.");
            else
                logMessage("**ERROR: Invoicing the fee items assessed to app # " + capId + " was not successful.  Reason: " + invoiceRes.getErrorMessage());
        }
    }
    function getCapBalanceFromFeesAndPayment(ipNew) {
        var vCapID = null;
        if (typeof (capId) != "undefined")
            vCapID = capId;
        if (arguments.length > 1 && arguments[1])
            vCapID = arguments[1];
        if (!vCapID)
            return false;

        var opBalance = 0;
        if (!publicUser || vEventName != "ConvertToRealCAPAfter" || getAppSpecific("Are you ICRIP Approved?") == "Y") {
            var vFees = aa.fee.getFeeItems(vCapID).getOutput();
            for (var vCounter in vFees) {
                var vFee = vFees[vCounter];
                if ((ipNew && vFee.getFeeitemStatus() == "NEW") || vFee.getFeeitemStatus() == "INVOICED") {
                    opBalance = +(opBalance + vFee.getFee()).toFixed(2);
                }
            }

            var vPayments = aa.finance.getPaymentByCapID(vCapID, null).getOutput();
            for (var vCounter in vPayments) {
                var vPayment = vPayments[vCounter];
                if (vPayment.getPaymentStatus() == "Paid") {
                    opBalance = +(opBalance - vPayment.getPaymentAmount()).toFixed(2);
                }
            }
        }

        return opBalance;
    }

    gs2.finance.test = test;
    gs2.finance.isFeeAssessed = isFeeAssessed;
    gs2.finance.isFeeFullyPaid = isFeeFullyPaid;
    gs2.finance.getPaidAmountByFeeSeqNbr = getPaidAmountByFeeSeqNbr;
    gs2.finance.ClearAllFees = ClearAllFees;
    gs2.finance.FeeDef = FeeDef;
    gs2.finance.getFeeDefByCode = getFeeDefByCode;
    gs2.finance.updateFee = updateFee;
    gs2.finance.inviceAssesedFees = inviceAssesedFees;
    gs2.finance.updatePayorName4Escrow = updatePayorName4Escrow;
    gs2.finance.getMaxPaySeqNumber = getMaxPaySeqNumber;
    gs2.finance.getPayorName4Escrow = getPayorName4Escrow;
    gs2.finance.getPendingFeeList = getPendingFeeList;
    gs2.finance.WFInviceVoidedFee = WFInviceVoidedFee;
    gs2.finance.WFvoidPendingFees = WFvoidPendingFees;
    gs2.finance.CheckOutstandingBalance = CheckOutstandingBalance;
    gs2.finance.UpdateFeeDesc = UpdateFeeDesc;
    gs2.finance.GeneratePaymentReceipt = GeneratePaymentReceipt;
    gs2.finance.validateRecordTypeOnPayment = validateRecordTypeOnPayment;
    gs2.finance.SendPaymentCommunication = SendPaymentCommunication;
    gs2.finance.getFeePaymentReceipts = getFeePaymentReceipts;
    gs2.finance.getLastPaymentReceipt = getLastPaymentReceipt;
    gs2.finance.getPaymentReceipts = getPaymentReceipts;
    gs2.finance.getPaymentList = getPaymentList;
    gs2.finance.getPaymentReceiptReportByPaymentSeqNbr = getPaymentReceiptReportByPaymentSeqNbr;
    gs2.finance.getPaymentReceiptReport = getPaymentReceiptReport;
    gs2.finance.invoiceAllFees = invoiceAllFees;
    gs2.finance.invoiceAllCapFees = invoiceAllCapFees;
    gs2.finance.getCapBalanceFromFeesAndPayment = getCapBalanceFromFeesAndPayment;

})();

