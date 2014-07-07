; (function ($) {

    var LM = SuperSolver.LocationManager,
    PageCls = '.Page',
    HeaderCls = '.Header',
    px = 'px',
    MapHelper = null,
    ErrMsg = {
        NO_RESULT: 'No Results Available.',
        NO_ADDR: 'Cannot find address.'
    };

    MapHelper = function () {

        var gMap, gPlaces, geocoder, infoWindow, infoWindow2, markersArray = [], oms,
            mapDiv = '#Google_Map', selectCB, canPerform = false, storedBusinessName, lastCB, searchMap = '#RedoSearch',
            startIdx, isInPage = false, currentCacheLocation, currentPagination, resultCache = [], hasMore = false, curUserLoc = null,
            homeLocation, homeBusinessName, IsRedo = false, curLocMarker = null;

        function Init() {

            var GMAPS = google.maps,
            tmr = null;

            gMap = new GMAPS.Map($(mapDiv)[0], {
                mapTypeId: GMAPS.MapTypeId.ROADMAP,
                zoom: 13,
                center: new GMAPS.LatLng(-34.397, 150.644),
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.DEFAULT,
                    position: google.maps.ControlPosition.TOP_RIGHT
                },
                panControl: false,
                zoomControl: true,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.DEFAULT,
                    position: google.maps.ControlPosition.LEFT_TOP
                },
                scaleControl: false,                
                streetViewControl: false, //2-21-14: removing street view option
                /*streetViewControlOptions: {
                    position: google.maps.ControlPosition.TOP_LEFT
                }*/
            });

            oms = new OverlappingMarkerSpiderfier(gMap, { keepSpiderfied : true });

            google.maps.event.addListener(gMap, 'dragend', function () {

                if (canPerform == false) {
                    $(searchMap).hide();
                    return;
                }

                clearTimeout(tmr);
                tmr = setTimeout(function () {
                    $(searchMap).show();
                }, 500);
            });

            //adding code to open href's in inApp browser otherwise messes up PG
            var pattern = "a[href^='http://']";      // detect all urls starting with urlPattern

            $(document).on('click', mapDiv + ' a[target="_blank"]', function(e){
                //console.log("href preventer firing");
                e.preventDefault();
                window.open($(this).attr("href"), '_system', '');      // '_system' will open the system web browser, '_blank' will open the InAppBrowser
            });

            //adding code to remove photos from default infowindows - not working!!
            /*$(document).on('click', mapDiv, function(e){
                console.log("firing remove photos");
                $(".gm-photos").remove;
            });*/
            
            
            oms.addListener('click', function(marker, event) {
                
                if(marker.Txt == 'Current Location') {
                    infoWindow2.setContent('Current Location');
                    infoWindow2.open(gMap, marker);
                } else {
                    var msgArray = new Array(),
                    pl = marker.inner_place,
                    num = marker.num;

                    msgArray.push('<div class="InfoWindow">');
                    msgArray.push('<h3>' + pl.displayname2 + '</h3>');
                    msgArray.push('<div class="Cat"><table><tr><td class="c1">' + pl.first_cat + '</td><td class="c2"><span>' + pl.miles + '</span></td></tr></table></div>');
                    msgArray.push('<div class="Addr">' + ((pl.parsed_address != null && pl.parsed_address.address.CanUse) ? pl.parsed_address.address_string : pl.vicinity) + '</div>');
                    msgArray.push('<div class="Action"><a href="javascript:;" rel="' + (num - 1) + '">SELECT THIS BUSINESS</a></div>');
                    msgArray.push('</div>');

                    infoWindow.setContent(msgArray.join(''));
                    infoWindow.open(gMap, marker);

                    $('.InfoWindow .Action a').click(function (evt) {

                        if (selectCB) {
                            selectCB($(this).attr('rel'));
                        }
                    });
                }
            });

            gPlaces = new GMAPS.places.PlacesService(gMap);

            geocoder = new GMAPS.Geocoder();

            infoWindow = new GMAPS.InfoWindow();
            infoWindow2 = new GMAPS.InfoWindow();

            $(window).bind('orientationchange', function () {
                setTimeout(function () {
                    ResizeMap();
                }, 50);
            });

            $(window).bind('resize', function () {
                setTimeout(function () {
                    ResizeMap();
                }, 50);
            });

            $('.SearchMap').click(function () {
                var latlng = gMap.getCenter();
                IsRedo = true;
                PerformSearch({ lat: latlng.lat(), lng: latlng.lng() }, storedBusinessName, lastCB, false);
            });

            $('.HomeMap').click(function () {
                IsRedo = true;
                PerformSearch({ lat: homeLocation.lat, lng: homeLocation.lng }, storedBusinessName, lastCB, true);
            });

            //            $('#HomeIcon').click(function() {
            //                PerformSearch({lat:homeLocation.lat, lng:homeLocation.lng}, storedBusinessName, lastCB);
            //            });

            LM.Location(function (loc, msg) {

                if (loc == null) {

                } else {
                    //console.log("MapHelper.Init, LM.Location, Updating loc: " + loc.lat + ", " + loc.lng);
                    curUserLoc = loc;
                }
            });

            ResizeMap();
        }

        function UpdateHomeData() {

            homeLocation = currentCacheLocation;
            homeBusinessName = storedBusinessName;
        }

        function ResizeMap(force) {

            function Pad(ele, pos) {
                return parseInt(ele.css('padding-' + pos).replace(px, ''));
            }

            if ($(mapDiv).is(':visible')) {

                var currentPage = $($(mapDiv).parents(PageCls)[0]),
                parent = $(mapDiv).parent(),
                padding = Pad(parent, 'top') + Pad(parent, 'bottom'),
                padding2 = Pad(parent, 'left') + Pad(parent, 'right'),
                body = $('.Container'),
                ovf = 'overflow';

                body.css(ovf, 'hidden');
                $(mapDiv).css({
                    width: (body.innerWidth() - padding2 - 2) + px,
                    height: ($(window).height() - $(HeaderCls, currentPage).height() - padding - 2) + px
                });
                body.css(ovf, '');

                if (gMap != null) {
                    google.maps.event.trigger(gMap, 'resize');
                    AutoCenter();
                }
            }
        }

        function PerformSearch(location, name, cbObj, useLocation) {

            var ll = new google.maps.LatLng(location.lat, location.lng),
                request = {},
                types = ["establishment"];

            if (name != '') {
                name = name.replace(/[\.]/g,' ');
                name = name.replace(/[\-]/g,' ');
                name = name.replace(/[']/g,'');
                name = name.replace(/[^a-zA-Z0-9]/g,' ');                
                request = { location: ll, name: '"' + name + '"', keyword: '"' + name + '"', rankBy: google.maps.places.RankBy.DISTANCE, types: types };
            } else {
                request = { location: ll, rankBy: google.maps.places.RankBy.DISTANCE, types: types };
            }

            currentCacheLocation = location;
            startIdx = 0;
            hasMore = false;
            canPerform = false;
            isInPage = false;
            storedBusinessName = name;
            currentPagination = null;
            lastCB = cbObj;
            $(searchMap).hide();

            gMap.setCenter(ll);

            gPlaces.nearbySearch(request, function (results, status, pagination) {

                if (status == google.maps.places.PlacesServiceStatus.OK) {

                    cbObj.Success();

                    if (isInPage == false) {
                        ClearMarkers();
                    }

                    if (name == '') {

                        function SortByMiles(a, b) {
                            var aMiles = LM.Distance(a.geometry.location.lat(),
                                                    a.geometry.location.lng(),
                                                    location.lat,
                                                    location.lng),
                                bMiles = LM.Distance(b.geometry.location.lat(),
                                                    b.geometry.location.lng(),
                                                    location.lat,
                                                    location.lng);
                            return ((aMiles < bMiles) ? -1 : ((aMiles > bMiles) ? 1 : 0));
                        }

                        results.sort(SortByMiles);
                    }

                    if (results.length > 10) {
                        resultCache = results.splice(10, 10);
                    }

                    AssignCompanyNamesToResults(results, function () {

                        startIdx += results.length;

                        hasMore = pagination.hasNextPage || resultCache.length > 0;
                        currentPagination = pagination;

                        if (useLocation == true ) { CurrentLocationMarker(location);}

                        if (isInPage == false) {
                            AutoCenter();
                        }

                        cbObj.Complete(results, hasMore);
                        IsRedo = false;
                    });

                } else {
                    cbObj.Error(ErrMsg.NO_RESULT);
                    cbObj.Complete(results, hasMore);
                    IsRedo = false;
                }
            });
        }

        function CurrentLocationMarker(location) {

            if (curUserLoc == null)
                return;

            if (curLocMarker != null) {
                oms.removeMarker(curLocMarker);
                curLocMarker.setMap(null);
                curLocMarker = null;
                //console.log("curLocMarker set to null");
            }

            var ll = new google.maps.LatLng(location.lat, location.lng);

            curLocMarker = new google.maps.Marker({
                position: ll,
                map: gMap,
                icon: new google.maps.MarkerImage(SuperSolver.GMBlueDot,
                            null,
                            null,
                            null,
                            new google.maps.Size(28, 28))
            });
            //console.log("curLocMarker set to :" + location.lat +", " + location.lng);
            curLocMarker.setZIndex(curLocMarker.getZIndex() - 1);
            curLocMarker.Txt = 'Current Location';

            oms.addMarker(curLocMarker);

            /*
            google.maps.event.addListener(curLocMarker, 'click', function () {

                infoWindow2.setContent('Current Location');
                infoWindow2.open(gMap, this);
            });
            */
        }

        function AssignCompanyNamesToResults(results, otherCB) {

            var ii;
            var ids = new Array();

            for (ii = 0; ii < results.length; ii++) {
                ids.push(results[ii].id);
            }

            $.post(SuperSolver.API + '/GetCompanyNames', { GBIds: ids.join(',') }, function (obj) {

                if (obj.Success) {
                    for (ii = 0; ii < obj.data.length; ii++) {
                        results[ii].CompanyName = obj.data[ii].CompanyName;
                        results[ii].CategoryID = obj.data[ii].CategoryID;
                        results[ii].IsForceEmail = obj.data[ii].IsForceEmail;
                    }
                }

            }).complete(function () {
                PerformOnResults(results);
                otherCB();
            });
        }

        function PerformOnResults(results) {

            var ii;

            for (ii = 0; ii < results.length; ii++) {

                var place = results[ii],
                resultLocation = place.geometry.location;

                place.displayname2 = place.CompanyName != "" ? place.CompanyName : place.name;
                place.displayname = (startIdx + ii + 1) + '. ' + place.displayname2;
                place.first_cat = GetFirstCategory(place.types).split('_').join(' ').Capitalize();
                place.miles = LM.Distance(resultLocation.lat(),
                                            resultLocation.lng(),
                                            currentCacheLocation.lat,
                                            currentCacheLocation.lng) + ' miles';
                place.photo = String.format(SuperSolver.GImgAPI, resultLocation.lat(), resultLocation.lng());
                place.photo2 = String.format(SuperSolver.GImgAPI2, resultLocation.lat(), resultLocation.lng());
                place.formatted_address = '';
                place.parsed_address = { address: { StreetNumber: '', StreetName: '', City: '', State: '', PostalCode: '', CanUse: false }, address_string: '' };
                place.vicinity = place.vicinity.replace(', United States', '');

                SetupMarker(place, startIdx + ii + 1);
                GetMoreDetails(place, startIdx + ii);
            }
        }

        function GetFirstCategory(types) {

            var idx = 0,
            selCat = SuperSolver.GoogCat[types[0]] != undefined ? SuperSolver.GoogCat[types[0]].text : '',
            ii;

            for (ii = 1; ii < types.length; ii++) {
                if (SuperSolver.GoogCat[types[ii]] != undefined && SuperSolver.GoogCat[types[ii]].num > idx) {
                    idx = SuperSolver.GoogCat[types[ii]].num;
                    selCat = SuperSolver.GoogCat[types[ii]].text;
                }
            }

            return selCat;
        }

        function PerformMoreResult() {

            isInPage = true;

            if (resultCache.length > 0) {

                var results = resultCache;
                resultCache = [];

                AssignCompanyNamesToResults(results, function () {

                    startIdx += results.length;

                    hasMore = currentPagination.hasNextPage;

                    lastCB.Complete(results, hasMore);
                });

            } else {

                isInPage = true;
                currentPagination.nextPage();
            }
        }

        function GetMoreDetails(place, ii) {

            gPlaces.getDetails({
                reference: place.reference
            }, function (updated_place, status) {

                if (status == google.maps.places.PlacesServiceStatus.OK) {

                    place.parsed_address = ParseAddressComponents(updated_place.address_components);
                    if (place.parsed_address != null && place.parsed_address.address.CanUse) {
                        place.formatted_address = place.parsed_address.address_string;
                    } else {
                        place.formatted_address = updated_place.formatted_address.replace(', United States', '');
                    }
                }

                if (markersArray.length > ii) {
                    UpdateMarkerPlace(ii, place);
                }
            });
        }

        function ParseAddressComponents(addr) {

            var ii, jj,
            obj = {
                StreetNumber: '', //address street number
                StreetName: '', //the street name
                City: '', //the city/town    OR administrative_area_level_3 OR administrative_area_level_1;
                State: '',
                PostalCode: '',
                CanUse: false
            }, arr = [];

            for (ii = 0; ii < addr.length; ii++) {

                for (jj = 0; jj < addr[ii].types.length; jj++) {

                    if (addr[ii].types[jj] == 'street_number') {
                        obj.StreetNumber = addr[ii].long_name;
                    } else if (addr[ii].types[jj] == 'route') {
                        obj.StreetName = addr[ii].long_name;
                    } else if (addr[ii].types[jj] == 'locality') {
                        obj.City = addr[ii].long_name;
                    } else if (addr[ii].types[jj] == 'administrative_area_level_3' && obj.City == '') {
                        obj.City = addr[ii].long_name;
                    } else if (addr[ii].types[jj] == 'administrative_area_level_1') {
                        obj.State = addr[ii].long_name;
                    } else if (addr[ii].types[jj] == 'postal_code') {
                        obj.PostalCode = addr[ii].long_name;
                    }
                }
            }

            if (obj.StreetNumber != '') { arr.push(obj.StreetNumber); }

            if (obj.StreetName != '') {
                if (arr.length > 0) {
                    arr.push(' ');
                }
                arr.push(obj.StreetName);
            }

            if (obj.City != '') {
                if (arr.length > 0) {
                    arr.push(', ');
                }
                arr.push(obj.City);
            }

            if (obj.State != '') {
                if (arr.length > 0) {
                    arr.push(', ');
                }
                arr.push(obj.State);
            }

            if (obj.PostalCode != '') {
                if (arr.length > 0) {
                    arr.push(' ');
                }
                arr.push(obj.PostalCode);
            }

            if ((obj.StreetNumber != '' || obj.StreetName != '') && obj.City != '' && obj.State != '' && obj.PostalCode != '') {
                obj.CanUse = true;
            }

            return {
                address: obj,
                address_string: arr.join('')
            }
        }

        function GeoCodeSearch(locationStr, businessName, cbObj) {

            geocoder.geocode({ 'address': locationStr }, function (results, status) {

                if (status == google.maps.GeocoderStatus.OK) {

                    if (results.length > 0) {
                        var location = results[0].geometry.location;
                        PerformSearch({ lat: location.lat(), lng: location.lng() }, businessName, cbObj, false);
                        return;
                    } else {
                        cbObj.Error(ErrMsg.NO_ADDR);
                    }
                } else {
                    cbObj.Error(ErrMsg.NO_ADDR);
                }

                cbObj.Complete(null, false);
            });
        }

        function SetupMarker(place, num) {

            var marker = new google.maps.Marker({
                position: place.geometry.location,
                map: gMap,
                icon: new google.maps.MarkerImage(String.format(SuperSolver.GMIcon, num),
                          null,
                          null,
                          null,
                          new google.maps.Size(20, 29)),
                shadow: new google.maps.MarkerImage(SuperSolver.GMShadowIcon,
                          null,
                          new google.maps.Point(0, 0),
                          new google.maps.Point(10, 29),
                          new google.maps.Size(38, 29))
            });
            marker.inner_place = place;
            marker.num = num;
            marker.Txt = 'Normal';

            oms.addMarker(marker);

            /*
            google.maps.event.addListener(marker, 'click', function () {

                var msgArray = new Array(),
                pl = marker.inner_place;

                msgArray.push('<div class="InfoWindow">');
                msgArray.push('<h3>' + pl.displayname2 + '</h3>');
                msgArray.push('<div class="Cat"><table><tr><td class="c1">' + pl.first_cat + '</td><td class="c2"><span>' + pl.miles + '</span></td></tr></table></div>');
                msgArray.push('<div class="Addr">' + ((pl.parsed_address != null && pl.parsed_address.address.CanUse) ? pl.parsed_address.address_string : pl.vicinity) + '</div>');
                msgArray.push('<div class="Action"><a href="javascript:;" rel="' + (num - 1) + '">SELECT THIS BUSINESS</a></div>');
                msgArray.push('</div>');

                infoWindow.setContent(msgArray.join(''));
                infoWindow.open(gMap, this);

                $('.InfoWindow .Action a').click(function (evt) {

                    if (selectCB) {
                        selectCB($(this).attr('rel'));
                    }
                });
            });
            */

            markersArray.push(marker);
        }

        function UpdateMarkerPlace(markerIndex, place) {
            markersArray[markerIndex].inner_place = place;
        }

        function ClearMarkers() {

            var i;

            for (i in markersArray) {
                markersArray[i].setMap(null);
            }

            if (curLocMarker != null) {
                curLocMarker.setMap(null);
                curLocMarker = null;
            }

            oms.clearMarkers();

            markersArray.length = 0;
            //console.log("markers cleared");
        }

        function AutoCenter() {

            var bounds = new google.maps.LatLngBounds();

            $.each(markersArray, function (index, marker) {
                bounds.extend(marker.position);
            });

            gMap.fitBounds(bounds);

            setTimeout(function () {
                canPerform = true;
            }, 1000);
        }

                                      document.addEventListener("deviceready", DeviceReadyMap, false);
                                      function DeviceReadyMap(){
                                      if ($(mapDiv).length > 0) {
                                      //console.log("MapInit calling Init");
                                      Init();
                                      }
                                      };

        return {
            IsRedoSet: function () {
                return IsRedo;
            },

            PerformSearch: function (location, name, cbObj, useLocation) {
                PerformSearch(location, name, cbObj, useLocation);
            },
            GeoCodeSearch: function (locationStr, businessName, cbObj) {
                GeoCodeSearch(locationStr, businessName, cbObj);
            },
            Refresh: function () {
                ResizeMap();
            },
            SetSelectCB: function (cb) {
                selectCB = cb;
            },
            PerformMoreResult: function () {
                PerformMoreResult();
            },
            UpdateHomeData: function () {
                UpdateHomeData();
            }
        };
    } ();

    SuperSolver.MapHelper = MapHelper;

} (jQuery));
; (function ($) {

    function SearchModel() {

        var self = this;
        self.Location = ko.observable('Current Location');
        self.BusinessName = ko.observable('');
        self.oldLocation = '';
        self.oldBusinessName = '';
        self.BeaconResults = ko.observableArray();
        self.Results = ko.observableArray();
        self.HasMore = ko.observable(false);
        self.SelectedPlace = ko.observable(null);
        self.IsSelected = ko.observable(false);
        self.HideBackInComplaint = ko.observable(false);
        self.Latitude = null;
        self.Longitude = null;
    }

    function SelectPlaceModel() {

        var self = this;

        self.id = ko.observable('');
        self.reference = ko.observable('');
        self.LocationID = ko.observable('');
        self.CompanyID = ko.observable('');
        self.CategoryID = ko.observable('');
        self.IsForceEmail = ko.observable('');
        self.name = ko.observable('');
        self.displayname = ko.observable('');
        self.displayname2 = ko.observable('');
        self.first_cat = ko.observable('');
        self.miles = ko.observable('');
        self.photo = ko.observable('');
        self.vicinity = ko.observable('');
        self.formatted_address = ko.observable('');
        self.categories = ko.observableArray();
        self.complaint_types = ko.observableArray();
        self.selected_complaints = ko.observableArray();
        self.parsed_address = ko.observable();
        self.addl_feedback = ko.observable('');

        self.has_feedback = ko.computed(function () {
            if (self.addl_feedback().length > 0) {
                return true;
            }
            return false;
        });

        self.Latitude = null;
        self.Longitude = null;
    }

    function MainComplaintType(model) {

        this.model = model;
        this.id = ko.observable('');
        this.name = ko.observable('');
        this.sub_complaint_types = ko.observableArray();
    }

    function SubComplaintType(main) {

        var self = this;
        self.main = main;
        self.id = ko.observable('');
        self.main_id = ko.observable('');
        self.name = ko.observable('');
        self.selected = ko.observable(false);
        self.onSelected = function () {

            var fullId = self.id() + '_' + self.main_id(), arr;

            if (self.selected()) {

                self.selected(false);

                arr = self.main.model.selected_complaints();
                arr = $.grep(arr, function (a) {
                    return a.id != fullId;
                });
                self.main.model.selected_complaints(arr);

            } else {

                self.selected(true);

                arr = self.main.model.selected_complaints();
                arr.push({
                    id: fullId,
                    MainComplaintTypeID: self.main_id(),
                    SubComplaintTypeID: self.id(),
                    main_name: self.main.name(),
                    sub_name: self.name()
                });
                self.main.model.selected_complaints(arr);

            }
        }
    }

    SuperSolver.Models = SuperSolver.Models || {};
    SuperSolver.Models.Search = {};
    SuperSolver.Models.Search.SearchModel = SearchModel;
    SuperSolver.Models.Search.SelectPlaceModel = SelectPlaceModel;
    SuperSolver.Models.Search.MainComplaintType = MainComplaintType;
    SuperSolver.Models.Search.SubComplaintType = SubComplaintType;

} (jQuery));
; (function ($) {

    var LM = SuperSolver.LocationManager,
    Loader = SuperSolver.Loader,
    MapHelper = SuperSolver.MapHelper,
    SearchModels = SuperSolver.Models.Search,
    SearchModel = new SearchModels.SearchModel(),
    PageCls = '.Page',
    HeaderCls = '.Header',
    //px = 'px',
    ResultHeader = '.Page[data-page="Result"] .Header';

    SearchModel.Location.subscribe(function (newValue) {

        if (newValue == "Current Location") {
            $('.LocationInput').addClass('BlueTxt');
        } else {
            $('.LocationInput').removeClass('BlueTxt');
        }
    });

    var Search = function () {

        function Init(LocationID) {

            CheckLocationService();
            ko.applyBindings(SearchModel);
            SearchHeadExt();
            HandleSearch();
            HandleSwitch();
            HandlePlaceSelection();
            MapHelper.SetSelectCB(SelectPlace);
            HandlePrevNext1();
            HandleBeacons();

            if (LocationID != 0) {
                ShowVirtualLocation(LocationID, true);
            }

            $('#txtLocationMain').on('focus', function(evt) {
                if($.trim($('#txtLocationMain').val()) == 'Current Location') {
                    SearchModel.Location('');
                }
            });

            $('#txtLocationMain').on('blur', function(evt) {
                if($.trim($('#txtLocationMain').val()) == '') {
                    SearchModel.Location('Current Location');
                }
            });

             $('#txtLocationTop').on('focus', function(evt) {
                if($.trim($('#txtLocationTop').val()) == 'Current Location') {
                    SearchModel.Location('');
                }
            });

            $('#txtLocationTop').on('blur', function(evt) {
                if($.trim($('#txtLocationTop').val()) == '') {
                    SearchModel.Location('Current Location');
                }
            });
        }

        function CheckLocationService() {

            var errorDiv = '.LocationError',
                hasLocation = false;

            hasLocation = LM.Location(function (loc, msg) {
                console.log("CLS - LM.Location returned: " + loc.lat + ", " + loc.lng + ", " + msg);
                if (loc == null) {
                    if (msg != null) {
                        $(errorDiv).html(msg).removeClass('Hide');
                    }
                } else {
                    $(errorDiv).remove();
                }
            });
            console.log("CLS - hasLocation: " + hasLocation);
            if (!hasLocation) {
                $(errorDiv).removeClass('Hide');
            }
        }

        function ShowPage(page) {

            $(PageCls).hide();
            $('.Page[data-page="' + page + '"]').show();
        }

        function SearchHeadExt() {

            SearchModel.oldLocation = SearchModel.Location();

            $('.LocationIcon,.LocationIcon2').click(function () {
                SearchModel.Location('Current Location');
            });

            $('.TopSearchPH').click(function (evt) {

                StopEvent(evt);

                var target = evt.target,
                header = $(target).parents(HeaderCls);

                $(header).addClass('BigHd');
                $('input:first', header).focus();

                SearchModel.oldLocation = SearchModel.Location();
                SearchModel.oldBusinessName = SearchModel.BusinessName();

                RefreshMap();
            });

            $(document).click(function (evt) {

                var target = evt.target,
                header = $(target).parents(HeaderCls);

                if (header != null && header.length > 0) {

                    var hd = $(header[0]);

                    if (hd.hasClass('BigHd')) {
                        return;
                    }
                }

                if ($(ResultHeader).hasClass('BigHd')) {

                    SearchModel.Location(SearchModel.oldLocation);
                    SearchModel.BusinessName(SearchModel.oldBusinessName);

                    $(ResultHeader).removeClass('BigHd');

                    RefreshMap();
                }
            });
        }

        function HandleSwitch() {

            $('.SwitchBtn').click(function () {

                $('.SwitchBtn').toggleClass('Hide');

                $('.Content', $(this).parents('.Page')[0]).toggleClass('ShowMap');

                RefreshMap();
            });
        }

        function HandleSearch() {

            $('.Search, .SearchSm').click(function () {

                SearchModel.Results([]);

                $(ResultHeader).removeClass('BigHd');
                RefreshMap();

                var locationStr = $.trim(SearchModel.Location()),
                businessName = $.trim(SearchModel.BusinessName());

                Loader.Show();

                $.post(SuperSolver.API + '/GoogleBusinessNameSearch', { SearchBusinessName: businessName }, function (data) {
                    businessName = data.BusinessName;
                    DoSearchCB(locationStr, businessName)
                });
            });

            $('.LoadMore').click(function () {
                MapHelper.PerformMoreResult();
            });
        }

        function DoSearchCB(locationStr, businessName) {

            var shouldUpdateHome = true;

            SearchModel.oldLocation = locationStr;
            SearchModel.oldBusinessName = businessName;

            if (locationStr == "Current Location") {

                Loader.Show();

                LM.Location(function (loc, msg) {

                    SearchModel.Latitude = null;
                    SearchModel.Longitude = null;

                    if (loc == null) {
                        if (msg != null) {
                            navigator.notification.alert(msg,null,"SuperSolver");
                            Loader.Hide();
                        }
                    } else {

                        SearchModel.Latitude = loc.lat;
                        SearchModel.Longitude = loc.lng;
                        console.log("LM.Location, Updating loc: " + loc.lat + ", " + loc.lng);
                        MapHelper.curUserLoc = loc;
                        
                        //console.log("Calling PerformSearch with Location lat: " + loc.lat + ", lng: " + loc.lng);
                        MapHelper.PerformSearch(loc, businessName, {
                            Success: function () {
                                ShowPage('Result');
                            },
                            Error: function (msg) {
                                navigator.notification.alert(msg,null,"SuperSolver");
                            },
                            Complete: function (results, hasMore) {

                                if (shouldUpdateHome) {
                                    MapHelper.UpdateHomeData();
                                    shouldUpdateHome = false;
                                }

                                if (results != null) {
                                    var tmp = SearchModel.Results() || [];

                                    if (MapHelper.IsRedoSet() == true)
                                        tmp = results;
                                    else
                                        tmp = tmp.concat(results);

                                    SearchModel.Results(tmp);
                                } else {
                                    SearchModel.Results([]);
                                }

                                SearchModel.HasMore(hasMore);

                                Loader.Hide();
                            }
                        }, true);
                    }
                });
            } else {
                if (locationStr == '') {
                    navigator.notification.alert('Please enter a nearby location.',null,"SuperSolver");
                    return;
                }

                SearchModel.Latitude = null;
                SearchModel.Longitude = null;

                Loader.Show();

                MapHelper.GeoCodeSearch(locationStr, businessName, {
                    Success: function () {
                        ShowPage('Result');
                    },
                    Error: function (msg) {
                        navigator.notification.alert(msg,null,"SuperSolver");
                    },
                    Complete: function (results, hasMore) {

                        if (shouldUpdateHome) {
                            MapHelper.UpdateHomeData();
                            shouldUpdateHome = false;
                        }

                        if (results != null) {
                            var tmp = SearchModel.Results() || [];

                            if (MapHelper.IsRedoSet() == true)
                                tmp = results;
                            else
                                tmp = tmp.concat(results);

                            SearchModel.Results(tmp);
                        } else {
                            SearchModel.Results([]);
                        }
                        SearchModel.HasMore(hasMore);

                        Loader.Hide();
                    }
                });
            }
        }

        function HandlePlaceSelection() {

            $('#Results_List').on('click', '.ResultRow', function (evt) {

                var target = evt.target,
                parent = $(target).parents('.ResultRow')[0],
                idx = $('.Idx', parent).val();

                SelectPlace(idx);
            });
        }

        function SelectPlace(idx) {

            ShowPage('SelectComplaint');

            SearchModel.IsSelected(true);

            var selPlaceModel = new SearchModels.SelectPlaceModel(),
            selObj = SearchModel.Results()[idx];

            SearchModel.SelectedPlace(selPlaceModel);

            selPlaceModel.id(selObj.id);
            selPlaceModel.reference(selObj.reference);
            selPlaceModel.name(selObj.name);
            selPlaceModel.displayname(selObj.name);
            selPlaceModel.displayname2(selObj.displayname2);
            selPlaceModel.photo(selObj.photo2);
            selPlaceModel.miles(selObj.miles);
            selPlaceModel.vicinity(selObj.vicinity);
            selPlaceModel.first_cat(selObj.first_cat);
            selPlaceModel.categories(selObj.types);
            selPlaceModel.CategoryID(selObj.CategoryID);
            selPlaceModel.IsForceEmail(selObj.IsForceEmail);
            selPlaceModel.formatted_address(selObj.formatted_address != '' ? selObj.formatted_address : selObj.vicinity);
            selPlaceModel.parsed_address(selObj.parsed_address);
            selPlaceModel.Latitude = selObj.geometry.location.lat();
            selPlaceModel.Longitude = selObj.geometry.location.lng();

            GetComplaintTypes(selPlaceModel, GetFirstCategory(selPlaceModel.categories()), selPlaceModel.CategoryID(), function(mc_types) {
                selPlaceModel.complaint_types(mc_types);
            });
        }

        function GetFirstCategory(types) {

            var idx = 0,
            selCat = types[0],
            ii;

            for (ii = 1; ii < types.length; ii++) {
                if (SuperSolver.GoogCat[types[ii]] != undefined && SuperSolver.GoogCat[types[ii]].num > idx) {
                    idx = SuperSolver.GoogCat[types[ii]].num;
                    selCat = types[ii];
                }
            }

            return selCat;
        }

        function ShowVirtualLocation(id, hide) {

            $.getJSON(SuperSolver.API + '/GetLocation', { ID: id }, function (data) {
                var oLocation = data.location,
                oCompany = data.company,
                categoryName = data.categoryName;

                if (oCompany.CompanyName != '') {

                    ShowPage('SelectComplaint');
                    SearchModel.IsSelected(true);
                    SearchModel.HideBackInComplaint(hide);

                    var selPlaceModel = new SearchModels.SelectPlaceModel();
                    SearchModel.SelectedPlace(selPlaceModel);

                    selPlaceModel.id(oLocation.GoogleBusinessID);
                    selPlaceModel.reference(oLocation.GoogleBusinessReference);
                    selPlaceModel.LocationID(oLocation.LocationID);
                    selPlaceModel.CompanyID(oCompany.CompanyID);
                    selPlaceModel.CategoryID(oCompany.CategoryID);
                    selPlaceModel.IsForceEmail(oCompany.IsForceEmail);
                    selPlaceModel.name(oCompany.CompanyName);
                    selPlaceModel.displayname(oCompany.CompanyName);
                    selPlaceModel.displayname2(oCompany.CompanyName);
                    if (oCompany.CompanyLogo.length > 0) {
                        //alert("Image URL: " + SuperSolver.baseURL + oCompany.CompanyLogo);
                        selPlaceModel.photo(SuperSolver.baseURL + oCompany.CompanyLogo);
                    } else {
                        if (Math.abs(oLocation.Latitude) > 0) {
                            selPlaceModel.photo(String.format(SuperSolver.GImgAPI2, oLocation.Latitude, oLocation.Longitude));

                            selPlaceModel.Latitude = oLocation.Latitude;
                            selPlaceModel.Longitude = oLocation.Longitude;
                        }
                    }
                    selPlaceModel.first_cat(categoryName);
                    selPlaceModel.categories(categoryName);
                    if (oLocation.LocationName.length > 0) {
                        selPlaceModel.vicinity(oLocation.LocationName);
                        selPlaceModel.formatted_address(oLocation.LocationName);
                        selPlaceModel.parsed_address(oLocation.LocationName);
                    } else {
                        selPlaceModel.vicinity(oLocation.FormatAddress);
                        selPlaceModel.formatted_address(oLocation.FormatAddress);
                        selPlaceModel.parsed_address(oLocation.FormatAddress);
                    }

                    GetComplaintTypes(selPlaceModel, '', selPlaceModel.CategoryID(), function(mc_types) {
                        selPlaceModel.complaint_types(mc_types);
                    });
                }
            });
        }

        function GetComplaintTypes(selPlaceModel, Categories, CategoryID, cbFunc) {

            Loader.Show();

            $.post(SuperSolver.API + '/ComplaintTypes', { CategoryID: CategoryID, Categories: Categories }, function (data) {

                var mc_types = [], sc_types, obj, obj1, mc, sc, ii, jj;

                for (ii = 0; ii < data.length; ii++) {

                    obj = data[ii];
                    mc = new SearchModels.MainComplaintType(selPlaceModel);
                    sc_types = new Array();

                    mc.id(obj.MainComplaintTypeID);
                    mc.name(obj.TypeName);

                    for (jj = 0; jj < obj.SubComplaintTypes.length; jj++) {

                        obj1 = obj.SubComplaintTypes[jj];

                        sc = new SearchModels.SubComplaintType(mc);
                        sc.id(obj1.SubComplaintTypeID);
                        sc.main_id(obj.MainComplaintTypeID);
                        sc.name(obj1.ComplaintText);

                        sc_types.push(sc);
                    }

                    mc.sub_complaint_types(sc_types);
                    mc_types.push(mc);
                }

                cbFunc(mc_types);
            }).complete(function () {
                Loader.Hide();
            });
        }

        function RefreshMap() {
            setTimeout(function () {
                MapHelper.Refresh();
            }, 50);
        }

        function HandlePrevNext1() {

            $('.PrevBtn', '.Page[data-page="SelectComplaint"]').click(function () {
                if ($(this).hasClass('NoAct')) {
                    return;
                }
                ShowPage('Result');
            });

            $('.NextBtn', '.Page[data-page="SelectComplaint"]').click(function () {

                if (SearchModel.SelectedPlace().selected_complaints().length > 0) {
                    ShowPage('ConfirmComplaint');
                    HandleAdditionlFeedback();
                    HandleKeyFocus();
                    $('html,body').animate({
                        scrollTop: 0},
                    'fast');
                } else {
                    navigator.notification.alert('Please select an item.',null,"SuperSolver");
                }
            });

            $('.PrevBtn', '.Page[data-page="ConfirmComplaint"]').click(function () {
                ShowPage('SelectComplaint');
            });

            $('.NextBtn', '.Page[data-page="ConfirmComplaint"]').click(function () {
                HandleComplaint();
            });
        }

        function HandleComplaint() {
        
            var selObj = SearchModel.SelectedPlace(), obj = {
                UserEmail: $('#txtEmailAddress').val(),
                PlaceID: selObj.id(),
                PlaceReference: selObj.reference(),
                LocationID: selObj.LocationID(),
                CompanyID: selObj.CompanyID(),
                PlaceName: selObj.name(),
                PlaceVicinity: selObj.vicinity(),
                PlaceFormattedAddress: selObj.formatted_address(),
                PlaceParsedAddress: selObj.parsed_address().address,
                PlaceParsedAddressString: selObj.parsed_address().address_string,
                SelectedComplaints: GetSelectedComplaints(selObj.selected_complaints()),
                UserAgent: navigator.userAgent,
                UserLat: SearchModel.Latitude,
                UserLng: SearchModel.Longitude,
                GCats: selObj.categories(),
                GLat: selObj.Latitude,
                GLng: selObj.Longitude,
                ResolutionX: window.screen.width,
                ResolutionY: window.screen.height,
                AdditionalFeedback: selObj.addl_feedback()
            };
            
            if($('#txtEmailAddress').length > 0) {

                var email = $.trim($('#txtEmailAddress').val());

                if(email.length == 0) {
                    if(selObj.IsForceEmail()) {
                        navigator.notification.alert('An e-mail address is required to complete your submission.',null,"SuperSolver");
                        $('#txtEmailAddress').focus();
                        return;
                    } else {
                    
                        $('#DlgOverlay').show();
                        $('#dlgWarnEmail').show();

                        $('html,body').animate({
                            scrollTop: $("#dlgWarnEmail").offset().top - 20},
                        'fast');

                        $('#dlgWarnEmailSubmit').off('click');

                        $('#dlgWarnEmailBack').on('click', function (evt) {
                            $('#dlgWarnEmail').hide();
                            $('#DlgOverlay').hide();
                            $('#txtEmailAddress').focus();
                        });

                        $('#dlgWarnEmailSubmit').on('click', function (evt) {
                            $('#dlgWarnEmail').hide();
                            $('#DlgOverlay').hide();
                            PostComplaint();
                            return;
                        });
                    }
                } else {

                    if(SuperSolver.IsValidEmail(email) == false) {
                        navigator.notification.alert("Please enter a valid e-mail address.",null,"SuperSolver");
                        $('#txtEmailAddress').focus();
                        return;
                    }

                    PostComplaint();
                }
            } else {
                PostComplaint();
            }

            function PostComplaint() {

                Loader.Show();

                $.post(SuperSolver.API + '/PostComplaint', $.toDictionary(obj), function (data) {

                    if (data.Success) {
                        /*alert('Thank you for providing your feedback. We will review your feedback and get back to you shortly.');

                    
                        ShowPage('Start');
                        */

                        ShowPage('ComplaintSent');

                        if (data.CompanyID > 0) {
                            $('.Type1').show();
                        } else {
                            $('.Type2').show();
                        }

                        SearchModel.Location('Current Location');
                        SearchModel.BusinessName('');
                        SearchModel.oldLocation = '';
                        SearchModel.oldBusinessName = '';
                        SearchModel.Results([]);
                        SearchModel.SelectedPlace(null);
                        SearchModel.IsSelected(false);
                    } else {
                        navigator.notification.alert("Error occured while processing. Please try again later.",null,"SuperSolver");
                    }


                }).complete(function () {
                    Loader.Hide();
                });
            }
        }

        function GetSelectedComplaints(obj) {

            var ii,
            ids = [];

            for (ii = 0; ii < obj.length; ii++) {
                ids.push(obj[ii].SubComplaintTypeID);
            }

            return ids;
        }

        function HandleAdditionlFeedback() {

            $('#btnAdditionFeedbackYes').on('click', function (evt) {
                $('#DlgOverlay').show();
                $('#dlgAdditionalFeedback').show();
                $('#dlgAdditionalFeedback textarea').focus();
            });

            $('#btnAdditionFeedbackSubmit').on('click', function (evt) {
                $('#DlgOverlay').hide();
                $('#dlgAdditionalFeedback').hide();
                SearchModel.SelectedPlace().addl_feedback($.trim(SearchModel.SelectedPlace().addl_feedback()));
            });

            $('#btnAdditionFeedbackCancel').on('click', function (evt) {
                SearchModel.SelectedPlace().addl_feedback('');
                $('#DlgOverlay').hide();
                $('#dlgAdditionalFeedback').hide();
            });
        }

        function HandleKeyFocus() {
            
            $('#txtEmailAddress').on('focus', function(evt) {
                $('.BottomAction', '.Page[data-page="ConfirmComplaint"]').addClass('KBDisplay');
                $('.Header', '.Page[data-page="ConfirmComplaint"]').addClass('KBDisplay');
            });

            $('#txtEmailAddress').on('blur', function(evt) {
                $('.BottomAction', '.Page[data-page="ConfirmComplaint"]').removeClass('KBDisplay');
                $('.Header', '.Page[data-page="ConfirmComplaint"]').removeClass('KBDisplay');
            });

            $('#dlgAdditionalFeedback textarea').on('focus', function(evt) {
                $('.BottomAction', '.Page[data-page="ConfirmComplaint"]').addClass('KBDisplay');
                $('.Header', '.Page[data-page="ConfirmComplaint"]').addClass('KBDisplay');
            });

            $('#dlgAdditionalFeedback textarea').on('blur', function(evt) {
                $('.BottomAction', '.Page[data-page="ConfirmComplaint"]').removeClass('KBDisplay');
                $('.Header', '.Page[data-page="ConfirmComplaint"]').removeClass('KBDisplay');
            });
        }
        
        function HandleBeacons() {
            
            $('#Beacons_List').on('click', '.ResultRow', function (evt) {

                var target = evt.target,
                parent = $(target).parents('.ResultRow')[0],
                idx = $('.Idx', parent).val();

                ShowVirtualLocation(idx, false);
            });

            
        }
        
        function EnterBeacon(beacon) {
 
            
            $.post(SuperSolver.API + '/IBeaconSearch', {UDID: localStorage.EstUDID, Major: beacon.major, Minor: beacon.minor}, function(data){
                var id = data.LocationID;
                //console.log("LocationID: " + data.LocationID);
            
                if (parseInt(id) > 0) {
                    $.getJSON(SuperSolver.API + '/GetLocation', { ID: id }, function (data) {
                        var oLocation = data.location,
                        oCompany = data.company,
                        categoryName = data.categoryName;

                        if (oCompany.CompanyName != '') {

                            BeaconEntry = new Object();
                            if (oLocation.LocationName != ''){
                                BeaconEntry.displayname = oLocation.LocationName;
                                BeaconEntry.first_cat = oCompany.CompanyName;
                            } else {
                                BeaconEntry.displayname = oCompany.CompanyName;
                                BeaconEntry.first_cat = categoryName;                                
                            }
                            if (oCompany.CompanyLogo.length > 0) {
                                //alert("Image URL: " + SuperSolver.baseURL + oCompany.CompanyLogo);
                                BeaconEntry.photo = SuperSolver.baseURL + oCompany.CompanyLogo;
                            } else {
                              BeaconEntry.photo = "img/iBeacon.gif";
                            }
                            BeaconEntry.vicinity = oLocation.GoogleBusinessAddress;
                            BeaconEntry.distance = formatDistance(beacon.distance);
                            BeaconEntry.LocationID = id;
                            BeaconEntry.Major = beacon.major;
                            BeaconEntry.Minor = beacon.minor;
                            BeaconEntry.UUID = beacon.proximityUUID;
                            SearchModel.BeaconResults.push(BeaconEntry);
                        }
                     });
                 }
             });
        };
           
        function UpdateBeacon(beacon) {
            var i, l, BeaconEntry;
            
            for (i= 0, l = SearchModel.BeaconResults().length; i<l; i++) {
                BeaconEntry = SearchModel.BeaconResults()[i];
                if (beacon.major == BeaconEntry.Major && beacon.minor == BeaconEntry.Minor) {
                    BeaconEntry.distance = formatDistance(beacon.distance);
                    SearchModel.BeaconResults.splice(i,1);
                    SearchModel.BeaconResults.splice(i, 0, BeaconEntry);
                }
            }
            
        };
        
        function RemoveBeacon(beacon) {
            
        };

        return {
            Init: function (LocationID) {
                Init(LocationID);
            },
            EnterBeacon: function (beacon) {
                EnterBeacon(beacon);
            },
            UpdateBeacon: function (beacon) {
                UpdateBeacon(beacon);
            },
            RemoveBeacon: function (beacon) {
                RemoveBeacon(beacon);
            },
            ShowVirtualLocation: function(id, hide) {
                ShowVirtualLocation(id, hide);
            }
        };
    } ();

    SuperSolver.Search = Search;

} (jQuery));