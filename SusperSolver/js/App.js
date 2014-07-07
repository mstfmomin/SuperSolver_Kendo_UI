function StopEvent(evt) {
    evt.preventDefault();
    evt.stopPropagation();
}

; (function ($) {

    // Function to get the Min/Max value in Array
    Array.min = function (array) {
        return Math.min.apply(Math, array);
    };

    Array.max = function (array) {
        return Math.max.apply(Math, array);
    };

    SuperSolver.Loader = function () {

        var wrap = '.LoadingWrapper',
        msg = '.Msg'

        $(document).ready(function () {

            var ht = $(msg, wrap).height(),
            wd = $(msg, wrap).width(),
            vwHt = $(window).height(),
            vwWd = $(window).width();

            $(msg, wrap).css({
                left: ((vwWd - wd) / 2) + 'px',
                top: ((vwHt - ht) / 2) + 'px'
            });

            $(wrap).show();
        });

        $(window).load(function () {
            $(wrap).hide();
        });

        return {
            Show: function () {
                $(wrap).show();
            },

            Hide: function () {
                $(wrap).hide();
            }
        };
    } ();

    if (typeof console == "undefined" || typeof console.log == "undefined")
        console = { log: function () { } };

    window.LogConsole = function (msg) {
        console.log(msg);
    }

    String.prototype.Capitalize = function () {
        return this.replace(/(^|\s)([a-z])/g, function (m, p1, p2) { return p1 + p2.toUpperCase(); });
    };

    String.format = function () {
        var s = arguments[0], i;
        for (i = 0; i < arguments.length - 1; i++) {
            var reg = new RegExp("\\{" + i + "\\}", "gm");
            s = s.replace(reg, arguments[i + 1]);
        }

        return s;
    };

    jQuery.fn.reset = function () {
        jQuery(this).each(function () {
            try {
                this.reset();
            } catch (e)
            { }
        });
    }

    SuperSolver.IsValidEmail = function (email) {
        return /^([\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*[\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+@((((([a-zA-Z0-9]{1}[a-zA-Z0-9\-]{0,62}[a-zA-Z0-9]{1})|[a-zA-Z])\.)+[a-zA-Z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/.test(email) == true;
    }

})(jQuery);

(function ($) {

    // #region String.prototype.format
    // add String prototype format function if it doesn't yet exist
    if ($.isFunction(String.prototype.format) === false) {
        String.prototype.format = function () {
            var s = this;
            var i = arguments.length;
            while (i--) {
                s = s.replace(new RegExp("\\{" + i + "\\}", "gim"), arguments[i]);
            }
            return s;
        };
    }
    // #endregion

    // #region Date.prototype.toISOString
    // add Date prototype toISOString function if it doesn't yet exist
    if ($.isFunction(Date.prototype.toISOString) === false) {
        Date.prototype.toISOString = function () {
            var pad = function (n, places) {
                n = n.toString();
                for (var i = n.length; i < places; i++) {
                    n = "0" + n;
                }
                return n;
            };
            var d = this;
            return "{0}-{1}-{2}T{3}:{4}:{5}.{6}Z".format(
                d.getUTCFullYear(),
                pad(d.getUTCMonth() + 1, 2),
                pad(d.getUTCDate(), 2),
                pad(d.getUTCHours(), 2),
                pad(d.getUTCMinutes(), 2),
                pad(d.getUTCSeconds(), 2),
                pad(d.getUTCMilliseconds(), 3)
            );
        };
    }
    // #endregion

    var _flatten = function (input, output, prefix, includeNulls) {
        if ($.isPlainObject(input)) {
            for (var p in input) {
                if (includeNulls === true || typeof (input[p]) !== "undefined" && input[p] !== null) {
                    _flatten(input[p], output, prefix.length > 0 ? prefix + "." + p : p, includeNulls);
                }
            }
        }
        else {
            if ($.isArray(input)) {
                $.each(input, function (index, value) {
                    _flatten(value, output, "{0}[{1}]".format(prefix, index));
                });
                return;
            }
            if (!$.isFunction(input)) {
                if (input instanceof Date) {
                    output.push({ name: prefix, value: input.toISOString() });
                }
                else {
                    var val = typeof (input);
                    switch (val) {
                        case "boolean":
                        case "number":
                            val = input;
                            break;
                        case "object":
                            // this property is null, because non-null objects are evaluated in first if branch
                            if (includeNulls !== true) {
                                return;
                            }
                        default:
                            val = input || "";
                    }
                    output.push({ name: prefix, value: val });
                }
            }
        }
    };

    $.extend({
        toDictionary: function (data, prefix, includeNulls) {
            /// <summary>Flattens an arbitrary JSON object to a dictionary that Asp.net MVC default model binder understands.</summary>
            /// <param name="data" type="Object">Can either be a JSON object or a function that returns one.</data>
            /// <param name="prefix" type="String" Optional="true">Provide this parameter when you want the output names to be prefixed by something (ie. when flattening simple values).</param>
            /// <param name="includeNulls" type="Boolean" Optional="true">Set this to 'true' when you want null valued properties to be included in result (default is 'false').</param>

            // get data first if provided parameter is a function
            data = $.isFunction(data) ? data.call() : data;

            // is second argument "prefix" or "includeNulls"
            if (arguments.length === 2 && typeof (prefix) === "boolean") {
                includeNulls = prefix;
                prefix = "";
            }

            // set "includeNulls" default
            includeNulls = typeof (includeNulls) === "boolean" ? includeNulls : false;

            var result = [];
            _flatten(data, result, prefix || "", includeNulls);

            return result;
        }
    });
})(jQuery);
; (function ($) {

    function Setup() {

        $('.MenuToggle').click(function (evt) {
            Operate(true);
        });
    }

    function Operate(toggle) {

        var body = $('body'),
        container = $('.Page'),
        innerContent = $('.Content'),
        cls = 'ShowMenu',
        px = 'px';

        if (body.hasClass(cls)) {
            if (toggle) {
                body.removeClass(cls);
                SetMinOnly();
            } else {
                SetMaxMin();
            }
        } else {
            if (toggle) {
                body.addClass(cls);
                SetMaxMin();
            } else {
                SetMinOnly();
            }
        }

        function SetMaxMin() {
            var menuHeight = $('.MenuViewInner').height(),
            vwHeight = $(window).height(),
            height = (menuHeight > vwHeight ? menuHeight : vwHeight),
            containerPad = Pad(container, 'top'),
            obj = {
                minHeight: (height - containerPad) + px,
                maxHeight: (height - containerPad) + px
            },
            contentPad = Pad(innerContent, 'bottom');

            body.css(obj);
            container.css(obj);
            innerContent.css({ minHeight: (height - (42 + contentPad)) + px });
        }

        function SetMinOnly() {

            var vwHeight = $(window).height(),
            containerPad = Pad(container, 'top'),
            obj = {
                minHeight: (vwHeight - containerPad) + px,
                maxHeight: ''
            },
            contentPad = Pad(innerContent, 'bottom');

            body.css(obj);
            container.css(obj);
            innerContent.css({ minHeight: (vwHeight - (42 + contentPad)) + px });
        }

        function Pad(ele, pos) {
            return parseInt(ele.css('padding-' + pos).replace(px, ''));
        }
    }

    $(window).bind('orientationchange', function () {
        setTimeout(function() {
            Operate(false);
        }, 200);
    });

    $(window).bind('resize', function () {
        setTimeout(function() {
            Operate(false);
        }, 200);
    });

    $(document).ready(function () {

        Setup();
        Operate(false);
    });

} (jQuery));
; (function ($) {

    var LocationManager = function () {

        function GetCurrentLocation(cbFunc) {

            var timeout = 15 * 1000; // 15 seconds
            var cache = 0; // killing cache to see if fixes GPS error; 60 * 1000; // 60 seconds
   
   //console.log("Calling GCL");
                navigator.geolocation.getCurrentPosition(function (pos) {
                    cbFunc({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    },
                    null);
                }, function (err) {
                    var msg = LocationManager.UNKNOWN_ERROR;
                    if (err != null) {
                        switch (err.code) {
                            case err.PERMISSION_DENIED:
                                msg = LocationManager.PERMISSION_DENIED;
                                break;
                            case err.POSITION_UNAVAILABLE:
                                msg = LocationManager.POSITION_UNAVAILABLE;
                                break;
                            case err.TIMEOUT:
                            case err.PERMISSION_DENIED_TIMEOUT:
                                msg = LocationManager.TIMEOUT;
                                break;
                            case err.UNKNOWN_ERROR:
                                msg = LocationManager.UNKNOWN_ERROR;
                                break;
                        }
                    }
                    cbFunc(null, msg);
                }, { enableHighAccuracy: true, timeout: timeout, maximumAge: cache });

                return true;
        }

        function distance(lat1, lon1, lat2, lon2, unit) {

            var R, dLat, dLon, a, c, dist;

            R = 6366.707019; // Radius of the earth in km
            dLat = deg2rad(lat2 - lat1);  // deg2rad below
            dLon = deg2rad(lon2 - lon1);
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            dist = R * c; // Distance in km            
            dist = dist / 1.609344; // Distance in miles

            return Math.ceil(dist * 10) / 10;
        }

        function deg2rad(deg) {
            return deg * (Math.PI / 180)
        }

        return {
            Location: function (cbFunc) {
                return GetCurrentLocation(cbFunc);
            },

            Distance: function (lat1, lon1, lat2, lon2) {
                return distance(lat1, lon1, lat2, lon2);
            },

            PERMISSION_DENIED: 'Your Location Services is off. Please turn it on.',
            POSITION_UNAVAILABLE: 'Current location is currently unavailable.',
            TIMEOUT: 'You took too long to grant/deny permission.',
            UNKNOWN_ERROR: 'Cannot determine you current location.'
        };
    } ();

    SuperSolver.LocationManager = LocationManager;
} (jQuery));
