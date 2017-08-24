var geocoder;
var map;
var markers = [];
var maps = [];
var temp = [];
var count = 0;
//add a marker
function addMarker(pos, address = ''){
    var marker = new google.maps.Marker({
        position: pos,
        map: map
    });
    //console.log("in addMarker-" + pos);
    console.log(address);
    if(address != ''){
        var str = "<h1>" + address + "</h1>";
        var infoWindow = new google.maps.InfoWindow({
            content: str
        });
        marker.addListener('click', function(){
            infoWindow.open(map, marker);
        });
    }
    markers.push(marker);
    return marker;
}

//Used primarily to delete all the markers from the map
function setMarkerOnAll(map){
    for(var i = 0; i < markers.length; ++i){
        markers[i].setMap(map);
    }
}

//Delete all the markers from the map
function clearMarker(){
    setMarkerOnAll(null);
}



function deleteMarker(){
    clearMarker();
    markers = [];   
}

//Read locations from file
function readFile(event){
    var f = event.target.files[0];
    if(f){
        var fReader = new FileReader();
        fReader.onload = function(e){
            var content = e.target.result;
            var arr = content.split('\n');
            getPositions(arr);
        }
        fReader.readAsText(f);
    }
    else{
        alert("File cannot be loaded");
    }
}
document.getElementById('files').addEventListener('change', readFile, false);


//start using the google map api, fix center at Kolkata
function initMap(){
    var options = {
        zoom: 11,
        center: {lat: 22.5726, lng:88.3639}
    }
    map = new google.maps.Map(document.getElementById('map'), options);
    geocoder = new google.maps.Geocoder();
}

function putMarker(address){
    var pos;
    if(localStorage.getItem(address.toLowerCase()) != null){
        var tmp = localStorage.getItem(address.toLowerCase().trim());
        pos = JSON.parse(tmp);
        //console.log(pos);
        //console.log("x " + address);
        temp.push(addMarker(pos, address));
    }
    else{
        geocoder.geocode( { 'address': address}, function(results, status) {    
            if (status == 'OK') {
                pos = results[0].geometry.location;
                //console.log(pos);
                //console.log(address);
                temp.push(addMarker(pos, address));
                localStorage.setItem(address, JSON.stringify(pos));
            } 
            else if(status == "OVER_QUERY_LIMIT"){
                setTimeout(function(){putMarker(address)}, 250);
            }
            else {
                console.log('Geocode was not successful for the following reason: ' + status);
            }
        });
    }
}


//Use the geocoding api to get the position of the places and display

function getPositions(arr){
    for(var i = 0; i < arr.length; ++i){ 
        putMarker(arr[i]);
        //setTimeout(putMarker, 250, arr[i]);
    }
}
    


//Changes to be made when a adrress is submitted
//var count = 0;
function changeMarkers(){
    var count = 0;
    var add = document.getElementById('add').value;
    var rad = document.getElementById('slider').value;
    console.log('Radius: ' + rad);
    if(add.trim() != null){
        geocoder.geocode( { 'address': add}, function(results, status) {
        if (status == 'OK') {
            deleteMarker();
            pos = results[0].geometry.location;
            var origin = pos;
            //console.log(results);
            //console.log("origin-" + origin);
            var dest;
            var count = 0;
            for(var i = 0; i < temp.length; ++i){
                dest = temp[i].position;
                //console.log('dest: ' + dest);
                var service = new google.maps.DistanceMatrixService;
                service.getDistanceMatrix({
                    origins: [origin],
                    destinations: [dest],
                    travelMode: 'DRIVING',
                    unitSystem: google.maps.UnitSystem.METRIC
                }, function(response, status){
                    if(status !== 'OK'){
                        console.log("error was: " + status);
                    }
                    else{
                        //console.log('destination:' + dest);
                        var destination = response.destinationAddresses[0];
                        //console.log('destination: ' + destination);
                        //console.log(response);
                        if(response.rows[0].elements[0].status == 'ZERO_RESULTS'){
                            console.log("Distance not found to "+ destination);
                        }
                        else{
                            var distance = response.rows[0].elements[0].distance.value;
                            distance /= 1000;
                            //console.log('distance:' + distance);
                            var desti;
                            //console.log(destination + ' ' + distance);
                            if(distance <= rad){
                                ++count;
                                geocoder.geocode({'address': destination}, function(results, status) {
                                    if(status == 'OK'){
                                        desti = results[0].geometry.location;
                                        //++count;
                                        console.log('desti: '+desti);
                                        addMarker(desti);
                                    }
                                });    
                            }
                        }
                    }
                });
            }   
        } 
        else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
        });
    }
    else{
        alert("No no");
    }
}

function isRecordsAvailable(count, rad){
    if(count == 0)alert("Nothing found inside the radius " + rad);
}