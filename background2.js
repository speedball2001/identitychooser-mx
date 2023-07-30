class IdentityChooser {
  constructor() {
    this.activeIdentityWindows = [];
  }

  async run() {
    console.log("Identity Chooser#run");

    browser.tabs.onCreated.addListener(async (tab) => this.tabCreated(tab));
  }

  async tabCreated(tab) {
    console.log(tab);

    if(tab.type != 'messageCompose') {
      return;
    }

    let identityWindow = await browser.windows.create({
      url: "identitypopup/popup.html",
      type: "popup",
      height: 280,
      width: 390,
      allowScriptsToClose: true,
    });

    let idFocusListener = async (windowId) => this.focusChanged(windowId,
                                                                identityWindow.id);
    let idRemovedListener = async (windowId) => this.windowRemoved(windowId,
                                                                   identityWindow.id);

    this.activeIdentityWindows[identityWindow.id] = {
      identityWindowId: identityWindow.id,
      composeWindowId: tab.windowId,
      removedListener: idRemovedListener,
      focusListener: idFocusListener,
    };

    browser.windows.onFocusChanged.addListener(
      this.activeIdentityWindows[identityWindow.id].focusListener);
    browser.windows.onRemoved.addListener(
      this.activeIdentityWindows[identityWindow.id].removedListener);

    let rv = await this.popupPrompt(identityWindow.id, "cancel");
    console.log(rv);
  }

  async windowRemoved(windowId, identityWindowId) {
    let identityWindow = this.activeIdentityWindows[identityWindowId];
    let composeWindowId = identityWindow.composeWindowId;

    if(windowId == identityWindowId) {
      browser.windows.onFocusChanged.removeListener(identityWindow.focusListener);
      browser.windows.onRemoved.removeListener(identityWindow.removedListener);
    }
  }

  async focusChanged(windowId, identityWindowId) {
    let identityWindow = this.activeIdentityWindows[identityWindowId];
    let composeWindowId = identityWindow.composeWindowId;

    if(windowId == composeWindowId) {
      browser.windows.update(identityWindowId, { focused: true });
    }

    console.log("windowId: " + windowId);
    console.log("composeWindowId: " + composeWindowId);
    console.log("identityWindowId: " + identityWindowId);
  }

  async popupPrompt(popupId, defaultResponse) {
    try {
      await messenger.windows.get(popupId);
    } catch (e) {
      // Window does not exist, assume closed.
      return defaultResponse;
    }

    return new Promise(resolve => {
      let response = defaultResponse;
      function windowRemoveListener(closedId) {
	if (popupId == closedId) {
	  messenger.windows.onRemoved.removeListener(windowRemoveListener);
	  messenger.runtime.onMessage.removeListener(messageListener);
          resolve(response);
	}
      }
      function messageListener(request, sender, sendResponse) {
        if (sender.tab.windowId != popupId || !request) {
          return;
        }

        if (request.popupResponse) {
          response = request.popupResponse;
        }
      }
      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemoveListener);
    });
  }
}

async function waitForLoad() {
  let onCreate = new Promise(function(resolve, reject) {
    function listener() {
      browser.windows.onCreated.removeListener(listener);
      resolve(true);
    }
    browser.windows.onCreated.addListener(listener);
  });

  let windows = await browser.windows.getAll({windowTypes:["normal"]});
  if (windows.length > 0) {
    return false;
  } else {
    return onCreate;
  }
}

// self-executing async "main" function
(async () => {
  await waitForLoad();

  var identityChooser = new IdentityChooser();
  waitForLoad().then((isAppStartup) => identityChooser.run());
})()
