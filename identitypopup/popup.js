import { Options } from '../modules/options.js';
import { IcIdentities } from '../modules/identities.js';
import { BorderColorsApi } from '../modules/bordercolorsapi.js';

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

    let borderColorsApi = new BorderColorsApi();
    let borderColors = await borderColorsApi.getAllColors();

    let icCount = 1;
    for(const identity of identities) {
      if(identity.showInMenu) {
        let li = document.createElement("li");
        let button = document.createElement("button");
        button.setAttribute("type", "button");
        button.setAttribute("data", identity.id);
        button.addEventListener("click", this.identityButtonClicked);

        if(borderColors != null) {
          // button.classList.add("with-border-color");
          let dotEl = document.createElement("span");
          dotEl.classList.add("border-color");
          button.appendChild(dotEl);

          if(identity.id in borderColors &&
             borderColors[identity.id] !== undefined) {
            button.style.setProperty("--bullet-color", borderColors[identity.id]);
          }
        }

        let identityEl = document.createElement("span");
        identityEl.textContent = identity.label;
        button.appendChild(identityEl);

        if(icCount <= 9) {
          let counterEl = document.createElement("span");
          counterEl.classList.add("counter")
          counterEl.textContent = "[" + icCount + "]"
          button.appendChild(counterEl);
        }

        li.appendChild(button);
        identitiesList.appendChild(li);
        icCount++;
      }
    }

    let cancelBtn = document.getElementById("cancel");
    cancelBtn.setAttribute("data", "cancel");
    cancelBtn.addEventListener("click", this.identityButtonClicked);

    window.addEventListener("keyup", async (e) => {
      if(e.key === "Escape") {
        await messenger.runtime.sendMessage({
          popupResponse: "cancel"
        });

        window.close();

        return;
      }

      if(e.key <= 9) {
        let allIcBtns = document.querySelectorAll("#icIdentityList button");
        let btn = allIcBtns[e.key - 1];

        if(btn) {
          btn.click()
        }
      }
    });
  }

  async identityButtonClicked(event) {
    await messenger.runtime.sendMessage({
      popupResponse: event.target.closest("button").getAttribute("data")
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
