L.Draw.Routing.Router = L.Class.extend({
   
    initialize: function () {
        throw "Must be overrided by Routing implementations";
    },
    
    route: function () {
        throw "Must be overrided by Routing implementations";
    }
    
});