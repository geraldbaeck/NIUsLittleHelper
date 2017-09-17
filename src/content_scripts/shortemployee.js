$(document).ready(function() {

  var $obj = $('body');
  var employee = scrapeEmployee($obj, window.location.href);

  var vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
  Object.keys(employee).forEach(function(key) {
    vCard += key + ':' + employee[key] + '\n';
  });
  vCard += 'END:VCARD\n'
  console.log(vCard);

  // create file object
  file = new Blob([vCard]); //we used to need to check for 'WebKitBlobBuilder' here - but no need anymore
  // file.append(vCard); //populate the file with whatever text it is that you want
  // console.log(file);

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
