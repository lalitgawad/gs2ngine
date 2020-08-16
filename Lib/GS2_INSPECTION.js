gs2.insp = {};
(function () {

    function test() {
        gs2.log('GS2_INSPECTION Looks good');
        return true;
    }
    function createPendingInspection(iGroup, iType) {
        var itemCap = capId;
        if (arguments.length == 3) {
            itemCap = arguments[2]
        }
        var itmResult = aa.inspection.getInspectionType(iGroup, iType);
        if (!itmResult.getSuccess()) {
            logDebug("**WARNING error retrieving inspection types: " + itmResult.getErrorMessage);
            return false
        }
        var itmArray = itmResult.getOutput();
        if (!itmArray) {
            logDebug("**WARNING could not find any matches for inspection group " + iGroup + " and type " + iType);
            return false
        }
        var itmSeq = null;
        for (thisItm in itmArray) {
            var it = itmArray[thisItm];
            if (it.getGroupCode().toUpperCase().equals(iGroup.toUpperCase()) && it.getType().toUpperCase().equals(iType.toUpperCase())) {
                itmSeq = it.getSequenceNumber()
            }
        }
        if (!itmSeq) {
            logDebug("**WARNING could not find an exact match for inspection group " + iGroup + " and type " + iType);
            return false
        }
        var inspModel = aa.inspection.getInspectionScriptModel().getOutput().getInspection();
        var activityModel = inspModel.getActivity();
        activityModel.setInspSequenceNumber(itmSeq);
        activityModel.setCapIDModel(itemCap);
        pendingResult = aa.inspection.pendingInspection(inspModel);
        if (pendingResult.getSuccess()) {
            logDebug("Successfully created pending inspection group " + iGroup + " and type " + iType);
            return true
        } else {
            logDebug("**WARNING could not create pending inspection group " + iGroup + " and type " + iType + " Message: " + pendingResult.getErrorMessage());
            return false
        }
    }
    function isFirstInspection(ipCapID, ipInspType, ipInspId) {
        var opResult = false;
        var vFoundPrev = false;
        var vInsps = aa.inspection.getInspections(ipCapID).getOutput();
        for (var vCounter in vInsps) {
            var vInsp = vInsps[vCounter];
            if (vInsp.inspectionType == ipInspType && vInsp.inspectionStatus == "Failed" && vInsp.idNumber < ipInspId) {
                vFoundPrev = true;
                break;
            }
        }
        opResult = !vFoundPrev;
        return opResult;
    }

    function checkAllInspectionResulted(ipCapID) {
        var opResult = true;
        var vInspectionArr = aa.inspection.getInspections(ipCapID).getOutput();
        for (var vCounter in vInspectionArr) {
            var vInspection = vInspectionArr[vCounter];
            if (matches(vInspection.inspectionStatus, "Pending", "Scheduled"))
                opResult = false;
        }
        return opResult;
    }

    function getLatestInspection(ipCapID, ipInspType) {
        var opInspObj = null;
        var vMaxInspID = 0;
        var vInspArr = aa.inspection.getInspections(ipCapID).getOutput();
        for (var vCounter in vInspArr) {
            var vInsp = vInspArr[vCounter];
            if (vInsp.inspectionType == ipInspType && vInsp.idNumber > vMaxInspID)
                vMaxInspID = vInsp.idNumber;
        }
        if (vMaxInspID > 0)
            opInspObj = aa.inspection.getInspection(ipCapID, vMaxInspID).getOutput();
        return opInspObj;
    }


    //updates Inspection Groups after scheduling
    function handleInspectionAfterScheduling(vCapID) {
        var inspResObj = aa.inspection.getInspections(vCapID);
        if (inspResObj.getSuccess()) {
            var inspObjs = inspResObj.getOutput();
            for (var i in inspObjs) {
                var inspObj = inspObjs[i];
                if (!inspObj.getInspection().getInspectionGroup()) {
                    var hm = getGroupAndSeqNbr(inspObj.getInspectionType());
                    if (hm != null) {
                        var inspGroup = hm["inspGroup"];
                        var inspSeq = hm["inspSeq"];
                        var gsGroup = hm["gsGroup"];
                        logDebug("gsGroup: " + gsGroup);
                        if (gsGroup != "null" && gsGroup != "")
                            addGuideSheet(vCapID, parseInt(inspObj.getIdNumber()), gsGroup);
                        var conn = null;
                        var sStmt = null;
                        var rSet = null;
                        var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null)
                            .getOutput();
                        var ds = initialContext.lookup("java:/AA");
                        conn = ds.getConnection();
                        try {
                            var sql = "SET NOCOUNT ON;UPDATE G6ACTION SET INSP_SEQ_NBR =" + inspSeq;
                            sql += ",INSP_GROUP = '" + inspGroup + "'";
                            sql += "WHERE G6_ACT_NUM = " + inspObj.getIdNumber() + ";";
                            sStmt = conn.prepareStatement(sql);
                            rSet = sStmt.executeQuery();
                        }
                        catch (vError) {
                            logDebug("Runtime error occurred: " + vError);
                        }
                        gs2.util.closeDBQueryObject(rSet, sStmt, conn);
                    }
                }
            }
        }
    }

    function getGroupAndSeqNbr(inspType) {
        var hm = new Array();
        var vError = '';
        var conn = null;
        var sStmt = null;
        var rSet = null;
        var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null)
            .getOutput();
        var ds = initialContext.lookup("java:/AA");
        conn = ds.getConnection();
        try {
            var sql = "SET NOCOUNT ON;SELECT INSP_SEQ_NBR, INSP_CODE, GUIDE_GROUP FROM RINSPTYP WHERE INSP_TYPE ='" + inspType + "';";
            aa.print(sql);
            sStmt = conn.prepareStatement(sql);
            rSet = sStmt.executeQuery();
            while (rSet.next()) {
                hm["inspGroup"] = rSet.getString("INSP_CODE") + "";
                hm["inspSeq"] = rSet.getString("INSP_SEQ_NBR") + "";
                hm["gsGroup"] = rSet.getString("GUIDE_GROUP") + "";
                gs2.util.closeDBQueryObject(rSet, sStmt, conn);
                return hm;
            }
        }
        catch (vError) {
            logDebug("Runtime error occurred: " + vError);
        }
        gs2.util.closeDBQueryObject(rSet, sStmt, conn);
        return null;
    }

    /**
    Returns an array of ASI Associated with the checklist
    Input: inspection Type, Checklist Name, Optional capId
    */
    function loadInspectionChecklist(inspType, clName) {
        var vCapID = capId;
        if (arguments.length > 2)
            vCapID = arguments[3];
        var inspResultObj = aa.inspection.getInspections(capId);
        if (inspResultObj.getSuccess()) {
            inspList = inspResultObj.getOutput();
            for (xx in inspList) {
                if (inspList[xx].getInspectionType() == inspType) {
                    var inspId = inspList[xx].getIdNumber();
                    var gs = getGuideSheetObjects(inspId);
                    for (var i in gs) {
                        var gsObj = gs[i]
                        if (gsObj.gsType == clName) {
                            gsObj.loadInfo();
                            logDebug("Checklist loaded Successfully");
                            return gsObj.info;
                        }
                    }
                }
            }
        }
        logDebug("Checklist loaded unsuccessfully");
        return null;
    }

    //validate if no users are available for inspection assignments
    function validateIfUsersAreAvailableForAssignments() {
        if (vEventName == "InspectionScheduleBefore") {
            var hm = getGroupAndSeqNbr(inspType);
            var inspGroup = hm["inspGroup"];
            logDebug("inspGroup: " + inspGroup);
            var flavor = String(gs2.common.lookup("BSAR2_INSPECTION_CONFIGURATION", inspGroup + "||" + inspType)).split("||")[1];
            var department = String(gs2.common.lookup("BSAR2_INSPECTION_CONFIGURATION", inspGroup + "||" + inspType)).split("||")[0];
            logDebug("flavor: " + flavor);
            logDebug("department: " + department);

            if (flavor == "RR" || flavor == "MAN") {
                var count = 0;
                var pList = aa.people.getSysUserListByDepartmentName(department).getOutput()
                for (var a in pList) {
                    if (pList[a].userStatus == "ENABLE" && pList[a].userObject.getIsInspector() == "Y" && isUserAvailableForAssignment(pList[a].userObject.getUserID() + "")) {
                        count++;
                    }
                }
                if (count == 0) {
                    cancel = true;
                    showMessage = true;
                    comment("No inspectors are available on the selected date. Please select the next available date.");
                }
            }
            else if (flavor == "GIS") {
                var count = 0;
                var disciplineArray = new Array();
                var inspectionDisciplineArr = aa.inspection.getInspectionDiscipline(hm["inspSeq"]).getOutput();
                for (var k in inspectionDisciplineArr) {
                    disciplineArray.push(inspectionDisciplineArr[k].getDiscipline() + "");
                }
                var inspectionDesciplineObjs = disciplineArray;
                var inspectionDiscipline = null;
                if (inspectionDesciplineObjs.length > 0)
                    inspectionDiscipline = inspectionDesciplineObjs[0] + "";
                logDebug("Inspection Discipline: " + inspectionDiscipline);
                var wz = getGisWorkZoneByCapId(capId);
                logDebug("Workzone: " + wz);
                if (wz) {
                    var district = getGisDistrictByWorkZoneTable(wz, inspectionDiscipline);
                    logDebug("District: " + district);
                } else {
                    logDebug("**WARNING: WorkZone not found Parcel");
                }

                //Find Inspector list using inspection Discipline, district
                var usrobjs = getUserObjsByDisciplineAndDistrict(inspectionDiscipline, district, true);
                logDebug("Users Length" + usrobjs.length);
                for (var a in usrobjs) {
                    if (isUserAvailableForAssignment(usrobjs[a].userObject.getUserID() + "")) {
                        count++;
                    }
                }
                if (district && count == 0) {
                    cancel = true;
                    showMessage = true;
                    comment("No inspectors are available on the selected date. Please select the next available date.");
                }
            }
        }
    }

    //Is user available on the day
    function isUserAvailableForAssignment(userName) {
        var givenDate = new Date();
        if (vEventName == "InspectionScheduleBefore") {
            if (InspectionDate) {
                givenDate = new Date((InspectionDate.getMonth() + 1) + "/" + InspectionDate.getDate() + "/" + (InspectionDate.getYear() + 1900));
            }
        }
        if (arguments.length > 1) {
            givenDate = arguments[1];
        }
        var calendarID = gs2.util.getUserCalendarByUserID(userName);
        if (calendarID) {
            var calEvents = aa.calendar.getEventSeriesByCalendarID(calendarID, givenDate.getFullYear(), givenDate.getMonth() + 1).getOutput();
            for (var i in calEvents) {
                var calEvent = calEvents[i];
                var eventStrDate = calEvent.getStartDate();
                if (gs2.util.isServCodeHoliday(givenDate) || (eventStrDate.getDate() == givenDate.getDate() && calEvent.getEventType() == 'Block Out')) {
                    return false;
                }
            }
        }
        return true;
    }

    /*
    Hide or show Inspections in ACA
    */
    function setInspDisplayInACA(pCapId, pInspId, pDisplayBool) {
        /*
        * @ pCapId - record capIdModel
        * @ pInspId - inspection number
        * @ pDisplayBool - true or false display in ACA
        */
        var thisInspResult = aa.inspection.getInspection(pCapId, pInspId);
        var cInspObj = null;
        var cInspector = null;
        var inspUserID = null;
        var inspUserResult = null;
        var inspectorEmailStr = null;

        if (thisInspResult.getSuccess())
            cInspObj = thisInspResult.getOutput();

        if (cInspObj == null) {
            logDebug("No inspection Object, exiting script to notify inspector of inspection correction.");
            // return false;
        }
        var cInspectionModel = cInspObj.getInspection();

        var cActivityModel = cInspectionModel.getActivity();
        if (pDisplayBool)
            cActivityModel.setDisplayInACA("Y");
        else
            cActivityModel.setDisplayInACA("N");

        cInspectionModel.setActivity(cActivityModel);
        var updateInspResult = aa.inspection.editInspection(cInspObj);
        if (updateInspResult.getSuccess()) {
            logDebug("Inspection will not display in ACA");
        }
        else {
            logDebug("Inspection did not update error message: " + updateInspResult.getErrorMessage());
        }
    }


    /*
    Schedules inspections considering the calendar
    */
    function schedule6MonthsConsideringBusinessDays(vCapId, iType) {
        var inspectorObj = null;
        var inspTime = null;
        var inspComm = "";
        if (arguments.length >= 3) {
            if (arguments[2] != null) {
                var inspRes = aa.person.getUser(arguments[2]);
                if (inspRes.getSuccess()) {
                    var inspectorObj = inspRes.getOutput()
                }
            }
        }
        if (arguments.length >= 4) {
            if (arguments[3] != null) {
                inspTime = arguments[3]
            }
        }
        if (arguments.length == 5) {
            if (arguments[4] != null) {
                inspComm = arguments[4]
            }
        }
        var inspSchedDate = new Date();
        var calDate = new Date(inspSchedDate.setMonth(inspSchedDate.getMonth() + 6));
        //var calDate = dateAdd(new Date(inspSchedDate),90);
        while (1) {
            if (gs2.util.isAgencyHoliday(calDate)) {
                calDate = new Date(dateAdd(calDate, 1));
            }
            else
                break;
        }

        var calDate = new Date(calDate),
            month = '' + (calDate.getMonth() + 1),
            day = '' + calDate.getDate(),
            year = calDate.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        var dateStr = [month, day, year].join('/');
        var schedRes = aa.inspection.scheduleInspection(vCapId, inspectorObj, aa.date.parseDate(dateStr + ""), inspTime, iType, inspComm);
        if (schedRes.getSuccess()) {
            logDebug("Successfully scheduled inspection : " + iType + " for " + dateStr)
        } else {
            logDebug("**ERROR: adding scheduling inspection (" + iType + "): " + schedRes.getErrorMessage())
        }
    }

    function handleCancelledInspections() {
        if (inspResult == "Cancel" || inspResult == "Failed" || inspResult == "Partial Pass") {
            var status = "";
            if (inspResult == "Cancel")
                status = "Cancelled";
            if (inspResult == "Failed")
                status = "Failed";
            if (inspResult == "Partial Pass")
                status = "Partial Pass";

            var inspector = null;
            var inspResultObj = aa.inspection.getInspections(capId);
            if (inspResultObj.getSuccess()) {
                var inspList = inspResultObj.getOutput();
                for (xx in inspList) {
                    if (inspId == inspList[xx].getIdNumber()) {
                        //inspList[xx].setInspectionStatus(status);
                        aa.inspection.editInspection(inspList[xx]);
                        inspUserObj = aa.person.getUser(inspList[xx].getInspector().getFirstName(), inspList[xx].getInspector().getMiddleName(), inspList[xx].getInspector().getLastName()).getOutput();
                        var ism = aa.inspection.getInspectionScriptModel().getOutput();
                        var im = ism.getInspection();
                        ism.setCapID(capId);
                        im.setInspectionType(inspType);

                        //REVISIT
                        if (
                            appMatch("REVISIT/Investigation/Red Tag Investigation/Investigation") ||
                            appMatch("REVISIT/Investigation/Yellow Tag Investigation/Investigation")
                        ) {
                            ism.setInspectionStatus("Unscheduled");
                        }
                        else {
                            ism.setInspectionStatus("Pending");
                        }

                        //REVISIT
                        var resId;
                        if (appMatch("REVISIT/Request/Fire Damage Assessment/Request") && inspResult == "Failed") {
                            var vTodayPlus20 = aa.date.parseDate(dateAdd(null, 20, true));
                            resId = aa.inspection.scheduleInspection(capId, inspUserObj, vTodayPlus20, null, inspType, "");
                            logDebug("Inspection Failed.");
                        }
                        else {
                            resId = aa.inspection.scheduleInspection(im, inspUserObj).getOutput();

                            var insObj1 = aa.inspection.getInspection(capId, resId).getOutput();


                            //REVISIT
                            if (
                                appMatch("REVISIT/Investigation/Red Tag Investigation/Investigation") ||
                                appMatch("REVISIT/Investigation/Yellow Tag Investigation/Investigation")
                            ) {
                                insObj1.setInspectionStatus("Unscheduled");
                            }
                            else {
                                insObj1.setInspectionStatus("Pending");
                                if (inspUserObj) {
                                    insObj1.setInspector(inspUserObj);
                                }
                            }
                            if (!insObj1.inspection.activity.getDesiredDate()) {
                                insObj1.inspection.activity.setDesiredDate(new Date(inspSchedDate));
                                logDebug("DESIRED DATE SET TO :::> " + new Date(inspSchedDate));
                            }
                            insObj1.setRequestDate(inspObj.requestDate);
                            aa.print("Inspection Cancelled: " + aa.inspection.editInspection(insObj1).getSuccess());
                        }
                        break;
                    }
                }
            }
        }
        handleInspectionAssignments();
    }

    function validationForGSPInspections() {
        /*Available Variables: inspId,inspResult,inspResultComment,inspResultDate,inspGroup,inspType,inspSchedDate,inspTotalTime*/
        var commentStr = "";
        if (controlString == "InspectionResultSubmitBefore")
            commentStr = inspComment;
        else if (controlString == "InspectionResultModifyBefore")
            commentStr = inspResultComment;
        if (matches(String(inspResult), "Partial Pass", "Failed", "Hold", "Conditional Approval") && (commentStr == "" || commentStr == null)) {
            showMessage = true;
            cancel = true;
            comment("Comments are required.");
            //aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + "Comments are required.");
        }
    }

    //REVISIT
    function handleInspectionAssignments() {
        var vCapID = capId;
        if (arguments.length == 1)
            vCapID = arguments[0];

        try {
            handleInspectionAfterScheduling(vCapID);
            var inspResultObj = aa.inspection.getInspections(vCapID);
            var inspList = new Array();
            if (inspResultObj.getSuccess()) {
                if (arguments.length == 2) {
                    inspList.push(aa.inspection.getInspection(vCapID, arguments[1]).getOutput());
                }
                else
                    inspList = inspResultObj.getOutput();
                for (xx in inspList) {
                    if (inspList[xx] && inspList[xx].getInspector().getDeptOfUser() == "") {
                        var inspGroup = inspList[xx].getInspection().getInspectionGroup();
                        var inspId = inspList[xx].getInspection().getIdNumber();
                        var inspType = inspList[xx].getInspection().getInspectionType();
                        var flavor = String(gs2.common.lookup("BSAR2_INSPECTION_CONFIGURATION", inspGroup + "||" + inspType)).split("||")[1];
                        var department = String(gs2.common.lookup("BSAR2_INSPECTION_CONFIGURATION", inspGroup + "||" + inspType)).split("||")[0];
                        BSAR2_assignInspectionDepartment(inspId, inspGroup, inspType, vCapID);
                        aa.print("-------------------------------------------------------------------------------------");
                        aa.print("Inspection: " + inspGroup + " : " + inspType + " (" + inspId + ")");
                        aa.print("Department: " + department);
                        aa.print("Flavor: " + flavor);
                        var doNotAssignFlag = false;
                        //record Specific rules
                        if (String(inspGroup).indexOf("INSP_RBP") > -1 &&
                            (inspType + "" == "Flatwork Curb - Pre-Pour" ||
                            inspType + "" == "Flatwork Curb - Final")
                            && AInfo["Is this a new or recently developed neighborhood?"] != "Yes") {
                            doNotAssignFlag = true;
                            autoAssignInspectionRR(inspId, "COSA/DSD/ENG/INSP/NA/SUPV/NA", vCapID);
                        }
                        aa.print("doNotAssignFlag: " + doNotAssignFlag);
                        //If Round-Robin Assignment
                        if (!doNotAssignFlag) {
                            if (flavor == "RR")
                                autoAssignInspectionRR(inspId, department, vCapID);
                            else if (flavor == "GIS")
                                scheduleInspectionByGisDistict(vCapID, inspId, department);
                        }
                        if (inspType.indexOf("QCR") > -1 ||
                            inspType.indexOf("Energy Audit") > -1 ||
                            inspType.indexOf("Consultation") > -1) {
                            setInspDisplayInACA(vCapID, inspId, false);
                            aa.print(inspType + ": Display in ACA turned to NO");
                        }
                    }
                }
            }
        }
        catch (e) {
            gs2.common.handleError(e);
        }
    }
    //Handles assignments of Inspectors for all the Agency Inspection Types
    //Handles assignments of Inspection Departments for all the BSAR2 Inspection Types
    function BSAR2_assignInspectionDepartment(inspId, inspCode, inspType) {
        var vCapID = capId;
        if (arguments.length > 3)
            vCapID = arguments[3];
        try {
            var insp = aa.inspection.getInspection(vCapID, inspId).getOutput();
            var inspector = insp.getInspector();
            var dept = String(gs2.common.lookup("BSAR2_INSPECTION_CONFIGURATION", inspCode + "||" + inspType)).split("||")[0];
            inspector.setDeptOfUser(dept);
            insp.setInspector(inspector);
            aa.inspection.editInspection(insp);
        } catch (err) {
            logDebug("A JavaScript Error occurred in  BSAR2_assignInspectionDepartment function: " + err.message);
        }
    }

    //This function will auto assign an Inspection to an Inspector in a department based on a round robin methodology
    //Department: The department containing the users that will be used for assignment in the format "LICENSING/DCA/CONSERV/MED/NA/SUPV/NA"
    function autoAssignInspectionRR(inspId, department, vCapID) {
        //we'll just use a standard choice value that matches the task name
        if (arguments.length < 2 || department == undefined || department == null || department == "") {
            var vInspTaskObj = aa.inspection.getInspection(vCapID, inspId).getOutput();
            var vAsgnStaff = vInspTaskObj.getInspector();
            var department = vAsgnStaff.getDeptOfUser().toString();
        }
        var stdChoiceVal = department;
        var assignToString = gs2.common.lookup("InspectionAutoAssign", stdChoiceVal);
        //var assignToString = getNextSequence(department);
        var assignTo = parseInt(assignToString);
        var assignNext = 0;
        var userList = new Array();
        var scheduledDate = null;
        var today = aa.inspection.getInspection(vCapID, inspId).getOutput().getInspection().getScheduledDate();


        var inspectionDesciplineObjs = getInspectionDisciplineArray(vCapID, inspId); //fake one
        var inspectionDiscipline = null;
        var inspDisciplineRR = "";
        var altInspDisciplines = inspectionDisciplineOverrideRules(vCapID, inspId);
        if (altInspDisciplines.length > 0)
            inspectionDesciplineObjs = altInspDisciplines;
        var isFire = false;
        var type = aa.inspection.getInspection(vCapID, inspId).getOutput().getInspectionType() + "";
        if (inspectionDesciplineObjs.length > 0) {
            for (var i in inspectionDesciplineObjs) {
                var inspectionDiscipline = inspectionDesciplineObjs[i] + "";
                if (inspectionDiscipline == "Fire" || type.indexOf("Fire") > -1)
                    isFire = true;
            }
        }
        if (today) {
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!
            var yyyy = parseInt(today.getYear()) + 1900;

            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            var today = mm + '/' + dd + '/' + yyyy;
            scheduledDate = new Date(today);
        }
        aa.print("Schedule Date: " + scheduledDate);
        //get the users in the department
        var pList = aa.people.getSysUserListByDepartmentName(department).getOutput()
        for (a in pList) {
            if (pList[a].userStatus != "ENABLE" && pList[a].getIsInspector() != "Y")
                continue;
            if (isFire) {
                if (isUserAvailable(pList[a].getUserID() + "", scheduledDate))
                    userList.push(pList[a]);
            }
            else
                userList.push(pList[a]);
        }
        aa.print("Available Users: " + userList.length);
        if (assignTo < userList.length) {
            aa.print("assignTo: " + assignTo);
            assignInspectorWithUserObj(inspId, userList[assignTo], vCapID);
            //update the standard choice value
            editLookup("InspectionAutoAssign", stdChoiceVal, assignTo + 1);
        }
            //if outside the bounds of the array, return to the beginning.
        else {
            assignInspectorWithUserObj(inspId, userList[0], vCapID);
            //update the standard choice value
            aa.print("assignTo: " + 0);
            editLookup("InspectionAutoAssign", stdChoiceVal, 1 + "");
        }
    }

    //This function will auto assign an Inspection to an Inspector in a department based on a round robin methodology based on discipline and district
    function autoAssignInspectionByDistrictAndDisciplineRR(inspId, district, discipline, vCapID, usrobjs, availableHM) {
        var stdChoiceVal = discipline + "||" + district;
        var assignToString = gs2.common.lookup("DisciplineDistrict RR", stdChoiceVal);
        var assignTo = parseInt(assignToString);
        aa.print("assignTo: " + assignTo);
        if (assignToString == undefined) {
            for (var i in usrobjs) {
                if (availableHM[i] == "AVAILABLE") {
                    assignInspectorWithUserObj(inspId, usrobjs[i].userObject, vCapID);
                    //aa.print("Assigned to: ("+ (i+1)+") - "+ usrobjs[i].userObject.getUserID() );
                    editLookup("DisciplineDistrict RR", stdChoiceVal, (i + 1));
                    break;
                }
            }
        }
        else {
            while (1) {
                if (assignTo >= usrobjs.length)
                    assignTo = 0;
                if (availableHM[assignTo] == "AVAILABLE") {
                    assignInspectorWithUserObj(inspId, usrobjs[assignTo].userObject, vCapID);
                    //aa.print("Assigned to: ("+ parseInt(assignTo+1)+") - "+ usrobjs[assignTo].userObject.getuserID());
                    editLookup("DisciplineDistrict RR", stdChoiceVal, (assignTo + 1) + "");
                    break;
                }
                assignTo++;
            }
        }
        /*if (assignToString == undefined || assignTo == usrobjs.length) {
            assignInspectorWithUserObj(inspId, usrobjs[0].userObject, vCapID);
            editLookup("DisciplineDistrict RR", stdChoiceVal, "1");
        }
        else {
            assignInspectorWithUserObj(inspId, usrobjs[assignTo].userObject, vCapID);
            editLookup("DisciplineDistrict RR", stdChoiceVal, (assignTo + 1) + "");
        }*/
    }

    //Assigns Inspection with the User Object
    function assignInspectorWithUserObj(inspId, user, vCapID) {
        if (typeof user != "undefined") {
            var insp = aa.inspection.getInspection(vCapID, inspId).getOutput();
            insp.setInspector(user);
            aa.inspection.editInspection(insp);
        }
    }

    function getInspectionDisciplineArray(vCapID, inspId) {
        var disciplineArray = new Array();
        var tmpInspection = aa.inspection.getInspection(vCapID, inspId).getOutput();
        if (tmpInspection) {
            var inspSeq = tmpInspection.getInspection().inspSequenceNumber;
            var inspectionDiscipline = aa.inspection.getInspectionDiscipline(inspSeq).getOutput();
            for (k in inspectionDiscipline) {
                disciplineArray.push(inspectionDiscipline[k].getDiscipline() + "");
            }
        }
        return disciplineArray;
    }

    gs2.insp.test = test;
    gs2.insp.checkAllInspectionResulted = checkAllInspectionResulted;
    gs2.insp.isFirstInspection = isFirstInspection;
    gs2.insp.getLatestInspection = getLatestInspection;
    gs2.insp.handleInspectionAfterScheduling = handleInspectionAfterScheduling;
    gs2.insp.getGroupAndSeqNbr = getGroupAndSeqNbr;
    gs2.insp.loadInspectionChecklist = loadInspectionChecklist;
    gs2.insp.validateIfUsersAreAvailableForAssignments = validateIfUsersAreAvailableForAssignments;
    gs2.insp.isUserAvailableForAssignment = isUserAvailableForAssignment;
    gs2.insp.setInspDisplayInACA = setInspDisplayInACA;
    gs2.insp.schedule6MonthsConsideringBusinessDays = schedule6MonthsConsideringBusinessDays;
    gs2.insp.handleCancelledInspections = handleCancelledInspections;
    gs2.insp.validationForGSPInspections = validationForGSPInspections;
    gs2.insp.handleInspectionAssignments = handleInspectionAssignments;
    gs2.insp.BSAR2_assignInspectionDepartment = BSAR2_assignInspectionDepartment;
    gs2.insp.autoAssignInspectionRR = autoAssignInspectionRR;
    gs2.insp.autoAssignInspectionByDistrictAndDisciplineRR = autoAssignInspectionByDistrictAndDisciplineRR;
    gs2.insp.assignInspectorWithUserObj = assignInspectorWithUserObj;
    gs2.insp.getInspectionDisciplineArray = getInspectionDisciplineArray;
    gs2.insp.createPendingInspection = createPendingInspection;
    
})();
