class IdentityChooser {
  constructor() {

  }

  run() {

    browser.icApi.onIdentityChosen.addListener((identityId, action, info) => this.identityChosen(identityId, action, info));

    browser.accounts.list().then((accounts) => {
      for (const account of accounts) {
        for (const identity of account.identities) {
          console.log(identity);
          var icIdentity = this.toIcIdentity(identity);

          browser.icApi.addIdentity(icIdentity, "compose");
          browser.icApi.addIdentity(icIdentity, "reply");
          browser.icApi.addIdentity(icIdentity, "replyAll");
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

  initUI(window) {
    if(window.type == "normal") {
      browser.icApi.initComposeMessageAction(window.id);
      browser.icApi.initReplyMessageAction(window.id);
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
    }
  }
}


var identityChooser = new IdentityChooser();
identityChooser.run();
