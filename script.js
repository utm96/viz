var counter = 0;
window.uniqueId = function () {
    return 'myid-' + counter++
}

const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([500, 10000]);

const colorScaleDomain = d3.scaleSequential(d3.interpolateReds)
    .domain([1500000, 1599000]);

const width = 1450;
const height = 924;
let data_value = undefined;
let modalData = undefined;
const chart = d3.json("/data/data_new.json").then(data => drawTreeMap(data)).then((chart) => console.log(chart));

function drawTreeMap(data) {
    data_value = data;

    function tile(node, x0, y0, x1, y1) {
        d3.treemapBinary(node, 0, 0, width, height);
        for (const child of node.children) {
            child.x0 = x0 + child.x0 / width * (x1 - x0);
            child.x1 = x0 + child.x1 / width * (x1 - x0);
            child.y0 = y0 + child.y0 / height * (y1 - y0);
            child.y1 = y0 + child.y1 / height * (y1 - y0);
        }
    }

    // Compute the layout.
    const hierarchy = d3.hierarchy(data)
        .sum(d => d.w_AI_all)
        .sort((a, b) => a.value - b.value);
    console.log(hierarchy);
    const root = d3.treemap().tile(tile)(hierarchy);

    // Create the scales.
    const x = d3.scaleLinear().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([0, height]);

    // Formatting utilities.
    const format = d3.format(",d");
    const name = d => d.ancestors().reverse().map(d => d.data.name).join("/");

    var svg = d3.select("#chart").append("svg")
        .attr("viewBox", [0.5, -30.5, width, height + 30])
        .attr("width", width)
        .attr("height", height + 30)
        .attr("style", "max-width: 100%; height: auto;")
        .style("font", "10px sans-serif");

    // Display the root.
    let group = svg.append("g")
        .call(render, root);

    function render(group, root) {
        const node = group
            .selectAll("g")
            .data(root.children.concat(root))
            .join("g");

        node.filter(d => d === root ? d.parent : d.children)
            .attr("cursor", "pointer")
            .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d))

        node.filter(d => !d.children)
            .attr("cursor", "pointer")
            .on("click", function (event, d) {
                // Update the modal content
                d3.select("#modalText").html(`Name: ${d.data.name}<br>Tasks: ${format(d.data.value)}<br>Impact: ${d.data.impact}%<br>Job Number: ${d.data.job_number}`);

                // Display the modal
                d3.select("#infoModal").style("display", "block");
                document.getElementById("modalButtons").style.display = "none";

                // If the clicked leaf node has impact > 50, do something
                if (d.data.impact >= 50) {
                    document.getElementById("modalButtons").style.display = "block";
                    data = d.parent.data.children.filter(child => child.impact < 50);
                    shuffleArray(data);
                    drawChart(data.slice(0, 10));
                }
            });

        // Close the modal when the close button is clicked
        d3.select(".close").on("click", function () {
            d3.select("#infoModal").style("display", "none");
            // Clear any existing SVG to avoid overlapping charts
            d3.select("#modalChart").selectAll("*").remove();
        });


        node.append("title")
            .text(d => `${name(d)}\n${format(d.value)}`);

        node.append("rect")
            .attr("id", d => (d.leafUid = window.uniqueId()))
            .attr("fill", function (d) {
                if (d === root) {
                    return '#fff';
                } else if (d.children) {
                    return colorScaleDomain(d.value);
                } else {
                    return d.data.w_AI_all !== undefined ? colorScale(d.data.w_AI_all) : "#fff";
                }
            })
            .attr("stroke", "#fff");


        node.append("clipPath")
            .attr("id", d => (d.clipUid = window.uniqueId()))
            .append("use")
            .attr("xlink:href", d => d.leafUid.href);

        node.append("text")
            // .attr("clip-path", d => d.clipUid)
            .attr("font-weight", d => d === root ? "bold" : null)
            .selectAll("tspan")
            .data(d => (d === root ? name(d) : d.data.name).split(/(?=[A-Z][^A-Z])/g))
            .join("tspan")
            .attr("x", 3)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
            .text(d => d);

        group.call(position, root);
    }

    function position(group, root) {
        group.selectAll("g")
            .attr("transform", d => d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`)
            .select("rect")
            .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
            .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
    }

    // When zooming in, draw the new nodes on top, and fade them in.
    function zoomin(d) {
        const group0 = group.attr("pointer-events", "none");
        const group1 = group = svg.append("g").call(render, d);

        x.domain([d.x0, d.x1]);
        y.domain([d.y0, d.y1]);

        svg.transition()
            .duration(750)
            .call(t => group0.transition(t).remove()
                .call(position, d.parent))
            .call(t => group1.transition(t)
                .attrTween("opacity", () => d3.interpolate(0, 1))
                .call(position, d));
    }

    // When zooming out, draw the old nodes on top, and fade them out.
    function zoomout(d) {
        const group0 = group.attr("pointer-events", "none");
        const group1 = group = svg.insert("g", "*").call(render, d.parent);

        x.domain([d.parent.x0, d.parent.x1]);
        y.domain([d.parent.y0, d.parent.y1]);

        svg.transition()
            .duration(750)
            .call(t => group0.transition(t).remove()
                .attrTween("opacity", () => d3.interpolate(1, 0))
                .call(position, d))
            .call(t => group1.transition(t)
                .call(position, d.parent));
    }

    // Draw a chart in the modal
    function drawChart(data) {
        modalData = data;
        updateModal('impact');
        // Add the Y-axis
        svg.append("g")
            .call(d3.axisLeft(y));
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    return svg.node();

}
// }

document.addEventListener('DOMContentLoaded', (event) => {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        const nodes = document.querySelectorAll('svg g');

        nodes.forEach(node => {
            const textElements = node.querySelectorAll('text');

            textElements.forEach(textElement => {
                textElement.style.fill = 'black';
                textElement.style.fontWeight = 'normal';

                if (textElement.textContent.toLowerCase().includes(query)) {
                    // Highlight matched text
                    textElement.style.fill = 'yellow';
                    textElement.style.fontWeight = 'bold';
                }
            });
        });



        if (query === '') {
            // If the search query is cleared, reset all highlights
            nodes.forEach(node => {
                const textElements = node.querySelectorAll('text');
                textElements.forEach(textElement => {
                    textElement.style.fill = 'black'; // Reset color or remove highlight class
                    textElement.style.fontWeight = 'normal';
                });
            });
        }
    });
});


function updateModal(selectedVar) {
    // X axis
    const margin = { top: 30, right: 20, bottom: 100, left: 50 },
        width = 550 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Clear any existing SVG to avoid overlapping charts
    d3.select("#modalChart").selectAll("*").remove();

    // Create SVG element
    const svg = d3.select("#modalChart").append("svg")
        .attr("width", width + margin.left + margin.right - 20)
        .attr("height", height + margin.top + margin.bottom + 50)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    var x = d3.scaleBand()
        .range([0, width])
        .padding(1);
    var xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")


    var y = d3.scaleLinear()
        .range([height, 0]);
    var yAxis = svg.append("g")
        .attr("class", "myYaxis")
    x.domain(modalData.map(function (d) { return d.name; }));
    xAxis.transition().duration(1000).call(d3.axisBottom(x)).selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    // Add Y axis
    y.domain([0, d3.max(modalData, function (d) { return +d[selectedVar] })]);
    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    var j = svg.selectAll(".myLine")
        .data(modalData)
    // update lines
    j
        .enter()
        .append("line")
        .attr("class", "myLine")
        .merge(j)
        .transition()
        .duration(1000)
        .attr("x1", function (d) { console.log(x(d.name)); return x(d.name); })
        .attr("x2", function (d) { return x(d.name); })
        .attr("y1", y(0))
        .attr("y2", function (d) { return y(d[selectedVar]); })
        .attr("stroke", "grey")

    var tooltip = d3.select("#modalChart")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        // .style("background", "#000")
        .text("a simple tooltip");
    // variable u: map data to existing circle
    var u = svg.selectAll("circle")
        .data(modalData)
    // update bars
    u
        .enter()
        .append("circle")
        .merge(u)
        .on("mouseover", function (event, d) { tooltip.text(d[selectedVar]); console.log(event); tooltip.style("top", (event.clientY - 10) + "px").style("left", (event.clientX + 10) + "px"); return tooltip.style("visibility", "visible"); })
        .on("mousemove", function (event, d) { return tooltip.style("top", (event.clientY - 10) + "px").style("left", (event.clientX + 10) + "px"); })
        .on("mouseout", function (d, event) { return tooltip.style("visibility", "hidden"); })
        .transition()
        .duration(1000)
        .attr("cx", function (d) { return x(d.name); })
        .attr("cy", function (d) { return y(d[selectedVar]); })
        .attr("r", 8)

        .attr("fill", "#69b3a2");
}
