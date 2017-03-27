var clicked = {};

$(document).ready(function() {
 var header = $("#ctl00_m_Header");
 var path = chrome.extension.getURL("src/webcontent/newemployee_menu.html");
  $.get(path, function(data) {
    header.after(data);
    $("#menu").menu();

    $("#freiednrall").click(function() {
    if ("freiednrall" in clicked) {
      return;
    }
    clicked["freiednrall"] = true;

    $("#ctl00_main_m_EmployeeNumber").val("Bitte warten...");

    getFreeEmployeeDNRs().then(function(freeDNRs) {

     $("#ctl00_main_m_EmployeeNumber").val("");

     $(".Whitebox").append("<table id=\"freednrtable\"><tr><th>Freie Dienstnummern</th></tr></table>");

     for(var i = 0; i < freeDNRs.length; i++) {
      $("#freednrtable tr:last").after("<tr><td>" + freeDNRs[i] + "</td></tr>");
     }

    });
  });

  $("#freiednrsuggest").click(function() {
    
    $("#ctl00_main_m_EmployeeNumber").val("Bitte warten...");
    
    getFreeEmployeeDNRs().then(function(freeDNRs) {
     var suggestedDNR = freeDNRs[Math.floor(Math.random()*freeDNRs.length)];
     $("#ctl00_main_m_EmployeeNumber").val(suggestedDNR);
    });
  });


  });
  });