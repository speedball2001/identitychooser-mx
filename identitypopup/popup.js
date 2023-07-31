import { Options } from '../modules/options.js';
import { IcIdentities } from '../modules/identities.js';

class IdentitiesPopup
{
  constructor() {
  }

  async run(e) {
    await this.localizePage();

    let options = new Options();

    let icIdentities = new IcIdentities(options);

    let identities = await icIdentities.getIdentities();
    let identitiesList = document.getElementById("icIdentityList");

    for(const identity of identities) {
      if(identity.showInMenu) {
        console.log(identity.label);

        let li = document.createElement("li");
        let button = document.createElement("button");
        button.setAttribute("type", "button");
        button.setAttribute("data", identity.id);
        button.addEventListener("click", this.identityButtonClicked);
        button.textContent = identity.label;

        li.appendChild(button);
        identitiesList.appendChild(li);
      }
    }

    let cancelBtn = document.getElementById("cancel");
    cancelBtn.setAttribute("data", "cancel");
    cancelBtn.addEventListener("click", this.identityButtonClicked);
  }

  async identityButtonClicked(event) {
    await messenger.runtime.sendMessage({
      popupResponse: event.target.getAttribute("data")
    });

    window.close();
  }

  async localizePage() {
    console.debug("Popup#localizePage -- start");

    for (let el of document.querySelectorAll("[data-l10n-id]")) {
      let id = el.getAttribute("data-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if(i18nMessage == "") {
        i18nMessage = id;
      }
      el.textContent = i18nMessage;
    }

    for (let el of document.querySelectorAll("[data-html-l10n-id]")) {
      let id = el.getAttribute("data-html-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if(i18nMessage == "") {
        i18nMessage = id;
      }
      el.insertAdjacentHTML('afterbegin', i18nMessage);
    }

    console.debug("Popup#localizePage -- end");
  }
}

var identitiesPopup = new IdentitiesPopup();
document.addEventListener("DOMContentLoaded", (e) => identitiesPopup.run(e), {once: true});
