$(document).ready(function() {
  console.log("Spezialdienst Unterschreiben.");

  var tdok = document.querySelectorAll('.tdok input[type="checkbox"]');
  var tddel = document.querySelectorAll('.tddel input[type="checkbox"]');
  
  function approveALL(e) {
    e.preventDefault();
    console.log("approve all clicked");
    for(var i = 0; i<tdok.length; i++) {
      tdok[i].checked = 'checked';
    }    
  }

  var button = document.createElement('button');
  button.className = "everyone";
  button.onclick = approveALL;
  $("th.th:contains(OK)").html(button);
  $(".everyone").text("OK");
});
