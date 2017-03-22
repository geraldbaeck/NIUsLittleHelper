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
            console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);

            calculateDutyStatistic(result.ENID, "dienste").then(
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

         $("#grundkurse").click(function() {
      console.log("grundkurse gecklickt!");
      if ("grundkurse" in clicked) {
        return;
      }
      clicked["grundkurse"] = true;


      var grundkurse = {
                        kurs1 : { "Name" : "BAS - Ausbildung - Das Rote Kreuz - Auch du bist ein Teil davon! (QM)", "altName1" : "BAS - Ausbildung - Das Rote Kreuz - auch du bist ein Teil davon!", "altName2" : "", "absolved" : "?" },
                        kurs2 : { "Name" : "SAN - Ausbildung - RS Ambulanzseminar", "altName1" : "", "altName2" : "", "absolved" : "?" },
                        kurs3 : { "Name" : "BAS - Ausbildung - KHD-SD-Praxis", "altName1" : "BAS - Ausbildung - KHD-Praxistag", "altName2" : "", "absolved" : "?" }
                      };

      exportTable.find("tr:gt(0)").append("<td class='grundkurse'>Berechnen...</td>");
      exportTable.find("tr:first").append("<th>Grundkurse</th>");

      exportTable.find("tr:gt(0)").each(function(index, element) {
          var dnr = $(element).find("td:first").text();

            dnrToIdentifier(dnr).then(
            function(result) {
            console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);

            checkCourseAttendance(result.EID, grundkurse).then(
            function(resultDict) {
            $(element).find(".grundkurse").html("Das RK: " + resultDict.kurs1.absolved + "<br />AmbSem: " + resultDict.kurs2.absolved + "<br />KHD-SD: " + resultDict.kurs3.absolved);
            },
            function() {
            console.log("grundkurse --> error checkCourseAttendance");
            $(element).find(".grundkurse").text("error checkCourseAttendance");
            });
            },
            function() {
            console.log("grundkurse --> error dnrToIdentifier");
            $(element).find(".grundkurse").text("error dnrToIdentifier");
            });


      });

    });

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
            console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);

            calculateDutyStatistic(result.ENID, "stunden").then(
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
