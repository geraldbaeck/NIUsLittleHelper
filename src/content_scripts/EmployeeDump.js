﻿/*
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
vex.defaultOptions.className = 'vex-theme-os';

function addCalculationHandler(id, names, callback) {

  $(id).click(function() {
    if (id in clicked) { //verhindern, das eine Spalte mehrmals hinzugefügt wird
      return;
    }
    clicked[id] = true;

    var exportTable = $(".export");
    names.forEach( function(name) {
        console.log("addCalculationHandler --> names " + name.calcname + " mit ui "+ name.uiname);

        columns.push({
          data: name.calcname,
          title: name.uiname,
          avg: name.avg,
          defaultContent: ""
        });

        initDataTable();


        //TODO: solange das läuft kleines fenster anzeigen bzw. user informieren!
        //TODO: um das NIU zu schonen sollten die Abfragen hier seriell abgearbeitet werden
        var ready = Promise.resolve();
        for (index in dataSet) {
          var row = dataSet[index];
          //dataSet[index][name.calcname] = "eins";
          console.log("addCalculationHandler --> lade für dnr: " + row.DNR);


          var p = new Promise(function(resolve, raise) {
               var i = index;
               var r = row;
               var c = columns.length - 1;

               r[name.calcname] = "<img id='ajaxloader' src='" + chrome.extension.getURL('/img/ajax-loader.gif') + "'>";
               datatable.cell(i, c).invalidate().draw();

               var res = callback(r.DNR, name, r)
                .then(function(value) {
                  r[name.calcname] = value;
                  //console.log("get cell: " + i + "#" + c);
                  datatable.cell(i, c).invalidate().draw();
                  console.log("addCalculationHandler --> füge value " + value + " für spalte " + name.calcname + " in dataSet zeile " + i + " dnr: "+ r.DNR + "hinzu");
                })
                .catch(function(error) {
                  console.log("addCalculationHandler -> promise then mit error: " + error);
                });
                resolve(res);
          });
          ready = ready.then(function() {
           return p;
          });

        }
        ready.then(function() { //warte auf die promises...
          console.log("addCalculationHandler --> promises abgearbeitet");
        });
    });


  });

}



/*
  tablesorter http://tablesorter.com/docs/
*/

var dataSet = new Array;
var columns = new Array;

// var dataTableColumns = new Array;
var datatable = undefined;
function initDataTable() {
  //console.log("initDataTable --> dataSet lenght: " + dataSet.length );
  //console.log("initDataTable --> columns: " + columns.length);

  if (datatable !== undefined) {
      datatable.destroy();
      console.log("initDataTable --> after destroy: dataSet lenght: " + dataSet.length + " columns: " + columns.length);
      datatable = undefined;
  }
  //console.log("initDataTable --> dataSet:" + JSON.stringify(dataSet));
  //console.log("initDataTable --> dataTableColumns:" + JSON.stringify(columns));

  $('#datatablediv').empty();



  datatable = $('<table id="datatable"></table>');

  var l = columns.length;


  var thead = $("<thead><tr></tr></thead>");
  var tbody = $("<tbody><tr></tr></tbody>");
  var tfoot = $("<tfoot><tr></tr></tfoot>");


  for (let i = 0; i < columns.length; i++) {
    thead.append("<th></th>");
    tbody.find("tr").append("<td></td>");
    tfoot.find("tr").append("<th></th>");
  }

  // datatable.append(thead);
  //datatable.append(tbody);
  datatable.append(tfoot);

  $('#datatablediv').append(datatable);

  datatable = datatable.DataTable({
    footerCallback: function(tfoot, data, start, end, display) {
        var api = this.api(); //, data;

        for (let i = 0; i < columns.length; i++) {
          var c = api.column(i);
          if (!isNaN([c.data()[0]])) {
            total = c.data().reduce(function(a,b) {
              return (Number(a) + Number(b));
            }, 0);

            if (!isNaN(total)) {
              $(c.footer()).find(".avg").html("avg: " + (total / data.length).toFixed(1)); //todo: durchschnitt berechnen!
            }
          }
        }
    },
    destroy: true,
    data: dataSet,
    columns: columns,
    paging: false,
    fixedHeader : {
      header: true,
      footer: true
    }
  });

  for (let i = 0; i < columns.length; i++) {
    var html = "";
    html = html + "<span >" + columns[i].title + "</span><br><input type='text' class='footer_input'></input>";
    if (columns[i].avg) {
      html = html + "<span class='avg'></span><br>";
    }
    console.log("initDataTable --> add html into footer: " + html);
    $(datatable.column(i).footer()).html(html);
    var that = datatable.column(i);

    if (activeFilters["input_field_col" + i] !== undefined) {
      $(datatable.column(i).footer()).find(".footer_input").val(activeFilters["input_field_col" + i].search);
    }


    $(datatable.column(i).footer()).find(".footer_input").on('keyup change', function() {
      var val = this.value;
      console.log(".footer_input keyup change this.value: " + val);
      if (activeFilters["input_field_col" + i] === undefined) { //init des Dictionaries einmal mit einem immer true filter
        activeFilters["input_field_col" + i] = {
            "column_names" : [columns[i].name],
            "filter" : function(searchData, index, rowData, counter) {
              return true;
            },
            "search" : val
        };
      }
      if (activeFilters["input_field_col" + i].search !== val) {
        activeFilters["input_field_col" + i].search = val;
        console.debug("Ändere suchfunktion in spalte index: " + i + " mit data: " + columns[i].data );

        if (columns[i].type == Number) {
          activeFilters["input_field_col" + i].filter = function(searchData, index, rowData, counter) {
            console.info("suche nach nummer!");
            return String(rowData[columns[i].data]).includes(val);
          }
        } else {
          activeFilters["input_field_col" + i].filter = function(searchData, index, rowData, counter) {

            return String(rowData[columns[i].data]).includes(val);
          }
        }
        datatable.draw();

      }
      console.log("activeFilters: " + JSON.stringify(activeFilters));
    });

  }

  //$(datatable.column(2).footer()).html("halo welt");


  //verändere css, damit die sorting images angezeigt werden!
  $("#datatable").find(".sorting").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_both.png") + '")');
  $("#datatable").find(".sorting_asc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_asc.png")  + '")');
  $("#datatable").find(".sorting_desc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_desc.png")  + '")');

  $("#datatable").find("tbody").on("click", "tr", function() {
    if ($(this).hasClass('selected')) {
      $(this).removeClass("selected");
    } else {
      //table.find('tr.selected').removeClass('selected');

      $(this).addClass('selected');
    }
  });

  datatable.draw();
}


var activeFilters = {};

$.fn.dataTable.ext.search.push(
  function( settings, searchData, index, rowData, counter ) {
    var show = true;
    for (let key in activeFilters) {
      var f = activeFilters[key];
      if (f === undefined) {
        continue;
      }
      // var data = {};
      // for (let c of f.column_names) { //übergebe an filter die Daten, die er braucht zum filtern
      //     console.debug("c ist " + c);
      //     //var index = datatable.column(c + ":name").index("visible");
      //     console.debug("$.fn.dataTable.ext.search --> searchData: " + JSON.stringify(searchData) + " rowData: " + JSON.stringify(rowData));
      //     console.log("$.fn.dataTable.ext.search --> set data[c] to " + searchData[index] + " c: " + c + " index: " + index);
      //     data[c] = rowData[c];
      // }
      console.debug("$.fn.dataTable.ext.search --> calling filter: searchData:" + searchData + "index:" + index + "rowData:" + rowData + "counter: " + counter);
      show = show && f.filter(searchData, index, rowData, counter); //UND verknüpfung der suchfilter
    }
    return show;
  }
);


var mail = "test@example.com";
function generateMailLink(subject, body, to, cc, bcc) {
  //TODO: hole korrekte mailadresse!


  var bcclist = "";
  for (let m of bcc) {
    bcclist = bcclist + "," + m;
  }
  bcclist = bcclist.substring(1, bcclist.length);

  var mailto = "mailto:" + mail + "?" + $.param({
    bcc : bcclist,
    // subject : subject,
    // body: body,
    // to : to,
    // cc : cc
  });
  return mailto;
}

$(document).ready(function() {

  var exportTable = $(".export");

  var headers = [];
  //parse first column also die headers...
  exportTable.find("tr:first th").each( function(index) {
    console.log("index " + index + " mit th " + $(this).text());
      headers.push($(this).text());
      columns.push( {
        data: $(this).text(),
        title: $(this).text(),
        name: $(this).text()
      });
  });

  //parse data
  exportTable.find("tr:gt(0)").each( function(index) {
      var row = {};
      $(this).find("td").each(function(index) {
        row[headers[index]] = $(this).text();
      });
      dataSet.push(row);
  });

  //exportTable.after("<p>Hallo Welt</p>");
  exportTable.after("<div id='datatablediv'></div>");
  exportTable.hide();
  initDataTable();


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

    for (key in DUTY_TYPES) {

        $("#dienstcount").append("<li><div id='dienstcount_" + key +"'>[" + key + "] <span class='menu_description'>" + DUTY_TYPES[key].description + "</span></div></li>");
        var col = [
          {calcname : "hourduty$" + key, uiname : key + " Stunden", avg : true, type : Number },
          {calcname : "countduty$" + key, uiname : key + " Dienste", avg : true, type : Number}
        ];
        addCalculationHandler("#dienstcount_" + key, col, function(dnr, name) {
           //verkettete Promises...
           return dnrToIdentifier(dnr).then(
                  function(result) {
                    console.debug("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
                    return calculateDutyStatistic(result.ENID, "");
                  }).then(
                    function(statresult) {
                      console.debug("key: " + key + "name" + JSON.stringify(name) + "statresult: " + statresult);
                      return statresult.getDuty(name.calcname);
                    }
                  );
        });
    }

    //$("#menu").button();
    $("#menu").menu();

    header.after("<div id='select_all_button'>Alle Zeilen selektieren</div>");
    header.after("<div id='clear_selection'>Selektion löschen</div>");
    $('#select_all_button').button();
    $('#select_all_button').addClass("small-button");
    $('#select_all_button').click(function() {
      $("#datatable").find("tbody tr").addClass("selected");
    });
    $('#clear_selection').button();
    $('#clear_selection').addClass("small-button");
    $('#clear_selection').click(function() {
      $("#datatable").find("tbody tr").removeClass("selected");
    });

    header.after("<div id='mailto_alle_sichtbaren'>Mailto an alle sichtbaren</div>");
    $('#mailto_alle_sichtbaren').button();
    $('#mailto_alle_sichtbaren').addClass("small-button");
    $('#mailto_alle_sichtbaren').click(function() {

      var bcc = [];
      // $("#datatable").find("tbody tr").each(function(index) {
      //     $(this).text();
      // });
      var mails = datatable.rows({filter: 'applied'}).column(5).data().toArray();  //.nodes(); //column("Email:name");
      console.log("mails: " + JSON.stringify(mails));
      var mailto = generateMailLink("", "", [], [], mails);
      console.log("mailto ist " + mailto);
      window.open(mailto);
    });

    header.after("<div id='mailto_alle_selektiert'>Mailto an alle selektierten</div>");
    $('#mailto_alle_selektiert').button();
    $('#mailto_alle_selektiert').addClass("small-button");
    $('#mailto_alle_selektiert').click(function() {

      if(datatable.rows('.selected').count() < 1)
       {
        vex.dialog.alert('Es wurde keine Auswahl getroffen, Funktion wird beendet.');
        return;
       }

      var bcc = [];
      // $("#datatable").find("tbody tr").each(function(index) {
      //     $(this).text();
      // });
      var mailsObj = datatable.rows('.selected').data();  //.nodes(); //column("Email:name");
      var mails = [];
      $.each($(mailsObj),function(key,value){
         mails.push(value.Email);
       });

      console.log("mails: " + JSON.stringify(mails));
      var mailto = generateMailLink("", "", [], [], mails);
      console.log("mailto ist " + mailto);
      window.open(mailto);
    });

    header.after("<div id='memo_alle_selektiert'>Memo f&uuml;r alle selektierten</div>");
    $('#memo_alle_selektiert').button();
    $('#memo_alle_selektiert').addClass("small-button");
    $('#memo_alle_selektiert').click(function() {

       if(datatable.rows('.selected').count() < 1)
       {
        vex.dialog.alert('Es wurde keine Auswahl getroffen, Funktion wird beendet.');
        return;
       }
       $("#memo_alle_selektiert").html("<img id='ajaxloader' src='" + chrome.extension.getURL('/img/ajax-loader.gif') + "'>");

       return getOwnDNRs()
       .then(function(returnDNrs)
       {

       $("#memo_alle_selektiert").html("Memo f&uuml;r alle selektierten");

       var composeStr = 'Verfasser: <select name="memoverfasser" style="margin-bottom:5px;">';
       $.each($(returnDNrs),function(key,value){
         composeStr += '<option>' + value.trim() + '</option>';
       });
       composeStr += '</select>';

       var selDnrsObj = datatable.rows('.selected').data();
       var selDnrsArr = [];
       $.each($(selDnrsObj),function(key,value){
         selDnrsArr.push(value.DNR);
       });

       vex.dialog.open({
       message: 'Memo wird angelegt bei: ' + selDnrsArr.toString(),
       input: [
         composeStr,
        '<textarea name="memo" placeholder="Hallo, ich bin ein Memo." style="width:98%"></textarea>',
        '<input type="textbox" name="memodate" placeholder="Datum" value="' + getNiuDateString(new Date()) + '" style="border:0px;"> ',
        '<input type="textbox" name="memoreminder" placeholder="Erinnerungsdatum" style="border:0px;">'

       ].join(''),
       buttons: [
        $.extend({}, vex.dialog.buttons.YES, { text: 'Anlegen' }),
        $.extend({}, vex.dialog.buttons.NO, { text: 'Abbrechen' })
       ],
       callback: function (data) {
        if (!data) {
        } else {

            var promises = [];

            $.each( selDnrsObj, function( key, value ) {

              var MemoObj = {};
              MemoObj["memotext"] = data.memo;
              MemoObj["dnr"] = value.DNR;
              MemoObj["dnrself"] = data.memoverfasser;
              MemoObj["memodate"] = data.memodate;
              MemoObj["memoreminder"] = data.memoreminder;

              promises.push(writeMemo(MemoObj));

            });

            $.when.apply($, promises).then(function(schemas) {
            vex.dialog.alert('Memos wurden erfolgreich angelegt!')
            }, function(e) {
            vex.dialog.alert('Zumindest ein Memo konnte nicht erfolgreich angelegt werden!')
            });

        }
    }
})
});
});

    //$('#mailto_alle_selektiert').click();

     addCalculationHandler("#pflichtfortbildungen", [{calcname : "pflichtfortbildungen", uiname : "Pflichtfortb."}], function(dnr, name) {
       //verkettete Promises...

       var pflichtfortb = {
                           UID : "pfb6",
                           kurs1 : { "Name" : "Kommunikation & Übergabe|Kommunikation und Übergabe", "courseID" : "A03241", "tnStatus" : "nein" },
                           kurs2 : { "Name" : "First Car", "courseID" : "", "tnStatus" : "nein" },
                           kurs3 : { "Name" : "", "courseID" : "A04194|A04200|A04477", "tnStatus" : "nein"}
                         };

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return checkCourseAttendance(result.EID, pflichtfortb)
        }).then( function(resultDict) {
          return ("K&&Uuml;: " + resultDict.kurs1.tnStatus + "<br />First Car: " + resultDict.kurs2.tnStatus + "<br />TAG-Modul: " + resultDict.kurs3.tnStatus);
        });

     });

    addCalculationHandler("#grundkurse", [{calcname : "grundkurse", uiname : "Grundkurse"}], function(dnr, name) {
       //verkettete Promises...

       var grundkurse = {
                           UID : "grk4",
                           kurs1 : { "Name" : "Das Rote Kreuz", "courseID" : "", "tnStatus" : "nein" },
                           kurs2 : { "Name" : "SAN - Ausbildung - RS Ambulanzseminar", "courseID" : "", "tnStatus" : "nein" },
                           kurs3 : { "Name" : "BAS - Ausbildung - KHD-SD-Praxis|BAS - Ausbildung - KHD-Praxistag", "courseID" : "", "tnStatus" : "nein" },
                           kurs4 : { "Name" : "SAN - Ausbildung - San1-Seminar|SAN - Ausbildung - SAN1-Seminar", "courseID" : "", "tnStatus" : "nein" }
                         };

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return checkCourseAttendance(result.EID, grundkurse)
        }).then( function(resultDict) {
          return ("Das RK: " + resultDict.kurs1.tnStatus + "<br />KHD-SD: " + resultDict.kurs3.tnStatus + "<br />SAN1-Seminar: " + resultDict.kurs4.tnStatus + "<br />AmbSem (alt): " + resultDict.kurs2.tnStatus);
        });

     });

     addCalculationHandler("#gaststatus", [{calcname : "gaststatus", uiname : "Gaststatus"}], function(dnr, name) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return getEmployeeDataSheet(result.ENID)
        }).then( function(result) {
          if(result.istGast) { return ("ja"); } else { return ("nein"); }

        });

     });

     addCalculationHandler("#niuzugang", [{calcname : "niuzugang", uiname : "AD-Benutzer"}], function(dnr, name) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return getEmployeeDataSheet(result.ENID)
        }).then( function(result) {
          return result.ADuser;

        });

     });

     addCalculationHandler("#letztedienstleistung", [{calcname : "letztedienstleistung", uiname : "Letzte Dienstleistung"}], function(dnr, name, row) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return getLastDuty(result.ENID)
        }).then( function(result) {
          var mailtemp_name = row.Name.split(" ")[1];
          var mailtemp_email = row.Email;
          var lastDuty = result;
          var mailtemp_link = "mailto:" + mailtemp_email + "?subject=" + dnr + "%20-%20Mitarbeiterdurchsicht%20-%20Dienstleistung&body=Liebe%2Fr%20" + mailtemp_name + "%2C%0A%0ABei%20der%20Durchsicht%20unserer%20Mitarbeiter%2Finnen%20ist%20uns%20aufgefallen%2C%20dass%20Dein%20letzter%20Dienst%20bereits%20l%C3%A4ngere%20Zeit%20zur%C3%BCck%20liegt.%20(" + lastDuty + ")%0AAls%20Mindestdienstleistung%20im%20Jahr%20erwarten%20wir%20ca.%2024%20(regelm%C3%A4%C3%9Fige)%20Dienste%20um%20die%20Qualit%C3%A4t%20unserer%20Arbeit%20aufrecht%20zu%20erhalten.%0A%0AHast%20Du%20derzeit%20irgendwelche%20Fragen%2C%20besondere%20erschwerende%20Lebensumst%C3%A4nde%20oder%20k%C3%B6nnen%20wir%20Dir%20sonst%20irgendwie%20behilflich%20sein%20Deinen%20Wiedereinstieg%20in%20eine%20regelm%C3%A4%C3%9Figere%20Dienstleistung%20zu%20realisieren%3F%0A%0ALiebe%20Gr%C3%BC%C3%9Fe%2C";
          return lastDuty + " <a href='"+ mailtemp_link + "'><img src=" + chrome.extension.getURL('/img/envelope.svg') + " width='12'></a> <a href='https://niu.wrk.at/df/memo/memo_eingeben.asp?DienstNr=" + dnr + "' target='_blank'><img src=" + chrome.extension.getURL('/img/gear.svg') + " width='12'></a>";
        });

     });

     addCalculationHandler("#shortcuts", [{calcname : "shortcuts", uiname : "Kommando"}], function(dnr, name) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);

          return("<ul><li><a target='_blank' href='https://niu.wrk.at/Kripo/Employee/summaryemployee.aspx?EmployeeId=" + result.EID + "'>Mitarbeiter</a><br /></li><li><a target='_blank' href='https://niu.wrk.at/Kripo/Employee/detailEmployee.aspx?EmployeeId=" + result.EID + "'>Details</a><br /></li><li><a target='_blank' href='https://niu.wrk.at/Kripo/Employee/ListAvailabilities.aspx?EmployeeNumberID=" + result.ENID + "'>Urlaub</a><br /></li><li><a target='_blank' href='https://niu.wrk.at/df/fahrscheingeld/entschaedigung/entschaedigung.asp?DienstNr=" + dnr + "'>Fahrscheingeld</a><br /></li><li><a target='_blank' href='https://niu.wrk.at/Kripo/Employee/UniformList.aspx?EmployeeId=" + result.EID + "'>Uniform</a><br /></li><li><a target='_blank' href='https://niu.wrk.at/Kripo/Employee/IssuedKeys.aspx?EmployeeId=" + result.EID + "'>Schl&uuml;ssel</a><br /></li><li><a target='_blank' href='https://niu.wrk.at/df/memo/memo_eingeben.asp?DienstNr=" + dnr + "'>Memo</a><br /></li><li><a target='_blank' href='https://niu.wrk.at/Kripo/Kufer/SearchCourse.aspx?EmployeeId=" + result.EID + "'>Ausbildung</a><br /></li><li><a target='_blank' href='https://niu.wrk.at/Kripo/Employee/LVStatistic.aspx?EmployeeId=" + result.EID + "'>LV Statistik</a><br /></li><li><a target='_blank' href='https://niu.wrk.at/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=" + result.ENID + "'>Statistik</a><br /></li><li><a target='_blank' href='https://niu.wrk.at/Kripo/Employee/Conan/ListDocuments.aspx?EmployeeId=" + result.EID + "'>Dokumente</a><br /></li></ul>");


        });

     });

    addCalculationHandler("#keys", [{calcname: "keys", uiname: "Ausgegebene / Eingezogene Schlüssel"}], function(dnr, name){
      return dnrToIdentifier(dnr)
        .then(async function(result) {
            var keys = await getKeyInfo(result.EID);      
            return keys; 
        });
    })

      addCalculationHandler("#fotofehlt", [{calcname : "fotofehlt", uiname : "Foto fehlt?"}], function(dnr, name) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return getEmployeeDataSheet(result.ENID)
        }).then( function(result) {
          if(result.FotoURL.includes("unknown")) { return "ja"; } else { return "nein"; }
        });

     });

     addCalculationHandler("#noshows", [{calcname : "noshows", uiname : "No-Shows"}], function(dnr, name) {
       //verkettete Promises...

       return dnrToIdentifier(dnr)
       .then(function(result) {
         console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
         return getEmployeeCourses(result.EID, "noshowUID", "01.01.1900", null, "Nicht erschienen")
       }).then( function(allCourses)
       {
         var alertString = "";
         for(var singleCourse in allCourses) {
           var singleString = allCourses[singleCourse].titel + " (" + allCourses[singleCourse].dateFrom + ")\\n";
           alertString += singleString;
         }
         return '<a href="javascript:alert(\'' + encodeURIComponent(alertString) + '\')">' + allCourses.length + ' No-Shows</a>';
       });

     });

        addCalculationHandler("#sanber", [{calcname : "sanber", uiname : "SAN-Berechtigung"}], function(dnr, name) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return getEmployeeDataSheet(result.ENID)
        }).then( function(result) {
          var berArray = result.PermissionArray;
          var permString = "";
          var arrayLength = berArray.length;

          for (var i = 0; i < arrayLength; i++) {
          if(berArray[i].typ === "SAN" && !berArray[i].revoked) { permString += "SAN: " + berArray[i].permission + "<br>"; }
          if(berArray[i].typ === "SanG" && !berArray[i].revoked) { permString += "SanG: " + berArray[i].permission + "<br>"; }
          };

          return permString;

        });

     });

     addCalculationHandler("#fsdber", [{calcname : "fsdber", uiname : "FSD-Berechtigung"}], function(dnr, name) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return getEmployeeDataSheet(result.ENID)
        }).then( function(result) {
          var berArray = result.PermissionArray;
          var permString = "";
          var arrayLength = berArray.length;

          for (var i = 0; i < arrayLength; i++) {
          if(berArray[i].typ.includes("GSD") && !berArray[i].revoked) { permString += berArray[i].permission + "<br>"; }
          };

          return permString;

        });

     });

      addCalculationHandler("#fahrber", [{calcname : "fahrber", uiname : "Fahrer-Berechtigung"}], function(dnr, name) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return getEmployeeDataSheet(result.ENID)
        }).then( function(result) {
          var berArray = result.PermissionArray;
          var permString = "";
          var arrayLength = berArray.length;

          for (var i = 0; i < arrayLength; i++) {
          if(berArray[i].typ.includes("Fahrer") && !berArray[i].revoked) { permString += berArray[i].permission + "<br>"; }
          };

          return permString;

        });

     });

      addCalculationHandler("#alleber", [{calcname : "alleber", uiname : "Berechtigungen"}], function(dnr, name) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return getEmployeeDataSheet(result.ENID)
        }).then( function(result) {
          var berArray = result.PermissionArray;
          var permString = "";
          var arrayLength = berArray.length;

          for (var i = 0; i < arrayLength; i++) {
          if(!berArray[i].revoked) { permString += berArray[i].typ + " -> " + berArray[i].permission + "<br>"; }
          };

          return permString;

        });

     });

     addCalculationHandler("#ampel", [{calcname : "ampel", uiname : "SAN-Ampel"}], function(dnr, name) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return getEmployeeDataSheet(result.ENID)
        }).then( function(result) {
          $("head").append("<link rel=\"stylesheet\" type=\"text/css\" href=\"/Kripo/Shares/tooltip.css\">");
          return result.AmpelCode;
        });

     });

     addCalculationHandler("#dienstgrade", [{calcname : "dienstgrade", uiname : "Dienstgrad"}], function(dnr, name) {
       //verkettete Promises...

        return dnrToIdentifier(dnr)
        .then(function(result) {
          console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
          return getEmployeeDataSheet(result.ENID)
        }).then( function(result) {
          return(result.Dienstgrad);
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

                  return statresult.getDutyHours("SUM_RD");
                }
              );
      });

      addCalculationHandler("#rddienste", [{calcname : "rddienste", uiname : "RD Dienste d. l. 6 Monate"}], function(dnr, name, row){
        return dnrToIdentifier(dnr).then(
               function(result) {
                 console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
                 return calculateDutyStatistic(result.ENID, "");
               }).then(
                 function(statresult) {

                   var mailtemp_name = row.Name.split(" ")[1];
                   var mailtemp_email = row.Email;
                   var totalDuties = statresult.getDutyCount("SUM_RD");
                   var mailtemp_link = "mailto:" + mailtemp_email + "?subject=" + dnr + "%20-%20Mitarbeiterdurchsicht%20-%20Dienstleistung&body=Liebe%2Fr%20" + mailtemp_name + "%2C%0A%0ABei%20der%20Durchsicht%20unserer%20Mitarbeiter%2Finnen%20ist%20uns%20aufgefallen%2C%20dass%20Du%20in%20den%20letzten%206%20Monaten%20leider%20nur%20" + totalDuties + "%20Dienste%20f%C3%BCr%20das%20Wiener%20Rote%20Kreuz%20geleistet%20hast.%20%0AAls%20Mindestdienstleistung%20im%20Jahr%20erwarten%20wir%20ca.%2024%20Dienste%20um%20die%20Qualit%C3%A4t%20unserer%20Arbeit%20aufrecht%20zu%20erhalten.%0A%0AHast%20Du%20derzeit%20irgendwelche%20Fragen%2C%20besondere%20erschwerende%20Lebensumst%C3%A4nde%20oder%20k%C3%B6nnen%20wir%20Dir%20sonst%20irgendwie%20behilflich%20sein%20noch%20auf%20die%20notwendigen%2024%20Dienste%20zu%20kommen%3F%0A%0ALiebe%20Gr%C3%BC%C3%9Fe%2C";
                   return totalDuties + " <a href='"+ mailtemp_link + "'><img src=" + chrome.extension.getURL('/img/envelope.svg') + " width='12'></a> <a href='https://niu.wrk.at/df/memo/memo_eingeben.asp?DienstNr=" + dnr + "' target='_blank'><img src=" + chrome.extension.getURL('/img/gear.svg') + " width='12'></a>";

                 }
               );
      });
      //$("#rddienste").trigger("click");

      //zum testen
      //$("#rddienste").trigger("click"); //aktiviert gleich nach laden der seite den click
  });


(function(){
        var searchParams = $("#ctl00_main_m_SearchParams");
        var dnrStart = searchParams.html().substr(15,4);
        console.log(dnrStart);
        var dienstnummern = [];
        var freieDnr = [];
        $('.sorting_1').each(function(key, value){
          dienstnummern.push($(value).html());
        });
        $(dienstnummern).each(function(key, value){
          var exp = parseInt(dnrStart) + parseInt(key);
          if(exp != value)
          {
            freieDnr.push(exp);
          }
        exp="";
      });
      searchParams.append("<br><b>Die nächste Freie Dienstnummer lautet \""+freieDnr[0]+"\"");
    })();
});
