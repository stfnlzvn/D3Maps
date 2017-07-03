'use strict'

var table = (function(t){

	var month_name = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

	function toTitleCase(str)	{
	    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	}

	var elemID = '.table-c';


  function get_cols(data) { 
    var cols = [];

    //Repopulating column definitions
    for(var key in data[0]){
      if (data[0].hasOwnProperty(key)){
        cols.push({
          field: key,
          name: toTitleCase(key.replace(/_/g, " ")),
          headerName: toTitleCase(key.replace(/_/g, " "))

        });
      }
    }
    
    return (cols);
  }


  function tabulate(data, columns, title, footer) {
  	d3.select(elemID + ' table').remove();

  	if(title){
  		d3.select(elemID).html('<h6>' + title);
  	}
		var table = d3.select(elemID)
									.append('table');

		var thead = table.append('thead');
		var	tbody = table.append('tbody');

		// append the header row
		thead.append('tr')
		  .selectAll('th')
		  .data(columns).enter()
		  .append('th')
		  	.attr('id', function (column) { return column.replace(/\s+/g, '-').toLowerCase(); })
		  	.attr('class', function (column) { return column.replace(/\s+/g, '-').toLowerCase(); })
		    .text(function (column) { return column; });

		    
		if(footer){

			var	tfoot = table.append('tfoot');	
			tfoot.append('tr')
			  .selectAll('th')
			  .data(columns).enter()
			  .append('th')
			  	.attr('id', function (column) { return column.replace(/\s+/g, '-').toLowerCase(); })
			  	.attr('class', function (column) { return column.replace(/\s+/g, '-').toLowerCase(); })
			    .text(function (column) { return column; });

		}


		// create a row for each object in the data
		var rows = tbody.selectAll('tr')
		  .data(data)
		  .enter()
		  .append('tr')
		  .on('mouseenter', mouseenter)
		  .on('mouseleave', mouseleave);

		// create a cell in each row for each column
		var cells = rows.selectAll('td')
		  .data(function (row) {
		    return columns.map(function (column) {
		      return {column: column, value: row[column]};
		    });
		  })
		  .enter()
		  .append('td')
		  	.attr('headers', function (d) { return d.column.replace(/\s+/g, '-').toLowerCase(); })
		  	.attr('class', function (d) { return d.column.replace(/\s+/g, '-').toLowerCase(); })
		    .text(function (d) { return d.value; });

		// Re-size the tbody so it overlays the table neatly
		var t_height = $(elemID + ' table').outerHeight(),
			h_height = $(elemID + ' thead').outerHeight(),
			c_height = $(elemID).outerHeight();

		if(t_height){
			$(elemID + ' table tbody').height(t_height - h_height);
		}	

	  return table;

	  function mouseenter(nodes,d,i){
	  	d3.select(this)
	  		.classed('active-row', true);
	  	var mnth = month_name.indexOf(nodes['Month (2015)']) + 1;
	  	histo.toggle_bar(mnth, true);

	  }

	   function mouseleave(nodes,d,i){
	  	d3.select(this)
	  		.classed('active-row', false);
	  	var mnth = month_name.indexOf(nodes['Month (2015)']) + 1;
	  	histo.toggle_bar(mnth, false);
	  }
	}



  t.init = function(data){

  	// Rename the keys to the desired field namess
  	data = data.sort(function(a,b){ 		return d3.ascending(a.mnth, b.mnth) || d3.ascending(a.crime_type, b.crime_type);  	})
  		.map(function(e){
	  		var d = {};
	  		d.ID = e.row_no;
	  		//d.mnth = e.mnth;
	  		d['Month (2015)'] = month_name[e.mnth-1];
	  		d['Location (on or near)'] = e.location
	  		d['Crime Type'] = e.crime_type;
	  		d['Last Outcome'] = e.last_outcome;
	  		return d;
	  	});
  	var cols = get_cols(data);

  	
		// render the table(s)
		tabulate(data, cols.map(function(e){return e.field})); // 2 column table

  }

  

	return t;

})(table || {})