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
            console.log("rcv from get ControlCenterHead.aspx" + data);
            var jData = $(data);

            var keyPostfix = jData.find("#__KeyPostfix").val();
            var eventvalidation = jData.find("#__EVENTVALIDATION").val(); //jData.find("input[name=__EVENTVALIDATION]").val();

            post["__KeyPostfix"] = keyPostfix;
            post["__EVENTVALIDATION"] = eventvalidation;
            post["__VIEWSTATE"] = "";
            post["__EVENTARGUMENT"] = "";

            post["m_txtEmployeeNumber"] = dnr;
            post["m_btSend"] = "Anfage Senden";

            console.log("show post " + post["__EVENTVALIDATION"]);


            $.ajax({
                url: "https://niu.wrk.at/Kripo/external/ControlCenterHead.aspx",
                data: post,
                type: "POST",
                // PROBLEM hier bekomme ich einfach nicht den link auf die seiten zurück? möglich wg. falschen referer?
                //                headers: {
                //                    'Origin': "https://niu.wrk.at",
                //                    'Referer': "https://niu.wrk.at/Kripo/external/ControlCenterHead.aspx"
                //                },
                success: function(data, status) {
                    console.log("rcv status " + status);
                    console.log("rcv data " + data);

                    var response = $(data);

                    var ids = {};

                    var href = response.find("#m_lbtStatistik").attr("href");
                    //console.log("found href: " + href);
                    href = href.split("?")[1];
                    //console.log("employe key: " + href);
                    href = href.split("=");
                    ids[href[0]] = href[1];

                    href = response.find("#m_lbtLVStatistik").attr("href");
                    href = href.split("?")[1];
                    href = href.split("=");
                    ids[href[0]] = href[1];

                    //data.getElementById("m_lbtEmployeesummary");
                    resolve(ids);
                }
            });
        });
    });
}
