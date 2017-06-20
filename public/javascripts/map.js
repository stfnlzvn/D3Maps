var Map = (function(m){

	var cur_zoom = 12,
		infowindow,
		map,
	  prev_zoom = cur_zoom,
	  projection,
	  marker_radius = d3.scaleLinear().range([10, 26]).clamp(true),
	  padding = 10,
	  overlay = new google.maps.OverlayView(),
	  layer,
	  cur_bounds ='',
	  month_name = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];



	m.init = function(){


	  map = new google.maps.Map(d3.select("#map").node(), {
	    zoom: cur_zoom,
	    center: new google.maps.LatLng(53.4808, -2.2426),
	    clickableIcons: false,
	    gestureHandling: 'greedy',
	    //'styles': styles,
	    //mapTypeId: google.maps.MapTypeId.TERRAIN,
	    maxZoom: 20,
	    minZoom: 7
	  });

	  map.addListener('bounds_changed', function(){
	  	window.setTimeout(function() {
	      m.drawLimited(map);
	    }, 3000);
	  	
	  	//console.log('on bounds_changed');
	  });



    // Add the container when the overlay is added to the map.
    overlay.onAdd = function() {     

      // Draw each marker as a separate SVG element.
      overlay.draw = function() {

      	//map.fitBounds(new_bounds);
      	if(!layer){
		      layer = d3.select(this.getPanes().overlayMouseTarget)
		      	.append("div")
		        .attr("class", "crimes");	
      	}

				prev_zoom = cur_zoom;
				
				//console.log('on Draw');

				projection = this.getProjection();
				m.drawLimited(map);

      }// onDraw


    }// onAdd

    // Bind overlay to the map…
    overlay.setMap(map);

	}// init


	// Limit the rate at which the map is re-drawn to improve UX and reduce load on the server
  var timer = null;
  m.drawLimited = function(map){
    var delay = 1000;
    function processQueue() {
      m.draw(map);
      timer = null;
    }

    if (!timer) {
      processQueue();
      timer = setTimeout(processQueue, delay);
    }
  }



	m.draw = function(map){
  	// Get bounds to request data for the current map extents
  	var bounds = map.getBounds(),
				ne = bounds.getNorthEast(),
				sw = bounds.getSouthWest(),
				x1 = ne.lng() || -2.1022,
				y1 = ne.lat() || 53.4103,
				x2 = sw.lng() || -2.10337,
				y2 = sw.lat() || 53.41120;

		// Redraw only if the bounds changed
		//console.log([x1,y1,x2,y2].toString() +'\n' +cur_bounds);
		if([x1,y1,x2,y2].toString()==cur_bounds)
			return;

		cur_bounds = [x1,y1,x2,y2].toString();
		cur_zoom = map.getZoom();

		//console.log(x1,y1,x2,y2,cur_zoom);

		m.get_crimes(x1,y1,x2,y2,cur_zoom).done(function(data){
			m.data = data;

			for(var i=0; i<data.length;i++){
				var d = data[i];
				d.size = +d.size;
				d.mnth = +d.mnth;
				d.longitude = +d.longitude;
				d.latitude = +d.latitude;
				d.row_no = +d.row_no;
			}
			
			// At zoom level 17 stop clustering
			//console.log('zoom Level: ',cur_zoom);

			data.sort(function(a,b){return d3.ascending(a.size, b.size)});
			// map marker radius to values between 6px and 20px
	    marker_radius.domain(d3.extent(data, function(d) { return d.size; }));
      layer.selectAll("svg").remove();

      var marker = layer.selectAll("svg")
        //.data(data, function(d) { return d3.values(d); })
        .data(data, function(d) { return d.row_no; })
      
      marker.each(display); // update existing markers

      // add new markers, with some custom transitions
      marker = marker.enter().append("svg")
        .each(display)
        .attr("width", function(d) { return marker_radius(d.size)*2 + padding*2 })
        .attr("height", function(d) { return marker_radius(d.size)*2 + padding*2 })
        .attr("class", function(d){	return (d.crime_details.length)? 'marker leaf' : 'marker'})
        .style("margin-top", function(d) {return "-" + (marker_radius(d.size) + padding)/2 + "px"; })
        .style("margin-left", function(d) {return "-" + (marker_radius(d.size) + padding)/2 + "px"; })
        .each(animateIn);


      // Add a circle.
      marker.append("circle")
      	.on('mouseenter', click)
      	.on('click', click)
        .attr("r", function(d) { return marker_radius(d.size); })
        .attr("cx", function(d) { return marker_radius(d.size) + padding })
        .attr("cy", function(d) { return marker_radius(d.size) + padding });

      // Add a label in the center of the circle
      marker.append("text")
        .attr("x", function(d) { return marker_radius(d.size) + padding })
        .attr("y", function(d) { return marker_radius(d.size) + padding })
        .style("text-anchor", "middle")
        .attr("dy", ".31em")
        .text(function(d) { return d.size; });

      // remove markers, add some exit transitions later
      marker.exit()
        .each(display)
        .each(animateOut);

      function display(d) {
        var pos = map_pixel(d.latitude, d.longitude);

        return d3.select(this)
            .style("left", (pos.x - padding) + "px")
            .style("top", (pos.y - padding) + "px");
      }

      function map_pixel(lat, long) {
        var pos = new google.maps.LatLng(lat, long);
        pos = projection.fromLatLngToDivPixel(pos);

        return pos;
      }


      function animateIn(d) {
        var el = d3.select(this);


            // fade in if zooming out
            return d3.select(this).attr('opacity', 0)
              .transition()
              .duration(200)
              .attr('opacity', 1);

      }

      function animateOut(d) {
        el = d3.select(this);

          return d3.select(this).remove();

      }

      function click(d){

      	// If the actual crimes locations are shown then open a popup with crime details
      	if(d.crime_details.length){ 
	      	var pos = new google.maps.LatLng(d.latitude, d.longitude);
	      	//var content = d3.select('#pop-up').html();
	      	var content = "<div class='table-c'></div>";

	      	// Create infowindow if doesn't exist, otherwise just update its content
	      	if(!infowindow){      	
	      		infowindow = new google.maps.InfoWindow({
					    content: content,
					    position: pos
					  });

				  	infowindow.open(map);

				  	// Delete the infowindow on close
				  	google.maps.event.addListener(infowindow,'closeclick',function(){
						  infowindow = null;
						});

						google.maps.event.addListener(infowindow, 'domready', function(){
							table.init(d.crime_details);
						});
	      	} else {
	      		table.init(d.crime_details);
	      		infowindow.setPosition(pos);
	      	}
      	} else {

      		// If the clusters are displayed then zoom in to reach the associated crimes
      		map.setZoom(map.getZoom()+1);
      		var latLng = new google.maps.LatLng(d.latitude, d.longitude);
    			map.panTo(latLng);
    			d3.selectAll('svg.marker').remove();
      	}
      }

    	//console.log(d3.selectAll('svg.marker').data().length, '>>markers on map');
    });// get_crimes
	}// m.draw


	

	m.get_crimes = function(x1,y1,x2,y2,zoom){
		var d = $.Deferred();
		var url = 'crimes';

		$.ajax({
		  url: url,
		  type: 'GET',
		  contentType: 'application/json',
		  data: {
		  	x1: x1,
		  	y1: y1,
		  	x2: x2,
		  	y2: y2,
		  	zoom: zoom
		  },
		  success: function(data){
	  		//console.log(data);
	      d.resolve(data);
		  }
		});

		return d.promise();
	}



	$( document ).ready(function() {
		m.init();

    $('#helpModal').modal('show');

	});



return m;

})(Map || {})


/*


	  //function to caculate dist btw points. Args in format [x, y]
	  function coords_dist( point1, point2 ) {
	    var xs = 0;
	    var ys = 0;

	    xs = point2[0] - point1[0];
	    xs = xs * xs;

	    ys = point2[1] - point1[1];
	    ys = ys * ys;

	    return Math.sqrt( xs + ys );
	  }


*/