




var kursauswahl;
var kurssuche;


//var STORAGE_KEY_SEARCH_COURSE_HIDE_SEARCH = "niu_search_course_hide_search";
//var STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE = "niu_search_course_hide_choose";


//verstecke Kursauswahl und speichere status
function hideKursauswahl() {
  var set = {};
  set[STORAGE_KEY_SEARCH_COURSE_HIDE_CHOOSE] = true;
  chrome.storage.sync.set(set, function() {
    kursauswahl.hide();
    var einblenden = $("<h5 class='einblenden'><a>Kursauswahl einblenden</a></h5>");
    $(".Whitebox").prepend(einblenden);
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
    $(".Whitebox").append(einblenden);
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
  kursauswahl = $(".Whitebox table tr").slice(0,4);
  kurssuche = $(".Whitebox table tr").slice(4);

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
            $("#ctl00_main_m_Options_0").prop("checked", "true"); //setze qualifikationen anzeigen
            $("#ctl00_main_m_Options_5").prop("checked", "true"); //setze auch anrechnungskurse anzeigen!

            $("#ctl00_main_m_Search").click();
        }
    });
  }


  var mail = "stephan@spindler.priv.at";
  function generateMailLink(data, type, full, meta) {
    //TODO: hole korrekte mailadresse!

      //TODO: wer bin ich?
      //TODO: welche ausbildung brauche ich?

    var mailto = "mailto:" + mail + "?" + $.param({
      subject : "Anmeldung Kurs " + data,
      body: "Bitte um Anmeldung zu " + data
    });

    if (experimentalActivated()) {
      return "<a href='" + mailto + "'>anmelden</a>";
    } else {
      return "";
    }

  }


  //DATATABLE
  var headers = new Array;
  var dataSet = new Array;
  var columns = new Array;

  // tabelle.find("tr:first .MessageHeaderCenter").each(function(index) {
  //     console.log("init dataset --> index " + index + " mit th " + $(this).text());
  //
  //     headers.push($(this).text());
  //     if ($(this).text().length > 2) {
  //       columns.push({
  //         data: $(this).text(),
  //         title: $(this).text(),
  //         defaultContent: ""
  //       });
  //     }
  // });

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
        return '<a class="open_course_link" href="/Kripo/Kufer/CourseDetail.aspx?CourseID=' + data + '">open</a>';
      }
    },{
      data: "abznr",
      render: generateMailLink,
    },
    {
      data: "abznr",
      title: "ABZ Nr",
      defaultContent: "LEER"
    },{
      data: "kurs",
      title: "Kurs"

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
      title: "Kursstatus (freie Plätze)"
    },{
      data: "qualifikation",
      title: "Qualifikation",
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


      console.log("tds length: " + tds.length);
      $(this).find("td").each(function (index) {

        var val = $(this).text();
        console.log("adding data: " + val + " als " + headers[index]);
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


  // $.get(chrome.extension.getURL("/src/webcontent/search_course_course_context_menu.html"))
  // .then(function(data){
  //
  //
  // });




});
