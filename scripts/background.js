class IdentityChooser {
  constructor() {

  }

  run() {

    browser.icApi.onIdentityChosen.addListener((identityId, action) => this.identityChosen(identityId, action));

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

  identityChosen(identityId, action) {
    console.log(`IdentityChooser#background#identityChosen ${identityId}, ${action}`)

    if(action == "compose") {
      browser.compose.beginNew({
        "identityId": identityId
      });
    }
  }
}


var identityChooser = new IdentityChooser();
identityChooser.run();
