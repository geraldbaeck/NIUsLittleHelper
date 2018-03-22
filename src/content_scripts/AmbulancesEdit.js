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

      var headers = $('table[id=ctl00_main_m_AmbulanceDayInfo_ctl00_m_Table] tr.DutyRosterHeader').find('td').map(function() { 
        return $(this).text().trim();
      }).get();
      console.log(headers);

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
      console.log(emails);
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
      console.log(member);
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
      console.log(member);
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
      var spinner = new Spinner().spin()  // options see http://spin.js.org
      $('body').after(spinner.el);

      function s2ab(s) { 
        var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
        var view = new Uint8Array(buf);  //create uint8array as viewer
        for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
        return buf;    
      }

      console.log(ambulance);

      var wb = XLSX.utils.book_new();
      wb.Props = {
        Title: ambulance.title + " " + ambulance.id_original,
        Subject: "Test",
        Author: "WRK",  // TODO: add current User as author
        CreatedDate: new Date(),
      };

      var sheetName = "Subtag " + ambulance.sub; // creates Subtag Sheet
      wb.SheetNames.push(sheetName);

      var ws_data = [];
      $.each(ambulance.employees, function() {
        console.log(this);
        var ws_row = [];
        ws_row.push(this.Position);
        ws_row.push(this.Funktion);
        ws_row.push(this.dNr);
        ws_row.push(this.Name.firstName);
        ws_row.push(this.Name.lastName);
        ws_row.push(this.Abfahrt.Ort);
        ws_row.push(this.Abfahrt.Zeitpunkt);
        ws_row.push(this.Anmerkung);
        ws_data.push(ws_row);
      });
      var ws = XLSX.utils.aoa_to_sheet(ws_data);
      

      var fileName = sanitize(`${ambulance.title}_${ambulance.id_original}.xlsx`);
      wb.Sheets[sheetName] = ws;
      var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
      saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), fileName)

      spinner.stop();
    }

    var ambulance = scrapeAmbulance();

    $('h1').append('<a href="#" id="spamspamspam">' + mailImage + '<span style="position:relative;top:1px;left:1px;">Mail an Alle</span></a>')

    $('h1').append('<br /><a href="#" id="createSheet"><span style="position:relative;top:1px;left:1px;">In Excel Exportieren</span></a>')

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
