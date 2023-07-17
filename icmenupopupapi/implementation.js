var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");

const xulNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

class Menupopup {
  constructor() {
    this.managedMenus = {};
  }

  async createMenupopup(menuId, tabId, realTab, realTabWindow) {
    let current3Pane = realTab.chromeBrowser.contentWindow;

    let tmp = await this.ensure3PaneLoaded(current3Pane);

    // finde popup set
    let popupSet = current3Pane.document.querySelector('#folderPaneMoreContext').parentNode;

    // create menupopup and add it to popup set
    let menuPopup = current3Pane.document.createElementNS(xulNS,
                                                          'menupopup');
    menuPopup.id = menuId;
    popupSet.appendChild(menuPopup);

    this.addToManagedMenus(tabId, menuPopup);

    console.log(this.managedMenus);

    return menuId;
  }

  async ensure3PaneLoaded(current3Pane) {
    // ensure 3pane is completely loaded
    if(current3Pane.document.readyState != "complete") {
      await new Promise(resolve => {
        window.addEventListener("load", resolve, { once: true });
      });
    }

    return current3Pane;
  }

  async addToManagedMenus(tabId, menu) {
    if(tabId in this.managedMenus) {
      let menuList = this.managedMenus[tabId];
      menuList.push(menu);

    } else {
      this.managedMenus[tabId] = [ menu ];
    }
  }
}

const menuPopup = new Menupopup();

var icMenupopupApi = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      icMenupopupApi: {
        async createMenupopup(tabId, menuId) {
          console.log('createMenupopup: ' + tabId + '|' + menuId);

          let tabObject = context.extension.tabManager.get(tabId);
          let realTab = tabObject.nativeTab;
          let realTabWindow = tabObject.window;

          return menuPopup.createMenupopup(menuId, tabId, realTab, realTabWindow);
        }
      }
    }
  }
};
