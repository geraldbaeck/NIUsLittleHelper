
function cleanName(name) {
  if (name) {
    name = name.replace(/(\r\n|\n|\r)/gm, '').replace('\t', '');
    while (name.includes('  ')) {
      name = name.replace('  ', ' ').trim();
    }
  } else {
    name = '-';
  }
  return name;
}

function sanitize(str) {
  return str.replace(/[^a-z0-9\.]/gi, '_').toLowerCase();
}

// extrahiert Mitarbeiterdaten aus dem Link
// eg. <a href="javascript:SEmpFNRID('0ba9916e-e305-4df6-b318-a671013118a1');">Bäck (7822)</a>
function getEmployeeDataFromLink(link, link_identifier='EmployeeNumberID') {
  var employeeData = {
    displayName: cleanName($(link).text()),
    id: undefined,
    url: undefined
  }
  var rawID = $(link).attr('href');
  if (rawID != undefined) {
    employeeData.id = rawID.substring(rawID.indexOf('\'') + 1,rawID.lastIndexOf('\''));
    employeeData.id_identifier = link_identifier;
    employeeData.url = 'https://niu.wrk.at/Kripo/Employee/shortemployee.aspx?' + link_identifier + '=' + employeeData.id;
  }
  var nameParts = employeeData.displayName.split(' ');
  employeeData.dNr = parseInt(nameParts[nameParts.length -1].replace('(', '').replace(')', '').trim());
  employeeData.lastName = nameParts[0];
  if(nameParts.length >= 3) {
    employeeData.firstName = nameParts.slice(1, nameParts.length -1).join(' ');
  }
  return employeeData;
}

// erstellt ein Kalendar Export Element
function createCalElement(termin) {
  return createCalendar({
    options: {
      class: 'calExport',
      id: termin.id, // You can pass an ID. If you don't, one will be generated
      linkText: '<img src="' + chrome.extension.getURL('/img/addCal.png') + '" style="margin-right:0.2em;"><span style="display:table-cell;vertical-align:middle;">Export</span>',
    },
    data: termin
  });
}

// berechnet aus der angegebenen Zeitspanne im NIU (zb 18:00 - 00:00)
// die Dauer in Stunden
// currentDateString: das im NIU verwendete Datum eg. "19.03.2017"
// timeString: im Niu verwendete Zeitpsanne eg "18:00 - 00:00"
// returns hours (float)
function getDurationFromTimeString(currentDateString, timeString) {
  var startTime = timeString.substring(0, 6);
  var stopTime = timeString.substring(8, 15).trim();
  var pattern = /(\d{2})\.(\d{2})\.(\d{4})/;
  startDate = new Date(currentDateString.replace(pattern,'$3-$2-$1 ') + startTime);
  stopDate = new Date(currentDateString.replace(pattern,'$3-$2-$1 ') + stopTime);
  if (stopDate <= startDate) {
    stopDate.setDate(stopDate.getDate() + 1);  // add one day if dienst ends on the next day
  };
  var hours = Math.abs(stopDate - startDate) / 36e5;
  return hours;
}

// liest die verfügbaren Funktionen aus der Dienstplan-Tabelle aus
// header: jquery object of table header tr
function getDuties(header) {
  duties = {};
  header.find('td').each(function(key, val) {
    if ($(val).hasClass('DRCShift')) {
      duties[key.toString()] = $(val).text();
    }
  });
  return duties;
}

// gibt die spaltennummer einer tabelle für eine bestimmte headerklasse zurück
// CAVE: gibt nur die erste Spaltennummer zurück, weiter vorkommen werden ignoriert.
function getHeaderNumber(header, className) {
  var nr;
  header.find('td').each(function(key, val) {
    if ($(val).hasClass(className)) {
      nr = key;
      return false; // break the jquery.each loop (very weird)
    }
  });
  return nr;
}

// erstellt die fertige VCard
function createVCard(employee) {
  function addVCardEntry(k, v) {
    vCard += k + ":" + v + "\n";
  }

  var vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
  vCard += "ORG:Österreichisches Rotes Kreuz - Landesverband Wien\n";
  vCard += "PROFILE:VCARD\n";
  vCard += "TZ:+0100\n";
  vCard += "CATEGORIES:WRK,ÖRK\n";
  addVCardEntry("FN", employee.nameFull);
  addVCardEntry("N", employee.nameLast + ';' + employee.nameFirst + ';;;')
  addVCardEntry("URL", employee.url);
  addVCardEntry("REV", new Date().toISOString());
  addVCardEntry("PHOTO;TYPE=PNG", employee.imageUrl);
  addVCardEntry("UID", 'urn:uuid:' + employee.uid);
  addVCardEntry("NOTE", employee.notes);
  
  console.log(employee.contacts);
  $.each(employee.contacts, function() {
    addVCardEntry(this.k, this.v);
  });
  vCard += 'END:VCARD\n'
  return vCard;
}


// holt die verfügbaren MitarbeiterInnenDaten
function scrapeEmployee(jqObj, employeeLink) {
  var employee = {};

  if($(jqObj).find("title").first() !== "Error") {
    // Name
    var nameString = $(jqObj).find('#ctl00_main_shortEmpl_EmployeeName').text().trim();
    employee.nameFull = nameString.substring(0, nameString.indexOf('(')).trim();
    var nameArr = employee.nameFull.split(/\s+/);
    employee.nameFirst = nameArr.slice(0, -1).join(' ');
    employee.nameLast = nameArr.pop();
    employee.dienstnummer = nameString.substring(nameString.indexOf('(') + 1, nameString.indexOf(')'));

    console.log('Scraped:' + employee.FN + '(' + employee.dienstnummer + ')');

    // Foto
    employee.imageUrl = new URL($($(jqObj).find('#ctl00_main_shortEmpl_EmployeeImage')[0]).attr('src'), employeeLink).href;
    employee.url = employeeLink;

    employee.uid = getUID(employeeLink);

    // Funktionen/Berechtigungen Notizen
    employee.notes = 'WRK Dienstnummer: ' + employee.dienstnummer;
    $('.PermissionRow').each(function () {
      employee.notes += '\\n' + $(this).find('.PermissionType').text().trim() + ': ' + $(this).find('.PermissionName').text().trim();
    });

    employee.contacts = scrapeContactPoint(jqObj, "ctl00_main_shortEmpl_contacts_m_tblPersonContactMain");

    console.log(employee);
  }

  return employee;
}

function createVCFDownloadLink(employee, vCard) {
  var file = new Blob([vCard]);
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(file);
  $(a).append('<img alt="Download VCF" style="margin:7px;" src="' + chrome.extension.getURL('/img/vcf32.png') + '">');
  a.download = employee.nameFull.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.vcf';  // set a safe file name
  a.id = 'vcfLink';
  return a;
}

// query url for the UID
function getUID(url) {
  url = url.toLowerCase();
  var param = 'employeeid';
  if (url.includes('employeenumberid')) {
    param = 'employeenumberid';
  }
  var u = new URL(url);
  return u.searchParams.get(param);
}

// Kontaktmöglichkeiten
function scrapeContactPoint(jqObj, tid) {
  var contactPoints = [];
  var values = [];
  $(jqObj).find('table#'+ tid + ' tbody tr[id]').each(function () {
    var key;
    switch ($($(this).find('span[id]')[0]).text().split(' ')[0]) {
      case 'Telefon':
        key = 'TEL;';
        break;
      case 'Handy':
      case 'Bereitschaft':
        key = 'TEL;TYPE=cell;'
        break;
      case 'Fax':
        key = 'TEL;TYPE=fax;'
        break;
      case 'e-mail':
        key = 'EMAIL;TYPE=internet;'
        break;
      default:
        break;
    }
    switch ($($(this).find('span[id]')[0]).text().split(' ')[1]) {
      case 'geschäftlich':
      case 'WRK':
        key += 'TYPE=work;';
        break;
      case 'privat':
        key += 'TYPE=home;';
        break;
      default:
        break;
    }
    if (key) {  // ignore Notruf Pager
      var point = {};
      var value = $($(this).find('span[id]')[1]).text().trim();
      if($.inArray(value, values)<0) {  // deduplication
        point['k'] = key.substring(0, key.length - 1);
        point['v'] = value;
        contactPoints.push(point);
        values.push(value);
      }
    }
  });
  return contactPoints;
}

