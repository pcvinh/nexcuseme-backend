var config = require('./__config.js');
var logger = require('./__logging.js');

var request = require('request');

/*
lv: -2 = dont show. area_type
lv: -1 = dont show
lv: 0 = bulletin
lv: 1 = area_1
lv: 2 = area_2 // city
lv: 3 = area_3
lv: 4 = country
lv: 5 = colloquial_area
*/
const google_place_types = [
{type:"accounting" , lv : -1 },
{type:"airport" , lv : 0 },
{type:"amusement_park" , lv : 0 },
{type:"aquarium" , lv : 0 },
{type:"art_gallery" , lv : 0 },
{type:"atm" , lv : -1 },
{type:"bakery" , lv : -1 },
{type:"bank" , lv : -1 },
{type:"bar" , lv : -1 },
{type:"beauty_salon" , lv : -1 },
{type:"bicycle_store" , lv : -1 },
{type:"book_store" , lv : -1 },
{type:"bowling_alley" , lv : -1 },
{type:"bus_station" , lv : 0 },
{type:"cafe" , lv : -1 },
{type:"campground" , lv : 0 },
{type:"car_dealer" , lv : -1 },
{type:"car_rental" , lv : -1 },
{type:"car_repair" , lv : -1 },
{type:"car_wash" , lv : -1 },
{type:"casino" , lv : -1 },
{type:"cemetery" , lv : 0 },
{type:"church" , lv : 0 },
{type:"city_hall" , lv : 0 },
{type:"clothing_store" , lv : -1 },
{type:"convenience_store" , lv : -1 },
{type:"courthouse" , lv : 0 },
{type:"dentist" , lv : -1 },
{type:"department_store" , lv : -1 },
{type:"doctor" , lv : -1 },
{type:"electrician" , lv : -1 },
{type:"electronics_store" , lv : -1 },
{type:"embassy" , lv : 0 },
{type:"establishment" , lv : -1 },
{type:"finance" , lv : -1 },
{type:"fire_station" , lv : 0 },
{type:"florist" , lv : -1 },
{type:"food" , lv : -1 },
{type:"funeral_home" , lv : -1 },
{type:"furniture_store" , lv : -1 },
{type:"gas_station" , lv : -1 },
{type:"general_contractor" , lv : -1 },
{type:"grocery_or_supermarket" , lv : 0 },
{type:"gym" , lv : -1 },
{type:"hair_care" , lv : -1 },
{type:"hardware_store" , lv : -1 },
{type:"health" , lv : -1 },
{type:"hindu_temple" , lv : 0 },
{type:"home_goods_store" , lv : -1 },
{type:"hospital" , lv : 0 },
{type:"insurance_agency" , lv : -1 },
{type:"jewelry_store" , lv : -1 },
{type:"laundry" , lv : -1 },
{type:"lawyer" , lv : -1 },
{type:"library" , lv : 0 },
{type:"liquor_store" , lv : -1 },
{type:"local_government_office" , lv : 0 },
{type:"locksmith" , lv : -1 },
{type:"lodging" , lv : -1 },
{type:"meal_delivery" , lv : -1 },
{type:"meal_takeaway" , lv : -1 },
{type:"mosque" , lv : 0 },
{type:"movie_rental" , lv : -1 },
{type:"movie_theater" , lv : -1 },
{type:"moving_company" , lv : -1 },
{type:"museum" , lv : 0 },
{type:"night_club" , lv : -1 },
{type:"painter" , lv : -1 },
{type:"park" , lv : 0 },
{type:"parking" , lv : 0 },
{type:"pet_store" , lv : -1 },
{type:"pharmacy" , lv : -1 },
{type:"physiotherapist" , lv : -1 },
{type:"place_of_worship" , lv : 0 },
{type:"plumber" , lv : -1 },
{type:"police" , lv : 0 },
{type:"post_office" , lv : 0 },
{type:"real_estate_agency" , lv : -1 },
{type:"restaurant" , lv : -1 },
{type:"roofing_contractor" , lv : -1 },
{type:"rv_park" , lv : -1 },
{type:"school" , lv : 0 },
{type:"shoe_store" , lv : -1 },
{type:"shopping_mall" , lv : 0 },
{type:"spa" , lv : -1 },
{type:"stadium" , lv : 0 },
{type:"storage" , lv : -1 },
{type:"store" , lv : -1 },
{type:"subway_station" , lv : 0 },
{type:"synagogue" , lv : -1 },
{type:"taxi_stand" , lv : 0 },
{type:"train_station" , lv : 0 },
{type:"travel_agency" , lv : -1 },
{type:"university" , lv : 0 },
{type:"veterinary_care" , lv : -1 },
{type:"zoo" , lv : 0 },
	
	
	{type:"administrative_area_level_1" , lv : 3 },
	{type:"administrative_area_level_2" , lv : 2 },
	{type:"administrative_area_level_3" , lv : 2 },
	{type:"administrative_area_level_4" , lv : 1 },
	{type:"administrative_area_level_5" , lv : 1 },
	//{type:"colloquial_area" , lv : -2 },
	{type:"country" , lv : 4 },
	//{type:"floor" , lv : 1 },
	//{type:"geocode" , lv : 1 },
	{type:"intersection" , lv : -2 },
	{type:"locality" , lv : 2 },
	//{type:"natural_feature" , lv : 1 },
	{type:"neighborhood" , lv : 1 },
	//{type:"political" , lv : 1 },
	{type:"point_of_interest" , lv : 0 },
	//{type:"post_box" , lv : 1 },
	//{type:"postal_code" , lv : 1 },
	//{type:"postal_code_prefix" , lv : 1 },
	//{type:"postal_code_suffix" , lv : 1 },
	{type:"postal_town" , lv : -2 },
	//{type:"premise" , lv : 1 },
	//{type:"room" , lv : 1 },
	{type:"route" , lv : 0 },
	//{type:"street_address" , lv : 1 },
	//{type:"street_number" , lv : 1 },
	{type:"sublocality" , lv : 1 },
	{type:"sublocality_level_4" , lv : 1 },
	{type:"sublocality_level_5" , lv : 1 },
	{type:"sublocality_level_3" , lv : 1 },
	{type:"sublocality_level_2" , lv : 1 },
	{type:"sublocality_level_1" , lv : 1 },
	{type:"subpremise" , lv : -2 },
	//{type:"transit_station" , lv : 1 }
];

// process JSON data
_get_type_level = function(types) {
	for(var i=0; i < google_place_types.length; i++) {
		if(google_place_types[i].type == types[0]) {
			return google_place_types[i].lv;
		}
	}
	
	return -10;
}



//google_place API
//const google_place_types = "amusement_park|aquarium|art_gallery|bus_station|church|city_hall|embassy|hindu_temple|zoo|university|train_station|subway_station|stadium|shopping_mall|school|post_office|police|place_of_worship|museum|parking|park|mosque|local_government_office|library|hospital"
/*function _google_place_nearbySearch(lat, lng, max, callback) {
	var google_map_api_url= 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?types='+google_place_types+'&location='+lat + ',' + lng + '&radius='+max+'&key=' + config.GOOGLE_API_KEY;
	console.log(google_map_api_url);
	request({
		uri: google_map_api_url,
		method: "GET",
		timeout: 10000
		}, function(err, response, body) {
			if(err) return callback(err);
			
			var google_places_here = JSON.parse(body);
			callback(null, google_places_here);
		});
}*/

_google_place_nearbySearch = function(lat, lng, max, callback) {
	var google_map_api_url= 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+lat + ',' + lng + '&radius='+max+'&key=' + config.GOOGLE_API_KEY;
	console.log(google_map_api_url);
	request({
		uri: google_map_api_url,
		method: "GET",
		timeout: 10000
		}, function(err, response, body) {
			if(err) return callback(err);
			
			var google_places_here = JSON.parse(body);
			callback(null, google_places_here);
		});
}

//google_geocode API
_google_geocode_latlng = function(lat, lng, location_type, callback) {
	var type = "";
	if(location_type) {
		type = "&location_type=" + location_type;
	}
	var google_map_api_url= 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat + ',' + lng + type + '&key=' + config.GOOGLE_SERVER_API_KEY;
	console.log(google_map_api_url);
	request({
		uri: google_map_api_url,
		method: "GET",
		timeout: 10000
		}, function(err, response, body) {
			if(err) return callback(err);
			
			var google_places_here = JSON.parse(body);
			callback(null, google_places_here);
		});
}

function _google_geocode_placeId(id, callback) {
	var google_map_api_url= 'https://maps.googleapis.com/maps/api/geocode/json?place_id='+ id +'&key=' + config.GOOGLE_SERVER_API_KEY;
	console.log(google_map_api_url);
	request({
		uri: google_map_api_url,
		method: "GET",
		timeout: 10000
		}, function(err, response, body) {
			if(err) return callback(err);
			
			var google_places_here = JSON.parse(body);
			callback(null, google_places_here);
		});
}



module.exports = {
	_google_place_nearbySearch: _google_place_nearbySearch,
	_google_geocode_latlng: _google_geocode_latlng,
	_google_geocode_placeId	: _google_geocode_placeId,
	_get_type_level: _get_type_level
}