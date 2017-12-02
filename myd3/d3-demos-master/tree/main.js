/**
 * borrowed from https://bl.ocks.org/jiankuang/2addc9c0c5cea5370a5535270c874531
 */

var chart = d3.select("body").append("svg")
    .attr("width", 960)
    .attr("height", 960)
    .append("g")
    .attr("transform", "translate(50, 400)");

var tree = d3.layout.tree()
    .size([860, 400])
    .nodeSize([20, 120]);

d3.json("../data/tree.json", function(data) {
    var nodes = tree.nodes(data); // create data nodes suitable for tree structure
    var links = tree.links(nodes); // create links to connect source(parent) and target(child) nodes

    var nodes = chart.selectAll(".node")
        .data(nodes).enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d){ return "translate(" + d.y + "," + d.x + ")"; }); // flip x and y of nodes

    nodes.append("circle")
        .attr("r", 5)
        .attr("fill", "steelblue");
    nodes.append("text")
        .text(function(d){ return d.name; })
        .attr("text-anchor", "start")
        .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .attr("dy", ".35em");

    var diagonal = d3.svg.diagonal()
        .projection(function(d){ return [d.y, d.x]; }); // flip x and y of links

    chart.selectAll(".link")
        .data(links).enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none").attr("stroke", "#ADADAD")
        .attr("d", diagonal);

});