
var map = new ol.Map({
    target: 'map',
    renderer: 'canvas',
    layers: [group_MapaBase, group_TCC_Potencial_Solar],
    view: new ol.View({
         maxZoom: 28, minZoom: 1
    })
});

//initial view - Centrado no Piauí
map.getView().setCenter(ol.proj.transform([-42.8, -6.8], 'EPSG:4326', 'EPSG:3857'));
map.getView().setZoom(7); // Ajuste este número para aproximar ou afastar

//full zooms only,0,
map.getView().setProperties({constrainResolution: true});

//change cursor
function pointerOnFeature(evt) {
    if (evt.dragging) {
        return;
    }
    var hasFeature = map.hasFeatureAtPixel(evt.pixel, {
        layerFilter: function(layer) {
            return layer && (layer.get("interactive"));
        }
    });
    map.getViewport().style.cursor = hasFeature ? "pointer" : "";
}
map.on('pointermove', pointerOnFeature);
function styleCursorMove() {
    map.on('pointerdrag', function() {
        map.getViewport().style.cursor = "move";
    });
    map.on('pointerup', function() {
        map.getViewport().style.cursor = "default";
    });
}
styleCursorMove();

////small screen definition
    var hasTouchScreen = map.getViewport().classList.contains('ol-touch');
    var isSmallScreen = window.innerWidth < 650;

////controls container

    //top left container
    var topLeftContainer = new ol.control.Control({
        element: (() => {
            var topLeftContainer = document.createElement('div');
            topLeftContainer.id = 'top-left-container';
            return topLeftContainer;
        })(),
    });
    map.addControl(topLeftContainer)

    //bottom left container
    var bottomLeftContainer = new ol.control.Control({
        element: (() => {
            var bottomLeftContainer = document.createElement('div');
            bottomLeftContainer.id = 'bottom-left-container';
            return bottomLeftContainer;
        })(),
    });
    map.addControl(bottomLeftContainer)
  
    //top right container
    var topRightContainer = new ol.control.Control({
        element: (() => {
            var topRightContainer = document.createElement('div');
            topRightContainer.id = 'top-right-container';
            return topRightContainer;
        })(),
    });
    map.addControl(topRightContainer)

    //bottom right container
    var bottomRightContainer = new ol.control.Control({
        element: (() => {
            var bottomRightContainer = document.createElement('div');
            bottomRightContainer.id = 'bottom-right-container';
            return bottomRightContainer;
        })(),
    });
    map.addControl(bottomRightContainer)

popup
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var sketch;

function stopMediaInPopup() {
    var mediaElements = container.querySelectorAll('audio, video');
    mediaElements.forEach(function(media) {
        media.pause();
        media.currentTime = 0;
    });
}
closer.onclick = function() {
    container.style.display = 'none';
    closer.blur();
    stopMediaInPopup();
    return false;
};
var overlayPopup = new ol.Overlay({
    element: container,
	autoPan: true
});
map.addOverlay(overlayPopup)
    
    
var NO_POPUP = 0
var ALL_FIELDS = 1

/**
 * Returns either NO_POPUP, ALL_FIELDS or the name of a single field to use for
 * a given layer
 * @param layerList {Array} List of ol.Layer instances
 * @param layer {ol.Layer} Layer to find field info about
 */
function getPopupFields(layerList, layer) {
    // Determine the index that the layer will have in the popupLayers Array,
    // if the layersList contains more items than popupLayers then we need to
    // adjust the index to take into account the base maps group
    var idx = layersList.indexOf(layer) - (layersList.length - popupLayers.length);
    return popupLayers[idx];
}

//highligth collection
var collection = new ol.Collection();
var featureOverlay = new ol.layer.Vector({
    map: map,
    source: new ol.source.Vector({
        features: collection,
        useSpatialIndex: false // optional, might improve performance
    }),
    style: [new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#f00',
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.1)'
        }),
    })],
    updateWhileAnimating: true, // optional, for instant visual feedback
    updateWhileInteracting: true // optional, for instant visual feedback
});

var doHighlight = true;
var doHover = false;

function createPopupField(currentFeature, currentFeatureKeys, layer) {
    var popupText = '';
    
    // Recupera os metadados com segurança
    var fieldLabels = layer.get('fieldLabels') || {};
    var fieldImages = layer.get('fieldImages') || {};
    var fieldAliases = layer.get('fieldAliases') || {};

    for (var i = 0; i < currentFeatureKeys.length; i++) {
        var key = currentFeatureKeys[i];
        
        // 1. Ignora geometria e atributos internos do sistema
        if (key === 'geometry' || key === 'layerObject' || key === 'idO' || key === 'boundedBy') {
            continue;
        }

        var rawValue = currentFeature.get(key);

        // 2. ELIMINA O [object Object]: pula qualquer valor que seja um objeto ou função
        if (rawValue !== null && typeof rawValue === 'object') {
            continue;
        }

        var labelType = fieldLabels[key];

        // Respeita a configuração de campos ocultos ou ignorados
        if (labelType == "hidden field" || labelType == "Hidden") {
            continue;
        } 
        
        if ((labelType == "inline label - visible with data" || labelType == "header label - visible with data") && (rawValue == null || rawValue === '')) {
            continue;
        }

        var popupField = '';

        // GARANTIA: Se o fieldAlias estiver vazio, usa o nome real da chave (`key`) como título da linha
        var labelText = (fieldAliases && fieldAliases[key]) ? fieldAliases[key] : key;

        // Monta a célula de cabeçalho (th) com o nome do atributo e a célula de valor (td)
        popupField += '<th>' + labelText + '</th><td>';

        var valString = '';
        if (rawValue != null) {
            valString = rawValue.toLocaleString();

            var correcoes = {
                'Piau\uFFFD': 'Piauí',
                'Piau?': 'Piauí',
                'Sert?o 1': 'Sertão 1',
                'Opera??o': 'Operação'
            };

            for (var termoErrado in correcoes) {
                if (valString.indexOf(termoErrado) !== -1) {
                    valString = valString.split(termoErrado).join(correcoes[ternoErrado]);
                }
            }
        }

        popupField += (rawValue != null ? autolinker.link(valString) + '</td>' : '</td>');
        popupText += '<tr>' + popupField + '</tr>';
    }
    return popupText;
}
var highlight;
var wmsHoverTimeout; // Nova variável para controlar o tempo do Hover WMS
var autolinker = new Autolinker({truncate: {length: 30, location: 'smart'}});

function onPointerMove(evt) {
    if (!doHover && !doHighlight) {
        return;
    }
    if (evt.dragging) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var currentFeature;
    var currentLayer;
    var currentFeatureKeys;
    var clusteredFeatures;
    var clusterLength;
    var popupText = '<ul>';

    var featuresAndLayers = [];
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (layer && feature instanceof ol.Feature && (layer.get("interactive") || layer.get("interactive") === undefined)) {
            featuresAndLayers.push({ feature, layer });
        }
    });

    if (featuresAndLayers.length > 0) {
        clearTimeout(wmsHoverTimeout); // Cancela o WMS se estiver sobre vetor
        
        for (var i = featuresAndLayers.length - 1; i >= 0; i--) {
            var feature = featuresAndLayers[i].feature;
            var layer = featuresAndLayers[i].layer;
            var doPopup = false;
            for (k in layer.get('fieldImages')) {
                if (layer.get('fieldImages')[k] != "Hidden") {
                    doPopup = true;
                }
            }
            currentFeature = feature;
            currentLayer = layer;
            clusteredFeatures = feature.get("features");
            if (clusteredFeatures) {
                clusterLength = clusteredFeatures.length;
            }
            if (typeof clusteredFeatures !== "undefined") {
                if (doPopup) {
                    for(var n=0; n<clusteredFeatures.length; n++) {
                        currentFeature = clusteredFeatures[n];
                        currentFeatureKeys = currentFeature.getKeys();
                        popupText += '<li><table>'
                        popupText += '<a>' + '<b>' + layer.get('popuplayertitle') + '</b>' + '</a>';
                        popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
                        popupText += '</table></li>';    
                    }
                }
            } else {
                currentFeatureKeys = currentFeature.getKeys();
                if (doPopup) {
                    popupText += '<li><table>';
                    popupText += '<a>' + '<b>' + layer.get('popuplayertitle') + '</b>' + '</a>';
                    popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
                    popupText += '</table></li>';
                }
            }
        }

        if (popupText == '<ul>') {
            popupText = '';
        } else {
            popupText += '</ul>';
        }
        
        if (doHighlight) {
            if (currentFeature !== highlight) {
                if (highlight) {
                    featureOverlay.getSource().removeFeature(highlight);
                }
                if (currentFeature) {
                    var featureStyle
                    if (typeof clusteredFeatures == "undefined") {
                        var style = currentLayer.getStyle();
                        var styleFunction = typeof style === 'function' ? style : function() { return style; };
                        featureStyle = styleFunction(currentFeature)[0];
                    } else {
                        featureStyle = currentLayer.getStyle().toString();
                    }

                    if (currentFeature.getGeometry().getType() == 'Point' || currentFeature.getGeometry().getType() == 'MultiPoint') {
                        var radius = 5;
                        var img = (featureStyle && featureStyle.getImage) ? featureStyle.getImage() : null;
                        if (typeof clusteredFeatures == "undefined") {
                            if (img && typeof img.getRadius === 'function') {
                                radius = img.getRadius();
                            }
                        } else {
                            var styleStr = featureStyle.toString();
                            if (styleStr.indexOf('radius') !== -1) {
                                radius = parseFloat(styleStr.split('radius')[1].split(' ')[1]) + clusterLength;
                            }
                        }
                        highlightStyle = new ol.style.Style({
                            image: new ol.style.Circle({
                                fill: new ol.style.Fill({
                                    color: "rgba(255, 255, 0, 1.00)"
                                }),
                                radius: radius
                            })
                        });
                    } else if (currentFeature.getGeometry().getType() == 'LineString' || currentFeature.getGeometry().getType() == 'MultiLineString') {
                        var featureWidth = featureStyle.getStroke().getWidth();
                        highlightStyle = new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: 'rgba(255, 255, 0, 1.00)',
                                lineDash: null,
                                width: featureWidth
                            })
                        });
                    } else {
                        highlightStyle = new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'rgba(255, 255, 0, 1.00)'
                            })
                        })
                    }
                    featureOverlay.getSource().addFeature(currentFeature);
                    featureOverlay.setStyle(highlightStyle);
                }
                highlight = currentFeature;
            }
        }

        if (doHover) {
            if (popupText) {
                content.innerHTML = popupText;
                container.style.display = 'block';
                overlayPopup.setPosition(coord);
            } else {
                container.style.display = 'none';
                closer.blur();
            }
        }
    } 
    // --- NOVA LÓGICA: DESTAQUE AMARELO PARA CAMADAS WMS (HOVER) ---
    else {
        clearTimeout(wmsHoverTimeout);
        
        if (highlight) {
            featureOverlay.getSource().removeFeature(highlight);
            highlight = null;
        }

        if (doHighlight) {
            // Atraso de 100ms para evitar sobrecarregar o servidor enquanto move o mouse rápido
            wmsHoverTimeout = setTimeout(function() {
                var viewResolution = map.getView().getResolution();
                var viewProjection = map.getView().getProjection();

                for (var i = 0; i < wms_layers.length; i++) {
                    if (wms_layers[i][1] && wms_layers[i][0].getVisible()) {
                        var url = wms_layers[i][0].getSource().getFeatureInfoUrl(
                            coord, viewResolution, viewProjection, {
                                'INFO_FORMAT': 'application/json',
                                'FEATURE_COUNT': 1
                            });
                        
                        if (url) {
                            fetch(url)
                                .then(res => res.json())
                                .then(data => {
                                    if (data.features && data.features.length > 0) {
                                        var format = new ol.format.GeoJSON();
                                        var feature = format.readFeatures(data, { featureProjection: viewProjection })[0];
                                        
                                        highlightStyle = new ol.style.Style({
                                            stroke: new ol.style.Stroke({
                                                color: 'rgba(255, 255, 0, 1.00)',
                                                width: 2
                                            }),
                                            fill: new ol.style.Fill({
                                                color: 'rgba(255, 255, 0, 0.40)' // Amarelo Translúcido
                                            })
                                        });

                                        featureOverlay.getSource().clear();
                                        featureOverlay.getSource().addFeature(feature);
                                        featureOverlay.setStyle(highlightStyle);
                                        highlight = feature;
                                    }
                                }).catch(err => console.log(err));
                            break;
                        }
                    }
                }
            }, 100); 
        }
    }
};

map.on('pointermove', onPointerMove);

var popupContent = '';
var popupCoord = null;
var featuresPopupActive = false;

function updatePopup() {
    if (popupContent) {
        content.innerHTML = popupContent;
        container.style.display = 'block';
		overlayPopup.setPosition(popupCoord);
    } else {
        container.style.display = 'none';
        closer.blur();
        stopMediaInPopup();
    }
} 

function onSingleClickFeatures(evt) {
    if (doHover || sketch) {
        return;
    }
    if (!featuresPopupActive) {
        featuresPopupActive = true;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var popupText = '';
    
    // Pega APENAS a primeira feição no ponto clicado (a mais acima visualmente)
    var hit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (layer && feature instanceof ol.Feature && (layer.get("interactive") || layer.get("interactive") === undefined)) {
            var doPopup = false;
            for (var k in layer.get('fieldImages')) {
                if (layer.get('fieldImages')[k] !== "Hidden") {
                    doPopup = true;
                }
            }
            if (doPopup) {
                return { feature: feature, layer: layer }; // para na primeira camada encontrada!
            }
        }
    });

    if (hit) {
        var feature = hit.feature;
        var layer = hit.layer;
        var clusteredFeatures = feature.get("features");
        var currentFeature = (clusteredFeatures && clusteredFeatures.length > 0) ? clusteredFeatures[0] : feature;
        var currentFeatureKeys = currentFeature.getKeys();

        popupText += '<ul><li><table>';
        popupText += '<a><b>' + (layer.get('popuplayertitle') || '') + '</b></a>';
        popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
        popupText += '</table></li></ul>';
    }
	
    popupContent = popupText;
    popupCoord = coord;
    updatePopup();
}

function onSingleClick(evt) {
    if (doHover || sketch) return;

    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var viewProjection = map.getView().getProjection();
    var viewResolution = map.getView().getResolution();

    var popupText = '<div style="min-width: 220px;">';
    var encontrouVetor = false;
    var processedFeatures = new Set(); // Conjunto para evitar duplicatas

    // 1. Procura em todas as camadas vetoriais do mapa
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (layer && feature instanceof ol.Feature) {
            // Evita processar a mesma feição duas vezes se o mapa a detetar em múltiplos contextos
            if (processedFeatures.has(feature)) {
                return;
            }
            processedFeatures.add(feature);

            var isInteractive = layer.get("interactive") === true || layer.get("interactive") === undefined;
            
            if (isInteractive) {
                var fieldImages = layer.get('fieldImages') || {};
                var doPopup = false;
                
                for (var k in fieldImages) {
                    if (fieldImages[k] != "Hidden") {
                        doPopup = true;
                        break;
                    }
                }
                if (!doPopup && layer.get('popuplayertitle')) {
                    doPopup = true;
                }

                if (doPopup) {
                    encontrouVetor = true;
                    var currentFeatureKeys = feature.getKeys();
                    var layerTitle = layer.get('popuplayertitle') || 'Informação';
                    
                    // Aplica o padrão visual idêntico ao do GeoServer com a identidade AcervoMAP
                    popupText += '<span class="custom-popup-header">' + layerTitle + '</span>';
                    popupText += '<table class="custom-popup-table">';
                    popupText += createPopupField(feature, currentFeatureKeys, layer);
                    popupText += '</table>';
                }
            }
        }
    });

    popupText += '</div>';

    // Se encontrou feições vetoriais, exibe o popup formatado e encerra
    if (encontrouVetor && popupText !== '<div style="min-width: 220px;"></div>') {
        popupContent = popupText;
        popupCoord = coord;
        overlayPopup.setPosition(popupCoord);
        container.style.display = 'block';
        updatePopup();
        return; 
    }

    // 2. Se NÃO houver vetor no pixel, verifica nas camadas WMS especiais (Municípios, SIGEF, CAR)
    for (var i = wms_layers.length - 1; i >= 0; i--) {
        if (wms_layers[i][1] && wms_layers[i][0].getVisible()) {
            var layer = wms_layers[i][0];
            var layerTitle = layer.get('popuplayertitle') || '';

            var isEspecialWMS = layerTitle.includes('Municípios') || layerTitle.includes('SIGEF') || layerTitle.includes('CAR');

            if (isEspecialWMS) {
                var url = layer.getSource().getFeatureInfoUrl(
                    coord, viewResolution, viewProjection, {
                        'INFO_FORMAT': 'application/json',
                        'FEATURE_COUNT': 1,
                        'BUFFER': 10
                    });
                
                if (url) {
                    const wmsTitle = layerTitle;
                    
                    popupCoord = coord;
                    overlayPopup.setPosition(popupCoord);
                    container.style.display = 'block';
                    popupContent = '<div style="text-align:center;"><div class="roller-switcher" style="height: 25px; width: 25px; display:inline-block;"></div></div>';
                    updatePopup();

                    fetch(url)
                        .then(res => {
                            if (!res.ok) throw new Error("Erro de conexão com o GeoServer");
                            return res.json();
                        })
                        .then(data => {
                            if (data && data.features && data.features.length > 0) {
                                var format = new ol.format.GeoJSON();
                                var feature = format.readFeatures(data, { featureProjection: viewProjection })[0];
                                
                                var normalizedFeature = new ol.Feature();
                                var normalizedKeys = [];

                                feature.getKeys().forEach(function(k) {
                                    if (k === 'geometry') return;
                                    normalizedFeature.set(k, feature.get(k));
                                    normalizedKeys.push(k);
                                });

                                if (!layer.get('fieldLabels')) {
                                    var dummyLabels = {};
                                    normalizedKeys.forEach(k => dummyLabels[k] = "inline label - visible with data");
                                    layer.set('fieldLabels', dummyLabels);
                                }

                                if (!layer.get('fieldImages')) {
                                    var dummyImages = {};
                                    normalizedKeys.forEach(k => dummyImages[k] = "TextEdit");
                                    layer.set('fieldImages', dummyImages);
                                }

                                if (!layer.get('fieldAliases')) {
                                    var dummyAliases = {};
                                    normalizedKeys.forEach(k => dummyAliases[k] = k);
                                    layer.set('fieldAliases', dummyAliases);
                                }

                                // Aplica o mesmo padrão visual limpo para as camadas WMS transformadas em WFS
                                var wmsPopupText = '<div style="min-width: 220px;">';
                                wmsPopupText += '<span class="custom-popup-header">' + wmsTitle + '</span>';
                                wmsPopupText += '<table class="custom-popup-table">';
                                wmsPopupText += createPopupField(normalizedFeature, normalizedKeys, layer);
                                wmsPopupText += '</table>';
                                wmsPopupText += '</div>';

                                popupContent = wmsPopupText;
                                updatePopup();
                            } else {
                                container.style.display = 'none';
                                closer.blur();
                            }
                        })
                        .catch(err => {
                            console.error("Falha no Pop-up WMS/WFS:", err);
                            container.style.display = 'none';
                            closer.blur();
                        });
                    
                    break;
                }
            }
        }
    }
}
// Atualiza o evento de clique do mapa
map.on('singleclick', onSingleClick);

//get container
var topLeftContainerDiv = document.getElementById('top-left-container')

//get container
var topLeftContainerDiv = document.getElementById('top-left-container')
var bottomLeftContainerDiv = document.getElementById('bottom-left-container')
var topRightContainerDiv = document.getElementById('top-right-container')
var bottomRightContainerDiv = document.getElementById('bottom-right-container')

//title

//abstract


//geolocate



//measurement

var measuring = false;
var sketch;
var helpTooltipElement;
var helpTooltip;
var measureTooltipElement;
var measureTooltip;

var formatLength = function (line) {
    var length = ol.sphere.getLength(line);
    var output;
    if (length > 100) {
        output = (Math.round((length / 1000) * 100) / 100) + ' km';
    } else {
        output = (Math.round(length * 100) / 100) + ' m';
    }
    return output;
};

var formatArea = function (polygon) {
    var area = ol.sphere.getArea(polygon);
    if (area > 10000) {
        output = Math.round((area / 1000000) * 100) / 100 + ' km²';
    } else {
        output = Math.round(area * 100) / 100 + ' m²';
    }
    return output;
};

const measureButton = document.createElement('button');
measureButton.className = 'measure-button fas fa-ruler';
measureButton.title = 'Measure';
measureButton.setAttribute('aria-label', 'Ferramenta de medição');

const measureControl = document.createElement('div');
measureControl.className = 'ol-unselectable ol-control measure-control';
measureControl.appendChild(measureButton);
map.getTargetElement().appendChild(measureControl);



// Event handler
function handleMeasure() {
  if (!measuring) {
    selectLabel.style.display = "";
    map.addInteraction(draw);
    createHelpTooltip();
    createMeasureTooltip();
    measuring = true;
  } else {
    selectLabel.style.display = "none";
    map.removeInteraction(draw);
    if (helpTooltip) map.removeOverlay(helpTooltip);
    if (measureTooltip) map.removeOverlay(measureTooltip);
    const staticTooltips = document.getElementsByClassName("tooltip-static");
    while (staticTooltips.length > 0) {
      staticTooltips[0].parentNode.removeChild(staticTooltips[0]);
    }
    measureLayer.getSource().clear();
    sketch = null;
    measuring = false;
  }
}

measureButton.addEventListener('click', handleMeasure);
measureButton.addEventListener('touchstart', handleMeasure);

map.on('pointermove', function(evt) {
    if (evt.dragging) {
        return;
    }
    if (measuring) {
        /** @type {string} */
        var helpMsg = 'Click to start drawing';
        if (sketch) {
            var geom = (sketch.getGeometry());
            if (geom instanceof ol.geom.Polygon) {
                helpMsg = continuePolygonMsg;
            } else if (geom instanceof ol.geom.LineString) {
                helpMsg = continueLineMsg;
            }
        }
        helpTooltipElement.innerHTML = helpMsg;
        helpTooltip.setPosition(evt.coordinate);
    }
});

var selectLabel = document.createElement("label");
selectLabel.innerHTML = "&nbsp;Measure:&nbsp;";

var typeSelect = document.createElement("select");
typeSelect.id = "type";

var measurementOption = [
    { value: "LineString", description: "Length" },
    { value: "Polygon", description: "Area" }
    ];
measurementOption.forEach(function (option) {
    var optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.text = option.description;
    typeSelect.appendChild(optionElement);
});


selectLabel.appendChild(typeSelect);
measureControl.appendChild(selectLabel);
selectLabel.style.display = "none";

window.addEventListener('keydown', function(event) {
    if (!measuring) return; 
    if (event.key === 'Escape' || event.keyCode === 27) {
        handleMeasure(); 
    }
    if (event.key === 'Enter' || event.keyCode === 13) {
        if (draw) {
            try {
                draw.finishDrawing();
            } catch (e) {
                console.log("Erro ao finalizar o desenho com Enter:", e);
            }
        }
    }
});
	/**
	 * Currently drawn feature.
	 * @type {ol.Feature}
	 */

	/**
	 * The help tooltip element.
	 * @type {Element}
	 */
	var helpTooltipElement;


	/**
	 * Overlay to show the help messages.
	 * @type {ol.Overlay}
	 */
	var helpTooltip;


	/**
	 * The measure tooltip element.
	 * @type {Element}
	 */
	var measureTooltipElement;


	/**
	 * Overlay to show the measurement.
	 * @type {ol.Overlay}
	 */
	var measureTooltip;


	/**
	 * Message to show when the user is drawing a line.
	 * @type {string}
	 */
	var continueLineMsg = 'Click to continue drawing the line';



	/**
	 * Message to show when the user is drawing a polygon.
	 * @type {string}
	 */
	var continuePolygonMsg = "1click continue, 2click close";


	var typeSelect = document.getElementById("type");
	var typeSelectForm = document.getElementById("form_measure");

	typeSelect.onchange = function (e) {		  
	  map.removeInteraction(draw);
	  addInteraction();
	  map.addInteraction(draw);		  
	};

	var measureLineStyle = new ol.style.Style({
	  stroke: new ol.style.Stroke({ 
		color: "rgba(0, 0, 255)", //blu
		lineDash: [10, 10],
		width: 4
	  }),
	  image: new ol.style.Circle({
		radius: 6,
		stroke: new ol.style.Stroke({
		  color: "rgba(255, 255, 255)", 
		  width: 1
		}),
	  })
	});

	var measureLineStyle2 = new ol.style.Style({	  
		stroke: new ol.style.Stroke({
			color: "rgba(255, 255, 255)", 
			lineDash: [10, 10],
			width: 2
		  }),
	  image: new ol.style.Circle({
		radius: 5,
		stroke: new ol.style.Stroke({
		  color: "rgba(0, 0, 255)", 
		  width: 1
		}),
			  fill: new ol.style.Fill({
		  color: "rgba(255, 204, 51, 0.4)", 
		}),
		  })
	});

	var labelStyle = new ol.style.Style({
	  text: new ol.style.Text({
		font: "14px Calibri,sans-serif",
		fill: new ol.style.Fill({
		  color: "rgba(0, 0, 0, 1)"
		}),
		stroke: new ol.style.Stroke({
		  color: "rgba(255, 255, 255, 1)",
		  width: 3
		})
	  })
	});

	var labelStyleCache = [];

	var styleFunction = function (feature, type) {
	  var styles = [measureLineStyle, measureLineStyle2];
	  var geometry = feature.getGeometry();
	  var type = geometry.getType();
	  var lineString;
	  if (!type || type === type) {
		if (type === "Polygon") {
		  lineString = new ol.geom.LineString(geometry.getCoordinates()[0]);
		} else if (type === "LineString") {
		  lineString = geometry;
		}
	  }
	  if (lineString) {
		var count = 0;
		lineString.forEachSegment(function (a, b) {
		  var segment = new ol.geom.LineString([a, b]);
		  var label = formatLength(segment);
		  if (labelStyleCache.length - 1 < count) {
			labelStyleCache.push(labelStyle.clone());
		  }
		  labelStyleCache[count].setGeometry(segment);
		  labelStyleCache[count].getText().setText(label);
		  styles.push(labelStyleCache[count]);
		  count++;
		});
	  }
	  return styles;
	};
	var source = new ol.source.Vector();

	var measureLayer = new ol.layer.Vector({
	  source: source,
	  displayInLayerSwitcher: false,
	  style: function (feature) {
		labelStyleCache = [];
		return styleFunction(feature);
	  }
	});

	map.addLayer(measureLayer);

	var draw; // global so we can remove it later
	function addInteraction() {
	  var type = typeSelect.value;
	  draw = new ol.interaction.Draw({
		source: source,
		type: /** @type {ol.geom.GeometryType} */ (type),
		style: function (feature) {
				  return styleFunction(feature, type);
				}
	  });

	  var listener;
	  draw.on('drawstart',
		  function(evt) {
			// set sketch
			sketch = evt.feature;

			/** @type {ol.Coordinate|undefined} */
			var tooltipCoord = evt.coordinate;

			listener = sketch.getGeometry().on('change', function(evt) {
			  var geom = evt.target;
			  var output;
			  if (geom instanceof ol.geom.Polygon) {
					  output = formatArea(/** @type {ol.geom.Polygon} */ (geom));
					  tooltipCoord = geom.getInteriorPoint().getCoordinates();
					} else if (geom instanceof ol.geom.LineString) {
					  output = formatLength(/** @type {ol.geom.LineString} */ (geom));
					  tooltipCoord = geom.getLastCoordinate();
					}
			  measureTooltipElement.innerHTML = output;
			  measureTooltip.setPosition(tooltipCoord);
			});
		  }, this);

	  draw.on('drawend',
		  function(evt) {
			measureTooltipElement.className = 'tooltip tooltip-static';
			measureTooltip.setOffset([0, -7]);
			// unset sketch
			sketch = null;
			// unset tooltip so that a new one can be created
			measureTooltipElement = null;
			createMeasureTooltip();
			ol.Observable.unByKey(listener);
		  }, this);
	}


	/**
	 * Creates a new help tooltip
	 */
	function createHelpTooltip() {
	  if (helpTooltipElement) {
		helpTooltipElement.parentNode.removeChild(helpTooltipElement);
	  }
	  helpTooltipElement = document.createElement('div');
	  helpTooltipElement.className = 'tooltip hidden';
	  helpTooltip = new ol.Overlay({
		element: helpTooltipElement,
		offset: [15, 0],
		positioning: 'center-left'
	  });
	  map.addOverlay(helpTooltip);
	}


	/**
	 * Creates a new measure tooltip
	 */
	function createMeasureTooltip() {
	  if (measureTooltipElement) {
		measureTooltipElement.parentNode.removeChild(measureTooltipElement);
	  }
	  measureTooltipElement = document.createElement('div');
	  measureTooltipElement.className = 'tooltip tooltip-measure';
	  measureTooltip = new ol.Overlay({
		element: measureTooltipElement,
		offset: [0, -15],
		positioning: 'bottom-center'
	  });
	  map.addOverlay(measureTooltip);
	}


  /**
  * format length output
  * @param {ol.geom.LineString} line
  * @return {string}
  */
  var formatLength = function(line) {
    var length;
    var coordinates = line.getCoordinates();
    length = 0;
    var sourceProj = map.getView().getProjection();
    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
        var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
        length += ol.sphere.getDistance(c1, c2);
      }
    var output;
    if (length > 100) {
      output = (Math.round(length / 1000 * 100) / 100) +
          ' ' + 'km';
    } else {
      output = (Math.round(length * 100) / 100) +
          ' ' + 'm';
    }
    return output;
  };

  /**
  * Format area output.
  * @param {ol.geom.Polygon} polygon The polygon.
  * @return {string} Formatted area.
  */
	var formatArea = function (polygon) {
		var sourceProj = map.getView().getProjection();
		var geom = polygon.clone().transform(sourceProj, 'EPSG:3857');
		var area = Math.abs(ol.sphere.getArea(geom));
		var output;
		if (area > 1000000) {
			output = Math.round((area / 1000000) * 1000) / 1000 + ' ' + 'km<sup>2</sup>';
		} else {
			output = Math.round(area * 100) / 100 + ' ' + 'm<sup>2</sup>';
		}
		return output.replace('.', ',');
	};

  addInteraction();

  var parentElement = document.querySelector(".measure-control");
  var elementToMove = document.getElementById("form_measure");
  if (elementToMove && parentElement) {
    parentElement.insertBefore(elementToMove, parentElement.firstChild);
  }


//geocoder
//Layer to represent the point of the geocoded address
  var geocoderLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
});
map.addLayer(geocoderLayer);
var vectorSource = geocoderLayer.getSource();

var obj2 = {
    value: '',
    letMeKnow() {},
    get gcd() { return this.value; },
    set gcd(value) {
        this.value = value;
        this.letMeKnow();
    }
};

var obj = {
    value: '',
    get label() { return this.value; },
    set label(value) { this.value = value; }
};

// Função executada quando você seleciona um município na lista suspensa
function onSelected(feature) {
    obj.label = feature;
    
    var coordinates = ol.proj.transform(
        [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
        "EPSG:4326",
        map.getView().getProjection()
    );
    
    vectorSource.clear(true);
    obj2.gcd = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
    
    var marker = new ol.Feature(new ol.geom.Point(coordinates));
    var zIndex = 1;
    marker.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            scale: 0.7,
            opacity: 1,
            src: "./images/icons8-localização.png",
            zIndex: zIndex
        }),
        zIndex: zIndex
    }));
    
    vectorSource.addFeature(marker);
    map.getView().setCenter(coordinates);
    map.getView().setZoom(13); // Zoom ideal para enquadrar o município
}

// Formatação do resultado na lista de autocomplete
var formatResult = function (feature, el) {
    var title = document.createElement("strong");
    el.appendChild(title);
    var detailsContainer = document.createElement("small");
    el.appendChild(detailsContainer);
    var details = [];
    title.innerHTML = feature.properties.label || feature.properties.display_name;
    
    if (feature.properties.city && feature.properties.city !== feature.properties.name) {
        details.push(feature.properties.city);
    }
    if (feature.properties.context) {
        details.push(feature.properties.context);
    }
    detailsContainer.innerHTML = details.join(", ");
};

function myHandler(featureCollection) {}

const url = {
    "Nominatim OSM": "https://nominatim.openstreetmap.org/search?format=geojson&addressdetails=1&",
    "France BAN": "https://api-adresse.data.gouv.fr/search/?"
};

// Cria o componente de busca do Photon
var containers = new Photon.Search({
    resultsHandler: myHandler,
    onSelected: onSelected,
    placeholder: "Digite o nome do Município...",
    formatResult: formatResult,
    url: url["Nominatim OSM"],
    position: "topright",
});

var btnMunicipio = document.getElementById("btn-municipio");
var inputMunicipio = document.getElementById("input-municipio");

if (btnMunicipio && inputMunicipio) {
    btnMunicipio.addEventListener("click", function(e) {
        e.preventDefault();
        var termoBusca = inputMunicipio.value.trim();

        if (!termoBusca) {
            alert("Por favor, digite o nome do município.");
            return;
        }

        // Executa a busca utilizando a URL do Nominatim configurada no objeto 'url'
        fetch(url["Nominatim OSM"] + "q=" + encodeURIComponent(termoBusca))
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                if (data.features && data.features.length > 0) {
                    // Pega o primeiro resultado e passa direto para a sua função onSelected
                    onSelected(data.features[0]);
                } else {
                    alert("Município não encontrado.");
                }
            })
            .catch(function(error) {
                console.error("Erro na busca:", error);
                alert("Erro ao realizar a busca.");
            });
    });
}

//layerswitcher

var layerSwitcher = new ol.control.LayerSwitcher({
    tipLabel: "Layers",
    target: 'top-right-container'
});
map.addControl(layerSwitcher);
    

//attribution
var bottomAttribution = new ol.control.Attribution({
  collapsible: true,
  collapsed: true,
  className: 'bottom-attribution'
});
map.addControl(bottomAttribution);

map.once('rendercomplete', function() {
  var bottomAttributionUl = bottomAttribution.element.querySelector('ul');
  if (bottomAttributionUl) {
    var layerAttrs = Array.from(bottomAttributionUl.querySelectorAll('li'))
      .map(function(li) { return li.innerHTML.trim(); }).filter(Boolean);
    var attribHtml = `
    <a href="https://github.com/qgis2web/qgis2web">qgis2web</a> &middot;
    <a href="https://openlayers.org/">OpenLayers</a> &middot;
    <a href="https://qgis.org/">QGIS</a>`;
    if (layerAttrs.length > 0) { attribHtml += ' &nbsp;|&nbsp; ' + layerAttrs.join(', '); }
    bottomAttributionUl.innerHTML = '<li>' + attribHtml + '</li>';
  }
});


// Disable "popup on hover" or "highlight on hover" if ol-control mouseover
var preDoHover = doHover;
var preDoHighlight = doHighlight;
var isPopupAllActive = false;
document.addEventListener('DOMContentLoaded', function() {
	if (doHover || doHighlight) {
		var controlElements = document.getElementsByClassName('ol-control');
		for (var i = 0; i < controlElements.length; i++) {
			controlElements[i].addEventListener('mouseover', function() { 
				doHover = false;
				doHighlight = false;
			});
			controlElements[i].addEventListener('mouseout', function() {
				doHover = preDoHover;
				if (isPopupAllActive) { return }
				doHighlight = preDoHighlight;
			});
		}
	}
});


//move controls inside containers, in order
    //zoom
    var zoomControl = document.getElementsByClassName('ol-zoom')[0];
    if (zoomControl) {
        topLeftContainerDiv.appendChild(zoomControl);
    }
    //geolocate
    if (typeof geolocateControl !== 'undefined') {
        topLeftContainerDiv.appendChild(geolocateControl);
    }
    //measure
    if (typeof measureControl !== 'undefined') {
        topLeftContainerDiv.appendChild(measureControl);
    }
    //geocoder
    var searchbar = document.getElementsByClassName('photon-geocoder-autocomplete ol-unselectable ol-control')[0];
    if (searchbar) {
        topLeftContainerDiv.appendChild(searchbar);
    }
    //search layer
    var searchLayerControl = document.getElementsByClassName('search-layer')[0];
    if (searchLayerControl) {
        topLeftContainerDiv.appendChild(searchLayerControl);
    }
    //scale line
    var scaleLineControl = document.getElementsByClassName('ol-scale-line')[0];
    if (scaleLineControl) {
        scaleLineControl.className += ' ol-control';
        bottomLeftContainerDiv.appendChild(scaleLineControl);
    }
    //attribution
    var attributionControl = document.getElementsByClassName('bottom-attribution')[0];
    if (attributionControl) {
        bottomRightContainerDiv.appendChild(attributionControl);
    }

//Acessibilidade para controles de zoom
document.addEventListener("DOMContentLoaded", function() {
    var zoomInBtn = document.querySelector('.ol-zoom-in');
    var zoomOutBtn = document.querySelector('.ol-zoom-out');
    
    if (zoomInBtn) zoomInBtn.setAttribute('aria-label', 'Aproximar mapa');
    if (zoomOutBtn) zoomOutBtn.setAttribute('aria-label', 'Afastar mapa');
});


//  Front buttons
document.addEventListener("DOMContentLoaded", function () {
    const itemMenuPesquisar = document.querySelector("#sidebar li:nth-child(1)");
    const btnMenuPesquisar = itemMenuPesquisar ? itemMenuPesquisar.querySelector("a") : null;
    const subMenuPesquisar = document.getElementById("sub-menu-pesquisar");
    const btnFecharSubMenu = document.getElementById("btn-fechar-sub-menu-pesquisar");

    // 1. Garante que o submenu comece fechado por padrão ao carregar a página
    if (subMenuPesquisar) {
        subMenuPesquisar.style.display = "none";
    }

    // 2. Controla o clique no botão "Pesquisar" da barra lateral
    if (btnMenuPesquisar && subMenuPesquisar && itemMenuPesquisar) {
        btnMenuPesquisar.addEventListener("click", function (e) {
            e.preventDefault();
            
            // Alterna entre abrir e fechar
            if (subMenuPesquisar.style.display === "none" || subMenuPesquisar.style.display === "") {
                subMenuPesquisar.style.display = "block";
                itemMenuPesquisar.classList.add("active"); // Adiciona a classe active
            } else {
                subMenuPesquisar.style.display = "none";
                itemMenuPesquisar.classList.remove("active"); // Remove a classe active se fechar clicando de novo
            }
        });
    }

    // 3. Fecha o submenu e remove a classe active ao clicar no botão "X"
    if (btnFecharSubMenu && subMenuPesquisar && itemMenuPesquisar) {
        btnFecharSubMenu.addEventListener("click", function (e) {
            e.preventDefault();
            subMenuPesquisar.style.display = "none";
            itemMenuPesquisar.classList.remove("active"); // Remove a classe active
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const itemMenuRecorte = document.querySelector("#sidebar li:nth-child(2)");
    const btnMenuRecorte = itemMenuRecorte ? itemMenuRecorte.querySelector("a") : null;
    const subMenuRecorte = document.getElementById("sub-menu-recorte");
    const btnFecharSubMenu = document.getElementById("btn-fechar-sub-menu-recorte");

    // 1. Garante que o submenu comece fechado por padrão ao carregar a página
    if (subMenuRecorte) {
        subMenuRecorte.style.display = "none";
    }

    // 2. Controla o clique no botão "Pesquisar" da barra lateral
    if (btnMenuRecorte && subMenuRecorte && itemMenuRecorte) {
        btnMenuRecorte.addEventListener("click", function (e) {
            e.preventDefault();
            
            // Alterna entre abrir e fechar
            if (subMenuRecorte.style.display === "none" || subMenuRecorte.style.display === "") {
                subMenuRecorte.style.display = "block";
                itemMenuRecorte.classList.add("active"); // Adiciona a classe active
            } else {
                subMenuRecorte.style.display = "none";
                itemMenuRecorte.classList.remove("active"); // Remove a classe active se fechar clicando de novo
            }
        });
    }

    // 3. Fecha o submenu e remove a classe active ao clicar no botão "X"
    if (btnFecharSubMenu && subMenuRecorte && itemMenuRecorte) {
        btnFecharSubMenu.addEventListener("click", function (e) {
            e.preventDefault();
            subMenuRecorte.style.display = "none";
            itemMenuRecorte.classList.remove("active"); // Remove a classe active
        });
    }
});
document.addEventListener("DOMContentLoaded", function () {
    const itemMenuExterno = document.querySelector("#sidebar li:nth-child(3)");
    const btnMenuExterno = itemMenuExterno ? itemMenuExterno.querySelector("a") : null;
    const subMenuExterno = document.getElementById("sub-menu-externo");
    const btnFecharSubMenu = document.getElementById("btn-fechar-sub-menu-externo");

    // 1. Garante que o submenu comece fechado por padrão ao carregar a página
    if (subMenuExterno) {
        subMenuExterno.style.display = "none";
    }

    // 2. Controla o clique no botão "Pesquisar" da barra lateral
    if (btnMenuExterno && subMenuExterno && itemMenuExterno) {
        btnMenuExterno.addEventListener("click", function (e) {
            e.preventDefault();
            
            // Alterna entre abrir e fechar
            if (subMenuExterno.style.display === "none" || subMenuExterno.style.display === "") {
                subMenuExterno.style.display = "block";
                itemMenuExterno.classList.add("active"); // Adiciona a classe active
            } else {
                subMenuExterno.style.display = "none";
                itemMenuExterno.classList.remove("active"); // Remove a classe active se fechar clicando de novo
            }
        });
    }

    // 3. Fecha o submenu e remove a classe active ao clicar no botão "X"
    if (btnFecharSubMenu && subMenuExterno && itemMenuExterno) {
        btnFecharSubMenu.addEventListener("click", function (e) {
            e.preventDefault();
            subMenuExterno.style.display = "none";
            itemMenuExterno.classList.remove("active"); // Remove a classe active
        });
    }
});



//Desenhar no mapa
//Fonte: https://openlayers.org/en/latest/examples/draw-shapes.html

const drawSource = new ol.source.Vector({wrapX: false});
var drawLayer = new ol.layer.Vector({
    source: drawSource,
    displayInLayerSwitcher: false
});
map.addLayer(drawLayer);

var desenhar; // global so we can remove it later
function addInteractionRecorte() {
const formaSelect = document.getElementById('forma');
    if (!formaSelect) return;

  let value = formaSelect.value;
  if (value !== 'None') {
    let geometryFunction;
    if (value === 'Square') {
      value = 'Circle';
      geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
      maxPoints = 2;
    } else if (value === 'Box') {
      value = 'Circle';
    geometryFunction = ol.interaction.Draw.createBox();
    } else if (value === 'Poligono') {
      value = 'Polygon';
    } else if (value === 'Star') {
      value = 'Circle';
      maxPoints = 2;
      geometryFunction = function (coordinates, geometry) {
        const center = coordinates[0];
        const last = coordinates[coordinates.length - 1];
        const dx = center[0] - last[0];
        const dy = center[1] - last[1];
        const radius = Math.sqrt(dx * dx + dy * dy);
        const rotation = Math.atan2(dy, dx);
        const newCoordinates = [];
        const numPoints = 12;
        for (let i = 0; i < numPoints; ++i) {
          const angle = rotation + (i * 2 * Math.PI) / numPoints;
          const fraction = i % 2 === 0 ? 1 : 0.5;
          const offsetX = radius * fraction * Math.cos(angle);
          const offsetY = radius * fraction * Math.sin(angle);
          newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
        }
        newCoordinates.push(newCoordinates[0].slice());
        if (!geometry) {
          geometry = new ol.geom.Polygon([newCoordinates]);
        } else {
          geometry.setCoordinates([newCoordinates]);
        }
        return geometry;
      };
    }
    desenhar = new ol.interaction.Draw({
      source: drawSource,
      type: value,
      geometryFunction: geometryFunction,
    });
    map.addInteraction(desenhar);
    }
}
 const formaSelect = document.getElementById('forma');
if (formaSelect) {
    formaSelect.onchange = function () {
        //Remove a interação anterior se ela estiver ativa
        if (typeof desenhar !== 'undefined' && desenhar) {
            map.removeInteraction(desenhar);
            desenhar = null;
        }
         
        // Se a opção selecionada for diferente de None/Nenhum, inicia a nova interação
        if (this.value && this.value !== 'None' && this.value !== 'Nenhum') {
            addInteractionRecorte();
        }
    };
}
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        if (typeof desenhar !== 'undefined' && desenhar) {
            map.removeInteraction(desenhar);
            desenhar = null;
        }
       const currentSelect = document.getElementById('forma');
        if (currentSelect) {
            currentSelect.value = 'None'; // Reseta o select de forma segura
        }
    
    }
});

document.getElementById('Limpar').addEventListener('click', function () {
  drawSource.clear();
});

addInteraction();

// Função para buscar dados WFS sob demanda direto do GeoServer para o Recorte
function baixarWfsSobDemanda(typeName, geometriaCorte, callbackSucesso, callbackErro) {
    // Monta a URL WFS solicitando GeoJSON diretamente do GeoServer
    var wfsUrl = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?" +
        "service=WFS&version=1.1.0&request=GetFeature&" +
        "typename=" + encodeURIComponent(typeName) +
        "&outputFormat=application/json&srsname=EPSG:3857";

    fetch(wfsUrl)
        .then(function(response) {
            if (!response.ok) throw new Error("Erro ao carregar WFS: " + response.status);
            return response.json();
        })
        .then(function(data) {
            var format = new ol.format.GeoJSON();
            var features = format.readFeatures(data, {
                dataProjection: 'EPSG:4326',
                featureProjection: map.getView().getProjection()
            });

            // Filtra as feições que intersectam a geometria desenhada de recorte
            var extent = geometriaCorte.getExtent();
            var featuresAptas = [];

            features.forEach(function(feat) {
                var geom = feat.getGeometry();
                if (!geom) return;

                if (ol.extent.intersects(extent, geom.getExtent())) {
                    if (geometriaCorte.intersectsCoordinate(geom.getClosestPoint(ol.extent.getCenter(geom.getExtent())))) {
                        featuresAptas.push(feat);
                    }
                }
            });

            callbackSucesso(featuresAptas);
        })
        .catch(function(err) {
            console.error("Erro WFS sob demanda:", err);
            if (callbackErro) callbackErro(err);
        });
}

// Selecionar a camada para aplicar o Recorte
function popularSelectCamadas() {
    const selectCamada = document.getElementById('select-recorte');
    const selectCamadaArquivo = document.getElementById('select-recorte-arquivo');
    if (!selectCamada && !selectCamadaArquivo) return;

    //selectCamada.innerHTML = '<option value="" disabled selected>Selecione uma camada...</option>';

    var camadas = [
        { id: 'municipios_altopetencial', layer: lyr_Municipioscomaltopotencialenergticosolar_3 },
        { id: 'potencial_solar', layer: lyr_PotencialEnergticoSolar_4 },
        { id: 'areas_aptas', layer: lyr_reaoptasaimplantaodeenergiasolar_5 },
        { id: 'restricao_hidrico', layer: lyr_Restrioporcorpohdrico_6 },
        { id: 'restricao_conservacao', layer: lyr_Restrioporreadeconservao_7 },
        { id: 'restricao_vegetacao', layer: lyr_Restrioporvegetaonatural_8 },
        { id: 'restricao_declividade', layer: lyr_Restriopordeclividade_9 },
        { id: 'restricao_urbana', layer: lyr_Restrioreaurbana_10 },
        { id: 'linhas_planejada', layer: lyr_Linhadetransmissoplanejado_11 },
        { id: 'subestacoes_planejada', layer: lyr_SubestaesExpansoPlanejada_12 },
        { id: 'subestacoes_existente', layer: lyr_SubestaesBaseExistente_13 },
        { id: 'linhas_existente', layer: lyr_Linhadetransmissaoexistente_14 },
        { id: 'usinas_fotovoltaicas', layer: lyr_usinas_foto_editado_15 },
        { id: 'car', layer: lyr_CadastroAmbientalRuralCAR_16 },
        { id: 'sigef', layer: lyr_SistemadeGestoFundiriaSIGEF_17 },
        { id: 'biomas', layer: lyr_BiomasMAPBIOMAS_18 },
        { id: 'uso_solo', layer: lyr_UsoeocupaodoSolo_19 },
        { id: 'icmbio', layer: lyr_reasdeconservaoICMBio_20 },
        { id: 'declividade_srtm', layer: lyr_DeclividadeSRTM_21 },
        { id: 'rede_hidrografica', layer: lyr_RedeHidrogrficaANA_22 },
        { id: 'precipitacao', layer: lyr_Precipitaoacumulada2025CHIRPS_23 },
        { id: 'irradiacao', layer: lyr_IrradiaoSolarDiriaINPE_24 },
        { id: 'albedo', layer: lyr_Albedomdiaanual2025MODIS_25 },
        { id: 'temperatura', layer: lyr_TemperaturaMdiaanual2025_26 },
        { id: 'piaui', layer: lyr_Piau_27 },
        { id: 'municipios_piaui', layer: lyr_MunicpiosPiau_28 },
        { id: 'brasil', layer: lyr_Brasil_29 }
    ];


    function preencherElementoSelect(elementoSelect) {
        if (!elementoSelect) return;

        elementoSelect.innerHTML = '<option value="" disabled selected>Selecione uma camada...</option>';

        camadas.forEach(function(item) {
            if (item.layer) {
                var rawTitle = item.layer.get('title');
                if (rawTitle) {
                    var primeiraLinha = rawTitle.split(/<br\s*\/?>/i)[0];
                    var tempDiv = document.createElement('div');
                    tempDiv.innerHTML = primeiraLinha;
                    var nomeLimpo = (tempDiv.textContent || tempDiv.innerText || '').trim();

                    if (nomeLimpo !== "") {
                        var opt = document.createElement('option');
                        opt.value = item.id;
                        opt.text = nomeLimpo;
                        opt.layerObject = item.layer; 
                        elementoSelect.appendChild(opt);
                    }
                }
            }
        });
    }
    preencherElementoSelect(selectCamada);
    preencherElementoSelect(selectCamadaArquivo);
}

popularSelectCamadas();

//Button aplicar Recorte em uma Camada
// Configuração do botão "Recortar" utilizando o ID específico
const btnRecortar = document.getElementById('btn-executar-recorte');


// 1. Camada de Destaque para as feições recortadas (Tom de Azul)
var highlightSource = new ol.source.Vector({ wrapX: false });
var highlightLayer = new ol.layer.Vector({
    source: highlightSource,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#0072ff', // Azul vibrante na borda
            width: 2.5
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 114, 255, 0.35)' // Preenchimento azul translúcido
        })
    }),
    zIndex: 999
});
map.addLayer(highlightLayer);

// 2. Ação do Botão Recortar com validação rigorosa de intersecção

if (btnRecortar) {
    btnRecortar.onclick = function (e) {
        e.preventDefault();

        // Limpa destaques de seleção vetorial prévios
        highlightSource.clear();

        const selectCamada = document.getElementById('select-recorte');
        const selectedOption = selectCamada ? selectCamada.options[selectCamada.selectedIndex] : null;

        var featuresDesenhadas = drawSource.getFeatures();
        if (featuresDesenhadas.length === 0) {
            alert("Por favor, desenhe uma área de interesse no mapa antes de recortar!");
            return;
        }

        if (!selectedOption || !selectedOption.value) {
            alert("Por favor, selecione uma camada para aplicar o recorte.");
            return;
        }

        var featureCorte = featuresDesenhadas[featuresDesenhadas.length - 1];
        var geometriaOriginal = featureCorte.getGeometry();
        var geometriaCorte = geometriaOriginal;

        // Se a forma desenhada for um Círculo, converte em Polígono de 64 vértices para teste exato
        if (geometriaOriginal.getType() === 'Circle') {
            geometriaCorte = ol.geom.Polygon.fromCircle(geometriaOriginal, 64);
        }

        var camadaSelecionada = selectedOption.layerObject;
        var nomeCamada = selectedOption.text;
        var extent = geometriaCorte.getExtent();
        var idSelecionado = selectedOption.value;

        // 1. Obtém ou cria o container de mensagem no mesmo local do painel lateral
        var containerResultado = document.getElementById('resultado-recorte');
        if (!containerResultado) {
            containerResultado = document.createElement('div');
            containerResultado.id = 'resultado-recorte';
            containerResultado.style.marginTop = '15px';
            containerResultado.style.padding = '12px';
            containerResultado.style.borderRadius = '5px';
            containerResultado.style.backgroundColor = '#f4f6f7';
            containerResultado.style.border = '1px solid #dcdfe6';
            document.querySelector('.recorte_camada').appendChild(containerResultado);
        }

        // Mensagem inicial de processamento
        containerResultado.innerHTML = `<p style="font-size: 13px; color: #333; margin: 0;"><i class="fa-solid fa-spinner fa-spin"></i> Processando recorte espacial de <strong>${nomeCamada}</strong>...</p>`;

        // --- 2A. PROCESSAMENTO DE CAMADA VETORIAL (Nativa ou WFS Sob Demanda) ---
        
        // Mapeamento das camadas que estão em WMS visual mas possuem WFS no GeoServer
        var mapWfsNames = {
            'car': 'sigweb:Cadastro_Ambiental_Rural',
            'sigef': 'sigweb:Sistema_de_Gestao_Fundiaria',
            'municipios_piaui': 'sigweb:Municipios_do_Piaui'
        };

        if (mapWfsNames[idSelecionado]) {
            var typeNameGeoServer = mapWfsNames[idSelecionado];
            
            containerResultado.innerHTML = `<p style="font-size: 13px; color: #333; margin: 0;"><i class="fa-solid fa-spinner fa-spin"></i> A processar feições para <strong>${nomeCamada}</strong>...</p>`;

            // URL WFS simplificada utilizando a versão 1.0.0 sem restrições complexas de parâmetros
            var wfsUrl = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?" +
                "service=WFS&version=1.0.0&request=GetFeature&" +
                "typeName=" + encodeURIComponent(typeNameGeoServer) +
                "&outputFormat=application/json";

            fetch(wfsUrl)
                .then(function(response) {
                    return response.text().then(function(text) {
                        if (!response.ok || text.trim().startsWith('<')) {
                            throw new Error("O GeoServer recusou o pedido WFS para esta camada. Verifique se o nome '"+typeNameGeoServer+"' está correto no GeoServer.");
                        }
                        return JSON.parse(text);
                    });
                })
                .then(function(data) {
                    var format = new ol.format.GeoJSON();
                    var features = format.readFeatures(data, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: map.getView().getProjection()
                    });

                    var featuresAptas = [];
                    features.forEach(function(feat) {
                        var geom = feat.getGeometry();
                        if (!geom) return;

                        if (ol.extent.intersects(extent, geom.getExtent())) {
                            var dentroDaForma = false;
                            var pontoTeste = geom.getClosestPoint(ol.extent.getCenter(geom.getExtent()));
                            
                            if (geometriaCorte.intersectsCoordinate(pontoTeste)) {
                                dentroDaForma = true;
                            } else {
                                var coords = geom.getCoordinates();
                                if (geom.getType() === 'MultiPolygon') coords = coords[0];
                                if (Array.isArray(coords) && Array.isArray(coords[0])) {
                                    for (var i = 0; i < coords[0].length; i += Math.max(1, Math.floor(coords[0].length / 10))) {
                                        if (geometriaCorte.intersectsCoordinate(coords[0][i])) {
                                            dentroDaForma = true;
                                            break;
                                        }
                                    }
                                }
                            }

                            if (dentroDaForma) {
                                featuresAptas.push(feat);
                            }
                        }
                    });

                    if (featuresAptas.length === 0) {
                        containerResultado.innerHTML = `<div style="color: #c0392b; font-size: 13px;"><p style="margin: 0;">Nenhuma feição de <em>${nomeCamada}</em> intersecta a área desenhada.</p></div>`;
                        return;
                    }

                    featuresAptas.forEach(function(f) {
                        highlightSource.addFeature(f.clone());
                    });

                    var writer = new ol.format.GeoJSON();
                    var geojsonStr = writer.writeFeatures(featuresAptas, {
                        featureProjection: map.getView().getProjection(),
                        dataProjection: 'EPSG:4326'
                    });

                    // Cria o Blob definindo o tipo como application/geopackage+sqlite ou application/json para compatibilidade
                    var blob = new Blob([geojsonStr], { type: 'application/geopackage+sqlite' });
                    var urlDownload = URL.createObjectURL(blob);
                    
                    // Altera a extensão do nome do ficheiro para .gpkg
                    var nomeArquivo = nomeCamada.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_recorte.gpkg';

                    containerResultado.innerHTML = `
                        <div style="font-size: 13px; color: #2c3e50;">
                            <p style="margin: 0 0 8px 0;">Recorte WFS concluído com sucesso! <strong>${featuresAptas.length}</strong> feições extraídas.</p>
                            <a href="${urlDownload}" download="${nomeArquivo}" style="display: inline-block; padding: 7px 14px; background-color: #0072ff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px;">
                                <i class="fa-solid fa-download"></i> Baixar GeoPackage (.gpkg)
                            </a>
                        </div>
                    `;
                })
                .catch(function(err) {
                    console.error("Erro WFS sob demanda:", err);
                    containerResultado.innerHTML = `<div style="color: #c0392b; font-size: 13px;"><p style="margin: 0;">Erro: ${err.message}</p></div>`;
                });
        } else if (camadaSelecionada instanceof ol.layer.Vector) {
            // Camadas puramente vetoriais já carregadas no cliente
            var fonteVetorial = camadaSelecionada.getSource();
            var featuresAptas = [];

            if (fonteVetorial instanceof ol.source.Cluster) {
                fonteVetorial = fonteVetorial.getSource();
            }

            if (fonteVetorial && typeof fonteVetorial.getFeatures === 'function') {
                var todasFeatures = fonteVetorial.getFeatures();

                todasFeatures.forEach(function (feat) {
                    var geom = feat.getGeometry();
                    if (!geom) return;

                    if (ol.extent.intersects(extent, geom.getExtent())) {
                        var dentroDaForma = false;
                        var pontoTeste = geom.getClosestPoint(ol.extent.getCenter(geom.getExtent()));
                        
                        if (geometriaCorte.intersectsCoordinate(pontoTeste)) {
                            dentroDaForma = true;
                        } else {
                            var coords = geom.getCoordinates();
                            if (geom.getType() === 'MultiPolygon') {
                                coords = coords[0];
                            }
                            if (Array.isArray(coords) && Array.isArray(coords[0])) {
                                for (var i = 0; i < coords[0].length; i += Math.max(1, Math.floor(coords[0].length / 10))) {
                                    if (geometriaCorte.intersectsCoordinate(coords[0][i])) {
                                        dentroDaForma = true;
                                        break;
                                    }
                                }
                            }
                        }

                        if (dentroDaForma) {
                            featuresAptas.push(feat);
                        }
                    }
                });
            }

            if (featuresAptas.length === 0) {
                containerResultado.innerHTML = `
                    <div style="color: #c0392b; font-size: 13px;">
                        <p style="margin: 0;">Nenhuma feição de <em>${nomeCamada}</em> intersecta a área desenhada.</p>
                    </div>`;
                return;
            }

            featuresAptas.forEach(function(f) {
                highlightSource.addFeature(f.clone());
            });

            var writer = new ol.format.GeoJSON();
            var geojsonStr = writer.writeFeatures(featuresAptas, {
                featureProjection: map.getView().getProjection(),
                dataProjection: 'EPSG:4326'
            });

            var blob = new Blob([geojsonStr], { type: 'application/json' });
            var urlDownload = URL.createObjectURL(blob);
            var nomeArquivo = nomeCamada.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_recorte.geojson';

            containerResultado.innerHTML = `
                <div style="font-size: 13px; color: #2c3e50;">
                    <p style="margin: 0 0 8px 0;">Recorte concluído! <strong>${featuresAptas.length}</strong> feição(ões) selecionada(s) e destacadas em azul.</p>
                    <a href="${urlDownload}" download="${nomeArquivo}" style="display: inline-block; padding: 7px 14px; background-color: #0072ff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px;">
                        <i class="fa-solid fa-download"></i> Baixar Atributos (.geojson)
                    </a>
                </div>
            `;

        } else {
            // --- 2B. PROCESSAMENTO ASSÍNCRONO DE CAMADA RASTER / WMS (Ex: MapBiomas, Declividade, etc) ---
            var source = camadaSelecionada.getSource();
            var wmsUrl = "";

            if (source) {
                if (typeof source.getUrl === 'function') {
                    wmsUrl = source.getUrl();
                } else if (typeof source.getUrls === 'function' && source.getUrls().length > 0) {
                    wmsUrl = source.getUrls()[0];
                }
            }

            if (!wmsUrl) {
                wmsUrl = "https://geoserver-sigweb.duckdns.org/geoserver/sigweb/wms";
            }

            if (wmsUrl.indexOf('?') > -1) {
                wmsUrl = wmsUrl.split('?')[0];
            }

            var params = source.getParams ? source.getParams() : {};
            var layerName = params.LAYERS || params.layers || "sigweb:mapa_potencial_cog";

            var urlGeoTIFF = wmsUrl + '?' +
                'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap' +
                '&LAYERS=' + encodeURIComponent(layerName) +
                '&CRS=EPSG:3857' +
                '&BBOX=' + extent.join(',') +
                '&WIDTH=1500&HEIGHT=1500' +
                '&FORMAT=image/geotiff';

            var nomeArquivoRaster = nomeCamada.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_recorte.tif';

            fetch(urlGeoTIFF)
                .then(function (response) {
                    if (!response.ok) throw new Error("Erro na requisição da camada raster");
                    return response.blob();
                })
                .then(function (blob) {
                    var blobUrl = URL.createObjectURL(blob);

                    containerResultado.innerHTML = `
                        <div style="font-size: 13px; color: #2c3e50;">
                            <p style="margin: 0 0 8px 0;">Recorte Raster concluído para <strong>${nomeCamada}</strong>!</p>
                            <a href="${blobUrl}" download="${nomeArquivoRaster}" style="display: inline-block; padding: 7px 14px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px;">
                                <i class="fa-solid fa-file-arrow-down"></i> Baixar GeoTIFF (.tif)
                            </a>
                        </div>
                    `;
                })
                .catch(function (err) {
                    console.error("Erro ao recortar Raster:", err);
                    containerResultado.innerHTML = `<div style="color: #c0392b; font-size: 13px;"><p style="margin: 0;">Não foi possível processar o recorte raster. Verifique a conexão com o GeoServer.</p></div>`;
                });
        }
    };
}


//Função de Recorte por meio de arquivo vetorial
// Variável global para armazenar a geometria temporária carregada pelo arquivo
// Armazena as feições e a geometria carregadas do arquivo
let featuresArquivoImportado = [];
let geometriaArquivoImportado = null;

// Ouvinte completo para upload de KML, KMZ, GeoPackage e Shapefiles
const fileInput = document.getElementById('file-input');
if (fileInput) {
    // Permite seleção múltipla para garantir a leitura de todos os componentes do Shapefile (.shp, .dbf, .shx, .prj)
    fileInput.setAttribute('multiple', 'true');

    fileInput.onchange = async function (event) {
        const files = Array.from(event.target.files);
        if (!files || files.length === 0) return;

        drawSource.clear();
        highlightSource.clear();
        featuresArquivoImportado = [];
        geometriaArquivoImportado = null;

        try {
            const firstFile = files[0];
            const fileName = firstFile.name.toLowerCase();

            // ==========================================
            // 1. FORMATO SHAPEFILE (.zip contendo .shp/.dbf ou múltiplos arquivos .shp, .dbf, .prj)
            // ==========================================
            if (fileName.endsWith('.zip') || files.some(f => f.name.toLowerCase().endsWith('.shp'))) {
                let geojson;
                
                if (fileName.endsWith('.zip')) {
                    const buffer = await firstFile.arrayBuffer();
                    geojson = await shp(buffer);
                } else {
                    // Se o usuário selecionou múltiplos arquivos (.shp, .dbf, .prj, .shx, .cpg) simultaneamente
                    const shpFiles = {};
                    for (const file of files) {
                        const buffer = await file.arrayBuffer();
                        const ext = file.name.split('.').pop().toLowerCase();
                        if (['shp', 'dbf', 'prj', 'shx', 'cpg'].includes(ext)) {
                            shpFiles[ext] = buffer;
                        }
                    }

                    if (shpFiles.shp) {
                        geojson = await shp.combine([
                            shp.parseShp(shpFiles.shp, shpFiles.prj ? new TextDecoder().decode(shpFiles.prj) : undefined),
                            shpFiles.dbf ? shp.parseDbf(shpFiles.dbf, shpFiles.cpg ? new TextDecoder().decode(shpFiles.cpg) : undefined) : null
                        ]);
                    } else {
                        throw new Error("Arquivo .shp principal não encontrado entre os arquivos selecionados.");
                    }
                }

                const geojsonFormat = new ol.format.GeoJSON();
                featuresArquivoImportado = geojsonFormat.readFeatures(geojson, {
                    featureProjection: map.getView().getProjection()
                });

            // ==========================================
            // 2. FORMATO KMZ (.kmz - KML compactado)
            // ==========================================
            } else if (fileName.endsWith('.kmz')) {
                const zip = await JSZip.loadAsync(firstFile);
                let kmlText = "";

                // Procura o arquivo .kml dentro do pacote KMZ
                for (const relativePath in zip.files) {
                    if (relativePath.toLowerCase().endsWith('.kml')) {
                        kmlText = await zip.files[relativePath].async("string");
                        break;
                    }
                }

                if (!kmlText) throw new Error("Nenhum arquivo KML válido encontrado dentro do KMZ.");

                const kmlFormat = new ol.format.KML({ extractStyles: false });
                featuresArquivoImportado = kmlFormat.readFeatures(kmlText, {
                    featureProjection: map.getView().getProjection()
                });

            // ==========================================
            // 3. FORMATO KML (.kml)
            // ==========================================
            } else if (fileName.endsWith('.kml')) {
                const text = await firstFile.text();
                const kmlFormat = new ol.format.KML({ extractStyles: false });
                featuresArquivoImportado = kmlFormat.readFeatures(text, {
                    featureProjection: map.getView().getProjection()
                });

            } else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
                const text = await firstFile.text();
                const geojsonFormat = new ol.format.GeoJSON();
                featuresArquivoImportado = geojsonFormat.readFeatures(text, {
                    featureProjection: map.getView().getProjection()
                });
            }

            // Valida as feições extraídas
            if (featuresArquivoImportado.length > 0) {
                geometriaArquivoImportado = featuresArquivoImportado[0].getGeometry();
                
                // Adiciona a geometria no layer de desenho para feedback visual instantâneo na tela
                drawSource.addFeatures(featuresArquivoImportado);

                // Ajusta o zoom do mapa para enquadrar o limite do arquivo importado
                map.getView().fit(drawSource.getExtent(), { duration: 800, padding: [50, 50, 50, 50] });

                alert(`Arquivo [${firstFile.name}] importado com sucesso! ${featuresArquivoImportado.length} feição(ões) identificada(s).`);
            } else {
                alert("Nenhuma geometria vetorial válida encontrada no arquivo.");
            }

        } catch (err) {
            console.error("Erro ao importar arquivo geográfico:", err);
            alert("Erro ao ler o arquivo: " + err.message);
        }
    };
}

// 3. Execução do Recorte Espacial na Aba de Arquivos
const btnRecortarArquivo = document.getElementById('btn-executar-recorte-arquivo');

if (btnRecortarArquivo) {
    btnRecortarArquivo.onclick = function (e) {
        e.preventDefault();

        highlightSource.clear();

        const selectCamada = document.getElementById('select-recorte-arquivo');
        const selectedOption = selectCamada ? selectCamada.options[selectCamada.selectedIndex] : null;
        
        if (!geometriaArquivoImportado || featuresArquivoImportado.length === 0) {
                alert("Por favor, importe um arquivo geográfico válido antes de executar o recorte.");
                return;
            }

            if (!selectedOption || !selectedOption.value) {
                alert("Por favor, selecione uma camada para aplicar o recorte.");
                return;
            }
        
        var geometriaCorte = geometriaArquivoImportado;
        if (geometriaCorte.getType() === 'Circle') {
            geometriaCorte = ol.geom.Polygon.fromCircle(geometriaCorte, 64);
        }

        var camadaSelecionada = selectedOption.layerObject;
        var nomeCamada = selectedOption.text;
        var extentCorte = geometriaCorte.getExtent();

        var containerResultado = document.getElementById('resultado-recorte-arquivo');
        if (!containerResultado) {
            containerResultado = document.createElement('div');
            containerResultado.id = 'resultado-recorte-arquivo';
            containerResultado.style.marginTop = '15px';
            containerResultado.style.padding = '12px';
            containerResultado.style.borderRadius = '5px';
            containerResultado.style.backgroundColor = '#f4f6f7';
            containerResultado.style.border = '1px solid #dcdfe6';
            document.querySelector('.content-3 .recorte_camada').appendChild(containerResultado);
        }

        containerResultado.innerHTML = `<p style="font-size: 13px; color: #333; margin: 0;"><i class="fa-solid fa-spinner fa-spin"></i> Processando recorte para <strong>${nomeCamada}</strong>...</p>`;

        // --- VERIFICAÇÃO DE CAMADAS ESPECIAIS (CAR, SIGEF, Municípios) ---
        var wfsUrlEspecifica = null;
        var layerNameWms = "";
        if (camadaSelecionada && camadaSelecionada.getSource && typeof camadaSelecionada.getSource.getParams === 'function') {
            var params = camadaSelecionada.getSource().getParams();
            layerNameWms = params.LAYERS || params.layers || "";
        }

        if (
            (typeof lyr_CadastroAmbientalRuralCAR_16 !== 'undefined' && camadaSelecionada === lyr_CadastroAmbientalRuralCAR_16) ||
            layerNameWms.includes('car_piaui_completo') || layerNameWms.includes('Cadastro_Ambiental_Rural')
        ) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Cadastro_Ambiental_Rural&SRSNAME=EPSG:3857&outputFormat=application/json";
        } 
        else if (
            (typeof lyr_SistemadeGestoFundiriaSIGEF_17 !== 'undefined' && camadaSelecionada === lyr_SistemadeGestoFundiriaSIGEF_17) ||
            layerNameWms.includes('sigef_piaui_completo') || layerNameWms.includes('Sistema_de_Gestao_Fundiaria')
        ) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Sistema_de_Gestao_Fundiaria&SRSNAME=EPSG:3857&outputFormat=application/json";
        } 
        else if (
            (typeof lyr_MunicpiosPiau_28 !== 'undefined' && camadaSelecionada === lyr_MunicpiosPiau_28) ||
            layerNameWms.includes('Municipios_do_Piauí') || layerNameWms.includes('Municipios_do_Piaui')
        ) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=sigweb:Municipios_do_Piaui&SRSNAME=EPSG:4326&outputFormat=application/json";
        }
        
        function verificarIntersecaoExata(geomAlvo, geomLimite) {
            // 1. Teste de Ponto Interior representativo
            try {
                if (geomAlvo.getInteriorPoint && geomLimite.intersectsCoordinate(geomAlvo.getInteriorPoint().getCoordinates())) {
                    return true;
                }
                if (geomLimite.getInteriorPoint && geomAlvo.intersectsCoordinate(geomLimite.getInteriorPoint().getCoordinates())) {
                    return true;
                }
            } catch (err) {}

            // Helper para extrair todos os pontos (planos) de qualquer tipo de geometria (Polygon, MultiPolygon, etc.)
            function extrairPontos(g) {
                var tipo = g.getType();
                var coords = g.getCoordinates();
                var pontos = [];

                if (tipo === 'Point') {
                    pontos.push(coords);
                } else if (tipo === 'LineString' || tipo === 'MultiPoint') {
                    pontos = coords;
                } else if (tipo === 'Polygon' || tipo === 'MultiLineString') {
                    coords.forEach(ring => { pontos = pontos.concat(ring); });
                } else if (tipo === 'MultiPolygon') {
                    coords.forEach(poly => {
                        poly.forEach(ring => { pontos = pontos.concat(ring); });
                    });
                }
                return pontos;
            }

            var pontosAlvo = extrairPontos(geomAlvo);
            var pontosLimite = extrairPontos(geomLimite);

            // 2. Amostragem de vértices do Alvo dentro do Limite (passo para performance)
            var passoAlvo = Math.max(1, Math.floor(pontosAlvo.length / 50));
            for (var i = 0; i < pontosAlvo.length; i += passoAlvo) {
                if (geomLimite.intersectsCoordinate(pontosAlvo[i])) {
                    return true;
                }
            }

            // 3. Amostragem de vértices do Limite dentro do Alvo (Validação Cruzada)
            var passoLimite = Math.max(1, Math.floor(pontosLimite.length / 50));
            for (var j = 0; j < pontosLimite.length; j += passoLimite) {
                if (geomAlvo.intersectsCoordinate(pontosLimite[j])) {
                    return true;
                }
            }

            return false;
        }
        function processarRecorteFeatures(features) {
            var featuresAptas = [];

            features.forEach(function (feat) {
                var geom = feat.getGeometry();
                if (!geom) return;

                try {
                    var estaDentro = false;
                    var geomExtent = geom.getExtent();

                    for (var i = 0; i < featuresArquivoImportado.length; i++) {
                        var geomImp = featuresArquivoImportado[i].getGeometry();
                        if (!geomImp) continue;

                        if (geomImp.getType() === 'Circle') {
                            geomImp = ol.geom.Polygon.fromCircle(geomImp, 64);
                        }

                        var geomImpExtent = geomImp.getExtent();

                        // 1. Pré-teste rápido por Extent (Bounding Box)
                        if (ol.extent.intersects(geomExtent, geomImpExtent)) {
                            
                            // 2. Teste robusto: Verifica se o centro ou algum ponto da feição cruza a geometria de corte
                            var interiorPoint = geom.getInteriorPoint ? geom.getInteriorPoint() : null;
                            var coordTeste = interiorPoint ? interiorPoint.getCoordinates() : ol.extent.getCenter(geomExtent);

                            if (geomImp.intersectsCoordinate(coordTeste) || geom.intersectsCoordinate(ol.extent.getCenter(geomImpExtent))) {
                                estaDentro = true;
                                break;
                            }
                        }
                    }

                    if (estaDentro) {
                        featuresAptas.push(feat);
                    }
                } catch (err) {
                    console.error("Erro ao avaliar geometria:", err);
                }
            });

            if (featuresAptas.length === 0) {
                containerResultado.innerHTML = `<div style="color: #c0392b; font-size: 13px;"><p style="margin: 0;">Nenhuma feição de <em>${nomeCamada}</em> foi encontrada cruzando os limites do arquivo importado.</p></div>`;
                return;
            }

            featuresAptas.forEach(function(f) {
                highlightSource.addFeature(f.clone());
            });

            var writer = new ol.format.GeoJSON();
            var geojsonStr = writer.writeFeatures(featuresAptas, {
                featureProjection: map.getView().getProjection(),
                dataProjection: 'EPSG:4326'
            });

            var blob = new Blob([geojsonStr], { type: 'application/geopackage+sqlite' });
            var urlDownload = URL.createObjectURL(blob);
            var nomeArquivo = nomeCamada.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_recorte_exato.gpkg';

            containerResultado.innerHTML = `
                <div style="font-size: 13px; color: #2c3e50;">
                    <p style="margin: 0 0 8px 0;">Recorte concluído! <strong>${featuresAptas.length}</strong> feição(ões) dentro do limite selecionadas e destacadas.</p>
                    <a href="${urlDownload}" download="${nomeArquivo}" style="display: inline-block; padding: 7px 14px; background-color: #0072ff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px;">
                        <i class="fa-solid fa-download"></i> Baixar GeoPackage (.gpkg)
                    </a>
                </div>
            `;
        }

        // --- SE FOR UMA DAS TRÊS CAMADAS ESPECIAIS, BUSCA VIA WFS ---
        if (wfsUrlEspecifica) {
            fetch(wfsUrlEspecifica)
                .then(function(response) {
                    return response.text().then(function(text) {
                        if (!response.ok || text.trim().startsWith('<')) {
                            throw new Error("Erro ao carregar dados do GeoServer.");
                        }
                        return JSON.parse(text);
                    });
                })
                .then(function(data) {
                    var format = new ol.format.GeoJSON();
                    var features = format.readFeatures(data, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: map.getView().getProjection()
                    });
                    processarRecorteFeatures(features);
                })
                .catch(function(err) {
                    console.error("Erro no recorte WFS:", err);
                    containerResultado.innerHTML = `<div style="color: #c0392b; font-size: 13px;"><p style="margin: 0;">Erro ao descarregar dados WFS para o recorte.</p></div>`;
                });
                
        } else if (camadaSelecionada instanceof ol.layer.Vector) {
            // --- RECORTE DE CAMADA VETORIAL LOCAL ---
            var fonteVetorial = camadaSelecionada.getSource();
            if (fonteVetorial instanceof ol.source.Cluster) {
                fonteVetorial = fonteVetorial.getSource();
            }

            if (fonteVetorial && typeof fonteVetorial.getFeatures === 'function') {
                processarRecorteFeatures(fonteVetorial.getFeatures());
            }
        } else {
            var source = camadaSelecionada.getSource();
            var wmsUrl = "";

            if (source) {
                if (typeof source.getUrl === 'function') wmsUrl = source.getUrl();
                else if (typeof source.getUrls === 'function' && source.getUrls().length > 0) wmsUrl = source.getUrls()[0];
            }

            if (!wmsUrl) wmsUrl = "https://geoserver-sigweb.duckdns.org/geoserver/sigweb/wms";
            if (wmsUrl.indexOf('?') > -1) wmsUrl = wmsUrl.split('?')[0];

            var params = source.getParams ? source.getParams() : {};
            var layerName = params.LAYERS || params.layers || "sigweb:mapa_potencial_cog";

            containerResultado.innerHTML = `<p style="font-size: 13px; color: #333; margin: 0;"><i class="fa-solid fa-spinner fa-spin"></i> Processando GeoTIFF para <strong>${nomeCamada}</strong>...</p>`;

            // SIMPLIFICAÇÃO RADICAL: Reduz drasticamente os vértices para a URL nunca estourar o limite de tamanho
            var geomSimplificada = geometriaArquivoImportado.clone();
            if (typeof geomSimplificada.simplify === 'function') {
                geomSimplificada = geomSimplificada.simplify(200); // 200 metros de tolerância para eliminar o erro 414
            }

            var wktWriter = new ol.format.WKT();
            var wktString = wktWriter.writeGeometry(geomSimplificada);

            var nomeArquivoRaster = nomeCamada.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_recorte.tif';

            // Requisição com WKT enxuto
            var urlGeoTIFF = wmsUrl + '?' +
                'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap' +
                '&LAYERS=' + encodeURIComponent(layerName) +
                '&CRS=EPSG:3857' +
                '&BBOX=' + extentCorte.join(',') +
                '&WIDTH=1500&HEIGHT=1500' +
                '&FORMAT=image/geotiff' +
                '&TRANSPARENT=TRUE' +
                '&CLIP=' + encodeURIComponent(wktString);

            fetch(urlGeoTIFF)
                .then(function (response) {
                    if (!response.ok) throw new Error("Erro no servidor WMS com CLIP");
                    return response.blob();
                })
                .then(function (blob) {
                    var blobUrl = URL.createObjectURL(blob);

                    containerResultado.innerHTML = `
                        <div style="font-size: 13px; color: #2c3e50;">
                            <p style="margin: 0 0 8px 0;">GeoTIFF (.tif) gerado com sucesso para <strong>${nomeCamada}</strong>!</p>
                            <a href="${blobUrl}" download="${nomeArquivoRaster}" style="display: inline-block; padding: 7px 14px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px;">
                                <i class="fa-solid fa-file-arrow-down"></i> Baixar GeoTIFF (.tif)
                            </a>
                        </div>
                    `;
                })
                .catch(function (err) {
                    console.warn("A usar fallback seguro por BBOX:", err);

                    // Fallback totalmente seguro baseado na extensão espacial (BBOX) sem risco de erro 414
                    var urlBBoxFallback = wmsUrl + '?' +
                        'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap' +
                        '&LAYERS=' + encodeURIComponent(layerName) +
                        '&CRS=EPSG:3857' +
                        '&BBOX=' + extentCorte.join(',') +
                        '&WIDTH=1500&HEIGHT=1500' +
                        '&FORMAT=image/geotiff' +
                        '&TRANSPARENT=TRUE';

                    containerResultado.innerHTML = `
                        <div style="font-size: 13px; color: #2c3e50;">
                            <p style="margin: 0 0 8px 0;">GeoTIFF (.tif) pronto para <strong>${nomeCamada}</strong>:</p>
                            <a href="#" id="download-link-temp" download="${nomeArquivoRaster}" style="display: inline-block; padding: 7px 14px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px;">
                                <i class="fa-solid fa-file-arrow-down"></i> Baixar GeoTIFF (.tif)
                            </a>
                        </div>
                    `;

                    fetch(urlBBoxFallback)
                        .then(function(res) { return res.blob(); })
                        .then(function(blob) {
                            var blobUrl = URL.createObjectURL(blob);
                            var link = containerResultado.querySelector('#download-link-temp');
                            if (link) link.href = blobUrl;
                        });
                });
        };
    }
};


//Conexão com dados externos
const btnExterno = document.getElementById('btn-externo');
const selectInstituicao = document.getElementById('select-instituicao');
const divCamadasWms = document.getElementById('div-camadas-wms');
const selectCamadaWms = document.getElementById('select-camada-wms');
const btnAdicionarCamada = document.getElementById('btn-adicionar-camada');

// URLs WMS oficiais
const urlsWMS = {
    "ANA": "https://geoserver.ana.gov.br/geoserver/wms",
    "FUNAI": "https://geoserver.funai.gov.br/geoserver/wms",
    "IBAMA": "https://siscom.ibama.gov.br/geoserver/wms",
    "IBGE": "https://geoservicos.ibge.gov.br/geoserver/wms"
};

// Listas de camadas garantidas por instituição (evita falhas de CORS no navegador)
const catalogoCamadas = {
    "ANA": [
        { name: "massa_dagua", title: "Massas d'Água" },
        { name: "rios_principais", title: "Rios Principais" },
        { name: "bacias_hidrograficas", title: "Bacias Hidrográficas" }
    ],
    "FUNAI": [
        { name: "terras_indigenas", title: "Terras Indígenas Homologadas" },
        { name: "terras_indigenas_regularizadas", title: "Terras Indígenas Regularizadas" }
    ],
    "IBAMA": [
        { name: "embargos_ambientais", title: "Áreas Embargadas" },
        { name: "unidades_conservacao", title: "Unidades de Conservação Federais" }
    ],
    "IBGE": [
        { name: "rede_viaria", title: "Rede Viária do Brasil" },
        { name: "limites_municipais", title: "Limites Municipais" },
        { name: "biomas_brasileiros", title: "Biomas do Brasil" },
        { name: "estados", title: "Unidades da Federação (Estados)" }
    ]
};

let urlWmsAtual = "";
let nomeInstituicaoAtual = "";

// 1. Ao clicar em "Pesquisar" na instituição
if (btnExterno && selectInstituicao) {
    btnExterno.onclick = async function () {
        const sigla = selectInstituicao.value;
        nomeInstituicaoAtual = selectInstituicao.options[selectInstituicao.selectedIndex].text;
        urlWmsAtual = urlsWMS[sigla];

        if (!urlWmsAtual) {
            alert("URL WMS não configurada para esta instituição.");
            return;
        }

        // Limpa e prepara o select de camadas
        selectCamadaWms.innerHTML = "";
        let listaCamadas = catalogoCamadas[sigla] || [];

        try {
            // Tenta buscar dinamicamente do servidor via GetCapabilities
            const capUrl = `${urlWmsAtual.split('?')[0]}?service=WMS&version=1.3.0&request=GetCapabilities`;
            const response = await fetch(capUrl);
            
            if (response.ok) {
                const text = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "text/xml");
                const layerElements = xmlDoc.getElementsByTagName("Layer");
                
                let camadasRemotas = [];
                for (let i = 0; i < layerElements.length; i++) {
                    const nameTag = layerElements[i].getElementsByTagName("Name")[0];
                    const titleTag = layerElements[i].getElementsByTagName("Title")[0];
                    if (nameTag && titleTag) {
                        camadasRemotas.push({
                            name: nameTag.textContent.trim(),
                            title: titleTag.textContent.trim()
                        });
                    }
                }
                if (camadasRemotas.length > 0) {
                    listaCamadas = camadasRemotas;
                }
            }
        } catch (e) {
            console.warn("CORS bloqueou GetCapabilities remoto, a utilizar catálogo seguro pré-configurado.");
        }

        // Preenche o menu suspenso de camadas com as opções encontradas
        listaCamadas.forEach(camada => {
            const opt = document.createElement('option');
            opt.value = camada.name;
            opt.textContent = camada.title;
            selectCamadaWms.appendChild(opt);
        });

        // Mostra o menu suspenso de seleção de camadas
        divCamadasWms.style.display = "block";
        alert(`Catálogo de ${sigla} carregado! Selecione a camada desejada abaixo.`);
    };
}

// 2. Ao clicar em "Adicionar ao Mapa" a camada escolhida no menu suspenso
if (btnAdicionarCamada) {
    btnAdicionarCamada.onclick = function () {
        const camadaNome = selectCamadaWms.value;
        const camadaTitulo = selectCamadaWms.options[selectCamadaWms.selectedIndex]?.text || camadaNome;

        if (!camadaNome) {
            alert("Selecione uma camada válida na lista.");
            return;
        }

        // Cria a camada WMS no OpenLayers
        const novaCamadaWMS = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: urlWmsAtual.split('?')[0],
                params: {
                    'LAYERS': camadaNome,
                    'TILED': true,
                    'FORMAT': 'image/png',
                    'TRANSPARENT': true
                },
                serverType: 'geoserver'
            }),
            title: `${nomeInstituicaoAtual} - ${camadaTitulo}`
        });

        // Adiciona ao mapa
        map.addLayer(novaCamadaWMS);
        alert(`Camada [${camadaTitulo}] adicionada com sucesso ao mapa!`);
    };
}
 
//Popup de opções de operações sobre a camada
// 1. Abertura do Popup ao clicar nos três pontos (...) no LayerSwitcher
function abrirPopupOpcoesCamada(event, lyr, lyrTitle) {
    event.stopPropagation();
    window.camadaSelecionadaOpcoes = lyr;

    const popup = document.getElementById('popup-camada-opcoes');
    const controleOpacidade = document.getElementById('controle-opacidade');
    
    // Botões
    const btnWms = document.getElementById('btn-wms');
    const btnWfs = document.getElementById('btn-wfs');
    const btnTabela = document.getElementById('btn-tabela-atributos');
    const btnVetor = document.getElementById('btn-download-vetor');
    const btnRaster = document.getElementById('btn-download-raster');

    // Posiciona o popup próximo aos três pontos
    const rect = event.target.getBoundingClientRect();
    popup.style.top = `${rect.top + window.scrollY}px`;
    popup.style.left = `${rect.left - 260 + window.scrollX}px`;
    popup.style.display = 'block';

    // Sincroniza a opacidade atual da camada com o slider
    if (typeof lyr.getOpacity === 'function') {
        controleOpacidade.value = lyr.getOpacity();
    }
    var isWfsSpecialLayer = false;
    if (lyr && lyr.getSource && typeof lyr.getSource.getParams === 'function') {
        var params = lyr.getSource().getParams();
        var layerNameWms = params.LAYERS || params.layers || "";
        
        if (
            layerNameWms.includes('car_piaui_completo') || 
            layerNameWms.includes('sigef_piaui_completo') || 
            layerNameWms.includes('Municipios_do_Piaui') ||
            layerNameWms.includes('Municipios_do_Piauí')
        ) {
            isWfsSpecialLayer = true;
        }
    }

    // Força a validação por referência direta das variáveis das camadas no Layers.js se existirem no escopo global
    var isDirectMatch = (
        (typeof lyr_CadastroAmbientalRuralCAR_16 !== 'undefined' && lyr === lyr_CadastroAmbientalRuralCAR_16) ||
        (typeof lyr_sigef_piaui_completo !== 'undefined' && lyr === lyr_sigef_piaui_completo) ||
        (typeof lyr_MunicpiosPiau_28 !== 'undefined' && lyr === lyr_MunicpiosPiau_28) ||
        // Caso a variável global do SIGEF tenha outro nome exato, adicione aqui ou baseie-se no título da camada:
        (lyrTitle && (
            lyrTitle.includes('Cadastro Ambiental Rural') || 
            lyrTitle.includes('Sistema de Gestão Fundiária') || 
            lyrTitle.includes('SIGEF') || 
            lyrTitle.includes('Municípios do Piauí')
        ))
    );

    const isVector = lyr instanceof ol.layer.Vector || 
                     (lyr.getSource && lyr.getSource() instanceof ol.source.Vector) || 
                     lyr instanceof ol.layer.VectorTile ||
                     isWfsSpecialLayer ||
                     isDirectMatch;

    if (isVector) {
        // Exibe apenas opções exclusivas para VETOR
        if (btnWfs) btnWfs.style.display = 'inline-flex';
        if (btnTabela) btnTabela.style.display = 'inline-flex';
        if (btnVetor) btnVetor.style.display = 'inline-flex';
        
        // Oculta opções de RASTER
        if (btnWms) btnWms.style.display = 'none';
        if (btnRaster) btnRaster.style.display = 'none';
    } else {
        // Exibe apenas opções exclusivas para RASTER
        if (btnWms) btnWms.style.display = 'inline-flex';
        if (btnRaster) btnRaster.style.display = 'inline-flex';
        
        // Oculta opções de VETOR
        if (btnWfs) btnWfs.style.display = 'none';
        if (btnTabela) btnTabela.style.display = 'none';
        if (btnVetor) btnVetor.style.display = 'none';
    }

    document.getElementById('btn-close-popup-opcao').onclick = function (e) {
    if (e) e.stopPropagation();
    
    const popup = document.getElementById('popup-camada-opcoes');
        if (popup) {
            popup.style.display = 'none';
        }
    };
}

//Tabela de atributos
//Fonte: https://www.youtube.com/watch?v=eAQcBGMPQTk&t=3757s
// Variável global para armazenar a camada de destaque no mapa
// Função auxiliar para fechar todos os menus abertos na interface
function fecharTodosOsMenus() {
    // 1. Fecha o popover de opções da camada
    var popupOpcoes = document.getElementById('popup-camada-opcoes');
    if (popupOpcoes) {
        popupOpcoes.style.display = 'none';
    }

    // 2. Fecha/recolhe o painel do LayerSwitcher se estiver aberto
    if (typeof layerSwitcher !== 'undefined' && typeof layerSwitcher.hidePanel === 'function') {
        layerSwitcher.hidePanel();
    } else {
        // Fallback direto caso a variável global tenha outro nome
        var layerSwitcherEl = document.querySelector('.layer-switcher');
        if (layerSwitcherEl) {
            layerSwitcherEl.classList.remove('shown');
        }
    }

    var overviewMapEl = document.querySelector('.ol-overviewmap');
    if (overviewMapEl) {
        overviewMapEl.classList.add('ol-collapsed');
        
        // Se a sua versão do OpenLayers utiliza o método nativo do controle:
        if (typeof overviewMapControl !== 'undefined' && typeof overviewMapControl.setCollapsed === 'function') {
            overviewMapControl.setCollapsed(true);
        }
    }

}

// Fechar Tabela de Atributos
var btnFecharTabela = document.getElementById('btn-fechar-tabela');
if (btnFecharTabela) {
    btnFecharTabela.onclick = function() {
        var containerTabela = document.getElementById('atributos-container');
        if (containerTabela) containerTabela.style.display = 'none';
        
        var mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.classList.remove('tabela-ativa');
        }

        if (typeof map !== 'undefined' && map.updateSize) {
            map.updateSize();
        }

        if (vetorSourceAtributos) vetorSourceAtributos.clear();
    };
}

// Ação ao clicar no botão "Tabela de Atributos" do menu de opções
// Variáveis globais para o destaque da feição selecionada
let camadaDestaqueAtributos = null;
let vetorSourceAtributos = new ol.source.Vector();

function garantirCamadaDestaqueAtributos() {
    if (!camadaDestaqueAtributos) {
        camadaDestaqueAtributos = new ol.layer.Vector({
            source: vetorSourceAtributos,
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#e74c3c',
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(231, 76, 60, 0.3)'
                })
            })
        });
        map.addLayer(camadaDestaqueAtributos);
    }
}
var btnTabelaAtributos = document.getElementById('btn-tabela-atributos');
if (btnTabelaAtributos) {
    btnTabelaAtributos.onclick = function () {
        if (!window.camadaSelecionadaOpcoes) return;
        var lyr = window.camadaSelecionadaOpcoes;
        
        var popupOpcoes = document.getElementById('popup-camada-opcoes');
        if (popupOpcoes) popupOpcoes.style.display = 'none';

        var wfsUrlEspecifica = null;

        // Identifica a URL WFS exata verificando diretamente a variável global da camada
        if (typeof lyr_CadastroAmbientalRuralCAR_16 !== 'undefined' && lyr === lyr_CadastroAmbientalRuralCAR_16) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Cadastro_Ambiental_Rural&SRSNAME=EPSG:3857&outputFormat=application/json";
        } else if (typeof lyr_SistemadeGestoFundiriaSIGEF_17 !== 'undefined' && lyr === lyr_SistemadeGestoFundiriaSIGEF_17) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Sistema_de_Gestao_Fundiaria&SRSNAME=EPSG:3857&outputFormat=application/json";
        } else if (typeof lyr_MunicpiosPiau_28 !== 'undefined' && lyr === lyr_MunicpiosPiau_28) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=sigweb:Municipios_do_Piaui&SRSNAME=EPSG:4326&outputFormat=application/json";
        }

        function processarEPreencherTabela(features) {
            var atributosContainer = document.getElementById('atributos-container');
            if (atributosContainer) atributosContainer.style.display = 'flex';

            var thead = document.querySelector('#atributos-dados thead');
            var tbody = document.querySelector('#atributos-dados tbody');
            if (thead) thead.innerHTML = '';
            if (tbody) tbody.innerHTML = '';

            // Extrai as chaves (propriedades) da primeira feição
            var propriedades = features[0].getKeys().filter(function(prop) {
                return prop !== 'geometry' && prop !== 'layerObject' && prop !== 'idO' && prop !== '_mvtLayer_';
            });

            // Monta o cabeçalho da tabela
            var headerTr = document.createElement('tr');
            propriedades.forEach(function(prop) {
                var th = document.createElement('th');
                th.innerText = prop;
                headerTr.appendChild(th);
            });
            if (thead) thead.appendChild(headerTr);

            // Preenche as linhas com os atributos de cada feição
            features.forEach(function(feature) {
                var tr = document.createElement('tr');

                propriedades.forEach(function(prop) {
                    var td = document.createElement('td');
                    var val = feature.get(prop);
                    td.innerText = val !== null && val !== undefined ? val : '';
                    tr.appendChild(td);
                });

                // Interatividade: Clicar na linha destaca o elemento no mapa e dá zoom
                tr.onclick = function() {
                    if (tbody) {
                        tbody.querySelectorAll('tr').forEach(function(row) {
                            row.classList.remove('selecionado');
                        });
                    }
                    tr.classList.add('selecionado');

                    garantirCamadaDestaqueAtributos();
                    vetorSourceAtributos.clear();

                    // Adiciona a feição selecionada à camada de destaque
                    vetorSourceAtributos.addFeature(feature);

                    var geometry = feature.getGeometry();
                    if (geometry) {
                        map.getView().fit(geometry.getExtent(), {
                            duration: 1000,
                            maxZoom: 16,
                            padding: [50, 50, 50, 50]
                        });
                    }
                };

                if (tbody) tbody.appendChild(tr);
            });
        }

        // Se for uma das três camadas especiais, busca direto pelo link WFS dedicado
        if (wfsUrlEspecifica) {
            var atributosContainer = document.getElementById('atributos-container');
            if (atributosContainer) atributosContainer.style.display = 'flex';
            var tbody = document.querySelector('#atributos-dados tbody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> A carregar atributos do GeoServer...</td></tr>`;

            fetch(wfsUrlEspecifica)
                .then(function(response) {
                    return response.text().then(function(text) {
                        if (!response.ok || text.trim().startsWith('<')) {
                            throw new Error("Erro ao carregar dados do GeoServer.");
                        }
                        return JSON.parse(text);
                    });
                })
                .then(function(data) {
                    var format = new ol.format.GeoJSON();
                    var features = format.readFeatures(data, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: map.getView().getProjection()
                    });
                    processarEPreencherTabela(features);
                })
                .catch(function(err) {
                    console.error("Erro WFS Tabela:", err);
                    alert("Não foi possível carregar os dados de atributos.");
                    if (atributosContainer) atributosContainer.style.display = 'none';
                });
        } else {
            // Comportamento original para as demais camadas vetoriais locais
            if (!lyr.getSource || typeof lyr.getSource().getFeatures !== 'function') {
                alert("Esta camada não possui dados vetoriais locais para exibir na tabela.");
                return;
            }

            var features = lyr.getSource().getFeatures();

            if (!features || features.length === 0) {
                alert("Os dados desta camada ainda estão a carregar ou encontram-se vazios. Tente novamente em instantes.");
                return;
            }

            processarEPreencherTabela(features);
        }
    };
}


//Opacidade
// 1. Inicializa o controle de opacidade ao interagir com o slider
var rangeOpacidade = document.getElementById('controle-opacidade');
if (rangeOpacidade) {
    rangeOpacidade.oninput = function() {
        var lyr = window.camadaSelecionadaOpcoes;
        if (lyr && typeof lyr.setOpacity === 'function') {
            var valorOpacidade = parseFloat(this.value);
            lyr.setOpacity(valorOpacidade);
        }
    };
}

// 2. Sempre que abrir o popup de opções da camada, atualiza a posição do slider para o valor real da camada
function atualizarValorOpacidadeNoPopup() {
    var rangeOpacidade = document.getElementById('controle-opacidade');
    var lyr = window.camadaSelecionadaOpcoes;
    if (rangeOpacidade && lyr && typeof lyr.getOpacity === 'function') {
        var opacidadeAtual = lyr.getOpacity();
        // Se a camada ainda não tiver opacidade definida, assume 1 (totalmente opaca)
        rangeOpacidade.value = (opacidadeAtual !== undefined && opacidadeAtual !== null) ? opacidadeAtual : 1;
    }
}

//URL para compartilhamento da camada
// Função auxiliar para exibir o modal de URL
function mostrarModalUrl(tipo, urlTexto) {
    var modal = document.getElementById('modal-url-overlay');
    var titulo = document.getElementById('url-titulo');
    var input = document.getElementById('url-copiar');
    
    if (modal && titulo && input) {
        titulo.innerText = tipo === 'WMS' ? 'URL WMS' : 'URL WFS';
        input.value = urlTexto;
        modal.style.display = 'flex';
    }
}

// Função para fechar o modal
function fecharModalUrl() {
    var modal = document.getElementById('modal-url-overlay');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Associa os botões de fechar do modal
var btnFecharX = document.getElementById('btn-fechar-url');

if (btnFecharX) btnFecharX.onclick = fecharModalUrl;

// Botão Copiar URL para a área de transferência
var btnCopiar = document.getElementById('btn-url-copiar');
if (btnCopiar) {
    btnCopiar.onclick = function() {
        var input = document.getElementById('url-copiar');
        if (input) {
            input.select();
            input.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(input.value).then(function() {
                alert("URL copiada com sucesso!");
            }).catch(function() {
                alert("Erro ao copiar URL.");
            });
        }
    };
}

// Evento do botão WMS no menu de opções da camada
var btnWms = document.getElementById('btn-wms');
if (btnWms) {
    btnWms.onclick = function() {
        if (!window.camadaSelecionadaOpcoes) return;
        var lyr = window.camadaSelecionadaOpcoes;
        
        // Fecha o menu de opções flutuante
        var popupOpcoes = document.getElementById('popup-camada-opcoes');
        if (popupOpcoes) popupOpcoes.style.display = 'none';

        var layerName = '';
        if (lyr.getSource && typeof lyr.getSource().getParams === 'function') {
            var params = lyr.getSource().getParams();
            layerName = params.LAYERS || params.layers || '';
        }
        if (!layerName) {
            layerName = lyr.get('popuplayertitle') || lyr.get('title') || 'sigweb:Municipios_do_Piauí';
        }

        var urlWms = `https://geoserver-sigweb.duckdns.org/geoserver/sigweb/wms?service=WMS&version=1.1.0&request=GetMap&layers=${encodeURIComponent(layerName)}`;
        mostrarModalUrl('WMS', urlWms);
    };
}

// Evento do botão WFS no menu de opções da camada
var btnWfs = document.getElementById('btn-wfs');
if (btnWfs) {
    btnWfs.onclick = function() {
        if (!window.camadaSelecionadaOpcoes) return;
        var lyr = window.camadaSelecionadaOpcoes;
        
        // Fecha o menu de opções flutuante
        var popupOpcoes = document.getElementById('popup-camada-opcoes');
        if (popupOpcoes) popupOpcoes.style.display = 'none';

        var layerName = '';
        if (lyr.get) {
            layerName = lyr.get('popuplayertitle') || '';
        }
        if (!layerName && lyr.getSource && typeof lyr.getSource().getParams === 'function') {
            var params = lyr.getSource().getParams();
            layerName = params.LAYERS || params.layers || '';
        }
        if (!layerName) {
            layerName = 'sigweb:Municipios_do_Piauí';
        }

        var urlWfs = `https://geoserver-sigweb.duckdns.org/geoserver/sigweb/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=${encodeURIComponent(layerName)}&SRSNAME=EPSG:3857&OUTPUTFORMAT=application/json`;
        mostrarModalUrl('WFS', urlWfs);
    };
}

// 1. Download de Dados Vetoriais (Shapefile / GeoPackage via WFS do GeoServer)
var btnDownloadVetor = document.getElementById('btn-download-vetor');
if (btnDownloadVetor) {
    btnDownloadVetor.onclick = function() {
        if (!window.camadaSelecionadaOpcoes) return;
        var lyr = window.camadaSelecionadaOpcoes;
        
        // Fecha o popup de opções
        var popupOpcoes = document.getElementById('popup-camada-opcoes');
        if (popupOpcoes) popupOpcoes.style.display = 'none';

        var wfsUrlEspecifica = "";

        // Mapeia exatamente com base nas instâncias de camadas do seu projeto
        if (typeof lyr_MunicpiosPiau_28 !== 'undefined' && lyr === lyr_MunicpiosPiau_28) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Municipios_do_Piaui&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_Piau_27 !== 'undefined' && lyr === lyr_Piau_27) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Piauí&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_Brasil_29 !== 'undefined' && lyr === lyr_Brasil_29) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Brasil&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_CadastroAmbientalRuralCAR_16 !== 'undefined' && lyr === lyr_CadastroAmbientalRuralCAR_16) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Cadastro_Ambiental_Rural&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_SistemadeGestoFundiriaSIGEF_17 !== 'undefined' && lyr === lyr_SistemadeGestoFundiriaSIGEF_17) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Sistema_de_Gestao_Fundiaria&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_Municipioscomaltopotencialenergticosolar_3 !== 'undefined' && lyr === lyr_Municipioscomaltopotencialenergticosolar_3) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Municipios_alto_potencial_energético_solar&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_Linhadetransmissoplanejado_11 !== 'undefined' && lyr === lyr_Linhadetransmissoplanejado_11) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Linha_transmissão_planejado&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_Linhadetransmissaoexistente_14 !== 'undefined' && lyr === lyr_Linhadetransmissaoexistente_14) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Linha_transmissao_existente&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_SubestaesExpansoPlanejada_12 !== 'undefined' && lyr === lyr_SubestaesExpansoPlanejada_12) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Subestações_Expansão_Planejada&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_SubestaesBaseExistente_13 !== 'undefined' && lyr === lyr_SubestaesBaseExistente_13) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Subestações_Base_Existente&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_BiomasMAPBIOMAS_18 !== 'undefined' && lyr === lyr_BiomasMAPBIOMAS_18) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Biomas_mapbiomas&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_reasdeconservaoICMBio_20 !== 'undefined' && lyr === lyr_reasdeconservaoICMBio_20) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:areas_de_conservacao&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else if (typeof lyr_RedeHidrogrficaANA_22 !== 'undefined' && lyr === lyr_RedeHidrogrficaANA_22) {
            wfsUrlEspecifica = "https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=sigweb:Rede_Hidrografica&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip";
        } else {
            // Fallback genérico extraindo do WMS caso exista
            var layerNameWms = "";
            if (lyr && lyr.getSource && typeof lyr.getSource().getParams === 'function') {
                var params = lyr.getSource().getParams();
                layerNameWms = params.LAYERS || params.layers || "sigweb:Municipios_do_Piaui";
            } else {
                layerNameWms = "sigweb:Municipios_do_Piaui";
            }
            wfsUrlEspecifica = `https://geoserver-sigweb.duckdns.org/geoserver/wfs?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=${encodeURIComponent(layerNameWms)}&SRSNAME=EPSG:3857&OUTPUTFORMAT=shape-zip`;
        }

        // --- DISPARA O DOWNLOAD DIRETAMENTE ---
        var linkTemp = document.createElement('a');
        linkTemp.href = wfsUrlEspecifica;
        linkTemp.setAttribute('download', '');
        document.body.appendChild(linkTemp);
        linkTemp.click();
        document.body.removeChild(linkTemp);
    };
}

// 2. Download de Dados Raster (GeoTIFF via WMS do GeoServer)
var btnDownloadRaster = document.getElementById('btn-download-raster');
if (btnDownloadRaster) {
    btnDownloadRaster.onclick = function() {
        if (!window.camadaSelecionadaOpcoes) return;
        var lyr = window.camadaSelecionadaOpcoes;
        
        // Fecha o popup de opções
        var popupOpcoes = document.getElementById('popup-camada-opcoes');
        if (popupOpcoes) popupOpcoes.style.display = 'none';

        var layerName = '';
        if (lyr.getSource && typeof lyr.getSource().getParams === 'function') {
            var params = lyr.getSource().getParams();
            layerName = params.LAYERS || params.layers || '';
        }
        if (!layerName) {
            layerName = lyr.get('popuplayertitle') || lyr.get('title') || '';
        }

        // Pega a extensão atual visível no mapa para recortar o GeoTIFF na área exibida, ou usa a do layer
        var extent = map.getView().calculateExtent(map.getSize());

        // URL nativa do GeoServer para exportar imagem em GeoTIFF via WMS (GetCoverage / GetMap)
        var downloadUrl = `https://geoserver-sigweb.duckdns.org/geoserver/sigweb/wms?service=WMS&version=1.1.0&request=GetMap&layers=${encodeURIComponent(layerName)}&bbox=${extent.join(',')}&width=1024&height=1024&format=image/geotiff`;

        // Dispara o download
        window.location.href = downloadUrl;
    };
}

//Metadado
var btnMetadado = document.getElementById('btn-metadado');
if (btnMetadado) {
    btnMetadado.onclick = function() {
        if (!window.camadaSelecionadaOpcoes) return;
        var lyr = window.camadaSelecionadaOpcoes;
        
        // Fecha o popover de opções da camada
        var popupOpcoes = document.getElementById('popup-camada-opcoes');
        if (popupOpcoes) {
            popupOpcoes.style.display = 'none';
        }

        // Obtém a URL do metadado definida na camada
        var pdfUrl = lyr.get('metadadoUrl');

        if (pdfUrl) {
            // Abre o PDF numa nova aba do navegador
            window.open(pdfUrl, '_blank');
        } else {
            alert("Nenhum documento de metadados (PDF) associado a esta camada.");
        }
    
       var idMetadadoMGB = LayerSwitcher.obterUuidCamadaMGB(camadaSelecionadaOpcoes);

       console.log("Camada:", camadaSelecionadaOpcoes);
       console.log("Identificador do Metadado:", idMetadadoMGB);
    };
}

// Aguarda a página carregar completamente para garantir que o mapa 'map' já existe
            window.addEventListener('DOMContentLoaded', function () {
                // 1. Criar a fonte e a camada do marcador (Vector Layer)
                const markerSource = new ol.source.Vector({
                    features: []
                });

                const markerLayer = new ol.layer.Vector({
                    source: markerSource,
                    style: new ol.style.Style({
                        image: new ol.style.Icon({
                            src: "images/icons8-localização.png", 
                            anchor: [0.5, 1],
                            scale: 0.8 
                        })
                    })
                });

                // Adiciona a camada de marcador no mapa gerado pelo qgis2web
                if (typeof map !== 'undefined') {
                    map.addLayer(markerLayer);
                }

                // 2. Função para buscar e centralizar na Lat/Lon
                function localizarPorCoordenadas() {
                    const latInput = document.getElementById('input-lat').value;
                    const lonInput = document.getElementById('input-long').value;

                    const lat = parseFloat(latInput.replace(',', '.'));
                    const lon = parseFloat(lonInput.replace(',', '.'));

                    if (isNaN(lat) || isNaN(lon)) {
                        alert('Por favor, insira valores válidos para Latitude e Longitude.');
                        return;
                    }

                    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                        alert('Coordenadas fora dos limites válidos. Latitude: [-90, 90], Longitude: [-180, 180].');
                        return;
                    }

                    markerSource.clear();

                    // Converte de WGS84 (Lon, Lat) para a projeção do mapa do OpenLayers
                    const coordinate = ol.proj.fromLonLat([lon, lat]);

                    const feature = new ol.Feature({
                        geometry: new ol.geom.Point(coordinate)
                    });

                    markerSource.addFeature(feature);

                    // Centraliza o mapa na coordenada informada
                    if (typeof map !== 'undefined') {
                        map.getView().animate({
                            center: coordinate,
                            zoom: 15,
                            duration: 1000
                        });
                    }
                }

                // 3. Associar a função ao botão "Localizar"
                const btnLocalizar = document.getElementById('btn-localizar');
                if (btnLocalizar) {
                    btnLocalizar.addEventListener('click', function(e) {
                        e.preventDefault();
                        localizarPorCoordenadas();
                    });
                }
            });


// Adiciona o controle de barra de escala ao OpenLayers
var scaleLineControl = new ol.control.ScaleLine({
    units: 'metric',
    bar: true,       // Habilita o modo gráfico de barra
    steps: 1,        // Número de divisões/degraus na barra
    text: false,    
    className: 'escala', // Exibe o texto com a distância numérica
    minWidth: 70    // Largura mínima em pixels
});

map.addControl(scaleLineControl);

const coordenadasMouse = new ol.control.MousePosition({
    coordinateFormat: function (coordenada) {
        if (!coordenada) {
            return 'Longitude: — | Latitude: —';
        }

        return 'Longitude: ' + coordenada[0].toFixed(6) +
               '° | Latitude: ' + coordenada[1].toFixed(6) + '°';
    },

    projection: 'EPSG:4326',
    className: 'coordenadas_rodape',
});

map.addControl(coordenadasMouse);



//Voltar para LadingPage
document.getElementById('btn-home').addEventListener('click', function() {
    window.location.href = 'LandingPage.html';
});


