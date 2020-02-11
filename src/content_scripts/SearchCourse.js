var kursauswahl;
var kurssuche;
var activeFilters = {}; //ul menüleiste, die wählbare suchfilter enthält


function addSuchfilter(table, key, uiname, column_names, callback) {
  suchfilter.append('<li><input  id="suchfilter_' + key + '" type="checkbox" value="value"><label for="suchfilter_' + key + '" style="padding-right:1em;">' + uiname + '</label></li>');
  suchfilter.find('#suchfilter_' + key).change(function() {
      console.log("addSuchfilter --> click calling callback with checked: " + $(this).is(':checked'));
      //callback( $(this).is(':checked') );
      if ($(this).is(':checked')) {
        activeFilters[key] = { "column_names" : column_names, "filter" : callback };
      } else {
        activeFilters[key] = undefined;
      }
      table.draw(); //redraw um suche erneut auszuführen!
  });
}


//verstecke Kursauswahl und speichere status
function hideKursauswahl() {
  var set = {};
  set[STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE] = true;
  chrome.storage.sync.set(set, function() {
    kursauswahl.hide();
    var einblenden = $("<h5 class='einblenden'><a>Kursauswahl einblenden</a></h5>");
    $(".Whitebox:eq(0)").prepend(einblenden);
    einblenden.click(function() {
      var set = {};
      set[STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE] = false;
      chrome.storage.sync.set(set, function() {
        kursauswahl.show();
        einblenden.remove();
      });
    });
  });
}

//verstecke Kurssuche und speichere status
function hideKurssuche() {
  var set = {};
  set[STORAGE_KEY_SEARCH_COURSE_HIDE_SEARCH] = true;
  chrome.storage.sync.set(set, function() {
    kurssuche.hide();
    var einblenden = $("<h5 class='einblenden'><a>Kurssuche einblenden</a></h5>");
    $(".Whitebox:eq(0)").append(einblenden);
    einblenden.click(function() {
      var set = {};
      set[STORAGE_KEY_SEARCH_COURSE_HIDE_SEARCH] = false;
      chrome.storage.sync.set(set, function() {
        kurssuche.show();
        einblenden.remove();
      });
    });
  });
}

$(document).ready(function() {
  /* Erweiterung der Kurssuche um eine Kalendaransicht */
  // NOCH VIEL ARBEIT...
  var tabelle = $("#ctl00_main_m_CourseList__CourseTable");

  //kurssuche ausblenden
  //$(".Whitebox").hide();
  kursauswahl = $("tr:contains('Kursauswahl')").nextUntil("tr:has('#ctl00_main_m_Select')").addBack().next("tr").addBack();
  kurssuche = $("tr:contains('Kurssuche')").nextUntil("tr:has('#ctl00_main_m_Search')").addBack().next("tr").addBack();

  $(".Whitebox table h4").append("<span class='ausblenden'><a>ausblenden</a></span>");
  $(".Whitebox .ausblenden").click(function() {
    console.log("parent text is " + $(this).parent().text());
      if ($(this).parent().text().includes("Kursauswahl")) {
          hideKursauswahl();
      }
      if ($(this).parent().text().includes("Kurssuche")) {
          hideKurssuche();
      }
  });

  var load = {};
  load[STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE] = true;
  chrome.storage.sync.get(load, function(item) {
    console.log("get Storage item: " + item[STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE]);
        if(item[STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE]) {
            hideKursauswahl();
        }
  });

  var load = {};
  load[STORAGE_KEY_SEARCH_COURSE_HIDE_SEARCH] = true;
  chrome.storage.sync.get(load, function(item) {
      if(item[STORAGE_KEY_SEARCH_COURSE_HIDE_SEARCH]) {
        hideKurssuche();
      }
  });



  if (tabelle.length == 0) {
    var load = {};
    load[STORAGE_KEY_SEARCH_COURSE_ALWAYS_SEARCH] = DEFAULT_SEARCH_COURSE_ALWAYS_SEARCH;
    chrome.storage.sync.get(load, function(item) {
        if (item[STORAGE_KEY_SEARCH_COURSE_ALWAYS_SEARCH]) {
            console.log("document.ready --> fill in form und send query!...");

            var todaysDateString = getNiuDateString(new Date());
            var tillDate = new Date();
            tillDate.setMonth(tillDate.getMonth() + 12);
            var tillDateString = getNiuDateString(tillDate);

            $('#ctl00_main_m_From_m_Textbox').val(todaysDateString);
            $("#ctl00_main_m_To_m_Textbox").val(tillDateString);

            $("#ctl00_main_m_Options input[type=checkbox]").remove("checked"); //alle checkboxen uncheck
            $("#ctl00_main_m_Options_3").prop("checked", "true"); // Qualifikationen anzeigen
            $("#ctl00_main_m_Options_5").prop("checked", "true"); // Auch Stornos
            $("#ctl00_main_m_Options_6").prop("checked", "true"); // Auch Anrechnungskurse
            $("#ctl00_main_m_Options_7").prop("checked", "true"); // Auch E-Learning
            $("#ctl00_main_m_Options_8").prop("checked", "true"); // Auch Warteliste

            $("#ctl00_main_m_Search").click();
        }
    });
  }

  //suchfilterleiste erzeugen
  tabelle.before("<div class='Whitebox suchfilter'><ul id='suchfilter'></ul></div>");
  suchfilter = $('#suchfilter');

  //DATATABLE
  var headers = new Array;
  var dataSet = new Array;
  var columns = new Array;

  //Unterscheidung, wenn Ausbildungstabelle für User abgefragt wird, gibt es eine
  //Spalte mehr, den Anmeldestatus!
  maausbheaders = ["abznr", "kurs", "von", "bis", "ort",
  "kursstatus", "anmeldestatus", "qualifikation", "fortbildungsstunden"];
  ausbheaders = ["abznr", "kurs", "von", "bis", "ort",
  "kursstatus", "qualifikation", "fortbildungsstunden"];

  col_anmeldestatus = {
    data: "anmeldestatus",
    title: "Anmeldestatus"
  }

  columns = [
    {
      data: "abznr",
      targets : -1,
      render: function(data, type, full, meta) {
        return '<a class="open_course_link" href="/Kripo/Kufer/CourseDetail.aspx?CourseID=' + data + '">&ouml;ffnen</a>';
      }
    },

    {
      data: "kursstatus",
        render: function(data, type, full, meta) {
          if(data.includes("Offen") && !window.location.href.includes("DisplaySelf") && !window.location.href.includes("Employee") ) { return '<a class="mail_link" href="#" target="_blank">anmelden</a>'; }
          else if(data.includes("Offen") && window.location.href.includes("Employee")) { return ''; }
          else if(data.includes("Offen") && window.location.href.includes("DisplaySelf")) { return '<a class="mail_link" href="#" target="_blank">abmelden</a>'; }
          else { return ''; }
        },
        name: "maillink"
    },

    {
      data: "abznr",
      title: "ABZ Nr",
      name: "abznr",
      defaultContent: "LEER"
    },{
      data: "kurs",
      title: "Kurs",
      name: "kurs"

    },{
      data: "von",
      title: "Von"
      //orderDataType: "niudatestring"
    },{
      data: "bis",
      title: "Bis"
      //orderDataType: "niudatestring"
    },{
      data: "ort",
      title: "Ort"
    },{
      data: "kursstatus",
      title: "Kursstatus (freie Plätze)",
      name: "kursstatus"
    },{
      data: "qualifikation",
      title: "Qualifikation",
      name: "qualifikation",
      defaultContent: ""
    },{
      data: "fortbildungsstunden",
      title: "Fortbildungsstunden",
      defaultContent: ""
    }
  ];

  //TODO: Unterscheidung, wenn EmployeeId gesetzt! einbauen!


  var tds = tabelle.find("tr:first").find("td");

  var headers;
  if (tds.length == 10) {
    //es handelt sich um die Ausbildungen eines Users
    //TODO: zusätzlich noch die Bemerkungen des Kurses für diesen User anzeigen
    //diese Bemerkungen müssen aus den CourseDetails.aspx geladen werden!

    headers = maausbheaders;
    columns.push(col_anmeldestatus);
  } else if (tds.length == 9){
    //Ausbildungen ganz normal als Suche nach Ausbildungen
    headers = ausbheaders;
  } else {
    throw "ungültige anzahl an spalten!";
  }

  tabelle.find("tr").slice(1).each(function(index) {
    var row = {};
    if ($(this).find("td").length == 1) {

    } else {


      //console.log("tds length: " + tds.length);
      $(this).find("td").each(function (index) {

        var val = $(this).text();
        //console.log("adding data: " + val + " als " + headers[index]);
        switch(index) {
            case 0: //ABZNR
              if (!(new RegExp("^.[0-9]+$").test(val))) {
                return;
              }
            case 1: //KURS
              break;
            case 2: //VON
            case 3: //BIS
              //val = val.substr(3, val.length);
              break;
            case 4: //ORT
            case 5: //Kursstatus
            case 6: //Qualifikation
            case 7: //Fortbildungsstunden
              break;
        }
        row[headers[index]] = val;

      });
      dataSet.push(row);
    }

  });

  tabelle.after("<table id='datatable'></table>");
  tabelle.hide();

 //füge date format String für die Spalten Von und Bis hinzu siehe auch: https://datatables.net/blog/2014-12-18
  $.fn.dataTable.moment('dd, D.MM.YYYY HH:mm');

  var datatable = $("#datatable").DataTable({
    data: dataSet,
    columns: columns,
    paging: false
  });
  var table = $("#datatable");
  //verändere css, damit die sorting images angezeigt werden!
  table.find(".sorting").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_both.png") + '")');
  table.find(".sorting_asc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_asc.png")  + '")');
  table.find(".sorting_desc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_desc.png")  + '")');


  table.find("tr").on("click", "a.open_course_link", function(event) {
      //open in new dialoged window...
    window.open($(this).attr("href"), '_blank');



    return false;
  })

  $("#datatable tbody tr").contextmenu(function() {
      return false;
  });

  $("#datatable tbody").on("click", "tr", function() {
    if ($(this).hasClass('selected')) {
      $(this).removeClass("selected");
    } else {
      //table.find('tr.selected').removeClass('selected');

      //$(this).addClass('selected');
    }
  });

  $.fn.dataTable.ext.search.push(
    function( settings, searchData, index, rowData, counter ) {
      var show = true;
      for (let key in activeFilters) {
        var f = activeFilters[key];
        if (f === undefined) {
          continue;
        }
        var data = {};
        for (let c of f.column_names) {
            var index = datatable.column(c + ":name").index("visible");
            //console.log("$.fn.dataTable.ext.search --> set data[c] to " + searchData[index] + " c: " + c + " index: " + index);
            data[c] = searchData[index];
        }
        //console.log("$.fn.dataTable.ext.search --> calling filter: data:" + data + "index:" + index + "rowData:" + rowData + "counter: " + counter);
        show = show && f.filter(data, index, rowData, counter); //UND verknüpfung der suchfilter
      }
      return show;
    }
);


  addSuchfilter(datatable, "frei", "Nur Kurse mit freien Plätzen", ["kursstatus"], function(searchData, index, rowData, counter) {
      //https://datatables.net/reference/api/column().search() todo: verwende regexpr
      //console.log("calling suchfilter function freie plätze --> searchData: " + searchData.kursstatus);
      const regex = /Offen(?! \(0)/g;
      //console.log("addSuchfilter --> suchfilter function freie plätze --> matches: [" + searchData.kursstatus + "] regex: " + re.toString() + " result: " + re.test(searchData.kursstatus));
      if (regex.test(searchData.kursstatus)) {
        return true;
      }
      return false;
  });

  addSuchfilter(datatable, "qualifikation_par_50", "Nur §50 Kurse", ["qualifikation"], function(searchData, index, rowData, counter) {
      //https://datatables.net/reference/api/column().search() todo: verwende regexpr
      return searchData.qualifikation.includes("§50");
  });


  addSuchfilter(datatable, "qualifikation_rea", "Nur §50 Reanimationstraining", ["qualifikation"], function(searchData, index, rowData, counter) {
      return searchData.qualifikation.includes("Reanimationstraining");
  });

  addSuchfilter(datatable, "qualifikation_rez", "Nur §51 Rezertifizierung", ["qualifikation"], function(searchData, index, rowData, counter) {
      return searchData.qualifikation.includes("Rezertifizierung");
  });

  addSuchfilter(datatable, "abznr_anrechnung", "Nur Anrechnungskurse", ["abznr"], function(searchData, index, rowData, counter) {
      return searchData.abznr.includes("A");
  });

  addSuchfilter(datatable, "abznr_keine_anrechnung", "Keine Anrechnungskurse", ["abznr"], function(searchData, index, rowData, counter) {
      return !(searchData.abznr.includes("A"));
  });

  addSuchfilter(datatable, "kurs_san_basis", "Nur SAN Basiskurse", ["kurs"], function(searchData, index, rowData, counter) {
      return  searchData.kurs.includes("BAS - Ausbildung - Das Rote Kreuz") ||
              searchData.kurs.includes("KHD-Praxistag") ||
              searchData.kurs.includes("KHD-SD-Praxis") ||
              searchData.kurs.includes("Ambulanzseminar") ||
              searchData.kurs.includes("San1-Seminar") ||
              searchData.kurs.includes("RS-Startmodul");
  });

  addSuchfilter(datatable, "kurs_kein_san", "Keine SAN Kurse", ["kurs", "qualifikation"], function(searchData, index, rowData, counter) {
      return !(searchData.qualifikation.includes("§50") || searchData.kurs.includes("SAN")); //eher mehr ein Beispiel für mehrere spalten filter
  });

  addSuchfilter(datatable, "kurs_nur_gsd", "Nur FSD", ["kurs"], function(searchData, index, rowData, counter) {
      return searchData.kurs.includes("FSD");
  });

  addSuchfilter(datatable, "kurs_nur_khd", "Nur KHD", ["kurs"], function(searchData, index, rowData, counter) {
      return searchData.kurs.includes("KHD");
  });

  addSuchfilter(datatable, "kurs_nur_fkr", "Nur FKR", ["kurs"], function(searchData, index, rowData, counter) {
      return searchData.kurs.includes("FKR");
  });

  addSuchfilter(datatable, "kurs_pflichtf", "Nur Pflichtfortbildungen", ["kurs"], function(searchData, index, rowData, counter) {
      return  searchData.kurs.includes("RD-Fortbildung");
  });

  getOwnDNRs().then(function(DNRarray) {
  $( ".mail_link" ).each(function() {
    var currentElem = $(this);
    var $tr = $(this).closest('tr');
    var data = datatable.row($tr).data();
    var courseUrl = new URL($tr.find('a').first().attr('href'), window.location.href).href;

    var primaryDNR = parseInt(DNRarray[0]);
    var ausbMail = "LRK-Ausbildung@w.roteskreuz.at";
    var reqAction = "";

    if(primaryDNR >= 1000 && primaryDNR < 2000 ) { ausbMail = "west-ausbildung@w.roteskreuz.at"; }
    else if(primaryDNR >= 2000 && primaryDNR < 3000 ) { ausbMail = "vs-ausbildung@w.roteskreuz.at"; }
    else if(primaryDNR >= 7000 && primaryDNR < 8000 ) { ausbMail = "ddl-ausb@w.roteskreuz.at"; }
    else if(primaryDNR >= 3000 && primaryDNR < 4000 ) { ausbMail = "bvs-ausbildung@w.roteskreuz.at"; }
    else if(primaryDNR >= 8000 && primaryDNR < 9000 ) { ausbMail = "nord-ausbildung@w.roteskreuz.at"; }

    if(data["anmeldestatus"] === "Angemeldet") { reqAction = "Abmeldung"; }
    else { reqAction = "Anmeldung"; }

    var subject = encodeURIComponent(`${reqAction} Kurs ${data.abznr} für DNr ${primaryDNR}`);
    var mailto = encodeURIComponent(ausbMail);
    var body = encodeURIComponent(`Liebe KollegInnen,\n\nBitte um ${reqAction} bei folgendem Kurs:\n\n`);
    body += encodeURIComponent(`ABZ Nr:\t${data.abznr}\n`);
    body += encodeURIComponent(`Titel:\t${data.kurs}\n`);
    body += encodeURIComponent(`Datum:\t${data.von}\n`);
    body += encodeURIComponent(`Link:\t${courseUrl}\n\n`);
    body += encodeURIComponent(`Danke und liebe Grüße,\nDienstnummer ${primaryDNR}`)
    var mailtoLink = `mailto:${mailto}?Subject=${subject}&Body=${body}`;
    if(data["anmeldestatus"] === "Storno") { 
      alert("Sie wurden bereits von diesem Kurs abgemeldet!"); 
    } else { 
      currentElem.attr("href", mailtoLink); 
    }
  });
 });


});
