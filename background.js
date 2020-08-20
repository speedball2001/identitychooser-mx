import { Options } from './modules/options.js';

class IdentityChooser {
  constructor() {
    this.icOptions = new Options();
  }

  async run() {
    await this.icOptions.setupDefaultOptions();

    browser.icApi.onIdentityChosen.addListener((identityId, action, info) => this.identityChosen(identityId, action, info));

    var accounts = await browser.accounts.list();
    for (const account of accounts) {
      for (const identity of account.identities) {
        console.log(identity);
        var icIdentity = this.toIcIdentity(identity);

        var isEnabledComposeMessage =
            await this.icOptions.isEnabledComposeMessage();
        if(isEnabledComposeMessage) {
          browser.icApi.addIdentity(icIdentity, "compose");
        }

        var isEnabledReplyMessage =
            await this.icOptions.isEnabledReplyMessage();
        if(isEnabledReplyMessage) {
          browser.icApi.addIdentity(icIdentity, "reply");
          browser.icApi.addIdentity(icIdentity, "replyAll");
        }

        var isEnabledForwardMessage =
            await this.icOptions.isEnabledForwardMessage();
        if(isEnabledForwardMessage) {
          browser.icApi.addIdentity(icIdentity, "forward");
        }
      }
    }

    //
    // unitialize UI of all open windows
    browser.windows.getCurrent().then((window) => this.initUI(window));

    //
    // listen to new window create events to init their UI
    browser.windows.onCreated.addListener((window) => this.initUI(window));
  }

  async initUI(window) {
    if(window.type == "normal") {

      var isEnabledComposeMessage =
          await this.icOptions.isEnabledComposeMessage();
      if(isEnabledComposeMessage) {
        browser.icApi.initComposeMessageAction(window.id);
      }

      var isEnabledReplyMessage =
          await this.icOptions.isEnabledReplyMessage();
      if(isEnabledReplyMessage) {
        browser.icApi.initReplyMessageAction(window.id);
      }

      var isEnabledForwardMessage =
          await this.icOptions.isEnabledForwardMessage();
      if(isEnabledForwardMessage) {
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
