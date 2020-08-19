import { Options } from './modules/options.js';

class IdentityChooser {
  constructor() {

  }

  async run() {
    browser.icApi.onIdentityChosen.addListener((identityId, action, info) => this.identityChosen(identityId, action, info));

    var icOptions = await browser.storage.local.get();

    console.log(icOptions);

    browser.accounts.list().then((accounts) => {
      for (const account of accounts) {
        for (const identity of account.identities) {
          console.log(identity);
          var icIdentity = this.toIcIdentity(identity);

          if("icEnableComposeMessage" in icOptions &&
             icOptions.icEnableComposeMessage) {
            browser.icApi.addIdentity(icIdentity, "compose");
          }

          if("icEnableReplyMessage" in icOptions &&
             icOptions.icEnableReplyMessage) {
            browser.icApi.addIdentity(icIdentity, "reply");
            browser.icApi.addIdentity(icIdentity, "replyAll");
          }

          if("icEnableForwardMessage" in icOptions &&
             icOptions.icEnableForwardMessage) {
            browser.icApi.addIdentity(icIdentity, "forward");
          }
        }
      }
    });


    //
    // unitialize UI of all open windows
    browser.windows.getCurrent().then(this.initUI);

    //
    // listen to new window create events to init their UI
    browser.windows.onCreated.addListener(this.initUI);
  }

  async initUI(window) {
    if(window.type == "normal") {

      var icOptions = await browser.storage.local.get();
      if("icEnableComposeMessage" in icOptions &&
         icOptions.icEnableComposeMessage) {
        browser.icApi.initComposeMessageAction(window.id);
      }

      if("icEnableReplyMessage" in icOptions &&
         icOptions.icEnableReplyMessage) {
        browser.icApi.initReplyMessageAction(window.id);
      }

      if("icEnableForwardMessage" in icOptions &&
         icOptions.icEnableForwardMessage) {
        browser.icApi.initForwardMessageAction(window.id);
      }
    }
  }

  toIcIdentity(mailIdentity) {
    let name = mailIdentity.name;
    let email = mailIdentity.email;

    let label;
    if(name != '') {
      label = `${name} <${email}>`;
    } else {
      label = email;
    }
    return {
      "label": label,
      id: mailIdentity.id
    }
  }

  async identityChosen(identityId, action, info) {
    console.log(`IdentityChooser#background#identityChosen ${identityId}, ${action}, ${info}`)

    var messageFormat = await browser.composePrefsApi.getMessageFormat(identityId);

    if(info.includes("Shift")) {
      if(messageFormat == "text/plain") {
        messageFormat = "text/html";
      } else {
        messageFormat = "text/plain";
        }
    }

    if(action == "compose") {
      if(messageFormat == "text/plain") {
        browser.compose.beginNew({
          "identityId": identityId,
          "isPlainText" : true,
          "plainTextBody": ""
        });
      } else {
        browser.compose.beginNew({
          "identityId": identityId,
          "isPlainText" : false,
          "body": ""
        });
      }
    } else if(action == "reply") {
      var tabs = await browser.tabs.query({ active: true, currentWindow: true });
      for (let tab of tabs) {
        var msg = await browser.messageDisplay.getDisplayedMessage(tab.id);

        if(messageFormat == "text/plain") {
          browser.compose.beginReply(msg.id,
                                     "replyToSender",
                                     { "identityId": identityId,
                                       "isPlainText" : true,
                                       "plainTextBody": ""
                                     });
        } else {
          browser.compose.beginReply(msg.id,
                                     "replyToSender",
                                     { "identityId": identityId,
                                       "isPlainText" : false,
                                       "body": ""
                                     });
        }
      }
    } else if(action == "replyAll") {
      var tabs = await browser.tabs.query({ active: true, currentWindow: true });
      for (let tab of tabs) {
        var msg = await browser.messageDisplay.getDisplayedMessage(tab.id);

        if(messageFormat == "text/plain") {
          browser.compose.beginReply(msg.id,
                                     "replyToAll",
                                     { "identityId": identityId,
                                       "isPlainText" : true,
                                       "plainTextBody": ""
                                     });
        } else {
          browser.compose.beginReply(msg.id,
                                     "replyToAll",
                                     { "identityId": identityId,
                                       "isPlainText" : false,
                                       "body": ""
                                     });
        }
      }
    } else if(action == "forward") {
      var forwardType = await browser.composePrefsApi.getForwardType();

      var tabs = await browser.tabs.query({ active: true, currentWindow: true });
      for (let tab of tabs) {
        var msg = await browser.messageDisplay.getDisplayedMessage(tab.id);
        var window = await browser.windows.getCurrent();

        if(!info.includes("Shift")) {
          browser.icForwardApi.beginForward(msg,
                                            forwardType,
                                            { "identityId": identityId,
                                              "format" : "Default"
                                            });
        } else {
          browser.icForwardApi.beginForward(msg,
                                            forwardType,
                                            { "identityId": identityId,
                                              "format" : "OppositeOfDefault",
                                              "body": ""
                                            });
        }
      }
    }
  }
}


var identityChooser = new IdentityChooser();
identityChooser.run();
