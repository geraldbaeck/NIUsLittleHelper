function getKuerzel() {

    var username = chrome.sync.getItem("niuUsername");
    if (username) {
        var res = username.split(" ");
        var kuerzel = res[0].substring(0, 2) + res[1].substring(0, 2);
        return kuerzel + " ";
    } else {
        return null;
    }
}


function makeEmployeeSearchField(input) {
    var names = [];
    //datenstruktur für suche erzeugen

    input.find("option").each(function(index, option) {
        var option = $(option);
        names.push(option.text());
        console.log("collectnig name " + option.text());
    });

    input.after("<input id='person_autocomplete'></input>");
    $("#person_autocomplete").autocomplete({
        source: names,

    });
    input.hide(); //zumindest solange keine Lösung für FRAMEPROBLEM!!!

    $("#person_autocomplete").on("autocompleteselect", function(event, ui) {
        console.log("aut " + ui.item.value);

        input.find("option").removeAttr("selected");
        input.find("option:contains(" + ui.item.value + ")").attr("selected", "selected");

    });
    $("#person_autocomplete").on("autocompleteopen", function(event, ui) {
        console.log("on open");
        $(this).autocomplete('widget').css('z-index', 100);


        $("frame[name='ControlCenterMain']");
        var main = $("frame[name='ControlCenterMain']"); //.children().css('opacity', "0.5");
        console.log("main " + main);

        main.remove();


        console.log("frameset" + $("frameset"));
        $("frameset").attr("rows", "100,25,*");

    });

};
