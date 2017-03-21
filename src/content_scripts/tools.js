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

    //var username = chrome.sync.getItem("niuUsername");
    //var STORAGE_KEY_NIU_USERNAME = "niuUsername";
    /*
        if (username) {
            var res = username.split(" ");
            var kuerzel = res[0].substring(0, 2) + res[1].substring(0, 2);
            return kuerzel + " ";
        } else {
            return null;
        } */
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

  /*
  $("#person_autocomplete").on("autocompleteselect", function(event, ui) {
      console.log("aut " + ui.item.value);

      input.find("option").removeAttr("selected");
      input.find("option:contains(" + ui.item.value + ")").attr("selected", "selected");

  });
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

                    //data.getElementById("m_lbtEmployeesummary");
                    resolve("hallo welt");
                }
            });
        });
    });
}
