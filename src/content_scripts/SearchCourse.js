$(document).ready(function() {

/* Erweiterung der Kurssuche um eine Kalendaransicht */
       // NOCH VIEL ARBEIT...
       var tabelle = $("#ctl00_main_m_CourseList__CourseTable");

       tabelle.after("<div id='tabs'><ul><li><a href='#tabs1'>Tabelle</a></li><li><a href='#tabs2'>Kurskalendar</a></li></ul>"
                     + "<div id='tabs1'></div><div id='tabs2'><p id='maximize_button'>Maximize</p></div></div></div><div id='caldiv'>"
                    );
       $("#tabs1").append(tabelle);




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


       /*
         erstelle den DIALOG
       */
       $("#maximize_button").button()
           .click(function( event ) {
           GM_log("click");
           $("#caldiv").dialog({
               modal: true,
               draggable: false,
               height: 600,
               width: 800,
               resizeStop: function( event, ui ) { /*TODO: speichere letzte Größe...*/ },
               close: function( event, ui ) {
                   $("#caldiv").children().appendTo("#tabs2");
                   $("#maximize_button").show();
               },
               open: function(event, ui) {
                   $("#tabs2").children().appendTo("#caldiv");
                   $("#maximize_button").hide();
               }
           });
       });


       /*
        Merke das zuletzt geöffnete Tab
       */
       //var localStorage = window['localStorage'];

       $("#tabs").tabs({
           activate: function(event, ui) {
               localStorage.setItem('kurssuche_activeTab', ui.newTab.index());
           }});



       var activeTab = localStorage.getItem('kurssuche_activeTab');
       if (activeTab) {
           GM_log("activeTAB " + activeTab);
           $("#tabs").tabs("option", "active", activeTab);
       }


       /*
       // Erstelle Kalendar
       */

       //adding required stylesheets:
       $('head').append('<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/2.4.0/fullcalendar.min.css">');



       GM_log("function calendar...");

       var cal = $("<div></div>");

       $("#tabs2").append(cal);

       /*
       date store today date.
       d store today date.
       m store current month.
       y store current year.
     */
       var date = new Date();
       var d = date.getDate();
       var m = date.getMonth();
       var y = date.getFullYear();

       /*
       Initialize fullCalendar and store into variable.
       Why in variable?
       Because doing so we can use it inside other function.
       In order to modify its option later.
     */

       var calendar = $(cal).fullCalendar({
           header: {
               left: 'prev,next today',
               center: 'title',
               right: 'month,agendaWeek,agendaDay'
           },
           defaultDate: new Date(),
           defaultView: 'agendaWeek',
           editable: false,
           eventClick: function(calEvent, jsEvent, view) {

               alert('Event: ' + calEvent.title + " ev " + calEvent.link);
               //alert('Coordinates: ' + jsEvent.pageX + ',' + jsEvent.pageY);
               //alert('View: ' + view.name);

               // change the border color just for fun
               //$(this).css('border-color', 'red');

           }

       });

       /*
        PARSE DIE KURSE DER TABELLE
       */
       GM_log("start parsen der tabelle...");



       var events = [];
       tabelle.find("tr").each( function(index) {
           if ($(this).children().length < 3) {
               return; //lasse alle jahreszeilen aus...
           }
           if ($(this).find("td:first").text().match( new RegExp("ABZ"))) {
               //lasse table header aus...
               GM_log("return " + $(this).find("td:first").text().match( new RegExp("ABZ")) );
               return;
           }

           GM_log("parse zeile");

           var newEvent = new Object();

           newEvent.kursnr = $(this).find("td:eq(0)").text();

           //newEvent.title = newEvent.kursnr;

           newEvent.kurs = $(this).find("td:eq(1)").text();
           //newEvon = $(this).find("td:eq(2)").text();
           //newEvent.von = moment(von, "DD.MM.YYYY HH:mm");
           newEvent.start = moment($(this).find("td:eq(2)").text(), "DD.MM.YYYY HH:mm");
           //GM_log("is valid date: " + newEvent.start.isValid() );

           newEvent.end = moment($(this).find("td:eq(3)").text(), "DD.MM.YYYY HH:mm");

           newEvent.ort = $(this).find("td:eq(4)").text();
           newEvent.status = $(this).find("td:eq(5)").text();
           newEvent.qualifikation = $(this).find("td:eq(6)").text();
           newEvent.stunden = $(this).find("td:eq(7)").text();
           newEvent.link = $(this).find("td:eq(8) a").attr("href");

           events.push(newEvent);

           //calendar.fullCalendar( 'renderEvent', newEvent );

       });


       var filter = {};

       filter['alles'] = { name : "alles", color : "blue", pattern : new RegExp(".") };
       filter['dasrk'] = { name : "Das Rote Kreuz", color : "yellow", pattern : new RegExp("Das Rote Kreuz") };


       var filterlist = $("<ul></ul>");
       $(cal).before(filterlist);

       for (f in filter) {
           filterlist.append("<li class='selectfilter' id='filter_"+ f + "'>"+ filter[f].name +"</li>");

           $(cal).fullCalendar( 'addEventSource', { events : function(start, end, timezone, callback) {

               var ev = [];

               $(events).each( function(index, e) {
                   //GM_log( "start " + start + " end " + end + " e.start.unix() " + e.start + " e.end.unix() " + e.start);
                   //if ( typeof(e.start) != "undefined" && typeof(e.end) != "undefined" && start.unix() >= e.start.unix() && end.unix() <= e.end.unix()) {
                   if (e.kurs.match(filter[f].pattern)) {
                       e.title = e.kursnr + " " + e.kurs;
                       ev.push(e);
                   }
                   //}


               });
               callback(ev);
               //callback({ events: ev, color : filter[f].color});
           }, color: filter[f].color, textColor: 'black' });


       }

       //$(filter).each( function(index, f) {

       //});


       //        $(cal).fullCalendar( 'addEventSource', function(start, end, timezone, callback) {

       //            var ev = [];

       //            $(events).each( function(index, e) {
       //GM_log( "start " + start + " end " + end + " e.start.unix() " + e.start + " e.end.unix() " + e.start);
       //if ( typeof(e.start) != "undefined" && typeof(e.end) != "undefined" && start.unix() >= e.start.unix() && end.unix() <= e.end.unix()) {
       //                ev.push(e);
       //}


       //           });
       //            callback(ev);
       //        });


});
