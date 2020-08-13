var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var composePrefsApi = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      composePrefsApi: {
        async getMessageFormat(identityId) {
          console.log(`composePrefsApi.get: ${identityId}`);

          var prefName = `mail.identity.${identityId}.compose_html()`;
          var isHtml = Services.prefs.getBoolPref(prefName, true);

          return isHtml ? "text/html" :  "text/plain";
        },
        async getForwardType() {
          console.log(`composePrefsApi.getForwardType`);

          var forwardType = "forwardInline";

          var forwardTypePref =
              Services.prefs.getIntPref("mail.forward_message_mode", 0);

        if(forwardTypePref == 0)
          {
            forwardType = "forwardAsAttachment";
          }
        else
          {
            forwardType = "forwardInline";
          }

          return forwardType;
        },
      }
    }
  }
};
