function BeaconManager() {
    var listeners = {
        'added': [],
        'removed': [],
        'updated': []
    };
    var beacons = [];
    var counters = [];
    var expire_secs = 100;

    function compareBeacons(a, b) {
        return a.minor === b.minor && a.major === b.major;
    }

    function updateBeacons(newBeacons) {
        var i, l, j, m, beacon1, beacon2, found;

        for(i= 0, l = newBeacons.length; i<l; i++) {
            beacon1 = newBeacons[i];
            found = false;

            for(j= 0, m=beacons.length; j<m; j++) {
                beacon2 = beacons[j];

                if(compareBeacons(beacon1, beacon2)) {
                    found = true;
                    trigger('updated', beacon1);
                    counters[j] = expire_secs;
                    break;
                }
            }

            if(!found) {
                trigger('added', beacon1);
                beacons.push(beacon1);
                counters[beacons.length] = expire_secs;
            }
        }

        for(i= 0, l = beacons.length; i<l; i++) {
            beacon1 = beacons[i];
            found = false;

            for(j= 0, m=newBeacons.length; j<m; j++) {
                beacon2 = newBeacons[j];

                if(compareBeacons(beacon1, beacon2)) {
                    found = true;
                    counters[j] = expire_secs;
                    break;
                }
            }

            if(!found) {
                counters[i]--;
                if (counters[i] == 0){
                    beacons.splice(i,1);
                    trigger('removed', beacon1);
                }
                else {
                    trigger('updated', beacon1);
                }
            }
        }

    }

    function trigger(event, data) {
        for(var i= 0, l=listeners[event].length; i<l; i++) {
            listeners[event][i](data);
        }
    }

    this.getBeacons = function() {
        return beacons;
    };

    this.startPulling = function(interval) {
        interval = interval || 1000;

        if(typeof interval !== "number" || isNaN(interval)) {
            throw "Interval must be a valid number.";
        }

        if(interval <= 0) {
            throw "Interval must be a positive number."
        }

        window.EstimoteBeacons.startRangingBeaconsInRegion(function () {
            setInterval(function () {
                window.EstimoteBeacons.getBeacons(function (beacons) {
                    updateBeacons(beacons);
                });
            }, interval);
        });
    };

    this.on = function(event, callback) {
        if(!listeners[event]) {
            throw "Unknown event '" + event + "'";
        }

        if(typeof callback !== "function") {
            throw "Callback must be a function.";
        }

        listeners[event].push(callback);
    };
};

function formatDistance(meters) {
    if(meters > 0) {
        return (meters * 3).toFixed(1)  + ' ft'; //converting to ft from m and excluding else block
    } else {
        return (meters * 100).toFixed(2) + ' cm';
    }
};

document.addEventListener("deviceready", DeviceReady2, false);

function DeviceReady2()
{
    var validOS = parseFloat(window.device.version) >= 7.0;
    console.log("iOS Version: " + parseFloat(window.device.version))
    if (validOS) {
        console.log("Starting iBeacon polling.")
        var beaconManager = new BeaconManager();

        beaconManager.startPulling(1000);

        beaconManager.on('updated', function(beacon){
            SuperSolver.Search.UpdateBeacon(beacon)
        });

        beaconManager.on('added', function(beacon) {
            SuperSolver.Search.EnterBeacon(beacon);
        });

        beaconManager.on('removed', function(beacon) {
            SuperSolver.Search.RemoveBeacon(beacon)
        });

    }        

};