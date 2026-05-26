export class IcIdentities {
  constructor(optionsBackend) {
    this.optionsBackend = optionsBackend;
  }

  async getIdentities() {
    console.debug("IcIdentities#getIdentities -- begin");

    var icIdentities = [];

    var identitiesProps = await this.optionsBackend.getIdentitiesExtendedProps();
    var accounts = await browser.accounts.list();

    var newIdentities = []
    for (const account of accounts) {
      for (const identity of account.identities) {
        var props = identitiesProps[identity.id];

        if(props && Object.hasOwn(props, "positionInMenu")) {
          // inserting at index props.positionInMenu may create
          // non-continious indices. We'll filter these empty indexes
          // after this for loop.
          icIdentities[props.positionInMenu] = {
            "id": identity.id,
            "showInMenu": props.showInMenu,
            "label": this.toIdentityLabel(identity),
            "identity": identity,
          }
        } else {
          newIdentities.push(
            {
            "id": identity.id,
            "showInMenu": true,
            "label": this.toIdentityLabel(identity),
            "identity": identity,
            }
          )
        }
      }
    }

    icIdentities = icIdentities.concat(newIdentities);

    icIdentities = icIdentities.filter(function (el) {
      return el != null;
    });

    console.debug("IcIdentities#getIdentities -- end", icIdentities);

    return icIdentities;
  }

  toIdentityLabel(mailIdentity) {
    let name = mailIdentity.name;
    let email = mailIdentity.email;
    let idlabel = mailIdentity.label;

    let label;
    if(name != '') {
      label = `${name} <${email}>`;
    } else {
      label = email;
    }
    if(idlabel != '') {
      label = label + " (" + idlabel + ")";
    }

    return label;
  }
}
