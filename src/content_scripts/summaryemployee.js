$(document).ready(function() {

  var employee = {};

  // Name
  employee.anrede = $("select[name='ctl00$main$m_ccEmployeeMain$_salutation'] option:selected").text();
  employee.titleProfession = $("select[name='ctl00$main$m_ccEmployeeMain$_professionTitle'] option:selected").text();
  employee.titlePre = $("select[name='ctl00$main$m_ccEmployeeMain$_preAcademicTitle'] option:selected").text();
  employee.titlePost = $("select[name='ctl00$main$m_ccEmployeeMain$_postAcademicTitle'] option:selected").text();
  employee.nameLast = $("input[name='ctl00$main$m_ccEmployeeMain$_lastName']").val();
  employee.nameFirst = $("input[name='ctl00$main$m_ccEmployeeMain$_firstName']").val();

  employee.nameFull = employee.nameFirst + " " + employee.nameLast;
  if(employee.titleProfession!=="<Berufstitel>") {
    employee.nameFull = employee.titleProfession + " " + employee.nameFull;
  } else {
    employee.titleProfession = null;
  }
  if(employee.titlePre!=="<Titel>") {
    employee.nameFull = employee.titlePre + " " + employee.nameFull;
  } else {
    employee.titlePre = null;
  }
  if(employee.titlePost!=="<Titel>") {
    employee.nameFull += ", " + employee.titlePost;
  } else {
    employee.titlePost = null;
  }

  employee.mitarbeit = $("label[for='"+$('table#ctl00_main_m_ccEmployeeMain__employeeMain').find(":input:checked").first().attr('id')+"']").text();
  employee.dienstgrad = $("select[name='ctl00$main$m_ccEmployeeMain$_rank'] option:selected").text();

  var dienstnummerColumns = [];
  $("table.standardGridless").find("th").each(function() {
    dienstnummerColumns.push($(this).text());
  });
  employee.dienstnummern = [];
  $("table.standardGridless").find("tr:not(:first)").each(function() {
    var dienstnummerRow = [];
    var dienstnummerData = {};
    $(this).find("td").each(function(i, val) {
      dienstnummerData[dienstnummerColumns[i]] = $(this).text();
      dienstnummerRow.push($(this).text());
    });
    employee.dienstnummern.push(dienstnummerData);
  });

  employee.organigram = [];
  $("#ctl00_main_m_ccEmployeeMain__employeeMain").find("a").each(function() {
    var organigramElement = {};
    organigramElement['href'] = $(this).attr("href");
    organigramElement['text'] = $(this).text().replace(' / ', '');
    employee.organigram.push(organigramElement);
  });

  employee.imageSrc = new URL($('img#ctl00_main_m_ccEmployeeMain__picture').attr('src'), window.location.href);
  employee.url = window.location.href;
  
  console.log(employee);
  
  
  
  //var dienstnummer = nameString.substring(nameString.indexOf('(') + 1, nameString.indexOf(')'));

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
