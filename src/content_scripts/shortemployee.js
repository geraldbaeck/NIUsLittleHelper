$(document).ready(function() {

  /**
   * Encode string
   * @param  {String}     value to encode
   * @return {String}     encoded string
   */
  function e(value) {
    if (value) {
      if (typeof (value) !== 'string') {
        value = '' + value;
      }
      return value.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    }
    return '';
  }

  // Base64 image import not supported by most vcard applications
  // /**
  //  * @param  {String}   url
  //  * @param  {Function} callback
  //  * @param  {String}   [outputFormat='image/png']
  //  * @example
  //     convertImgToBase64('http://goo.gl/AOxHAL', function(base64Img){
  //         console.log('IMAGE:',base64Img);
  //     })
  //  */
  // function convertImgToBase64(url, callback, outputFormat) {
  //   var img = new Image();
  //   img.crossOrigin = 'Anonymous';
  //   img.onload = function() {
  //     var canvas = document.createElement('CANVAS');
  //     var ctx = canvas.getContext('2d');
  //     canvas.height = this.height;
  //     canvas.width = this.width;
  //     ctx.drawImage(this,0,0);
  //     var dataURL = canvas.toDataURL(outputFormat || 'image/png');
  //     callback(dataURL);
  //     canvas = null;
  //   };
  //   img.src = url;
  // }

  function scrapeEmployee() {

    // Name
    var nameString = $('#ctl00_main_shortEmpl_EmployeeName').text().trim();
    var nameFull = nameString.substring(0, nameString.indexOf('(')).trim();
    var nameArr = nameFull.split(/\s+/);
    var nameFirst = nameArr.slice(0, -1).join(' ');
    var nameLast = nameArr.pop();
    var dienstnummer = nameString.substring(nameString.indexOf('(') + 1, nameString.indexOf(')'));

    var employee = {
      FN: nameFull,
      N: nameLast + ';' + nameFirst + ';;;',
      ORG: 'Österreichisches Rotes Kreuz - Landesverband Wien',
      PROFILE: 'VCARD',
      TZ: '+0100',
      URL: window.location.href,
      REV: new Date().toISOString(),
      CATEGORIES: 'WRK,ÖRK',
      NOTE: 'WRK Dienstnummer: ' + dienstnummer,
    }

    console.log('Dienstnummer: ' + dienstnummer);
    console.log('Full Name: ' + employee.FN);

    // Foto
    var imageSrc = $('#ctl00_main_shortEmpl_EmployeeImage')[0].src;
    employee['PHOTO;TYPE=PNG'] = e(imageSrc);  // photo with url

    // query url for the UID
    $.urlParam = function () {
      var name = 'EmployeeID';
      if (window.location.href.includes('EmployeeNumberID')) {
        name = 'EmployeeNumberID';
      }
      var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
      console.log(window.location.href);
      console.log();
      return results[1] || 0;
    }
    employee.UID = 'urn:uuid:' + $.urlParam();

    // Kontaktmöglichkeiten
    $('table#ctl00_main_shortEmpl_contacts_m_tblPersonContactMain tbody tr[id]').each(function () {
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
        case 'private':
          key += 'TYPE=home';
          break;
        default:
          break;
      }
      if (key) {  // ignore Notruf Pager
        employee[key.substring(0, key.length - 1)] = $($(this).find('span[id]')[1]).text().trim();
      }
    });

    // Funktionen/Berechtigungen
    $('.PermissionRow').each(function () {
      employee.NOTE += '\\n' + $(this).find('.PermissionType').text().trim() + ': ' + $(this).find('.PermissionName').text().trim();
    });

    console.log(employee);
    return employee;
  }

  var employee = scrapeEmployee();

  var vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
  Object.keys(employee).forEach(function(key) {
    vCard += key + ':' + employee[key] + '\n';
  });
  vCard += 'END:VCARD\n'
  console.log(vCard);

  // beautify
  // $('#ctl00_main_shortEmpl_contacts_m_tblPersonContactMain tbody tr').first().remove();
  // $('td.TopContactSeperator[style*="width:13"]').hide();
  // $('td.TopContactSeperator[style*="width:40"]').hide();
  // $('span.checker').hide();

  // create file object
  file = new Blob([vCard]); //we used to need to check for 'WebKitBlobBuilder' here - but no need anymore
  // file.append(vCard); //populate the file with whatever text it is that you want
  console.log(file);

  // create download link
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(file);
  $(a).append('<img alt="Download VCF" style="margin:7px;" src="' + chrome.extension.getURL('/img/vcf32.png') + '">');
  a.download = employee.FN.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.vcf';  // set a safe file name
  a.id = 'vcfLink';
  document.body.appendChild(a);
  $('#ctl00_main_shortEmpl_permissions_ctl00').after(a);

  // create download link
  var a = document.createElement('a');
  a.href = $('#ctl00_main_shortEmpl_EmployeeImage')[0].src;
  a.download = employee.FN.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.png';  // set a safe file name
  $('#ctl00_main_shortEmpl_EmployeeImage').wrap(a);

});
