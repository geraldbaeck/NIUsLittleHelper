$(document).ready(function() {

  console.log('Hello Today.aspx');

  function getPerson(p) {
    var person = {Wunschmeldung: false};
    if (p.includes('Wunschmeldung')) {
      person.Wunschmeldung = true;
      p = $.parseHTML(p.replace('<br>', '').replace('\n', '').trim())[1];
    }
    if (p) {
      var nameStr = $(p).text().trim();
      person.id = $(p).attr('href').replace("javascript:SEmpFNRID('", '').replace("');", '');
      person.dienstnummer = nameStr.substring(nameStr.indexOf('(') + 1, nameStr.indexOf(')'));
      person.name = nameStr.replace('(' + person.dienstnummer + ')', '').trim();
      $.get('https://niu.wrk.at/Kripo/Employee/shortemployee.aspx?EmployeeNumberID=' + person.id, function(data) {
        console.log('User loaded.');
        console.log(data);
      });
      return person;
    }
  }

  // scrapes the table data
  // and enriches the rows with metadata
  // to enable filtering
  function scrapeTables() {

    // Dienste
    var dienste = [];
    $('.MessageTable').each(function() {
      var dienstTyp = $(this).find('.MessageHeader').first().text().replace('fixiert', '').replace('geplant', '').trim();
      var columnShift = 0;
      if ($(this).find('.MessageHeader').first().text().includes('fixiert')) {
        columnShift = 1;
      }
      $(this).find('.DutyRosterItem').each(function() {
        var dienst = {typ: dienstTyp};
        dienst.id = $(this).attr('id');
        $(this).find('td').each(function(key, val) {
          val = val.innerHTML.replace('&nbsp;', '').replace(new RegExp('<em>', 'g'), '').replace(new RegExp('</em>', 'g'), '').trim();
          switch (key) {
            case 0:  //Wochentag
              dienst.datumStr = val + ', ';
              break;
            case 1:
              dienst.datumStr += val;
              break;
            case 2:  // Uhrzeit
              dienst.zeit = val;
              break;
            case 3:  // Ort
              dienst.ort = val;
              break;
            case 3 + columnShift:
              if (columnShift === 1) {
                dienst.auto = val;
              }
              break;
            case 4 + columnShift:
              dienst.SEF = getPerson(val);
              break;
            case 5 + columnShift:
              dienst.SAN1 = getPerson(val);
              break;
            case 6 + columnShift:
              dienst.SAN2 = getPerson(val);
              break;
            default:
              break;
          }
        });
        dienste.push(dienst);
      });
    });
    console.log(dienste);

    return dienste;
  }

  dienste = scrapeTables();
  chrome.storage.sync.set({NIUDienste: dienste}, function() {
    console.log('Dienste saved.');
  });

});
