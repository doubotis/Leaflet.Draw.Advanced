L.Route = L.Polyline.extend({
    
    options: {
            // @option smoothFactor: Number = 1.0
            // How much to simplify the polyline on each zoom level. More means
            // better performance and smoother look, and less means more accurate representation.
            smoothFactor: 1.0,

            // @option noClip: Boolean = false
            // Disable polyline clipping.
            noClip: false
    },
    
    initialize: function (latlngs, options) {
        L.Util.setOptions(this, options);
        this._setLatLngs(latlngs);
    },
    
    reverse: function() {
        
        // Reverse Lat Lngs
        var arr = this.getLatLngs();
        var newArr = new Array();
        for (var i=arr.length-1; i > 0; i--)
        {
            newArr.push(arr[i]);
        }
        this.setLatLngs(newArr);
        this.redraw();
    },
    
    getWaypoints: function() {
        
        var waypoints = new Array();
        var arr = this.getLatLngs();
        for (var i=0; i < arr.length; i++)
        {
            if (arr[i].waypoint) {
                waypoints.push(arr[i]);
            }
        }
        return waypoints;
    }
    
});
L.route = function(latlngs, options) {
    return new L.Route(latlngs, options);
}