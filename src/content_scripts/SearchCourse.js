




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
        $(this).remove();
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
        $(this).remove();
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


  // /*
  // suchfeld für suche in der tabelle:
  // */
  // tabelle.before("<div><span>Suche</span><input name='tabellensuche' id='tabellensuche' type='text' maxlength='40'></div>");
  //
  // $("#tabellensuche").on('input', function() {
  //     tabelle.find("tr:even").css("background-color", "#ffffff");
  //     var text = $("#tabellensuche").val();
  //     console.log("on event: text " + text);
  //     var trs = tabelle.find("tr");
  //     trs.show();
  //     trs.not(":contains(" + text + ")").hide();
  //
  //     trs.css("background-color", "white");
  //     trs.filter(":visible").filter(":even").css("background-color", "#dddddd");
  //
  // });

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

  headers = ["abznr", "kurs", "von", "bis", "ort",
  "kursstatus", "qualifikation", "fortbildungsstunden"];

  columns = [
    {
      data: "abznr",
      title: "ABZ Nr",
      defaultContent: "LEER"
    },{
      data: "kurs",
      title: "Kurs"

    },{
      data: "von",
      title: "Von",

    },{
      data: "bis",
      title: "Bis",
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

  tabelle.find("tr").slice(1).each(function(index) {
    var row = {};
    if ($(this).find("td").length == 1) {

    } else {
      $(this).find("td").each(function (index) {
        var val = $(this).text();
        console.log("adding data: " + val + " als " + headers[index]);
        switch(index) {
            case 0:
              if (!(new RegExp("^[0-9]+$").test(val))) {
                return;
              }
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
              row[headers[index]] = val;
              break;
        }

      });
    }
    dataSet.push(row);
  });

  tabelle.after("<table id='datatable'></table>");
  tabelle.hide();

  var datatable = $("#datatable").DataTable({
    data: dataSet,
    columns: columns,
    paging: false
  });

  //verändere css, damit die sorting images angezeigt werden!
  $("#datatable").find(".sorting").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_both.png") + '")');
  $("#datatable").find(".sorting_asc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_asc.png")  + '")');
  $("#datatable").find(".sorting_desc").css("background-image", 'url("' + chrome.extension.getURL("/img/sort_desc.png")  + '")');


  // datatable = $('<table id="datatable"></table>')
  // $('#datatablediv').append(datatable);
  //
  // datatable = datatable.DataTable({
  //   destroy: true,
  //   data: dataSet,
  //   columns: columns,
  //   paging: false,
  //   fixedHeader : {
  //     header: true
  //   }
  // });

});
