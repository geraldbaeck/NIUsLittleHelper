/*
lädt das Kürzel des Mitarbeiters aus dem chrome storage
der Mitarbeiter kann das Kürzel über den Optionen Dialog
des Plugins einstellen
*/
function getKuerzel() {
    console.log("getKuerzel");
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.get(STORAGE_KEY_KUERZEL, function(item) {
            if (STORAGE_KEY_KUERZEL in item) {
                resolve(item[STORAGE_KEY_KUERZEL]);
            } else {
                resolve("");
            }
        });
    });
}

/*
  verwandelt eine select input feld
  in ein autocomplete feld, wenn overlay true
  wird das ganze nach dem focus aktiv als overlay angezeigt
  damit soll das frame problem umgangen werden!
*/
function makeEmployeeSearchFieldOverlay(input, overlay) {
    var names = [];
    //datenstruktur für suche erzeugen

    input.find("option").each(function(index, option) {
        var option = $(option);
        names.push(option.text());
        console.log("collecting name " + option.text());
    });

    input.after("<input id='person_autocomplete'></input>");
    $("#person_autocomplete").autocomplete({
        source: names,

    });
    //input.hide(); //zumindest solange keine Lösung für FRAMEPROBLEM!!!


    $("#person_autocomplete").on("autocompleteselect", function(event, ui) {
        console.log("aut " + ui.item.value);

        input.find("option").removeAttr("selected");
        input.find("option:contains(" + ui.item.value + ")").attr("selected", "selected");

    });
    /*
    $("#person_autocomplete").on("autocompleteopen", function(event, ui) {
        console.log("on open");
        $(this).autocomplete('widget').css('z-index', 100);
    });
    */


};

function makeEmployeeSearchField(input) {

    makeEmployeeSearchFieldOverlay(input, false);
    input.hide();

};


/*
erstellt dienste objekt für diesen MA
dnr - die dienstnummer
von - von diesem Datum (noch ohne Verwendung!)
bis - zu diesem Datum (noch ohne Verwendung!)
*/
function diensteForMa(dnr, von, bis) {
  // dienste[diensttyp][position][anzahl]
  //                             [stunden]
  if (von === undefined) {

  }
  if (bis === undefined) {

  }

  return new Promise(function(resolve, reject) {

    var dienste = {};

    dnrToIdentifier(dnr).then(function(ids) {

      $.get("https://niu.wrk.at/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=" + ids["EmployeeNumberID"], function(data){

          //TODO: statistik

          resolve(ids);
      });


    });
  });

}


/*
 * verwandelt die dienstnummer in die EmployeeId von NIU,
 * damit ist es dann möglich direkt auf die Employee Page zuzugreifen
 */
function dnrToIdentifier(dnr) {


    return new Promise(function(resolve, reject) {
        var post = {};


        $.get("https://niu.wrk.at/Kripo/external/ControlCenterHead.aspx", function(data) {
            var jData = $(data);

            var keyPostfix = jData.find("#__KeyPostfix").val();
            var eventvalidation = jData.find("#__EVENTVALIDATION").val(); //jData.find("input[name=__EVENTVALIDATION]").val();

            post["__KeyPostfix"] = keyPostfix;
            post["__EVENTVALIDATION"] = eventvalidation;
            post["__VIEWSTATE"] = "";
            post["__EVENTARGUMENT"] = "";

            post["m_txtEmployeeNumber"] = dnr;
            post["m_btSend"] = "Anfage Senden";

            $.ajax({
                url: "https://niu.wrk.at/Kripo/external/ControlCenterHead.aspx",
                data: post,
                type: "POST",

                success: function(data, status) {
                    var searchString = $(data).find("#m_lbtStatistik").attr("href");
                    var regexpr = /EmployeeNumberID=(.*)/g;
                    var foundIdent = regexpr.exec(searchString);
                    resolve(foundIdent[1]);

                }
            });
        });
    });
}


function calculateStatistic(empID, reqtype) {
    return new Promise(function(resolve, reject) {
        var post = {};
        console.log("statcalc --> start");

        $.get("https://niu.wrk.at/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=" + empID, function(data) {
            console.log("statcalc --> rcv from get EmployeeDutyStatistic.aspx" + data);
            var jData = $(data);

            var keyPostfix = jData.find("#__KeyPostfix").val();
            var eventvalidation = jData.find("#__EVENTVALIDATION").val(); //jData.find("input[name=__EVENTVALIDATION]").val();

            var reqDate = new Date();
            reqDate.setMonth(reqDate.getMonth() - 6);
            var reqDatePlus = reqDate.getMonth() + 1; // Weil im Datumsobjekt Januar = 0
            var reqDateString = reqDate.getDate() + "." + reqDatePlus + "." + reqDate.getFullYear();

            var todaysDate = new Date();
            var todaysDatePlus = todaysDate.getMonth() + 1; // Weil im Datumsobjekt Januar = 0
            var todaysDateString = todaysDate.getDate() + "." + todaysDatePlus + "." + todaysDate.getFullYear();

            console.log("statcalc request dates --> FROM: " + reqDateString + " // TO: " + todaysDateString);

            post["__KeyPostfix"] = keyPostfix;
            post["__EVENTVALIDATION"] = eventvalidation;
            post["__VIEWSTATE"] = "";
            post["__EVENTARGUMENT"] = "";
            post["__EVENTTARGET"] = "ctl00$main$m_Submit";
            post["ctl00$main$m_From$m_Textbox"] = reqDateString;
            post["ctl00$main$m_Until$m_Textbox"] = todaysDateString;
            post["&ctl00$main$m_JoinBrokenDuties"] = "on";

            $.ajax({
                url: "https://niu.wrk.at/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=" + empID,
                data: post,
                type: "POST",
                success: function(data, status) {
                    console.log("statcalc --> rcv status " + status);
                    console.log("statcalc --> rcv data " + data);

                    // Weitere Schritte fuer die Berechnung
                    // Statistikseite fuer die angeforderten Daten in der Variable 'data'

                    if(reqtype === "dienste") {} // Berechnung der Dienste
                    if(reqtype === "stunden") {} // Berechnung der Stunden

                    resolve("incomplete") //Ausgabe des Ergebnisses

                }
            });
        });
        });
    }
