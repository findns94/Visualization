function transitions() {
    var w = 800,
        h = 600;

    var canvas = d3.select(".transitionsContainer")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    var rect = canvas.append("rect")
        .attr("width", 100)
        .attr("height", 100)
        .attr("fill", "red");

    var circle = canvas.append("circle")
        .attr("cx", 50)
        .attr("cy", 200)
        .attr("r", 50)
        .attr("fill", "blue");

    circle.transition()
        .duration(2000)
        .delay(4000)
        .attr("cx", 200)
        .on("end",function () {
           d3.select(this)
               .attr("fill","orange");
        });

    rect.transition()
        .duration(1000)
        .delay(2000)
        .attr("width", 200)
        //.attr("x",200)// no animation
        .attr("transform","translate(200,0)")// allow animation
        .transition()
        .attr("transform","translate(200,200)")
        .on("start",function () {
            d3.select(this)
                .attr("fill","green");
        })

}