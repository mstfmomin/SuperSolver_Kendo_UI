    function SSscan() {
        console.log('scanning');
        
        //var scanner = cordova.require("cordova/plugin/BarcodeScanner");

        cordova.plugins.barcodeScanner.scan( function (result) { 

            var ss_url = "mobile.supersolver.com/?locationid=";

            loc = (result.text).toLowerCase();
            if (loc.indexOf(ss_url) !== -1) {
                var i, locationid = '';            
                var params = loc.substr(loc.indexOf('?') + 1);
                
                params = params.split('&');
                for (var i = 0; i < params.length; i++) {
                    var y = params[i].split('=');
                    if(y[0] === 'locationid') {
                        locationid = y[1];
                    }
                }
                //navigator.notification.alert("Found locationid = " + locationid);
                //localStorage.locationid = locationid;
                //window.location.href = "app.html";
                SuperSolver.Search.ShowVirtualLocation(locationid, true);
            } else if ((result.text).length > 0) {
                navigator.notification.prompt(
                    "This isn't a code isn't tied to a location. Do you want to open it a browser?",
                    onPrompt,
                    'SuperSolver',
                    ['Open in Browser', 'Cancel'],
                    result.text
                    )
            }



           console.log("Scanner result: \n" +
                "text: " + result.text + "\n" +
                "format: " + result.format + "\n" +
                "cancelled: " + result.cancelled + "\n");
            /*
            if (args.format == "QR_CODE") {
                window.plugins.childBrowser.showWebPage(args.text, { showLocationBar: false });
            }
            */

        }, function (error) { 
            navigator.notification.alert("Sorry, there was a problem with the scanner.");
            console.log("Scanning error :", error); 
        } );
    }
/*
function SSscanTest(result) {
                var ss_url = "mobile.supersolver.com/?locationid=";
                var loc = "";

            loc = (result.text).toLowerCase();
            if (loc.indexOf(ss_url) !== -1) {
                var i, locationid = '';            
                var params = loc.substr(loc.indexOf('?') + 1);
                
                params = params.split('&');
                for (var i = 0; i < params.length; i++) {
                    var y = params[i].split('=');
                    if(y[0] === 'locationid') {
                        locationid = y[1];
                    }
                }
                navigator.notification.alert("found SS QR code! locationid: ", locationid);
            } else {
                navigator.notification.prompt(
                    "This isn't a SuperSolver QR code. Do you want to open it a browser?",
                    onPrompt,
                    'SuperSolver',
                    ['Open in Browser', 'Cancel']
                    )
            }
}*/

function onPrompt(results){
    if (results.buttonIndex == 1) {
        window.open(results.input1, "_system");
    }
}

function getQueryVariable(variable) { 
 var query = window.location.search.substring(1); 
 var vars = query.split("&"); 
 for (var i=0;i<vars.length;i++) { 
 var pair = vars[i].split("="); 
 if (pair[0] == variable) { 
   return pair[1]; 
    }
  }
  return 0;
}
