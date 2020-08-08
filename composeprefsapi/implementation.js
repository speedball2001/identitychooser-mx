var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");

var composePrefsApi = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      composePrefsApi: {
        async get(identityId) {
          console.log(`composePrefsApi.get: ${identityId}`);

          return "test";
        }
      }
    }
  }
};
