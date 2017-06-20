var express = require('express');
var router = express.Router();

var db = require('../config/database').db; //   DB instance


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Crime' });
});



router.get('/crimes', function(req, res, next) {
	var b = req.query;
	db.any('SELECT * FROM get_crimes($1, $2, $3, $4, $5)', [b.x1, b.y1, b.x2, b.y2, b.zoom]).then(function(data){
	   	console.log('crimes>>',data.length);
	    res.send(data);
	}).catch(function(error) {
	    console.log(error);
	}).finally(function() {	});

});


router.get('/allpoints', function(req, res, next) {
	var b = req.query;
	db.any('SELECT latitude::numeric(10,6), longitude::numeric(10,6), crimes::bigint as crimes FROM mc_g').then(function(data){
	   	console.log('crimes>>',data.length);
	    res.send(data);
	}).catch(function(error) {
	    console.log(error);
	}).finally(function() {	});

});


router.get('/histo', function(req, res, next) {
	var b = req.query;
	db.any('SELECT * FROM get_histo();').then(function(data){
	    res.send(data);
	}).catch(function(error) {
	    console.log(error);
	}).finally(function() {	});

});

module.exports = router;
