// Saves options to chrome.storage


function save_options() {
  console.log("save_options called!!!");
  var save = {};

  var kuerzel = document.getElementById('kuerzel').value;
  save[STORAGE_KEY_KUERZEL] = kuerzel;

  chrome.storage.sync.set(save, function(){
    var status = document.getElementById('status');
    status.textContent = 'Einstellungen gespeichert...';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });

}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  var load = {};
  load[STORAGE_KEY_KUERZEL] = "";
  chrome.storage.sync.get(load, function(items) {
    document.getElementById('kuerzel').value = items[STORAGE_KEY_KUERZEL];
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
