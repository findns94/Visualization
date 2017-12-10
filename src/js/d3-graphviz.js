(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-selection'), require('d3-transition'), require('d3-zoom'), require('d3-interpolate'), require('viz.js')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-selection', 'd3-transition', 'd3-zoom', 'd3-interpolate', 'viz.js'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3,global.Viz));
}(this, function (exports,d3,d3Transition,d3Zoom,d3Interpolate,Viz) { 'use strict';

  function zoom$1(enable) {

      this._zoom = enable;

      if (this._zoom && !this._zoomBehavior) {
          createZoomBehavior.call(this);
      }

      return this;
  }

  function createZoomBehavior() {

      function zoomed() {
          g.attr('transform', d3.event.transform);
      }

      var root = this._selection;
      var svg = d3.select(root.node().querySelector("svg"));
      if (svg.size() == 0) {
          return this;
      }
      this._zoomSelection = svg;
      var extent = [0.1, 10];
      var zoomBehavior = d3Zoom.zoom()
          .scaleExtent(extent)
          .on("zoom", zoomed);
      this._zoomBehavior = zoomBehavior;
      var g = d3.select(svg.node().querySelector("g"));
      svg.call(zoomBehavior);
      if (!this._active) {
          translateZoomBehaviorTransform.call(this, g);
      }

      return this;
  };

  function getTranslation(g) {
      var transform = g.node().transform;
      if  (transform && transform.baseVal.length != 0) {
          var matrix = transform.baseVal.consolidate().matrix;
          return {x: matrix.e, y: matrix.f};
      } else {
          return {x: 0, y: 0};
      }
  }

  function translateZoomTransform(selection) {
      var oldTranslation = this._translation;
      var newTranslation = selection.datum().translation;
      var dx = newTranslation.x - oldTranslation.x;
      var dy = newTranslation.y - oldTranslation.y;
      return d3Zoom.zoomTransform(this._zoomSelection.node()).translate(dx, dy);
  }
  function translateZoomBehaviorTransform(selection) {
      this._zoomBehavior.transform(this._zoomSelection, translateZoomTransform.call(this, selection));
      this._translation = selection.datum().translation;
  }

  function extractElementData(element) {

      var datum = {};
      var tag = element.node().nodeName;
      datum.tag = tag;
      datum.attributes = {};
      var attributes = element.node().attributes;
      if (attributes) {
          for (var i = 0; i < attributes.length; i++) {
              var attribute = attributes[i];
              var name = attribute.name;
              var value = attribute.value;
              datum.attributes[name] = value;
          }
      }
      var transform = element.node().transform;
      if (transform) {
          var translation = getTranslation(element);
          if (translation.x != 0 || translation.y != 0) {
              datum.translation = translation;
          }
      }
      if (tag == 'ellipse' && datum.attributes.cx) {
          datum.center = {
              x: datum.attributes.cx,
              y: datum.attributes.cy,
          };
      }
      if (tag == 'polygon' && datum.attributes.points) {
          var points = element.attr('points').split(' ');
          var x = points.map(function(p) {return p.split(',')[0]});
          var y = points.map(function(p) {return p.split(',')[1]});
          var xmin = Math.min.apply(null, x);
          var xmax = Math.max.apply(null, x);
          var ymin = Math.min.apply(null, y);
          var ymax = Math.max.apply(null, y);
          var bbox = {
              x: xmin,
              y: ymin,
              width: xmax - xmin,
              height: ymax - ymin,
          };
          datum.bbox = bbox;
          datum.center = {
              x: ymin + ymax / 2,
              y: ymin + ymax / 2,
          };
      }
      if (tag == 'path') {
          if (element.node().getTotalLength) {
              datum.totalLength = element.node().getTotalLength();
          } else { // Test workaround until https://github.com/tmpvar/jsdom/issues/1330 is fixed
              datum.totalLength = 100;
          }
      }
      if (tag == '#text') {
          datum.text = element.text();
      } else if (tag == '#comment') {
          datum.comment = element.text();
      }
      return datum
  }

  function createElement(data) {

      if (data.tag == '#text') {
          return document.createTextNode("");
      } else if (data.tag == '#comment') {
          return document.createComment(data.comment);
      } else {
          return document.createElementNS('http://www.w3.org/2000/svg', data.tag);
      }
  }

  function createElementWithAttributes(data) {

      var elementNode = createElement(data);
      var element = d3.select(elementNode);
      var attributes = data.attributes;
      if (attributes) {
          for (var attributeName of Object.keys(attributes)) {
              var attributeValue = attributes[attributeName];
              element.attr(attributeName, attributeValue);
          }
      }
      return elementNode;
  }

  function replaceElement(element, data) {
      var parent = d3.select(element.node().parentNode);
      var newElementNode = createElementWithAttributes(data);
      var newElement = parent.insert(function () {
          return newElementNode;
      }, function () {
          return element.node();
      });
      element.remove();
      return newElement;
  }

  function shallowCopyObject(obj) {
      return Object.assign({}, obj);
  }

  function pathTween(points, d1) {
      return function() {
          var pointInterpolators = points.map(function(p) {
              return d3Interpolate.interpolate([p[0][0], p[0][1]], [p[1][0], p[1][1]]);
          });
          return function(t) {
              return t < 1 ? "M" + pointInterpolators.map(function(p) { return p(t); }).join("L") : d1;
          };
      };
  }

  function pathTweenPoints(node, d1, precision) {
      var path0 = node;
      var path1 = path0.cloneNode();
      if (node.getTotalLength) {
          var n0 = path0.getTotalLength();
          var n1 = (path1.setAttribute("d", d1), path1).getTotalLength();
      } else { // Test workaround until https://github.com/tmpvar/jsdom/issues/1330 is fixed
          var n0 = 100.0;
          var n1 = 50.0;
      }

      // Uniform sampling of distance based on specified precision.
      var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
      while ((i += dt) < 1) distances.push(i);
      distances.push(1);

      // Compute point-interpolators at each distance.
      var points = distances.map(function(t) {
          if (node.getPointAtLength) {
              var p0 = path0.getPointAtLength(t * n0);
              var p1 = path1.getPointAtLength(t * n1);
          } else { // Test workaround until https://github.com/tmpvar/jsdom/issues/1330 is fixed
              var p0 = {x: t * n0, y: t * n0};
              var p1 = {x: t * n1, y: t * n1};
          }
          return ([[p0.x, p0.y], [p1.x, p1.y]]);
      });
      return points;
  }

  function isEdgeElementParent(datum) {
      return (datum.attributes.class == 'edge' || (
          datum.tag == 'a' &&
              datum.parent.tag == 'g' &&
              datum.parent.parent.attributes.class == 'edge'
      ));
  }

  function isEdgeElement(datum) {
      return datum.parent && isEdgeElementParent(datum.parent);
  }

  function getEdgeGroup(datum) {
      if (datum.parent.attributes.class == 'edge') {
          return datum.parent;
      } else { // datum.parent.tag == 'g' && datum.parent.parent.tag == 'g' && datum.parent.parent.parent.attributes.class == 'edge'
          return datum.parent.parent.parent;
      }
  }

  function getEdgeTitle(datum) {
      return getEdgeGroup(datum).children.find(function (e) {
          return e.tag == 'title';
      });
  }

  function render() {

      var transitionInstance = this._transition;
      var fade = this._fade && transitionInstance != null;
      var tweenPaths = this._tweenPaths;
      var tweenShapes = this._tweenShapes;
      var convertEqualSidedPolygons = this._convertEqualSidedPolygons;
      var tweenPrecision = this._tweenPrecision;
      var growEnteringEdges = this._growEnteringEdges && transitionInstance != null;
      var attributer = this._attributer;
      var graphvizInstance = this;

      function insertSvg(element) {
          var children = element.selectAll(function () {
              return element.node().childNodes;
          });

          children = children
            .data(function (d) {
                return d.children;
            }, function (d) {
                return d.key;
            });
          var childrenEnter = children
            .enter()
            .append(function(d) {
                var element = createElement(d);
                if (d.tag == '#text' && fade) {
                    element.nodeValue = d.text;
                }
                return element;
            });

          if (fade || (growEnteringEdges && isEdgeElementParent(element.datum()))) {
              var childElementsEnter = childrenEnter
                  .filter(function(d) {
                      return d.tag[0] == '#' ? null : this;
                  })
                  .each(function (d) {
                      var childEnter = d3.select(this);
                      for (var attributeName of Object.keys(d.attributes)) {
                          var attributeValue = d.attributes[attributeName];
                          childEnter
                              .attr(attributeName, attributeValue);
                      }
                  });
              childElementsEnter
                .filter(function(d) {
                      return d.tag == 'svg' || d.tag == 'g' ? null : this;
                })
                  .style("opacity", 0.0);
          }
          var childrenExit = children
            .exit();
          if (attributer) {
              childrenExit.each(attributer);
          }
          if (transitionInstance) {
              childrenExit = childrenExit
                  .transition(transitionInstance);
              if (fade) {
                  childrenExit
                    .filter(function(d) {
                        return d.tag[0] == '#' ? null : this;
                    })
                      .style("opacity", 0.0);
              }
          }
          childrenExit = childrenExit
              .remove()
          children = childrenEnter
              .merge(children);
          if (attributer) {
              children.each(attributer);
          }
          children.each(function(childData) {
              var child = d3.select(this);
              var tag = childData.tag;
              var attributes = childData.attributes;
              var convertShape = false;
              if (tweenShapes && transitionInstance && childData.alternativeOld) {
                  if (this.nodeName == 'polygon' || this.nodeName == 'ellipse') {
                      convertShape = true;
                      var prevData = extractElementData(child);
                      if (this.nodeName == 'polygon' && tag == 'polygon') {
                          var prevPoints = prevData.attributes.points;
                          if (prevPoints == null) {
                              convertShape = false;
                          } else if (!convertEqualSidedPolygons) {
                              var nPrevPoints = prevPoints.split(' ').length;
                              var points = childData.attributes.points;
                              var nPoints = points.split(' ').length;
                              if (nPoints == nPrevPoints) {
                                  convertShape = false;
                              }
                          }
                      } else if (this.nodeName == 'ellipse' && tag == 'ellipse') {
                          convertShape = false;
                      }
                  }
                  if (convertShape) {
                      var prevPathData = childData.alternativeOld;
                      var pathElement = replaceElement(child, prevPathData);
                      pathElement.data([childData], function () {
                          return childData.key;
                      });
                      var newPathData = childData.alternativeNew;
                      child = pathElement;
                      tag = 'path';
                      attributes = newPathData.attributes;
                  }
              }
              var childTransition = child;
              if (transitionInstance) {
                  childTransition = childTransition
                      .transition(transitionInstance);
                  if (fade) {
                      childTransition
                        .filter(function(d) {
                            return d.tag[0] == '#' ? null : this;
                        })
                          .style("opacity", 1.0);
                  }
                  childTransition
                    .filter(function(d) {
                        return d.tag[0] == '#' ? null : this;
                    })
                      .on("end", function() {
                          d3.select(this)
                              .attr('style', null);
                      });
              }
              var growThisPath = growEnteringEdges && tag == 'path' && childData.offset;
              if (growThisPath) {
                  var totalLength = childData.totalLength;
                  child
                      .attr("stroke-dasharray", totalLength + " " + totalLength)
                      .attr("stroke-dashoffset", totalLength)
                      .attr('transform', 'translate(' + childData.offset.x + ',' + childData.offset.y + ')');
                  childTransition
                      .attr("stroke-dashoffset", 0)
                      .attr('transform', 'translate(0,0)')
                      .on("start", function() {
                          d3.select(this)
                              .style('opacity', null);
                      })
                      .on("end", function() {
                          d3.select(this)
                              .attr('stroke-dashoffset', null)
                              .attr('stroke-dasharray', null)
                              .attr('transform', null);
                      });
              }
              var moveThisPolygon = growEnteringEdges && tag == 'polygon' && isEdgeElement(childData) && childData.offset;
              if (moveThisPolygon) {
                  var edgePath = d3.select(element.node().querySelector("path"));
                  if (edgePath.node().getPointAtLength) {
                      var p0 = edgePath.node().getPointAtLength(0);
                      var p1 = edgePath.node().getPointAtLength(childData.totalLength);
                      var p2 = edgePath.node().getPointAtLength(childData.totalLength - 1);
                      var angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x) * 180 / Math.PI;
                  } else { // Test workaround until https://github.com/tmpvar/jsdom/issues/1330 is fixed
                      var p0 = {x: 0, y: 0};
                      var p1 = {x: 100, y: 100};
                      var angle1 = 0;
                  }
                  var x = p0.x - p1.x + childData.offset.x;
                  var y = p0.y - p1.y + childData.offset.y;
                  child
                      .attr('transform', 'translate(' + x + ',' + y + ')');
                  childTransition
                      .attrTween("transform", function () {
                          return function (t) {
                              if (edgePath.node().getPointAtLength) {
                                  var p = edgePath.node().getPointAtLength(childData.totalLength * t);
                                  var p2 = edgePath.node().getPointAtLength(childData.totalLength * t + 1);
                                  var angle = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI - angle1;
                              } else { // Test workaround until https://github.com/tmpvar/jsdom/issues/1330 is fixed
                                  var p = {x: 100.0 * t, y: 100.0 *t};
                                  var angle = 0;
                              }
                              x = p.x - p1.x + childData.offset.x * (1 - t);
                              y = p.y - p1.y + childData.offset.y * (1 - t);
                              return 'translate(' + x + ',' + y + ') rotate(' + angle + ' ' + p1.x + ' ' + p1.y + ')';
                          }
                      })
                      .on("start", function() {
                          d3.select(this)
                              .style('opacity', null);
                      })
                      .on("end", function() {
                          d3.select(this).attr('transform', null);
                      });
              }
              var tweenThisPath = tweenPaths && transitionInstance && tag == 'path' && child.attr('d') != null;
              for (var attributeName of Object.keys(attributes)) {
                  var attributeValue = attributes[attributeName];
                  if (tweenThisPath && attributeName == 'd') {
                      var points = (childData.alternativeOld || childData).points;
                      if (points) {
                          childTransition
                              .attrTween("d", pathTween(points, attributeValue));
                      }
                  } else {
                      if (attributeName == 'transform' && childData.translation) {
                          childTransition
                              .on("start", function () {
                                  if (graphvizInstance._zoomBehavior) {
                                      childTransition
                                          .attr(attributeName, translateZoomTransform.call(graphvizInstance, child).toString());
                                  }
                              })
                              .on("end", function () {
                                  if (graphvizInstance._zoomBehavior) {
                                      translateZoomBehaviorTransform.call(graphvizInstance, child);
                                  }
                              })
                      }
                      childTransition
                          .attr(attributeName, attributeValue);
                  }
              }
              if (convertShape) {
                  childTransition
                      .on("end", function (d, i, nodes) {
                          if (this.nodeName != d.tag) {
                              pathElement = d3.select(this);
                              var newElement = replaceElement(pathElement, d);
                              newElement.data([d], function () {
                                  return d.key;
                              });
                          }
                      })
              }
              if (childData.text) {
                  childTransition
                      .text(childData.text);
              }
              insertSvg(child);
          });
      }

      var root = this._selection;

      if (transitionInstance != null) {
          // Ensure orignal SVG shape elements are restored after transition before rendering new graph
          var jobs = this._jobs;
          if (graphvizInstance._active) {
              jobs.push(null);
              return this;
          } else {
              root
                .transition(transitionInstance)
                .transition()
                  .duration(0)
                  .on("end" , function () {
                      graphvizInstance._active = false;
                      if (jobs.length != 0) {
                          jobs.shift();
                          graphvizInstance.render();
                      }
                  });
              this._active = true;
          }
      }

      var data = this._data;

      root
          .datum({attributes: {}, children: [data]});
      insertSvg(root);

      if (this._zoom && !this._zoomBehavior) {
          createZoomBehavior.call(this);
      }

      return this;
  };

  function convertToPathData(originalData, guideData) {
      if (originalData.tag == 'polygon') {
          var newData = shallowCopyObject(originalData);
          newData.tag = 'path';
          var originalAttributes = originalData.attributes;
          var newAttributes = shallowCopyObject(originalAttributes);
          if (originalAttributes.points != null) {
              var newPointsString = originalAttributes.points;
              if (guideData.tag == 'polygon') {
                  var bbox = originalData.bbox;
                  bbox.cx = bbox.x + bbox.width / 2;
                  bbox.cy = bbox.y + bbox.height / 2;
                  var pointsString = originalAttributes.points;
                  var pointStrings = pointsString.split(' ');
                  var normPoints = pointStrings.map(function(p) {var xy = p.split(','); return [xy[0] - bbox.cx, xy[1] - bbox.cy]});
                  var x0 = normPoints[normPoints.length - 1][0];
                  var y0 = normPoints[normPoints.length - 1][1];
                  for (var i = 0; i < normPoints.length; i++, x0 = x1, y0 = y1) {
                      var x1 = normPoints[i][0];
                      var y1 = normPoints[i][1];
                      var dx = x1 - x0;
                      var dy = y1 - y0;
                      if (dy == 0) {
                          continue;
                      } else {
                          var x2 = x0 - y0 * dx / dy;
                      }
                      if (0 <= x2 && x2 < Infinity && ((x0 <= x2 && x2 <= x1) || (x1 <= x2 && x2 <= x0))) {
                          break;
                      }
                  }
                  var newPointStrings = [[bbox.cx + x2, bbox.cy + 0].join(',')];
                  newPointStrings = newPointStrings.concat(pointStrings.slice(i));
                  newPointStrings = newPointStrings.concat(pointStrings.slice(0, i));
                  newPointsString = newPointStrings.join(' ');
              }
              newAttributes['d'] = 'M' + newPointsString + 'z';
              delete newAttributes.points;
          }
          newData.attributes = newAttributes;
      } else if (originalData.tag == 'ellipse') {
          var newData = shallowCopyObject(originalData);
          newData.tag = 'path';
          var originalAttributes = originalData.attributes;
          var newAttributes = shallowCopyObject(originalAttributes);
          if (originalAttributes.cx != null) {
              var cx = originalAttributes.cx;
              var cy = originalAttributes.cy;
              var rx = originalAttributes.rx;
              var ry = originalAttributes.ry;
              var bbox = guideData.bbox;
              bbox.cx = bbox.x + bbox.width / 2;
              bbox.cy = bbox.y + bbox.height / 2;
              var p = guideData.attributes.points.split(' ')[0].split(',');
              var sx = p[0];
              var sy = p[1];
              var dx = sx - bbox.cx;
              var dy = sy - bbox.cy;
              var l = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
              var cosA = dx / l;
              var sinA = -dy / l;
              var x1 = rx * cosA;
              var y1 = -ry * sinA;
              var x2 = rx * (-cosA);
              var y2 = -ry * (-sinA);
              var dx = x2 - x1;
              var dy = y2 - y1;
              newAttributes['d'] = 'M '  +  cx + ' ' + cy + ' m ' + x1 + ',' + y1 + ' a ' + rx + ',' + ry + ' 0 1,0 ' + dx + ',' + dy + ' a ' + rx + ',' + ry + ' 0 1,0 ' + -dx + ',' + -dy + 'z';
              delete newAttributes.cx;
              delete newAttributes.cy;
              delete newAttributes.rx;
              delete newAttributes.ry;
          }
          newData.attributes = newAttributes;
      } else {
          var newData = originalData;
      }
      return newData;
  }

  function dot(src) {

      var engine = this._engine;
      var totalMemory = this._totalMemory;
      var keyMode = this._keyMode;
      var tweenPaths = this._tweenPaths;
      var tweenShapes = this._tweenShapes;
      var tweenPrecision = this._tweenPrecision;
      var growEnteringEdges = this._growEnteringEdges;
      var dictionary = {};
      var prevDictionary = this._dictionary || {};
      var nodeDictionary = {};
      var prevNodeDictionary = this._nodeDictionary || {};

      function extractData(element, index = 0, parentData) {

          var datum = extractElementData(element);

          datum.parent = parentData;
          datum.children = [];
          var tag = datum.tag;
          if (tag == '#text') {
              datum.text = element.text();
          } else if (tag == '#comment') {
              datum.comment = element.text();
          }
          var children = d3.selectAll(element.node().childNodes);
          if (keyMode == 'index') {
              datum.key = index;
          } else if (tag[0] != '#') {
              if (keyMode == 'id') {
                  datum.key = element.attr('id');
              } else if (keyMode == 'title') {
                  element.select('title');
                  var title = element.select('title');
                  if (!title.empty()) {
                      datum.key = element.select('title').text();
                  }
              }
          }
          if (datum.key == null) {
              if (tweenShapes) {
                  if (tag == 'ellipse' || tag == 'polygon') {
                      tag = 'path';
                  }
              }
              datum.key = tag + '-' + index;
          }
          var id = (parentData ? parentData.id + '.' : '') + datum.key;
          datum.id = id;
          dictionary[id] = datum;
          var prevDatum = prevDictionary[id];
          if (tweenShapes && id in prevDictionary) {
              if ((prevDatum.tag == 'polygon' || prevDatum.tag == 'ellipse') && (prevDatum.tag != datum.tag || datum.tag == 'polygon')) {
                  datum.alternativeOld = convertToPathData(prevDatum, datum);
                  datum.alternativeNew = convertToPathData(datum, prevDatum);
              }
          }
          if (tweenPaths && prevDatum && (prevDatum.tag == 'path' || (datum.alternativeOld && datum.alternativeOld.tag == 'path'))) {
              var attribute_d = (datum.alternativeNew || datum).attributes.d;
              if (datum.alternativeOld) {
                  var oldNode = createElementWithAttributes(datum.alternativeOld);
              } else {
                  var oldNode = createElementWithAttributes(prevDatum);
              }
              (datum.alternativeOld || (datum.alternativeOld = {})).points = pathTweenPoints(oldNode, attribute_d, tweenPrecision);
          }

          var childTagIndexes = {};
          children.each(function () {
              if (this !== null) {
                  var childTag = this.nodeName;
                  if (childTag == 'ellipse' || childTag == 'polygon') {
                      childTag = 'path';
                  }
                  if (childTagIndexes[childTag] == null) {
                      childTagIndexes[childTag] = 0;
                  }
                  var childIndex = childTagIndexes[childTag]++;
                  var childData = extractData(d3.select(this), childIndex, datum);
                  if (childData) {
                      datum.children.push(childData);
                  }
              }
          });
          return datum;
      }

      function postProcessData(datum) {

          var id = datum.id;
          var tag = datum.tag;
          var prevDatum = prevDictionary[id];
          if (growEnteringEdges && datum.parent) {
              if (datum.parent.attributes.class == 'node') {
                  if (tag == 'title') {
                      var child = datum.children[0];
                      var nodeId = child.text;
                      nodeDictionary[nodeId] = datum.parent;
                  }
              }
          }
          if (growEnteringEdges && !prevDatum && datum.parent) {
              if (isEdgeElement(datum)) {
                  if (tag == 'path' || tag == 'polygon') {
                      if (tag == 'polygon') {
                          var path = datum.parent.children.find(function (e) {
                              return e.tag == 'path';
                          });
                          datum.totalLength = path.totalLength;
                      }
                      var title = getEdgeTitle(datum);
                      var child = title.children[0];
                      var nodeIds = child.text.split('->');
                      if (nodeIds.length != 2) {
                          nodeIds = child.text.split('--');
                      }
                      var startNodeId = nodeIds[0];
                      var startNode = nodeDictionary[startNodeId];
                      var prevStartNode = prevNodeDictionary[startNodeId];
                      if (prevStartNode) {
                          var startShape = startNode.children[3];
                          var prevStartShape = prevStartNode.children[3];
                          if (startShape.tag != 'polygon' && startShape.tag != 'ellipse') {
                              throw Error('Unexpected tag: ' + startShape.tag, '. Please file an issue at https://github.com/magjac/d3-graphviz/issues');
                          }
                          if (prevStartShape.tag != 'polygon' && prevStartShape.tag != 'ellipse') {
                              throw Error('Unexpected tag: ' + prevStartShape.tag, '. Please file an issue at https://github.com/magjac/d3-graphviz/issues');
                          }
                          datum.offset = {
                              x: prevStartShape.center.x - startShape.center.x,
                              y: prevStartShape.center.y - startShape.center.y,
                          }
                      }
                  }
              }
          }
          datum.children.forEach(function (childData) {
              postProcessData(childData);
          });
          return datum;
      }

      var svgDoc = Viz(src,
                {
                    format: "svg",
                    engine: engine,
                    totalMemory: totalMemory,
                }
               );

      var newDoc = d3.selection()
        .append('div')
        .attr('display', 'none');

      newDoc
          .html(svgDoc);

      var newSvg = newDoc
        .select('svg');

      var data = extractData(newSvg);
      var data = postProcessData(data);
      this._data = data;
      this._dictionary = dictionary;
      this._nodeDictionary = nodeDictionary;
      newDoc.remove();

      return this;
  };

  function renderDot(src) {

      this
          .dot(src)
          .render();

      return this;
  };

  function transition$1(name) {

      this._transition = d3Transition.transition(name);

      return this;
  };

  function attributer(callback) {

      this._attributer = callback;

      return this;
  };

  function engine(engine) {

  /*
      if (!this._engines.has(engine)) {
          throw Error('Illegal engine: ' + engine);
      }
  */
      if (engine != this._engine && this._data != null) {
          throw Error('Too late to change engine');
      }
      this._engine = engine;

      return this;
  };

  function totalMemory(size) {

      this._totalMemory = size

      return this;
  };

  function keyMode(keyMode) {

      if (!this._keyModes.has(keyMode)) {
          throw Error('Illegal keyMode: ' + keyMode);
      }
      if (keyMode != this._keyMode && this._data != null) {
          throw Error('Too late to change keyMode');
      }
      this._keyMode = keyMode;

      return this;
  };

  function fade(enable) {

      this._fade = enable

      return this;
  };

  function tweenPaths(enable) {

      this._tweenPaths = enable;

      return this;
  };

  function tweenShapes(enable) {

      this._tweenShapes = enable;
      if (enable) {
          this._tweenPaths = true;
      }

      return this;
  };

  function convertEqualSidedPolygons(enable) {

      this._convertEqualSidedPolygons = enable;

      return this;
  };

  function tweenPrecision(precision) {

      this._tweenPrecision = precision;

      return this;
  };

  function growEnteringEdges(enable) {

      this._growEnteringEdges = enable;

      return this;
  };

  function Graphviz(selection) {
      this._selection = selection;
      this._active = false;
      this._jobs = [];
      this._keyModes = new Set([
          'title',
          'id',
          'tag-index',
          'index'
      ]);
      this._engine = 'dot';
      this._totalMemory = undefined;
      this._keyMode = 'title';
      this._fade = true;
      this._tweenPaths = true;
      this._tweenShapes = true;
      this._convertEqualSidedPolygons = true;
      this._tweenPrecision = 1;
      this._growEnteringEdges = true;
      this._translation = {x: 0, y: 0};
      this._zoom = true;
  }

  function graphviz(selector) {
      var g = new Graphviz(d3.select(selector));
      return g;
  }

  Graphviz.prototype = graphviz.prototype = {
      constructor: Graphviz,
      engine: engine,
      totalMemory: totalMemory,
      keyMode: keyMode,
      fade: fade,
      tweenPaths: tweenPaths,
      tweenShapes: tweenShapes,
      convertEqualSidedPolygons: convertEqualSidedPolygons,
      tweenPrecision: tweenPrecision,
      growEnteringEdges: growEnteringEdges,
      zoom: zoom$1,
      render: render,
      dot: dot,
      renderDot: renderDot,
      transition: transition$1,
      attributer: attributer,
  };

  function selection_graphviz() {

    return new Graphviz(this);
  }

  d3.selection.prototype.graphviz = selection_graphviz;

  exports.graphviz = graphviz;

  Object.defineProperty(exports, '__esModule', { value: true });

}));