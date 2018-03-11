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

  employee.imageUrl = new URL($('img#ctl00_main_m_ccEmployeeMain__picture').attr('src'), window.location.href).href;
  employee.url = window.location.href;
  employee.uid = getUID(window.location.href);

  employee.contacts = scrapeContactPoint($('body'), "ctl00_main_m_ccPersonContact_m_tblPersonContactMain");
  
  // Funktionen/Berechtigungen Notizen
  employee.permissions = [];
  $('.PermissionRow').each(function () {
    var permission = {};
    permission.type = $(this).find('.PermissionType').text().trim();
    permission.name = $(this).find('.PermissionName').text().trim();
    employee.permissions.push(permission);
  });

  // create notes for vCard
  employee.notes = "";
  $.each(employee.dienstnummern, function() {
    if(this.Status === "AKTIV") {
      employee.notes += "WRK Dienstnummer " + this.Dnr + " seit " + this.von + "\\n";
    }
  });
  $.each(employee.permissions, function() {
    employee.notes += this.type + ": " + this.name + "\\n";
  });
  $.each(employee.organigram, function() {
    employee.notes += this.text + "\\n";
  });
  
  console.log(employee);

  var vCard = createVCard(employee);
  console.log(vCard);

  // create file object
  var a = createVCFDownloadLink(employee, vCard);
  file = new Blob([vCard]);
  document.body.appendChild(a);
  $(a).find("img").first().css("width", "24px");
  $(a).find("img").first().css("margin", "0px 10px");
  $('h1').css("display", "inline");
  $('h1').css("vertical-align", "top");  
  $('h1').after(a);
  
// create download link for image
var a = document.createElement('a');
a.href = $('#ctl00_main_m_ccEmployeeMain__picture')[0].src;
a.download = employee.nameFull.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.png';  // set a safe file name
$('#ctl00_main_m_ccEmployeeMain__picture').wrap(a);

});
