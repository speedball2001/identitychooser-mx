class Options {
  async run() {
    console.log("Options#run");

    await this.localizePage();
    await this.updateUI();
    await this.setupListeners();
  }

  async localizePage() {
    console.log("Options#localizePage");
  }

  async updateUI() {
    var options = await browser.storage.local.get();

    console.log(options);

    for (const [optionName, optionValue] of Object.entries(options)) {
      console.log(`${optionName}: ${optionValue}`);

      var optionElement = document.getElementById(optionName);

      if(optionElement.tagName == "INPUT" &&
         optionElement.type == "checkbox") {

        optionElement.checked = optionValue;
      }
    }
  }

  async setupListeners() {
    console.log("Options#setupListeners");

    document.addEventListener("change", this.optionChanged);
  }

  async optionChanged(e) {
    console.log("Options#optionChanged");

    if(e == null) {
      return;
    }

    if(e.target.tagName == "INPUT" &&
       e.target.type == "checkbox") {
      var optionName = e.target.id;
      var optionValue = e.target.checked;

      console.log(optionName);
      console.log(optionValue);

      await browser.storage.local.set({
        [optionName]: optionValue
      });

      console.log("nach browser.storage.local.set");
    }
  }
}

var options = new Options();
document.addEventListener("DOMContentLoaded", (e) => options.run(e), {once: true});
