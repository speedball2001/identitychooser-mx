var hackToolbarbutton = {
  
  // enable/disable the default action of the button
  allowDefaultAction(window, buttonId, allow = true) {
    let innerButton = window.document.getElementById(`${buttonId}-inner-button`);
    if (innerButton) {
      innerButton.setAttribute("allowevents", allow ? "true" : "false");
    }
  },
  
  //check if the button still contains menuitems and downgrade the button if that is not the case anymore
  cleanupIfNeeded(window, buttonId) {
    let button = window.document.getElementById(buttonId);
    if (button) {
      let popup = button.querySelector("menupopup");
      if (popup) {
        let menuitems = popup.querySelectorAll("menuitem");
        if (menuitems.length == 0) {
          popup.remove();
          button.removeAttribute("is");
          button.removeAttribute("type");
          button.removeAttribute("wantdropmarker");

          let toolbarbutton = button.querySelector("toolbarbutton");
          if (toolbarbutton) {
            toolbarbutton.remove();
          }
          let dropmarker = button.querySelector("dropmarker");
          if (dropmarker) {
            dropmarker.remove();
          }
          
          button.querySelector("label").hidden = false;
          button.querySelector("image").hidden = false;        
        }
      }
    }      
  },
  
  // returns the menupopup element of the button, 
  // check if the button needs to converted beforehand and adds the menupopup element if needed first
  getMenupopupElement(window, buttonId) {   
    let button = window.document.getElementById(buttonId);
    if (!button) 
      return null;

    if (!(button.hasAttribute("type") && button.getAttribute("type") == "menu-button")) {
      let origLabel = button.getAttribute("label");
      let origCommand = button.getAttribute("command");
      
      button.setAttribute("is", "toolbarbutton-menu-button");
      button.setAttribute("type", "menu-button");
      button.setAttribute("wantdropmarker", "true");

      button.appendChild(window.MozXULElement.parseXULToFragment(
      `<toolbarbutton
            id="${buttonId}-inner-button"
            class="box-inherit toolbarbutton-menubutton-button" 
            flex="1" 
            allowevents="true"
            command="${origCommand}"
            label="${origLabel}"/>`));    

      button.appendChild(window.MozXULElement.parseXULToFragment(
      `<dropmarker 
            type="menu-button"
            class="toolbarbutton-menubutton-dropmarker"/>`));
      
      button.querySelector("label").hidden = true;
      button.querySelector("image").hidden = true;
    } 

    // check if we need to add popup
    let popup = button.querySelector("menupopup");
    if (!popup) {
      popup = window.document.createXULElement("menupopup");
      popup.setAttribute("id", `${buttonId}-popup`);
      popup.setAttribute("oncommand", "event.stopPropagation();");
      button.appendChild(popup);
    }  
    return popup;
  },
  
  addMenuitem(window, buttonId, menuitemId, attributes = null) {
    let popup = this.getMenupopupElement(window, buttonId); 
    if (!popup)
      return null;
    
    // add menuitem
    let menuitem = window.document.createXULElement("menuitem");
    menuitem.id = menuitemId;
    if (attributes) {
      for (let [attribute, value] of Object.entries(attributes)) {
        menuitem.setAttribute(attribute, value);
      }
    }  
    popup.appendChild(menuitem);
    return popup;
  },

  removeMenuitem(window, buttonId, menuitemId) {
    let menuitem = window.document.getElementById(menuitemId);
    if (menuitem) {
      menuitem.remove();
    }
    this.cleanupIfNeeded(window, buttonId);
  },

}