var tempRefArray = new Array();
var thisGraph = this;
var digraphLines = '';// main digraph srcLines
thisGraph.dots = {};
thisGraph.state = {};
var graphviz = d3.select("#graph").graphviz();


function render(dotsrc, durationTime) {
    var dotSrcLines = dotsrc.split('\n');
    //console.log(dotSrcLines);
    transition1 = d3.transition()
        .delay(100)
        .duration(durationTime);

    graphviz
        .transition(transition1)
        .renderDot(dotsrc);

    //change svg width
    graphvizSvg = d3.selectAll('svg');
    graphvizSvg.transition(transition1)
        .attr('width', document.body.clientWidth);

    graphvizSvg.on("mouseover", function () {
        for (edge in thisGraph.state) {
            if (thisGraph.state[edge].isClicked === true) {
                var edgeElement = document.getElementById(edge);

                d3.select(edgeElement)
                    .selectAll("text")
                    .attr("fill", "red")
                    .style("font-size", '28px');
            }
            else {
                var edgeElement = document.getElementById(edge);

                d3.select(edgeElement)
                    .selectAll("text")
                    .attr("fill", "black")
                    .style("font-size", '14px');
            }
        }

        tooltipEdges = d3.selectAll('.edge');

        tooltipEdges
            .on("mouseover", function (d) {

                //fuying
                var edgelabel = d3.select(this)
                    .select("text")
                    .text();

                tooltip.html(edgelabel)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 30) + "px")
                    .style("opacity", 1.0);

                d3.select(this)
                    .selectAll("text")
                    .transition()
                    .style("fill", "red");

            })
            //fuying
            .on("mousemove", function (d) {
                tooltip.style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 30) + "px");
            })
            .on("mouseout", function (d) {

                var edgeId = this.id;

                d3.select(this)
                    .selectAll("text")
                    .transition()
                    .style("fill", function () {
                        if (thisGraph.state.hasOwnProperty(edgeId) && thisGraph.state[edgeId].isClicked === true) {

                            return "red";
                        }
                        else {

                            return "black";
                        }
                    });
                //fuying
                tooltip.style("opacity", 0.0);
            });

        tooltipNodes = d3.selectAll('.node');

        tooltipNodes
            .on("mouseover", function (d) {

                //fuying
                var edgelabel = d3.select(this)
                    .select("text")
                    .text();

                tooltip.html(edgelabel)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px")
                    .style("opacity", 1.0);

            })
            //fuying
            .on("mousemove", function (d) {
                tooltip.style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 20) + "px");
            })
            .on("mouseout", function (d) {

                //fuying
                tooltip.style("opacity", 0.0);
            });
    });

    edges = d3.selectAll('.edge');

    //fuying
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0.0);


    var newDotsArray;

    function displayEdges(edgeId) {

        if (!thisGraph.state.hasOwnProperty(edgeId)) {
            // console.log(edgeId + " has no isClicked property");
        }
        else if (thisGraph.state[edgeId].isClicked === false) {
            newDotsArray = thisGraph.dots[edgeId].split('\n');


            dotSrcLinesCopy = digraphLines.split('\n');
            d3.selectAll(".tooltip").remove();
            render(digraphLines, 1000);

            for (i = 0; i < newDotsArray.length; i++) {
                if (newDotsArray[i] !== "") {
                    //add lines
                    dotSrcLinesCopy.splice(-2, 0, newDotsArray[i]);
                }
            }

            for (i in thisGraph.state) {
                thisGraph.state[i].isClicked = false;
            }

            thisGraph.state[edgeId].isClicked = true;

            dotsrc = dotSrcLinesCopy.join('\n');
            //fuying
            d3.selectAll(".tooltip").remove();

            render(dotsrc, 2000);

            $(".code_line_color").each(function (i, obj) {
                if (d3.select(obj).attr("ref") === edgeId) {
                    $(".code_line_color").eq(i).css("background-color", "red");
                }
                else {
                    $(".code_line_color").eq(i).css("background-color", "transparent");
                }

            });


        }
        else {
            newDotsArray = thisGraph.dots[edgeId].split('\n');

            for (i = 0; i < newDotsArray.length; i++) {
                if (newDotsArray[i] !== "") {
                    var deleteIndex = dotSrcLines.indexOf(newDotsArray[i]);
                    // delete lines
                    dotSrcLines.splice(deleteIndex, 1);
                }
            }

            thisGraph.state[edgeId].isClicked = false;
            dotsrc = dotSrcLines.join('\n');

            //fuying
            d3.selectAll(".tooltip").remove();
            render(dotsrc, 1000);

            $(".code_line_color:nth-child(odd)").css("background", "rgb(236, 236, 236)");
            $(".code_line_color:nth-child(even)").css("background", "rgb(244, 244, 244)");


        }
    }

    //fuying

    d3.selectAll('.yes_img')
        .on("click", function () {
            var edgeId = d3.select(this).attr("ref");
            displayEdges(edgeId);
        });

    edges
        .on("click", function (d) {
            var edgeId = d.attributes.id;
            displayEdges(edgeId);
        });


}

function codehighlight() {
    var target = document.getElementById('codebox');
    var syntaxy = new Syntaxy(target, {});
    syntaxy.render();

    var maxLen = 0;
    // add class to show image
    $(".code_line_color").each(function (i, obj) {
        if (thisGraph.state.hasOwnProperty(d3.select(obj).attr("ref"))) {
            $(".code_line_color").eq(i).addClass("yes_img");
        }
    });

}

function readdotsfile(dotsLines) {

    var graphLine = 0;
    var graphNameIndex;
    var graphName;
    //fuying
    var codes = "";
    for (i = 0; i < dotsLines.length; i++) {
        if (dotsLines[i].indexOf("[") === 0 && graphLine === 0) {
            graphLine++;
            continue;
        }
        else if (dotsLines[i].indexOf("]") === 0) {
            graphLine = 0;
            continue;
        }

        if (graphLine === 1) {
            //extract graph name or edge name
            graphNameIndex = dotsLines[i].indexOf("{");
            graphName = dotsLines[i].slice(0, graphNameIndex).trim();

            if (graphName !== "digraph") {
                thisGraph.state[graphName] = {
                    isClicked: false
                };
                thisGraph.dots[graphName] = "";
            }
            else {
                thisGraph.dots[graphName] = dotsLines[i] + "\n";
            }

            graphLine++;
            continue;
        }
        else {
            if (dotsLines[i].indexOf("}") >= 0 && graphName !== "digraph" || dotsLines[i].trim() === "") {
                continue;
            }

            if (dotsLines[i].indexOf("->") >= 0 && graphName === "digraph") {
                var labelRegex = /label="(.*?)"/g;
                var labelArray = labelRegex.exec(dotsLines[i]);

                var idRegex = /id="(.*?)"/g;
                var idArray = idRegex.exec(dotsLines[i]);

                tempRefArray.push(idArray[1]);
                codes = codes + labelArray[1] + "\n"

            }
            d3.select("#codebox").text(codes);
            thisGraph.dots[graphName] += dotsLines[i] + "\n";
        }

    }
}


d3.select("#upload-input").on("click", function () {
    document.getElementById("hidden-file-upload").click();
});
d3.select("#hidden-file-upload").on("change", function () {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        var uploadFile = this.files[0];
        var filereader = new window.FileReader();
        thisGraph.codes = "";

        filereader.onload = function () {
            var dotsfile = filereader.result;

            try {

                tempRefArray = new Array();
                digraphLines = '';// main digraph srcLines
                thisGraph.dots = {};
                thisGraph.state = {};

                var dotsLines = dotsfile.split('\n');

                readdotsfile(dotsLines);
                d3.selectAll(".stx-wrap").remove();
                d3.selectAll(".node").remove();
                d3.selectAll(".edge").remove();
                d3.selectAll(".path").remove();
                d3.selectAll(".tooltip").remove();
                d3.selectAll("text").remove();


                codehighlight();

                digraphLines = thisGraph.dots["digraph"];
                render(thisGraph.dots["digraph"], 1000);

            } catch (err) {
                window.alert("Error parsing uploaded file\nerror message: " + err.message);
                return;
            }

        };
        filereader.readAsText(uploadFile);

    } else {
        alert("Your browser won't let you save this graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
    }

});

d3.select("#delete-graph").on("click", function () {

    tempRefArray = new Array();
    digraphLines = '';// main digraph srcLines
    thisGraph.dots = {};
    thisGraph.state = {};

    // d3.selectAll("path").remove();// remove existing path
    d3.selectAll(".stx-wrap").remove();
    d3.selectAll(".node").remove();
    d3.selectAll(".edge").remove();
    d3.selectAll(".path").remove();
    d3.selectAll(".tooltip").remove();
    d3.selectAll("text").remove();


});

d3.request("../data/new.dot")
    .mimeType("text/plain")
    .get(function (data) {
        var dots = data.response;
        var dotsLines = dots.split('\n');

        readdotsfile(dotsLines);

        codehighlight();

        digraphLines = thisGraph.dots["digraph"];

        render(thisGraph.dots["digraph"], 1000);

    });