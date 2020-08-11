var usr = aa.env.getValue("PublicUserModel");
var pUserSeqNumber = usr.getUserSeqNum();
var peopleResult = aa.people.getUserAssociatedContact(pUserSeqNumber ).getOutput().toArray();
contactNum = peopleResult[0].getContactSeqNumber();
pm = aa.people.getPeople(contactNum).getOutput();
var eaHM = new Array();
var vError = '';
var conn = null;
var sStmt = null;
var rSet = null;
var msg = '';

var sql = "SELECT DISTINCT ACCT_SEQ_NBR,ACCT_ID FROM XACCT_PEOPLE where PEOPLE_SEQ_NBR = '" + contactNum + "'";
try {
    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
    var ds = initialContext.lookup("java:/AA");
    conn = ds.getConnection();
    sStmt = conn.prepareStatement(sql);
    rSet = sStmt.executeQuery();
    var seq = 1;
    var hm = new Array();
    while (rSet.next())
    {
        var vAcctID = rSet.getString("ACCT_ID")+"";
        if(hm[vAcctID]!=1)
        {
            hm[vAcctID] = 1;
            var accountObj = aa.trustAccount.getTrustAccountByAccountID(vAcctID)
                .getOutput();

            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext")
                .getOutput();
            var ds = initialContext.lookup("java:/AA");
            var conn = ds.getConnection();
            // Get Max Sequence Number
            var selectString = "SELECT MAX(ENTITY_SEQ_NBR) AS MAX_ENT FROM [XENTITY_PERMISSION]";
            var sStmt = conn.prepareStatement(selectString);
            var rSet = sStmt.executeQuery();
            rSet.next();
            var max_Ent = rSet.getString("MAX_ENT");
            rSet.close();
            //Increase max sequence number by 1
            max_Ent++;
            if (usr ) {
                // Insert data into XENTITY_PERMISSION
                var insertString = "SET NOCOUNT ON; INSERT INTO [XENTITY_PERMISSION] (SERV_PROV_CODE,ENTITY_SEQ_NBR,ENTITY_ID,ENTITY_TYPE,PERMISSION_TYPE,PERMISSION_VALUE,REC_DATE,REC_STATUS,REC_FUL_NAM,ENTITY_ID2) ";
                insertString += "VALUES ('" + aa.getServiceProviderCode() + "'," + max_Ent + "," + accountObj.getAcctSeq() + ",'TRUST_ACCOUNT','TRUST_ACCOUNT_ACCESS_ROLE','A',GETDATE(),'A','ADMIN'," + usr.getUserSeqNum() + ");";
                sStmt = conn.prepareStatement(insertString);
                sStmt.execute();
            }
            // Update the Last Sequence Number to keep the sequencing in sync between XENTITY_PERMISSION & AA_SYS_SEQ
            var selectString = "SELECT LAST_NUMBER from AA_SYS_SEQ where SEQUENCE_NAME = 'XENTITY_PERMISSION_SEQ'";
            var sStmt = conn.prepareStatement(selectString);
            var rSet = sStmt.executeQuery();
            rSet.next();
            var initMaxEnt = parseInt(rSet.getString("LAST_NUMBER"));
            //rSet.close();
            if (max_Ent > initMaxEnt) {
                initMaxEnt += 10;
                var updateString = "SET NOCOUNT ON; UPDATE [AA_SYS_SEQ] SET LAST_NUMBER = " + initMaxEnt + " WHERE SEQUENCE_NAME = 'XENTITY_PERMISSION_SEQ' AND SEQUENCE_DESC = 'XENTITY_PERMISSION.ENTITY_SEQ_NBR';";
                sStmt = conn.prepareStatement(updateString);
                sStmt.execute();
            }

        }
    }
    conn.close();
} catch (vError) {
    aa.print("Runtime error occurred: " + vError);
}
