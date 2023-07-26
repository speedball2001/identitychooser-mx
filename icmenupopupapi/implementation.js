var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { EventEmitter } = ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");

const xulNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

class Menupopup {
  constructor() {
    this.managedMenus = [];
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
    menuPopup.addEventListener("command", (event) => this.popupClicked(event, menuId, tabId));
    popupSet.appendChild(menuPopup);

    this.addToManagedMenus(tabId, menuPopup, current3Pane);

    console.log(this.managedMenus);

    let newMsgButton = current3Pane.document.querySelector('#folderPaneWriteMessage');
    let newMsgButtonParent = newMsgButton.parentNode;

    // We register ourselves at the parent of the new message button
    // and fire during the capture phase in order to make sure to
    // "overwrite" the default click handler
    newMsgButtonParent.addEventListener("click", event => {
      console.log('newmsgparent click -- start');

      console.log(event.target == newMsgButton);
      if(event.target == newMsgButton) {
        menuPopup.openPopup(event.target, "after_start", 0, 0, true);

        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();
      }

      console.log(event);

      console.log('newmsgparent click -- end');
    }, true);

    console.log(newMsgButton);
    // console.log(top);

    return menuId;
  }


  async addMenuitem(tabId, menuId, menuitemId, label) {
    let [ menuPopup, current3Pane ]  = this.managedMenus[tabId];

    let menuItem = current3Pane.document.createElementNS(xulNS,
                                                         'menuitem');
    menuItem.id = menuitemId;
    menuItem.setAttribute('label', label);
    menuItem.setAttribute('value', menuitemId);

    menuPopup.appendChild(menuItem);
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

  async addToManagedMenus(tabId, menu, current3Pane) {
    if(tabId in this.managedMenus) {
      let menuList = this.managedMenus[tabId];
      menuList.push([ menu, current3Pane ]);

    } else {
      this.managedMenus[tabId] = [ menu, current3Pane ];
    }
  }

  popupClicked(event, menuId, tabId) {
    console.log("popupClicked");
    console.log(event);
    console.log("tabId: " + tabId);
    console.log("menuId: " + menuId);

    let src = event.target;
    let info = [];

    if(event.shiftKey) {
      info.push("Shift");
    }

    if(event.ctrlKey) {
      info.push("Ctrl");
    }

    if(event.altKey) {
      info.push("Alt");
    }

    if(event.metaKey) {
      info.push("Command");
    }

    var menuitemId = src.value;
    eventEmitter.emit("menu-command-event",
                      menuitemId,
                      menuId,
                      tabId,
                      info);

  }
}

const menuPopup = new Menupopup();
const eventEmitter = new EventEmitter();

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
        },
        async addMenuitem(tabId, menuId, menuitemId, label) {
          console.log('addMenuitem: ' + tabId + '|' + menuId);

          return menuPopup.addMenuitem(tabId, menuId, menuitemId, label);
        },
        onMenuClicked: new ExtensionCommon.EventManager({
          context,
          name: "icMenupopupApi.onMenuClicked",
          register(fire) {
            function callback(event, menuitemId, menuId, tabId, info) {
              return fire.async(menuitemId, menuId, tabId, info);
            }

            eventEmitter.on("menu-command-event", callback);
            return function() {
              eventEmitter.off("menu-command-event", callback);
            };
          },
        }).api()
      }
    }
  }
};
