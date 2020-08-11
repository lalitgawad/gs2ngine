/**
| Program : INCLUDES_PAGEFLOW.js
| Trigger : From Pageflow scripts
| Event : Pageflow Events (ONLOAD, AFTER, BEFORE)
| Usage : EMSE Scripting
| Agency : <gs2>
| Purpose : Common function in ACA Page flow scripts
| Mark  : New Script
| Notes : Initial Version
*/

//===================================
// Common function in ACA Page flow scripts
// Dev Note: common functions are also available in respective module includes
//===================================
eval(getScriptText("INCLUDES_CUSTOM_GLOBALS"));

var prefix = "Page Flow";

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

function checkReqLPTypes(ipLPTypeList) {
	if (!ipLPTypeList || ipLPTypeList == "")
		return true;
	var opResult = false;
	var vIsLPSelected = false;
	var vLPList = aa.env.getValue("LicProfList");

	if (vLPList && String(vLPList.getClass()).indexOf("Array") != -1)
		vIsLPSelected = true;
	var vLPTokens = ipLPTypeList.split("||");

	if (vIsLPSelected) {
		opResult = true;
		var vLPArr = vLPList.toArray();
		for (var vCounter1 in vLPTokens) {
			var vLPTypeList = vLPTokens[vCounter1];
			var vLPTypeArr = vLPTypeList.split("!");
			var vLPFound = false;
			for (var vCounter2 in vLPTypeArr) {
				var vLPType = vLPTypeArr[vCounter2];
				var vFound = false;
				for (var vLPCounter in vLPArr) {
					var vLP = vLPArr[vLPCounter];
					if (vLP.licenseType == vLPType) {
						vFound = true;
						break;
					}
				}
				if (vFound) {
					vLPFound = true;
					break;
				}
			}
			if (!vLPFound) {
				opResult = false;
				break;
			}
		}
	}
	if (!opResult) {
		var vLPMessage = ipLPTypeList.replace(/\|\|/g, " AND ");
		vLPMessage = vLPMessage.replace(/!/g, " OR ");
		cancel = true;
		showMessage = true;
		comment("Following License Types are required:");
		comment(vLPMessage);
	}
	return opResult;
}

/**
 * to get asit row count
 * @param {objcet} OBJECT - asit table object
 * @returns {number} - row count
 * @Usage - 
 */
function ASIT_RecCount(OBJECT) {
	if (typeof (OBJECT) == "object" && OBJECT.length) {
		return (OBJECT.length)
	}
	return (0);
}
