/*
TODO: funktion schreiben, die eine spalte hinzufügen kann zur tabelle!
und diese dann am besten über ein callback oder Promise?
so befüllt
*/
function addColumn() {

}


//TODO: die gesamte Tabelle irgendwie sortierbar machen
/*
  eventuell mit plugin wie
  dynatable https://www.dynatable.com/#event-hooks
  tablesorter http://tablesorter.com/docs/
  
*/

$(document).ready(function() {

  var exportTable = $(".export");

//#ctl00_main_m_Panel > table > tbody > tr:nth-child(2) > td > table
  //exportTable.hide();

  var header = $("#ctl00_m_Header");

  var clicked = {};

  /*
    lade das Menü, mit den möglichen Berechnungen
    es wäre unklug gleich alle Berechnungen zu machen -> zu viele
    Requests und nicht jeder MA braucht alle Berechnungen
    TODO:
  */
  var path = chrome.extension.getURL("src/webcontent/employee_dump_menu.html");
  console.log("path: " + path);
  $.get(path, function(data) {

    header.after(data);
    //data.menu();
    $("#menu").menu();


    $("#rddienste").click(function() {
      console.log("rddienste gecklickt!");
      if ("rddienste" in clicked) {
        return;
      }
      clicked["rddienste"] = true;


      exportTable.find("tr:gt(0)").append("<td class='rddienste'>Berechnen...</td>");
      exportTable.find("tr:first").append("<th>RD Dienste d. l. 6 Monate</th>");

      exportTable.find("tr:gt(0)").each(function(index, element) {
          var dnr = $(element).find("td:first").text();


            dnrToIdentifier(dnr).then(
            function(result) {
            console.log("dnrToIdentifier result: " + result);

            calculateDutyStatistic(result, "dienste").then(
            function(statresult) {
            $(element).find(".rddienste").text(statresult['countDienste'] + " Dienste mit " + statresult['sumDuty'] + " Stunden");
            },
            function() {
            console.log("calculateStatistic --> error");
            $(element).find(".rddienste").text("statcalc error");
            });
            },
            function() {
            console.log("error");
            $(element).find(".rddienste").text("dnrToIdentifier error");
            });



      });

    });

    //$("#rddienste").trigger("click");


    $("#sandienststunden").click(function() {
      console.log("sandienststunden gecklickt");
      if ("sandienststunden" in clicked) {
        return;
      }
      clicked["sandienststunden"] = true;

      exportTable.find("tr:gt(0)").append("<td class='dienststunden'>Berechnen...</td>");
      exportTable.find("tr:first").append("<th>Dienststunden d. l. 6 Monate</th>");

         exportTable.find("tr:gt(0)").each(function(index, element) {
          var dnr = $(element).find("td:first").text();

            dnrToIdentifier(dnr).then(
            function(result) {
            console.log("dnrToIdentifier result: " + result);

            calculateDutyStatistic(result, "stunden").then(
            function(statresult) {
            $(element).find(".dienststunden").text(statresult['sumDuty']);
            },
            function() {
            console.log("calculateStatistic --> error");
            $(element).find(".dienststunden").text("statcalc error");
            });
            },
            function() {
            console.log("error");
            $(element).find(".dienststunden").text("dnrToIdentifier error");
            });


      });


    });
  });

});
