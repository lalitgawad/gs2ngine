var gs2 = gs2 || {};
(function () {
	var sp;
    function n() {
		aa.log("Start Load Lib");
        eval(t("GS2_LIB"));
        gs2.init(!0);
		aa.log("End Load Lib");
    }

    function t(n) {
        n = n.toUpperCase();
        var t = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(),
            i = t.getScriptByPK(sp, n, "ADMIN");
        return i.getScriptText() + ""
    }
    function u(s) {
        try {
			sp=s.toUpperCase();
			gs2.log(s);
            //u && (gs2.Actions || n(), gs2.Actions.invokeActionFromEvent(u))
			n(s);
        } catch (r) {
            gs2.error("Fire action failed: " + r.message + (r.stack ? "\nStack: " + r.stack : ""))
        }
    }
    gs2.error = function (n) {
		logDebug("GS2" + " : " + n);
        //aa.debug("GS2", n)
    }
    gs2.log = function (n) {
		logDebug(n);
    }

    gs2.loadScript = t;
    gs2.load = n;
    gs2.fireAction = u;
})();
