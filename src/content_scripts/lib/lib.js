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
