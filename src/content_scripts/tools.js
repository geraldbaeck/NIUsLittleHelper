/*
lädt das Kürzel des Mitarbeiters aus dem chrome storage
der Mitarbeiter kann das Kürzel über den Optionen Dialog
des Plugins einstellen
*/
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


    $("#person_autocomplete").on("autocompleteselect", function(event, ui) {
        console.log("aut " + ui.item.value);

        input.find("option").removeAttr("selected");
        input.find("option:contains(" + ui.item.value + ")").attr("selected", "selected");

    });
    /*
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
erstellt dienste objekt für diesen MA
dnr - die dienstnummer
von - von diesem Datum (noch ohne Verwendung!)
bis - zu diesem Datum (noch ohne Verwendung!)
*/
function diensteForMa(dnr, von, bis) {
  // dienste[diensttyp][position][anzahl]
  //                             [stunden]
  if (von === undefined) {

  }
  if (bis === undefined) {

  }

  return new Promise(function(resolve, reject) {

    var dienste = {};

    dnrToIdentifier(dnr).then(function(ids) {

      $.get("https://niu.wrk.at/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=" + ids["EmployeeNumberID"], function(data){

          //TODO: statistik

          resolve(ids);
      });


    });
  });

}


/*
 * verwandelt die dienstnummer in die EmployeeId von NIU,
 * damit ist es dann möglich direkt auf die Employee Page zuzugreifen
 */
function dnrToIdentifier(dnr) {
    return new Promise(function(resolve, reject) {
        var post = {};
        var dict = {};

        $.get("https://niu.wrk.at/Kripo/external/ControlCenterHead.aspx", function(data) {
            var jData = $(data);

            var keyPostfix = jData.find("#__KeyPostfix").val();
            var eventvalidation = jData.find("#__EVENTVALIDATION").val(); //jData.find("input[name=__EVENTVALIDATION]").val();

            post["__KeyPostfix"] = keyPostfix;
            post["__EVENTVALIDATION"] = eventvalidation;
            post["__VIEWSTATE"] = "";
            post["__EVENTARGUMENT"] = "";

            post["m_txtEmployeeNumber"] = dnr;
            post["m_btSend"] = "Anfage Senden";

            $.ajax({
                url: "https://niu.wrk.at/Kripo/external/ControlCenterHead.aspx",
                data: post,
                type: "POST",
                success: function(data, status) {
                    var searchString = $(data).find("#m_lbtStatistik").attr("href");    // EmployeeNumberID
                    var searchString2 = $(data).find("#m_lbtEducation").attr("href");   // EmployeeId

                    var regexpr = /EmployeeNumberID=(.*)/g;
                    var regexpr2 = /EmployeeId=(.*)/g;

                    var foundIdentA = regexpr.exec(searchString);
                    var foundIdentB = regexpr2.exec(searchString2);

                    dict["ENID"] = foundIdentA[1];
                    dict["EID"] = foundIdentB[1];

                    resolve(dict);
                }
            });
        });
    });
}

/*
  berechnet diverse statistiken wie
  Dienststunden, Dienste, Dienste auf der jeweiligen positione
  aus der EmployeeDutyStatistic

  Position können sein: SEFNFR, NFR1, NFR2, SEFKTW, SAN1, SAN2, RS (SAN1 + SEFKTW + (?NFR2) + NFR1 + SEFNFR), NFS (SEFNFR + NFR1)
  //TODO: ambulanzpositionen wie H, NFS, Azubi, etc. sind noch unberücksichtigt


  empID : String - die NIU EmployeeNumberID des Mitarbeiters
  reqtype : String[] - welche Statistik soll erstellt werden
   -> unterstützt werden im Moment:
      * stunden (Anzahl der Dienststunden gruppiert nach Position)
      * dienste (Anzahl der Dienste gruppiert nach Position)
   reqStartDate - Abfragezeitraum Beginn (wird noch ignoriert!)
   reqEndDate - Abfragezeitraum Ende (wird noch ignoriert!)

*/
function calculateDutyStatistic(empID, reqtype, reqStartDate, reqEndDate) {
    return new Promise(function(resolve, reject) {
        var post = {};
        console.log("statcalc --> start");

        $.get("https://niu.wrk.at/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=" + empID, function(data) {
            console.log("calculateDutyStatistic --> rcv from get EmployeDutyStatistic.aspx");
            //console.log("statcalc --> rcv from get EmployeeDutyStatistic.aspx" + data);
            var jData = $(data);

            var keyPostfix = jData.find("#__KeyPostfix").val();
            var eventvalidation = jData.find("#__EVENTVALIDATION").val(); //jData.find("input[name=__EVENTVALIDATION]").val();

            var reqDate = new Date();
            reqDate.setMonth(reqDate.getMonth() - 6);
            var reqDatePlus = reqDate.getMonth() + 1; // Weil im Datumsobjekt Januar = 0
            var reqDateString = reqDate.getDate() + "." + reqDatePlus + "." + reqDate.getFullYear();

            var todaysDate = new Date();
            var todaysDatePlus = todaysDate.getMonth() + 1; // Weil im Datumsobjekt Januar = 0
            var todaysDateString = todaysDate.getDate() + "." + todaysDatePlus + "." + todaysDate.getFullYear();

            console.log("statcalc request dates --> FROM: " + reqDateString + " // TO: " + todaysDateString);

            post["__KeyPostfix"] = keyPostfix;
            post["__EVENTVALIDATION"] = eventvalidation;
            post["__VIEWSTATE"] = "";
            post["__EVENTARGUMENT"] = "";
            post["__EVENTTARGET"] = "ctl00$main$m_Submit";
            post["ctl00$main$m_From$m_Textbox"] = reqDateString;
            post["ctl00$main$m_Until$m_Textbox"] = todaysDateString;
            post["&ctl00$main$m_JoinBrokenDuties"] = "on";

            $.ajax({
                url: "https://niu.wrk.at/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=" + empID,
                data: post,
                type: "POST",
                success: function(data, status) {
                    console.log("statcalc --> rcv status " + status);
                    console.log("statcalc --> rcv data " + data);

                    // Weitere Schritte fuer die Berechnung
                    // Statistikseite fuer die angeforderten Daten in der Variable 'data'


                    var dienstnummer = $(data).find('h3').first().text().substring($(data).find('h3').first().text().indexOf('(')).replace('(', '').replace(')', '').trim();
                    console.log('Dienstnummer: ' + dienstnummer);


                    // create statistical counters
                    var rawWochentag = new Array();
                    var rawDienststellen = new Array();
                    var currentDateString;
                    var sumDuty = 0; // Gesamtdauer aller Dienste
                    var countDienste = 0;
                    var rawKollegen = new Array();
                    var rawDutyAs = new Array();
                    var hourDutyAs = {};
                    hourDutyAs['SEFNFR'] = 0;
                    hourDutyAs['NFR1'] = 0;
                    hourDutyAs['NFR2'] = 0;
                    hourDutyAs['SEFKTW'] = 0;
                    hourDutyAs['SAN1'] = 0;
                    hourDutyAs['SAN2'] = 0;


                    // iterate data of each row
                    var $tables = $(data).find('div.MultiDutyRoster');
                    $tables.find('table.MessageTable').each(function(i) {

                                // add placholder for statistics
                                //$(this).find('tbody tr').first().after('<tr><td><table class="DutyRoster" cellspacing="0" cellpadding="3" rules="all" border="1"><tbody><tr><td id="charts' + i + '"></td></tr></tbody></table></td></tr>');

                                // add header for duty duration
                                //$(this).find('td.DRCTime').first().after('<td class="DRCDuration" width="50px">Dauer</td>');

                                var tableType = $(this).find('td.MessageHeader').text();



                                $(this).find('table#DutyRosterTable tbody tr').each(function() {
                                    countDienste += 1;
                                    $(this).find('td').each(function(i, val) {
                                        val = val.innerHTML.replace('&nbsp;', '').replace('<em>', '').replace('</em>', '').trim();

                                        //TODO: unterscheide zwischen NFR & KTW

                                        var isKTW = tableType.includes('KTW');
                                        var isNFR = tableType.includes('RKS') || tableType.includes('RKL') || tableType.includes('RKP');


                                        switch (i) {
                                            case 0: // Wochentag
                                                rawWochentag.push(val);
                                                break;
                                            case 1: // Datum
                                                currentDateString = val;
                                                break;
                                            case 2: // Zeiten
                                                hours = getDurationFromTimeString(currentDateString, val);
                                                $(this).after('<td>' + hours + '</td>');
                                                sumDuty += hours;
                                                break;
                                            case 3: // Dienststellen
                                                rawDienststellen.push(val);
                                                break;
                                            default:
                                                break;
                                        }
                                        //TODO: den doppelten Code reduzieren durch geschicktere Anordnung if else switch

                                        var offset = 0;
                                        if (tableType.includes('geplant')) {
                                          offset = 1; //weil die spalten um eines verschoben sind! bei den geplanten Diensten fehlt die Spalte KFZ!
                                        }
                                        if (tableType.includes('fixiert')) {

                                        }

                                        switch (i + offset) {
                                                case 5: // Fahrer
                                                case 6: // SAN1
                                                case 7: // SAN2
                                                    if (!$(val).text().includes(dienstnummer) && $(val).text() !== '') {
                                                        var kollege = $(val).text().substring(0, $(val).text().indexOf('(')).trim();
                                                        rawKollegen.push(kollege);
                                                    } else if ($(val).text() !== '') {
                                                        switch (i + offset) {
                                                            case 5: // SEF
                                                                if (isNFR) {
                                                                  rawDutyAs.push('SEFNFR');
                                                                  hourDutyAs['SEFNFR'] += hours;
                                                                }
                                                                if (isKTW) {
                                                                  rawDutyAs.push('SEFKTW');
                                                                  hourDutyAs['SEFKTW'] += hours;
                                                                }
                                                                break;
                                                            case 6: // SAN1
                                                                if (isNFR) {
                                                                  rawDutyAs.push('NFR1');
                                                                  hourDutyAs['NFR1'] += hours;
                                                                }
                                                                if (isKTW) {
                                                                  rawDutyAs.push('SAN1');
                                                                  hourDutyAs['SAN1'] += hours;
                                                                }
                                                                break;
                                                            case 7: // SAN2
                                                                if (isNFR) {
                                                                  rawDutyAs.push('NFR2');
                                                                  hourDutyAs['NFR2'] += hours;
                                                                }
                                                                if (isKTW) {
                                                                  rawDutyAs.push('SAN2');
                                                                  hourDutyAs['SAN2'] += hours;
                                                                }
                                                                break;
                                                            default:
                                                                break;
                                                        }
                                                    }
                                                    break;
                                                default:
                                                    break;
                                        }

                                    });
                                });


                    //console.log("rawWochentag: " + rawWochentag);
                    //console.log("sumDuty: " + sumDuty);
                    //console.log("countDienste: " + countDienste);
                    //console.log("rawDutyAs: " + rawDutyAs);

                    //if("dienste" in reqtype) {} // Berechnung der Dienste
                    //if("stunden" in reqtype) {} // Berechnung der Stunden

                    //resolve("incomplete") //Ausgabe des Ergebnisses

                }); //ende der each schleife über die duty tabellen

                //TODO: Ambulanzen auswerten!




                // create statistical counters
                //var rawWochentag = new Array();
                //var rawDienststellen = new Array();
                //var currentDateString;
                //var sumDuty = 0; // Gesamtdauer aller Dienste
                //var countDienste = 0;
                //var rawKollegen = new Array();
                //var rawDutyAs = new Array();
                //var hourDutyAs = {};

                var duty = {};
                duty['sumDuty'] = sumDuty;
                duty['countDienste'] = countDienste;
                duty['hourDutyAs'] = hourDutyAs;
                duty['rawDutyAs'] = rawDutyAs;

                console.log("duty: " + duty);
                console.log("duty['sumDuty']: " + duty['sumDuty']);
                console.log("duty['countDienste']: " + duty['countDienste']);
                console.log("duty['hourDutyAs']: " + duty['hourDutyAs']);
                console.log("duty['rawDutyAs']: " + duty['rawDutyAs']);

                resolve(duty);
              }
            }); // $.ajax
        }); //$.get
      }); //promise
    }

function checkCourseAttendance(empID, courseDict) {

    // Function accepts courseDict in format of:
    //var courseDict = {
    //                    kurs1 : { "Name" : "Main Course Name", "altName1" : "Alternative Name 1", "altName2" : "Alternative Name 2", "absolved" : "?" },
    //                    kurs2 : { "Name" : "Main Course Name", "altName1" : "Alternative Name 1", "altName2" : "Alternative Name 2", "absolved" : "?" },
    //                    kurs3 : { "Name" : "Main Course Name", "altName1" : "Alternative Name 1", "altName2" : "Alternative Name 2", "absolved" : "?" }
    // [... unlimited additions to dictionary possible but format has to remain the same! ]
    //                  };



    return new Promise(function(resolve, reject) {
    var post = {};

        $.get("https://niu.wrk.at/Kripo/Kufer/SearchCourse.aspx?EmployeeId=" + empID, function(data) {
            var jData = $(data);

            var keyPostfix = jData.find("#__KeyPostfix").val();
            var eventvalidation = jData.find("#__EVENTVALIDATION").val(); //jData.find("input[name=__EVENTVALIDATION]").val();

            var todaysDate = new Date();
            var todaysDatePlus = todaysDate.getMonth() + 1; // Weil im Datumsobjekt Januar = 0
            var todaysDateString = todaysDate.getDate() + "." + todaysDatePlus + "." + todaysDate.getFullYear();

            post["__KeyPostfix"] = keyPostfix;
            post["__EVENTVALIDATION"] = eventvalidation;
            post["__VIEWSTATE"] = "";
            post["__EVENTARGUMENT"] = "";
            post["__EVENTTARGET"] = "ctl00$main$m_Search";
            post["ctl00$main$m_From$m_Textbox"] = "01.01.1995";
            post["ctl00$main$m_Until$m_Textbox"] = todaysDateString;
            post["ctl00$main$m_Options$0"] = "on";
            post["ctl00$main$m_Options$2"] = "on";
            post["ctl00$main$m_Options$5"] = "on";
            post["ctl00$main$m_CourseName"] = "";


            $.ajax({
                url: "https://niu.wrk.at/Kripo/Kufer/SearchCourse.aspx?EmployeeId=" + empID,
                data: post,
                type: "POST",
                success: function(data, status) {

                    var absolvedCourses = [];
                    
                    $(data).find(".CourseTitel").each(function(index, element) {
                    absolvedCourses.push($(element).text());
                    });

                    for(var course in courseDict) {
                    
                    var found = false;

                    if($.inArray(courseDict[course].Name, absolvedCourses) !== -1) { found = true; }
                    if($.inArray(courseDict[course].altName1, absolvedCourses) !== -1) { found = true; }
                    if($.inArray(courseDict[course].altName2, absolvedCourses) !== -1) { found = true; }

                    if(found === true) { courseDict[course].absolved = "ja"; } else { courseDict[course].absolved = "nein"; }

                    }
                    resolve(courseDict) //Ausgabe des Ergebnisses

                }
            });
      });
    });
}