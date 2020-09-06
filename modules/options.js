export class Options {
  constructor() {
    this.defaultOptions = {
      icEnableComposeMessage: true,
      icEnableReplyMessage: true,
      icEnableForwardMessage: true
    };

    this.tb68MigratablePrefs = {
      "extensions.org.janek.IdentityChooser.extendButtonNewmsg": "icEnableComposeMessage",
      "extensions.org.janek.IdentityChooser.extendButtonForward": "icEnableForwardMessage",
      "extensions.org.janek.IdentityChooser.extendButtonReply": "icEnableReplyMessage"
    }
  }

  async setupDefaultOptions() {
    console.debug("Option#setupDefaultOptions -- begin");

    var icOptions = await browser.storage.local.get();
    console.debug('Option#setupDefaultOptions: locally stored option:',  icOptions);

    if(Object.entries(icOptions).length == 0) {
      console.debug('Option#setupDefaultOptions: not stored options -> migrate TB68 prefs to local storage');
      icOptions = await this.migrateFromTB68Prefs();

      console.debug('Option#setupDefaultOptions: found TB68 prefs', icOptions);
    }

    for(const [optionName, defaultValue] of Object.entries(this.defaultOptions)) {
      if(!(optionName in icOptions)) {
        browser.storage.local.set({ [optionName] : defaultValue});
      }
    }

    console.debug("Options#setupDefaultOptions: set extended properties");
    var identitiesProps = {};
    if('identitiesExtendedProps' in icOptions) {
      identitiesProps = icOptions['identitiesExtendedProps'];
    }

    var newIdentities = {};
    var nextPositionInMenu = Object.entries(identitiesProps).length;
    var accounts = await browser.accounts.list();
    for (const account of accounts) {
      for (const identity of account.identities) {
        if(!(identity.id in identitiesProps)) {
          newIdentities[identity.id] = {
            'showInMenu': true,
            'positionInMenu': nextPositionInMenu++
          };
        }
      }
    }


    if(Object.entries(newIdentities).length > 0) {
      console.debug("Options#setupDefaultOptions: found new identities",
                    newIdentities);
      var identitiesProps = {...identitiesProps, ...newIdentities};
      await browser.storage.local.set(
        { 'identitiesExtendedProps' : identitiesProps});

      console.debug("Options#setupDefaultOptions: stored extended properties",
                    identitiesProps);
    }

    console.debug("Option#setupDefaultOptions -- end");
  }

  async migrateFromTB68Prefs() {
    console.debug("Options#migrateFromTB68Prefs -- begin");

    var ret = {}
    for(const [legacyPrefName, optionName] of Object.entries(this.tb68MigratablePrefs)) {
      var legacyPrefValue =
          await browser.legacyPrefsApi.get(legacyPrefName,
                                           this.defaultOptions[optionName]);

      if(legacyPrefValue != null) {
        ret[optionName] = legacyPrefValue;
        browser.storage.local.set({ [optionName] : legacyPrefValue });
      }
    }

    console.debug("Options#migrateFromTB68Prefs -- end");
    return ret;
  }

  async isEnabledComposeMessage() {
    return this.isEnabledOption("icEnableComposeMessage", true);
  }

  async isEnabledReplyMessage() {
    return this.isEnabledOption("icEnableReplyMessage", true);
  }

  async isEnabledForwardMessage() {
    return this.isEnabledOption("icEnableForwardMessage", true);
  }

  async isEnabledOption(option, defaultValue) {
    var icOptions = await browser.storage.local.get();

    var ret = defaultValue;
    if(option in icOptions) {
      ret = icOptions[option];
    }

    return ret;
  }

  async getAllOptions() {
    return browser.storage.local.get();
  }

  async storeOption(o) {
    return browser.storage.local.set(o);
  }

  async getIdentitiesExtendedProps() {
    var props = await browser.storage.local.get('identitiesExtendedProps');

    return props['identitiesExtendedProps'];
  }

  async storeIdentitiesExtendedProps(props) {
    return browser.storage.local.set({identitiesExtendedProps: props});
  }
}
