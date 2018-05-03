var clicked = {};
$(document).ready(function() {
 var header = $("style");
 var path = chrome.extension.getURL("src/webcontent/spezialdienstUnterschreiben.html");
  $.get(path, function(data) {
    header.after(data);
    $("#menu").menu();
    var tdok = document.querySelectorAll('.tdok input[type="checkbox"]');
    var tddel = document.querySelectorAll('.tddel input[type="checkbox"]');
    
    $("#approveAll").click(function() {
      for(var i = 0; i<tdok.length; i++){
        tdok[i].checked = 'checked';
      }    
    });
    
    $("#denyAll").click(function() {
      for(var i = 0; i<tdok.length; i++){

        tddel[i].checked = 'checked';
      }    
    });
  });
});