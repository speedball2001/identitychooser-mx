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
          console.debug('icForwardApi#beginForward -- begin');
          console.debug('icForwardApi#beginForward: message: ', message,
                        'forwardType: ', forwardType,
                        'details: ', details);

          let type = Ci.nsIMsgCompType.ForwardInline;
          if (forwardType == "forwardAsAttachment") {
            type = Ci.nsIMsgCompType.ForwardAsAttachment;
          }

          let format = Ci.nsIMsgCompFormat.Default;
          if(details.format == "OppositeOfDefault") {
            format = Ci.nsIMsgCompFormat.OppositeOfDefault;
          }

          if(message) {
            let msgHdr = context.extension.messageManager.get(message.id);
            let msgURI = msgHdr.folder.getUriForMsg(msgHdr);

            let identity = MailServices.accounts.allIdentities.find(
              i => i.key == details.identityId
            );

            console.debug('icForwardApi#beginForward: open compose window');
            MailServices.compose.OpenComposeWindow(null,
                                                   msgHdr,
                                                   msgURI,
                                                   type,
                                                   format,
                                                   identity,
                                                   null,
                                                   null);
          }


          console.debug('icForwardApi#beginForward -- end');
        },
      }
    }
  }
};
