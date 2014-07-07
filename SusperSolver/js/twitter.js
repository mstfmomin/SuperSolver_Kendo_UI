// PROJECT: Phonegap Twitter with ChildBrowser
// AUTHOR: Drew Dahlman ( www.drewdahlman.com )
// DATE: 1.25.2012

/* 
NOTES:
We will use the ChildBrowser to get a user to sign in to Twitter.
We will store this information in our localStorage and be able to reuse this when we need!

You can read into this more, but storing these keys like this is VERY dangerous!!
So make sure you don't share your source code until you've removed your keys and secrets!
*/

// GLOBAL VARS
var oauth; // Holds out oAuth request
var requestParams; // Specific request params
var options = { 
            consumerKey: SuperSolver.TW_Key, // REPLACE WITH YOUR CONSUMER_KEY
            consumerSecret: SuperSolver.TW_Secret, // REPLACE WITH YOUR CONSUMER_SECRET
            callbackUrl: SuperSolver.TW_Redir }; // YOUR URL 
			
var twitterKey = "twttrKey"; // what we will store our twitter user information in



var Twitter = {
	SS_login: function(){
		//oauth = OAuth(options);
		oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true',
			function(data) {
				var entry = JSON.parse(data.text);
				//console.log("TWITTER USER: "+entry.screen_name);
				localStorage.TW_ID = entry.id;
				localStorage.CustomerName = entry.name;
				localStorage.TW_Handle = entry.screen_name;
	            var twdata = {};
	            twdata.Name = localStorage.CustomerName;
	            twdata.TW_ID = localStorage.TW_ID; 
	            twdata.TW_Handle = localStorage.TW_Handle;
	            //console.log("Posting to SS with: " + JSON.stringify(twdata));         
	               $.ajax({
	                      type: 'POST',
	                      url: SuperSolver.theURL + "ConnectTW2",
	                      data: twdata,
	                      crossDomain: true,
	                      success: function(data){
	                        if (data.Success == true){
	                            localStorage.CustomerID = data.CustomerID;
	                            localStorage.CustomerFirstName = data.CustomerFirstName;
	                            localStorage.CustomerLastName = data.CustomerLastName;
                                    localStorage.CustomerEmail = data.CustomerEmail;
	                            localStorage.AuthTokenName = data.AuthTokenName;
	                            localStorage.AuthTokenValue = data.AuthTokenValue;
	                            localStorage.AuthTokenExpires = data.AuthTokenExpires;
                                    localStorage.LoginType = "4";
	                            console.log("Successfully logged in via TW");
	                            if (data.registration == true) {
	                              navigator.notification.alert("Welcome to SuperSolver! Thank you for joining. Please enter an email address on your profile to receive messages from SuperSolver.", null, "SuperSolver");
	                            }
	                            else {
	                              navigator.notification.alert("Welcome back, " + localStorage.CustomerFirstName, null, "SuperSolver");
	                            }

	                            window.location.href = "app.html";
	                            //$.mobile.changePage('app.html');
	                        }
	                        else
	                        {
	                        navigator.notification.alert("Sorry! There was a problem using your Facebook credentials with SuperSolver. Please try again or use another login method.",null,"SuperSolver");
	                        }
	                      }
	                      });

			},
			function(data) {
				console.log("ERROR: " + JSON.stringify(data));
				navigator.notification.alert("Sorry, there was a problem with Twitter. Please try again or use another login method.", null, "SuperSolver");
			}
			);
	},

    init:function(){
		
		// our storedAccessData and Raw Data
        var storedAccessData, rawData = localStorage.TW_Key;
		
		// First thing we need to do is check to see if we already have the user saved!
		if(!(localStorage.TW_Key == "" || localStorage.TW_Key == null)) {
			console.log("Checking credentials with TW_Key: " + localStorage.TW_Key)
			// If we already have them
			options.accessTokenKey = localStorage.TW_Key; // This is saved when they first sign in
			options.accessTokenSecret = localStorage.TW_Secret; // this is saved when they first sign in
			oauth = OAuth(options);
			Twitter.SS_login();
		}
		else {
			
			// We don't have a user saved yet
			//console.log("No Key, Getting request token");
			oauth = OAuth(options);
                        //console.log("Returning from OAuth");
			oauth.get('https://api.twitter.com/oauth/request_token',
				function(data) {
					requestParams = data.text;
					//console.log("Opening TW window");
					var cb = window.open('https://api.twitter.com/oauth/authorize?'+data.text, '_blank', 'location=no,toolbar=yes'); // This opens the Twitter authorization / sign in page     
				     $(cb).on('loadstart', function(e) {
                      var url = e.originalEvent.url;
                      var code = /oauth_verifier=/.test(url);
                      var error = /error=/.test(url);
                      
                      if (code || error) {
                      //Always close the browser when match is found
                      //console.log("closing TW window");
                      cb.close();
                      }

                      //console.log("Catching cb loadstart: code?:" + code + " url: " + url);

                      if (code) {
                      //console.log("calling Twitter.success with:" + url);
                      Twitter.success(url);
                  	  }
                  	  if (error){
                  	  		console.log("Error returned from user.")
							navigator.notification.alert("Sorry, there was a problem with Twitter. Please try again or use another login method.", null, "SuperSolver");
                  	  }

                      });

				},
				function(data) { 
					console.log("ERROR calling oAuth.get: "+data);
				}
			);
		}
    },
	
	/*
	When The ChildBrowser URL changes we will track it here.
	We will also determine if the request was a success or not here
	*/
	success:function(loc){
		
		// The supplied oauth_callback_url for this session is being loaded
		
		/*
		We will check to see if the childBrowser's new URL matches our callBackURL
		*/
		if (loc.indexOf(SuperSolver.TW_Redir) >= 0) {
			
			// Parse the returned URL
			var index, verifier = '';            
			var params = loc.substr(loc.indexOf('?') + 1);
			
			params = params.split('&');
			for (var i = 0; i < params.length; i++) {
				var y = params[i].split('=');
				if(y[0] === 'oauth_verifier') {
					verifier = y[1];
				}
			}
			
			// Exchange request token for access token
			
			/*
			Once a user has given us permissions we need to exchange that request token for an access token
			we will populate our localStorage here.
			*/
			oauth.get('https://api.twitter.com/oauth/access_token?oauth_verifier='+verifier+'&'+requestParams,
					function(data) {               
						var accessParams = {};
						var qvars_tmp = data.text.split('&');
						for (var i = 0; i < qvars_tmp.length; i++) {
							var y = qvars_tmp[i].split('=');
							accessParams[y[0]] = decodeURIComponent(y[1]);
						}
						
						console.log("Token request successful!");
						oauth.setAccessToken([accessParams.oauth_token, accessParams.oauth_token_secret]);
						
						// Save access token/key in localStorage
						
						localStorage.TW_Key = accessParams.oauth_token;
						localStorage.TW_Secret = accessParams.oauth_token_secret;
						
						console.log("TWITTER: Storing token key/secret in localStorage");
						Twitter.SS_login();
						
				},
				function(data) {  //callback error
					console.log(data);
					navigator.notification.alert("Sorry, there was a problem with Twitter. Please try again or use another login method.", null, "SuperSolver");
				   
				}
			);
		}
		else {
			console.log("callbackUrl did not match: ")// do nothing	
			navigator.notification.alert("Sorry, there was a problem with loggin you in. Please try again or use another login method.", null, "SuperSolver");
		}
	},

	tweet:function(){
		var storedAccessData, rawData = localStorage.getItem(twitterKey);
		
			storedAccessData = JSON.parse(rawData); // Parse our JSON object
			options.accessTokenKey = storedAccessData.accessTokenKey; // This is saved when they first sign in
			options.accessTokenSecret = storedAccessData.accessTokenSecret; // this is saved when they first sign in
			
			// jsOAuth takes care of everything for us we just need to provide the options
			oauth = OAuth(options);
			oauth.get('https://api.twitter.com/1/account/verify_credentials.json?skip_status=true',
					function(data) {
						var entry = JSON.parse(data.text);
						Twitter.post();
					}
			);
	},
	/*
	Now that we have the information we can Tweet!
	*/
	post:function(){
		var theTweet = $("#tweet").val(); // Change this out for what ever you want!
		
		oauth.post('https://api.twitter.com/1/statuses/update.json',
                    { 'status' : theTweet,  // jsOAuth encodes for us
                      'trim_user' : 'true' },
                    function(data) {
                        var entry = JSON.parse(data.text);
						console.log(entry);
						
						// FOR THE EXAMPLE
						//app_twitter.done();
                    },
                    function(data) { 
						console.log(data);
                    }
            );		
	}
};

var app_twitter = { //keeping for reference - RS
	bodyLoad:function(){
		//document.addEventListener("deviceready", app.deviceReady, false);
	},
	deviceReady:function(){
		app_twitter.init();
	},
	init:function(){
		
		// Lets start by checking if we have a twitter account or not...
		if(!localStorage.getItem(twitterKey)){
			$("#loginArea").fadeIn();
			$("#login").click(function(){
				Twitter.init();
			});
		}
		else {
			$("#loginArea").fadeOut();
			$("#tweetArea").fadeIn();
			
			$("#statusHold").hide();
			$("#tweetBTN").click(function(){
				if($("#tweet").val() == ""){
					alert("make sure you've filled out the text area!");
				}
				else {
					$("#statusHold").show();
					$("#tweet").hide();
					$("#tweetBTN").hide();
					Twitter.tweet();
				}
			});
		}
	},

	done:function(){
		$("#statusHold").hide();
		$("#tweet").val('');
		$("#tweet").show();
		$("#tweetBTN").show();
	}
};