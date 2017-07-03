
'use strict';

var Cluster = (function(c){


	//superCluster - greedy point clustering

	$.ajax({

    url : 'allpoints',
    type : 'GET',

    dataType:'json',
    success : function(data) {
    	//console.log('cluster data downloaded');         
       cluster(data)
    },
    error : function(request,error)
    {
        console.log('failed downloading all points')
    }
	});


	function cluster(data){
		var gfts = data.map(function(e){
		return {
		  "type": "Feature",
		  "geometry": {
		    "type": "Point",
		    "coordinates": [+e['0'], +e['1']]
		  },
		  "properties": {
		    "crimes": +e.c
		  }
		}});

		var cluster = supercluster({
		  radius: 80,
		  maxZoom: 20
		});

		cluster.load(gfts);

		c.c = cluster;
		//console.log('cluster is ready');
		add_parent_centres();
	}

	// To do: update each cluster with parent lat long for children animations
	function add_parent_centres(){

/*
	  // Does not update
		for (var z=1; z < 20; z++){
			var cs = c.cluster.getClusters([-180, -85, 180, 85], z);
			for(var i=0; i<cs.length; i++){
				var clstr = cs[i];
				if(clstr.properties.cluster){
          var cdn = c.cluster.getChildren(clstr.properties.cluster_id,c.cluster.getClusterExpansionZoom(clstr.properties.cluster_id, z))
          if(cdn.length>1){
            for(var ci = 0; ci<cdn.length; ci++){
              var child = cdn[ci];
              child.properties.parent_coords = {['0']: clstr.geometry.coordinates['0'], ['1']: clstr.geometry.coordinates['1']}
            }
          }
        }
			}	
		}
*/

	}



	return c;
})(Cluster || {})
