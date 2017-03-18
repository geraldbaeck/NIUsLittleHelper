$(document).ready(function() {

    console.log("SearchCourse");
    var input = $("#ctl00_main_m_NewAssignment_m_NewEmployee");

    makeEmployeeSearchField(input);

    /**
    letzte Kostenstelle merken:
    */
    var selectKostenstelle = $("#ctl00_main_m_NewAssignment_m_CostCenter");

    //TODO: verwende chrome.sync.get set mit callback!! -> https://developer.chrome.com/extensions/storage#property-sync
    selectKostenstelle.change(function() {
        var letzteKostenstelle = selectKostenstelle.val();
        console.log("storing letzteKostenstelle " + letzteKostenstelle);
        //chrome.sync.set('kursdetails_letztekostenstelle', letzteKostenstelle);
    });

    var letzteKostenstelle = ""; //chrome.sync.getItem('kursdetails_letztekostenstelle');
    if (letzteKostenstelle) {
        selectKostenstelle.val(letzteKostenstelle);
    }

    /**
    Kuerzel setzen:

    */
    var bemerkung = $("#ctl00_main_m_NewAssignment_m_Notice");

    //TODO: importiere tools.js
    console.log("set bemerkung to " + getKuerzel());
    bemerkung.val(getKuerzel());


});
