# Leaflet.Draw.Advanced

![Status:Release](https://img.shields.io/badge/status-release-green.svg)


## Features
* Allowing "lazy mode" for `L.Polyline` editing. In this mode, only nodes near the cursor are drawn.
* Extending `L.Polyline` to `L.Route`. Represents routes.
* `L.Route` has several additional features and can get a `router` object that tells how the routing must be done.
* `L.Draw.Routing.Router` classes defines the use of routing mechanisms.
* `L.Draw.routing.Router.OSM` handles routing with OSM web-services.
