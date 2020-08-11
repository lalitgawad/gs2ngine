gs2.notification = {};
(function () {

    function test() {
        gs2.log('GS2_NOTIFICATION Looks good');
        return true;
    }

    function initializeCommAsyncObject() {
        try {
            commProcAsyncObj = new commProcessingAsyncOBJ();
            logDebug("commProcAsyncObj " + commProcAsyncObj);
        }
        catch (err) {
            gs2.common.handleError(err, "");
        }
    }

    function getContactParams4Notification(params, conType) {
        // pass in a hashtable and it will add the additional parameters to the table
        // pass in contact type to retrieve

        contactArray = gs2.contact.getContactArrayWithTemplate(); //Opt out email option

        for (ca in contactArray) {
            thisContact = contactArray[ca];

            if (thisContact["contactType"] == conType) {
                //Opt out email option
                if (conType != "Applicant") {
                    var vTemplates = thisContact.templates;
                    if (vTemplates && vTemplates["EMAIL OPTION.Do not receive Email Notifications"] == "CHECKED")
                        continue;
                }

                conType = conType.toLowerCase();

                gs2.common.addParameter(params, "$$" + conType + "LastName$$", thisContact["lastName"]);
                gs2.common.addParameter(params, "$$" + conType + "FirstName$$", thisContact["firstName"]);
                gs2.common.addParameter(params, "$$" + conType + "MiddleName$$", thisContact["middleName"]);
                gs2.common.addParameter(params, "$$" + conType + "BusinesName$$", thisContact["businessName"]);
                gs2.common.addParameter(params, "$$" + conType + "ContactSeqNumber$$", thisContact["contactSeqNumber"]);
                gs2.common.addParameter(params, "$$" + conType + "$$", thisContact["contactType"]);
                gs2.common.addParameter(params, "$$" + conType + "Relation$$", thisContact["relation"]);
                gs2.common.addParameter(params, "$$" + conType + "Phone1$$", thisContact["phone1"]);
                gs2.common.addParameter(params, "$$" + conType + "Phone2$$", thisContact["phone2"]);
                gs2.common.addParameter(params, "$$" + conType + "Email$$", thisContact["email"]);
                gs2.common.addParameter(params, "$$" + conType + "AddressLine1$$", thisContact["addressLine1"]);
                gs2.common.addParameter(params, "$$" + conType + "AddressLine2$$", thisContact["addressLine2"]);
                gs2.common.addParameter(params, "$$" + conType + "City$$", thisContact["city"]);
                gs2.common.addParameter(params, "$$" + conType + "State$$", thisContact["state"]);
                gs2.common.addParameter(params, "$$" + conType + "Zip$$", thisContact["zip"]);
                gs2.common.addParameter(params, "$$" + conType + "Fax$$", thisContact["fax"]);
                gs2.common.addParameter(params, "$$" + conType + "Notes$$", thisContact["notes"]);
                gs2.common.addParameter(params, "$$" + conType + "Country$$", thisContact["country"]);
                gs2.common.addParameter(params, "$$" + conType + "FullName$$", thisContact["fullName"]);
            }
        }

        return params;
    }

    function getRecordParams4Notification(params) {

        // pass in a hashtable and it will add the additional parameters to the table



        gs2.common.addParameter(params, "$$altID$$", capIDString);

        gs2.common.addParameter(params, "$$capName$$", capName);

        gs2.common.addParameter(params, "$$capStatus$$", capStatus);

        gs2.common.addParameter(params, "$$fileDate$$", fileDate);

        //gs2.common.addParameter(params, "$$workDesc$$", workDescGet(capId));

        gs2.common.addParameter(params, "$$balanceDue$$", "$" + parseFloat(balanceDue).toFixed(2));



        return params;

    }


    //Updated the below function to Test if the emails are being sent correctly
    function sendNotification(emailFrom, emailTo, emailCC, templateName, params, reportFile) {
        try {
            var verifyActualEmail = gs2.common.GetLookupVal("GS2_CONFIG", "VERIFY_ACTUAL_EMAIL_FLAG");
            if (!verifyActualEmail || verifyActualEmail.length == 0 || !(verifyActualEmail.indexOf("@") > 0)) {
                var emailsToSent = filterEmailsforLowerEnvironments(String(emailTo));
            } else {
                var emailsToSent = (String(emailTo)).replace(/,/g, ";");
                var emails = emailsToSent.split(";");
                var returnEmails = "";
                for (var x in emails) {
                    var email = emails[x];
                    returnEmails += "verify_" + email + ";";
                }
                emails = verifyActualEmail.split(",");
                for (var x in emails) {
                    returnEmails += emails[x] + ";";
                }
                emailsToSent = returnEmails;
            }

            if (emailsToSent.length == 0) {
                logDebug("Failed to send mail. - No valid emails in dev/test environments.");
                return false;
            }
            var emailsToSentCC = filterEmailsforLowerEnvironments(String(emailCC));

            var itemCap = capId;
            if (arguments.length == 7) itemCap = arguments[6]; // use cap ID specified in args

            var id1 = itemCap.ID1;
            var id2 = itemCap.ID2;
            var id3 = itemCap.ID3;

            var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);


            var result = null;
            result = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailsToSent, emailsToSentCC, templateName, params, capIDScriptModel, reportFile);
            if (result.getSuccess()) {
                logDebug("Sent email successfully!!");
                return true;
            }
            else {
                logDebug("Failed to send mail. - " + result.getErrorType());
                return false;
            }
        }
        catch (ex) {
            logDebug("**** Error in sendNotification : " + ex.message);
        }
    }

    function sendNotificationForTaskSpeciInfo(emailFrom, emailTo, emailCC, templateName, params, reportFile, taskInfoVariable) {
        try {
            var notTrmplateBiz = aa.proxyInvoker.newInstance("com.accela.aa.communication.business.NotificationTemplateBusiness").getOutput();
            var notificationTemplate = notTrmplateBiz.getNotificationTemplateModel(aa.getServiceProviderCode(), templateName);
            var commBiz = aa.proxyInvoker.newInstance("com.accela.aa.communication.CommunicationImpl").getOutput();

            commBiz.updateEmailTemplateModel(notificationTemplate.getEmailTemplateModel(), emailFrom, emailTo, emailCC, null, null);

            //sendEmailAndUploadDocument
            var triggerEvent = notificationTemplate.getTemplateName();
            var emailTemplate = notificationTemplate.getEmailTemplateModel();
            //logDebug(emailTemplate.getContentText());

            var paramvalue = params.get(taskInfoVariable);
            var newContent = (emailTemplate.getContentText() + "").replace(taskInfoVariable, paramvalue);
            emailTemplate.setContentText(newContent);
            //gs2.common.debugObject(emailTemplate);
            //logDebug(emailTemplate.getContentText());

            var entityModel = aa.proxyInvoker.newInstance("com.accela.orm.model.communication.MessageEntityModel").getOutput();
            entityModel.setEntityId(capId.getCustomID());
            entityModel.setEntityType("RECORD");
            var relatedEntities = new java.util.ArrayList();
            relatedEntities.add(entityModel);

            var vFosParams = new Array();
            for (r in reportFile) {

                var vRFA = new Array();
                vRFA.push(reportFile[r]);

                var vFile = aa.proxyInvoker.newInstance("java.io.File", vRFA).getOutput();
                vFosParams.push(vFile);
            }
            var isSendEmailSuccess = commBiz.sendMessage(notificationTemplate, params, vFosParams, triggerEvent, relatedEntities);
            /*
            if (isSendEmailSuccess) {
                var from = emailTemplate.getFrom();
                var to = emailTemplate.getTo();
                var cc = emailTemplate.getCc();
                var emailSubject = emailTemplate.getTitle();
                var emailContent = emailTemplate.getContentText();
                var docBiz = aa.proxyInvoker.newInstance("com.accela.aa.ads.ads.DocumentBusiness").getOutput();
                docBiz.saveEmailAsDocument(from, to, cc, emailSubject, emailContent, reportFile, capId, currentUserID, emailTemplate);
            }
            */
        }
        catch (err) {
            logDebug("A JavaScript Error occurred: sendNotificationForTaskSpeciInfo: " + err.message);
        }
    }


    function getACARecordURL(acaUrl) {

        var acaRecordUrl = "";
        var id1 = capId.ID1;
        var id2 = capId.ID2;
        var id3 = capId.ID3;

        acaRecordUrl = acaUrl + "/urlrouting.ashx?type=1000";
        acaRecordUrl += "&Module=" + cap.getCapModel().getModuleName();
        acaRecordUrl += "&capID1=" + id1 + "&capID2=" + id2 + "&capID3=" + id3;
        acaRecordUrl += "&agencyCode=" + aa.getServiceProviderCode();

        return acaRecordUrl;
    }
    function getACARecordParam4Notification(params, acaUrl) {
        // pass in a hashtable and it will add the additional parameters to the table

        var itemCap = capId;
        if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args

        gs2.common.addParameter(params, "$$acaRecordUrl$$", getACARecordURL(acaUrl, itemCap));

        return params;
    }

    function filterEmailsforLowerEnvironments(emailTo) {
        try {
            if (emailTo.length > 0) {
                var returnEmails = "";
                emailTo = emailTo.replace(/,/g, ";");
                var emails = emailTo.split(";");

                var restrictedDomains = gs2.common.GetLookupVal("GS2_CONFIG", "RESTRICTED_EMAIL_DOMAINS");

                if (restrictedDomains.length == 0)
                    return (emailTo);

                logDebug("restrictedDomains = " + restrictedDomains);
                var validEmailDomains = restrictedDomains.split(",");

                for (var x in emails) {
                    var email = emails[x];
                    var domain = email.split("@")[1];
                    var isValid = false;

                    for (var y in validEmailDomains) {
                        if (domain.toUpperCase() == validEmailDomains[y].toUpperCase()) {
                            isValid = true;
                            break;
                        }
                    }
                    if (isValid == true) {
                        returnEmails += email + ";";
                    }
                }
                return (returnEmails);
            }
            return ("");
        }
        catch (ex) {
            logDebug("**** Error in filterEmailsforLowerEnvironments : " + ex.message);
        }
    }

    gs2.notification.test = test;
    gs2.notification.initializeCommAsyncObject = initializeCommAsyncObject;
    gs2.notification.getContactParams4Notification = getContactParams4Notification;
    gs2.notification.getRecordParams4Notification = getRecordParams4Notification;
    gs2.notification.sendNotification = sendNotification;
    gs2.notification.sendNotificationForTaskSpeciInfo = sendNotificationForTaskSpeciInfo;
    gs2.notification.getACARecordURL = getACARecordURL;
    gs2.notification.getACARecordParam4Notification = getACARecordParam4Notification;
    gs2.notification.filterEmailsforLowerEnvironments = filterEmailsforLowerEnvironments;


})();

