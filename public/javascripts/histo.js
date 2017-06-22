var histo = (function(h){
	var elemID = '#histo';


	h.toggle_bar = function(mnth, show){

		var bars = d3.selectAll(elemID + ' rect');

		if(show){
			bars = bars.filter(function(e){
	  		return e.mnth != +mnth;
	  	});

	  	//bars.transition().duration(200)
	  	//	.style('fill-opacity',0.5);
	  	bars.classed('inactive-bar', true);
	  } else {
	  	//bars.style('fill-opacity',1);
	  	bars.classed('inactive-bar', false);
	  }
	}

	h.init = function(data){

		var margin = {top: 20, right: 20, bottom: 70, left: 40},
		    width = $(elemID).width() - margin.left - margin.right,
		    height = $(elemID).height() - margin.top - margin.bottom;

		data.forEach(function(e){
			e.date = new Date('2015-' + e.mnth + '-01');
      e.value = +e.value;
		});

		data.sort(function(a,b){return d3.ascending(a.date, b.date)});

		var x = d3.scaleBand()
	    .range([0, width])
	    .padding(0.1)
			.domain(data.map(function(e){return e.date}));

		var y = d3.scaleLinear().range([height, 0])
			.domain([0, d3.max(data, function(d) { return d.value; })]);

		var xAxis = d3.axisBottom(x)
		  .tickFormat(d3.timeFormat("%B"));

		var yAxis = d3.axisLeft(y)
				.tickFormat(d3.format(".0s"))
		    .ticks(6);

		var svg = d3.select(elemID).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", 
		          "translate(" + margin.left + "," + margin.top + ")");
			
	  svg.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis)
	    .selectAll("text")
	      .style("text-anchor", "end")
	      .attr("dx", "-.8em")
	      .attr("dy", "-.55em")
	      .attr("transform", "rotate(-45)" );

	  svg.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	    .append("text")
	      .attr("y", -10)
	      .attr("dy", ".71em")
	      .attr("dx", ".71em")
	      .style("text-anchor", "start")
	      .style("fill", "black")
	      .text("Number of crimes");

	  var bar = svg.selectAll(".bar")
	      .data(data);

	  bar.exit().remove();

	  bar = bar.enter().append("g").attr('class', 'bar');
	  bar.append('rect')
	      .attr("x", function(d) { return x(d.date); })
	      .attr("width", x.bandwidth())
	      .transition().duration(1000).ease(d3.easeExp)
	      .attr("y", function(d) { return y(d.value); })
	      .attr("height", function(d) { return height - y(d.value); });

	  bar.append('text')
      .style("fill", "white")
      .style("text-anchor", "middle")
	  	.attr("x", function(d) { return x(d.date) + (x.bandwidth()/2); })
      .attr("y", function(d) { return y(d.value)+ 16; })
      .text(function(d){
      	return d.value;
      })


    // rotate the bar text if the viewport is not big enough
    svg.selectAll('g.bar')
    	.each(function(node,d,i){
    		var t = d3.select(this).select('text'),
    		 bw = d3.select(this).node().getBBox().width
    		 tw = t.node().getBBox().width,
    		 th = t.node().getBBox().height;

    		if(bw==tw){
    			t.style("text-anchor", "end")
	    			.attr("x", function(d) { return -(y(d.value) + 4); })
      			.attr("y", function(d) { return x(d.date) + (x.bandwidth()/2) + th/2; })
		      	.attr("transform", "rotate(-90)" );
    		}
    	})

}

$.ajax({
	url: 'histo',
	type: 'GET',
	contentType: 'application/json',
	success: function(data){
		h.init(data);
	}
});

return h;

})(histo || {})