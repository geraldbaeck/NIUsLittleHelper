chrome.runtime.onInstalled.addListener(function (object) {
    chrome.tabs.create({url: chrome.extension.getURL("src/webcontent/welcome.html")}, function (tab) {
        console.log("Launching splash website due to event: " + object.reason);
    });
});