function scaling() {
    var graphData = [10, 1200],
        w = 500,
        h = 800;

    var scaling = d3.scaleLinear()
        .domain([0,1200])//min and max can scale
        .range([0,w]);//actual size of canvas

    var canvas = d3.select(".graphContainer")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    var graphBar = canvas.selectAll("rect")
        .data(graphData)
        .enter()
        .append("rect")
        .attr("fill", "pink")
        .attr("width", function (d) {
            return scaling(d);
        })
        .attr("height", 20)
        .attr("y", function (d, i) {
            return i * 50;
        })
}