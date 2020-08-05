browser.windows.getCurrent().then(function(w) {
  browser.icApi.initComposeMessageAction(w.id);

  browser.accounts.list().then(function(accounts) {
    for (const account of accounts) {
      for (const identity of account.identities) {
        console.log(identity);

        browser.icApi.addIdentity(identity.email, "compose");
      }
    }
  });
});



browser.windows.onCreated.addListener(function(w) {
  browser.icApi.initComposeMessageAction(w.id);

  browser.accounts.list().then(function(accounts) {
    for (const account of accounts) {
      for (const identity of account.identities) {
        console.log(identity);

        browser.icApi.addIdentity(identity.email, "compose");
      }
    }
  });

});
