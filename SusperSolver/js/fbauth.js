//////////////////////////
//
// Authentication
// See "Logging the user in" on https://developers.facebook.com/mobile
//
//////////////////////////

var user = [];

var permissions = ['user_status', 'publish_checkins', 'user_likes'];

//Detect when Facebook tells us that the user's session has been returned
function authUser() {
  FB.Event.subscribe('auth.statusChange', handleStatusChange);
}

// Handle status changes
function handleStatusChange(session) {
    //console.log('Got the user\'s session: ' + JSON.stringify(session));
    
    if (session.authResponse) {
        //document.body.className = 'connected';
        
        //Fetch user's id, name, and picture
        FB.api('/me', {
          fields: 'id, email, first_name, last_name, name'
        },
        function(response) {
          if (!response.error) {
            
            //console.log('Got the user\'s info: ' + JSON.stringify(response));
            localStorage.CustomerFirstName = response.first_name;
            localStorage.CustomerLastName = response.last_name;
            localStorage.CustomerName = response.name;
            localStorage.CustomerEmail = response.email;
            localStorage.FB_ID = response.id;
            var fbdata = {};
            fbdata.FirstName = localStorage.CustomerFirstName;
            fbdata.LastName = localStorage.CustomerLastName;
            fbdata.Name = localStorage.CustomerName;
            fbdata.Email = localStorage.CustomerEmail;
            fbdata.FB_ID = localStorage.FB_ID;    
            //console.log("Posting to SS with: ", fbdata);         
               $.ajax({
                      type: 'POST',
                      url: SuperSolver.theURL + "ConnectFB2",
                      data: fbdata,
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
                            localStorage.LoginType = "2";
                            //console.log("Successfully logged in via FB");
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
                        navigator.notification.alert("Sorry! There was a problem using your Facebook credentials with SuperSolver. Please try again or use another login method.",null,"SuperSolver");
                        }
                      }
                      });

          } else {
            //console.log('Error getting user info: ' + JSON.stringify(response.error));
            // Check for errors due to app being unininstalled
            if (response.error.error_subcode && response.error.error_subcode == "458") {
              setTimeout(function() {
                navigator.notification.alert("SuperSolver is not authorized. Please log in again.");
              }, 0);              
            }
            logout();         
          }
          
          clearAction();
        });
    }
    else  {
      navigator.notification.alert("Sorry, unable to Facebook right now.",null,"SuperSolver");
    
      clearAction();
    }
}

//Check the current permissions to set the page elements.
//Pass back a flag to check for a specific permission, to
//handle the cancel detection flow.
function checkUserPermissions(permissionToCheck) {
  var permissionsFQLQuery = 'SELECT ' + permissions.join() + ' FROM permissions WHERE uid = me()';
  FB.api('/fql', { q: permissionsFQLQuery },
    function(response) {
      if (document.body.className != 'not_connected') {
          for (var i = 0; i < permissions.length; i++) {
            var perm = permissions[i];
            var enabledElementName = document.getElementById('enabled_perm_' + perm);
            var disabledElementName = document.getElementById('disabled_perm_' + perm);
            if (response.data[0][perm] == 1) {
              enabledElementName.style.display = 'block';
              disabledElementName.style.display = 'none';
            } else {
              enabledElementName.style.display = 'none';
              disabledElementName.style.display = 'block';
            }
          }
          if (permissionToCheck) {
            if (response.data[0][permissionToCheck] == 1) {
              setAction("The '" + permissionToCheck + "' permission has been granted.", false);
              setTimeout('clearAction();', 2000);
              return true;
            } else {
              setAction('You need to grant the ' + permissionToCheck + ' permission before using this functionality.', false);
              setTimeout('clearAction();', 2000);
            } return false;
          }
          return true;
      }
  });
}

function getLoginStatus() {
    FB.getLoginStatus(function(response) {
                      if (response.status == 'connected') {
                      alert('Successfully logged in through Facebook!');
                      me();
                      } else {
                      alert('not logged in');
                      }
                      });
}

function me() {
  FB.api('/me', { fields: 'id, email, first_name, last_name' },  function(response) {
    if (response.error) {
      alert(JSON.stringify(response.error));
    } else {
      //console.log("FB User info: "+ response);
      localStorage.CustomerFirstName = response.first_name;
      localStorage.CustomerLastName = response.last_name;
      localStorage.CustomerName = response.name;
      localStorage.CustomerEmail = response.email;
      localStorage.FB_ID = response.id;
     }
    });
}

//Prompt the user to login and ask for the 'email' permission
function promptLogin() {
  FB.login(null, {scope: 'email'});
}

//This will prompt the user to grant you acess to a given permission
function promptPermission(permission) {
  FB.login(function(response) {
    if (response.authResponse) {
      checkUserPermissions(permission)
    }
  }, {scope: permission});
}

//See https://developers.facebook.com/docs/reference/api/user/#permissions
function uninstallApp() {
  FB.api('/me/permissions', 'DELETE',
    function(response) {
      //window.location.reload();
      // For may instead call logout to clear
      // cache data, ex: using in a PhoneGap app
      console.log('APP Uninstalled');
      logout();
  });
}

//See https://developers.facebook.com/docs/reference/javascript/FB.logout/
function logout() {
  FB.logout(function(response) {
    //window.location.reload();
  });
}