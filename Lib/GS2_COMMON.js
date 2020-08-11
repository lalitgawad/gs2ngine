gs2.common = {};
(function () {

    function test() {
        gs2.log('GS2_COMMON Looks good');
        return true;
    }

    function zeroPad(n, t) {
        for (var i = String(n) ; i.length < (t || 2) ;) i = "0" + i;
        return i
    }

    /**
     * To initialize Application Object having all business rules specified for usage in common and  specific implementation
     * The method will be call in every applicable starting point of product trigger or specfic caller as per required of object methods to use
     *
     */
    function initializeAppObject() {
        try {
            if (capId) {
                var capSM = aa.cap.getCap(capId).getOutput();
                var appTypeResult = capSM.getCapType();
                appTypeString = appTypeResult.toString();
            }
            gs2.log("app type string = " + appTypeString);
            eval(getScriptText("APP:" + appTypeString + ""));
            appObj = new APP_OBJ(appTypeString, GS2_SCRIPT);
            gs2.log("APP_OBJ " + appObj);
        }
        catch (err) {
            handleError(err, "");
        }
    }

    /**
     * To handle Error and print in log (Accela Dev)
     * @param {object} err - error
     * @param {string} context - caller function
     */
    function handleError(err, context) {
        //gs2.error("ERROR: " + err.message + (err.stack ? "\nStack: " + err.stack : ""))
        gs2.error("ERROR: " + err.message + " In " + context + " Line " + err.lineNumber);
    }

    function matchesinArray(eVal, argList) {
        for (var i = 0; i < argList.length; i++) {
            if (argList[i] == eVal) {
                return true
            }
        }
        return false
    }

    function removeDuplicatesFromArray(arr) {
        var unique_array = [];
        for (var i = 0; i < arr.length; i++) {
            if (unique_array.indexOf(arr[i]) == -1) {
                unique_array.push(arr[i]);
            }
        }
        return unique_array;
    }

    /**
     * To get object in readable form to identify properties and methods
     * The method is use in debug or troubleshoot as developer's tool
     * @param {object} object
     */
    function debugObject(object) {
        var output = '';
        for (property in object) {
            output += "<font color=red>" + property + "</font>" + ': ' + "<bold>" + object[property] + "</bold>" + '; ' + "<BR>";
        }
        logDebug(output);
    }

    /**
     * To check is Valid Year
     * @param {string} inputvalue - year
     * @returns {boolean} - success
     */
    function isValidYear(inputvalue) {
        var isvalid = true;
        if (inputvalue != null && inputvalue != '') {
            var pattern = /^[0-9]{4}$/;
            isvalid = (pattern.test(inputvalue));
        }
        return isvalid;
    }

    /**
     * To check is valid number
     * @param {value type} inputValue - number value
     * @returns {boolean} - success
     */
    function isValidNumber(inputValue) {
        var isValid = true;
        var retMsg = '';
        if (inputValue != null || inputValue != '') {
            var Pattern = /^\d{9}$/;
            isValid = Pattern.test(inputValue);
            if (isValid) {
                retMsg += "Please enter 9 digit number.";
                retMsg += '<Br />';
                return retMsg;
            }
        }
        return retMsg;
    }

    /**
     * to get days difference between two dates
     * @param {date} date1
     * @param {date} date2
     * @returns {number} - days
     */
    function days_between(date1, date2) {

        // The number of milliseconds in one day
        var ONE_DAY = 1000 * 60 * 60 * 24

        // Convert both dates to milliseconds
        var date1_ms = date1.getTime()
        var date2_ms = date2.getTime()

        // Calculate the difference in milliseconds
        var difference_ms = Math.abs(date1_ms - date2_ms)

        // Convert back to days and return
        return Math.round(difference_ms / ONE_DAY)
    }

    /**
     * to get Department Name for user
     * @param {string} username
     * @returns {string} - department
     */
    function getDepartmentName(username) {
        var suo = aa.person.getUser(username).getOutput();
        var dpt = aa.people.getDepartmentList(null).getOutput();
        for (var thisdpt in dpt) {
            var m = dpt[thisdpt]
            var n = m.getServiceProviderCode() + "/" + m.getAgencyCode() + "/" + m.getBureauCode() + "/" + m.getDivisionCode() + "/" + m.getSectionCode() + "/" + m.getGroupCode() + "/" + m.getOfficeCode()

            if (n.equals(suo.deptOfUser))
                return (m.getDeptName())
        }
    }

    /**
     * To ger elapse time
     * @returns {Number} - time in milisecond
     */
    function elapsed() {
        var thisDate = new Date();
        var thisTime = thisDate.getTime();
        return ((thisTime - startTime) / 1000)
    }

    /**
     * To check value exists in array
     * @param {value type} eVal - Value to check
     * @param {Array} eArray - Array having all values
     * @returns {boolean} - Success
     */
    function exists(eVal, eArray) {
        for (ii in eArray)
            if (eArray[ii] == eVal) return true;
        return false;
    }

    /**
     * To get moth difference
     * @param {date} d1 - date 1
     * @param {date} d2 - date 2
     * @returns {Number} - numer of months
     */
    function monthDiff(d1, d2) {
        var d1Y = d1.getFullYear();
        var d2Y = d2.getFullYear();
        var d1M = d1.getMonth();
        var d2M = d2.getMonth();

        return (d2M + 12 * d2Y) - (d1M + 12 * d1Y) + 1;
    }

    /**
     * to check checkbox or radio selection Is Yes On Selected
     * @param {string} spassvalue
     * @returns {booelan} - true for selected
     */
    function isYesOnSelected(spassvalue) {
        return (spassvalue.equalsIgnoreCase('YES') || spassvalue.equalsIgnoreCase('Y') || spassvalue.equalsIgnoreCase('CHECKED') || spassvalue.equalsIgnoreCase('SELECTED') || spassvalue.equalsIgnoreCase('TRUE') || spassvalue.equalsIgnoreCase('ON'));
    }

    /**
     * To validate SSN (Not in use)
     * @param {string} ssn - SSN
     * @returns {boolean} - true if valid
     */
    function isValidSsn(ssn) {
        var isValid = true;
        if (ssn != null && ssn != '') {
            var matchArr = ssn.match(/^(\d{3})-?\d{2}-?\d{4}$/);
            var numDashes = ssn.split('-').length - 1;
            if (matchArr == null || numDashes == 1) {
                isValid = false;
            }
            else {
                if (parseInt(matchArr[1], 10) == 0) {
                    isValid = false;
                }
            }
        } else {
            isValid = true;
        }
        return isValid;
    }

    /**
     * To Validate Email value
     * @param {string} inputvalue - Email
     * @returns {boolean} - true if valid
     */
    function isValidEmail(inputvalue) {
        var isValid = true;
        if (inputvalue != null && inputvalue != '') {
            var pattern = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
            isValid = (pattern.test(inputvalue));
        }
        return isValid;
    }

    /**
     * To Validate phone number value
     * @param {string} inputvalue - phone number
     * @returns {boolena} - true if valid
     */
    function isValidPhoneNumber(inputvalue) {
        var isValid = true;
        if (inputvalue != null && inputvalue != '') {
            var pattern = /^[01]?[- .]?(\([2-9]\d{2}\)|[2-9]\d{2})[- .]?\d{3}[- .]?\d{4}$/;
            isValid = (pattern.test(inputvalue));
        }
        return isValid;
    }

    /**
     * To validate Zip Code
     * @param {string} inputvalue - zip code
     * @returns {boolean}  - true if valid
     */
    function isValidZip(inputvalue) {
        var isValid = true;
        if (inputvalue != null && inputvalue != '') {
            var pattern = /^\d{5}$|^\d{5}-\d{4}$/;
            isValid = (pattern.test(inputvalue));
        }
        return isValid;
    }

    /**
     * To get date Code (yyyyddmm)
     * @param {date} ipDate
     * @returns {string}
     */
    function getDateCode(ipDate) {
        var fvYear = ipDate.getFullYear().toString();
        var fvMonth = (ipDate.getMonth() + 1).toString();
        var fvDay = ipDate.getDate().toString();
        if (ipDate.getMonth() < 9) fvMonth = "0" + fvMonth;
        if (ipDate.getDate() < 10) fvDay = "0" + fvDay;

        var fvDateCode = fvYear + fvMonth + fvDay;
        return fvDateCode;
    }

    /**
     * to get Date String (MM/DD/YYYY)
     * @param {date} ipDate
     * @returns {string}
     */
    function getDateString(ipDate) {
        var fvYear = ipDate.getFullYear().toString();
        var fvMonth = (ipDate.getMonth() + 1).toString();
        var fvDay = ipDate.getDate().toString();
        if (ipDate.getMonth() < 9) fvMonth = "0" + fvMonth;
        if (ipDate.getDate() < 10) fvDay = "0" + fvDay;

        var fvDateString = fvMonth + "/" + fvDay + "/" + fvYear;
        return fvDateString;
    }

    /**
     * To log arguments passed to function
     * Used for debug or troubleshooting purpose
     * @param {array} args
     */
    function logArgs(args) {
        return;
        if (args) {
            if (args.length > 0) {
                for (var irow = 0; irow < args.length; irow++) {
                    logDebug("argument = " + irow + " = " + args[0]);
                }
            } else {
                logDebug("Arguments: NONE");
            }
        } else {
            logDebug("Calling Exception: logArgs expects parameter as arguments");
        }
    }

    /**
     * format date in MM/DD/YYYY
     * @param {date} pDate - Date value
     * @returns {string} - formatted string
     */
    function formatMMDDYYYY(pDate) {
        var dDate = new Date(pDate);

        return (dDate.getMonth() + 1) + "/" + dDate.getDate() + "/" + dDate.getFullYear();
    }

    /**
     * to log and raise error
     * @param {string} err
     */
    function logError(err) {
        logDebug("**" + err);
    }

    /**
     * To get Look value
     * @param {string} sControl - Standard Choice Name
     * @param {string} sValue - Standard Choice value
     * @returns {string}  - Standard Choice Decription as lookup value
     */
    function GetLookupVal(sControl, sValue) {
        var desc = "";
        var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(sControl, sValue);

        if (bizDomScriptResult.getSuccess()) {
            var bizDomScriptObj = bizDomScriptResult.getOutput();
            desc = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
        }

        return desc;
    }

    /**
     * Look up standard choice Description by value
     * @param {string} stdChoice - standard choice
     * @param {string} stdValue - standard value
     * @returns {string} - standard description
     */
    function lookup(stdChoice, stdValue) {
        var strControl;
        var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);

        if (bizDomScriptResult.getSuccess()) {
            var bizDomScriptObj = bizDomScriptResult.getOutput();
            strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
            //logDebug("lookup(" + stdChoice + "," + stdValue + ") = " + strControl);
        }
        else {
            logDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
        }
        return strControl;
    }

    /**
     * Returns Date object when Date string, format and Deleimiter are passed as input
     * @param {String} _date - Date in String Format
     * @param {String} _format - Format of the Date String
     * @param {String} _delimiter - Delimiter in the Date String
     * @returns {value type} Date- Date
     */
    function stringToDate(_date, _format, _delimiter) {
        try {
            var formatLowerCase = _format.toLowerCase();
            var formatItems = formatLowerCase.split(_delimiter);
            var dateItems = _date.split(_delimiter);
            var monthIndex = formatItems.indexOf("mm");
            var dayIndex = formatItems.indexOf("dd");
            var yearIndex = formatItems.indexOf("yyyy");
            var month = parseInt(dateItems[monthIndex]);
            month -= 1;
            var formatedDate = new Date(dateItems[yearIndex], month, dateItems[dayIndex]);

        } catch (vError) {
            logDebug("Runtime error occurred in stringToDate function: " + vError);
        }
        return formatedDate;
    }


    /**
     * Returns if the passed date is a past date or not
     * @param {String}  - Date in String format ("DD/MM/YYYY")
     * @returns {boolean} - returns true if passed date is in past else return False
     */
    function isPastDate(vDateString) {
        try {
            var sysDate = aa.date.getCurrentDate();
            var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), sysDate.getYear(), "");

            if (dateDiff(convertDate(sysDateMMDDYYYY), convertDate(vDateString)) >= 0)
                return false;
            return true;
        } catch (vError) {
            logDebug("Runtime error occurred in isPastDate function: " + vError);
        }
    }
    /**
     * get New File name for same full path
     * @param {String}  - Source File Full Path
     * @param {String}  - optional defined file name
     * @returns {String} - returns new file full path
     */
    function getNewFileFullPath(sourceFileFullName) {
        var fileFillName = sourceFileFullName + "";
        var pathArray = fileFillName.split("\\");
        var sfilename = pathArray[pathArray.length - 1];
        var arrayfilename = sfilename.split(".");
        var subArray = arrayfilename[0].split("_");
        subArray.splice(subArray.length - 1);
        subArray.splice(subArray.length - 1);

        arrayfilename[0] = subArray.join("_");
        sfilename = arrayfilename.join(".");
        if (arguments.length > 1) sfilename = arguments[1]; // use defined filename
        pathArray[pathArray.length - 1] = sfilename;
        var newFillName = pathArray.join("\\");
        return newFillName;
    }
    /**
     * Rename file
     * @param {String}  - source file name
     * @param {String}  - destination file name
     */
    function renameFile(sourceFileFullName, destFileFullName) {
        sourceFileFullName = sourceFileFullName + "";
        destFileFullName = destFileFullName + "";

        var vFosParams = new Array();
        vFosParams.push(sourceFileFullName);
        var vFile = aa.proxyInvoker.newInstance("java.io.File", vFosParams).getOutput();

        vFosParams = new Array();
        vFosParams.push(destFileFullName);
        var vnewFile = aa.proxyInvoker.newInstance("java.io.File", vFosParams).getOutput();

        vFile.renameTo(vnewFile);
    }


    function todaysDate() {
        var d = new Date();
        month = '' + (d.getMonth() + 1);
        day = '' + d.getDate();
        year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [month, day, year].join('/');
    }


    function isNullOrBlank(value) {
        if (value == null || value == '' || (typeof value == "string" && value.trim() == '')) {
            return true;
        } else {
            return false;
        }
    }

    function replaceAllInstances(ipString, ipOldText, ipNewText) {
        var opString = ipString;
        while (opString.indexOf(ipOldText) != -1)
            opString = opString.replace(ipOldText, ipNewText);
        return opString;
    }

    function Length(ipString) {
        var opLength = 0;
        if (typeof (ipString.length) == "function")
            opLength = ipString.length();
        else
            opLength = ipString.length;
        return opLength;
    }

    function padCharToLength(ipText, ipChar, ipLen) {
        var vLeading = false;
        if (arguments.length > 3)
            vLeading = arguments[3];
        if (Length(ipText) >= ipLen)
            return ipText;
        else
            return padChar(ipText, ipChar, ipLen - Length(ipText), vLeading);
    }
    function padChar(ipText, ipChar, ipNum) {
        var vLeading = false;
        if (arguments.length > 3)
            vLeading = arguments[3];
        for (var vCounter = 0; vCounter < ipNum; vCounter++) {
            if (vLeading)
                ipText = ipChar + ipText;
            else
                ipText = ipText + ipChar;
        }
        return ipText;
    }

    /**
     * check is null and set default value for null to return
     * @param {value type} pTestValue - value to check
     * @param {value type} pNewValue - default value
     * @returns {value type} - return default value
     */
    function isNull(pTestValue, pNewValue) {
        if (pTestValue == null || pTestValue == "" || pTestValue == "null")
            return pNewValue;
        else
            return pTestValue;
    }


    /**
    * Returns if a future date
    */
    function isFutureDate(GivenDate) {
        var CurrentDate = new Date();
        GivenDate = new Date(GivenDate);
        if (GivenDate > CurrentDate) {
            return true;
        } else {
            return false;
        }
    }

    function renameReportOutputFile(sfileFillName) {
        try {
            var fileFillName = sfileFillName + "";
            var newFillName = getNewFileFullPath(fileFillName);
            renameFile(sfileFillName, newFillName);
            return newFillName;
        } catch (err) {
            logDebug("** Error in: renaming the file: " + err.message);
        }
        return sfileFillName;
    }

    function NewLicDef(fldname, val) {
        this.FieldName = fldname;
        this.Value = val;

        var subgroupname = null;
        if (arguments.length > 2) {
            subgroupname = arguments[2];
        }
        this.SubGroupName = subgroupname;
    }


    /**
     * Convert DateTimeString to JS Date
     * @param {string} dateTimeString - Date Time String in DB format
     * @returns {Date} - Java Script Date
     */
    function convertDateTimeStringtoJSDate(dateTimeString) {
        try {
            var dateString = dateTimeString.split(' ');
            var dateStringArray = dateString[0].split('-');
            var month = dateStringArray[1];
            var day = dateStringArray[2];
            var year = dateStringArray[0];
            return new Date(month + "/" + day + "/" + year);
        } catch (err) {
            logDebug("A JavaScript Error occurred while converting date " + err.message);
        }
    }

    function convertACAErrorToMessage() {
        var vLeft = "0";
        if (arguments.length > 0 && arguments[0])
            vLeft = arguments[0].toString();
        var vTop = "-20";
        if (arguments.length > 1 && arguments[1])
            vTop = arguments[1].toString();
        var vWidth = "170";
        if (arguments.length > 2 && arguments[2])
            vWidth = arguments[2].toString();
        var vHeight = "20";
        if (arguments.length > 3 && arguments[3])
            vHeight = arguments[3].toString();

        var vNoErrorText = "<style>.ACA_Message_Content div{text-indent:-40002px ;}</style>";//"<p class = 'myCustomErrorLink' align='left' style='background-color: #F9E1DA; text-decoration: none;color: black;left:" + vLeft + "px;top:" + vTop + "px;position:relative;width:" + vWidth + "px;height:" + vHeight + "px' ><style>.ACA_XShoter {display:none;}</style></p>";

        showMessage = true;
        comment(vNoErrorText);
    }
    function existsCustom1(eVal, eArray) {
        for (var ii in eArray)
            if (eVal.indexOf(eArray[ii]) >= 0) return true;
        logDebug("Comparing " + eArray[ii] + " and " + eVal)
        return false;
    }
    function findInArray(item, array) {
        for (i in array) {
            if (array[i] == item)
                return true;
        }
        return false;
    }

    function addParameter(pamaremeters, key, value) {
        if (key != null) {
            if (value == null) {
                value = "";
            }
            pamaremeters.put(key, value);
        }
    }

    gs2.common.test = test;
    gs2.test = test;
    gs2.common.zeroPad = zeroPad;
    gs2.common.handleError = handleError;
    gs2.common.initializeAppObject = initializeAppObject;
    gs2.common.matchesinArray = matchesinArray;
    gs2.common.removeDuplicatesFromArray = removeDuplicatesFromArray;
    gs2.common.debugObject = debugObject;
    gs2.common.isValidYear = isValidYear;
    gs2.common.isValidNumber = isValidNumber;
    gs2.common.days_between = days_between;
    gs2.common.getDepartmentName = getDepartmentName;
    gs2.common.elapsed = elapsed;
    gs2.common.exists = exists;
    gs2.common.monthDiff = monthDiff;
    gs2.common.isYesOnSelected = isYesOnSelected;
    gs2.common.isValidSsn = isValidSsn;
    gs2.common.isValidEmail = isValidEmail;
    gs2.common.isValidPhoneNumber = isValidPhoneNumber;
    gs2.common.isValidZip = isValidZip;
    gs2.common.getDateCode = getDateCode;
    gs2.common.getDateString = getDateString;
    gs2.common.logArgs = logArgs;
    gs2.common.formatMMDDYYYY = formatMMDDYYYY;
    gs2.common.logError = logError;
    gs2.common.GetLookupVal = GetLookupVal;
    gs2.common.lookup = lookup;
    gs2.common.stringToDate = stringToDate;
    gs2.common.isPastDate = isPastDate;
    gs2.common.getNewFileFullPath = getNewFileFullPath;
    gs2.common.renameFile = renameFile;
    gs2.common.todaysDate = todaysDate;
    gs2.common.isNullOrBlank = isNullOrBlank;
    gs2.common.replaceAllInstances = replaceAllInstances;
    gs2.common.Length = Length;
    gs2.common.padCharToLength = padCharToLength;
    gs2.common.padChar = padChar;
    gs2.common.isNull = isNull;
    gs2.common.isFutureDate = isFutureDate;
    gs2.common.renameReportOutputFile = renameReportOutputFile;
    gs2.common.NewLicDef = NewLicDef;
    gs2.common.convertDateTimeStringtoJSDate = convertDateTimeStringtoJSDate;
    gs2.common.convertACAErrorToMessage = convertACAErrorToMessage;
    gs2.common.existsCustom1 = existsCustom1;
    gs2.common.findInArray = findInArray;
    gs2.common.addParameter = addParameter;

})();


