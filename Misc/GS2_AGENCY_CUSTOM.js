function demogetEmailRecipients(contactTypeArray) {
    var sendList = [];
    var contactMap = demogetCustomerContacts();

    if (contactMap && contactMap.size() > 0) {
        //logDebug("contactMap>>> " + contactMap.size());
        var emailArray = contactMap.keySet().toArray();
        for (var key in emailArray) {
            if (emailArray[key]) {
                var contactType = emailArray[key];
                //logDebug("contactType>>> " + contactType);
                if (gs2.common.exists(contactType, contactTypeArray)) {
                    var contact = contactMap.get(contactType)
                    //logDebug("contactEmail>>> " + contact.getEmail());
                    if (contact.getEmail()) {
                        var sEmail = contact.getEmail() + "";
                        if (!gs2.common.exists(sEmail, sendList)) {
                            sendList.push(contact.getEmail());
                        }
                    }
                }
            }
        }
    }
    var sendToStr = sendList.toString();
    var emailStr = sendToStr.replace(/,+/g, "||");
    //logDebug("1. emailStr>>> " + emailStr)

    var emailList = "" + lookup("Lookup:Emails", "GS2 DEFAULT");
    if (emailStr) {
        emailStr += "||" + emailList;
    } else {
        emailStr = emailList;
    }

    return emailStr;
}

function demogetACARecordURL(acaUrl) {
    itemCap = capId;
    if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

    var acaRecordUrl = "";
    var id1 = itemCap.ID1;
    var id2 = itemCap.ID2;
    var id3 = itemCap.ID3;
    var vCapM = aa.cap.getCap(itemCap).getOutput().getCapModel();

    acaRecordUrl = acaUrl + "/urlrouting.ashx?type=1000";
    acaRecordUrl += "&Module=" + vCapM.getModuleName();
    acaRecordUrl += "&capID1=" + id1 + "&capID2=" + id2 + "&capID3=" + id3;
    acaRecordUrl += "&agencyCode=" + aa.getServiceProviderCode();

    return acaRecordUrl;
}

function demogetACAEditRecordURL(acaUrl) {
    itemCap = capId;
    if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

    var acaRecordUrl = "";
    var id1 = itemCap.ID1;
    var id2 = itemCap.ID2;
    var id3 = itemCap.ID3;
    var vCapM = aa.cap.getCap(itemCap).getOutput().getCapModel();

    acaRecordUrl = acaUrl + "/urlrouting.ashx?type=1011";
    acaRecordUrl += "&Module=" + vCapM.getModuleName();
    acaRecordUrl += "&capID1=" + id1 + "&capID2=" + id2 + "&capID3=" + id3;
    acaRecordUrl += "&agencyCode=" + aa.getServiceProviderCode();

    return acaRecordUrl;
}

function demogetACATempRecordURL(acaUrl) {
    itemCap = capId;
    if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

    var acaRecordUrl = "";
    var id1 = itemCap.ID1;
    var id2 = itemCap.ID2;
    var id3 = itemCap.ID3;
    var vCapM = aa.cap.getCap(itemCap).getOutput().getCapModel();

    acaRecordUrl = acaUrl + "/urlrouting.ashx?type=1005";
    acaRecordUrl += "&Module=" + vCapM.getModuleName();
    acaRecordUrl += "&capID1=" + id1 + "&capID2=" + id2 + "&capID3=" + id3;
    acaRecordUrl += "&agencyCode=" + aa.getServiceProviderCode();

    return acaRecordUrl;
}

function demoSendAdditinalInfoRequiredForApp(comments) {
    try {
        var notificationType = "GS2_ADDITIONAL_INFORMATION_REQUIRED";
        var templateName = "GS2_ADDITIONAL_INFORMATION_REQUIRED";
        var alternateCapId = capId;
        var appReport = null;
        var cntArray = ["Applicant"]
        var sendTo = demogetEmailRecipients(cntArray);

        var capScriptModel = aa.cap.getCap(capId);
        var alias = ""
        if (capScriptModel.getSuccess()) {
            capType = capScriptModel.getOutput().getCapType();
            alias = capType.alias;
        }

        var actUserObj = aa.person.getUser(currentUserID).getOutput();
        var actByUserName = actUserObj.getFirstName() + ' ' + actUserObj.getLastName();
        var actByUserEmail = actUserObj.getEmail();
        var actByUserAgency = "DHS"; //actUserObj.getAgencyCode();
        var sBureauName = "Bureau of Human Services Licensing";
        if (wfComment) {
            comments = wfComment + "";
        }

        var acaRecordUrl = demogetACARecordURL(acaUrl);
        logDebug(acaRecordUrl);

        var emailParameters = aa.util.newHashtable();
        gs2.notification.getRecordParams4Notification(emailParameters);

        addParameter(emailParameters, "$$recordID$$", capIDString);
        //addParameter(emailParameters, "$$recordType$$", recordType);
        addParameter(emailParameters, "$$recordType$$", alias);
        //addParameter(emailParameters, "$$status$$",status);
        addParameter(emailParameters, "$$BureauName$$ ", sBureauName);
        addParameter(emailParameters, "$$AgencyName$$", actByUserAgency);
        addParameter(emailParameters, "$$acaRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$wfComment$$", comments);

        //logDebug("sendTo :::> "+sendTo+" appReport :::> "+appReport+" sysFromEmail :::> "+sysFromEmail+" emailParams :::> "+emailParameters)
        //emailSent = gcomSendNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        emailSent = demoSendEmailNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        logDebug("Email Sent -> " + emailSent)
    }
    catch (err) {
        logDebug("WARNING: demoSendAdditinalInfoRequiredForApp:" + err.message);
    }
}

function demoSendEmailNotification(sysFromEmail, sendTo, emailCC, templateName, emailParameters, appReport) {
    var emailSent = false;
    if (sendTo) {
        if (sendTo.indexOf("||") > 0) {
            emailTo = sendTo.split("||");
            for (e in emailTo) {
                if (emailTo[e]) {
                    emailSent = gs2.notification.sendNotification(sysFromEmail, emailTo[e], emailCC, templateName, emailParameters, appReport);
                }
            }
        } else {
            emailSent = gs2.notification.sendNotification(sysFromEmail, sendTo, emailCC, templateName, emailParameters, appReport);
        }
    }
    return emailSent;
}

/*
 * get customer contacts
*/
function demogetCustomerContacts() {
    var contactMap = aa.util.newHashMap();

    var capContactResult = aa.people.getCapContactByCapID(capId);
    if (capContactResult.getSuccess()) {
        var contacts = capContactResult.getOutput();
        for (c in contacts) {
            contactMap.put(contacts[c].getCapContactModel().getPeople().getContactType(), contacts[c]);
        }
    }

    return contactMap;
}

function demoSendApplicationSubmission() {
    try {
        var notificationType = "GS2_APPLICATION_INTAKE_AND_FEE_PAYMENT";
        var templateName = "GS2_APPLICATION_INTAKE_AND_FEE_PAYMENT";
        var alternateCapId = capId;
        var appReport = null;
        var cntArray = ["Applicant"]
        var sendTo = demogetEmailRecipients(cntArray);
        var signage = "Bureau of Human Services Licensing";
        var alias = ""
        var recordName = "";

        var capScriptModel = aa.cap.getCap(capId);
        if (capScriptModel.getSuccess()) {
            capType = capScriptModel.getOutput().getCapType();
            alias = capType.alias;
        }

        var acaRecordUrl = demogetACARecordURL(acaUrl);
        //var emailParams=notifyObj.getEmailParameters();
        var emailParameters = aa.util.newHashtable();
        gs2.notification.getRecordParams4Notification(emailParameters);

        addParameter(emailParameters, "$$RecordName$$", recordName);
        addParameter(emailParameters, "$$RecordID$$", capIDString);
        addParameter(emailParameters, "$$RecordType$$", alias);
        addParameter(emailParameters, "$$acaRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$signage$$", signage);


        //logDebug("sendTo :::> "+sendTo+" appReport :::> "+appReport+" sysFromEmail :::> "+sysFromEmail+" emailParams :::> "+emailParameters)
        //emailSent = gcomSendNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        emailSent = demoSendEmailNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        logDebug("Email Sent -> " + emailSent)
    }
    catch (err) {
        logDebug("WARNING: demoSendApplicationSubmission:" + err.message);
    }
}

function demoSendLicenseIssuance() {
    try {
        var notificationType = "GS2_PERMIT_ISSUED";
        var templateName = "GS2_PERMIT_ISSUED";
        var alternateCapId = capId;
        var appReport = null;
        var cntArray = ["Applicant"]
        var sendTo = demogetEmailRecipients(cntArray);
        var signage = "Bureau of Human Services Licensing";
        var alias = ""
        var recordName = "";

        itemCap = capId;
        if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

        var capScriptModel = aa.cap.getCap(itemCap);
        if (capScriptModel.getSuccess()) {
            capType = capScriptModel.getOutput().getCapType();
            alias = capType.alias;
        }

        var altIDString = itemCap.getCustomID();

        var acaRecordUrl = demogetACARecordURL(acaUrl);
        //var emailParams=notifyObj.getEmailParameters();
        var emailParameters = aa.util.newHashtable();
        gs2.notification.getRecordParams4Notification(emailParameters);
        addParameter(emailParameters, "$$RecordID$$", altIDString);
        addParameter(emailParameters, "$$RecordType$$", alias);
        addParameter(emailParameters, "$$acaRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$signage$$", signage);

        var repDocArray = getCertificateReport();
        if(repDocArray.length > 0) {
            appReport = repDocArray;
        }
        //logDebug("sendTo :::> "+sendTo+" appReport :::> "+appReport+" sysFromEmail :::> "+sysFromEmail+" emailParams :::> "+emailParameters)
        //emailSent = gcomSendNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        emailSent = demoSendEmailNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        logDebug("Email Sent -> " + emailSent)
    }
    catch (err) {
        logDebug("WARNING: demoSendLicenseIssuance:" + err.message);
    }
}

function demoSendInspectionScheduled() {
    try {
        var inspEmail = "";

        var mInspId = "" + aa.env.getValue("inspId");
        logDebug("mInspId---> " + mInspId)
        var inspObject = aa.inspection.getInspection(capId, mInspId).getOutput();
        if (inspObject) {
			var inspTyp = "";
			var inspStatus = "";
			var inspName = "";
			var inspComment = "";

            inspTyp = inspObject.getInspectionType();
            var thisArr = new Array();

            logDebug("INSPECTION TYPE :::> " + inspTyp)
            var custField = AInfo["Is the Fixed Extinguishing Systems connected to a Fire Alarm?"] == "Yes";
            if (publicUser) {
            }

            inspStatus = inspObject.getInspectionStatus();
            inspSchedDate = inspObject.getScheduledDate().getMonth() + "/" + inspObject.getScheduledDate().getDayOfMonth() + "/" + inspObject.getScheduledDate().getYear()
            logDebug("inspTyp:  " + inspTyp + "  inspStatus: " + inspStatus + " inspSchedDate: " + inspSchedDate);
        }

        var notificationType = "INSPECTION_SCHEDULED";
        var templateName = "INSPECTION_SCHEDULED";
        var alternateCapId = capId;
        var appReport = null;
        var cntArray = ["Applicant"]
        var sendTo = demogetEmailRecipients(cntArray);
        var signage = "Bureau of Human Services Licensing";
        var alias = ""
        var recordName = "";

        var capScriptModel = aa.cap.getCap(capId);
        if (capScriptModel.getSuccess()) {
            capType = capScriptModel.getOutput().getCapType();
            alias = capType.alias;
        }

        var acaRecordUrl = demogetACARecordURL(acaUrl);
        //var emailParams=notifyObj.getEmailParameters();
        var emailParameters = aa.util.newHashtable();
        gs2.notification.getRecordParams4Notification(emailParameters);
        addParameter(emailParameters, "$$recordID$$", capIDString);
        addParameter(emailParameters, "$$RecordType$$", alias);
        addParameter(emailParameters, "$$InspectionType$$", inspTyp);
        addParameter(emailParameters, "$$InspectionStatus$$", inspStatus);
        addParameter(emailParameters, "$$InspectionDate$$", inspSchedDate);
        addParameter(emailParameters, "$$acaRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$signage$$", signage);

        //logDebug("sendTo :::> "+sendTo+" appReport :::> "+appReport+" sysFromEmail :::> "+sysFromEmail+" emailParams :::> "+emailParameters)
        //emailSent = gcomSendNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        emailSent = demoSendEmailNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        logDebug("Email Sent -> " + emailSent)
    }
    catch (err) {
        logDebug("WARNING: demoSendInspectionScheduled:" + err.message);
    }
}

function demoSendComplaintSubmission() {
    try {
        var notificationType = "GS2_COMPLAINT_INTAKE";
        var templateName = "GS2_COMPLAINT_INTAKE";
        var alternateCapId = capId;
        var appReport = null;
        var cntArray = ["Complainant"]
        var sendTo = demogetEmailRecipients(cntArray);
        var signage = "Bureau of Human Services Licensing";
        var alias = ""
        var recordName = "";

        var capScriptModel = aa.cap.getCap(capId);
        if (capScriptModel.getSuccess()) {
            capType = capScriptModel.getOutput().getCapType();
            alias = capType.alias;
        }

        var acaRecordUrl = demogetACARecordURL(acaUrl);
        //var emailParams=notifyObj.getEmailParameters();
        var emailParameters = aa.util.newHashtable();
        gs2.notification.getRecordParams4Notification(emailParameters);

        addParameter(emailParameters, "$$RecordName$$", recordName);
        addParameter(emailParameters, "$$RecordID$$", capIDString);
        addParameter(emailParameters, "$$RecordType$$", alias);
        addParameter(emailParameters, "$$acaRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$signage$$", signage);


        //logDebug("sendTo :::> "+sendTo+" appReport :::> "+appReport+" sysFromEmail :::> "+sysFromEmail+" emailParams :::> "+emailParameters)
        //emailSent = gcomSendNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        emailSent = demoSendEmailNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        logDebug("Email Sent -> " + emailSent)
    }
    catch (err) {
        logDebug("WARNING: demoSendComplaintSubmission:" + err.message);
    }
}

function demoSendIncidentSubmission() {
    try {
        var notificationType = "GS2_INCIDENT_INTAKE";
        var templateName = "GS2_INCIDENT_INTAKE";
        var alternateCapId = capId;
        var appReport = null;
        var cntArray = ["Facility", "Applicant"];
        var sendTo = demogetEmailRecipients(cntArray);
        var signage = "Bureau of Human Services Licensing";
        var alias = ""
        var recordName = "";

        var capScriptModel = aa.cap.getCap(capId);
        if (capScriptModel.getSuccess()) {
            capType = capScriptModel.getOutput().getCapType();
            alias = capType.alias;
        }

        var acaRecordUrl = demogetACARecordURL(acaUrl);
        //var emailParams=notifyObj.getEmailParameters();
        var emailParameters = aa.util.newHashtable();
        gs2.notification.getRecordParams4Notification(emailParameters);

        addParameter(emailParameters, "$$RecordName$$", recordName);
        addParameter(emailParameters, "$$RecordID$$", capIDString);
        addParameter(emailParameters, "$$RecordType$$", alias);
        addParameter(emailParameters, "$$acaRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$signage$$", signage);


        //logDebug("sendTo :::> "+sendTo+" appReport :::> "+appReport+" sysFromEmail :::> "+sysFromEmail+" emailParams :::> "+emailParameters)
        //emailSent = gcomSendNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        emailSent = demoSendEmailNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        logDebug("Email Sent -> " + emailSent)
    }
    catch (err) {
        logDebug("WARNING: demoSendIncidentSubmission:" + err.message);
    }
}

function demoSendExpirationNotice(renewalCapId) {
    try {
        var notificationType = "GS2_EXPIRATION_NOTICE";
        var templateName = "GS2_EXPIRATION_NOTICE";
        var alternateCapId = capId;
        var appReport = null;
        var cntArray = ["Facility", "Applicant"];
        var sendTo = demogetEmailRecipients(cntArray);
        var signage = "Bureau of Human Services Licensing";
        var alias = ""
        var recordName = "";

        var capScriptModel = aa.cap.getCap(capId);
        if (capScriptModel.getSuccess()) {
            capType = capScriptModel.getOutput().getCapType();
            alias = capType.alias;
        }

        var b1ExpDate = "";
        var renewalAltIDString = "";
        b1ExpResult = aa.expiration.getLicensesByCapID(capId);
        if (b1ExpResult.getSuccess()) {
            var b1Exp = b1ExpResult.getOutput();
            var expDate = b1Exp.getExpDate();
            if (expDate) b1ExpDate = expDate.getMonth() + "/" + expDate.getDayOfMonth() + "/" + expDate.getYear();

            if (renewalCapId) {
                renewalAltIDString = renewalCapId.getCustomID();
            } else {
                var renewalCapArray = aa.cap.getProjectByMasterID(capId, "Renewal", "").getOutput();
                if (renewalCapArray.length > 0) {
                    renewalCapId = renewalCapArray[0].getCapID();
                    var id1 = renewalCapId.getID1();
                    var id2 = renewalCapId.getID2();
                    var id3 = renewalCapId.getID3();

                    var result = aa.cap.getCapIDModel(id1, id2, id3).getOutput();
                    renewalAltIDString = renewalCapId.getCustomID();
                }
            }
        }

        logDebug(b1ExpDate);
        if (renewalAltIDString) {

        } else {
            renewalAltIDString = "Record";
        }
        logDebug(renewalAltIDString);

        var acaRecordUrl = demogetACATempRecordURL(acaUrl);
        logDebug(acaRecordUrl);
        var acaRenewalRecordUrl = demogetACARecordURL(acaUrl, renewalCapId);
        logDebug(acaRenewalRecordUrl);

        //var emailParams=notifyObj.getEmailParameters();
        var emailParameters = aa.util.newHashtable();
        gs2.notification.getRecordParams4Notification(emailParameters);

        addParameter(emailParameters, "$$RecordName$$", recordName);
        addParameter(emailParameters, "$$RecordID$$", capIDString);
        addParameter(emailParameters, "$$RecordType$$", alias);
        addParameter(emailParameters, "$$acaRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$expirationdate$$", b1ExpDate);
        addParameter(emailParameters, "$$RenewalRecordId$$", renewalAltIDString);
        addParameter(emailParameters, "$$acaRenewalRecordUrl$$", acaRenewalRecordUrl);
        addParameter(emailParameters, "$$signage$$", signage);


        //logDebug("sendTo :::> "+sendTo+" appReport :::> "+appReport+" sysFromEmail :::> "+sysFromEmail+" emailParams :::> "+emailParameters)
        //emailSent = gcomSendNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        emailSent = demoSendEmailNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        logDebug("Email Sent -> " + emailSent)
    }
    catch (err) {
        logDebug("WARNING: demoSendExpirationNotice:" + err.message);
    }
}

function demoSendPocNotice() {
    try {
        var notificationType = "GS2_POC_NOTICE";
        var templateName = "GS2_POC_NOTICE";
        var alternateCapId = capId;
        var appReport = null;
        var cntArray = ["Facility", "Applicant"];
        var sendTo = demogetEmailRecipients(cntArray);
        var signage = "Bureau of Human Services Licensing";
        var alias = ""
        var recordName = "";

        itemCap = capId;
        if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

        var capScriptModel = aa.cap.getCap(itemCap);
        if (capScriptModel.getSuccess()) {
            capType = capScriptModel.getOutput().getCapType();
            alias = capType.alias;
        }
        var altIDString = itemCap.getCustomID();

        var acaRecordUrl = demogetACAEditRecordURL(acaUrl, itemCap);
        logDebug(acaRecordUrl);

        //var emailParams=notifyObj.getEmailParameters();
        var emailParameters = aa.util.newHashtable();
        gs2.notification.getRecordParams4Notification(emailParameters);

        addParameter(emailParameters, "$$RecordName$$", recordName);
        addParameter(emailParameters, "$$RecordID$$", capIDString);
        addParameter(emailParameters, "$$PocRecordId$$", altIDString);
        addParameter(emailParameters, "$$RecordType$$", alias);
        addParameter(emailParameters, "$$acaRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$acaPocRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$signage$$", signage);

        var sPocDueDate = dateAdd(new Date(),15);
        addParameter(emailParameters, "$$PocDueDate$$", sPocDueDate);

        var repDocArray = getCitationReport();
        if(repDocArray.length > 0) {
            appReport = repDocArray;
        }

        //logDebug("sendTo :::> "+sendTo+" appReport :::> "+appReport+" sysFromEmail :::> "+sysFromEmail+" emailParams :::> "+emailParameters)
        //emailSent = gcomSendNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        emailSent = demoSendEmailNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        logDebug("Email Sent -> " + emailSent)
    }
    catch (err) {
        logDebug("WARNING: demoSendPocNotice:" + err.message);
    }
}


function democreateAddressUsingFacilityContact() {
    logDebug("ENTER: democreateAddressUsingFacilityContact");
    try {
        var propAddr = {};

        var contactMap = aa.util.newHashMap();

        var capContactResult = aa.people.getCapContactByCapID(capId);
        if (capContactResult.getSuccess()) {
            var contacts = capContactResult.getOutput();
            for (c in contacts) {
                var capContactScriptModel = contacts[c];
                //gs2.common.debugObject(capContactScriptModel);

                var capContactModel = capContactScriptModel.getCapContactModel();
                //logDebug("capContactModel.getContactType() " + capContactModel.getContactType());
                if (capContactModel.getContactType() == "Facility") {
                    var fvContactAddress = demogetLatestContactAddress(capContactModel, "Mailing");

                    //gs2.common.debugObject(fvContactAddress)

                    var sSteetNum = gs2.common.isNull(fvContactAddress.getHouseNumberStart() + "", "") + "";
                    var sPreDirection = gs2.common.isNull(fvContactAddress.getStreetDirection() + "", "") + "";
                    var sSteetName = gs2.common.isNull(fvContactAddress.getAddressLine1() + "", "") + "";
                    var sSteetType = gs2.common.isNull(fvContactAddress.getStreetSuffixDirection() + "", "") + "";
                    var sPostDirection = gs2.common.isNull(fvContactAddress.getStreetSuffix() + "", "") + "";
                    var sCity = gs2.common.isNull(fvContactAddress.getCity() + "", "") + "";
                    var sState = gs2.common.isNull(fvContactAddress.getState() + "", "") + "";
                    var sZip = gs2.common.isNull(fvContactAddress.getZip() + "", "") + "";

                    propAddr.StreetNo = sSteetNum + "";
                    propAddr.UnitNumber = "";
                    propAddr.UnitNumber = "";
                    propAddr.BuildingNumber = "";
                    propAddr.StreetName = sSteetName + "";
                    propAddr.City = sCity + "";
                    propAddr.State = sState;
                    propAddr.Zip = sZip + "";
                    propAddr.StreetSuffix = sPostDirection + "";
                    propAddr.StreetPrefix = sPreDirection + "";
                    propAddr.StreetType = sSteetType + "";
                    break;
                }
            }
        }

        var vAddrModel = aa.proxyInvoker.newInstance("com.accela.aa.aamain.address.AddressModel").getOutput();
        //debugObject(vAddrModel);
        vAddrModel.setCapID(capId);
        vAddrModel.setPrimaryFlag("Y")
        if (gs2.common.isNull(propAddr.StreetNo + "", "") != "") {
            vAddrModel.setHouseNumberStart(parseInt(propAddr.StreetNo + ""));
        }
        //vAddrModel.setUnitStart(propAddr.UnitNumber + "");
        //vAddrModel.setUnitEnd(propAddr.UnitNumber + "");
        vAddrModel.setStreetSuffix(propAddr.StreetSuffix + "");
        vAddrModel.setStreetDirection(propAddr.StreetPrefix + "");
        vAddrModel.setStreetSuffixdirection(propAddr.StreetType + "");
        //vAddrModel.setLevelPrefix(propAddr.BuildingNumber + "");
        vAddrModel.setStreetName(propAddr.StreetName + "");
        vAddrModel.setCity(propAddr.City + "");
        vAddrModel.setState(propAddr.State + "");
        vAddrModel.setResState(propAddr.State + "");
        vAddrModel.setZip(propAddr.Zip + "")
        vAddrModel.setServiceProviderCode(aa.getServiceProviderCode());
        vAddrModel.setAuditDate(new java.util.Date());
        vAddrModel.setAuditID(currentUserID);
        vAddrModel.setAuditStatus("A");

        var s = aa.address.createAddress(vAddrModel);
    }
    catch (err) {
        logDebug("**WARNING in democreateAddressUsingFacilityContact:" + err.message);
    }
    logDebug("EXIT: democreateAddressUsingFacilityContact");
}

function demogetLatestContactAddress(iContact) {
    var useAddressType = false;
    var addressType;

    if (arguments.length == 2) {
        addressType = arguments[1];
        useAddressType = true;
    }

    var fvContactAddress;
    var fvAddressResult = aa.address.getContactAddressListByCapContact(iContact).getOutput();
    var latestDate = new Date(0);

    if (fvAddressResult && fvAddressResult.length > 0) {
        for (rr in fvAddressResult) {
            addressAuditDate = new Date(fvAddressResult[rr].getAuditDate().getEpochMilliseconds());

            if (addressAuditDate > latestDate && fvAddressResult[rr].getExpirationDate() == null && (!useAddressType || addressType == fvAddressResult[rr].getContactAddressModel().getAddressType())) {
                latestDate = new Date(addressAuditDate);
                fvContactAddress = fvAddressResult[rr];
            }
        }

        if (fvContactAddress) {
            var fvContactAddressModel = fvContactAddress.contactAddressModel;
            logDebug("Latest " + fvContactAddressModel.getAddressType() + " address found (Address ID " + fvContactAddress.addressID + ") for contact " + iContact.getPeople().contactSeqNumber + " ref num " + iContact.refContactNumber + " with audit date " + addressAuditDate);
        }
    }
    return fvContactAddress;
}

function demoSendPocEvidence() {
    try {
        var notificationType = "GS2_POC_EVIDENCE";
        var templateName = "GS2_POC_EVIDENCE";
        var alternateCapId = capId;
        var appReport = null;
        var cntArray = ["Facility", "Applicant"];
        var sendTo = demogetEmailRecipients(cntArray);
        var signage = "Bureau of Human Services Licensing";
        var alias = ""
        var recordName = "";

        itemCap = capId;
        if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

        var capScriptModel = aa.cap.getCap(itemCap);
        if (capScriptModel.getSuccess()) {
            capType = capScriptModel.getOutput().getCapType();
            alias = capType.alias;
        }
        var altIDString = itemCap.getCustomID();

        var acaRecordUrl = demogetACARecordURL(acaUrl, itemCap);
        logDebug(acaRecordUrl);
        
        //var emailParams=notifyObj.getEmailParameters();
        var emailParameters = aa.util.newHashtable();
        gs2.notification.getRecordParams4Notification(emailParameters);

        addParameter(emailParameters, "$$RecordName$$", recordName);
        addParameter(emailParameters, "$$RecordID$$", capIDString);
        addParameter(emailParameters, "$$PocRecordId$$", altIDString);
        addParameter(emailParameters, "$$RecordType$$", alias);
        addParameter(emailParameters, "$$acaRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$acaPocRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$signage$$", signage);

        //logDebug("sendTo :::> "+sendTo+" appReport :::> "+appReport+" sysFromEmail :::> "+sysFromEmail+" emailParams :::> "+emailParameters)
        //emailSent = gcomSendNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        emailSent = demoSendEmailNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        logDebug("Email Sent -> " + emailSent)
    }
    catch (err) {
        logDebug("WARNING: demoSendPocNotice:" + err.message);
    }
}

function demoSendAdditinalInfoRequiredForPoc(comments) {
    try {
        var notificationType = "GS2_ADDITIONAL_INFORMATION_REQUIRED";
        var templateName = "GS2_ADDITIONAL_INFORMATION_REQUIRED";
        var alternateCapId = capId;
        var appReport = null;
        var cntArray = ["Applicant"]
        var sendTo = demogetEmailRecipients(cntArray);

        var capScriptModel = aa.cap.getCap(capId);
        var alias = ""
        if (capScriptModel.getSuccess()) {
            capType = capScriptModel.getOutput().getCapType();
            alias = capType.alias;
        }

        var actUserObj = aa.person.getUser(currentUserID).getOutput();
        var actByUserName = actUserObj.getFirstName() + ' ' + actUserObj.getLastName();
        var actByUserEmail = actUserObj.getEmail();
        var actByUserAgency = "DHS"; //actUserObj.getAgencyCode();
        var sBureauName = "Bureau of Human Services Licensing";
        if (wfComment) {
            comments = wfComment + "";
        }

        var acaRecordUrl = demogetACAEditRecordURL(acaUrl);
        logDebug(acaRecordUrl);

        var emailParameters = aa.util.newHashtable();
        gs2.notification.getRecordParams4Notification(emailParameters);

        addParameter(emailParameters, "$$recordID$$", capIDString);
        //addParameter(emailParameters, "$$recordType$$", recordType);
        addParameter(emailParameters, "$$recordType$$", alias);
        //addParameter(emailParameters, "$$status$$",status);
        addParameter(emailParameters, "$$BureauName$$ ", sBureauName);
        addParameter(emailParameters, "$$AgencyName$$", actByUserAgency);
        addParameter(emailParameters, "$$acaRecordUrl$$", acaRecordUrl);
        addParameter(emailParameters, "$$wfComment$$", comments);

        //logDebug("sendTo :::> "+sendTo+" appReport :::> "+appReport+" sysFromEmail :::> "+sysFromEmail+" emailParams :::> "+emailParameters)
        //emailSent = gcomSendNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        emailSent = demoSendEmailNotification(sysFromEmail, sendTo, "", templateName, emailParameters, appReport);
        logDebug("Email Sent -> " + emailSent)
    }
    catch (err) {
        logDebug("WARNING: demoSendAdditinalInfoRequiredForApp:" + err.message);
    }
}
function getCitationReport() {
    var reports = new Array();
    if(false) {
        var rParams = aa.util.newHashMap();
        rParams.put("RECORD_ID", capIDString);
        rParams.put("Contact Type", "Facility");
        var rFile = gs2.util.generateReport(capId, "License Form", "Licenses", rParams);
        logDebug(rFile);
        
        if (rFile) {
            reports.push(rFile);
        }
    } else {
        //HardCode Saved With Record
        var docRecNum = "REC20-00000-0004S";
        var docCapId = aa.cap.getCapID(docRecNum).getOutput();
        var docs = gs2.doc.getAttachedDocumentByCategory("Executive summary", docCapId);
        var reports = new Array();
        for (r in docs) {
            reports.push(docs[r]);
        }
    }
    return reports;
}
function getCertificateReport() {
    var reports = new Array();

    if(false) {
        var rParams = aa.util.newHashMap();
        rParams.put("RECORD_ID", capIDString);
        rParams.put("Contact Type", "Facility");
        var rFile = gs2.util.generateReport(capId, "License Form", "Licenses", rParams);
        logDebug(rFile);
        
        if (rFile) {
            reports.push(rFile);
        }
    } else {
        //HardCode Saved With Record
        var docRecNum = "REC20-00000-0004S";
        var docCapId = aa.cap.getCapID(docRecNum).getOutput();
        var docs = gs2.doc.getAttachedDocumentByCategory("Citation", docCapId);
        for (r in docs) {
            reports.push(docs[r]);
        }
    }
    return reports;
}
