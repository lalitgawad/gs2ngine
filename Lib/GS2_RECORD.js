gs2.rec = {};
(function () {

    function test() {
        gs2.log('GS2_RECORD Looks good');
        return true;
    }
    function updateAppStatus(stat, cmt) {
        var itemCap = capId;
        if (arguments.length == 3) {
            itemCap = arguments[2]
        }
        var updateStatusResult = aa.cap.updateAppStatus(itemCap, "APPLICATION", stat, sysDate, cmt, systemUserObj);
        if (updateStatusResult.getSuccess()) {
            logDebug("Updated application status to " + stat + " successfully.")
        } else {
            logDebug("**ERROR: application status update to " + stat + " was unsuccessful.  The reason is " + updateStatusResult.getErrorType() + ":" + updateStatusResult.getErrorMessage())
        }
    }

    function validateOnlyOneContact(ipContactTypes) {
        var opResult = true;

        var vContObjArr = new Array();
        var vContactTypes = ipContactTypes.split(",");
        for (var vCounter in vContactTypes) {
            vContObjArr[vContactTypes[vCounter]] = 0;
        }
        var vCapConts = getContactArrayBefore();

        if(vCapConts.length >0){
            for (var vCounter in vCapConts) {
                var vContactType = vCapConts[vCounter].contactType;
                if (vContObjArr[vContactType] == undefined)
                    continue;
                vContObjArr[vContactType]++;
                if (vContObjArr[vContactType] > 1) {
                    opResult = false;
                    break;
                }
            }
        }
        else{
            opResult = false;
        }

        if (!opResult) {
            cancel = true;
            showMessage = true;
            comment("There should be only one Contacts for below Contact Types:");
            comment(ipContactTypes);
        }
        return opResult;
    }

    function checkReqContactsAA() {
        var vContReqConfSC = gs2.common.lookup("Required Address Type", appTypeString);
        if (!vContReqConfSC || vContReqConfSC == "")
            return;
        var vContTokens = vContReqConfSC.split("||");
        for (var vCounter1 in vContTokens) {
            var vContToken = vContTokens[vCounter1];
            var vContTokenArr = vContToken.split(":");
            var vContTypeList = vContTokenArr[0];
            var vContAddrTypeList = "";
            if (vContTokenArr.length > 1)
                vContAddrTypeList = vContTokenArr[1];
            checkContactTypeWithContactAddress(vContTypeList, vContAddrTypeList);
        }
    }

    function getCustomIDFromCapID(id1, id2, id3) {

        var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);
        var capId = capIDScriptModel.getCapID();
        var capModel = aa.cap.getCap(capId).getOutput().getCapModel();
        var altID = capModel.getAltID();
        return altID;


    }

    /**
     * Edit applcation / recod file date
     * @param {object} itemCap - cap record
     * @param {date} fileDate
     * @returns {boolean} - Success
     */
    function editFileDate(itemCap, fileDate) {
        try {
            var javascriptDate = new Date(fileDate);
            var vfileDate = aa.date.transToJavaUtilDate(javascriptDate.getTime());

            var scriptDt = aa.date.parseDate(dateAdd(vfileDate, 0));
            //logDebug(scriptDt.getMonth() + "/" + scriptDt.getDayOfMonth() + "/" + scriptDt.getYear());

            var thisCapObj = aa.cap.getCap(itemCap).getOutput();
            thisCapObj.setFileDate(scriptDt);
            var capModel = thisCapObj.getCapModel();
            var setFileDateResult = aa.cap.editCapByPK(capModel);
            if (!setFileDateResult.getSuccess()) {
                logDebug("**WARNING: error setting cap name : " + setFileDateResult.getErrorMessage());
                return false;
            }


        }
        catch (err) {
            logDebug("**ERROR An error occured in editFileDate  Error:  " + err.message);
        }
        return true;
    }

    /**
     * Create Record Type instance.
     * @param {string} group
     * @param {string} type
     * @param {string} subType
     * @param {string} category
     * @returns {object} - cap Type Model
     */
    function getRecordTypeInstance(group, type, subType, category) {
        var capTypeModelResult = aa.cap.getCapTypeModel();

        var capTypeModel = capTypeModelResult.getOutput();
        capTypeModel.setGroup(group);
        capTypeModel.setType(type);
        capTypeModel.setSubType(subType);
        capTypeModel.setCategory(category);

        return capTypeModel;
    }

    function removeAddressCondition(ipCondion) {
        var vCapID = capId;
        if (arguments.length > 1 && arguments[1])
            vCapID = arguments[1];

        var vAddrs = aa.address.getAddressByCapId(vCapID).getOutput();
        for (var vAddrCounter in vAddrs) {
            var vAddr = vAddrs[vAddrCounter];
            var vAddrConds = aa.addressCondition.getAddressConditions(vAddr.getRefAddressId()).getOutput();
            for (var vAddrCondCounter in vAddrConds) {
                var vAddrCond = vAddrConds[vAddrCondCounter];
                if (vAddrCond.getConditionDescription() == ipCondion) {
                    aa.addressCondition.removeAddressCondition(vAddr.getRefAddressId(), vAddrCond.conditionNumber);
                }
            }
        }
    }

    function getAddressConditionsASB(pType, pStatus, pDesc, pImpact, pAddrRefID) {
        var resultArray = new Array();
        var lang = "en_US";
        var bizDomainModel4Lang = aa.bizDomain.getBizDomainByValue("I18N_SETTINGS", "I18N_DEFAULT_LANGUAGE");
        if (bizDomainModel4Lang.getSuccess()) {
            lang = bizDomainModel4Lang.getOutput().getDescription();
        }

        if (pAddrRefID) {
            addCondResult = aa.addressCondition.getAddressConditions(pAddrRefID);
            if (!addCondResult.getSuccess()) {
                logDebug("**WARNING: getting Address Conditions : " + addCondResult.getErrorMessage());
                var addrCondArray = new Array();
            } else {
                var addrCondArray = addCondResult.getOutput();
            }
            for (var thisAddrCond in addrCondArray) {
                var thisCond = addrCondArray[thisAddrCond];
                var cType = thisCond.getConditionType();
                var cStatus = thisCond.getConditionStatus();
                var cDesc = thisCond.getConditionDescription();
                var cImpact = thisCond.getImpactCode();
                var cType = thisCond.getConditionType();
                var cComment = thisCond.getConditionComment();
                var cExpireDate = thisCond.getExpireDate();
                if (cType == null) {
                    cType = " ";
                }
                if (cStatus == null) {
                    cStatus = " ";
                }
                if (cDesc == null) {
                    cDesc = " ";
                }
                if (cImpact == null) {
                    cImpact = " ";
                }
                if ((pType == null || pType.toUpperCase().equals(cType.toUpperCase())) && (pStatus == null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc == null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact == null || pImpact.toUpperCase().equals(cImpact.toUpperCase()))) {
                    var r = new condMatchObj;
                    r.objType = "Address";
                    r.addressID = pAddrRefID;
                    r.status = cStatus;
                    r.type = cType;
                    r.impact = cImpact;
                    r.description = cDesc;
                    r.comment = cComment;
                    r.expireDate = cExpireDate;
                    var langCond = aa.condition.getCondition(thisCond, lang).getOutput();
                    r.arObject = langCond;
                    r.arDescription = langCond.getResConditionDescription();
                    r.arComment = langCond.getResConditionComment();
                    resultArray.push(r);
                }
            }
        }
        return resultArray;
    }

    function getAllRoots(nodeId, rootsArray) {
        var directParentsResult = aa.cap.getProjectByChildCapID(nodeId, "R", null);
        if (directParentsResult.getSuccess()) {
            tmpdirectParents = directParentsResult.getOutput();
            for (ff in tmpdirectParents) {
                if (tmpdirectParents[ff]) {
                    var tmpNode = tmpdirectParents[ff].getProjectID();
                    var pCapId = aa.cap.getCapID(tmpNode.getID1(), tmpNode.getID2(), tmpNode.getID3()).getOutput();
                    rootsArray.push(pCapId);
                    getAllRoots(pCapId, rootsArray);
                }
            }
        }
        return rootsArray
    }

    function getAllParents(pAppType) {
        // returns the capId array of all parent caps
        //Dependency: appMatch function
        //
        parentArray = getAllRoots(capId, new Array());
        myArray = new Array();
        if (parentArray.length > 0) {
            if (parentArray.length) {
                for (x in parentArray) {
                    if (pAppType != null) {
                        //If parent type matches apType pattern passed in, add to return array
                        if (appMatch(pAppType, parentArray[x]))
                            myArray.push(parentArray[x]);
                    }
                    else
                        myArray.push(parentArray[x]);
                }
                return myArray;
            }
            else {
                logDebug("**WARNING: GetParent found no project parent for this application");
                return null;
            }
        }
        else {
            logDebug("**WARNING: GetParent found no project parent for this application");
            //logDebug("**WARNING: getting project parents:  " + getCapResult.getErrorMessage());
            return null;
        }
    }
    function getParents(pAppType) {
        // returns the capId array of all parent caps
        //Dependency: appMatch function
        //
        parentArray = getRoots(capId);
        myArray = new Array();
        if (parentArray.length > 0) {
            if (parentArray.length) {
                for (x in parentArray) {
                    if (pAppType != null) {
                        //If parent type matches apType pattern passed in, add to return array
                        if (appMatch(pAppType, parentArray[x]))
                            myArray.push(parentArray[x]);
                    }
                    else
                        myArray.push(parentArray[x]);
                }
                return myArray;
            }
            else {
                logDebug("**WARNING: GetParent found no project parent for this application");
                return null;
            }
        }
        else {
            logDebug("**WARNING: getting project parents:  " + getCapResult.getErrorMessage());
            return null;
        }
    }

    /*
    Returns true if LP on the record is linked to the public user, else false
     */
    function isLPLinkedToCurrentuser() {
        var lpHM = new Array();
        var lpArr = getLicenseProfessional(capId);
        for (var i in lpArr) {
            lpHM[lpArr[i].getLicenseNbr() + ""] = 1;
        }
        var publicUserModelResult = aa.publicUser.getPublicUserByPUser(aa.env.getValue("CurrentUserID"));
        if (!publicUserModelResult.getSuccess() || !publicUserModelResult.getOutput()) {
            aa.print("**WARNING** couldn't find public user " + publicUser + " " + publicUserModelResult.getErrorMessage());
            return false;
        }
        var userSeqNum = publicUserModelResult.getOutput().getUserSeqNum();
        var associatedLPResult = aa.licenseScript.getRefLicProfByOnlineUser(userSeqNum);

        if (!associatedLPResult.getSuccess() || !associatedLPResult.getOutput()) {
            return false;
        }
        var associatedLPs = associatedLPResult.getOutput();
        for (var x in associatedLPs) {
            var lp = associatedLPs[x];
            if (lpHM[lp.getStateLicense() + ""] == 1 && lp.getAuditStatus() == "A") {
                return true;
            }
        }
        return false;
    }

    function copyAppName(ipSrcCapId, ipTrgtCapId) {
        var vSrcCap = aa.cap.getCap(ipSrcCapId).getOutput();
        var capName = vSrcCap.getSpecialText();
        editAppName(capName, ipTrgtCapId);
    }

    function getAppTypeArray(ipCapID) {
        var vMatchCap = aa.cap.getCap(ipCapID).getOutput();
        var opMatchArray = vMatchCap.getCapType().toString().split("/");
        return opMatchArray;
    }

    function setCapExpirationDate(ipCapID, ipDateStr) {
        var vExpDate;
        b1ExpResult = aa.expiration.getLicensesByCapID(ipCapID);
        if (b1ExpResult.getSuccess()) {
            this.b1Exp = b1ExpResult.getOutput();
            var vDate = new Date(ipDateStr);
            vExpDate = aa.date.getScriptDateTime(vDate);
            b1Exp.setExpDate(vExpDate);
            b1Exp.setExpStatus("Active");
            aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
        }
        logDebug("Successfully set the expiration date and status");
        return true;
    }

    function isAppSubmitted() {
        var opAppSubmitted = false;
        if (controlString.substr(0, 17) == "ApplicationSubmit") {
            opAppSubmitted = true;
            if (appTypeArray.length == 0 || appTypeArray[3] == "Renewal") {
                var opAppSubmitted = false;
                if (publicUser) {
                    if (capId) {
                        var vContactArray = new Array();
                        if (controlString == "ApplicationSubmitAfter")
                            vContactArray = getContactArray(capId);
                        else
                            vContactArray = getContactArrayBefore();
                        if (vContactArray.length > 0)
                            opAppSubmitted = true;
                    }
                }
            }
        }
        return opAppSubmitted;
    }

    function copyASISubgroup(ipSourceCapId, ipTargetCapId, ipSubgroup) {
        var vIgnoreArray = new Array();
        for (var vCounter1 = 3; vCounter1 < arguments.length; vCounter1++) {
            vIgnoreArray.push(arguments[vCounter1]);
        }

        var vAppSpecInfoResult = aa.appSpecificInfo.getByCapID(ipSourceCapId);
        if (vAppSpecInfoResult.getSuccess()) {
            var vAppspecObj = vAppSpecInfoResult.getOutput();
            for (var vCounter2 in vAppspecObj) {
                if (vAppspecObj[vCounter2].getCheckboxType() == ipSubgroup) {
                    if (!exists(vAppspecObj[vCounter2].getCheckboxDesc(), vIgnoreArray)) {
                        useAppSpecificGroupName = true;
                        editAppSpecific(ipSubgroup + "." + vAppspecObj[vCounter2].getCheckboxDesc(), vAppspecObj[vCounter2].getChecklistComment(), ipTargetCapId);
                        useAppSpecificGroupName = false;
                    }
                }
            }
        } else {
            logDebug("**ERROR: getting app specific info for Cap : " + vAppSpecInfoResult.getErrorMessage());
        }
    }

    function copyASISubgroupWithNewSubGroup(ipSourceCapId, ipTargetCapId, ipSubgroup, ipNewSubGroup) {
        var vIgnoreArray = new Array();
        for (var vCounter1 = 4; vCounter1 < arguments.length; vCounter1++) {
            vIgnoreArray.push(arguments[vCounter1]);
        }

        var vAppSpecInfoResult = aa.appSpecificInfo.getByCapID(ipSourceCapId);
        if (vAppSpecInfoResult.getSuccess()) {
            var vAppspecObj = vAppSpecInfoResult.getOutput();
            for (var vCounter2 in vAppspecObj) {
                if (vAppspecObj[vCounter2].getCheckboxType().toUpperCase() == ipSubgroup.toUpperCase()) {
                    if (!exists(vAppspecObj[vCounter2].getCheckboxDesc(), vIgnoreArray)) {
                        useAppSpecificGroupName = true;
                        editAppSpecific(ipNewSubGroup.toUpperCase() + "." + vAppspecObj[vCounter2].getCheckboxDesc(), vAppspecObj[vCounter2].getChecklistComment(), ipTargetCapId);
                        useAppSpecificGroupName = false;
                    }
                }
            }
        } else {
            logDebug("**ERROR: getting app specific info for Cap : " + vAppSpecInfoResult.getErrorMessage());
        }
    }

    function copyASIArray(ipSourceCapId, ipTargetCapId, ipASIArray) {
        for (var vCounter in ipASIArray) {
            var vASI = ipASIArray[vCounter];
            var vASIVal = getAppSpecific(vASI, ipSourceCapId);
            editAppSpecific(vASI, vASIVal, ipTargetCapId);
        }
    }

    function createParent(grp, typ, stype, cat, desc) {
        var itemCap = capId;
        if (arguments.length > 5) {
            itemCap = arguments[5];
        }
        var appCreateResult = aa.cap.createApp(grp, typ, stype, cat, desc);
        logDebug("creating cap " + grp + "/" + typ + "/" + stype + "/" + cat);
        if (appCreateResult.getSuccess()) {
            var newId = appCreateResult.getOutput();
            logDebug("cap " + grp + "/" + typ + "/" + stype + "/" + cat + " created successfully ");
            capModel = aa.cap.newCapScriptModel().getOutput();
            capDetailModel = capModel.getCapModel().getCapDetailModel();
            capDetailModel.setCapID(newId);
            aa.cap.createCapDetail(capDetailModel);
            var newObj = aa.cap.getCap(newId).getOutput();
            var result = aa.cap.createAppHierarchy(newId, itemCap);
            if (result.getSuccess()) {
                logDebug("Parent application successfully linked")
            } else {
                logDebug("Could not link applications")
            }
            var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
            if (capParcelResult.getSuccess()) {
                var Parcels = capParcelResult.getOutput().toArray();
                for (zz in Parcels) {
                    logDebug("adding parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                    var newCapParcel = aa.parcel.getCapParcelModel().getOutput();
                    newCapParcel.setParcelModel(Parcels[zz]);
                    newCapParcel.setCapIDModel(newId);
                    newCapParcel.setL1ParcelNo(Parcels[zz].getParcelNumber());
                    newCapParcel.setParcelNo(Parcels[zz].getParcelNumber());
                    newCapParcel.setUID(Parcels[zz].getUID() + "");
                    aa.parcel.createCapParcel(newCapParcel)
                }
            }
            copyContacts(itemCap, newId);
            capAddressResult = aa.address.getAddressByCapId(itemCap);
            if (capAddressResult.getSuccess()) {
                Address = capAddressResult.getOutput();
                for (yy in Address) {
                    newAddress = Address[yy];
                    newAddress.setCapID(newId);
                    aa.address.createAddress(newAddress);
                    logDebug("added address")
                }
            }
            return newId
        } else {
            logDebug("**ERROR: adding parent App: " + appCreateResult.getErrorMessage())
        }
    }

    /**
     * To Update Expiration
     * @param {object} itemCap - Record Cap
     * @param {date} clacFromDt - Calculate Date From
     * @param {date} dateOverride - Optional Date To overide use for calculation
     * @param {date} renewalStatus - Optional renewal status to set
     * @param {date} ExpCode - Optional Expiration Code To Set
     * @param {date} isOverrideExpdate - Optional Expiration date To Set
     */
    function UpdateExpiration(itemCap, clacFromDt) {
        //itemCap - license capId
        //calcDateFrom - MM/DD/YYYY - the from date to use in the date calculation
        //dateOverride - MM/DD/YYYY - override the calculation, this date will be used
        //renewalStatus - if other than active override the status
        //ExpCode - if other than active override the status

        var calcDateFrom = "";
        if (arguments.length >= 2) calcDateFrom = arguments[1];
        var dateOverride = null;
        if (arguments.length >= 3) dateOverride = arguments[2];
        var renewalStatus = null;
        if (arguments.length >= 4) renewalStatus = arguments[3]; // renewal status
        //Set Expiration Depending Code; e.g;  5 Year Or 6 Years
        var ExpCode = "";
        if (arguments.length >= 5) ExpCode = arguments[4]; // ExpCode by Bo
        var isOverrideExpdate = false;
        if (arguments.length >= 6) isOverrideExpdate = arguments[5]; // isOverrideExpdate

        var isExpExists = false;
        var b1Exp = null;
        var result = aa.expiration.getLicensesByCapID(itemCap);
        if (result.getSuccess()) {
            b1Exp = result.getOutput();
            isExpExists = IsExpirationDateExists(b1Exp);
        }

        if (isExpExists) {
            var b1ExpModel = null;
            if (gs2.common.isNull(ExpCode, '') != "") {
                b1ExpModel = getBoExpirationCodeModel(b1Exp, ExpCode);
                updateExpirartionCodeDetails(itemCap, b1Exp);
            }
            setLicExpirationDate(itemCap, calcDateFrom, dateOverride, renewalStatus, isOverrideExpdate);
        }
    }

    /**
     * To get Expiration Code Model using code
     * @param {Object} b1Exp - record expiration model
     * @param {string} expirationCode - Espiration Code
     * @returns {Object} - Expiration Model with new object
     */
    function getBoExpirationCodeModel(b1Exp, expirationCode) {
        var expCodeObj = getExpirartionCodeDetails(expirationCode);

        if (b1Exp) {
            b1Exp.setExpCode(expCodeObj.ExpirationCode);
            b1Exp.setExpUnit(expCodeObj.ExpIntervalUnit);
            b1Exp.setExpInterval(expCodeObj.ExpInterval);

            return b1Exp.getB1Expiration();
        }
        return null;
    }

    /**
     * To check Is Expiration Date (model) Exists
     * @param {Object} - Expiration Model
     * @returns {boolean} - Success
     */
    function IsExpirationDateExists(b1Exp) {
        var retvalue = false;
        try {
            var tmpDate = b1Exp.getExpDate();
            retvalue = true;
        } catch (err) {
            logDebug("**WARNING IsExpirationDateExists: No Expiration Date Exists:  " + err.message);
        }
        return retvalue;
    }

    /**
     * Expiration Defination Object
     * @param {string} expirationCode - Expiration code
     */
    function ExpirationDef(expirationCode) {
        this.ExpirationCode = expirationCode;
        this.ExpIntervalUnit = null;
        this.Method = null;
        this.ExpInterval = null;
        this.Desc = null;

        this.ExpirationDate = null;
        this.ExpStatus = "Active";

        this.PenaltyPeriod = 0;
        this.PenaltyNum = 0;
        this.PenaltyInterval = 0;
        this.PenaltyFunction = "PERCENTAGE_PENALTY_FEE";
        this.PenaltyCode = "NONE";
        this.PenaltyUnit = "Days";

        this.RenewalFunction = "NONE";
        this.RenewalCode = "NONE";
        this.PayPeriodGroup = "NONE";
        this.GraceUnit = 0;
        this.GraceInterval = 0;
    }

    /**
     * To get expiration code details
     * @param {string} expirationCode - Expiration Code
     * @returns {object} - Expiration Defination object
     */
    function getExpirartionCodeDetails(expirationCode) {
        var sql = "Select EXPIRATION_CODE, EXPIRATION_INTERVAL, EXPIRATION_INTERVAL_UNITS, INITIAL_EXP_METHOD, EXPIRATION_CODE_DESCRIPTION From R1_EXPIRATION WHERE REC_STATUS = 'A'  ";
        sql += " AND EXPIRATION_CODE = '" + expirationCode + "' ";

        var expObj = new ExpirationDef(expirationCode);
        var vError = '';
        var conn = null;
        var sStmt = null;
        var rSet = null;

        try {
            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
            var ds = initialContext.lookup("java:/AA");
            conn = ds.getConnection();

            //logDebug(sql);
            sStmt = conn.prepareStatement(sql);
            rSet = sStmt.executeQuery();

            while (rSet.next()) {
                expObj.ExpInterval = rSet.getString("EXPIRATION_INTERVAL");
                expObj.ExpIntervalUnit = rSet.getString("EXPIRATION_INTERVAL_UNITS");
                expObj.Method = rSet.getString("INITIAL_EXP_METHOD");
                expObj.Desc = rSet.getString("EXPIRATION_CODE_DESCRIPTION");
                break;
            }

        } catch (vError) {
            logDebug("Runtime error occurred: " + vError);
        }
        gs2.util.closeDBQueryObject(rSet, sStmt, conn);
        return expObj;
    }

    /**
     * To set Expiration Date for record
     * @param {object} itemCap - record cap
     * @returns {boolean} - Success
     */
    function setLicExpirationDate(itemCap) {
        //itemCap - license capId
        //the following are optional parameters
        //calcDateFrom - MM/DD/YYYY - the from date to use in the date calculation
        //dateOverride - MM/DD/YYYY - override the calculation, this date will be used
        //renewalStatus - if other than active override the status

        var licNum = itemCap.getCustomID();
        var isExpDate = false;
        if (arguments.length == 1) {
            calcDateFrom = 0;
            dateOverride = null;
            renewalStatus = null;
        }
        if (arguments.length == 2) {
            calcDateFrom = arguments[1];
            dateOverride = null;
            renewalStatus = null;
        }

        if (arguments.length == 3) {
            calcDateFrom = arguments[1];
            dateOverride = arguments[2];
            renewalStatus = null;
        }

        if (arguments.length == 4) {
            calcDateFrom = arguments[1];
            dateOverride = arguments[2];
            renewalStatus = arguments[3];
        }

        if (arguments.length == 5) {
            calcDateFrom = arguments[1];
            dateOverride = arguments[2];
            renewalStatus = arguments[3];
            isExpDate = arguments[4];
        }

        thisLic = new licenseObject(licNum, itemCap);
        //logDebug(calcDateFrom);
        //logDebug(dateOverride);
        //logDebug(renewalStatus);
        //logDebug(isExpDate);

        try {
            var tmpNewDate = "";

            b1ExpResult = aa.expiration.getLicensesByCapID(itemCap);
            var expUnit = null;
            var expInterval = null;
            if (b1ExpResult.getSuccess()) {
                this.b1Exp = b1ExpResult.getOutput();

                //Get expiration details
                expCode = this.b1Exp.getExpCode();
                expUnit = this.b1Exp.getExpUnit();
                expInterval = this.b1Exp.getExpInterval();

                if (expUnit == null) {
                    logDebug("Could not set the expiration date, no expiration unit defined for expiration code: " + this.b1Exp.getExpCode());
                } else {
                    if (expUnit == "Days") {
                        tmpNewDate = dateAdd(calcDateFrom, expInterval);
                    }

                    if (expUnit == "Months") {
                        tmpNewDate = dateAddMonths(calcDateFrom, expInterval);
                    }

                    if (expUnit == "Years") {
                        tmpNewDate = dateAddMonths(calcDateFrom, expInterval * 12);
                    }
                }
            }
            if (dateOverride == null) {
                if (tmpNewDate != '') {
                    thisLic.setExpiration(dateAdd(tmpNewDate, 0));
                }
            } else {
                if (expUnit == "Years" && parseInt(expInterval, 10) > 1) {
                    if (isExpDate) {
                        thisLic.setExpiration(dateAdd(dateOverride, 0));
                    } else {
                        thisLic.setExpiration(dateAddMonths(dateOverride, (parseInt(expInterval, 10) - 1) * 12));
                    }
                } else {
                    thisLic.setExpiration(dateAdd(dateOverride, 0));
                }
            }
        }
        catch (err) {
            logDebug("**WARNING An error occurred in setLicExpirationDate  Error1:  " + err.message);
        }

        if (renewalStatus != null) {
            thisLic.setStatus(renewalStatus);
        } else {
            thisLic.setStatus("Active");
        }

        logDebug("Successfully set the expiration date and status");
        return true;
    }

    /**
     * To update Expirartion Code Details
     * @param {object} itemCap - Record cap
     * @param {object} b1ExpModel - Record Expiration Model Object
     */
    function updateExpirartionCodeDetails(itemCap, b1ExpModel) {
        var sql = "UPDATE B1_expiration SET  EXPIRATION_CODE = '" + b1ExpModel.getExpCode() + "', EXPIRATION_INTERVAL = " + b1ExpModel.getExpInterval() + ", EXPIRATION_INTERVAL_UNITS = '" + b1ExpModel.getExpUnit() + "'  Where SERV_PROV_CODE = '" + aa.getServiceProviderCode() + "' AND B1_PER_ID1 = '" + itemCap.getID1() + "' AND B1_PER_ID2 = '" + itemCap.getID2() + "' AND B1_PER_ID3 = '" + itemCap.getID3() + "' ";

        var vError = '';
        var conn = null;
        var sStmt = null;
        var rSet = null;

        try {
            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
            var ds = initialContext.lookup("java:/AA");
            conn = ds.getConnection();

            //logDebug(sql);
            sStmt = conn.prepareStatement(sql);
            rSet = sStmt.executeQuery();
        } catch (vError) {
            logDebug("**WARNING error occurred: " + vError);
        }
        gs2.util.closeDBQueryObject(rSet, sStmt, conn);
    }

    /**
     * To update set Expiration code to null
     * @param {object} itemCap - Record cap
     */
    function clearExpirationCode(itemCap) {
        var sql = "UPDATE B1_expiration SET  EXPIRATION_DATE = null Where B1_PER_ID1 = '" + itemCap.getID1() + "' AND B1_PER_ID2 = '" + itemCap.getID2() + "' AND B1_PER_ID3 = '" + itemCap.getID3() + "' ";

        var vError = '';
        var conn = null;
        var sStmt = null;
        var rSet = null;

        try {
            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
            var ds = initialContext.lookup("java:/AA");
            conn = ds.getConnection();

            //logDebug(sql);
            sStmt = conn.prepareStatement(sql);
            rSet = sStmt.executeQuery();
        } catch (vError) {
            logDebug("**WARNING error occurred: " + vError);
        }
        gs2.util.closeDBQueryObject(rSet, sStmt, conn);
    }


    /**
     * To Set Expiration Date for record
     * @param {object} itemCap - Record cap
     * @param {string} wfTask - workflow task name
     * @param {string} wfStatus - workflow status
     */
    function SetExpirationDate(itemCap, wfTask, wfStatus) {
        logDebug("ENTER: SetExpirationDate");
        if (appObj) {
            //Obj Exist
        } else {
            gs2.common.initializeAppObject();
        }
        if (appObj) {
            var expobjArray = appObj.GetAppExpiration();

            var expObj = expobjArray[appTypeString];
            if (expObj) {
                var tskexp = expObj[wfTask];
                for (var sta in tskexp.status) {
                    if (tskexp.status[sta] == wfStatus) {
                        var calcDate = new Date();
                        if (tskexp.dateEval) {
                            try {
                                eval('calcDate = ' + tskexp.dateEval);
                            } catch (err) {
                                //
                            }
                        }
                        logDebug(calcDate);
                        if (tskexp.expcode != 'NA') {
                            UpdateExpiration(itemCap, calcDate, null, "Active", tskexp.expcode);
                        } else {
                            if (tskexp.actionEval) {
                                try {
                                    eval(tskexp.actionEval);
                                } catch (err) {
                                    //
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    /**
     * To Set Parent Expiraton Date
     */
    function SetParentExpiratonDate() {
        var calcDate = new Date();
        var expcode = "NA";

        var parentCap = getParent();
        var parentAppTypeString = parentCap.toString();

        if (parentAppTypeString == "LandDevelopment/Land Entitlement/Master Development Plan/NA") {
            expcode = "EXP_5YEAR";
        }
        if (parentAppTypeString == "LandDevelopment/Land Entitlement/Planned Unit Development/NA") {
            expcode = "EXP_6YEAR";
        }

        if (expcode != 'NA') {
            UpdateExpiration(parentCap, calcDate, null, "Active", expcode);
        }
    }

    /**
     * Add Standard Condition with comments: Either Group or Type and Description are required
     * As Conditional Documents are not available in search result. Therefore, implement that through aa.capCondition.addCapCondition
     * @param {string} cGroup - Condition Group
     * @param {string} cType - Condition Type
     * @param {string} cDesc - Condition Description
     * @param {string} cShortComment - Optional Short comments
     * @param {string} cLongComment - Optional Long comments
     * @param {string} cConditionOfApproval - Optional Condition of Approval
     * @param {string} itemCap - Optional Record Cap
     */
    function addStdConditionWithComments(cGroup, cType, cDesc, cShortComment, cLongComment, cConditionOfApproval) {
        // optional cap ID
        logDebug("ENTER: addStdConditionWithComments: Group > " + cGroup + ", Type > " + cType + ", Desc > " + cDesc + ", ShortComment > " + cShortComment + ", LongComment > " + cLongComment);

        var itemCap = capId;
        if (arguments.length == 7) itemCap = arguments[4]; // use cap ID specified in args

        if (!aa.capCondition.getStandardConditions) {
            logDebug("addStdCondition function is not available in this version of Accela Automation.");
        }
        else {
            // Conditional Document conditions won't popped up in search result due to missing of actual conditions
            if (cGroup.toUpperCase() == "CONDITIONAL DOCUMENTS" || cType.toUpperCase() == "CONDITIONAL DOCUMENTS") {
                logDebug("Condition Group: " + cGroup);
                aa.capCondition.addCapCondition(itemCap, cType, cDesc, cShortComment, aa.date.getCurrentDate(), null, aa.date.getCurrentDate(), "", "", "Notice", systemUserObj, systemUserObj, "Applied", currentUserID, "A", "Applied", "Y", "Y", "Y", "N", cLongComment, "", "", "", "", 0, cGroup, "Y", "N");
            }
            else {
                if (cGroup != null && cGroup != '') {
                    logDebug("Search by Group: " + cGroup);
                    standardConditions = aa.capCondition.getStandardConditionsByGroup(cGroup).getOutput();
                }
                else {
                    logDebug("Search by Type: " + cType + " and Desc: " + cDesc);
                    standardConditions = aa.capCondition.getStandardConditions(cType, cDesc).getOutput();
                }

                for (i = 0; i < standardConditions.length; i++) {
                    logDebug("No. of Conditions Found: " + standardConditions.length);
                    if (standardConditions[i].getConditionType().toUpperCase() == cType.toUpperCase() &&
                    (standardConditions[i].getConditionDesc().toUpperCase() == cDesc.toUpperCase() ||
                    standardConditions[i].getConditionGroup().toUpperCase() == cGroup.toUpperCase())) //EMSE Dom function does like search, needed for exact match
                    {
                        standardCondition = standardConditions[i];
                        if (cShortComment != null && cShortComment != '') {
                            standardCondition.setConditionComment(cShortComment);
                        }

                        if (cLongComment != null && cLongComment != '') {
                            standardCondition.setLongDescripton(cLongComment);
                        }

                        if (cConditionOfApproval != null && cConditionOfApproval != '') {
                            standardCondition.setConditionOfApproval(cConditionOfApproval);
                        }



                        var addCapCondResult = aa.capCondition.createCapConditionFromStdCondition(itemCap, standardCondition);
                        if (addCapCondResult.getSuccess()) {
                            logDebug("Successfully added condition (" + standardCondition.getConditionDesc() + ")");
                        }
                        else {
                            logDebug("**ERROR: adding condition (" + standardCondition.getConditionDesc() + "): " + addCapCondResult.getErrorMessage());
                        }
                    }
                }
            }
        }
        logDebug("EXIT: addStdConditionWithComments");
    }

    //Applicant contact type checking during renewal creation
    function renewalContactTypeChecking(capId) {
        var applicantContactChecking = false;
        var capContactResult = aa.people.getCapContactByCapID(capId);
        if (capContactResult.getSuccess()) {
            var Contacts = capContactResult.getOutput();
            for (yy in Contacts) {
                var newContact = Contacts[yy].getCapContactModel();
                var vCType = newContact.getContactType();
                if (vCType == "Applicant") {
                    applicantContactChecking = true;
                }
            }
        }
        return applicantContactChecking;
    }


    //Retrieving parent for renewal records
    function getParentIdForRenewal(pCapId) {
        try {
            var result2 = aa.cap.getProjectByChildCapID(pCapId, null, null);
            if (result2.getSuccess()) {
                var licenseProjects = result2.getOutput();
                if (licenseProjects != null && licenseProjects.length > 0) {
                    var licenseProject = licenseProjects[0];
                    var vParentLic = licenseProject.getProjectID();
                    var vLicArray = String(vParentLic).split("-");
                    var parentLicenseCAPID = aa.cap.getCapID(vLicArray[0], vLicArray[1], vLicArray[2]).getOutput();
                    return parentLicenseCAPID;
                }
            }
        } catch (err) {
            logDebug("Error**getParentIdForRenewal():" + err.message)
        }
        return false;
    }

    function createChild(grp, typ, stype, cat, desc) {
        var itemCap = capId;
        if (arguments.length > 5) {
            itemCap = arguments[5]
        }
        var appCreateResult = aa.cap.createApp(grp, typ, stype, cat, desc);
        logDebug("creating cap " + grp + "/" + typ + "/" + stype + "/" + cat);
        if (appCreateResult.getSuccess()) {
            var newId = appCreateResult.getOutput();
            logDebug("cap " + grp + "/" + typ + "/" + stype + "/" + cat + " created successfully ");
            capModel = aa.cap.newCapScriptModel().getOutput();
            capDetailModel = capModel.getCapModel().getCapDetailModel();
            capDetailModel.setCapID(newId);
            aa.cap.createCapDetail(capDetailModel);
            var newObj = aa.cap.getCap(newId).getOutput();
            var result = aa.cap.createAppHierarchy(itemCap, newId);
            if (result.getSuccess()) {
                logDebug("Child application successfully linked")
            } else {
                logDebug("Could not link applications")
            }
            var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
            if (capParcelResult.getSuccess()) {
                var Parcels = capParcelResult.getOutput().toArray();
                for (zz in Parcels) {
                    logDebug("adding parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                    var newCapParcel = aa.parcel.getCapParcelModel().getOutput();
                    newCapParcel.setParcelModel(Parcels[zz]);
                    newCapParcel.setCapIDModel(newId);
                    newCapParcel.setL1ParcelNo(Parcels[zz].getParcelNumber());
                    newCapParcel.setParcelNo(Parcels[zz].getParcelNumber());
                    newCapParcel.setUID(Parcels[zz].getUID() + "");
                    aa.parcel.createCapParcel(newCapParcel)
                }
            }
            capContactResult = aa.people.getCapContactByCapID(itemCap);
            if (capContactResult.getSuccess()) {
                Contacts = capContactResult.getOutput();
                for (yy in Contacts) {
                    var newContact = Contacts[yy].getCapContactModel();
                    newContact.setCapID(newId);
                    aa.people.createCapContact(newContact);
                    logDebug("added contact")
                }
            }
            capAddressResult = aa.address.getAddressByCapId(itemCap);
            if (capAddressResult.getSuccess()) {
                Address = capAddressResult.getOutput();
                for (yy in Address) {
                    newAddress = Address[yy];
                    newAddress.setCapID(newId);
                    aa.address.createAddress(newAddress);
                    logDebug("added address")
                }
            }
            return newId
        } else {
            logDebug("**ERROR: adding child App: " + appCreateResult.getErrorMessage())
        }
    }

    function appHasConditionWithShortComment(pType, pStatus, pDesc, pImpact, pShortComment) {
        if (pType == null) {
            var condResult = aa.capCondition.getCapConditions(capId)
        } else {
            var condResult = aa.capCondition.getCapConditions(capId, pType)
        }
        if (condResult.getSuccess()) {
            var capConds = condResult.getOutput()
        } else {
            logMessage("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
            logDebug("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
            return false
        }
        var cStatus;
        var cDesc;
        var cImpact;
        var returnValue = false;
        for (cc in capConds) {
            var thisCond = capConds[cc];
            var cStatus = thisCond.getConditionStatus();
            var cDesc = thisCond.getConditionDescription();
            var cImpact = thisCond.getImpactCode();
            var cType = thisCond.getConditionType();
            var cShortComment = thisCond.getConditionComment();

            // logDebug("appHasConditionWithShortComment > " + "pStatus: " + pStatus);
            // logDebug("appHasConditionWithShortComment > " + "pDesc: " + pDesc);
            // logDebug("appHasConditionWithShortComment > " + "pImpact: " + pImpact);
            // logDebug("appHasConditionWithShortComment > " + "pShortComment: " + pShortComment);
            // logDebug("appHasConditionWithShortComment > " + "cStatus: " + cStatus);
            // logDebug("appHasConditionWithShortComment > " + "cDesc: " + cDesc);
            // logDebug("appHasConditionWithShortComment > " + "cImpact: " + cImpact);
            // logDebug("appHasConditionWithShortComment > " + "cShortComment: " + cShortComment);

            if (cStatus == null) {
                cStatus = " "
            }
            if (cDesc == null) {
                cDesc = " "
            }
            if (cImpact == null) {
                cImpact = " "
            }
            if (cShortComment == null) {
                cShortComment = " "
            }
            if ((pStatus == null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc == null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact == null || pImpact.toUpperCase().equals(cImpact.toUpperCase())) && (pShortComment == null || pShortComment.toString().toUpperCase().equals(cShortComment.toUpperCase()))) {
                returnValue = true;
            }

            // logDebug("appHasConditionWithShortComment > " + "returnValue: " + returnValue);
            // logDebug("**ERROR: Dante Testing");
        }

        return returnValue;
    }


    //Add standard condition to the specific CapID
    function addSTDCondition(cType, cDesc, vCapID) {
        if (!aa.capCondition.getStandardConditions) {
            logDebug("addStdCondition function is not available in this version of Accela Automation.");
        }
        else {
            standardConditions = aa.capCondition.getStandardConditions(cType, cDesc).getOutput();
            for (i = 0; i < standardConditions.length; i++) {
                standardCondition = standardConditions[i];
                if (standardCondition.getConditionType().toUpperCase() == cType.toUpperCase() && standardCondition.getConditionDesc().toUpperCase() == cDesc.toUpperCase()) {
                    var addCapCondResult = aa.capCondition.createCapConditionFromStdCondition(vCapID, standardCondition);

                    if (addCapCondResult.getSuccess()) {
                        logDebug("Successfully added condition (" + standardCondition.getConditionDesc() + ")");
                    }
                    else {
                        logDebug("**ERROR: adding condition (" + standardCondition.getConditionDesc() + "): " + addCapCondResult.getErrorMessage());
                    }
                }
            }
        }
    }

    function compareAndRemoveExistingAddresses(ipCapId, ipContactSeq, ipRefPeopleId) {
        var vEmptyCAMR = aa.proxyInvoker.newInstance("com.accela.orm.model.address.ContactAddressModel").getOutput();
        vEmptyCAMR.setEntityID(parseInt(ipRefPeopleId));
        vEmptyCAMR.setEntityType("CONTACT");
        var vRefCAs = aa.address.getContactAddressList(vEmptyCAMR).getOutput();
        var vEmptyCAMC = aa.proxyInvoker.newInstance("com.accela.orm.model.address.ContactAddressModel").getOutput();
        vEmptyCAMC.setEntityID(parseInt(ipContactSeq));
        vEmptyCAMC.setEntityType("CAP_CONTACT");
        var vCapCAs = aa.address.getContactAddressList(vEmptyCAMC).getOutput();
        var opDeletedCAs = new Array();
        for (var vCounterR in vRefCAs) {
            var vRefCA = vRefCAs[vCounterR];
            var vRefCACM = vRefCA.contactAddressModel;
            for (var vCounterC in vCapCAs) {
                var vCapCA = vCapCAs[vCounterC];
                var vCapCACM = vCapCA.contactAddressModel;
                if (vCapCACM.addressType == vRefCACM.addressType &&
                    vCapCACM.addressLine1 == vRefCACM.addressLine1 &&
                    vCapCACM.addressLine2 == vRefCACM.addressLine2 &&
                    vCapCACM.addressLine3 == vRefCACM.addressLine3 &&
                    vCapCACM.city == vRefCACM.city &&
                    vCapCACM.state == vRefCACM.state &&
                    vCapCACM.zip == vRefCACM.zip &&
                    vCapCACM.countryCode == vRefCACM.countryCode) {
                    opDeletedCAs.push(vRefCA);
                    aa.address.deleteContactAddress(vCapCACM);
                }
            }
        }
        return opDeletedCAs;
    }

    function associateRefContactAddressToRecordContact(ipCapID, ipContactSeqNum, ipConAddrScrModel) {
        var ipConAddrModel = ipConAddrScrModel.contactAddressModel;
        if (ipCapID && ipContactSeqNum && ipConAddrModel) {
            var xRefContactAddress = aa.address.createXRefContactAddressModel().getOutput();
            xRefContactAddress.setCapID(ipCapID);
            xRefContactAddress.setAddressID(ipConAddrScrModel.getAddressID());

            // Set the daily contact id to xRefContactAddress model
            xRefContactAddress.setEntityID(aa.util.parseLong(ipContactSeqNum));
            xRefContactAddress.setEntityType(ipConAddrModel.getEntityType());

            // Create
            var xrefResult = aa.address.createXRefContactAddress(xRefContactAddress.getXRefContactAddressModel());

            if (xrefResult.getSuccess) {
                logDebug("Successfully assocaited reference contact address to cap contact: " + ipContactSeqNum);
                return true;
            }
            else {
                logDebug("Failed to associate reference contact address to cap: " + xrefResult.getErrorMessage());
                return false;
            }
        }
        else {
            logDebug("Could not associate reference contact address no address model, capId or cap contact sequence number");
            return false;
        }
    }


    function copyASITable(pFromCapId, pToCapId, tableName) {
        var itemCap = pFromCapId;

        var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
        var ta = gm.getTablesArray()
        var tai = ta.iterator();
        var tableArr = new Array();
        var ignoreArr = new Array();

        while (tai.hasNext()) {
            var tsm = tai.next();

            var tempObject = new Array();
            var tempArray = new Array();
            var tn = tsm.getTableName() + "";
            var numrows = 0;

            if (tn != tableName)
                continue;

            if (!tsm.rowIndex.isEmpty()) {
                var tsmfldi = tsm.getTableField().iterator();
                var tsmcoli = tsm.getColumns().iterator();
                var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
                var numrows = 1;

                while (tsmfldi.hasNext()) // cycle through fields
                {
                    if (!tsmcoli.hasNext()) // cycle through columns
                    {
                        var tsmcoli = tsm.getColumns().iterator();
                        tempArray.push(tempObject); // end of record
                        var tempObject = new Array(); // clear the temp obj
                        numrows++;
                    }
                    var tcol = tsmcoli.next();
                    var tval = tsmfldi.next();

                    var readOnly = 'N';
                    if (readOnlyi.hasNext()) {
                        readOnly = readOnlyi.next();
                    }

                    var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval ? tval : "", readOnly);
                    tempObject[tcol.getColumnName()] = fieldInfo;
                    //tempObject[tcol.getColumnName()] = tval;
                }

                tempArray.push(tempObject); // end of record
            }

            addASITable(tn, tempArray, pToCapId);
            logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
        }
    }

    function removeAndCopyASITables(pFromCapId, pToCapId) {
        var itemCap = pFromCapId;
        var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
        var ta = gm.getTablesArray();
        var tai = ta.iterator();
        var tableArr = new Array();
        var ignoreArr = new Array();
        var limitCopy = false;
        if (arguments.length > 2) {
            ignoreArr = arguments[2];
            limitCopy = true
        }
        while (tai.hasNext()) {
            var tsm = tai.next();
            var tempObject = new Array();
            var tempArray = new Array();
            var tn = tsm.getTableName() + "";
            var numrows = 0;
            if (limitCopy) {
                var ignore = false;
                for (var i = 0; i < ignoreArr.length; i++) {
                    if (ignoreArr[i] == tn) {
                        ignore = true;
                        break
                    }
                }
                if (ignore) {
                    continue;
                }
            }
            if (!tsm.rowIndex.isEmpty()) {
                var tsmfldi = tsm.getTableField().iterator();
                var tsmcoli = tsm.getColumns().iterator();
                var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator();
                var numrows = 1;
                while (tsmfldi.hasNext()) {
                    if (!tsmcoli.hasNext()) {
                        var tsmcoli = tsm.getColumns().iterator();
                        tempArray.push(tempObject);
                        var tempObject = new Array();
                        numrows++
                    }
                    var tcol = tsmcoli.next();
                    var tval = tsmfldi.next();
                    var readOnly = "N";
                    if (readOnlyi.hasNext()) {
                        readOnly = readOnlyi.next()
                    }
                    var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
                    tempObject[tcol.getColumnName()] = fieldInfo
                }
                tempArray.push(tempObject)
            }
            removeASITable(tn, pToCapId);
            addASITable(tn, tempArray, pToCapId);
            logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)")
        }
    }

    function setRecordActivityDate(ipCapID) {
        try {
            if (ipCapID && ipCapID.ID1 && ipCapID.ID2 && ipCapID.ID3) {
                var id1 = ipCapID.ID1;
                var id2 = ipCapID.ID2;
                var id3 = ipCapID.ID3;
                gs2.util.executeUpdDelSQLQuery("UPDATE BPERMIT_DETAIL SET REC_DATE = getdate() WHERE B1_PER_ID1 = '" + id1 + "' AND B1_PER_ID2 = '" + id2 + "' AND B1_PER_ID3 = '" + id3 + "'");
            }
        } catch (vError) {
            logDebug("Failed to activity date in BPERMIT_DETAIL." + vError);
        }
    }

    /**
    * Removes all the contacts from input CapId
    * @param {vCapId} capId
    */
    function removeCapContacts(targetCapId) {
        try {
            var capContactResult = aa.people.getCapContactByCapID(targetCapId);
            if (capContactResult.getSuccess()) {
                var Contacts = capContactResult.getOutput();

                // Deleting contacts from the license record
                for (yy in Contacts) {
                    var con = Contacts[yy];
                    var capSeqNbr = con.getPeople().getContactSeqNumber();
                    logDebug("removeCapContact=" + capSeqNbr);
                    var delResult = aa.people.removeCapContact(targetCapId, capSeqNbr);
                    if (!delResult.getSuccess()) {
                        logDebug("Error removing contacts on target Cap " + delResult.getErrorMessage());
                    }
                }
            }
        } catch (err) {
            logDebug("ERROR: " + err.message + " In removeCapContacts " + err.lineNumber);
        }
    }


    /**
    * Returns Expiration date for a given record
    * @param {vCapId} capId
    * @returns {date} Expiration Date if exists
    */
    function getExpirationDate(vCapId) {
        if (vCapId == null || aa.util.instanceOfString(vCapId)) {
            return null;
        }
        var result = aa.expiration.getLicensesByCapID(vCapId);
        if (result.getSuccess()) {
            return result.getOutput().getExpDate();
        }
        else {
            logDebug("ERROR: Failed to get expiration with CAP " + vCapId + ": " + result.getErrorMessage());
            return null;
        }
    }


    function makeApplicantPrimary() {
        if (primaryContact != 'Applicant') {
            return false;
        }
        var vContacts = aa.people.getCapContactByCapID(capId).getOutput();
        for (var vCounter in vContacts) {
            var vContact = vContacts[vCounter].getCapContactModel();
            if (vContact.getContactType() == primaryContact) {
                EOContact = vContact;
                vContact.setPrimaryFlag("Y");
                aa.people.editCapContact(vContact);
                break;
            }
        }
    }

    function stopMultipleApplicantsASB() {
        var counter = 0;
        try {
            var envContactList = aa.env.getValue("ContactList").toArray();
            var conObjs = getContactArrayBefore();
        }
        catch (err) {
            var conObjs = getContactArray();
        }
        for (var i in conObjs) {
            if (conObjs[i]["contactType"] == "Applicant") {
                counter++;
            }
        }
        if (counter > 1) {
            cancel = true;
            showMessage = true;
            comment("Only one contact of type 'Applicant' is allowed on this Application");
        }
    }

    //Adds condition along with Group and type
    function addConditionsWithTypeAndGroup(conGroup, conType, conDesc, conStatusType, conStatus, isACA, isACAFee, isAA) {
        var sysDate = aa.date.getCurrentDate();
        var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), sysDate.getYear(), "");
        var currentUserID = "ADMIN";
        var systemUserObj = aa.person.getUser(currentUserID).getOutput();
        aa.capCondition.addCapCondition(capId, conType, conDesc, "", sysDate, null, sysDate, null, null, conStatusType, systemUserObj, systemUserObj, conStatus, currentUserID, "A", conStatus, isAA, "Y", "Y", "N", conDesc, "N", "", "", "", "", conGroup, isACA, isACAFee);
    }

    /**
     * Sets Public user to the record created via script
     * @param {capId} from CapId
     * @param {capId} to CapId
     */
    function setPublicUserToParent(vCapID, vParCapId) {
        try {
            var appCapModel = aa.cap.getCap(vCapID).getOutput().getCapModel();
            var regCapModel = aa.cap.getCap(vParCapId).getOutput().getCapModel();
            vUserID = appCapModel.getCreatedBy();

            if (vUserID.indexOf("PUBLICUSER") < 0) {
                var assocPublicUSer = getPublicUserAssocToApplicant(vCapID);
                if (assocPublicUSer)
                    vUserID = assocPublicUSer;
            }

            logDebug("Set Created by userId = " + vUserID);
            regCapModel.setCreatedBy(vUserID);
            if (appCapModel.getAccessByACA == "Y")
                regCapModel.setAccessByACA("Y");

            aa.cap.editCapByPK(regCapModel);
        }
        catch (vError) {
            logDebug("ERROR: Executing copyApplicationDetails() :  " + vError.message);
        }
    }


    /**
     * copies application details from one record to the other
     * @param {capId} from CapId
     * @param {capId} to CapId
     */
    function copyApplicationDetails(fromCapId, toCapID, vASI) {
        try {
            customCopyASIFromToCap(fromCapId, toCapID, vASI);
            removeAndCopyASITables(fromCapId, toCapID);
            copyAddresses(fromCapId, toCapID);
            copyParcels(fromCapId, toCapID);
            copyOwner(fromCapId, toCapID);
            copyLicensedProf(fromCapId, toCapID);
        }
        catch (vError) {
            logDebug("ERROR: Executing copyApplicationDetails() :  " + vError.message);
        }
    }


    //REVISIT
    function validateApplicationRequestForWithdraw() {
        //Script 78
        try {
            if (AInfo["Application/Permit Number"] != "" && AInfo["Application/Permit Number"] != null) {
                var parAltId = AInfo["Application/Permit Number"];
                var parId = aa.cap.getCapID(parAltId).getOutput();
                parId = gs2.util.getCorrectedCapID4V10(parId);
                var parCap = aa.cap.getCap(parId).getOutput();
                var parCapStatus = parCap.getCapStatus();
                var allowWithdraw = true;
                if (!parId) {
                    cancel = true;
                    showMessage = true;
                    comment("The application number is not a valid application: " + AInfo["Application/Permit Number"]);
                    return false;
                } else {
                    if (AInfo["What is your request"] == "Withdrawal/Cancel and Refund" || AInfo["What is your request"] == "Withdrawal/Cancel Only") {
                        allowWithdraw = false;
                        allowWithdraw = gs2.wf.doesRecordHaveActiveTaskWithConfiguredStatus(parId, "Withdrawn");

                    }
                    else if (AInfo["What is your request"] == "Close and Refund Escrow") {
                        if (parCapStatus == "Closed")
                            allowWithdraw = false;
                    }

                    if (!allowWithdraw) {
                        cancel = true;
                        showMessage = true;
                        comment("The record you have requested is not valid for Withdrawal/Closure.");
                        return false;
                    }

                }
            }
            return true;
        } catch (err) {
            logDebug("A JavaScript Error occurred: ASB " + err.message);
        }
    }

    /**
     * Copy Lic Professional from Source CapId to targetCapId
     * @param {capId} srcCapId - Source CapId
     * @param {capId} targetCapId - Target CapId
     */
    function copyLicenseProfessional(srcCapId, targetCapId) {
        //1. Get license professionals with source CAPID.
        var capLicenses = getLicenseProfessional(srcCapId);
        if (capLicenses == null || capLicenses.length == 0) {
            return;
        }
        //2. Get license professionals with target CAPID.
        var targetLicenses = getLicenseProfessional(targetCapId);
        //3. Check to see which licProf is matched in both source and target.
        for (loopk in capLicenses) {
            sourcelicProfModel = capLicenses[loopk];
            //3.1 Set target CAPID to source lic prof.
            sourcelicProfModel.setCapID(targetCapId);
            targetLicProfModel = null;
            //3.2 Check to see if sourceLicProf exist.
            if (targetLicenses != null && targetLicenses.length > 0) {
                for (loop2 in targetLicenses) {
                    if (isMatchLicenseProfessional(sourcelicProfModel, targetLicenses[loop2])) {
                        targetLicProfModel = targetLicenses[loop2];
                        break;
                    }
                }
            }
            //3.3 It is a matched licProf model.
            if (targetLicProfModel != null) {
                //3.3.1 Copy information from source to target.
                aa.licenseProfessional.copyLicenseProfessionalScriptModel(sourcelicProfModel, targetLicProfModel);
                //3.3.2 Edit licProf with source licProf information.
                aa.licenseProfessional.editLicensedProfessional(targetLicProfModel);
            }
                //3.4 It is new licProf model.
            else {
                //3.4.1 Create new license professional.
                aa.licenseProfessional.createLicensedProfessional(sourcelicProfModel);
            }
        }
    }

    /**
     * Checks if the passed Lic Professional Models are same
     * @param {LicensProfessional Script Model} licProfScriptModel1 - LicensProfessional Script Model 1
     * @param {LicensProfessional Script Model} licProfScriptModel1 - LicensProfessional Script Model 2
     * @returns {value type} boolean-Returns true if matches else false
     */
    function isMatchLicenseProfessional(licProfScriptModel1, licProfScriptModel2) {
        if (licProfScriptModel1 == null || licProfScriptModel2 == null) {
            return false;
        }
        if (licProfScriptModel1.getLicenseType().equals(licProfScriptModel2.getLicenseType())
            && licProfScriptModel1.getLicenseNbr().equals(licProfScriptModel2.getLicenseNbr())) {
            return true;
        }
        return false;
    }


    /**
    * remove contact object
    */
    function remove_Contcat_OBJ() {
        this.id1 = null;
        this.id2 = null;
        this.id3 = null;
        this.altid = null;
    }

    /**
     * Returns Public user associated with respect to applicant
     * @param {capId} vCapId - capId
     * @param {value type} wfdate - date value
     * @returns {string} - Public user associated to Applicant Contact
     */
    function getPublicUserAssocToApplicant(vCapId) {
        try {
            var vContacts = aa.people.getCapContactByCapID(vCapId).getOutput();
            var vApplicantCont = null

            for (var vCounter1 in vContacts) {
                var vThisContact = vContacts[vCounter1];
                if (vThisContact.getPeople().getContactType().toString() == "Applicant")
                    vApplicantCont = vThisContact;
            }
            if (vApplicantCont) {
                var refContactSeqNbr = vApplicantCont.getCapContactModel().getRefContactNumber();
                var contSeqNumber = vApplicantCont.getCapContactModel().getContactSeqNumber();
                var appEmailId = vApplicantCont.getEmail();
                var userModel = null;

                if (refContactSeqNbr) {
                    var publicUserListByContact = aa.publicUser.getPublicUserListByContactNBR(aa.util.parseLong(refContactSeqNbr));
                    if (publicUserListByContact.getSuccess()) {
                        var contactList = publicUserListByContact.getOutput();
                        if (contactList.size() > 0) {
                            for (pbInx = 0; pbInx < contactList.size() ; pbInx++) {
                                userModel = contactList.get(pbInx);
                                break;
                            }
                        }
                    }
                }
                if (userModel == null) {
                    var getUserResult = aa.publicUser.getPublicUserByEmail(appEmailId);
                    if (getUserResult.getSuccess() && getUserResult.getOutput()) {
                        userModel = getUserResult.getOutput();
                    }
                }
                if (userModel) {
                    var userSeqNbr = userModel.getUserSeqNum() + "";
                    return ("PUBLICUSER" + userSeqNbr);
                }
            }
        }
        catch (err) {
            logDebug("A JavaScript Error occurred:  getPublicUserAssocToApplicnt: " + err.message);
        }
        return null;
    }

    //Required Contatct Type and Contact Address Check.
    function checkContactTypeWithContactAddress(ipContTypeList, ipContAddrTypeList) {
        //Residential Apps
        var isPropertyOwnerMarked = (AInfo["Are you the Property Owner?"] == "Yes");
        if (isPropertyOwnerMarked) {
            AInfo[vContType] = "Property Owner";
        }

        var vContTypeArr = ipContTypeList.split("!");
        var vContAddrTypeArr = new Array();
        if (ipContAddrTypeList != "")
            vContAddrTypeArr = ipContAddrTypeList.split(",");
        var vContExists = false;
        for (var vCounter1 in vContTypeArr) {

            var vContType = vContTypeArr[vCounter1];
            if (AInfo["Are you the Property Owner?"] == "Yes" && vContType == "Property Owner") {
                vContExists = true;
                break;
            }
            else if (AInfo[vContType] == "CHECKED") {
                vContExists = true;
                break;
            }
        }
        if (vContExists)
            return;
        var vContactList = aa.env.getValue("ContactList");
        var vContArr = vContactList.toArray();
        for (var vCounter1 in vContTypeArr) {
            var vContType = vContTypeArr[vCounter1];
            for (var vCounter2 in vContArr) {
                var vContact = vContArr[vCounter2];
                var vPeople = vContact.getPeople();
                if (vPeople.contactType == vContType)
                    vContExists = true;
                if (vContExists && vPeople.contactType == vContType) {
                    var vContAddrArr = vPeople.getContactAddressList().toArray();
                    for (vCounter3 in vContAddrTypeArr) {
                        var vContactAddrExists = false;
                        var vContAddrType = vContAddrTypeArr[vCounter3];
                        for (vCounter4 in vContAddrArr) {
                            var vContAddr = vContAddrArr[vCounter4];
                            if (vContAddr.addressType == vContAddrType)
                                vContactAddrExists = true;
                        }
                        if (vContactAddrExists)
                            continue;
                        showMessage = true;
                        cancel = true;
                        comment("You must provide Address Type: " + vContAddrType + " for Contact Type: " + vContType + ".");
                    }
                    break;
                }
            }
        }
        if (vContExists)
            return;
        showMessage = true;
        cancel = true;
        comment("You must provide " + ipContTypeList.replace("!", " OR ") + " as a Contact Type.");
    }


    function updateASITableRow(tableName, ColName, colValue, RowIndex, vCapID, currentUserID, readOnly) {
        //  tableName is the name of the ASI table
        //  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
        var itemCap = vCapID;

        var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap, tableName)

        if (!tssmResult.getSuccess()) {
            logDebug("WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage());
            return false;
        }

        var tssm = tssmResult.getOutput();
        var tsm = tssm.getAppSpecificTableModel();
        var fld = tsm.getTableField();
        var clm = tsm.getColumns();
        var fld_readonly = tsm.getReadonlyField();
        var sizeOFRecord = fld.size();
        var sizeOfColums = clm.size();
        var clmList = clm.toArray();

        var currentIndex = RowIndex * sizeOfColums;

        fld.set(currentIndex + getRowIndex(clmList, ColName), colValue);
        fld_readonly.set(currentIndex + getRowIndex(clmList, ColName), readOnly);

        tsm.setTableField(fld);
        tsm.setReadonlyField(fld_readonly);

        var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

        if (addResult.getSuccess()) {
            logDebug("updating app specific table " + tableName + " Successfully");
            //return false
        } else {
            logDebug("WARNING: error updating app specific table " + tableName + " " + addResult.getErrorMessage());
            return false;
        }
    }

    function getRowIndex(cloumnList, columnName) {
        var index = -1;
        for (var i = 0; i < cloumnList.length; i++) {
            if (cloumnList[i].getColumnName() == columnName) return i;
        }
        return index;
    }

    function checkASITValue(ipTable, ipField, ipValue) {
        var opFound = false;
        if (typeof (ipTable) != "object")
            return opFound;
        for (var vCounter in ipTable) {
            var vRow = ipTable[vCounter];
            var vField = vRow[ipField];
            var vValue = vField.fieldValue;
            if (vValue.toString() == ipValue.toString()) {
                opFound = true;
                break;
            }
        }
        return opFound;
    }

    function customCopyASIFromToCap(ipSource, ipTarget, ipTargetGrp) {
        result = new Array();
        asiData = aa.appSpecificInfo.getByCapID(ipSource).getOutput();
        for (item in asiData) {
            val = asiData[item];
            val.setGroupCode(ipTargetGrp);
            val.setPermitID1(ipTarget.ID1);
            val.setPermitID2(ipTarget.ID2);
            val.setPermitID3(ipTarget.ID3);
            result.push(val);
        }
        aa.appSpecificInfo.editAppSpecificInfo(result);
    }

    function getContactArray(capId) {
        // Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
        // optional capid
        // added check for ApplicationSubmitAfter event since the contactsgroup array is only on pageflow,
        // on ASA it should still be pulled normal way even though still partial cap
        var thisCap = capId;
        if (arguments.length == 1) thisCap = arguments[0];

        var cArray = new Array();

        if (arguments.length == 0 && !cap.isCompleteCap() && controlString != "ApplicationSubmitAfter") // we are in a page flow script so use the capModel to get contacts
        {
            capContactArray = cap.getContactsGroup().toArray();
        }
        else {
            var capContactResult = aa.people.getCapContactByCapID(thisCap);
            if (capContactResult.getSuccess()) {
                var capContactArray = capContactResult.getOutput();
            }
        }

        if (capContactArray) {
            for (yy in capContactArray) {
                var aArray = new Array();
                aArray["lastName"] = capContactArray[yy].getPeople().lastName;
                aArray["refSeqNumber"] = capContactArray[yy].getCapContactModel().getRefContactNumber();
                aArray["firstName"] = capContactArray[yy].getPeople().firstName;
                aArray["middleName"] = capContactArray[yy].getPeople().middleName;
                aArray["businessName"] = capContactArray[yy].getPeople().businessName;
                aArray["contactSeqNumber"] = capContactArray[yy].getPeople().contactSeqNumber;
                aArray["contactType"] = capContactArray[yy].getPeople().contactType;
                aArray["relation"] = capContactArray[yy].getPeople().relation;
                aArray["phone1"] = capContactArray[yy].getPeople().phone1;
                aArray["phone2"] = capContactArray[yy].getPeople().phone2;
                aArray["email"] = capContactArray[yy].getPeople().email;
                aArray["addressLine1"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine1();
                aArray["addressLine2"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine2();
                aArray["city"] = capContactArray[yy].getPeople().getCompactAddress().getCity();
                aArray["state"] = capContactArray[yy].getPeople().getCompactAddress().getState();
                aArray["zip"] = capContactArray[yy].getPeople().getCompactAddress().getZip();
                aArray["fax"] = capContactArray[yy].getPeople().fax;
                aArray["notes"] = capContactArray[yy].getPeople().notes;
                aArray["country"] = capContactArray[yy].getPeople().getCompactAddress().getCountry();
                aArray["fullName"] = capContactArray[yy].getPeople().fullName;
                aArray["peopleModel"] = capContactArray[yy].getPeople();

                var pa = new Array();

                if (arguments.length == 0 && !cap.isCompleteCap()) {
                    var paR = capContactArray[yy].getPeople().getAttributes();
                    if (paR) pa = paR.toArray();
                }
                else
                    var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
                for (xx1 in pa)
                    aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;

                cArray.push(aArray);
            }
        }
        return cArray;
    }

    /*
     * get customer contacts
    */
    function getCustomerContacts() {

        var capContactResult = aa.people.getCapContactByCapID(capId);
        if (capContactResult.getSuccess()) {
            var contacts = capContactResult.getOutput();
            for (c in contacts) {
                contactMap.put(contacts[c].getCapContactModel().getPeople().getContactType(), contacts[c]);
            }
        }
        return contactMap;
    }

    /*
    * generates the application status report.
    */

    function getApplicationReport() {
        var reportName = "008 Application Snapshot";
        var rParams = aa.util.newHashMap();
        rParams.put("RecordId", capIDString);
        applnReport = gs2.util.generateReport(capId, reportName, "LandDevelopment", rParams)
        return applnReport;
    }


    function copyApplicantToOtherContacts4AA() {
        try {

            var vContacts = aa.people.getCapContactByCapID(capId).getOutput();
            var vApplicant = null;
            var capContactArray = [];

            for (var vCounter1 in vContacts) {
                var vThisContact = vContacts[vCounter1];
                if (vThisContact.getPeople().getContactType().toString() == "Applicant")
                    vApplicant = aa.util.deepClone(vThisContact).getOutput();

                capContactArray.push(vThisContact.getPeople().getContactType().toString());
            }

            //Residential Apps
            var isPropertyOwnerMarked = (AInfo["Are you the Property Owner?"] == "Yes");
            if (isPropertyOwnerMarked && !gs2.common.findInArray("Property Owner", capContactArray)) {
                logDebug("Property Owner");
                var vNewContact = aa.util.deepClone(vApplicant).getOutput();
                //vNewContact.setComponentName(componentIndex);
                vNewContact.getPeople().setContactSeqNumber(null);
                //vNewContact.setContactSeqNumber(null);
                vNewContact.getPeople().setContactType("Property Owner");
                //vContacts.add(vNewContact);
                aa.people.createCapContact(vNewContact.getCapContactModel());
            }

            for (var i = 0; i < contactTypesArray.length; i++) {
                if (AInfo[contactTypesArray[i]] == "CHECKED" && !gs2.common.findInArray(contactTypesArray[i], capContactArray)) {
                    var vNewContact = aa.util.deepClone(vApplicant).getOutput();
                    vNewContact.getPeople().setContactSeqNumber(null);
                    vNewContact.getPeople().setContactType(contactTypesArray[i]);
                    aa.people.createCapContact(vNewContact.getCapContactModel());
                }
            }
        }
        catch (err) {
            logDebug("**ERROR : " + err);
        }
    }

    function makeOnlyApllicantPrimary() {
        try {
            if (primaryContact != 'Applicant') {
                return true;
            }
            //Make this also work for records other than current record.
            var vCapId = capId;
            if (arguments.length > 0 && arguments[0])
                vCapId = arguments[0];
            var vContacts = aa.people.getCapContactByCapID(vCapId).getOutput();
            for (var vCounter1 in vContacts) {
                var vThisContact = vContacts[vCounter1].getCapContactModel();

                if (vThisContact.getPeople().getContactType().toString() == primaryContact)
                    vThisContact.setPrimaryFlag("Y");
                else
                    vThisContact.setPrimaryFlag("N");
                aa.people.editCapContact(vThisContact);
            }
        }
        catch (err) {
            logDebug("**ERROR : " + err);
        }
    }

    function updateApplicationStatus(wfTasks, task, capId) {

        var vWfTasks = aa.workflow.getTaskItemByCapID(capId, null).getOutput();
        for (i in vWfTasks) {
            var vWFTask = vWfTasks[i];
            if (vWFTask.getActiveFlag() == "Y" && !matches(vWFTask.getTaskDescription(), task.getTaskDescription()) && matches(vWFTask.getDisposition(), 'Additional Information Required')) {
                updateAppStatus("Additional Info Required", "Updated via Script", capId);
                break;
            }
        }
    }

    function getCapConditionsByGroupType(ipGroup, ipType, ipCondition, ipStatus) {
        var vCapID = capId;
        if (arguments.length > 4 && arguments[4])
            vCapID = arguments[4];

        var opCapConds = new Array();
        var vCondResult = aa.capCondition.getCapConditions(vCapID, ipType);
        if (vCondResult.getSuccess()) {
            var vCapConds = vCondResult.getOutput();
            for (var vCounter in vCapConds) {
                var vCapCond = vCapConds[vCounter];
                if (vCapCond.getConditionGroup() != ipGroup)
                    continue;
                if (ipCondition != null && vCapCond.getConditionDescription() != ipCondition)
                    continue;
                if (ipStatus != null && ipStatus != vCapCond.getConditionStatus())
                    continue;
                opCapConds.push(vCapCond);
                if (ipCondition != null)
                    break;
            }
        }
        if (ipCondition != null) {
            if (opCapConds.length > 0)
                return opCapConds[0];
            else
                return null;
        }
        else
            return opCapConds;
    }

    function addCapCondition(ipGroup, ipType, ipCondition, ipComment, ipStatus, ipImpact, ipStatusType) {
        var vCapID = capId;
        if (arguments.length > 7 && arguments[7])
            vCapID = arguments[7];

        aa.capCondition.addCapCondition(vCapID, ipType, ipCondition, ipComment, null, null, aa.date.getCurrentDate(), "", "", ipImpact, systemUserObj, systemUserObj, ipStatus, currentUserID, "A", ipStatusType, "N", "N", "N", "N", "", "", "", "", "", 0, ipGroup, "N", "N");
    }

    function copyTableFromParentForACA(ipTable, ipParentCapId) {
        var vFromValues = loadASITable(ipTable, ipParentCapId);
        if (vFromValues && vFromValues.length > 0) {
            var vToValues = new Array();
            for (var vRowCounter in vFromValues) {
                var vFromRow = vFromValues[vRowCounter];
                var vToRow = new Array();
                for (var vColumnName in vFromRow) {
                    var vCoulmnValue = vFromRow[vColumnName];
                    if (vColumnName == "Company License Number") {
                        var vReadonly = "Y";
                    }
                    else {
                        var vReadonly = vFromRow[vColumnName].readOnly;
                    }
                    vToRow[vColumnName] = new asiTableValObj(vColumnName, vCoulmnValue, vReadonly);
                }
                vToValues.push(vToRow);
            }
            var vResult = addASITable4ACAPageFlowX(cap.getAppSpecificTableGroupModel(), ipTable, vToValues);
            aa.env.setValue("CapModel", cap);
        }
    }

    function copyAllTablesFromParentForACA(ipParentCapId) {
        var vASITGroupModel = aa.appSpecificTableScript.getAppSpecificTableGroupModel(ipParentCapId).getOutput();
        var vTablesArray = vASITGroupModel.getTablesArray()
        var vTableIterator = vTablesArray.iterator();
        while (vTableIterator.hasNext()) {
            var vTableModel = vTableIterator.next();
            var vTableName = vTableModel.getTableName().toString();

            copyTableFromParentForACA(vTableName, ipParentCapId);
        }
    }

    //check if a record is parent to the current record
    function isParent(parentAltId) {
        getCapResult = aa.cap.getProjectParents(capId, 1);
        if (getCapResult.getSuccess()) {
            parentArray = getCapResult.getOutput();
            if (parentArray.length && parentArray.length > 0) {
                for (pIndex in parentArray) {
                    thisParentCap = parentArray[pIndex];
                    if (thisParentCap.getCapID().getCustomID() == parentAltId)
                        return true;
                }
            }

        }
        return false;
    }

    gs2.rec.test = test;
    gs2.rec.checkReqContactsAA = checkReqContactsAA;
    gs2.rec.getCustomIDFromCapID = getCustomIDFromCapID;
    gs2.rec.editFileDate = editFileDate;
    gs2.rec.getRecordTypeInstance = getRecordTypeInstance;
    gs2.rec.removeAddressCondition = removeAddressCondition;
    gs2.rec.getAddressConditionsASB = getAddressConditionsASB;
    gs2.rec.getAllRoots = getAllRoots;
    gs2.rec.getAllParents = getAllParents;
    gs2.rec.getParents = getParents;
    gs2.rec.isLPLinkedToCurrentuser = isLPLinkedToCurrentuser;
    gs2.rec.copyAppName = copyAppName;
    gs2.rec.getAppTypeArray = getAppTypeArray;
    gs2.rec.setCapExpirationDate = setCapExpirationDate;
    gs2.rec.isAppSubmitted = isAppSubmitted;
    gs2.rec.copyASISubgroup = copyASISubgroup;
    gs2.rec.copyASISubgroupWithNewSubGroup = copyASISubgroupWithNewSubGroup;
    gs2.rec.copyASIArray = copyASIArray;
    gs2.rec.createParent = createParent;
    gs2.rec.UpdateExpiration = UpdateExpiration;
    gs2.rec.getBoExpirationCodeModel = getBoExpirationCodeModel;
    gs2.rec.IsExpirationDateExists = IsExpirationDateExists;
    gs2.rec.ExpirationDef = ExpirationDef;
    gs2.rec.getExpirartionCodeDetails = getExpirartionCodeDetails;
    gs2.rec.setLicExpirationDate = setLicExpirationDate;
    gs2.rec.updateExpirartionCodeDetails = updateExpirartionCodeDetails;
    gs2.rec.clearExpirationCode = clearExpirationCode;
    gs2.rec.SetExpirationDate = SetExpirationDate;
    gs2.rec.SetParentExpiratonDate = SetParentExpiratonDate;
    gs2.rec.addStdConditionWithComments = addStdConditionWithComments;
    gs2.rec.renewalContactTypeChecking = renewalContactTypeChecking;
    gs2.rec.getParentIdForRenewal = getParentIdForRenewal;
    gs2.rec.createChild = createChild;
    gs2.rec.appHasConditionWithShortComment = appHasConditionWithShortComment;
    gs2.rec.addSTDCondition = addSTDCondition;
    gs2.rec.compareAndRemoveExistingAddresses = compareAndRemoveExistingAddresses;
    gs2.rec.associateRefContactAddressToRecordContact = associateRefContactAddressToRecordContact;
    gs2.rec.copyASITable = copyASITable;
    gs2.rec.removeAndCopyASITables = removeAndCopyASITables;
    gs2.rec.setRecordActivityDate = setRecordActivityDate;
    gs2.rec.removeCapContacts = removeCapContacts;
    gs2.rec.getExpirationDate = getExpirationDate;
    gs2.rec.makeApplicantPrimary = makeApplicantPrimary;
    gs2.rec.stopMultipleApplicantsASB = stopMultipleApplicantsASB;
    gs2.rec.addConditionsWithTypeAndGroup = addConditionsWithTypeAndGroup;
    gs2.rec.setPublicUserToParent = setPublicUserToParent;
    gs2.rec.copyApplicationDetails = copyApplicationDetails;
    gs2.rec.validateApplicationRequestForWithdraw = validateApplicationRequestForWithdraw;
    gs2.rec.copyLicenseProfessional = copyLicenseProfessional;
    gs2.rec.isMatchLicenseProfessional = isMatchLicenseProfessional;
    gs2.rec.remove_Contcat_OBJ = remove_Contcat_OBJ;
    gs2.rec.getPublicUserAssocToApplicant = getPublicUserAssocToApplicant;
    gs2.rec.checkContactTypeWithContactAddress = checkContactTypeWithContactAddress;
    gs2.rec.updateASITableRow = updateASITableRow;
    gs2.rec.getRowIndex = getRowIndex;
    gs2.rec.checkASITValue = checkASITValue;
    gs2.rec.getContactArray = getContactArray;
    gs2.rec.customCopyASIFromToCap = customCopyASIFromToCap;
    gs2.rec.getContactArray = getContactArray;
    gs2.rec.getCustomerContacts = getCustomerContacts;
    gs2.rec.getApplicationReport = getApplicationReport;
    gs2.rec.copyApplicantToOtherContacts4AA = copyApplicantToOtherContacts4AA;
    gs2.rec.makeOnlyApllicantPrimary = makeOnlyApllicantPrimary;
    gs2.rec.updateApplicationStatus = updateApplicationStatus;
    gs2.rec.getCapConditionsByGroupType = getCapConditionsByGroupType;
    gs2.rec.addCapCondition = addCapCondition;
    gs2.rec.copyTableFromParentForACA = copyTableFromParentForACA;
    gs2.rec.copyAllTablesFromParentForACA = copyAllTablesFromParentForACA;
    gs2.rec.isParent = isParent;
    gs2.rec.validateOnlyOneContact = validateOnlyOneContact;
    gs2.rec.updateAppStatus = updateAppStatus;

})();

