/*
TODO: funktion schreiben, die eine spalte hinzufügen kann zur tabelle!
und diese dann am besten über ein callback oder Promise?
so befüllt

  id - id des divs im menü, bei on Click wird die Spalte hinzugefügt und
    für jede zeile das callback mit der dnr aufgerufen
  name - array von dict mit Maschinenname (wird für css klassen etc. verwendet)
          und Menschennamen (wird angezeigt in der ui) der spalten:
            [{calcname : "sandienststunden", uiname: "Dienststunden d. l. 6 Monate"}, ]


  callback - callback, das (dnr, name, td)
        dnr - Dienstnummer
        name - Das DictObject mit classname und Name der Spalte, aus dem names array
        td - die Tabellenzelle als jquery Object
    der Spalte die berechnet werden soll übergeben bekommt,
    der return des callback wird in die tabellenzelle geschrieben

*/
var clicked = {};
function addCalculationHandler(id, names, callback) {

  $(id).click(function() {
    if (id in clicked) { //verhindern, das eine Spalte mehrmals hinzugefügt wird
      return;
    }
    clicked[id] = true;

    var exportTable = $(".export");
    for (n in names) {
        console.log("addCalculationHandler --> names[n] " + names[n]);

        exportTable.find("tr:gt(0)").append("<td class='" + names[n].calcname + "'>Berechnen...</td>");
        exportTable.find("tr:first").append("<th>" + names[n].uiname + "</th>");

        exportTable.find("tr:gt(0)").each(function(index, element) {
          var dnr = $(element).find("td:first").text();
          var td = $(element).find("td." + names[n].calcname);
          callback(dnr, n).then(
            function (value) {
              console.log("addCalculationHandler --> promise then value:" + value);
                td.text(value);
            },
            function (error) {
                console.log("addCalculationHandler -> promise then mit error: " + error);
                td.text(error);
            });
            //hier darauf warten, dass callback fertig! um niu von zu vielen Requests zu entlasten
            //und diese hier seriell abzuarbeiten!

        });
    }


  });

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


    addCalculationHandler("#sandienststunden", [{calcname : "dienststunden", uiname : "Dienststunden d. l. 6 Monate"}], function(dnr, name) {
       //verkettete Promises...
       return dnrToIdentifier(dnr).then(
              function(result) {
                console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
                return calculateDutyStatistic(result.ENID, "");
              }).then(
                function(statresult) {
                  return statresult["hourDutyAs"]["SAN_RD"];
                }
              );
      });


      addCalculationHandler("#rddienste", [{calcname : "rddienste", uiname : "Dienste d. l. 6 Monate"}], function(dnr, name){
        return dnrToIdentifier(dnr).then(
               function(result) {
                 console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
                 return calculateDutyStatistic(result.ENID, "");
               }).then(
                 function(statresult) {
                   return statresult["countDutyAs"]["SAN_RD"];
                 }
               );
      });

  }); //close $.get(path, function(data) {

});
