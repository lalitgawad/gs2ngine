var conCondArray = aa.capCondition.getCapConditions(capId);
if (conCondArray.getSuccess())
{
    var capConds = conCondArray.getOutput();
    for (var nd in capConds) {
        var cond = capConds[nd];            
        if (cond.getConditionStatus() == "Applied" && (cond.getImpactCode() == "Lock")) {
            showMessage = true;
            cancel = true;
            comment("One of the contacts selected for this application currently has a condition that prevents the contact from being added to this record.");
            break;
        }
    }
}
        