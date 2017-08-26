var geocoder;
var map;
var markers = [];
var maps = [];
var temp = [];
var count = 0;
var details = {'origin':null, 'destinations':[]};

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
  } else {
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
  console.log(address);
  if (address != '') {
    var str = "<h1>" + address + "</h1>";
    var infoWindow = new google.maps.InfoWindow({
      content: str
    });
    marker.addListener('click', function() {
      infoWindow.open(map, marker);
    });
  }
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

function putMarker(address, pushIn = false) {
  var pos;
  if (localStorage.getItem(address.toLowerCase()) != null) {
    var tmp = localStorage.getItem(address.toLowerCase().trim());
    pos = JSON.parse(tmp);
    //console.log(pos);
    //console.log("x " + address);
    if(pushIn){
        temp.push(addMarker(pos, address));
    }
    else {
        addMarker(pos, address);
    }
  } else {
    geocoder.geocode({
      'address': address
    }, function(results, status) {
      if (status == 'OK') {
        pos = results[0].geometry.location;
        temp.push(addMarker(pos, address));
        localStorage.setItem(address, JSON.stringify(pos));
        localStorage.setItem(JSON.stringify(pos), address);
      } else if (status == "OVER_QUERY_LIMIT") {
        setTimeout(function() {
          putMarker(address)
        }, 250);
      } else {
        console.log('Geocode was not successful for the following reason: ' + status);
      }
    });
  }
}

function putMarker2(address, pushIn = false) {
    var pos;
    geocoder.geocode({
      'address': address
    }, function(results, status) {
      if (status == 'OK') {
        pos = results[0].geometry.location;
        addMarker(pos, address);
        localStorage.setItem(address, JSON.stringify(pos));
      } else if (status == "OVER_QUERY_LIMIT") {
        setTimeout(function() {
          putMarker2(address)
        }, 250);
      } else {
        console.log('Geocode was not successful for the following reason: ' + status);
      }
    });
    addMarker(pos, address);
}
//Use the geocoding api to get the position of the places and display
function getPositions(arr) {
  for (var i = 0; i < arr.length; ++i) {
    putMarker(arr[i], true);
  }
}

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
                geocoder.geocode({
                  'location': pos
                }, function(results, response) {
                  if (status == 'OK') {
                    var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
                    var marker = new google.maps.Marker({
                      position: pos,
                      map: map,
                      icon: image
                    });
                    var str = "<h1>" + results[0].formatted_address + "</h1>";
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
                //console.log(results);
                //console.log("origin-" + origin);
                var dest;
                for (var i = 0; i < temp.length; ++i) {
                  dest = temp[i].position;
                  //console.log('dest: ' + dest);
                  var service = new google.maps.DistanceMatrixService;
                  service.getDistanceMatrix({
                    origins: [origin],
                    destinations: [dest],
                    travelMode: 'DRIVING',
                    unitSystem: google.maps.UnitSystem.METRIC
                  }, function(response, status) {
                    if (status !== 'OK') {
                      console.log("error was: " + status);
                    } else {
                      //console.log('destination:' + dest);
                      var destination = response.destinationAddresses[0];
                      //console.log('destination: ' + destination);
                      console.log(response);
                      if (response.rows[0].elements[0].status == 'ZERO_RESULTS') {
                        console.log("Distance not found to " + destination);
                      } else {
                        var distance = response.rows[0].elements[0].distance.value;
                        distance /= 1000;
                        console.log('distance:' + distance);
                        var desti;
                        //console.log(destination + ' ' + distance);
                        if (distance <= rad && distance > 0) {
                          details.destinations.push(response);
                          putMarker2(destination);
                        }
                      }
                    }
                  });
                }
              } else {
                  alert('Geocode was not successful for the following reason: ' + status);
              }
        });
    } else {
        alert("No no");
    }
}

//Changes to be made when a adrress is submitted


function changeMarkers() {
    putPositions();

    count = 0;
}
