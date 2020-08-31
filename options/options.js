import { Options } from '../modules/options.js';

class OptionsUI {
  constructor(options) {
    this.optionsBackend = options;
  }

  async init(event) {
    console.debug("OptionsUI#init -- begin");

    await this.localizePage();
    await this.updateUI();
    await this.setupListeners();

    new Sortable(example1, {
      animation: 150,
      ghostClass: 'blue-background-class'
    });

    console.debug("OptionsUI#init -- end");
  }

  async localizePage() {
    console.debug("OptionsUI#localizePage -- start");

    for (let el of document.querySelectorAll("[data-l10n-id]")) {
      let id = el.getAttribute("data-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if(i18nMessage == "") {
        i18nMessage = id;
      }
      el.textContent = i18nMessage;
    }

    console.debug("OptionsUI#localizePage -- end");
  }

  async updateUI() {
    console.debug("OptionsUI#updateUI -- start");

    var options = await this.optionsBackend.getAllOptions();

    for (const [optionName, optionValue] of Object.entries(options)) {
      console.debug("OptionsUI#updateUI: option: ", optionName,
                    "value: ", optionValue);

      if (optionName in this.optionsBackend.defaultOptions) {
        var optionElement = document.getElementById(optionName);

        if(optionElement.tagName == "INPUT" &&
           optionElement.type == "checkbox") {

          optionElement.checked = optionValue;
        }
      }
    }

    console.debug("OptionsUI#updateUI -- end");
  }

  async setupListeners() {
    document.addEventListener("change", (e) => this.optionChanged(e));
  }

  async optionChanged(e) {
    if(e == null) {
      return;
    }

    if(e.target.tagName == "INPUT" &&
       e.target.type == "checkbox") {
      var optionName = e.target.id;
      var optionValue = e.target.checked;

      await this.optionsBackend.storeOption({
        [optionName]: optionValue
      });
    }
  }
}


var options = new Options();
var optionsUI = new OptionsUI(options);

document.addEventListener("DOMContentLoaded", (e) => optionsUI.init(e), {once: true});
