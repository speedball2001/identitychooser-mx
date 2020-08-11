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
    this.domButton = window.document.getElementById(this.buttonId);

    if(this.domButton) {
      //
      // Check if Button has already been converted into menu
      if(this.domButton.hasAttribute("type") &&
         this.domButton.getAttribute("type") == "menu") {
        this.identityPopup = window.document.getElementById(this.popupId);
      } else {
        this.setupButton(this.window, this.domButton);
        this.identityPopup = this.createPopupMenu(this.window, this.popupId);
        this.domButton.appendChild(this.identityPopup);
      }

      this.identityPopup.addEventListener("popupshowing",
                                          () => this.onPopupShowing(),
                                          false);

      this.isAttached = true;
    }

    console.log("IcButton#attachToWindow - stop");
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
}

class ReplyAllButton extends IcButton {
  constructor(action, buttonId, popupId) {
    super(action, buttonId, popupId);
  }

  setupButton(window, btn) {
    //
    // Remove default command handler
    btn.removeAttribute("oncommand");

    //
    // Turn the button into a menu
    btn.removeAttribute("is");
    btn.setAttribute("type", "menu");
    btn.setAttribute("wantdropmarker", "true");

    var dropMarkers =
        btn.getElementsByClassName('toolbarbutton-menubutton-dropmarker');
    while(dropMarkers.length > 0) {
      dropMarkers[0].remove();
    }

    var toolbarbuttons =
        btn.getElementsByClassName('toolbarbutton-menubutton-button');
    while(toolbarbuttons.length > 0) {
      toolbarbuttons[0].remove();
    }

    btn.appendChild(window.MozXULElement.parseXULToFragment(
      `<dropmarker type="menu" class="toolbarbutton-menu-dropmarker"/>`));

    return btn;
  }

  createPopupMenu(window, popupId) {
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
var replyAllButton = new ReplyAllButton("replyAll",
                                        "hdrReplyAllButton",
                                        "hdrReplyAllDropdown");

var icApi = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      icApi: {
        async initComposeMessageAction(windowId) {
          console.log(`icApi.initComposeMessageAction: ${windowId}`);
          let window = context.extension.windowManager.get(windowId, context).window;

          composeButton.attachToWindow(window);
        },
        async initReplyMessageAction(windowId) {
          console.log(`icApi.initReplayMessageAction: ${windowId}`);
          let window = context.extension.windowManager.get(windowId, context).window;

          replyButton.attachToWindow(window);
          replyAllButton.attachToWindow(window);
        },
        async addIdentity(identity, action) {
          console.log(`icApi.addIdentiy: ${identity}, ${action}`);

          if(action == "compose") {
            composeButton.addIdentity(identity);
          } else if(action == "reply") {
            replyButton.addIdentity(identity);
          } else if(action == "replyAll") {
            replyAllButton.addIdentity(identity);
          }
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
