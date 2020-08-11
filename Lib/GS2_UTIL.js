gs2.util = {};
(function () {

    function test() {
        gs2.log('GS2_UTIL Looks good');
        return true;
    }

    //Function to get a Meeting by Type.
    function getMeetingByType(ipMeetingType) {
        var vCapID = null;
        if (typeof (capId) != "undefined")
            vCapID = capId;
        if (arguments.length > 1)
            vCapID = arguments[1];
        if (!vCapID)
            return null;

        var vMeetings = aa.meeting.getMeetingsByCAP(vCapID, false).getOutput();
        var opMeeting = null;
        for (var vCounter = 0; vCounter < vMeetings.size() ; vCounter++) {
            var vMeeting = vMeetings.get(vCounter).getMeeting();
            if (vMeeting.meetingType == ipMeetingType) {
                opMeeting = vMeeting;
                break;
            }
        }
        return opMeeting;
    }

    /**
     * Gets Previous business day to a date based on calendar
     * @param {Date} dDate - The date for which business day to be addded
     * @param {Number} calendarID - The Id of the Business calendar
     * @returns {Date} dDate- New date
     */
    function getPrevBusinessDay(dDate, calendarID) {
        dDate = convertDate(dDate);
        dDate.setDate(dDate.getDate() - 1);
        var calEvents = aa.calendar.getEventSeriesByCalendarID(calendarID, dDate.getFullYear(), dDate.getMonth() + 1).getOutput();
        for (var i in calEvents) {
            var calEvent = calEvents[i];
            var eventStrDate = calEvent.getStartDate();
            if (eventStrDate.getDate() == dDate.getDate() && isAgencyHoliday(calEvent.getEventType()))
                return getPrevBusinessDay(dDate, calendarID);
        }
        return dDate;
    }

    /**
     * Gets next business day to a date based on calendar
     * @param {Date} dDate - The date for which business day to be addded
     * @param {Number} calendarID - The Id of the Business calendar
     * @returns {Date} dDate- New date
     */
    function getNextBusinessDay(dDate, calendarID) {
        dDate = convertDate(dDate);
        dDate.setDate(dDate.getDate() + 1);
        var calEvents = aa.calendar.getEventSeriesByCalendarID(calendarID, dDate.getFullYear(), dDate.getMonth() + 1).getOutput();
        for (var i in calEvents) {
            var calEvent = calEvents[i];
            var eventStrDate = calEvent.getStartDate();
            if (eventStrDate.getDate() == dDate.getDate() && isAgencyHoliday(calEvent.getEventType()))
                return getNextBusinessDay(dDate, calendarID);
        }
        return dDate;
    }

    //check if it's an agency holiday
    function isServCodeHoliday(givenDate) {
        var calendarID = 2;
        var calEvents = aa.calendar.getEventSeriesByCalendarID(calendarID, givenDate.getFullYear(), givenDate.getMonth() + 1).getOutput();
        for (var i in calEvents) {
            var calEvent = calEvents[i];
            var eventStrDate = calEvent.getStartDate();
            if ((eventStrDate.getDate() == givenDate.getDate() && calEvent.getEventType() == 'HOLIDAY') || (eventStrDate.getDate() == givenDate.getDate() && calEvent.getEventType() == 'WEEKEND')) {
                return true;
            }
        }
        return false;
    }


    function isUserAvailable(ipUser, ipDate) {
        var opResult = true;
        var vDt = new Date(ipDate);
        var vMonth = vDt.getMonth() + 1;
        var vMonthStr = vMonth.toString();
        if (vMonth < 10)
            vMonthStr = "0" + vMonthStr;
        var vDate = vDt.getDate();
        var vDateStr = vDate.toString();
        if (vDate < 10)
            vDateStr = "0" + vDateStr;
        var vDtStr = vDt.getFullYear().toString() + "-" + vMonthStr + "-" + vDateStr;
        var vDtStart = vDtStr + " 00:00:00.000";
        var vDtEnd = vDtStr + " 23:59:00.000";

        var vSQL = "select count(1) as \"COUNT\" from CALENDAR_EVENT where SERV_PROV_CODE = '" + aa.getServiceProviderCode() + "' and CALENDAR_ID = (select CALENDAR_ID from CALENDAR where SERV_PROV_CODE = '" + aa.getServiceProviderCode() + "' and CALENDAR_TYPE = 'USER' and USER_ID = '" + ipUser + "' and REC_STATUS = 'A') and EVENT_TYPE = 'Block Out' and REC_STATUS = 'A' and START_DATE = '" + vDtStart + "' and END_DATE = '" + vDtEnd + "'";
        var vResult = executeSelectQuery(vSQL, "COUNT");
        if (vResult && vResult.length > 0 && vResult[0]["COUNT"] > 0)
            opResult = false;
        return opResult;
    }


    //get user calendar ID by userID
    function getUserCalendarByUserID(userID) {
        var calID = null;
        var sql = "SET NOCOUNT ON;SELECT CALENDAR_ID FROM CALENDAR WHERE CALENDAR_TYPE = 'USER' AND USER_ID = '" + userID + "';";
        try {
            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null)
                .getOutput();
            var ds = initialContext.lookup("java:/AA");
            conn = ds.getConnection();
            sStmt = conn.prepareStatement(sql);
            rSet = sStmt.executeQuery();
            while (rSet.next()) {
                calID = parseInt(rSet.getString("CALENDAR_ID"));
                break;
            }
            closeDBQueryObject(rSet, sStmt, conn);
        } catch (vError) {
            logDebug("Runtime error occurred: " + vError);
        }
        return calID;
    }

    /**
     * To close DB Query Object created in function
     * @param {object} rSet - Database record set
     * @param {object} sStmt - Database prepare statement object
     * @param {object} conn - Database connection Object
     */
    function closeDBQueryObject(rSet, sStmt, conn) {
        try {
            if (rSet) {
                rSet.close();
                rSet = null;
            }
        } catch (vError) {
            logDebug("Failed to close the database result set object." + vError);
        }
        try {
            if (sStmt) {
                sStmt.close();
                sStmt = null;
            }
        } catch (vError) {
            logDebug("Failed to close the database prepare statement object." + vError);
        }
        try {
            if (conn) {
                conn.close();
                conn = null;
            }
        } catch (vError) {
            logDebug("Failed to close the database connection." + vError);
        }
    }

    function executeSelectQuery(ipQuery, ipColumns) {
        var opRSet = new Array();
        var vRSet = null;

        var vContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
        if (vContext) {
            var vDS = vContext.lookup("java:/AA");
            if (vDS) {
                var vConn = vDS.getConnection();
                if (vConn) {
                    var vStmt = vConn.prepareStatement(ipQuery);
                    if (vStmt) {
                        vRSet = vStmt.executeQuery();
                        if (!vRSet)
                            vStmt.close();
                    }
                    if (!vRSet)
                        vConn.close();
                }
            }
            vContext.close();
        }
        var vColumnsArr = ipColumns.split(",");
        var vValue = "";
        if (vRSet) {
            while (vRSet.next()) {
                var vRSetRow = new Array();
                for (var vColCounter in vColumnsArr) {
                    vValue = vRSet.getString(vColumnsArr[vColCounter].toString());
                    vRSetRow[vColumnsArr[vColCounter]] = vValue;
                }
                opRSet.push(vRSetRow);
            }
            closeDBQueryObject(vRSet, vStmt, vConn);
        }
        return opRSet;
    }

    function generateReport(itemCap, reportName, module, parameters) {
        var user = currentUserID;
        var report = aa.reportManager.getReportInfoModelByName(reportName);
        report = report.getOutput();
        report.setModule(module);
        report.setCapId(itemCap.getCustomID());
        report.setReportParameters(parameters);
        var permit = aa.reportManager.hasPermission(reportName, user);
        if (permit.getOutput().booleanValue()) {
            var reportResult = aa.reportManager.getReportResult(report);
            if (reportResult) {
                reportOutput = reportResult.getOutput();
                var reportFile = aa.reportManager.storeReportToDisk(reportOutput);
                reportFile = reportFile.getOutput();
                reportFile = gs2.common.renameReportOutputFile(reportFile);
                return reportFile
            } else {
                logDebug("System failed get report: " + reportResult.getErrorType() + ":" + reportResult.getErrorMessage());
                return false
            }
        } else {
            logDebug("You have no permission.");
            return false
        }
    }

    //Returns the next available sequence and updates the table
    function getSysNextSequence(sSeqName) {
        var sysSeqBiz = aa.proxyInvoker.newInstance("com.accela.sequence.SequenceGeneratorBusiness")
            .getOutput();
        var seq;
        try {
            var seqObj = sysSeqBiz.getNextValue(sSeqName);
            seq = sysSeqBiz.getNextValue(sSeqName)
                .longValue();
            logDebug(seq);

        } catch (err) {
            logDebug("An error occurred in getNextSequence :: Sequence Name is not valid " + err.message);
            seq = -1;
        }
        return seq;
    }
    function getCorrectedCapID4V10(ipCapID) {
        if (ipCapID && ipCapID.ID1 && ipCapID.ID2 && ipCapID.ID3)
            return aa.cap.getCapID(ipCapID.ID1, ipCapID.ID2, ipCapID.ID3).getOutput();
    }

    //Use Agency Name instead of Agency Code.
    function getAgencyName(ipAgencyCode) {
        try {
            var vAgencyCode = ipAgencyCode;
            var vAgencyArray = executeSelectQuery("SELECT R3_AGENCY_NAME from R3AGENCY where SERV_PROV_CODE = '" + aa.getServiceProviderCode() + "' AND R3_AGENCY_CODE = '" + vAgencyCode + "'", "R3_AGENCY_NAME");
            return vAgencyArray[0]["R3_AGENCY_NAME"];
        }
        catch (vError) {
            logDebug("ERROR: Finding Agency Name for Agency Code. " + vError.message);
        }
    }

    function getDefaultWorkflowCalendarId() {
        var calResult = aa.calendar.getCalendarNames();
        if (calResult.getSuccess()) {
            var calArray = calResult.getOutput();
            for (var p in calArray) {
                if (calArray[p].getCalendarType() == 'WORKFLOW' && calArray[p].getCalendarName() == 'Agency Workdays') {
                    return (calArray[p].getCalendarID());
                }
            }
        }
        return -1;
    }

    // Calculate Correct In Possession Time.
    function executeUpdDelSQLQuery(ipSQLQuery) {
        logDebug("Executing SQL: " + ipSQLQuery);
        var vError = '';
        var conn = null;
        var sStmt = null;
        var rSet = null;

        try {
            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
            var ds = initialContext.lookup("java:/AA");
            conn = ds.getConnection();

            sStmt = conn.prepareStatement(ipSQLQuery);
            rSet = sStmt.executeQuery();
        } catch (vError) {
            logDebug("**WARNING error occurred: " + vError);
        }
        closeDBQueryObject(rSet, sStmt, conn);
    }

    function sendNotificationToContact(emailFrom, emailToContact, emailCC, templateName, params, reportFile) {
        try {
            var opResult = false;
            var emailTo = emailToContact.email;
            if (emailToContact.contactType != "Applicant") {
                var vTemplates = null;
                if (emailToContact.class != undefined && emailToContact.class.toString() == "com.accela.aa.aamain.people.CapContactModel")
                    vTemplates = gs2.contact.getTemplatesForContact(emailToContact, false);
                else
                    vTemplates = emailToContact.templates;
                if (vTemplates && vTemplates["EMAIL OPTION.Do not receive Email Notifications"] == "CHECKED")
                    return opResult;
            }
            gs2.notification.sendNotification(emailFrom, emailTo, emailCC, templateName, params, reportFile);
            opResult = true;
            return opResult;
        }
        catch (ex) {
            logDebug("**** Error in sendNotification : " + ex.message);
            return opResult;
        }
    }


    function generateReportforUser(itemCap, reportName, module, parameters, currentUserID) {
        var user = currentUserID;
        var report = aa.reportManager.getReportInfoModelByName(reportName);
        report = report.getOutput();
        report.setModule(module);
        report.setCapId(itemCap.getCustomID());
        report.setReportParameters(parameters);
        var permit = aa.reportManager.hasPermission(reportName, user);
        if (permit.getOutput().booleanValue()) {
            var reportResult = aa.reportManager.getReportResult(report);
            if (reportResult) {
                reportOutput = reportResult.getOutput();
                var reportFile = aa.reportManager.storeReportToDisk(reportOutput);
                reportFile = reportFile.getOutput();
                reportFile = gs2.common.renameReportOutputFile(reportFile);
                return reportFile
            } else {
                logDebug("System failed get report: " + reportResult.getErrorType() + ":" + reportResult.getErrorMessage());
                return false
            }
        } else {
            logDebug("You have no permission.");
            return false
        }
    }

    /**
     * Checks if an Event is a non working day
     * @returns {boolean} - success
     */
    function isAgencyHoliday(eventName) {
        for (var i in AGENCY_HOLIDAY_EVENT_NAMES) {
            if (AGENCY_HOLIDAY_EVENT_NAMES[i].equalsIgnoreCase(eventName))
                return true;
        }
        return false;
    }

    /**
     * Add business days to a date based on calendar
     * @param {Date} td - The date for which business days to be addded
     * @param {Number} amt - No of Days to be added
     * @param {Number} calendarID - The Id of the Business calendar
     * @returns {string} recDate- New date in String format
     */
    function addBusinessDays(td, amt, calendarID) {
        if (!td) {
            dDate = new Date();
        } else {
            dDate = convertDate(td);
        }
        var i = 0;
        while (i < Math.abs(amt)) {
            if (amt > 0) {
                dDate = getNextBusinessDay(dDate, calendarID);
                i++
            } else {
                dDate = getPrevBusinessDay(dDate, calendarID);
                i++
            }
        }
        return (dDate.getMonth() + 1) + "/" + dDate.getDate() + "/" + dDate.getFullYear()
    }

    function getNextSequence(maskName) {
        var agencySeqBiz = aa.proxyInvoker.newInstance("com.accela.sg.AgencySeqNextBusiness").getOutput();
        var params = aa.proxyInvoker.newInstance("com.accela.domain.AgencyMaskDefCriteria").getOutput();
        var seq;
        params.setAgencyID(aa.getServiceProviderCode());
        params.setMaskName(maskName);
        params.setRecStatus("A");
        params.setSeqType("Agency");
        try {
            seq = agencySeqBiz.getNextMaskedSeq("ADMIN", params, null, null);
        }
        catch (err) {
            logDebug("An error occurred in getNextSequence :: maskName is not valid " + err.message);
            seq = -1;
        }
        return seq;
    }

    function isMeetingTimeAvailible(jsRequestDate, mtgBody, mtgCal, mtgLoc) {
        try {
            //Calendar ID and Calendar name must match
            //var calID = 72;

            var startDate = aa.date.parseDate(dateAdd(null, 4, "Y"));
            var endDate = aa.date.parseDate(dateAdd(null, 20));

            var mtgRes = aa.meeting.getAvailableMeetings(mtgBody, 0, mtgCal, startDate, endDate, null, mtgLoc);

            var meetings = []
            if (mtgRes.getSuccess()) meetings = mtgRes.getOutput();

            for (var m in meetings) {
                startMtg = "" + meetings[m].getStartDate()
                meetDate = new Date(startMtg.substring(5, 7) + "/" + startMtg.substring(8, 10) + "/" + startMtg.substring(0, 4) + " " + startMtg.split(" ")[1].slice(0, 8))

                logDebug("Requesting meeting date: " + reqDate + " found meeting on: " + meetDate)
                if (meetDate >= reqDate && meetDate <= reqDate) {
                    logDebug("Found a Match")
                    return false
                }
                else if (meetDate > reqDate) {
                    logDebug("Meeting date requested is not availible")
                    return true
                }
            }
            return true
        }
        catch (err) {
            logDebug("Error in script function isMeetingTimeAvailible: " + err)
        }
    }

    /**
     * checks if Business Calander is Associated with a Work Flow task
     * @param {string} Work Flow Task Name
     * @param {string} capId - capId
     * @returns {boolean} - success
     */
    function isBusinessCalAssociated(wfstr, capId) {
        var sql = "SELECT c.CALENDAR_NAME, c.CALENDAR_ID FROM CALENDAR c JOIN GPROCESS g ON c.CALENDAR_ID = g.CALENDAR_ID WHERE g.B1_PER_ID1 = '" + capId.getID1() + "' and g.B1_PER_ID2 = '" + capId.getID2() + "' and g.B1_PER_ID3 = '" + capId.getID3() + "' And g.SD_PRO_DES = '" + wfstr + "'"

        //logDebug(sql);
        var vError = '';
        var conn = null;
        var sStmt = null;
        var rSet = null;
        var calName = "";
        var calID = -1;

        try {
            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
            var ds = initialContext.lookup("java:/AA");
            conn = ds.getConnection();
            //logDebug(sql);
            sStmt = conn.prepareStatement(sql);
            rSet = sStmt.executeQuery();

            while (rSet.next()) {
                calName = rSet.getString("CALENDAR_NAME");
                calID = rSet.getString("CALENDAR_ID");
                break;
            }
        } catch (vError) {
            logDebug("Runtime error occurred in isBusinessCalAssociated(): " + vError);
        }
        closeDBQueryObject(rSet, sStmt, conn);
        return calID;
    }


    gs2.util.test = test;
    gs2.util.getMeetingByType = getMeetingByType;
    gs2.util.isAgencyHoliday = isAgencyHoliday;
    gs2.util.getPrevBusinessDay = getPrevBusinessDay;
    gs2.util.getNextBusinessDay = getNextBusinessDay;
    gs2.util.isUserAvailable = isUserAvailable;
    gs2.util.isServCodeHoliday = isServCodeHoliday;
    gs2.util.getUserCalendarByUserID = getUserCalendarByUserID;
    gs2.util.closeDBQueryObject = closeDBQueryObject;
    gs2.util.executeSelectQuery = executeSelectQuery;
    gs2.util.generateReport = generateReport;
    gs2.util.getSysNextSequence = getSysNextSequence;
    gs2.util.getCorrectedCapID4V10 = getCorrectedCapID4V10;
    gs2.util.getAgencyName = getAgencyName;
    gs2.util.getDefaultWorkflowCalendarId = getDefaultWorkflowCalendarId;
    gs2.util.executeUpdDelSQLQuery = executeUpdDelSQLQuery;
    gs2.util.sendNotificationToContact = sendNotificationToContact;
    gs2.util.generateReportforUser = generateReportforUser;
    gs2.util.isAgencyHoliday = isAgencyHoliday;
    gs2.util.addBusinessDays = addBusinessDays;
    gs2.util.getNextSequence = getNextSequence;
    gs2.util.isMeetingTimeAvailible = isMeetingTimeAvailible;
    gs2.util.isBusinessCalAssociated = isBusinessCalAssociated;

})();

