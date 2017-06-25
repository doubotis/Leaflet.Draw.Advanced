L.SmartEditor = L.Class.extend({
    
    statics: {
        Automatic: 0,
        Manual: 1
    },
    
    options: {
        
    },
    
    initialize: function (options) {
        
        L.Util.setOptions(this, options);
    },
    
    setMode: function(mode) {
        if (mode != 0 && mode != 1)
            throw "Not supported mode";
        
        this.options.mode = mode;
    },
    
    getMode: function() {
        return this.options.mode;
    },
    
    draw: function(poly) {
        
    },
    
    edit: function(poly) {
        
    },
    
    finish: function() {
        
    }
    
});

L.smartEditor = function(options) {
    return new L.SmartEditor(options);
}