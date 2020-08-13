var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");

ChromeUtils.defineModuleGetter(
  this,
  "MailServices",
  "resource:///modules/MailServices.jsm"
);

var icForwardApi = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      icForwardApi: {
        async beginForward(message, forwardType, details) {
          console.log(`icForwardApi.beginForward: ${message}, ${forwardType}, ${details}`);

          let type = Ci.nsIMsgCompType.ForwardInline;
          if (forwardType == "forwardAsAttachment") {
            type = Ci.nsIMsgCompType.ForwardAsAttachment;
          }

          let format = Ci.nsIMsgCompFormat.Default;
          if(details.format == "OppositeOfDefault") {
            format = Ci.nsIMsgCompFormat.OppositeOfDefault;
          }

          console.log(format);

          if(message) {
            let msgHdr = context.extension.messageManager.get(message.id);
            let msgURI = msgHdr.folder.getUriForMsg(msgHdr);

            let identity = MailServices.accounts.allIdentities.find(
              i => i.key == details.identityId
            );

            MailServices.compose.OpenComposeWindow(null,
                                                   msgHdr,
                                                   msgURI,
                                                   type,
                                                   format,
                                                   identity,
                                                   null,
                                                   null);
          }


          return null;
        },
      }
    }
  }
};
