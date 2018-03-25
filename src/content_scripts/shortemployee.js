$(document).ready(function() {

  var $obj = $('body');
  var employee = scrapeEmployee($obj, window.location.href);

  var vCard = createVCard(employee);

  var a = createVCFDownloadLink(employee, vCard);
  document.body.appendChild(a);
  $('#ctl00_main_shortEmpl_permissions_ctl00').after(a);
  

  // create download link for image
  var a = document.createElement('a');
  a.href = $('#ctl00_main_shortEmpl_EmployeeImage')[0].src;
  a.download = employee.nameFull.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.png';  // set a safe file name
  $('#ctl00_main_shortEmpl_EmployeeImage').wrap(a);

});
