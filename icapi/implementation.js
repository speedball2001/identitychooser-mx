var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

class IcButton {
  constructor(buttonId) {
    this.buttonId = buttonId;
    this.popupId = buttonId + "Popup";

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
        //
        // Remove default command handler
        this.orgCommand = this.domButton.getAttribute("oncommand");
        this.domButton.removeAttribute("oncommand");

        //
        // Turn the button into a menu and add the popup menu.
        this.domButton.setAttribute("type", "menu");
        this.domButton.setAttribute("wantdropmarker", "true");
        this.domButton.appendChild(window.MozXULElement.parseXULToFragment(
          `<dropmarker type="menu" class="toolbarbutton-menu-dropmarker"/>`));

        this.identityPopup = this.window.document.createXULElement("menupopup");
        console.log(this.identityPopup);
        this.identityPopup.setAttribute("id", this.popupId);
        console.log(this.identityPopup);

        this.domButton.appendChild(this.identityPopup);
      }

      this.identityPopup.addEventListener("popupshowing",
                                          () => this.onPopupShowing(),
                                          false);

      this.isAttached = true;
    }

    console.log("IcButton#attachToWindow - stop");
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
        /*identityMenuItem.addEventListener("command",
          itemCommand,
          false);*/

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
}

var composeButton = new IcButton("button-newmsg");

var icApi = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      icApi: {
        async initComposeMessageAction(windowId) {
          console.log(`icApi.initComposeMessageAction: ${windowId}`);
          let window = context.extension.windowManager.get(windowId, context).window;

          composeButton.attachToWindow(window);
        },
        async addIdentity(identity, action) {
          console.log(`icApi.addIdentiy: ${identity}, ${action}`);

          if(action == "compose") {
            composeButton.addIdentity(identity);
          }
        },
        onIdentityChosen: new ExtensionCommon.EventManager({
          context,
          name: "icApi.onIdentityChosen",
          register(fire) {
            function callback(event) {
              return fire.async(identity, action);
            }

            listener.add(callback);
            return function() {
              listener.remove(callback);
            };
          },
        }).api()
      }
    }
  }
};
