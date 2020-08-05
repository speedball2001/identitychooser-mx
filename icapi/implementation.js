var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

class IcButton {
  constructor(buttonId) {
    this.buttonId = buttonId;
    this.popupId = buttonId + "Popup";
  }

  attachToWindow(window) {
    this.window = window;

    console.log("IcButton#attachToWindow");
    this.domButton = window.document.getElementById(this.buttonId);
    console.log(this.domButton);

    if(this.domButton) {
      // Remove default command handler
      this.orgCommand = this.domButton.getAttribute("oncommand");
      this.domButton.removeAttribute("oncommand");

      // Turn the button into a menu and add the popup menu.
      this.domButton.setAttribute("type", "menu");
      this.domButton.setAttribute("wantdropmarker", "true");
      this.domButton.appendChild(window.MozXULElement.parseXULToFragment(
        `<dropmarker type="menu" class="toolbarbutton-menu-dropmarker"/>`));

      if(!this.identityPopup) {
        this.identityPopup = this.window.document.createXULElement("menupopup");
        console.log(this.identityPopup);
        this.identityPopup.setAttribute("id", this.popupId);
        console.log(this.identityPopup);

        this.domButton.appendChild(this.identityPopup);
      }

      this.identityPopup.addEventListener("popupshowing",
                                          this.onPopupShowing,
                                          false);
    }
  }

  addIdentity(identity) {
    console.log("IcButton#addIdentity");

    var identityMenuItem = this.window.document.createXULElement("menuitem");
    identityMenuItem.setAttribute(
      "label",
      identity);
    identityMenuItem.setAttribute("value",
                                  "identitychooser-1" /* + identity.key */);
    /*identityMenuItem.addEventListener("command",
                                      itemCommand,
                                      false);*/

    console.log(identityMenuItem);
    this.identityPopup.appendChild(identityMenuItem);

    console.log
  }

  onPopupShowing() {
    console.log("XXXXXX");
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

          composeButton.addIdentity(identity);
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
