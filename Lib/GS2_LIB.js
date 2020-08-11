(function () {
    function n() {
		gs2.log("START GCOM Global Libraries");
        eval(t("GS2_ASYNC"));
		eval(t("GS2_COMMON"));
        eval(t("GS2_DOC"));
        eval(t("GS2_FINANCE"));
		eval(t("GS2_INSPECTION"));
		eval(t("GS2_LP"));
		eval(t("GS2_NOTIFICATION"));
        eval(t("GS2_RECORD"));
		eval(t("GS2_UTIL"));
		eval(t("GS2_WORKFLOW"));
		gs2.log("END GCOM Global Libraries");
    }

    function t(n) {
        try {
            n = n.toUpperCase();
            var t = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(),
                i = t.getScriptByPK(aa.getServiceProviderCode(), n, "ADMIN");
            return i.getScriptText() + ""
        } catch (r) {
            gs2.error("init failed - " + n + ": " + r.message + (r.stack ? "\nStack: " + r.stack : ""))
        }
    }
    function u() {
        try {
			n();
        } catch (r) {
            gs2.error("init action failed: " + r.message + (r.stack ? "\nStack: " + r.stack : ""))
        }
    }
    gs2.init = u;
})();
