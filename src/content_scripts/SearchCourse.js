$(document).ready(function() {

/* Erweiterung der Kurssuche um eine Kalendaransicht */
       // NOCH VIEL ARBEIT...
       var tabelle = $("#ctl00_main_m_CourseList__CourseTable");

       //tabelle.after("<div id='tabs'><ul><li><a href='#tabs1'>Tabelle</a></li><li><a href='#tabs2'>Kurskalendar</a></li></ul>"
        //             + "<div id='tabs1'></div><div id='tabs2'><p id='maximize_button'>Maximize</p></div></div></div><div id='caldiv'>"
      //              );
       //$("#tabs1").append(tabelle);
       /*
       suchfeld für suche in der tabelle:
       */
       tabelle.before("<div><span>Suche</span><input name='tabellensuche' id='tabellensuche' type='text' maxlength='40'></div>");

       //tabelle.find("tr:even").css("background-color", "#dddddd");

       //tabelle.find("tr").css(":

       $("#tabellensuche").on('input', function() {
           tabelle.find("tr:even").css("background-color", "#ffffff");
           var text = $("#tabellensuche").val();
           console.log("on event: text " + text);
           var trs = tabelle.find("tr");
           trs.show();
           trs.not(":contains(" + text + ")").hide();

           trs.css("background-color", "white");
           trs.filter(":visible").filter(":even").css("background-color", "#dddddd");

       });



});
