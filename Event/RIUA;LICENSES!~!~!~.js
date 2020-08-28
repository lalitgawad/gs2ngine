b1ExpResult = aa.expiration.getLicensesByCapID(capId);
if (b1ExpResult.getSuccess())
{
    var b1Exp = b1ExpResult.getOutput();
    if(b1Exp)
    {
        var expDate=b1Exp.getExpDate();
        if(expDate)
        {
            var b1ExpDate = expDate.getMonth() + "/" + expDate.getDayOfMonth() + "/" + expDate.getYear();
            var d1 = new Date(b1ExpDate);
            var today = new Date();
            var myToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            var diff = numDaysBetween(d1, myToday);
            aa.print("diff: "+ diff);
            if(diff < 90 && diff > -1 )
            {
                var createResult =aa.cap.createRenewalRecord(capId);
                if(createResult.getSuccess())
                {
                    var renewalCapId = createResult.getOutput();
                    demoSendExpirationNotice(renewalCapId);
                }
				updateAppStatus("About to Expire", "Updated via Script", capId);
            }
        }
    } 
}

function numDaysBetween (d1, d2) {
  var diff = d1.getTime() - d2.getTime();
  return diff / (1000 * 60 * 60 * 24);
};