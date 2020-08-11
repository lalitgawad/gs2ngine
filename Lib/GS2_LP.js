gs2.lp = {};
gs2.user = {};
gs2.contact = {};
gs2.address = {};
(function () {

    function test() {
        gs2.log('GS2_LP Looks good');
        return true;
    }

    //Updates the Unit, Level, Building values to Address. These are not validated with GIS. 
    function UpdateAddressUnitLevelBuilding() {
        try {
            if (!publicUser) {
                var sNotes = "" + getShortNotes();
                logDebug("sNotes" + " " + sNotes)
                var sNoteArr = sNotes.split('||');
                var unit = sNoteArr[0];
                var level = sNoteArr[1];
                var bldng = sNoteArr[2];
                logDebug(sNoteArr[0] + " " + level + " " + bldng);

                var addrList = aa.address.getAddressWithAttributeByCapId(capId).getOutput();
                if (addrList != null) {
                    var addr = addrList[0];
                    if (addr != null) {
                        var addrUpdate = false;
                        if (unit != null && unit != "") {
                            addr.setUnitStart(unit);
                            addrUpdate = true;
                        }
                        if (level != null && level != "") {
                            addr.setLevelNumberStart(level);
                            addrUpdate = true;
                        }
                        if (bldng != null && bldng != "") {
                            addr.setLevelPrefix(bldng);
                            addrUpdate = true;
                        }
                        if (addrUpdate == true) {
                            aa.address.editAddressWithAPOAttribute(capId, addr);
                            logDebug("AddressUnitLevelBuilding updated");
                        }
                    }
                }
                updateShortNotes("");
            }

        }
        catch (vError) {
            logDebug("Runtime error occurred in Updatting AddressUnitLevelBuilding");
        }
    }


    function getRefConByPublicUserSeq(pSeqNum) {
        var publicUserSeq = pSeqNum; //Public user sequence number
        var userSeqList = aa.util.newArrayList();
        userSeqList.add(aa.util.parseLong(publicUserSeq));
        var contactPeopleBiz = aa.proxyInvoker.newInstance("com.accela.pa.people.ContractorPeopleBusiness").getOutput();
        var contactors = contactPeopleBiz.getContractorPeopleListByUserSeqNBR(aa.getServiceProviderCode(), userSeqList);
        if (contactors) {
            if (contactors.size() > 0) {
                if (contactors.get(0)) {
                    return contactors.get(0);
                }
            }
        }
    }

    /*
    Returns true if Applicant on the record is linked to the public user, else false
     */
    function isCurrUserTheApplicant() {
        var vContacts = aa.people.getCapContactByCapID(capId).getOutput();
        var applicantrefSeqNbr = null;
        for (var vCounter1 in vContacts) {
            var vThisContact = vContacts[vCounter1];
            if (vThisContact.getPeople().getContactType().toString() == "Applicant")
                applicantrefSeqNbr = vThisContact.getCapContactModel().getRefContactNumber() + "";
        }
        var publicUserModelResult = aa.publicUser.getPublicUserByPUser(aa.env.getValue("CurrentUserID"));
        if (!publicUserModelResult.getSuccess() || !publicUserModelResult.getOutput()) {
            aa.print("**WARNING** couldn't find public user " + publicUser + " " + publicUserModelResult.getErrorMessage());
        }
        var userSeqNum = publicUserModelResult.getOutput().getUserSeqNum();
        var pcModel = getRefConByPublicUserSeq(userSeqNum);
        if (pcModel !== undefined && pcModel.contactSeqNumber + "" == applicantrefSeqNbr)
            return true;
        return false;
    }

    //Return true if delegate, false if not.
    function isProxyUser(userSeqNum, vCreatedBySeqNum) {
        var sql = "SET NOCOUNT ON;SELECT COUNT(*) AS NUM FROM XPROXYUSER WHERE USER_SEQ_NBR ='" + vCreatedBySeqNum + "' AND PROXYUSER_SEQ_NBR = '" + userSeqNum + "';"
        logDebug(sql);
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
                var num = rSet.getString("NUM");
                if (parseInt(num) > 0) {
                    gs2.util.closeDBQueryObject(rSet, sStmt, conn);
                    return true;
                }
            }
            gs2.util.closeDBQueryObject(rSet, sStmt, conn);
        } catch (vError) {
            logDebug("Runtime error occurred: " + vError);
        }
        return false;
    }

    //Return true if delegate, false if not.
    function isDelegate() {

        /*var capModelScript = aa.cap.getCap(capId).getOutput();
        var capModel = capModelScript.getCapModel();
        var user = capModel.getCreatedBy();
        logDebug("user: " + user);
        var currentUserID = aa.env.getValue("CurrentUserID");
        logDebug("currentUserID: " + currentUserID);
        if (currentUserID == user) {
            return true;
        }
        return false;*/

        var publicUserModelResult = aa.publicUser.getPublicUserByPUser(aa.env.getValue("CurrentUserID"));
        if (!publicUserModelResult.getSuccess() || !publicUserModelResult.getOutput()) {
            aa.print("**WARNING** couldn't find public user " + publicUser + " " + publicUserModelResult.getErrorMessage());
        }
        var userSeqNum = publicUserModelResult.getOutput().getUserSeqNum();
        var vCapM = aa.cap.getCap(capId).getOutput().getCapModel();
        var vCreatedBySeqNum = vCapM.getCreatedBy().substr(10);
        if (isProxyUser(userSeqNum, vCreatedBySeqNum))
            return true;
        return false;
    }


    ///////////


    /**
     * To get Address for record (Accela Dev)
     * @param {object} capId - Record Id
     * @returns {string} - Address
     */
    function getAddress(capId) {
        var capAddResult = aa.address.getAddressByCapId(capId);
        if (capAddResult.getSuccess()) {
            var addrArray = new Array();
            var addrArray = capAddResult.getOutput();

            logDebug("add Array is:" + addrArray);
            if (addrArray.length == 0 || addrArray == undefined) {
                logDebug("The current CAP has no address.")
            } else {
                var streetNumber = addrArray[0].getHouseNumberStart();
                var streetDir = addrArray[0].getStreetDirection();
                var streetName = addrArray[0].getStreetName();
                var streetSuff = addrArray[0].getStreetSuffix();

                var address = streetNumber + " " + streetDir + " " + streetName + " " + streetSuff;
                var address = address.replace(/null +/g, "");
                var address = address.replace(/null+/g, "");

                logDebug("streetNumber:" + streetNumber);
                logDebug("streetDir:" + streetDir);
                logDebug("streetName:" + streetName);
                logDebug("streetSuff:" + streetSuff);
                logDebug("address:" + address);

                return address;
            }

        }
        return "";
    }

    /**
     * get user department
     * @returns {string} - department
     * @param {string} vUserID - Optinal user id
     */
    function getUserDept() {
        var vUserID = null;
        if (typeof (currentUserID) != "undefined")
            vUserID = currentUserID;
        if (arguments.length > 1 && arguments[1])
            vUserID = arguments[1];
        var vUserObj = aa.person.getUser(vUserID).getOutput();
        if (vUserObj == null)
            return false;
        return vUserObj.getDeptOfUser();
    }

    //sync all related contacts from reference database - JIRA 8536
    function updateCapContactsFromRefContact(refNumber) {
        try {

            if (refNumber != undefined && refNumber != null) {
                var pm = aa.people.createPeopleModel().getOutput().getPeopleModel();
                var ccb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactDAOOracle").getOutput();
                pm.setServiceProviderCode(aa.getServiceProviderCode());
                var refPeopleModel = aa.people.getPeople(refNumber).getOutput();
                pm.setContactSeqNumber(refNumber);
                var cList = ccb.getCapContactsByRefContactModel(pm).toArray();
                logDebug(refPeopleModel);
                for (var j in cList) {
                    var thisCapId = aa.cap.getCapID(cList[j].getCapID().getID1(), cList[j].getCapID().getID2(), cList[j].getCapID().getID3()).getOutput();
                    var capModel = aa.cap.getCap(thisCapId).getOutput();
                    logDebug("capModel" + capModel);
                    if (capModel != null) {
                        var thisCapStatus = capModel.getCapStatus();
                        logDebug("status " + capModel.getCapStatus());
                        logDebug(cList[j].getRefContactNumber())

                        if (!(matches(thisCapStatus, "Closed") || matches(thisCapStatus, "Withdrawn") || matches(thisCapStatus, "Expired") || matches(thisCapStatus, "Completed") || matches(thisCapStatus, "Denied"))) {

                            cList[j].getPeople().setFirstName(refPeopleModel.getFirstName());
                            cList[j].getPeople().setMiddleName(refPeopleModel.getMiddleName());
                            cList[j].getPeople().setLastName(refPeopleModel.getLastName());
                            cList[j].getPeople().setEmail(refPeopleModel.getEmail());
                            cList[j].getPeople().setPhone1(refPeopleModel.getPhone1());
                            cList[j].getPeople().setPhone2(refPeopleModel.getPhone2());
                            cList[j].getPeople().setPhone3(refPeopleModel.getPhone3());
                            var contactAddressrs = aa.address.getContactAddressListByCapContact(cList[j]);
                            if (contactAddressrs.getSuccess()) {
                                var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
                                cList[j].getPeople().setContactAddressList(contactAddressModelArr);
                            }
                            var test = aa.address.getContactAddressListByCapContact(cList[j]).getOutput();
                            for (var i in test) {
                                var contactAddress = test[i];
                                if (contactAddress.getContactAddressModel()) {
                                    var addressModel = contactAddress.getContactAddressModel();
                                    logDebug("address" + addressModel);
                                }
                            }
                            aa.people.editCapContact(cList[j]);
                            var s = cList[j].getPeople();
                            logDebug("Model" + s);

                        }
                    }
                }

            }
        }
        catch (err) {
            logDebug("Error**updateCapContactsFromRefContact():" + err.message)
        }
    }

    /**
     * Links an application to applicants public user account
     * @returns {boolean} - returns success
     */
    function linkPublicUserToApplication() {
        try {
            var vPublicUser = gs2.rec.getPublicUserAssocToApplicant(capId);
            if (vPublicUser) {
                var appCapModel = aa.cap.getCap(capId).getOutput().getCapModel();
                appCapModel.setCreatedBy(vPublicUser);
                appCapModel.setAccessByACA("Y");
                aa.cap.editCapByPK(appCapModel);
                return true;
            }
        }
        catch (err) {
            logDebug("A JavaScript Error occurred:  linkPublicUserToApplication: " + err.message);
        }
        return false;
    }

    function getPublicUserModelByRefContact(RefNumber) {
        if (RefNumber) {
            var publicUserListByContact = aa.publicUser.getPublicUserListByContactNBR(RefNumber);
            if (publicUserListByContact.getSuccess()) {
                var contactList = publicUserListByContact.getOutput();
                if (contactList.size() > 0) {
                    for (pbInx = 0; pbInx < contactList.size() ; pbInx++) {
                        var usrObject = contactList.get(pbInx);
                        break;
                    }

                    return usrObject;
                }
            }
        }
        return null;
    }



    /**
    * get Contact With Lock Condition
    * @returns {Array} - Contact Array having locks
    */
    function getContactWithLockCondition() {
        var conLockArray = new Array();

        var contArr = getContactArrayWithTemplate(false, capId);
        var rParams = aa.util.newHashMap();
        for (c in contArr) {
            if (!rParams.containsKey(contArr[c].refSeqNumber)) {
                rParams.put(contArr[c].refSeqNumber, contArr[c]);
            }
        }

        var keyArray = rParams.keySet().toArray();
        for (k in keyArray) {
            //logDebug(keyArray[k]);
            var conCondArray = getContactConditionsByRefId(keyArray[k]);
            for (var nd in conCondArray) {
                var cond = conCondArray[nd];
                //logDebug(cond.getConditionDescription());
                //logDebug(cond.getConditionGroup());
                //logDebug(cond.getImpactCode());
                //logDebug(cond.getConditionStatus());
                //if (cond.getConditionStatus() == "Applied" && (cond.getImpactCode() == "Hold" || cond.getImpactCode() == "Lock")) {
                if (cond.getConditionStatus() == "Applied" && (cond.getImpactCode() == "Lock")) {
                    conLockArray.push(rParams.get(keyArray[k]));
                }
            }
        }
        return conLockArray;
    }

    /**
    * get Contact Conditions By RefId
    * @param {var}  - contact ref number
    * @returns {Array} - Contact Array having locks
    */
    function getContactConditionsByRefId(ipRefContact) {
        var conCondArray = new Array();

        var fvContactConditionsQry = aa.commonCondition.getCommonConditions("CONTACT", parseInt(ipRefContact, 10));
        if (fvContactConditionsQry) {
            var fvContactConditions = fvContactConditionsQry.getOutput();
            if (fvContactConditions) {
                for (fvCounter in fvContactConditions) {
                    var fvContactCondition = fvContactConditions[fvCounter];
                    conCondArray.push(fvContactCondition);
                }
            }
        }
        return conCondArray;
    }

    function getEmployeeID(userID) {
        var empID = "";
        if (userID) {
            try {
                var selectString = "SELECT PU.EMPLOYEE_ID EMPLOYEE_ID FROM PUSER PU WHERE PU.SERV_PROV_CODE='" + aa.getServiceProviderCode() + "' AND PU.USER_NAME='" + String(userID).toUpperCase() + "'";
                var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext").getOutput();
                var ds = initialContext.lookup("java:/AA");
                var conn = ds.getConnection();
                var sStmt = conn.prepareStatement(selectString);
                var rSet = sStmt.executeQuery();
                rSet.next();
                var result = rSet.getString("EMPLOYEE_ID");
                rSet.close();
                conn.close();
                if (result) {
                    empID = String(result);
                }
            } catch (Err) {
                logDebug("Error in function getEmployeeID " + Err);
            }
        }
        return empID;
    }


    function isLockedContact(ipRefContactNum) {
        try {
            var opLocked = false;
            var vContactCondsArr = aa.commonCondition.getCommonConditions("CONTACT", ipRefContactNum).getOutput();
            for (var vCondCounter in vContactCondsArr) {
                var vContactCond = vContactCondsArr[vCondCounter];
                if (vContactCond.getImpactCode() == "Lock") {
                    opLocked = true;
                    break;
                }
            }
            return opLocked;
        } catch (vError) {
            logDebug("Error occured in isLockedContact " + vError);
        }
    }

    function getRefAddressIDByUID(ipUID) {
        var opRefID = null;
        var vSQL = "select L1_ADDRESS_NBR from L3ADDRES where EXT_UID = '" + ipUID + "'";
        var vSQLResult = gs2.util.executeSelectQuery(vSQL, "L1_ADDRESS_NBR");
        if (vSQLResult && vSQLResult.length > 0)
            opRefID = vSQLResult[0].L1_ADDRESS_NBR;
        return opRefID;
    }

    function getUIDASBAddress(ipAddressHouseNumber, ipAddressStreetDirection, ipAddressStreetName, ipAddressStreetSuffix, ipAddressCity, ipAddressState, ipAddressZip) {
        var opUID = null;
        if ((ipAddressHouseNumber && ipAddressHouseNumber != "") || (ipAddressStreetName && ipAddressStreetName != "") || (ipAddressStreetSuffix && ipAddressStreetSuffix != "")) {
            var vAddrArr = aa.address.getRefAddressByHouseNoRangeStreetNameSuffix(ipAddressHouseNumber, 0, ipAddressStreetName, ipAddressStreetSuffix).getOutput();
            for (var vCounter in vAddrArr) {
                var vAddr = vAddrArr[vCounter];
                if ((ipAddressStreetDirection == null || ipAddressStreetDirection == "" || vAddr.streetDirection == ipAddressStreetDirection) && vAddr.city == ipAddressCity && vAddr.state == ipAddressState && vAddr.zip == ipAddressZip)
                    opUID = vAddr.UID;
            }
        }
        return opUID;
    }

    /**
     * Checks of the Record Lp is suspended
     * @param {capId} capId
     * @returns {boolean}  - return true LP is invalid
     */
    function isRelatedLpsSunspended(vCapId) {
        eval(getScriptText("INCLUDES_LP"));
        var lpProcObj = new LPProc_OBJ();
        var licArr = lpProcObj.getLicenseProfessional(vCapId);
        var rlpId = null;
        if (licArr[0])
            rlpId = licArr[0].getLicenseNbr() + "";
        if (rlpId && rlpId != "") {
            var lpObj = new LP_OBJ(rlpId, "");
            var licStatus = lpObj.getLPASIByFieldName("License Status");
            if (licStatus == "Suspended") {
                return true
            }
        }
        return false;
    }

    function getName4PublicUser(ipPublicAAUser) {
        var opName = "";
        var vPeople = getAccountOwnerContact4PublicUser(ipPublicAAUser);
        if (vPeople.contactTypeFlag == "organization") {
            opName = vPeople.businessName;
        } else
            opName = vPeople.firstName + " " + vPeople.lastName;
        return opName;
    }

    function getAccountOwnerContact4PublicUser(ipPublicAAUser) {
        var vUserSeq = ipPublicAAUser.substr(10);
        var vAssociatedContacts = aa.people.getUserAssociatedContact(vUserSeq).getOutput();
        var opPeople = null;
        for (var vCounter = 0; vCounter < vAssociatedContacts.size() ; vCounter++) {
            var vAscContact = vAssociatedContacts.get(vCounter);
            if (vAscContact.accountOwner == "Y") {
                var vRefContactNum = vAscContact.contactSeqNumber;
                var opPeople = aa.people.getPeople(vRefContactNum).getOutput();
            }
        }
        return opPeople;
    }


    //Checks if the contact has dup state license number
    function isDuplicateStateLicNum(refSeqNbr, licNum) {
        var vError = '';
        var conn = null;
        var sStmt = null;
        var rSet = null;
        var msg = '';

        var sql = "SET NOCOUNT ON;SELECT * FROM XREFCONTACT_ENTITY where ENT_TYPE = 'PROFESSIONAL' and G1_CONTACT_NBR=" + refSeqNbr + ";";
        try {
            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null)
                .getOutput();
            var ds = initialContext.lookup("java:/AA");
            conn = ds.getConnection();
            sStmt = conn.prepareStatement(sql);
            rSet = sStmt.executeQuery();
            while (rSet.next()) {
                var lpObj1 = aa.licenseScript.getRefLicenseProfBySeqNbr(aa.getServiceProviderCode() + "", parseInt(rSet.getString("ENT_ID1"))).getOutput();
                if (lpObj1) {
                    eval(getScriptText("INCLUDES_LP"));
                    if (String(lpObj1.getStateLicense()).indexOf(licNum) > -1 && String(lpObj1.getLicenseType()) == String(getLPTypeAndBoard()).split("||")[0]) {
                        gs2.util.closeDBQueryObject(rSet, sStmt, conn);
                        return true;
                    }
                }
            }
            conn.close();
        } catch (vError) {
            logDebug("Runtime error occurred: " + vError);
        }
        gs2.util.closeDBQueryObject(rSet, sStmt, conn);
        return false;
    }

    function getCapContactsByContactType(ipCapContactType, ipCapID) {
        var opContactArray = new Array();
        var vContactArray = aa.people.getCapContactByCapID(ipCapID).getOutput();
        for (var vCounter in vContactArray) {
            var vThisContact = vContactArray[vCounter];
            if (vThisContact.getPeople().contactType.toUpperCase() == ipCapContactType.toUpperCase())
                opContactArray.push(vThisContact);
        }
        return opContactArray;
    }

    function setFullnameForOrg(ipRefContactNum) {
        var vRefContactObj = aa.people.getPeople(ipRefContactNum).getOutput();
        if (vRefContactObj.contactType == "Organization") {
            vRefContactObj.setFullName(vRefContactObj.businessName);
            aa.people.editPeople(vRefContactObj);
        }
    }

    /**
     * To edit Contact Type
     * @param {string} existingType - Existing Contact Type
     * @param {string} newType - New Contact Type
     * @param {object} updateCap - Record Cap to get contacts associated with
     */
    function editContactType(existingType, newType) {
        //Function will change contact types from exsistingType to newType,
        //optional paramter capID{
        var updateCap = capId
        if (arguments.length == 3)
            updateCap = arguments[2]

        capContactResult = aa.people.getCapContactByCapID(updateCap);
        if (capContactResult.getSuccess()) {
            Contacts = capContactResult.getOutput();
            for (yy in Contacts) {
                var theContact = Contacts[yy].getCapContactModel();
                if (theContact.getContactType() == existingType) {
                    theContact.setContactType(newType);
                    aa.people.editCapContact(theContact);
                    logDebug(" Contact for " + theContact.getFullName() + " Updated to " + newType);
                }
            }
        }
    }


    function peopleDuplicateCheck(ipPeop) {
        // This function uses the close match criteria stored in the
        // INDIVIDUAL_CONTACT_MATCH_CRITERIA and ORGANIZATION_CONTACT_MATCH_CRITERIA standard choices to check the reference
        // contact library for potential duplicates
        // takes a single peopleModel as a parameter, and will return an array of people models (peopResult)
        // returns null if there are no matches

        var fvContType = ipPeop.getContactTypeFlag();

        var fvCriteriaStdChoice = "INDIVIDUAL_CONTACT_MATCH_CRITERIA";
        // default to individual unless flag is Org
        if (fvContType == "organization") {
            fvCriteriaStdChoice = "ORGANIZATION_CONTACT_MATCH_CRITERIA";
        }
        if (gs2.common.lookup("REF_CONTACT_CREATION_RULES", fvContType) == "O") {
            fvCriteriaStdChoice = "ORGANIZATION_CONTACT_MATCH_CRITERIA";
        }

        //Add agency specific logic here if needed
        var fvBizDomainSR = aa.bizDomain.getBizDomain(fvCriteriaStdChoice);
        if (!fvBizDomainSR || !fvBizDomainSR.getSuccess()) {
            logDebug("Standard Choice '" + fvCriteriaStdChoice + "' not defined.");
            return null;
        }
        var fvBizDomain = fvBizDomainSR.getOutput();
        if (!fvBizDomain || fvBizDomain.size() == 0) {
            logDebug("No criteria defined in Standard Choice '" + fvCriteriaStdChoice + "'.");
            return null;
        }

        for (var fvCounter1 = 0; fvCounter1 < fvBizDomain.size() ; fvCounter1++) {
            var fvCloseMatchCriteriaObj = fvBizDomain.get(fvCounter1);
            var fvCriteriaStr = fvCloseMatchCriteriaObj.getDispBizdomainValue();
            if (!fvCriteriaStr || fvCriteriaStr == "")
                continue;

            var fvPeop = aa.people.createPeopleModel().getOutput().getPeopleModel();

            var fvCriteriaArr = fvCriteriaStr.split(";");

            var fvSkipThisCriteria = false;
            for (var fvCounter2 in fvCriteriaArr) {
                var fvCriteriaFld = fvCriteriaArr[fvCounter2];
                if (ipPeop[fvCriteriaFld] == null) {
                    fvSkipThisCriteria = true;
                    logDebug("Value for " + fvCriteriaFld + " is null.");
                    break;
                }
                fvPeop[fvCriteriaFld] = ipPeop[fvCriteriaFld];
                logDebug("Search for " + fvCriteriaFld + " " + fvPeop[fvCriteriaFld]);
            }

            if (fvSkipThisCriteria) {
                logDebug("WARNING: One or more Values for the Fields defined in this Criteria are null. Skipping this criteria.");
                continue;
            }

            var fvResult = aa.people.getPeopleByPeopleModel(fvPeop);
            if (!fvResult.getSuccess()) {
                logDebug("WARNING: Error searching for duplicate contacts : " + fvResult.getErrorMessage());
                continue;
            }

            var fvPeopResult = fvResult.getOutput();
            if (fvPeopResult.length == 0) {
                logDebug("Searched for REF contact, no matches found.");
                continue;
            }

            if (fvPeopResult.length > 0) {
                logDebug("Searched for a REF Contact, " + fvPeopResult.length + " matches found! returning the first match : " + fvPeopResult[0].getContactSeqNumber());
                return fvPeopResult[0].getContactSeqNumber();
            }
        }
        logDebug("No matches found. Returning Null.");
        return null;
    }

    function isCompareContacts(refPeopleCopy, con) {
        try {
            if ((refPeopleCopy.getFirstName() != con.getPeople().getFirstName()) || (refPeopleCopy.getMiddleName() != con.getPeople().getMiddleName()) || (refPeopleCopy.getLastName() != con.getPeople().getLastName()) || (refPeopleCopy.getBusinessName() != con.getPeople().getBusinessName()) || (refPeopleCopy.getEmail() != con.getPeople().getEmail()) || (refPeopleCopy.getPhone1() != con.getPeople().getPhone1()) || (refPeopleCopy.getPhone2() != con.getPeople().getPhone2()) || (refPeopleCopy.getFax() != con.getPeople().getFax())) {
                return false;

            }
            return true;

        } catch (err) {
            logDebug("**updateReqDocsTSI : " + err.message);
        }
    }

    function getContactObjPgFlow(ipContType) {
        var vCapContactArray = null;
        var vCapCMArray = new Array();
        if (controlString == "ApplicationSubmitAfter" || controlString == "ConvertToRealCAPAfter" || controlString == "ApplicationSubmitBefore") {
            if (controlString == "ApplicationSubmitAfter" || controlString == "ConvertToRealCAPAfter")
                vCapContactArray = aa.people.getCapContactByCapID(capId).getOutput();
            else
                if (controlString == "ApplicationSubmitBefore")
                    vCapContactArray = aa.env.getValue("ContactList").toArray();
            for (var vCounter1 in vCapContactArray)
                vCapCMArray.push(vCapContactArray[vCounter1].getCapContactModel());
        }
        else {
            var vCapContactsGroup = cap.getContactsGroup();
            if (vCapContactsGroup) {
                for (var vCounter1 = 0; vCounter1 < vCapContactsGroup.size() ; vCounter1++) {
                    vCapCMArray.push(vCapContactsGroup.get(vCounter1));
                }
            }
        }

        if (vCapCMArray) {
            for (var vCounter1 in vCapCMArray) {
                if (vCapCMArray[vCounter1].getPeople().contactType.toUpperCase().equals(ipContType.toUpperCase())) {
                    logDebug("Function getContactObjPgFlow returned the first contact of type " + ipContType + " on record " + capId.getCustomID());
                    return new contactObj(vCapCMArray[vCounter1]);
                }
            }
        }
        logDebug("Function getContactObjPgFlow could not find a contact of type " + ipContType + " on record " + capId.getCustomID());
        return false;
    }

    function getContactArrayWithTemplate() {
        var includeGroup = false;
        if (arguments.length > 0 && arguments[0]) {
            includeGroup = arguments[0];
        }
        var thisCap = capId;
        if (arguments.length > 1 && arguments[1]) {
            thisCap = arguments[1];
        }

        var cArray = new Array();
        if (arguments.length == 0 && !cap.isCompleteCap() && controlString != "ApplicationSubmitAfter") {
            capContactArray = cap.getContactsGroup().toArray()
        } else {
            var capContactResult = aa.people.getCapContactByCapID(thisCap);
            if (capContactResult.getSuccess()) {
                var capContactArray = capContactResult.getOutput()
            }
        }
        if (capContactArray) {
            for (yy in capContactArray) {
                var aArray = new Array();
                aArray.lastName = capContactArray[yy].getPeople().lastName;
                aArray.refSeqNumber = capContactArray[yy].getCapContactModel().getRefContactNumber();
                aArray.firstName = capContactArray[yy].getPeople().firstName;
                aArray.middleName = capContactArray[yy].getPeople().middleName;
                aArray.businessName = capContactArray[yy].getPeople().businessName;
                aArray.contactSeqNumber = capContactArray[yy].getPeople().contactSeqNumber;
                aArray.contactType = capContactArray[yy].getPeople().contactType;
                aArray.relation = capContactArray[yy].getPeople().relation;
                aArray.phone1 = capContactArray[yy].getPeople().phone1;
                aArray.phone2 = capContactArray[yy].getPeople().phone2;
                aArray.email = capContactArray[yy].getPeople().email;
                aArray.addressLine1 = capContactArray[yy].getPeople().getCompactAddress().getAddressLine1();
                aArray.addressLine2 = capContactArray[yy].getPeople().getCompactAddress().getAddressLine2();
                aArray.city = capContactArray[yy].getPeople().getCompactAddress().getCity();
                aArray.state = capContactArray[yy].getPeople().getCompactAddress().getState();
                aArray.zip = capContactArray[yy].getPeople().getCompactAddress().getZip();
                aArray.fax = capContactArray[yy].getPeople().fax;
                aArray.notes = capContactArray[yy].getPeople().notes;
                aArray.country = capContactArray[yy].getPeople().getCompactAddress().getCountry();
                aArray.fullName = capContactArray[yy].getPeople().fullName;
                aArray.peopleModel = capContactArray[yy].getPeople();
                var vTemplates = getTemplatesForContact(capContactArray[yy].getCapContactModel(), includeGroup);
                aArray.templates = vTemplates;
                var pa = new Array();
                if (arguments.length == 0 && !cap.isCompleteCap()) {
                    var paR = capContactArray[yy].getPeople().getAttributes();
                    if (paR) {
                        pa = paR.toArray()
                    }
                } else {
                    var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray()
                }
                for (xx1 in pa) {
                    aArray[pa[xx1].attributeName] = pa[xx1].attributeValue
                }
                cArray.push(aArray)
            }
        }
        return cArray
    }

    //Opt out email option
    function getTemplatesForContact(ipContactModel, ipIncludeGroup) {
        var opContactTemplates = new Array();
        var vTemplate = ipContactModel.getTemplate();
        if (vTemplate)
            opContactTemplates = getTemplatesArray(vTemplate, ipIncludeGroup);
        return opContactTemplates;
    }

    function getTemplatesArray(ipTemplate, ipIncludeGroup) {
        var opContactTemplates = new Array();
        var vGroupList = ipTemplate.getTemplateForms();
        if (vGroupList && vGroupList.size() > 0) {
            var vGroups = vGroupList.toArray();
            for (var vCounter1 in vGroups) {
                var vGroup = vGroups[vCounter1];
                var vGroupName = vGroup.getGroupName();
                var vSubgroups = vGroup.getSubgroups().toArray();
                for (var vCounter2 in vSubgroups) {
                    var vSubgroup = vSubgroups[vCounter2];
                    var vSubgroupName = vSubgroup.getSubgroupName();
                    var vFields = vSubgroup.getFields().toArray();
                    for (var vCounter3 in vFields) {
                        var vField = vFields[vCounter3];
                        var vFieldName = vField.getFieldName();
                        var vFieldValue = vField.checklistComment;
                        var vArrayIndex = "";
                        if (ipIncludeGroup)
                            vArrayIndex = vGroupName + "." + vSubgroupName + "." + vFieldName;
                        else
                            vArrayIndex = vSubgroupName + "." + vFieldName;
                        opContactTemplates[vArrayIndex] = vFieldValue;
                    }
                }
            }
        }
        return opContactTemplates;
    }

    function setContactsSyncFlag(syncFlagValue) {
        var itemCapId = capId;

        if (arguments.length > 1) {
            itemCapId = arguments[1];
        }

        var c = aa.people.getCapContactByCapID(itemCapId).getOutput();
        if (!c) logDebug("No contact found.");
        for (var i in c) {
            var con = c[i];
            var cm = con.getCapContactModel();
            var contactType = con.getPeople().getContactType();
            if (cm) {
                cm.setSyncFlag(syncFlagValue);
                var r = aa.people.updateCapContactSyncFlag(cm);
                if (r.getSuccess()) logDebug("Sync flag for contact " + contactType + " was updated.");
                else logDebug("**WARNING: Sync flag for contact " + contactType + " was not updated. " + r.getErrorMessage());
            }
        }
    }

function createRefContactsFromCapContactsAndLinkSA(pCapId, contactTypeArray, ignoreAttributeArray, replaceCapContact, overwriteRefContact, refContactExists) {

    // contactTypeArray is either null (all), or an array or contact types to process
    //
    // ignoreAttributeArray is either null (none), or an array of attributes to ignore when creating a REF contact
    //
    // replaceCapContact not implemented yet
    //
    // overwriteRefContact -- if true, will refresh linked ref contact with CAP contact data
    //
    // refContactExists is a function for REF contact comparisons.
    //
    // Version 2.0 Update:   This function will now check for the presence of a standard choice "REF_CONTACT_CREATION_RULES".
    // This setting will determine if the reference contact will be created, as well as the contact type that the reference contact will
    // be created with.  If this setting is configured, the contactTypeArray parameter will be ignored.   The "Default" in this standard
    // choice determines the default action of all contact types.   Other types can be configured separately.
    // Each contact type can be set to "I" (create ref as individual), "O" (create ref as organization),
    // "F" (follow the indiv/org flag on the cap contact), "D" (Do not create a ref contact), and "U" (create ref using transaction contact type).

    var standardChoiceForBusinessRules = "REF_CONTACT_CREATION_RULES";

    var ingoreArray = new Array();
    if (arguments.length > 1) ignoreArray = arguments[1];

    var defaultContactFlag = lookup(standardChoiceForBusinessRules, "Default");

    var c = aa.people.getCapContactByCapID(pCapId).getOutput()
    var cCopy = aa.people.getCapContactByCapID(pCapId).getOutput() // must have two working datasets
    vUpdatedRefContacts = "";

    var vRefcontactArray = new Array();

    for (var i in c) {
        var con = c[i];
        var refContactNum = con.getCapContactModel().getRefContactNumber();
        if (refContactNum) // This is a reference contact.   Let's refresh or overwrite as requested in parms.
        {

            //get the reference contact ASI and preserve them - this is specfic to the SA implementation
            var refPeopleModel = aa.people.getPeople(refContactNum).getOutput();
            var refPeopleModelCopy = aa.util.deepClone(refPeopleModel).getOutput();
            vRefcontactArray[refContactNum] = refPeopleModelCopy;
        }
    }

    for (var i in c) {
        var ruleForRefContactType = "U"; // default behavior is create the ref contact using transaction contact type
        var con = c[i];

        var p = con.getPeople();

        var contactFlagForType = lookup(standardChoiceForBusinessRules, p.getContactType());

        if (!defaultContactFlag && !contactFlagForType) // standard choice not used for rules, check the array passed
        {
            if (contactTypeArray && !exists(p.getContactType(), contactTypeArray))
                continue; // not in the contact type list.  Move along.
        }

        if (!contactFlagForType && defaultContactFlag) // explicit contact type not used, use the default
        {
            ruleForRefContactType = defaultContactFlag;
        }

        if (contactFlagForType) // explicit contact type is indicated
        {
            ruleForRefContactType = contactFlagForType;
        }

        if (ruleForRefContactType.equals("D"))
            continue;

        var refContactType = "";

        switch (ruleForRefContactType) {
            case "U":
                refContactType = p.getContactType();
                break;
            case "I":
                refContactType = "Individual";
                break;
            case "O":
                refContactType = "Organization";
                break;
            case "F":
                if (p.getContactTypeFlag() && p.getContactTypeFlag().equals("organization"))
                    refContactType = "Organization";
                else
                    refContactType = "Individual";
                break;
        }

        var refContactNum = con.getCapContactModel().getRefContactNumber();

        if (refContactNum) // This is a reference contact.   Let's refresh or overwrite as requested in parms.
        {
            if (overwriteRefContact) {
                //get the reference contact ASI and preserve them - this is specfic to the SA implementation
                var refPeopleModel = aa.people.getPeople(refContactNum).getOutput();
                var refPeopleCopy = vRefcontactArray[refContactNum];
                // compre all fields of refPeopleCopy and con
                // if no diff is found then skip
                isCompare = isCompareContacts(refPeopleCopy, con);

                if (!isCompare) {
                    var conASI = refPeopleModel.getTemplate();
                    p.setTemplate(conASI);

                    p.setContactSeqNumber(refContactNum); // set the ref seq# to refresh
                    p.setContactType(refContactType);

                    var a = p.getAttributes();

                    if (a) {
                        var ai = a.iterator();
                        while (ai.hasNext()) {
                            var xx = ai.next();
                            aa.print(xx);
                            xx.setContactNo(refContactNum);
                        }
                    }

                    var r = aa.people.editPeopleWithAttribute(p, p.getAttributes());

                    if (r.getSuccess()) {
                        logDebug("Successfully refreshed ref contact #" + refContactNum + " with CAP contact data");

                        logDebug("reference number " + refContactNum);
                        setFullnameForOrg(refContactNum);

                        if (vUpdatedRefContacts = "")
                            vUpdatedRefContacts = refContactNum + "";
                        else
                            vUpdatedRefContacts = vUpdatedRefContacts + "," + refContactNum;
                        // vUpdatedRefContacts = refContactNum + "";
                    }
                    else
                        logDebug("WARNING: couldn't refresh reference people : " + r.getErrorMessage());
                }
            }

            if (replaceCapContact) {
                // To Be Implemented later.   Is there a use case?
            }

        }
        else // user entered the contact freehand.   Let's create or link to ref contact.
        {
            var ccmSeq = p.getContactSeqNumber();

            var existingContact = refContactExists(p); // Call the custom function to see if the REF contact exists

            var p = cCopy[i].getPeople(); // get a fresh version, had to mangle the first for the search

            if (existingContact) // we found a match with our custom function.  Use this one.
            {
                refPeopleId = existingContact;
            }
            else // did not find a match, let's create one
            {

                var a = p.getAttributes();

                if (a) {
                    //
                    // Clear unwanted attributes
                    var ai = a.iterator();
                    while (ai.hasNext()) {
                        var xx = ai.next();
                        if (ignoreAttributeArray && exists(xx.getAttributeName().toUpperCase(), ignoreAttributeArray))
                            ai.remove();
                    }
                }

                p.setContactType(refContactType);
                var r = aa.people.createPeopleWithAttribute(p, a);

                if (!r.getSuccess()) {
                    logDebug("WARNING: couldn't create reference people : " + r.getErrorMessage());
                    continue;
                }

                //
                // createPeople is nice and updates the sequence number to the ref seq
                //

                var p = cCopy[i].getPeople();
                var refPeopleId = p.getContactSeqNumber();

                logDebug("Successfully created reference contact #" + refPeopleId);

                // Need to link to an existing public user.

                var getUserResult = aa.publicUser.getPublicUserByEmail(con.getEmail())
                if (getUserResult.getSuccess() && getUserResult.getOutput()) {
                    var userModel = getUserResult.getOutput();
                    logDebug("createRefContactsFromCapContactsAndLink: Found an existing public user: " + userModel.getUserID());

                    if (refPeopleId) {
                        logDebug("createRefContactsFromCapContactsAndLink: Linking this public user with new reference contact : " + refPeopleId);
                        aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), refPeopleId);
                    }
                }
            }

            //
            // now that we have the reference Id, we can link back to reference
            //

            var vDeletedCAs = compareAndRemoveExistingAddresses(pCapId, ccmSeq, refPeopleId);

            var ccm = aa.people.getCapContactByPK(pCapId, ccmSeq).getOutput().getCapContactModel();

            ccm.setRefContactNumber(refPeopleId);

            r = aa.people.editCapContact(ccm);

            if (!r.getSuccess()) {
                logDebug("WARNING: error updating cap contact model : " + r.getErrorMessage());
            }
            else {
                logDebug("Successfully linked ref contact " + refPeopleId + " to cap contact " + ccmSeq);
                setFullnameForOrg(refPeopleId);
            }
            reCreateRemovedAddresses(pCapId, ccmSeq, vDeletedCAs);


        } // end if user hand entered contact
    } // end for each CAP contact
} // end function

    function reCreateRemovedAddresses(ipCapId, ipContactSeq, ipDeletedCAs) {
        for (var vCounter in ipDeletedCAs) {
            var vDeletedCA = ipDeletedCAs[vCounter];
            associateRefContactAddressToRecordContact(ipCapId, ipContactSeq, vDeletedCA);
        }
    }

    function setFullnameForOrg(ipRefContactNum) {
        var vRefContactObj = aa.people.getPeople(ipRefContactNum).getOutput();
        if (vRefContactObj.contactType == "Organization") {
            vRefContactObj.setFullName(vRefContactObj.businessName);
            aa.people.editPeople(vRefContactObj);
        }
    }


    gs2.lp.test = test;
    gs2.lp.isDelegate = isDelegate;
    gs2.lp.isDeleisRelatedLpsSunspendedgate = isRelatedLpsSunspended;
    gs2.lp.isDuplicateStateLicNum = isDuplicateStateLicNum;

    gs2.address.UpdateAddressUnitLevelBuilding = UpdateAddressUnitLevelBuilding;
    gs2.address.getUIDASBAddress = getUIDASBAddress;
    gs2.address.getAddress = getAddress;
    gs2.address.getRefAddressIDByUID = getRefAddressIDByUID;

    gs2.user.isCurrUserTheApplicant = isCurrUserTheApplicant;
    gs2.user.isProxyUser = isProxyUser;
    gs2.user.getUserDept = getUserDept;
    gs2.user.linkPublicUserToApplication = linkPublicUserToApplication;
    gs2.user.getPublicUserModelByRefContact = getPublicUserModelByRefContact;
    gs2.user.getEmployeeID = getEmployeeID;
    gs2.user.peopleDuplicateCheck = peopleDuplicateCheck;
    gs2.user.getName4PublicUser = getName4PublicUser;
    gs2.user.getAccountOwnerContact4PublicUser = getAccountOwnerContact4PublicUser;

    gs2.contact.getRefConByPublicUserSeq = getRefConByPublicUserSeq;
    gs2.contact.getCapContactsByContactType = getCapContactsByContactType;
    gs2.contact.updateCapContactsFromRefContact = updateCapContactsFromRefContact;
    gs2.contact.getContactWithLockCondition = getContactWithLockCondition;
    gs2.contact.getContactConditionsByRefId = getContactConditionsByRefId;
    gs2.contact.isLockedContact = isLockedContact;
    gs2.contact.isCompareContacts = isCompareContacts;
    gs2.contact.getContactObjPgFlow = getContactObjPgFlow;
    gs2.contact.getContactArrayWithTemplate = getContactArrayWithTemplate;
    gs2.contact.getTemplatesForContact = getTemplatesForContact;
    gs2.contact.getTemplatesArray = getTemplatesArray;
    gs2.contact.setContactsSyncFlag = setContactsSyncFlag;
    gs2.contact.reCreateRemovedAddresses = reCreateRemovedAddresses;
    gs2.contact.createRefContactsFromCapContactsAndLinkSA = createRefContactsFromCapContactsAndLinkSA;
    gs2.contact.setFullnameForOrg = setFullnameForOrg;
    

})();
