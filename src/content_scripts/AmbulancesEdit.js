$(document).ready(function() {

    var scrapeAmbulance = function() {
      var ambulance = {
        url: window.location.href,
        queryDate: new Date()
      };
      ambulance.title = $('h2:first').text().trim() || $('#ctl00_main_m_AmbulanceDisplay_m_Description').text().trim();
      ambulance.id_original = $('#ctl00_main_m_AmbulanceDisplay_m_Number').text().trim();
      ambulance.sub = parseInt($('#ctl00_main_m_AmbulanceDayDisplay_m_SubNumber').text().trim());
      ambulance.id = ambulance.id_original.replace('/', '_') + '_' + ambulance.sub;
      // TODO Einfügen der Url funktioniert nicht Google oder ouical trennen die url nach dem & ab
      // WORKAROUND shortener verwenden
      // ambulance.description = ambulance.url + '\r\n\r\n' + $('#ctl00_main_m_AmbulanceDisplay_m_Webinfo').text().trim();
      ambulance.description = $('#ctl00_main_m_AmbulanceDisplay_m_Webinfo').text().trim();
      ambulance.address = $('#ctl00_main_m_AmbulanceDisplay_m_Ort').text();
      ambulance.start = moment($('#ctl00_main_m_AmbulanceDayDisplay_m_StartWork', '').text().split(',')[1].trim(), 'D.M.YYYY H:mm', 'de').toDate();
      ambulance.end = moment($('#ctl00_main_m_AmbulanceDayDisplay_m_EndWork').text().split(',')[1].trim(), 'D.M.YYYY H:mm', 'de').toDate();

      /* var headers = $('table[id=ctl00_main_m_AmbulanceDayInfo_ctl00_m_Table] tr.DutyRosterHeader').find('td').map(function() { 
        return $(this).text().trim();
      }).get(); */

      ambulance.employees = [];
      $("table[id^='ctl00_main_m_AmbulanceDayInfo_ctl'][id$='_m_AmbulanceFunctionDisplay_m_Table']").each(function() {
        var employee = {};
        var firstRow = $(this).find('tr').first().find('td');
        var verwendung = firstRow.first().text().split('/');
        employee.Position = verwendung[0].trim();
        employee.Funktion = verwendung[1].trim();
        employee.dNr = parseInt(firstRow.eq(1).text().trim());
        var name = getEmployeeDataFromLink(firstRow.eq(2).find('a').first(), 'EmployeeID');
        employee.Name = name;
        employee.Dienststelle = firstRow.eq(3).text().trim();
        var abfahrt = firstRow.eq(4).text().split('(');
        employee.Abfahrt = {};
        employee.Abfahrt.Ort = abfahrt[0].trim();
        employee.Abfahrt.Zeitpunkt = moment(abfahrt[1].replace(')', '').trim(), 'D.MM.YYYY HH:mm').toDate();
        employee.Anmerkung = $(this).find('span[id$="_m_AmbulanceFunctionDisplay_m_FunctionNotes"]').first().text().trim();
        ambulance.employees.push(employee);
      });

      // Termin export unter der Überschrift für single event Termine
      var cal = createCalElement(ambulance);
      $('h1:first').append('<div id="exportCal_' + ambulance.id + '"></div>');
      $('#exportCal_' + ambulance.id).append(cal);

      return ambulance;
    };

    function _getEmailsfromEmployeeData(employee, displayName) {
      var emails = Array();
      // email Format: "Fred Foo"<foo@example.com>
      $.each(employee.contacts, function() {
        if(this.k.indexOf("EMAIL") === 0) {
          emails.push('"' + displayName + '"<' + this.v + '>');
        }
      });
      return emails;
    }

    function _getPhoneFromVcard(vcard) {
      var fon;
      var propertyNames = Object.keys(vcard).filter(function (propertyName) {
        if(propertyName.indexOf("TEL;TYPE=cell") === 0) {
          fon = vcard[propertyName];
        }
      });
      return fon;
    }

    function _createAndOpenEmail(emails, ambulance, body='Liebe KollegInnen,\n\n', focus='bcc') {
      var bcc = emails.join(',');
      moment().locale('de');
      var subject = ambulance.title + " am " + moment(ambulance.start).format('dd, D.M.YY') + " (" + ambulance.id_original + ")";
      var link = 'mailto:?' + focus + '=' + encodeURIComponent(bcc) + '&subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.open(link, target='_blank');
    }

    var spamEveryone = function(ambulance) {
      var spinner = new Spinner().spin()  // options see http://spin.js.org
      $('body').after(spinner.el);

      var requests = Array();
      var members = Array();
      $('a[href^="Javascript:SEmpFID"]').each(function() {
        var member = getEmployeeDataFromLink(this, 'EmployeeID');
        members.push(member);
        requests.push($.get(member.url));
      });

      var defer = $.when.apply($, requests);
      defer.done(function(){
          // This is executed only after every ajax request has been completed

          var emails = Array();
          $.each(arguments, function(index, responseData){
              // "responseData" will contain an array of response information for each specific request
              var employee = scrapeEmployee($.parseHTML(responseData[0]), members[index].url);
              Array.prototype.push.apply(emails, _getEmailsfromEmployeeData(employee, members[index]['displayName']));
          });

          if (emails.length > 0) {
            _createAndOpenEmail(emails, ambulance);
          } else {
            alert("Leider wurden keine Emails gefunden.");
          }

          spinner.stop();
      });
    }

    var mailToSomeone = function(ambulance, e) {
      var spinner = new Spinner().spin()  // options see http://spin.js.org
      $('body').after(spinner.el);

      var member = getEmployeeDataFromLink($(e).parent().find('a').first(), 'EmployeeID');
      $.get(member.url, function(data) {
        var employee = scrapeEmployee($.parseHTML(data), member.url);
        var emails = _getEmailsfromEmployeeData(employee, member['displayName']);

        if (emails.length > 0) {
          var body = 'Hallo ' + employee.nameFirst + ',\n\n'
          _createAndOpenEmail(emails, ambulance, body, 'to');
        } else {
          alert("Leider wurde für " + member['displayName'] + " keine Email gefunden.");
        }

        spinner.stop();
      })
    }

    var textToSomeone = function(ambulance, e) {
      var spinner = new Spinner().spin()  // options see http://spin.js.org
      $('body').after(spinner.el);

      var member = getEmployeeDataFromLink($(e).parent().find('a').first(), 'EmployeeID');
      $.get(member.url, function(data) {
        var employee = scrapeEmployee($.parseHTML(data), member.url);
        var fon = _getPhoneFromVcard(employee);

        if (fon) {
          window.open("https://api.whatsapp.com/send?phone=" + fon.replace(/[^0-9]/g, ''))
        } else {
          alert("Leider wurde für " + member['displayName'] + " keine Telefonnummer gefunden.");
        }

        spinner.stop();
      })
    }

    var createSheet = function(ambulance, e) {

      $.modal.close();

      var spinner = new Spinner().spin()  // options see http://spin.js.org
      $('body').after(spinner.el);

      var saveData = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (blob, fileName) {
            var url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
      }());

      function s2ab(s) { 
        var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
        var view = new Uint8Array(buf);  //create uint8array as viewer
        for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
        return buf;    
      }

      // create Workbook
      var wb = XLSX.utils.book_new();
      wb.Props = {
        Title: ambulance.title + " " + ambulance.id_original,
        Subject: "Test",
        Author: "WRK",  // TODO: add current User as author
        CreatedDate: new Date(),
      };

      var requests = Array();
      if($("#excelExportModal input:checkbox:checked").length > 0) {

        // create download links
        $.each(ambulance.employees, function(index, amb_mitarbeiter) {
          requests.push($.get(amb_mitarbeiter.Name.url));
        });

        // download all member data
        var defer = $.when.apply($, requests);

        // executed after all downloads completed
        defer.done(function() {
          $.each(arguments, function(index, responseData){
            // "responseData" will contain an array of response information for each specific request
            if(responseData !== undefined && ambulance.employees[index].Name.url !== undefined) {
              var employee = scrapeEmployee(parseHTMLOnly(responseData[0]), ambulance.employees[index].Name.url);
              ambulance.employees[index].permissions = employee.permissions;
              ambulance.employees[index].contacts = employee.contacts;
              ambulance.employees[index].phone = getDefaultPhone(employee.contacts);
              ambulance.employees[index].email = getDefaultEmail(employee.contacts);
            }
          });


          // create sheet header
          var ws_header = [
            "Position",
            "Funktion",
            "dNr",
            "Nachname",
            "Vorname",
          ];
          if ($('#chk_handy:checkbox:checked').length > 0)  ws_header.push("tel");          
          if ($('#chk_email:checkbox:checked').length > 0) ws_header.push("Email");          
          if ($('#chk_einsatzverwendung:checkbox:checked').length > 0)  ws_header.push("Einsatzverwendung");          
          if ($('#chk_san:checkbox:checked').length > 0)  ws_header.push("SAN");          
          if ($('#chk_sang:checkbox:checked').length > 0)  ws_header.push("SanG");          
          if ($('#chk_fahrerrd:checkbox:checked').length > 0)  ws_header.push("Fahrer RD"); 
          ws_header = ws_header.concat(["Url", "Ort", "Zeitpunkt", "Anmerkung"]);
          var ws_data = [ws_header];

          // add sheet data
          $.each(ambulance.employees, function() {
            var ws_row = [];
            ws_row.push(this.Position);
            ws_row.push(this.Funktion);
            ws_row.push(this.dNr);
            ws_row.push(this.Name.lastName);
            ws_row.push(this.Name.firstName);
            if ($('#chk_handy:checkbox:checked').length > 0) ws_row.push(this.phone);
            if ($('#chk_email:checkbox:checked').length > 0) ws_row.push(this.email);
            if (this.permissions == undefined) {
              this.permissions = {};
            }
            if ($('#chk_einsatzverwendung:checkbox:checked').length > 0) ws_row.push(this.permissions.Einsatzverwendung);
            if ($('#chk_san:checkbox:checked').length > 0) ws_row.push(this.permissions.SAN);
            if ($('#chk_sang:checkbox:checked').length > 0) ws_row.push(this.permissions.SanG);            
            if ($('#chk_fahrerrd:checkbox:checked').length > 0) ws_row.push(this.permissions["Fahrer RD"]);                    
            ws_row.push(this.Name.url);
            ws_row.push(this.Abfahrt.Ort);
            console.log(this.Abfahrt.Zeitpunkt);
            ws_row.push(this.Abfahrt.Zeitpunkt);
            ws_row.push(this.Anmerkung);
            ws_row.push({ Target:"http://sheetjs.com", Tooltip:"Find us @ SheetJS.com!" });
            ws_data.push(ws_row);
          });

          // Add sheet to workbook
          var sheetName = "Subtag " + ambulance.sub; // creates Subtag Sheet
          wb.SheetNames.push(sheetName);
          var ws = XLSX.utils.aoa_to_sheet(ws_data);
          console.log(ws);
          wb.Sheets[sheetName] = ws;
          
          // Save Sheet as File
          var fileName = sanitize(`${ambulance.title}_${ambulance.id_original}.xlsx`);
          var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
          var blob = new Blob([s2ab(wbout)],{type:"application/octet-stream"});
          saveData(blob, fileName);

          spinner.stop();
        });
      }
    }

    var ambulance = scrapeAmbulance();

    // Hidden Modal for Excel export
    $('body').append("<div id='excelExportModal' class='modal'></div>");
    $('div#excelExportModal').append('<h2>Excel Export Optionen</h2>');
    $('div#excelExportModal').append('<input type="checkbox" id="chk_einsatzverwendung" style="margin-left:1.5em;margin-right:0.2em;vertical-align:middle;" checked>Einsatzverwendung</input><br/>');
    $('div#excelExportModal').append('<input type="checkbox" id="chk_san" style="margin-left:1.5em;margin-right:0.2em;vertical-align:middle;" checked>SAN</input><br/>');
    $('div#excelExportModal').append('<input type="checkbox" id="chk_sang" style="margin-left:1.5em;margin-right:0.2em;vertical-align:middle;" checked>SanG</input><br/>');
    $('div#excelExportModal').append('<input type="checkbox" id="chk_fahrerrd" style="margin-left:1.5em;margin-right:0.2em;vertical-align:middle;" checked>Fahrer RD</input><br/>');
    $('div#excelExportModal').append('<input type="checkbox" id="chk_handy" style="margin-left:1.5em;margin-right:0.2em;vertical-align:middle;" checked>Handy</input><br/>');
    $('div#excelExportModal').append('<input type="checkbox" id="chk_email" style="margin-left:1.5em;margin-right:0.2em;vertical-align:middle;" checked>Email</input><br/>');
    $('div#excelExportModal').append('<a href="#" id="createSheet" class="button">Download</a>');
    

    $('h1').append('<a href="#" id="spamspamspam">' + mailImage + '<span style="position:relative;top:1px;left:1px;">Kalender</span></a>')

    $('h1').append('<br /><a href="#excelExportModal" rel="modal:open">' + xlsxImage + '<span style="position:relative;top:1px;left:1px;">Excel</span></a>')

    $('a[href^="Javascript:SEmpFID"]').each(function() {
      $(this)
        .after('<a href="#" style="float: right;" class="mailToSomeone">' + mailImage + '</a>')
        .after('<a href="#" style="float: right;" class="textToSomeone">' + whatsappImage + '</a>')
    });

    $("#spamspamspam").click(function(e) {
      e.preventDefault();
      spamEveryone(ambulance);
    });

    $(".mailToSomeone").click(function(e) {
      e.preventDefault();
      mailToSomeone(ambulance, this);
    })

    $(".textToSomeone").click(function(e) {
      e.preventDefault();
      textToSomeone(ambulance, this);
    })

    $("#createSheet").click(function(e) {
      e.preventDefault();
      createSheet(ambulance, this);
    })

  });
