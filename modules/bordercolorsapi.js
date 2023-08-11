const EXTENSION_ID = "bordercolors-d@addonsdev.mozilla.org";

export class BorderColorsApi {
  constructor() {

  }

  async getAllColors() {
    let borderColors = null;
    try {
      let resp = await browser.runtime.sendMessage(EXTENSION_ID,
                                                   {command: "colors.all"});
      if(resp) {
        borderColors = resp;
      }
    } catch(error) {
      // Border Colores not installed or otherwise available; eat the
      // exception
    }

    return borderColors;
  }
}
