// Saves options to chrome.storage


function save_options() {
  console.log("save_options called!!!");
  var save = {};

  var kuerzel = document.getElementById('kuerzel').value;
  save[STORAGE_KEY_KUERZEL] = kuerzel;
  save[STORAGE_KEY_SEARCH_COURSE_ALWAYS_SEARCH] = document.getElementById('STORAGE_KEY_SEARCH_COURSE_ALWAYS_SEARCH').checked;
  save[STORAGE_KEY_CACHE_ACTIVE] = document.getElementById('STORAGE_KEY_CACHE_ACTIVE').checked;
  save[STORAGE_KEY_DF_EXP] = document.getElementById('STORAGE_KEY_DF_EXP').checked;
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
  load[STORAGE_KEY_SEARCH_COURSE_ALWAYS_SEARCH] = DEFAULT_SEARCH_COURSE_ALWAYS_SEARCH;
  load[STORAGE_KEY_CACHE_ACTIVE] = DEFAULT_CACHE_ACTIVE;
  load[STORAGE_KEY_DF_EXP] = DEFAULT_DF_EXP;

  chrome.storage.sync.get(load, function(items) {
    document.getElementById('kuerzel').value = items[STORAGE_KEY_KUERZEL];
    document.getElementById('STORAGE_KEY_SEARCH_COURSE_ALWAYS_SEARCH').checked = items[STORAGE_KEY_SEARCH_COURSE_ALWAYS_SEARCH];
    document.getElementById('STORAGE_KEY_CACHE_ACTIVE').checked = items[STORAGE_KEY_CACHE_ACTIVE];
    document.getElementById('STORAGE_KEY_DF_EXP').checked = items[STORAGE_KEY_DF_EXP];
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
