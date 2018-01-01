// 全局变量
var tempRefArray = new Array();
var thisGraph = this;
// main digraph srcLines,保存当前图结构
var digraphLines = '';
thisGraph.dots = {};
// 保存当前点击状态
thisGraph.state = {};
// graphviz初始化
var graphviz = d3.select("#graph").graphviz();

/**
 * 根据图结构在SVG上渲染
 * @param dotsrc 图结构
 * @param durationTime 动画持续时间
 */
function render(dotsrc, durationTime) {
    var dotSrcLines = dotsrc.split('\n');

    // 动画时间
    transition1 = d3.transition()
        .delay(100)
        .duration(durationTime);

    // 渲染图上的点
    graphviz
        .transition(transition1)
        .renderDot(dotsrc);

    // change svg width
    // 使SVG宽度与浏览器宽度一致
    graphvizSvg = d3.selectAll('svg');
    graphvizSvg.transition(transition1)
        .attr('width', document.body.clientWidth);

    var target = document.getElementById('codebox');

    d3.select(target)
        .on("mouseover", function () {
            // 当前选中的边字体加大
            for (edge in thisGraph.state) {
                var edgeElement = document.getElementById(edge);
                if (thisGraph.state[edge].isClicked === true) {
                    d3.select(edgeElement)
                        .selectAll("text")
                        .attr("fill", "red")
                        .style("font-size", '28px');
                }
                else {
                    d3.select(edgeElement)
                        .selectAll("text")
                        .attr("fill", "black")
                        .style("font-size", '14px');
                }
            }
        });

    // SVG鼠标事件
    graphvizSvg.on("mouseover", function () {

        // 当前选中的边字体加大
        for (edge in thisGraph.state) {
            var edgeElement = document.getElementById(edge);
            if (thisGraph.state[edge].isClicked === true) {
                d3.select(edgeElement)
                    .selectAll("text")
                    .attr("fill", "red")
                    .style("font-size", '28px');
            }
            else {
                d3.select(edgeElement)
                    .selectAll("text")
                    .attr("fill", "black")
                    .style("font-size", '14px');
            }
        }

        tooltipEdges = d3.selectAll('.edge');

        // 实现边的tooltip功能
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

        // 实现结点的tooltip功能
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

    /**
     * 根据边id展开或缩进子结构图
     * @param edgeId
     */
    function displayEdges(edgeId) {

        if (!thisGraph.state.hasOwnProperty(edgeId)) {
            // console.log(edgeId + " has no isClicked property");
        }
        // 若边没有被点击过,则展开子图
        else if (thisGraph.state[edgeId].isClicked === false) {
            newDotsArray = thisGraph.dots[edgeId].split('\n');

            dotSrcLinesCopy = digraphLines.split('\n');
            d3.selectAll(".tooltip").remove();
            render(digraphLines, 750);

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

            render(dotsrc, 1500);

            $(".code_line_color").each(function (i, obj) {
                if (d3.select(obj).attr("ref") === edgeId) {
                    $(".code_line_color").eq(i).css("background-color", "red");
                }
                else {
                    $(".code_line_color").eq(i).css("background-color", "transparent");
                }

            });

        }
        // 若边被点击过,则收缩子图
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
    // 点击代码区块,调整图结构
    d3.selectAll('.yes_img')
        .on("click", function () {
            var edgeId = d3.select(this).attr("ref");
            displayEdges(edgeId);
        });

    // 点击边上文字,调整图结构
    edges
        .on("click", function (d) {
            var edgeId = d.attributes.id;
            displayEdges(edgeId);
        });

}

/**
 * 代码高亮
 */
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

/**
 * 读取dot文件
 * @param dotsLines 传入的文件内容字符串
 */
function readdotsfile(dotsLines) {

    var graphLine = 0;
    var graphNameIndex;
    var graphName;
    //fuying
    var codes = "";
    for (i = 0; i < dotsLines.length; i++) {
        // 匹配"["开始
        if (dotsLines[i].indexOf("[") === 0 && graphLine === 0) {
            graphLine++;
            continue;
        }
        // 匹配"]"结束
        else if (dotsLines[i].indexOf("]") === 0) {
            graphLine = 0;
            continue;
        }

        if (graphLine === 1) {
            //extract graph name or edge name
            graphNameIndex = dotsLines[i].indexOf("{");
            //提取子图id
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
                //正则表达式提取图label
                var labelRegex = /label="(.*?)"/g;
                var labelArray = labelRegex.exec(dotsLines[i]);

                //正则表达式提取图id
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

//文件上传点击事件
d3.select("#upload-input").on("click", function () {
    document.getElementById("hidden-file-upload").click();
});
//文件上传事件处理
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

                // 清空当前网页内容
                d3.selectAll(".stx-wrap").remove();
                d3.selectAll(".node").remove();
                d3.selectAll(".edge").remove();
                d3.selectAll(".path").remove();
                d3.selectAll(".tooltip").remove();
                d3.selectAll("text").remove();

                codehighlight();

                digraphLines = thisGraph.dots["digraph"];

                var codeElement = document.getElementsByClassName("stx-left stx-text");
                codeElement["0"].innerText = "点击源代码可展开子图";

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

// 图结构删除
d3.select("#delete-graph").on("click", function () {
    tempRefArray = new Array();
    digraphLines = '';// main digraph srcLines
    thisGraph.dots = {};
    thisGraph.state = {};

    // 清空当前网页内容
    d3.selectAll(".stx-wrap").remove();
    d3.selectAll(".node").remove();
    d3.selectAll(".edge").remove();
    d3.selectAll(".path").remove();
    d3.selectAll(".tooltip").remove();
    d3.selectAll("text").remove();

    alert("图已被删除");

});

// 默认读取文件入口
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

// 更换代码高亮区块标题
window.onload = function changeTitle(){
    var codeElement = document.getElementsByClassName("stx-left stx-text");
    codeElement["0"].innerText = "点击源代码可展开子图";
};
