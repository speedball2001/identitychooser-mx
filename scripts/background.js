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

    console.log(messageFormat);
    console.log(info.includes("Shift"));

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
    }
  }
}


var identityChooser = new IdentityChooser();
identityChooser.run();
