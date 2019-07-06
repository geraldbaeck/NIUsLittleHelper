$(document).ready(function() {

  function filterTable() {
    $('.filterForm').each(function() {
      if($(this).is(':checked'))
        $('tr[status="' + $(this).attr("status") + '"]').show();
      else
        $('tr[status="' + $(this).attr("status") + '"]').hide();
    })
  }

  console.log("NUIslittlehelper: intranet script started");
  if ($('#breadcrumbs').text().includes("Fahrzeugtagebuch")) {
    let states = new Set();
    let categories = new Set();
    let priorities = new Set();
    $('.table-wrap tbody tr').each(function() {
      if (!$(this).text().includes('(Meldung)')) {

        // look for checked state
        let status = $(this).find('td').eq(6).find('.checked').text();
        $(this).attr('status', sanitize(status));
        states.add(status);

        // // look for checked category
        // let category = $(this).find('td').eq(5).find('li.checked').first().text();
        // $(this).attr('category', sanitize(category));
        // categories.add(category);

        // // look for checked priority
        // let priority = $(this).find('td').eq(4).find('.checked').text();
        // $(this).attr('priority', sanitize(priority));
        // priorities.add(priority);

        
        for(let i=4; i<=6; i++) {
          $(this).find('td').eq(i).find('li').not('.checked').hide();  // hide unchecked items
          $(this).find('td').eq(i).find('li').css('padding-left', '0px').css('background-size', '0px');  // hide all checkboxes
        }

      }
    });

    // Layout
    $('ul.inline-task-list').css('margin-left', '0px').css('padding-left', '18px');
    $('span:contains("Mittel")').css('cssText', 'color: orange !important').addClass('status-macro aui-lozenge');
    $('span:contains("Hoch")').css('cssText', 'color: red !important').addClass('status-macro aui-lozenge');
    $('span:contains("Niedrig")')
      .add('li:contains("Allgemeines")')
      .add('li:contains("Havarie (UDS)")')
      .add('li:contains("Kommunikationstechnik")')
      .add('li:contains("Medizinprodukt")')
      .add('li:contains("Fahrzeugtechnik")')
      .css('padding-left', '5px')
      .addClass('status-macro aui-lozenge conf-macro output-inline');

    // add checkboxes to table header
    let divs = new Array();
    states.forEach(function(status) {
      let div = '<div><input type="checkbox" checked="True" class="filterForm" status="' + sanitize(status) + '" style="margin-left:0px;"><span style="font-weight:normal;color:black;">' + status.toLowerCase() + '</span></div>';
      divs.push(div);
    });
    $('th:contains("Status")').append('<div>' + divs.join('') + '</div>');

    divs = new Array();
    categories.forEach(function(category) {
      let div = '<div><input type="checkbox" checked="True" class="filterForm" category="' + sanitize(category) + '" style="margin-left:0px;"><span style="font-weight:normal;color:black;">' + category + '</span></div>';
      divs.push(div);
    });
    $('th:contains("Kategorie")').append('<div>' + divs.join('') + '</div>');

    divs = new Array();
    priorities.forEach(function(priority) {
      let div = '<div><input type="checkbox" checked="True" class="filterForm" priority="' + sanitize(priority) + '" style="margin-left:0px;"><span style="font-weight:normal;color:black;">' + priority.toLowerCase() + '</span></div>';
      divs.push(div);
    });
    $('th:contains("Priorität")').append('<div>' + divs.join('') + '</div>');

  }

  $(document.body).delegate('.filterForm', 'change', function() {
    filterTable();
  });

});