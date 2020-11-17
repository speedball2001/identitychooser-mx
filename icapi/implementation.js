var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { EventEmitter } = ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");

var HTB = {};

class IcButton {
  constructor(action, buttonId, popupId) {
    console.debug('IcButton#constructor -- begin');
    console.debug(`IcButton#constructor: ${action}, ${buttonId}, ${popupId}`);

    this.action = action;
    this.buttonId = buttonId;

    if(popupId == null) {
      this.popupId = buttonId + "Popup";
    } else {
      this.popupId = popupId;
    }

    this.identities = [];
    this.isAttached = false;

    console.debug('IcButton#constructor -- end');
  }

  attachToWindow(window) {
    console.debug("IcButton#attachToWindow -- begin");

    this.window = window;

    console.debug(`IcButton#attachToWindow: find button: ${this.buttonId}`);
    this.domButton = this.findButton(this.window, this.buttonId);

    if(this.domButton) {
      console.debug("IcButton#attachToWindow: found button: ", this.domButton);
      //
      // Check if Button has already been converted into menu
      if(this.domButton.hasAttribute("type") &&
         this.domButton.getAttribute("type") == "menu") {
        console.debug("IcButton#attachToWindow: button already turned into menu");
        this.identityPopup = window.document.getElementById(this.popupId);
      } else {
        console.debug("IcButton#attachToWindow: convert button into menu");
        this.setupButton(this.window, this.domButton);

        console.debug("IcButton#attachToWindow: create popup menu");
        this.identityPopup = this.createPopupMenu(this.window, this.popupId);

        console.debug("IcButton#attachToWindow: add popup menu to button");
        this.domButton.appendChild(this.identityPopup);
      }

      console.debug("IcButton#attachToWindow: add popupshowing event listener");
      this.identityPopup.addEventListener("popupshowing",
                                          () => this.onPopupShowing(),
                                          false);

      this.isAttached = true;
    }

    console.debug("IcButton#attachToWindow - end");
  }

  detachFromWindow() {
    console.debug(`IcButton#detachFromWindow: find button: ${this.buttonId}`);

    if(this.domButton) {
      this.domButton.removeAttribute("type");
      this.domButton.setAttribute("wantdropmarker", "false");
      this.domButton.setAttribute("oncommand", this.orgOnCommandValue);
      this.domButton.removeChild(this.identityPopup);
      this.domButton.removeChild(this.domButton.querySelector('.toolbarbutton-menu-dropmarker'));
    }
  }

  findButton(window, buttonId) {
    return window.document.getElementById(buttonId);
  }

  setupButton(window, btn) {
    console.debug("IcButton#setupButton -- start");

    //
    // Remove default command handler
    console.debug("IcButton#setupButton: remove old oncommand handler");
    this.orgOnCommandValue = btn.getAttribute("oncommand");
    btn.removeAttribute("oncommand");

    //
    // Turn the button into a menu and add drop marker.
    console.debug("IcButton#setupButton: convert to menu, add dropmarker");
    btn.setAttribute("type", "menu");
    btn.setAttribute("wantdropmarker", "true");
    btn.appendChild(window.MozXULElement.parseXULToFragment(
      `<dropmarker type="menu" class="toolbarbutton-menu-dropmarker"/>`));

    console.debug("IcButton#setupButton -- end");
    return btn;
  }

  createPopupMenu(window, popupId) {
    console.debug("IcButton#createPopupMenu -- begin");

    var popup = window.document.createXULElement("menupopup");
    popup.setAttribute("id", popupId);

    console.debug("IcButton#createPopupMenu: created popup: ", popup);

    console.debug("IcButton#createPopupMenu -- end");
    return popup;
  }

  addIdentity(identity) {
    console.debug("IcButton#addIdentity -- begin");
    console.debug("IcButton#addIdentity: identity:", identity);

    this.identities.push(identity);

    console.debug("IcButton#addIdentity -- end");
  }

  onPopupShowing() {
    console.debug("IcButton#onPopupShowing -- begin");

    if(this.isAttached) {
      console.debug("IcButton#onPopupShowing: clear popup");
      this.clearIdentityPopup();

      for (let identity of this.identities) {
        var identityMenuItem = this.window.document.createXULElement("menuitem");
        identityMenuItem.setAttribute("label",
                                      identity.label);
        identityMenuItem.setAttribute("value",
                                      "identitychooser-" + identity.id);
        identityMenuItem.addEventListener("command",
                                          (event) => this.identityClicked(event),
                                          false);

        console.debug("IcButton#onPopupShowing: add identity to menu: ", identity);
        this.identityPopup.appendChild(identityMenuItem);
      }
    }

    console.debug("IcButton#onPopupShowing -- end");
  }

  clearIdentityPopup() {
    for(let i = this.identityPopup.childNodes.length - 1; i >= 0; i--) {
      let child = this.identityPopup.childNodes.item(i)

      // Remove menuitems created by identitychooser (child.value
      //   starts with "identitychooser-" or
      if((child.hasAttribute("value") &&
          child.getAttribute("value").indexOf("identitychooser-") > -1)) {
        this.identityPopup.removeChild(child);
      }
    }
  }

  identityClicked(event) {
    console.debug("IcButton#identityClicked -- begin");

    event.stopPropagation();
    event.preventDefault();

    let src = event.currentTarget;
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

    // value="identitychooser-id1"
    var identityId = src.value.split("-")[1];
    icEventEmitter.emit("identity-action-event",
                        identityId,
                        this.action,
                        info);

    console.debug("IcButton#identityClicked -- end");

    return false;
  }

  keyPressed(event) {
    if(event.ctrlKey && (event.key == this.openPopupKey.toLowerCase() ||
                         event.key == this.openPopupKey.toUpperCase())) {
      this.window.document.getElementById(this.buttonId).open = true;
    }
  }

  attachKeyToPopup(window, keyId) {
    var keyElement = window.document.getElementById(keyId);

    if(keyElement) {
      keyElement.removeAttribute("command");
      this.openPopupKey = keyElement.getAttribute("key");

      window.addEventListener('keyup', (event) => this.keyPressed(event));
    }
  }
}

class SmartReplyButton extends IcButton {
  constructor(action, buttonId, popupId) {
    super(action, buttonId, popupId);
  }

  detachFromWindow() {
    console.debug(`SmartReplyButton#detachFromWindow: find button: ${this.buttonId}`);

    if(this.domButton) {
      var smartReplyBtn = this.window.document.getElementById("hdrSmartReplyButton");
      smartReplyBtn.replaceChild(this.orgReplyBtn,
                                 this.window.document.getElementById(this.buttonId));
    }
  }

  findButton(window, buttonId) {
    console.debug("SmartReplyButton#findButton -- start");
    console.debug(`SmartReplyButton#findButton: buttonId: ${buttonId}`);

    var smartReplyBtn = window.document.getElementById("hdrSmartReplyButton");
    this.orgReplyBtn = window.document.getElementById(buttonId);
    var label = this.orgReplyBtn.getAttribute("label");
    var tooltipText = this.orgReplyBtn.getAttribute("tooltiptext");

    var newReplyBtn = window.MozXULElement.parseXULToFragment(
      `<toolbarbutton id="${buttonId}"
                      wantdropmarker="true"
                      label="${label}"
                      tooltiptext="${tooltipText}"
                      class="toolbarbutton-1 msgHeaderView-button hdrReplyButton hdrReplyAllButton"/>`);

    smartReplyBtn.replaceChild(newReplyBtn, this.orgReplyBtn);

    console.debug("SmartReplyButton#findButton -- end");
    return window.document.getElementById(buttonId);
  }

  setupButton(window, btn) {
    //
    // Turn the button into a menu
    btn.setAttribute("type", "menu");

    return btn;
  }

  createPopupMenu(window, popupId) {
    console.debug("SmartReplyButton#createPopupMenu -- start");
    console.debug(`SmartReplyButton#createPopupMenu: popupId: ${popupId}`);

    var popup = window.document.createXULElement("menupopup");
    popup.setAttribute("id", popupId);

    console.debug("SmartReplyButton#createPopupMenu -- end");
    return popup;
  }
}

var icEventEmitter = new EventEmitter();
var composeButton = new IcButton("compose", "button-newmsg");
var replyButton = new IcButton("reply", "hdrReplyButton");
var replyToSenderButton = new IcButton("reply", "hdrReplyToSenderButton");
var replyAllButton = new SmartReplyButton("replyAll",
                                          "hdrReplyAllButton",
                                          "hdrReplyAllDropdown");
var forwardButton = new IcButton("forward", "hdrForwardButton");
var icApi = class extends ExtensionCommon.ExtensionAPI {
  onStartup() {
    console.debug('icApi#onStartup');
  }
  onShutdown(isAppShutdown) {
    console.debug('icApi#onShutdown');
    if (isAppShutdown) {
      return; // the application gets unloaded anyway
    }

    console.debug('icApi#onShutdown: composeButton detachFromWindow');
    composeButton.detachFromWindow();

    console.debug('icApi#onShutdown: replyButton detachFromWindow');
    replyButton.detachFromWindow();

    console.debug('icApi#onShutdown: replyToSenderButton detachFromWindow');
    replyToSenderButton.detachFromWindow();

    console.debug('icApi#onShutdown: replyAllButton detachFromWindow');
    replyAllButton.detachFromWindow();

    console.debug('icApi#onShutdown: forwardButton detachFromWindow');
    forwardButton.detachFromWindow();

    // Unload JSMs of this add-on
    const Cu = Components.utils;
    const rootURI = this.extension.rootURI.spec;
    for (let module of Cu.loadedModules) {
      if (module.startsWith(rootURI)) {
        Cu.unload(module);
      }
    }
    // Clear caches that could prevent upgrades from working properly
    const { Services } = ChromeUtils.import(
      "resource://gre/modules/Services.jsm");
    Services.obs.notifyObservers(null, "startupcache-invalidate", null);
  }
  getAPI(context) {
    Services.scriptloader.loadSubScript(context.extension.getURL("hackToolbarbutton.js"), HTB, "UTF-8");

    return {
      icApi: {
        async initComposeMessageAction(windowId) {
          console.debug('icApi#initComposeMessageAction -- begin');
          console.debug(`icApi.initComposeMessageAction: window id: ${windowId}`);

          let window = context.extension.windowManager.get(windowId, context).window;

          composeButton.attachToWindow(window);
          composeButton.attachKeyToPopup(window, "key_newMessage2");

          console.debug('icApi#initComposeMessageAction -- end');
        },
        async initReplyMessageAction(windowId) {
          console.debug('icApi#initReplyMessageAction -- begin');
          console.debug(`icApi.initReplyMessageAction: window id: ${windowId}`);

          let window = context.extension.windowManager.get(windowId, context).window;

          replyButton.attachToWindow(window);
          replyToSenderButton.attachToWindow(window);
          replyAllButton.attachToWindow(window);

          console.debug('icApi#initReplyMessageAction -- end');
        },
        async initForwardMessageAction(windowId) {
          console.debug('icApi#initForwardMessageAction -- begin');
          console.debug(`icApi.initForwardMessageAction: window id: ${windowId}`);


          let window = context.extension.windowManager.get(windowId, context).window;

          forwardButton.attachToWindow(window);

          console.debug('icApi#initForwardMessageAction -- end');
        },

        async addIdentity(identity, action) {
          console.debug('icApi#addIdentity -- begin');
          console.debug('icApi.addIdentiy: identity: ', identity,
                        'action: ', action);

          if(action == "compose") {
            composeButton.addIdentity(identity);
          } else if(action == "reply") {
            replyButton.addIdentity(identity);
            replyToSenderButton.addIdentity(identity);
          } else if(action == "replyAll") {
            replyAllButton.addIdentity(identity);
          } else if(action == "forward") {
            forwardButton.addIdentity(identity);
          }

          console.debug('icApi#addIdentity -- end');
        },
        onIdentityChosen: new ExtensionCommon.EventManager({
          context,
          name: "icApi.onIdentityChosen",
          register(fire) {
            function callback(event, identityId, action, info) {
              return fire.async(identityId, action, info);
            }

            icEventEmitter.on("identity-action-event", callback);
            return function() {
              icEventEmitter.off("identity-action-event", callback);
            };
          },
        }).api()
      }
    }
  }
};
