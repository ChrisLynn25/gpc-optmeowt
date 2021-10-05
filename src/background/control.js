/*
Licensed per https://github.com/privacy-tech-lab/gpc-optmeowt/blob/main/LICENSE.md
privacy-tech-lab, https://www.privacytechlab.org/
*/



/*
control.js
================================================================================
control.js manages persistent data, message liseteners, in particular
to manage the state & functionality mode of the extension
*/


import { init as initProtection, halt as haltProtection, halt } from "./protection/protection.js";
import { init as initAnalysis, halt as haltAnalysis } from "./analysis/analysis.js";

// import { background as analysis } from "./analysis/background";
// import { background as protection } from "./protection/background";

import { modes } from "../data/modes.js";
import { defaultSettings } from "../data/defaultSettings.js";
import { stores, storage } from "./storage.js";

var mode = defaultSettings.MODE;
var isEnabled = defaultSettings.IS_ENABLED;
var isDomainlisted = defaultSettings.IS_DOMAINLISTED;


function enable() {
  switch (mode) {
    case modes.analysis:
      initAnalysis();
      console.log(`Initializing Analysis mode. `);
      break;
    case modes.protection:
			initProtection();
			console.log(`Initializing Protection mode. `);
			break;
		default:
			console.error(`Failed to enable() OptMeowt. `);
	}
}

function disable() {
  // analysis.halt();
  // protection.halt();
  haltAnalysis();
  haltProtection();
}


/******************************************************************************/

// Initializers


// Default settings init
(async () => {
  let settingsDB = await storage.getStore(stores.settings);
  for (let setting in defaultSettings) {
    if (!settingsDB[setting]) {
      await storage.set(stores.settings, defaultSettings[setting], setting);
    }
  }

  // Mode init
  if (isEnabled) {
    enable();
  }
})();


/******************************************************************************/

// Mode listeners


// (1) Handle extension activeness is changed by calling all halt
// 	 - Make sure that I switch extensionmode and separate it from mode.domainlist
// (2) Handle extension functionality with listeners and message passing

/**
 * Listeners for information from --POPUP-- or --OPTIONS-- page
 * This is the main "hub" for message passing between the extension components
 * https://developer.chrome.com/docs/extensions/mv3/messaging/
 */
 chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
	// console.log(`Recieved message @ background page.`);
  if (message.msg === "CHANGE_MODE") {
    isEnabled = message.data.isEnabled;           // can be undefined
    // mode = message.data.mode;
    // console.log("CHANGE_MODE: mode = ", mode);

    if (isEnabled) {
      await storage.set(stores.settings, true, "IS_ENABLED");
      enable();
    } else {
      await storage.set(stores.settings, false, "IS_ENABLED");
      disable();
    }
  }
  if (message.msg === "CHANGE_IS_DOMAINLISTED") {
    isDomainlisted = message.data.isDomainlisted; // can be undefined
  }
});

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function (message) {
    if (message.msg === "REQUEST_MODE") {
      port.postMessage({ msg: "RESPONSE_MODE", data: mode })
    }
  })
})