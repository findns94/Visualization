function barGraph() {
    //variables
    var margin = {top: 20, right: 20, bottom: 100, left: 60},
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        x = d3.scaleBand().rangeRound([30, width]).paddingInner(0.5),
        y = d3.scaleLinear().range([height, 0]);

    //draw axis
    var xAxis = d3.axisBottom()
        .scale(x);

    var yAxis = d3.axisLeft()
        .scale(y)
        .ticks(5)
        .tickSizeInner(-width)
        .tickSizeOuter(0)
        .tickPadding(10);

    var svg = d3.select("#barGraph")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 100)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("data/suicide-squad.json", function (data) {
        x.domain(data.map(function (d) {
            return d.name;
        }));

        y.domain([0, d3.max(data, function (d) {
            return d.rank;
        })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "-.55em")
            .attr("y", 30)
            .attr("transform", "rotate(-45)");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            // .append("text")
            // .attr("transform", "rotate(-90)")
            // .attr("y", 5)
            // .attr("dy", "0.8em")
            // .style("text-anchor", "end")
            // .text("Member Rank")
            ;

        // padding = 100; // space around the chart, not including labels
        //
        svg.append("text")
            .attr("text-anchor", "end")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("dy", "0.8em")
            .attr("y", 5)
            .attr("x", 15)
            .attr("transform", "rotate(-90)")
            .text("Member Rank");

        svg.selectAll("bar")
            .data(data)
            .enter()
            .append("rect")
            .style("fill", "orange")
            .attr("x", function (d) {
                return x(d.name);
            })
            .attr("width", x.bandwidth())
            .attr("y", function (d) {
                return y(d.rank);
            })
            .attr("height", function (d) {
                return height - y(d.rank);
            })
            .on("mouseover", function () {
                tooltip.style("display", null);
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            })
            .on("mousemove", function (d) {
                var xPos = d3.mouse(this)[0] - 55;
                var yPos = d3.mouse(this)[1] - 55;
                tooltip.attr("transform", "translate(" + xPos + "," + yPos + ")");
                tooltip.select("text").text(d.name + " : " + d.rank);
            });

        var tooltip = svg.append("g")
            .attr("class", "tooltip")
            .style("display", "none");

        tooltip.append("text")
            .attr("x", 15)
            .attr("dy", "1.2em")
            .style("font-size", "1.25em")
            .attr("font-weight", "bold");
    })
}