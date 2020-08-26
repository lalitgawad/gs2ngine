/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/

var showMessage = false;                        // Set to true to see results in popup window
var showDebug = false;                          // Set to true to see debug messages in popup window
var cancel = false;

var startDate = new Date();
var startTime = startDate.getTime();
var message =   "";                         // Message String
var debug = "";                             // Debug String
var br = "<BR>";                            // Break Tag

var useSA = false;
var SA = null;
var SAScript = null;
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE");
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") {
    useSA = true;
    SA = bzr.getOutput().getDescription();
    bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT");
    if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }
    }

if (SA) {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA));
    eval(getScriptText(SAScript,SA));
    }
else {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
    }

eval(getScriptText("INCLUDES_CUSTOM"));

function getScriptText(vScriptName){
    var servProvCode = aa.getServiceProviderCode();
    if (arguments.length > 1) servProvCode = arguments[1]; // use different serv prov code
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    try {
        var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN");
        return emseScript.getScriptText() + "";
        } catch(err) {
        return "";
    }
}

//---------------------------------MAIN LOOP---------------------------------

var cap = aa.env.getValue("CapModel");
var capId = cap.getCapID();
logDebug(capId.getCustomID());
var servProvCode = capId.getServiceProviderCode()
var publicUser = false;
//logDebug("**ERROR: ");



var currentUserID = aa.env.getValue("CurrentUserID");
var publicUserModelResult = aa.publicUser.getPublicUserByPUser(currentUserID);
var pu= publicUserModelResult.getOutput();
var userSeqNum = publicUserModelResult.getOutput().getUserSeqNum();
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN"; publicUser = true }  // ignore public users
var useAppSpecificGroupName = false; 		// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false; 		// Use Group name when populating Task Specific Info Values
var enableVariableBranching = false;
var maxEntries = 99; 						// Maximum number of std choice entries.  Entries must be Left Zero Padded
var feeSeqList = new Array(); 					// invoicing fee list
var paymentPeriodList = new Array(); 				// invoicing pay periods
var capIDString = capId.getCustomID(); 				// alternate cap id string
var systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString(); 			// Convert application type to string ("Building/A/B/C")
var appTypeArray = appTypeString.split("/"); 			// Array of application type string
var currentUserGroup;
var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput()
if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();
var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), sysDate.getYear(), "");

//showDebug = true;
var pUserSeqNumber = publicUserModelResult.getOutput().getUserSeqNum();
logDebug(pUserSeqNumber);
logDebug(capId);

// Step 1 Get the ACA publicuser Refrence contact details

var refCon = getRefConByPublicUserSeq(pUserSeqNumber);
var peopleSequenceNumber = refCon.getContactSeqNumber();
var firstname = refCon.getFirstName();
var lastname = refCon.getLastName();
var email = refCon.getEmail();
logDebug(peopleSequenceNumber);

var peopleModel = aa.people.getPeople(peopleSequenceNumber).getOutput();
var tmpl = peopleModel.getTemplate();

// Step 2 Create a capContact model and set all publicuser attributes to it.

var contactmodel = cap.getCapContactModel();
aa.people.createCapContact(contactmodel);
newerPeople = contactmodel.getPeople();
/*newerPeople.setContactType("Facility");
newerPeople.setFirstName(firstname);
newerPeople.setLastName(lastname);
newerPeople.setEmail(email);
newerPeople.setContactAddressList(refCon.getContactAddressList());*/


refCon.setContactType("Facility");
refCon.setContactTypeFlag("individual");
contactmodel.setPeople(refCon);
contactmodel.setContactTypeFlag("individual");
var peopSearchModel = aa.people.createPeopleModel().getOutput();
peopSearchModel.setServiceProviderCode(aa.getServiceProviderCode());
peopSearchModel.setEmail(refCon.getEmail());
var getRecordsResult = aa.people.getCapIDsByRefContact(peopSearchModel);
if (getRecordsResult.getSuccess()) 
{
    
    var recordsList = getRecordsResult.getOutput();
    for (var rr in recordsList) {

        var id1 = recordsList[rr].getID1();
        var id2 = recordsList[rr].getID2();
        var id3 = recordsList[rr].getID3();
        var capIdToAdd = aa.cap.getCapID(id1,id2,id3).getOutput();
        logDebug("License Num: "+ capIdToAdd.getCustomID());
        if(String(capIdToAdd.getCustomID()).indexOf("CER-") > -1)
        {
            editAppSpecific4ACA("License Number",capIdToAdd.getCustomID()+"");
            break;
        }        
                                                
    }
}
//aa.people.editCapContact(contactmodel);
var contactList =cap.getContactsGroup();
contactList.add(contactmodel);
// Set the newly created contact as "Applicant"
cap.setContactsGroup(contactList);
aa.env.setValue("CapModel",cap);



contactList1 = cap.getContactsGroup();
logDebug("Legth2" + contactList1.size());

var vCGs = cap.getContactsGroup();
for (var vCounter = 0; vCounter < vCGs.size(); vCounter++)
{
    var vCG = vCGs.get(vCounter);
    var vCType = vCG.getContactType();
    logDebug(vCType);
    if (vCType == "Facility")
    {
        vCG.setComponentName("Contact 1");
        vCGs.set(vCounter,vCG);
    }        
}
cap.setContactsGroup(vCGs);



contactList1 = cap.getContactsGroup();
logDebug("Legth1" + contactList1.size());

function getRefConByPublicUserSeq(pSeqNum) 
{

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


if (debug.indexOf("**ERROR") > 0 || debug.substr(0,7) == "**ERROR") {
    showDebug = true;
    aa.env.setValue("ErrorCode", "1");
    aa.env.setValue("ErrorMessage", debug);
}
else {
    if (cancel) {
        aa.env.setValue("ErrorCode", "-2");
        if (showMessage) aa.env.setValue("ErrorMessage", message);
        if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
    else {
        aa.env.setValue("ErrorCode", "0");
        if (showMessage) aa.env.setValue("ErrorMessage", message);
        if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
}

