$(document).ready(function() {
  console.log('hi dashboard');
  chrome.storage.sync.get('NIUDienste', function(dienste) {
    console.log('Settings retrieved', dienste);
  });
});
