var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { EventEmitter } = ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");

var HTB = {};

class IcButton2 {
  constructor(action, buttonId, innerButtonId = null) {
    console.debug('IcButton2#constructor -- begin');
    console.debug(`IcButton2#constructor: ${action}, ${buttonId}`);

    this.action = action;
    this.buttonId = buttonId;
    this.innerButtonId = innerButtonId;

    this.identities = [];
    this.isAttached = false;
    this.keyCommand = null;
    this.keyOnCommand = null;
    this.eventListeners = [];

    console.debug('IcButton2#constructor -- end');
  }

  attachToWindow(window) {
    console.debug("IcButton2#attachToWindow -- begin");

    this.window = window;

    console.debug(`IcButton2#attachToWindow: find button: ${this.buttonId}`);

    var menu = HTB.hackToolbarbutton.getMenupopupElement(this.window,
                                                         this.buttonId);

    HTB.hackToolbarbutton.allowDefaultAction(this.window,
                                             this.buttonId,
                                             false,
                                             this.innerButtonId);

    if(menu) {
      menu.removeAttribute("oncommand");

      this.eventListeners["popupshowing"] = () => this.onPopupShowing();
      menu.addEventListener("popupshowing",
                            this.eventListeners["popupshowing"],
                            false);

      this.eventListeners["command"] = (event) => this.identityClicked(event);
      menu.addEventListener("command",
                            this.eventListeners["command"],
                            true);

      this.isAttached = true;

      this.onPopupShowing();
    }

    console.debug("IcButton2#attachToWindow - end");
  }

  detachFromWindow() {
    console.debug(`IcButton2#detachFromWindow: find button: ${this.buttonId}`);

    var menu = HTB.hackToolbarbutton.getMenupopupElement(this.window,
                                                         this.buttonId);

    if(menu) {
      menu.removeEventListener("popupshowing",
                               this.eventListeners["popupshowing"],
                               false);
      menu.removeEventListener("command",
                               this.eventListeners["command"],
                               true);
    }

    for (let identity of this.identities) {
      HTB.hackToolbarbutton.removeMenuitem(this.window,
                                           this.buttonId,
                                           "identitychooser-" + this.buttonId + "-" +identity.id);
    }
  }

  attachKeyToPopup(window, keyId) {
    var keyElement = window.document.getElementById(keyId);
    var menu = HTB.hackToolbarbutton.getMenupopupElement(window,
                                                         this.buttonId);
    if(keyElement && menu) {
      this.keyCommand = keyElement.getAttribute("command");
      this.keyOnCommand = keyElement.getAttribute("oncommand");
      keyElement.removeAttribute("command");
      keyElement.removeAttribute("oncommand");


      var modifiers = keyElement.getAttribute("modifiers");
      var key = keyElement.getAttribute("key");

      this.openPopupKey =
        modifiers.includes("shift") ? key.toUpperCase() : key.toLowerCase();

      this.eventListeners["keyup"] = (event) => this.keyPressed(event);
      window.addEventListener('keyup', this.eventListeners["keyup"]);
    }
  }

  detachKeyFromPopup(keyId) {
    var keyElement = this.window.document.getElementById(keyId);

    if(keyElement) {
      if(this.keyCommand) {
        keyElement.setAttribute("command", this.keyCommand);
      }

      if(this.keyOnCommand) {
        keyElement.setAttribute("oncommand", this.keyOnCommand);
      }

      if(this.eventListeners["keyup"]) {
        this.window.removeEventListener('keyup', this.eventListeners["keyup"]);
      }
    }
  }

  keyPressed(event) {
    if(event.ctrlKey && (event.key == this.openPopupKey)) {
      this.window.document.getElementById(this.buttonId).open = true;
    }
  }

  addIdentity(identity) {
    console.debug("IcButton2#addIdentity -- begin");
    console.debug("IcButton2#addIdentity: identity:", identity);

    this.identities.push(identity);

    console.debug("IcButton2#addIdentity -- end");
  }

  onPopupShowing() {
    console.debug("IcButton2#onPopupShowing -- begin");

    if(this.isAttached) {
      console.debug("IcButton2#onPopupShowing: clear popup");
      this.clearIdentityPopup();

      for (let identity of this.identities) {
        HTB.hackToolbarbutton.addMenuitem(this.window,
                                          this.buttonId,
                                          "identitychooser-" + this.buttonId + "-" +identity.id,
                                          {
                                            label: identity.label,
                                            value: "identitychooser-" + identity.id
                                          });

        console.debug("IcButton2#onPopupShowing: add identity to menu: ", identity);
      }

      HTB.hackToolbarbutton.allowDefaultAction(this.window,
                                               this.buttonId,
                                               false);
    }

    console.debug("IcButton2#onPopupShowing -- end");
  }

  clearIdentityPopup() {
    var menu = HTB.hackToolbarbutton.getMenupopupElement(this.window,
                                                         this.buttonId);

    for(let i = menu.childNodes.length - 1; i >= 0; i--) {
      let child = menu.childNodes.item(i)

      // Remove menuitems created by identitychooser (child.value
      //   starts with "identitychooser-" or
      if((child.hasAttribute("value") &&
          child.getAttribute("value").indexOf("identitychooser-") > -1)) {
        menu.removeChild(child);
      }
    }
  }

  identityClicked(event) {
    console.debug("IcButton2#identityClicked -- begin");

    event.stopPropagation();
    event.preventDefault();

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

    // value="identitychooser-id1"
    var identityId = src.value.split("-")[1];
    icEventEmitter.emit("identity-action-event",
                        identityId,
                        this.action,
                        info);

    console.debug("IcButton2#identityClicked -- end");

    return false;
  }
}

class MainToolbarForwardButton extends IcButton2 {
  constructor(action, buttonId) {
    super(action, buttonId);
  }

  attachToWindow(window) {
    console.debug("MainToolbarForwardButton#attachToWindow -- begin");

    super.attachToWindow(window);

    HTB.hackToolbarbutton.allowDefaultAction2(this.window,
                                              this.buttonId,
                                              false);

    HTB.hackToolbarbutton.hideMenuitem(this.window,
                                       this.buttonId,
                                       "button-ForwardAsInlineMenu");

    HTB.hackToolbarbutton.hideMenuitem(this.window,
                                       this.buttonId,
                                       "button-ForwardAsAttachmentMenu");
  }

  detachFromWindow() {
    console.debug("MainToolbarForwardButton#detachToWindow -- begin");

    super.detachFromWindow();

    HTB.hackToolbarbutton.allowDefaultAction2(this.window,
                                              this.buttonId,
                                              true);

    HTB.hackToolbarbutton.unhideMenuitem(this.window,
                                         this.buttonId,
                                         "button-ForwardAsInlineMenu");

    HTB.hackToolbarbutton.unhideMenuitem(this.window,
                                         this.buttonId,
                                         "button-ForwardAsAttachmentMenu");
  }
}

class ReplyAllButton extends IcButton2 {
  constructor(action, buttonId) {
    super(action, buttonId);
  }

  attachToWindow(window) {
    console.debug("ReplyAllButton#attachToWindow -- begin");

    super.attachToWindow(window);

    HTB.hackToolbarbutton.allowDefaultAction2(this.window,
                                              this.buttonId,
                                              false);

    HTB.hackToolbarbutton.hideMenuitem(this.window,
                                       this.buttonId,
                                       "hdrReplyAll_ReplyAllSubButton");

    HTB.hackToolbarbutton.hideMenuitem(this.window,
                                       this.buttonId,
                                       "hdrReplyAllSubSeparator");

    HTB.hackToolbarbutton.hideMenuitem(this.window,
                                       this.buttonId,
                                       "hdrReplySubButton");
  }

  detachFromWindow() {
    console.debug("ReplyAllButton#detachToWindow -- begin");

    super.detachFromWindow();

    HTB.hackToolbarbutton.allowDefaultAction2(this.window,
                                              this.buttonId,
                                              true);

    HTB.hackToolbarbutton.unhideMenuitem(this.window,
                                         this.buttonId,
                                         "hdrReplyAll_ReplyAllSubButton");

    HTB.hackToolbarbutton.unhideMenuitem(this.window,
                                         this.buttonId,
                                         "hdrReplyAllSubSeparator");

    HTB.hackToolbarbutton.unhideMenuitem(this.window,
                                         this.buttonId,
                                       "hdrReplySubButton");
  }
}

var icEventEmitter = new EventEmitter();
var replyButton = new IcButton2("reply", "hdrReplyButton");
var replyToSenderButton = new IcButton2("reply", "hdrReplyToSenderButton");
var replyAllButton = new ReplyAllButton("replyAll",
                                         "hdrReplyAllButton",
                                         "hdrReplyAllDropdown");
var forwardButton = new IcButton2("forward", "hdrForwardButton");

// main toolbar buttons
var composeButton = new IcButton2("compose", "button-newmsg");
var mainToolbarReplyButton = new IcButton2("reply", "button-reply");
var mainToolbarReplyAllButton = new IcButton2("replyAll", "button-replyall");
var mainToolbarForwardButton = new MainToolbarForwardButton("forward",
                                                            "button-forward");

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
    mainToolbarReplyButton.detachFromWindow();
    mainToolbarReplyAllButton.detachFromWindow();
    mainToolbarForwardButton.detachFromWindow();

    composeButton.detachKeyFromPopup("key_newMessage2");
    mainToolbarReplyButton.detachKeyFromPopup("key_reply");
    mainToolbarReplyAllButton.detachKeyFromPopup("key_replyall");
    mainToolbarForwardButton.detachKeyFromPopup("key_forward");

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

          mainToolbarReplyButton.attachToWindow(window);
          mainToolbarReplyButton.attachKeyToPopup(window, "key_reply");

          mainToolbarReplyAllButton.attachToWindow(window);
          mainToolbarReplyAllButton.attachKeyToPopup(window, "key_replyall");

          console.debug('icApi#initReplyMessageAction -- end');
        },
        async initForwardMessageAction(windowId) {
          console.debug('icApi#initForwardMessageAction -- begin');
          console.debug(`icApi.initForwardMessageAction: window id: ${windowId}`);

          let window = context.extension.windowManager.get(windowId, context).window;
          forwardButton.attachToWindow(window);

          mainToolbarForwardButton.attachToWindow(window);
          mainToolbarForwardButton.attachKeyToPopup(window, "key_forward");

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

            mainToolbarReplyButton.addIdentity(identity);
          } else if(action == "replyAll") {
            replyAllButton.addIdentity(identity);

            mainToolbarReplyAllButton.addIdentity(identity);
          } else if(action == "forward") {
            forwardButton.addIdentity(identity);

            mainToolbarForwardButton.addIdentity(identity);
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
