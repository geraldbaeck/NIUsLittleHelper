







$(document).ready(function() {

    console.log("SearchCourse");
    var input = $("#ctl00_main_m_NewAssignment_m_NewEmployee");

    var KEY_NAME_LETZTE_KOSTENSTELLE = "letzte_kostenstelle";



    /**
    letzte Kostenstelle merken:
    */
    var selectKostenstelle = $("#ctl00_main_m_NewAssignment_m_CostCenter");

    //TODO: verwende chrome.sync.get set mit callback!! -> https://developer.chrome.com/extensions/storage#property-sync

    //chrome.sync.get("letzteKostenstelle");

    chrome.storage.sync.get(KEY_NAME_LETZTE_KOSTENSTELLE, function(item) {
      console.log("lade letzte Kostenstelle:" + item[KEY_NAME_LETZTE_KOSTENSTELLE]);
        if (KEY_NAME_LETZTE_KOSTENSTELLE in item) {
          console.log("letzte Kostenstelle ist " + item[KEY_NAME_LETZTE_KOSTENSTELLE]);
              selectKostenstelle.val(item[KEY_NAME_LETZTE_KOSTENSTELLE]);
        }
    });

    selectKostenstelle.change(function() {
        var letzteKostenstelle = selectKostenstelle.val();
        var save = {};
        save[KEY_NAME_LETZTE_KOSTENSTELLE] = letzteKostenstelle;
        chrome.storage.sync.set(save, function () {
          console.log("saved: [" + save[KEY_NAME_LETZTE_KOSTENSTELLE] + "]");
        });

        //chrome.sync.set('kursdetails_letztekostenstelle', letzteKostenstelle);
    });

    //var letzteKostenstelle = ""; //chrome.sync.getItem('kursdetails_letztekostenstelle');
    //if (letzteKostenstelle) {
    //    selectKostenstelle.val(letzteKostenstelle);
    //}

    /**
    Kuerzel setzen:

    */
    // var bemerkung = $("#ctl00_main_m_NewAssignment_m_Notice");
    //
    // //TODO: importiere tools.js
    // //console.log("set bemerkung to " + getKuerzel());
    // getKuerzel().then(function(kuerzel) {
    //   console.log("getKuerzel then [" + kuerzel + "]");
    //   bemerkung.val(kuerzel);
    // });

    makeEmployeeSearchField(input);


});
