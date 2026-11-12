//Documentação da função:  https://openlayers.org/en/latest/examples/overviewmap-custom.html
const overviewMapControl = new ol.control.OverviewMap({
    className: 'ol-overviewmap ol-custom-overviewmap',
    layers: [
        new ol.layer.Tile({
            // source: new ol.source.XYZ({
            // attributions: ' ',
            //     url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
            // })
            // source: new ol.source.XYZ({
            // attributions: '<a href="https://www.openstreetmap.org/copyright"></a>',
            //     url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            // })
            // source: new ol.source.XYZ({
            // attributions: ' ',
            //     url: 'https://server.arcgisonline.com/arcgis/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}'
            // })
            source: new ol.source.XYZ({
            attributions: ' ',
                url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
            })
            
        })
    ],

    collapseLabel: '\u00BB',
    label: '\u00AB',
    collapsed: false
});

map.addControl(overviewMapControl);