L.Edit.RouteVerticesEdit = L.Edit.PolyVerticesEdit.extend({
    
    options: {
        icon: new L.DivIcon({
                iconSize: new L.Point(8, 8),
                className: 'leaflet-div-icon leaflet-editing-icon'
        }),
        touchIcon: new L.DivIcon({
                iconSize: new L.Point(20, 20),
                className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
        }),
        drawError: {
                color: '#b00b00',
                timeout: 1000
        },
        lazyMode: true
    },
    
    _startDragIndex: -1,
    _endDragIndex: -1,
    _routeNoWaypoints: false,
    
    initialize: function (poly, latlngs, options) {
		// if touch, switch to touch icon
		if (L.Browser.touch) {
			this.options.icon = this.options.touchIcon;
		}
		this._poly = poly;

		if (options && options.drawError) {
			options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
		}

		this._latlngs = latlngs;

		L.setOptions(this, options);
    },
    
    addHooks: function () {
            var poly = this._poly;

            poly.options.fill = false;
            if (poly.options.editing) {
                    poly.options.editing.fill = false;
            }

            poly.setStyle(poly.options.editing);

            if (this._poly._map) {

                this._map = this._poly._map; // Set map

                if (!this._markerGroup) {
                        this._initMarkers();
                }
                this._poly._map.addLayer(this._markerGroup);

                if (this.options.lazyMode)
                    this._poly._map.on("mousemove", this._handleMouseOver, this);

            }
    },

    // @method removeHooks(): void
    // Remove listener hooks from this handler.
    removeHooks: function () {
            var poly = this._poly;

            poly.setStyle(poly.options.original);

            if (poly._map) {
                    poly._map.removeLayer(this._markerGroup);
                    delete this._markerGroup;
                    delete this._markers;
                    
                    if (this.options.lazyMode)
                        this._poly._map.off("mousemove", this._handleMouseOver, this);
            }
    },
    _initMarkers: function () {
            if (!this._markerGroup) {
                    this._markerGroup = new L.LayerGroup();
            }
            this._markers = [];

            var latlngs = this._defaultShape(),
                    i, j, len, marker;

            // enable lazy mode if needed
            if (!this.options.lazyMode)
            {
                
                for (i = 0, len = latlngs.length; i < len; i++) {

                        marker = this._createMarker(latlngs[i], i);
                        marker.on('click', this._onMarkerClick, this);
                        this._markers.push(marker);
                }

                var markerLeft, markerRight;

                for (i = 0, j = len - 1; i < len; j = i++) {
                        if (i === 0 && !(L.Polygon && (this._poly instanceof L.Polygon))) {
                                continue;
                        }

                        markerLeft = this._markers[j];
                        markerRight = this._markers[i];

                        this._createMiddleMarker(markerLeft, markerRight);
                        this._updatePrevNext(markerLeft, markerRight);
                }
            }
    },
    
    _getHooks: function() {
        
        if (this.options.router == null)
            return this._poly.getLatLngs();
        else
            return this._poly.getWaypoints();
        
    },

    _handleMouseOver: function(mouseEvent) {

        if (this._dragging) return;

        // find the point we are the nearest.
        var idx;
        var dist = 20000;
        var latlngs = this._getHooks();
        for (var i = 1; i < latlngs.length; i++) {
            var ptA = this._map.latLngToLayerPoint(latlngs[i-1]);
            var ptB = this._map.latLngToLayerPoint(latlngs[i]);

            var tempDist = L.LineUtil.pointToSegmentDistance(mouseEvent.layerPoint, ptA, ptB);
            //var pt = this._map.latLngToLayerPoint(latlngs[i]);
            //var tempDist = mouseEvent.layerPoint.distanceTo(pt);
            if (tempDist < dist) {
                idx = i;
                dist = tempDist;
            }
        }
        var latlng = latlngs[idx];

        if (this._nearMarker != null && 
                this._nearMarker.getLatLng().lat == latlng.lat && 
                this._nearMarker.getLatLng().lng == latlng.lng) return;     // Do nothing

        // Clean the currently displayed elements.
        this._markerGroup.clearLayers();
        this._markers = [];

        // Generate main markers.
        for (var i=idx+3; i > idx-3; i--)
        {
            var marker = this._createMarker(latlngs[i], i);
            if (marker != null) {
                marker.on('click', this._onMarkerClick, this);
                this._markers.push(marker);

                if (i == idx)
                    this._nearMarker = marker;
            }
        }

        // Loop to create middle markers.
        var markerLeft, markerRight;
        var len = this._markers.length;
        var j;
        for (i = 0, j = len - 1; i < len; j = i++)
        {
            if (i === 0 && !(L.Polygon && (this._poly instanceof L.Polygon))) {
                continue;
            }

            markerLeft = this._markers[j];
            markerRight = this._markers[i];

            this._createMiddleMarker(markerRight, markerLeft);
            this._updatePrevNext(markerRight, markerLeft);
        }

    },

    _createMarker: function (latlng, index) {
            // Extending L.Marker in TouchEvents.js to include touch.

            if (latlng == null) return;

            var marker = new L.Marker.Touch(latlng, {
                    draggable: true,
                    icon: this.options.icon,
            });

            marker._origLatLng = latlng;
            marker._index = index;

            marker
                    .on('dragstart', this._onMarkerDragStart, this)
                    .on('drag', this._onMarkerDrag, this)
                    .on('dragend', this._onMarkerDragEnd, this)
                    .on('touchmove', this._onTouchMove, this)
                    .on('touchend', this._onMarkerDragEnd, this)
                    .on('MSPointerMove', this._onTouchMove, this)
                    .on('MSPointerUp', this._onMarkerDragEnd, this);

            this._markerGroup.addLayer(marker);

            return marker;
    },

    _spliceLatLngs: function () {
            var latlngs = this._defaultShape();
            var removed = [].splice.apply(latlngs, arguments);
            this._poly._convertLatLngs(latlngs, true);
            this._poly.redraw();
            return removed;
    },

    _removeMarker: function (marker) {
            var i = marker._index;

            this._markerGroup.removeLayer(marker);
            this._markers.splice(i, 1);
            this._spliceLatLngs(i, 1);
            this._updateIndexes(i, -1);

            marker
                    .off('dragstart', this._onMarkerDragStart, this)
                    .off('drag', this._onMarkerDrag, this)
                    .off('dragend', this._onMarkerDragEnd, this)
                    .off('touchmove', this._onMarkerDrag, this)
                    .off('touchend', this._onMarkerDragEnd, this)
                    .off('click', this._onMarkerClick, this)
                    .off('MSPointerMove', this._onTouchMove, this)
                    .off('MSPointerUp', this._onMarkerDragEnd, this);
    },
    
    _findWaypointIndex: function(latlng)
    {
        var latlngs = this._poly.getLatLngs();
        for (var i=0; i < latlngs.length; i++)
        {
            if (latlngs[i] == latlng)      // Reference checking
            {
                return i;
            }
        }
        return -1;
    },

    _fireEdit: function () {
        
            this._poly.edited = true;
            this._poly.fire('edit');
            this._poly._map.fire(L.Draw.Event.EDITVERTEX, { layers: this._markerGroup, poly: this._poly });
            this._dragging = false;
    },

    _onMarkerDrag: function (e) {
            var marker = e.target;
            var poly = this._poly;

            L.extend(marker._origLatLng, marker._latlng);
            marker._origLatLng.alt = null;

            if (marker._middleLeft) {
                    marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
            }
            if (marker._middleRight) {
                    marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
            }

            if (poly.options.poly) {
                    var tooltip = poly._map._editTooltip; // Access the tooltip

            }

            this._poly.redraw();
            this._poly.fire('editdrag');
    },
    
    _onMarkerDragStart: function (e) {
            var marker = e.target;
        
            this._poly.fire('editstart');
            this._dragging = true;
            
            if (this._poly.options.poly.router != null) {
                        
                // Compute the indices.
                this._routeNoWaypoints = false;
                
                if (marker._prev != null) {
                    this._startDragIndex = this._findWaypointIndex(marker._prev.getLatLng());
                } else {
                    this._startDragIndex = 0;
                    this._routeNoWaypoints = true;
                }
                if (marker._next != null) {
                    this._endDragIndex = this._findWaypointIndex(marker._next.getLatLng());
                } else {
                    this._endDragIndex = this._poly.getLatLngs().length-1;
                    this._routeNoWaypoints = true;
                }
                var lengthDrag = this._endDragIndex - this._startDragIndex;
                
                console.log("indices: ", this._startDragIndex, this._endDragIndex);

                // Now remove all points between these 2 elements.
                if (this._routeNoWaypoints == false) {
                    this._poly.getLatLngs().splice(this._startDragIndex+1, 
                        lengthDrag-1, marker.getLatLng());
                }
                else {
                    this._poly.getLatLngs().splice(this._startDragIndex+1, 
                        lengthDrag-1);
                }
                this._poly.redraw();
            }
            
    },
    
    _onMarkerDragEnd: function () {
        // We need to perform the route mechanism.
        var poly = this._poly;
        
        var startLatLng = poly.getLatLngs()[this._startDragIndex];
        var middleLatLng = null;
        var endLatLng;
        if (this._startDragIndex == 0 && this._routeNoWaypoints) {
            middleLatLng = null;
            endLatLng = poly.getLatLngs()[this._startDragIndex+1];
        }
        else if (this._startDragIndex == poly.getLatLngs().length - 2 && this._routeNoWaypoints) {
            middleLatLng = null;
            endLatLng = poly.getLatLngs()[this._startDragIndex+1];
        }
        else {
            middleLatLng = poly.getLatLngs()[this._startDragIndex+1];
            endLatLng = poly.getLatLngs()[this._startDragIndex+2];
        }
        
        if (this._poly.options.poly.router != null) {
            
            console.log("Ask for route with: ", startLatLng, endLatLng, middleLatLng);
            
            this.askForRoute(startLatLng, endLatLng, middleLatLng);
        }
        this._fireEdit();
    },
    
    askForRoute: function(startLatLng, endLatLng, middleLatLng) {
            
            var self = this;
            
            var route = {
                from: startLatLng,
                to: endLatLng
            };
            if (middleLatLng != null)
                route.waypoints = [middleLatLng];
            
            this._poly.options.poly.router.route(route)
                .then(function(result) {
            
                    // Mark waypoints
                    //result[0].waypoint = true;
                    //result[result.length-1].waypoint = true;
                    if (self._routeNoWaypoints == false)
                        result[self._getNearestIndexLatLngForRoute(result, middleLatLng)].waypoint = true;
            
                    var length;
                    if (self._routeNoWaypoints)
                        length = 0;
                    else
                        length = 1;
                    
                    console.log(result);
                    console.log("length to remove: ", length);
            
                    self._poly.getLatLngs().splice.apply(self._poly.getLatLngs(), [self._startDragIndex+1, length].concat(result));
                    self._poly.redraw();
                    
                    self._startDragIndex = -1;
                    self._endDragIndex = -1;
                    self._routeNoWaypoints = false;
                    
                    self._fireEdit();
                })
                .catch(function(err) {
                    console.error("error: ", err);
                });
    },
    
    _getNearestIndexLatLngForRoute: function(route, middleLatLng) {
        
        var minDistance = 999999999;
        var minIndex = -1;
        
        for (var i=0; i < route.length; i++) {
            
            var pt = route[i];
            var distance = pt.distanceTo(middleLatLng);
            if (distance < minDistance) {
                minDistance = distance;
                minIndex = i;
            }
        }
        
        console.log(minIndex);
        return minIndex;
        
    },

    _onMarkerClick: function (e) {

            var minPoints = L.Polygon && (this._poly instanceof L.Polygon) ? 4 : 3,
                    marker = e.target;

            // If removing this point would create an invalid polyline/polygon don't remove
            if (this._defaultShape().length < minPoints) {
                    return;
            }

            // remove the marker
            this._removeMarker(marker);

            // update prev/next links of adjacent markers
            this._updatePrevNext(marker._prev, marker._next);

            // remove ghost markers near the removed marker
            if (marker._middleLeft) {
                    this._markerGroup.removeLayer(marker._middleLeft);
            }
            if (marker._middleRight) {
                    this._markerGroup.removeLayer(marker._middleRight);
            }

            // create a ghost marker in place of the removed one
            if (marker._prev && marker._next) {
                    this._createMiddleMarker(marker._prev, marker._next);

            } else if (!marker._prev) {
                    marker._next._middleLeft = null;

            } else if (!marker._next) {
                    marker._prev._middleRight = null;
            }

            this._fireEdit();
    },

    _onTouchMove: function (e) {

            var layerPoint = this._map.mouseEventToLayerPoint(e.originalEvent.touches[0]),
                    latlng = this._map.layerPointToLatLng(layerPoint),
                    marker = e.target;

            L.extend(marker._origLatLng, latlng);

            if (marker._middleLeft) {
                    marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
            }
            if (marker._middleRight) {
                    marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
            }

            this._poly.redraw();
            this.updateMarkers();
    },

    _updateIndexes: function (index, delta) {
            this._markerGroup.eachLayer(function (marker) {
                    if (marker._index > index) {
                            marker._index += delta;
                    }
            });
    },

    _createMiddleMarker: function (marker1, marker2) {
            var latlng = this._getMiddleLatLng(marker1, marker2),
                    marker = this._createMarker(latlng),
                    onClick,
                    onDragStart,
                    onDragEnd;

            marker.setOpacity(0.6);

            marker1._middleRight = marker2._middleLeft = marker;

            onDragStart = function () {
                    marker.off('touchmove', onDragStart, this);
                    var i = marker2._index;

                    marker._index = i;

                    marker
                            .off('click', onClick, this)
                            .on('click', this._onMarkerClick, this);

                    latlng.lat = marker.getLatLng().lat;
                    latlng.lng = marker.getLatLng().lng;
                    this._spliceLatLngs(i, 0, latlng);
                    this._markers.splice(i, 0, marker);

                    marker.setOpacity(1);

                    this._updateIndexes(i, 1);
                    marker2._index++;
                    this._updatePrevNext(marker1, marker);
                    this._updatePrevNext(marker, marker2);

                    this._poly.fire('editstart');
            };

            onDragEnd = function () {
                    marker.off('dragstart', onDragStart, this);
                    marker.off('dragend', onDragEnd, this);
                    marker.off('touchmove', onDragStart, this);

                    this._createMiddleMarker(marker1, marker);
                    this._createMiddleMarker(marker, marker2);
            };

            onClick = function () {
                    onDragStart.call(this);
                    onDragEnd.call(this);
                    this._fireEdit();
            };

            marker
                    .on('click', onClick, this)
                    .on('dragstart', onDragStart, this)
                    .on('dragend', onDragEnd, this)
                    .on('touchmove', onDragStart, this);

            this._markerGroup.addLayer(marker);
    },

    _updatePrevNext: function (marker1, marker2) {
            if (marker1) {
                    marker1._next = marker2;
            }
            if (marker2) {
                    marker2._prev = marker1;
            }
    },

    _getMiddleLatLng: function (marker1, marker2) {
            var map = this._poly._map,
                    p1 = map.project(marker1.getLatLng()),
                    p2 = map.project(marker2.getLatLng());

            return map.unproject(p1._add(p2)._divideBy(2));
    }
});

L.Polyline.addInitHook(function () {

	// Check to see if handler has already been initialized. This is to support versions of Leaflet that still have L.Handler.PolyEdit
	if (this.editing) {
		return;
	}

	if (L.Edit.Poly) {

		this.editing = new L.Edit.Poly(this, this.options.poly);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});