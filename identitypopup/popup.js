import { Options } from '../modules/options.js';
import { IcIdentities } from '../modules/identities.js';

class IdentitiesPopup
{
  constructor() {
  }

  async run(e) {
    console.log("run");

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
        button.innerHTML = identity.label;

        li.appendChild(button);
        identitiesList.appendChild(li);
      }
    }
  }

  async identityButtonClicked(event) {
    await messenger.runtime.sendMessage({
      popupResponse: event.target.getAttribute("data")
    });

    window.close();
  }
}

var identitiesPopup = new IdentitiesPopup();
document.addEventListener("DOMContentLoaded", (e) => identitiesPopup.run(e), {once: true});
