var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { EventEmitter } = ChromeUtils.import("resource://gre/modules/EventEmitter.jsm");


class IcButton {
  constructor(action, buttonId, popupId) {
    console.log(`IcButton#constructor: ${action}, ${buttonId}, ${popupId}`);

    this.action = action;
    this.buttonId = buttonId;

    if(popupId == null) {
      this.popupId = buttonId + "Popup";
    } else {
      this.popupId = popupId;
    }

    this.identities = [];
    this.isAttached = false;
  }

  attachToWindow(window) {
    console.log("IcButton#attachToWindow - start");

    this.window = window;
    this.domButton = this.findButton(this.window, this.buttonId);

    if(this.domButton) {
      //
      // Check if Button has already been converted into menu
      if(this.domButton.hasAttribute("type") &&
         this.domButton.getAttribute("type") == "menu") {
        this.identityPopup = window.document.getElementById(this.popupId);
      } else {
        this.setupButton(this.window, this.domButton);
        console.log("after this.setupButton");
        this.identityPopup = this.createPopupMenu(this.window, this.popupId);
        console.log("after this.createPopupMenu");
        this.domButton.appendChild(this.identityPopup);
        console.log("after domButton.appendChild");
      }

      this.identityPopup.addEventListener("popupshowing",
                                          () => this.onPopupShowing(),
                                          false);

      this.isAttached = true;
    }

    console.log("IcButton#attachToWindow - stop");
  }

  findButton(window, buttonId) {
    console.log("IcButton#findButton");
    return window.document.getElementById(buttonId);
  }

  setupButton(window, btn) {
    //
    // Remove default command handler
    btn.removeAttribute("oncommand");

    //
    // Turn the button into a menu and add the popup menu.
    btn.setAttribute("type", "menu");
    btn.setAttribute("wantdropmarker", "true");
    btn.appendChild(window.MozXULElement.parseXULToFragment(
      `<dropmarker type="menu" class="toolbarbutton-menu-dropmarker"/>`));

    return btn;
  }

  createPopupMenu(window, popupId) {
    console.log(`IcButton#createPopupMenu: ${window}, ${popupId}`);
    var popup = window.document.createXULElement("menupopup");
    console.log(popup);
    popup.setAttribute("id", popupId);
    console.log(popup);

    return popup;
  }

  addIdentity(identity) {
    console.log(`IcButton#addIdentity: ${identity.label}, ${identity.id}`);

    this.identities.push(identity);
  }

  onPopupShowing() {
    console.log("IcButton#onPopupShowing");
    console.log(this.isAttached);

    if(this.isAttached) {
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

        console.log(identityMenuItem);
        this.identityPopup.appendChild(identityMenuItem);
      }
    }
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
    console.log("IcButton#identityClicked - start");

    event.stopPropagation();
    event.preventDefault();

    console.log(event);
    console.log(event.currentTarget);

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

    console.log("IcButton#identityClicked - stop");

    return false;
  }

  keyPressed(event) {
    console.log(`IcButton#keyPressed: ${event.key}`);

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

      console.log(`IcButton#attachKeyToPopup: ${this.openPopupKey}`);
      window.addEventListener('keyup', (event) => this.keyPressed(event));
    }
  }
}

class SmartReplyButton extends IcButton {
  constructor(action, buttonId, popupId) {
    super(action, buttonId, popupId);
  }

  findButton(window, buttonId) {
    console.log("SmartReplyButton#findButton");
    var smartReplyBtn = window.document.getElementById("hdrSmartReplyButton");
    var orgReplyBtn = window.document.getElementById(buttonId);
    var label = orgReplyBtn.getAttribute("label");
    var tooltipText = orgReplyBtn.getAttribute("tooltiptext");

    console.log(`SmartReplyButton#findButton: ${label}, ${tooltipText}`);

    var newReplyBtn = window.MozXULElement.parseXULToFragment(
      `<toolbarbutton id="${buttonId}"
                      wantdropmarker="true"
                      label="${label}"
                      tooltiptext="${tooltipText}"
                      class="toolbarbutton-1 msgHeaderView-button hdrReplyButton hdrReplyAllButton"/>`);

    console.log(newReplyBtn);

    smartReplyBtn.replaceChild(newReplyBtn, orgReplyBtn);

    return window.document.getElementById(buttonId);
  }

  setupButton(window, btn) {
    //
    // Turn the button into a menu
    btn.setAttribute("type", "menu");

    return btn;
  }

  createPopupMenu(window, popupId) {
    console.log(`SmartReplyButton#createPopupMenu: ${window}, ${popupId}`);

    var popup = window.document.createXULElement("menupopup");
    console.log(popup);
    popup.setAttribute("id", popupId);
    console.log(popup);

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
  getAPI(context) {
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
          console.log('icApi.addIdentiy: identity: ', identity, 'action: ', action);

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
