import { Options } from './modules/options.js';
import { IcIdentities } from '../modules/identities.js';

class IdentityChooser {
  constructor() {
    this.activeIdentityWindows = [];

    this.icOptions = new Options();
  }

  async run() {
    try {
      await this.icOptions.setupDefaultOptions();
    } catch (error) {
      //
      // Workaround. Several users report issues with Cardboox and
      // Identity Chooser accessing the browser.local store
      // (https://github.com/speedball2001/identitychooser-mx/issues/18:
      //
      //    20:30:33.873 TransactionInactiveError: A request was placed
      //    against a transaction which is currently not active, or which
      //    is finished. IndexedDB.jsm:101:46
      //
      // Assuming that this error is caused by a timing issue while
      // accessing the store concurrently, we simply try to circumvent this by
      // reloading ourselves

      console.debug("Caught exception while reading settings. Reloading extension.", error);
      browser.runtime.reload();
    }

    browser.tabs.onCreated.addListener(async (tab) => this.tabCreated(tab));
  }

  async tabCreated(tab) {
    if(tab.type != 'messageCompose') {
      return;
    }

    let composeDetails = await browser.compose.getComposeDetails(tab.id);

    if(composeDetails.type == "new") {
      var isEnabledComposeMessage =
          await this.icOptions.isEnabledComposeMessage();

      if(!isEnabledComposeMessage) {
        return;
      }
    }

    if(composeDetails.type == "reply") {
      var isEnabledReplyMessage =
          await this.icOptions.isEnabledReplyMessage();

      if(!isEnabledReplyMessage) {
        return;
      }
    }

    if(composeDetails.type == "forward") {
      var isEnabledForwardMessage =
          await this.icOptions.isEnabledForwardMessage();

      if(!isEnabledForwardMessage) {
        return;
      }
    }

    let composeWindow = await browser.windows.get(tab.windowId);
    const popUrl = browser.runtime.getURL("identitypopup/popup.html");
    let identityWindow = await browser.windows.create({
      url: popUrl,
      type: "popup",
      height: composeWindow.height - 200,
      width: composeWindow.width - 200,
      left: composeWindow.left + 100,
      top: composeWindow.top +100,
      allowScriptsToClose: true,
    });

    let idFocusListener = async (windowId) => this.focusChanged(windowId,
                                                                identityWindow.id);
    let idRemovedListener = async (windowId) => this.windowRemoved(windowId,
                                                                   identityWindow.id);

    let activeIdentityWindow = {
      identityWindowId: identityWindow.id,
      composeWindowId: tab.windowId,
      removedListener: idRemovedListener,
      focusListener: idFocusListener,
    };

    this.activeIdentityWindows.push(activeIdentityWindow);

    browser.windows.onFocusChanged.addListener(
      activeIdentityWindow.focusListener);
    browser.windows.onRemoved.addListener(
      activeIdentityWindow.removedListener);

    let chosenIdentity = await this.popupPrompt(identityWindow.id, null);

    if(chosenIdentity == null || chosenIdentity == "cancel") {
      browser.windows.remove(composeWindow.id);
    } else if(chosenIdentity != null) {
      browser.compose.setComposeDetails(tab.id, { identityId: chosenIdentity });
    }
  }

  async windowRemoved(windowId, identityWindowId) {
    let identityWindow = this.activeIdentityWindows.find(e => e.identityWindowId == identityWindowId);
    let composeWindowId = identityWindow.composeWindowId;

    if(windowId == identityWindowId) {
      // identity window closed
      browser.windows.onFocusChanged.removeListener(identityWindow.focusListener);
      browser.windows.onRemoved.removeListener(identityWindow.removedListener);

      let idx = this.activeIdentityWindows.findIndex(e => e.identityWindowId == identityWindowId);
      this.activeIdentityWindows.splice(idx, 1);
    }

    if(windowId == composeWindowId) {
      // composer window closed
      browser.windows.remove(identityWindowId);
    }
  }

  async focusChanged(windowId, identityWindowId) {
    let identityWindow = this.activeIdentityWindows.find(e => e.identityWindowId == identityWindowId);
    let composeWindowId = identityWindow.composeWindowId;

    if(windowId == composeWindowId) {
      browser.windows.update(identityWindowId, { focused: true });
    }
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

browser.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
  if (reason == "update" /* && previousVersion?.startsWith("3.") */) {
    browser.tabs.create({ url: "/onboarding/changes.html" });
  } else if (reason == "install") {
    browser.tabs.create({ url: "/onboarding/onboarding.html" });
  }
});

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
