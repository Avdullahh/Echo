console.log("Echo Background Engine: Initialized");

// Example listener 
chrome.runtime.onInstalled.addListener(() => {
  console.log("Echo Extension Installed Successfully");
});