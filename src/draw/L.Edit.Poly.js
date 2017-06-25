L.Edit.Poly.include({
    
    _initHandlers: function () {
		this._verticesHandlers = [];
                if (this._poly instanceof L.Route)
                {
                    for (var i = 0; i < this.latlngs.length; i++) {
			this._verticesHandlers.push(new L.Edit.RouteVerticesEdit(this._poly, this.latlngs[i], this.options));
                    }
                }
                else
                {
                    for (var i = 0; i < this.latlngs.length; i++) {
			this._verticesHandlers.push(new L.Edit.PolyVerticesEdit(this._poly, this.latlngs[i], this.options));
                    }
                }
		
    }
})