try{
//	wfTask = "Completeness Review";
//	wfStatus = "Additional Information Required"
	if (matches(wfStatus, "Additional Information Required"))
		{
			wf = aa.workflow.getTaskItemByCapID(capId,null).getOutput();
			for(x in wf) {
				fTask = wf[x];
				taskName=fTask.getTaskDescription();
				if(matches(taskName, wfTask)) {
					var caseMgr = wf[x].getAssignedStaff().getFirstName()+ " " +wf[x].getAssignedStaff().getLastName();
					var caseMgrEmail = wf[x].getAssignedStaff().getEmail();
					var statusDate = wf[x].getStatusDateString();
					agencyName = getWFTaskUserAgency(fTask);

					var stepNbr = wf[x].getStepNumber();
					var processID = wf[x].getProcessID();
					var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(capId, processID,stepNbr)
						if (TSIResult.getSuccess())
						{
							var TSI = TSIResult.getOutput();
				 			for (a1 in TSI)
			  				{
			  					if (TSI[a1].getCheckboxDesc() == "Comments") {
									comments = TSI[a1].getChecklistComment();
								}
			  	  			}
				 		}
				}
			}
			var capScriptModel = aa.cap.getCap(capId);
			var capProject = "";
			if(capScriptModel.getSuccess())
			{
				capType = capScriptModel.getOutput().getCapType();
				alias = capType.alias;
				capProject = capScriptModel.getOutput().getSpecialText();
				capProject = (capProject)? " - "+capProject:"";

			}
			var actUserObj = aa.person.getUser(currentUserID).getOutput();
			var actByUserName = actUserObj.getFirstName() + ' ' + actUserObj.getLastName();
			var actByUserEmail = actUserObj.getEmail();
			var actByUserAgency = actUserObj.getAgencyCode();

        	//Use Agency Name instead of Agency Code.
        	var actByUserAgencyName = gs2.util.getAgencyName(actByUserAgency);

				var contEmail = false;
				contFound=false;
				contArr = getContactArray();
				for (x in contArr){
					if (contArr[x]["contactType"] == "Applicant") {
						contEmail = contArr[x]["email"];
						if(contEmail){
							var emailParameters = aa.util.newHashtable();
							getRecordParams4Notification(emailParameters);
							addParameter(emailParameters, "$$recordID$$", capIDString);
							addParameter(emailParameters, "$$recordType$$", alias);
							addParameter(emailParameters, "$$projectName$$", capProject);
							//addParameter(emailParameters, "$$AgencyName$$", servProvCode);
							//Use Agency Name instead of Agency Code.
							addParameter(emailParameters, "$$AgencyName$$", actByUserAgencyName);  
							addParameter(emailParameters, "$$ReviewerName$$", actByUserName);
							addParameter(emailParameters, "$$ReviewerEmail$$", actByUserEmail);
							addParameter(emailParameters, "$$ACAURL$$", acaUrl);
							addParameter(emailParameters, "$$WorkflowStatusDate$$", statusDate);
							addParameter(emailParameters, "$$TASKSPECIFICINFO$$", comments);
							//sendNotification(sysFromEmail, contEmail, "", "Additional Information Required", emailParameters, null);
							gs2.notification.sendNotificationForTaskSpeciInfo(sysFromEmail, contEmail, "", "Additional Information Required", emailParameters, null, "$$TASKSPECIFICINFO$$");
						}else{
							logDebug("No email address found for " + contArr[x]["firstName"] +" " + contArr[x]["lastName"] +".  'Additional Information Required' notification not sent");
						}
					}
				}
		}
}catch (err) {
    logDebug("A JavaScript Error occurred: WTUA:*/*/*/*: #01: " + err.message);
}





