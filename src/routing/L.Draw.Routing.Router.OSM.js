L.Draw.Routing.Router.OSM = L.Draw.Routing.Router.extend({
   
    statics: {
        PEDESTRIAN: "pedestrian",
        SHORTEST: "shortest",
        FASTEST: "fastest",
        BICYCLE: "bicycle",
        MULTIMODAL: "multimodal"
    },

    options: {
        routingMode: "pedestrian"
    },

    initialize: function (routingMode) {
        // class constructor
        if (routingMode != null)
            this.options.routingMode = routingMode;
    },

    getRoutingMode: function() {
        return this.options.routingMode;
    },

    route: function(route) {

        console.log("route: ", route);

        if (Array.isArray(route))
        {
            route = {
                from: route[0],
                to: route[1]
            };
        }

        // Result routing.
        var self = this;
        var promise = new Promise(function(resolve, reject) {

            var to = [];
            if (route.waypoints && route.waypoints.length > 0) {
                for (var i=0; i < route.waypoints.length; i++) {
                    to.push(route.waypoints[i].lat + "," + route.waypoints[i].lng);
                }
            }
            to.push(route.to.lat + "," + route.to.lng);

            jQuery.ajaxSettings.traditional = true;
            $.get("https://open.mapquestapi.com/directions/v2/route", {
                key: "Fmjtd%7Cluu82lu22d%2C70%3Do5-948lqu",
                narrativeType: "none",
                unit: "k",
                outFormat: "json",
                fullShape: false,
                generalize: "1",
                routeType: self.getRoutingMode(),
                from: route.from.lat + "," + route.from.lng,
                to: to,
                outFormat: "json"
            }).done(function(data) {

                var result = self._convertOSMToPath(data);
                resolve(result);

            }).fail(function(err) {
                reject(err);
            });

        });
        return promise;
    },

    _convertOSMToPath: function(json) {

        var coords = new Array();
        
        var arr = json.route.shape.shapePoints;
        for (var i=1; i < arr.length; i = i+2) {
            var lat = arr[i-1];
            var lng = arr[i];
            
            var coord = L.latLng(lat, lng);
            coords.push(coord);
        }
        
        return coords;
    }
    
});