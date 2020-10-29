/* eslint-disable object-shorthand */
/* taken and slightly modified from https://github.com/thundernest/addon-developer-support/tree/master/auxiliary-apis/LegacyPrefs */

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var legacyPrefsApi = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {

    const PrefTypes = {
      [Services.prefs.PREF_STRING] : "string",
      [Services.prefs.PREF_INT] : "number",
      [Services.prefs.PREF_BOOL] : "boolean",
      [Services.prefs.PREF_INVALID] : "invalid"
    };

    return {
      legacyPrefsApi: {

        // get may only return something, if a value is set
        get: async function(aName, aDefault) {
          console.debug('legacyPrefsApi#get -- begin');
          console.debug(`legacyPrefsApi#get aName: ${aName}, aDefault: ${aDefault}`);
          let prefType = Services.prefs.getPrefType(aName);
          if (prefType == Services.prefs.PREF_INVALID) {
            return null;
          }

          if (typeof aDefault != PrefTypes[prefType]) {
            throw new Error("PrefType of <" + aName + "> is <" + PrefTypes[prefType] + "> and does not match the type of its default value <" + aDefault + "> which is <" + typeof aDefault + ">!");
          }

          switch (typeof aDefault) {
          case "string":
            console.debug('legacyPrefsApi#get -- end');
            return Services.prefs.getCharPref(aName, aDefault);

          case "number":
            console.debug('legacyPrefsApi#get -- end');
            return Services.prefs.getIntPref(aName, aDefault);

          case "boolean":
            console.debug('legacyPrefsApi#get -- end');
            return Services.prefs.getBoolPref(aName, aDefault);

            default:
              throw new Error("Preference <" + aName + "> has an unsupported type <" + typeof aDefault + ">. Allowed are string, number and boolean.");
          }
        },

        clear: async function(aName) {
          Services.prefs.clearUserPref(aName);
        }

      },
    };
  }
};
