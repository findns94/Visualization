/**
 * borrowed from http://bl.ocks.org/bunkat/2595950
 */

var margin = {top: 20, right: 15, bottom: 60, left: 60}
    , width = 960 - margin.left - margin.right
    , height = 500 - margin.top - margin.bottom;

var sites = d3.range(100).map(function(d) {
    return [Math.random() * width, Math.random() * height];
});

var chart = d3.select('body')
    .append('svg:svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .attr('class', 'chart');

var g = chart.append("svg:g");

var voronoi = d3.geom.voronoi()
    .clipExtent([[0, 0], [width, height]]);

var line = d3.svg.line();

var path = chart.append("g").selectAll("path");
path = path.data(voronoi(sites));

path.exit().remove();
path.enter().append("path");

path.attr("class", function(d, i) { return "q" + (i % 9) + "-9"; })
    .attr("d", function(d) {
        return line(d) + "Z";
    })
    .attr("fill", "none")
    .attr("stroke", "gray");
