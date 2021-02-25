var conn = null;
var sStmt = null;
var rSet = null;
try
{
    var sql = "select concat('<br><strong>',b1_special_text,'</strong> ',b1_app_type_alias,' event with permit number <strong>',b1_alt_id,'</strong> on ',convert(varchar(10),b1_file_dd,101)) as tt from dbo.b1permit where datediff(d,cast(sysdatetime() as date),cast(b1_file_dd as date))<20 and datediff(d,cast(sysdatetime() as date),cast(b1_file_dd as date))>0 and b1_appl_status in ('In Progress','Accepted','Pending Approval') and serv_prov_code='HOCOTEC'";
    var secapname = "";
    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
    var ds = initialContext.lookup("java:/HOCOTEC");
    conn = ds.getConnection();
    sStmt = conn.prepareStatement(sql);
    rSet = sStmt.executeQuery();
    while (rSet.next())
    {
        secapname += rSet.getString("tt")+"";
    }
}
catch (err)
{
    aa.print(err);
}
closeDBQueryObject(rSet, sStmt, conn);

if(secapname!= "")
{
    var sesubj = "Event Date within 20 days, not yet approved";
    var sebody = "<P>The Special Event Permit application for the below event(s) is within "
        +"Twenty (20) days of the event date, and <STRONG><FONT color='#ff0000'>HAS NOT "
        +"BEEN APPROVED</FONT></STRONG>. </P><P>"
        +secapname
        +"</P>";
    email("MRichardson@howardcountymd.gov","SpecialEventTEST@howardcountymd.gov",sesubj,sebody);
}
function email(pToEmail, pFromEmail, pSubject, pText)
{
    aa.sendMail(pFromEmail, pToEmail, "", pSubject, pText);
    aa.print(pSubject+""+ pText);
    return true;
}

function closeDBQueryObject(rSet, sStmt, conn) {
    try {
        if (rSet) {
            rSet.close();
            rSet = null;
        }
    } catch (vError) {
        aa.print("Failed to close the database result set object." + vError);
    }
    try {
        if (sStmt) {
            sStmt.close();
            sStmt = null;
        }
    } catch (vError) {
        aa.print("Failed to close the database prepare statement object." + vError);
    }
    try {
        if (conn) {
            conn.close();
            conn = null;
        }
    } catch (vError) {
        aa.print("Failed to close the database connection." + vError);
    }
}