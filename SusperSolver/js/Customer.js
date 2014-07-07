(function ($) {

    var Login = function () {

        function Init() {
            $('.LoginForm form').submit(function () {

                if ($.trim($('#Email', this).val()) == '') {
                    navigator.notification.alert('Please enter E-Mail Address.',null,"SuperSolver");
                    return false;
                }

                if(SuperSolver.IsValidEmail($.trim($('#Email', this).val())) == false) {
                    navigator.notification.alert("Please enter a valid e-mail address.",null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#Password', this).val()) == '') {
                    navigator.notification.alert('Please enter Password.',null,"SuperSolver");
                    return false;
                }
            });

            $('.ForgotPwdForm form').submit(function () {

                if ($.trim($('#Email', this).val()) == '') {
                    navigator.notification.alert('Please enter E-Mail Address.',null,"SuperSolver");
                    return false;
                }

                if(SuperSolver.IsValidEmail($.trim($('#Email', this).val())) == false) {
                    navigator.notification.alert("Please enter a valid e-mail address.");
                    return false;
                }
            });

            $('.ResetPwdForm form').submit(function () {

                if ($.trim($('#Password', this).val()) == '') {
                    navigator.notification.alert('Please enter Password.',null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#ConfirmPassword', this).val()) == '') {
                    navigator.notification.alert('Please enter Confirm Password.',null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#Password', this).val()) != $.trim($('#ConfirmPassword', this).val())) {
                    navigator.notification.alert('Password and Confirm Password do not match.',null,"SuperSolver");
                    return false;
                }
            });
        }

        return {
            Init: function () {
                Init();
            }
        };
    } ();

    SuperSolver.Login = Login;
} (jQuery));
(function ($) {

    var Profile = function () {

        function Init() {
            $('.ProfileForm').submit(function () {

                if ($.trim($('#FirstName', this).val()) == '') {
                    navigator.notification.alert('Please enter First Name.',null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#Email', this).val()) == '') {
                    navigator.notification.alert('Please enter E-Mail Address.',null,"SuperSolver");
                    return false;
                }

                if(SuperSolver.IsValidEmail($.trim($('#Email', this).val())) == false) {
                    navigator.notification.alert("Please enter a valid e-mail address.",null,"SuperSolver");
                    return false;
                }
            });
        }

        function Init2() {
            $('.ChangePwdForm').submit(function () {

                if ($.trim($('#Password', this).val()) == '') {
                    navigator.notification.alert('Please enter Password.',null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#ConfirmPassword', this).val()) == '') {
                    navigator.notification.alert('Please enter Verify Password.',null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#Password', this).val()) != $.trim($('#ConfirmPassword', this).val())) {
                    navigator.notification.alert('Passwords do not match.',null,"SuperSolver");
                    return false;
                }
            });
        }

        return {
            Init: function () {
                Init();
                Init2();
            }
        };
    } ();

    SuperSolver.Profile = Profile;
} (jQuery));
; (function ($) {

    var Registration = function () {

        function Init() {
            $('.RegistrationForm form').submit(function () {

                if ($.trim($('#FirstName', this).val()) == '') {
                    navigator.notification.alert('Please enter First Name.',null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#Email', this).val()) == '') {
                    navigator.notification.alert('Please enter E-Mail Address.',null,"SuperSolver");
                    return false;
                }

                if(SuperSolver.IsValidEmail($.trim($('#Email', this).val())) == false) {
                    navigator.notification.alert("Please enter a valid e-mail address.",null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#Password', this).val()) == '') {
                    navigator.notification.alert('Please enter Password.',null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#ConfirmPassword', this).val()) == '') {
                    navigator.notification.alert('Please enter Confirm Password.',null,"SuperSolver");
                    return false;
                }

                if ($.trim($('#Password', this).val()) != $.trim($('#ConfirmPassword', this).val())) {
                    navigator.notification.alert('Password and Confirm Password do not match.',null,"SuperSolver");
                    return false;
                }
            });
        }

        return {
            Init: function () {
                Init();
            }
        };
    } ();

    SuperSolver.Registration = Registration;
} (jQuery));

//Adding Google oAuth
 var googleapi = {
 setToken: function(data) {
     //Cache the token
     localStorage.GG_Token = data.access_token;
     //Cache the refresh token, if there is one
     localStorage.GG_RefreshToken = data.refresh_token || localStorage.GG_RefreshToken;
     //Figure out when the token will expire by using the current
     //time, plus the valid time (in seconds), minus a 1 minute buffer
     var expiresAt = new Date().getTime() + parseInt(data.expires_in, 10) * 1000 - 60000;
     localStorage.GG_TokenExpires = expiresAt;
 },
 authorize: function(options) {
     var deferred = $.Deferred();
     
     //Build the OAuth consent page URL
     var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + $.param({
                                                                          client_id: options.client_id,
                                                                          redirect_uri: options.redirect_uri,
                                                                          response_type: 'code',
                                                                          scope: options.scope
                                                                          });
     
     //Open the OAuth consent page in the InAppBrowser
     //console.log(authUrl);
     var authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=yes');

     
     //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
     //which sets the authorization code in the browser's title. However, we can't
     //access the title of the InAppBrowser.
     //
     //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
     //authorization code will get set in the url. We can access the url in the
     //loadstart and loadstop events. So if we bind the loadstart event, we can
     //find the authorization code and close the InAppBrowser after the user
     //has granted us access to their data.
     $(authWindow).on('loadstart', function(e) {
                      var url = e.originalEvent.url;
                      var code = /\?code=(.+)$/.exec(url);
                      var error = /\?error=(.+)$/.exec(url);
                      
                      if (code || error) {
                      //Always close the browser when match is found
                      //setTimeout(function(){authWindow.close();},100);
                      }
                      
                      if (code) {
                      //Exchange the authorization code for an access token
                      $.post('https://accounts.google.com/o/oauth2/token', {
                             code: code[1],
                             client_id: options.client_id,
                             client_secret: options.client_secret,
                             redirect_uri: options.redirect_uri,
                             grant_type: 'authorization_code'
                             }).done(function(data) {
                                     googleapi.setToken(data);
                                     deferred.resolve(data);
                                     }).fail(function(response) {
                                             deferred.reject(response.responseJSON);
                                             });
                      } else if (error) {
                      //The user denied access to the app
                      deferred.reject({
                                      error: error[1]
                                      });
                      }
                      });
     
     return deferred.promise();
 },
 getToken: function(options) {
     var deferred = $.Deferred();
     
     if (new Date().getTime() < localStorage.GG_TokenExpires) {
         console.log("GG Token not expired. Returning stored access token.");
         deferred.resolve({
                          access_token: localStorage.GG_Token
                          });
     } else if (localStorage.GG_RefreshToken) {
         $.post('https://accounts.google.com/o/oauth2/token', {
                refresh_token: localStorage.GG_RefreshToken,
                client_id: options.client_id,
                client_secret: options.client_secret,
                grant_type: 'refresh_token'
                }).done(function(data) {
                        googleapi.setToken(data);
                        //console.log("Got new token. Returning new token: " + JSON.stringify(data));
                        deferred.resolve(data);
                        }).fail(function(response) {
                                deferred.reject(response.responseJSON);
                                });
     } else {
         console.log("Can't refresh token! Rejecting.");
         deferred.reject();
     }
     
     //console.log("getToken returning: " + JSON.stringify(deferred.promise()));
     return deferred.promise();
 },
 userInfo: function(options) {
     return $.getJSON('https://www.googleapis.com/oauth2/v2/userinfo', options);
 }
 };

 var glogin = {
 client_id: '770382090486.apps.googleusercontent.com',
 client_secret: 'UWfSio-emFdU1q-2FC4GWL8o',
 redirect_uri: 'http://mobile.supersolver.com/oAuthGA',
 scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
     
checkCredentials: function() {
     //Get the token, either from the cache
     //or by using the refresh token.
    console.log("Checking GG credentials.");    
         googleapi.getToken({
                        client_id: SuperSolver.GG_ID,
                        client_secret: SuperSolver.GG_Key
                        }).then(function(data) {
                                //Pass the token to the API call and return a new promise object
                                return googleapi.userInfo({ access_token: data.access_token });
                                }).done(function(user) {
                                        //Display a greeting if the API call was successful
                                        console.log("Credentials ok.");
                                        localStorage.GG_ID = user.id;
                                        localStorage.CustomerName = user.name;
                                        localStorage.CustomerFirstName = user.given_name;
                                        localStorage.CustomerLastName = user.family_name;
                                        localStorage.CustomerEmail = user.email;
                                        //console.log("CheckC logging in with: " + JSON.stringify(user));
                                        glogin.SS_login();
                                        }).fail(function() {
                                                //If getting the token fails, or the token has been
                                                //revoked, put user through Login process.
                                                glogin.getCredentials();
                                                });
 },
 getCredentials: function() {
     //Show the consent page
     console.log("Getting GG credentials.");
     googleapi.authorize({
                         client_id: SuperSolver.GG_ID,
                         client_secret: SuperSolver.GG_Key,
                         redirect_uri: this.redirect_uri,
                         scope: this.scope
                         }).done(function() {
                                 //login to SuperSolver
                                 googleapi.userInfo({access_token: localStorage.GG_Token}).done(function(user){
                                 localStorage.GG_ID = user.id;
                                 localStorage.CustomerName = user.name;
                                 localStorage.CustomerFirstName = user.given_name;
                                 localStorage.CustomerLastName = user.family_name;
                                 localStorage.CustomerEmail = user.email;
                                 //console.log("GetC Logging in with: " + JSON.stringify(user));
                                 glogin.SS_login();
                             })
                                 }).fail(function(data) {
                                         //Show an error message if access was denied
                                         navigator.notification.alert("There was a problem logging in through Google. Please try again or use another login method.", null, "SuperSolver");
                                         });
 },
 SS_login: function(){
            var ggdata = {};
            ggdata.FirstName = localStorage.CustomerFirstName;
            ggdata.LastName = localStorage.CustomerLastName;
            ggdata.Name = localStorage.CustomerName;
            ggdata.Email = localStorage.CustomerEmail;
            ggdata.GG_ID = localStorage.GG_ID;    
            //console.log("Posting to SS with: ", JSON.stringify(ggdata));         
               $.ajax({
                      type: 'POST',
                      url: SuperSolver.theURL + "ConnectGA2",
                      data: ggdata,
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
                            localStorage.LoginType = "3";
                            console.log("Successfully logged in via GG");
                            if (data.registration) {
                              navigator.notification.alert("Welcome to SuperSolver! Thank you for joining", null, "SuperSolver");
                            }
                            else {
                              navigator.notification.alert("Welcome back, " + localStorage.CustomerFirstName, null, "SuperSolver");
                            }

                            window.location.href = "app.html";
                            //$.mobile.changePage('app.html');
                        }
                        else
                        {
                        navigator.notification.alert("Sorry! There was a problem using your Google credentials with SuperSolver. Please try again or use another login method.",null,"SuperSolver");
                        }
                      }
                      });

 }
 };
