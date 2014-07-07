/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        if (localStorage.getItem("Initialized") === null){
            localStorage.setItem("locationid", "0")
            localStorage.setItem("CustomerID", "0");
            localStorage.setItem("CustomerFirstName", "");
            localStorage.setItem("CustomerLastName", "");
            localStorage.setItem("CustomerName", "Not Logged In");
            localStorage.setItem("CustomerEmail", "");
            localStorage.setItem("CustomerPassword", "");
            localStorage.setItem("LoginType", "0"); // 0 - Not logged in, 1 - SS, 2 - FB, 3 - GG, 4 - TW
            localStorage.setItem("GG_ID", "");
            localStorage.setItem("GG_Token", "");
            localStorage.setItem("GG_RefreshToken", "");
            localStorage.setItem("GG_TokenExpires", "");
            localStorage.setItem("TW_ID", "");
            localStorage.setItem("TW_Handle", "");
            localStorage.setItem("TW_Key", "");
            localStorage.setItem("TW_Secret", "");
            localStorage.setItem("FB_ID", "");
            localStorage.setItem("FB_Key", "");
            localStorage.setItem("AuthTokenName", "");
            localStorage.setItem("AuthTokenValue", "");
            localStorage.setItem("AuthTokenExpires", "");
            localStorage.setItem("Initialized", "1");
            localStorage.setItem("EstUDID", "B9407F30F5F8466EAFF925556B57FE6D");
            document.getElementById("MenuName").innerHTML=localStorage.CustomerName;

        }
        //console.log('CustomerID: ' + localStorage.CustomerID);
        //console.log('CustomerName: ' + localStorage.CustomerName);
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        //var parentElement = document.getElementById(id);
        //var listeningElement = parentElement.querySelector('.listening');
        //var receivedElement = parentElement.querySelector('.received');

        //listeningElement.setAttribute('style', 'display:none;');
        //receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },

};


function onSuccess(position) {
    console.log("Geo success.");
};

function onError(error) {
    navigator.notification.alert("Unable to retrive location. Are Location Services enabled?",null,"SuperSolver");
};
