var geocoder;
var map;
var markers = [];
var maps = [];
var temp = [];
var count = 0;
var details = {'origin':null, 'destinations':[], 'radius': 5};  //Used to store the details of the positions inside a radius

//start using the google map api, fix center at Kolkata
function initMap() {
  var options = {
    zoom: 11,
    center: {
      lat: 22.5726,
      lng: 88.3639
    }
  }
  map = new google.maps.Map(document.getElementById('map'), options);
  geocoder = new google.maps.Geocoder();
}

//Read locations from file
function readFile(event) {
    var f = event.target.files[0];
    if (f) {
        var fReader = new FileReader();
        fReader.onload = function(e) {
            var content = e.target.result;
            var arr = content.split('\n');
            getPositions(arr);
        }
        fReader.readAsText(f);
    }
    else {
        alert("File cannot be loaded");
    }
}
document.getElementById('files').addEventListener('change', readFile, false);

//add a marker
function addMarker(pos, address = '') {
    var marker = new google.maps.Marker({
        position: pos,
        map: map
    });
    //console.log(address);
    var str;
    if(address)str = "<h1>" + address + "</h1>";
    else str = "<h1>" + localStorage.getItem(JSON.stringify(pos)) + "</h1>";
    var infoWindow = new google.maps.InfoWindow({
      content: str
    });
    marker.addListener('click', function() {
      infoWindow.open(map, marker);
    });

    markers.push(marker);
    return marker;
}

//Used primarily to delete all the markers from the map
function setMarkerOnAll(map) {
    for (var i = 0; i < markers.length; ++i) {
        markers[i].setMap(map);
    }
}

//Delete all the markers from the map
function clearMarker() {
  setMarkerOnAll(null);
}

//When the file loads, load the markers for those positions
function putMarker(address, pushIn = false) {
    var pos;
    if (localStorage.getItem(address.toLowerCase()) != null) {
        var tmp = localStorage.getItem(address.toLowerCase().trim());
        pos = JSON.parse(tmp);
        localStorage.setItem(tmp, address);
        //console.log(pos);
        //console.log("x " + address);
        if(pushIn){
            temp.push(addMarker(pos, address));
        }
        else {
            addMarker(pos, address);
        }
    }
    else {
        geocoder.geocode({'address': address}, function(results, status) {
            if (status == 'OK') {
                pos = results[0].geometry.location;
                temp.push(addMarker(pos, address));
                localStorage.setItem(address, JSON.stringify(pos));
                localStorage.setItem(JSON.stringify(pos), address);
            }
            else if (status == "OVER_QUERY_LIMIT") {
                setTimeout(function() {putMarker(address)}, 250);
            }
            else {
                console.log('Geocode was not successful for the following reason: ' + status);
            }
        });
    }
}

//Read from the localStorage and put the markers on the map given a radius and origin address
function putMarker2(address) {
    var pos;
    addMarker(address);
}

//Use the geocoding api to get the position of the places and display
function getPositions(arr) {
    for (var i = 0; i < arr.length; ++i) {
        if(arr[i] != '')
            putMarker(arr[i], true);
    }
}

//Put the markers on the map when the submit button is clicked
function putPositions() {
    details.destinations.length = 0;
    var add = document.getElementById('add').value.trim();
    var rad = document.getElementById('slider').value;
    console.log('Radius: ' + rad);
    if (add != null) {
        geocoder.geocode({
            'address': add
            }, function(results, status) {
              if (status == 'OK') {
                clearMarker();
                markers.length = 0;
                pos = results[0].geometry.location;
                geocoder.geocode({'location': pos}, function(results, response) {
                  if (status == 'OK') {
                    var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
                    var marker = new google.maps.Marker({
                      position: pos,
                      map: map,
                      icon: image
                    });
                    markers.push(marker);
                    var str = "<h1>" + add + "</h1>";
                    var infoWindow = new google.maps.InfoWindow({
                      content: str
                    });
                    marker.addListener('click', function() {
                      infoWindow.open(map, marker);
                    });
                  }
                });

                var origin = pos;
                details.origin = origin;
                details.radius = rad;
                details.destinations.length = 0;
                //console.log("origin-" + origin);
                var dest;
                for (var i = 0; i < temp.length; ++i) {
                    var distance = google.maps.geometry.spherical.computeDistanceBetween(origin, temp[i].position) / 1000;
                    if(distance <= rad && distance > 0){
                        ++count;
                        var obj = {'formatted_address': localStorage.getItem(JSON.stringify(temp[i].position)), 'location': temp[i].position, 'distance': distance};
                        details.destinations.push(obj);
                        putMarker2(temp[i].position);
                    }
                }
                if(count == 0)alert("No records found inside: " + rad +" kms");
              } else {
                  alert('Geocode was not successful for the following reason: ' + status);
              }
        });
    } else {
        alert("No no");
    }
}

//Show the radius
document.getElementById('slider').addEventListener('change', function(){
    document.getElementById('radius').innerHTML = document.getElementById('slider').value;
});

//Change the markers with the change of the slider
document.getElementById('slider').addEventListener('change', function () {
    putPositions();
});

//Changes to be made when a adrress is submitted
function changeMarkers() {
    putPositions();
    count = 0;
}
