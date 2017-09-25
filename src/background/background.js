chrome.runtime.onInstalled.addListener(function (object) {
   var thisVersion = chrome.runtime.getManifest().version;
   const regex = /[0-9].[0-9][0-9].[0-9]*/g;
   console.log("--> Testing if version " + thisVersion + " is a full update/new install.")

   if(!regex.test(thisVersion) && object.reason === "update")
   {
       console.log("--> " + thisVersion + " is a full update.")
       chrome.tabs.create({url: chrome.extension.getURL("src/webcontent/welcome-update.html")}, function (tab) { console.log("--> Launching splash website due to event: " + object.reason); });
  }
  else if (object.reason === "install") {
    console.log("--> " + thisVersion + " was just installed.");
    chrome.tabs.create({url: chrome.extension.getURL("src/webcontent/welcome-install.html")}, function (tab) { console.log("--> Launching splash website due to event: " + object.reason); });
  }
  else {
    console.log("--> " + thisVersion + " is not a full update/new install - not showing splash screen.");
  }
});

const filesInDirectory = dir => new Promise (resolve =>

    dir.createReader ().readEntries (entries =>

        Promise.all (entries.filter (e => e.name[0] !== '.').map (e =>

            e.isDirectory
                ? filesInDirectory (e)
                : new Promise (resolve => e.file (resolve))
        ))
        .then (files => [].concat (...files))
        .then (resolve)
    )
)

const timestampForFilesInDirectory = dir =>
        filesInDirectory (dir).then (files =>
            files.map (f => f.name + f.lastModifiedDate).join ())

const reload = () => {

    chrome.tabs.query ({ active: true, currentWindow: true }, tabs => {

        if (tabs[0]) { chrome.tabs.reload (tabs[0].id) }

        chrome.runtime.reload ()
    })
}

const watchChanges = (dir, lastTimestamp) => {

    timestampForFilesInDirectory (dir).then (timestamp => {

        if (!lastTimestamp || (lastTimestamp === timestamp)) {

            setTimeout (() => watchChanges (dir, timestamp), 1000) // retry after 1s

        } else {

            reload ()
        }
    })

}

chrome.management.getSelf (self => {

    if (self.installType === 'development') {

        chrome.runtime.getPackageDirectoryEntry (dir => watchChanges (dir))
    }
})
