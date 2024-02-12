var counter = 0;
window.uniqueId = function () {
    return 'myid-' + counter++
}

const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([500, 10000]);

const colorScaleDomain = d3.scaleSequential(d3.interpolateReds)
    .domain([1500000, 1599000]);
// console.log('hello');
// var margin = {top: 20, right: 0, bottom: 0, left: 0},
//     width = 960,
//     height = 500 - margin.top - margin.bottom,
//     formatNumber = d3.format(",d"),
//     transitioning;
const width = 1450;
const height = 924;

const chart = d3.json("/data/new_data.json").then(function (data) {
    console.log("loaded data")



    // This custom tiling function adapts the built-in binary tiling function
    // for the appropriate aspect ratio when the treemap is zoomed-in.
    function tile(node, x0, y0, x1, y1) {
        d3.treemapBinary(node, 0, 0, width, height);
        for (const child of node.children) {
            child.x0 = x0 + child.x0 / width * (x1 - x0);
            child.x1 = x0 + child.x1 / width * (x1 - x0);
            child.y0 = y0 + child.y0 / height * (y1 - y0);
            child.y1 = y0 + child.y1 / height * (y1 - y0);
        }
    }
    console.log(data);

    // Compute the layout.
    const hierarchy = d3.hierarchy(data)
        .sum(d => d.w_AI)
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
        console.log(root);
        const node = group
            .selectAll("g")
            .data(root.children.concat(root))
            .join("g");

        node.filter(d => d === root ? d.parent : d.children)
            .attr("cursor", "pointer")
            .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d));

        node.append("title")
            .text(d => `${name(d)}\n${format(d.value)}`);

        node.append("rect")
            .attr("id", d => (d.leafUid = window.uniqueId()))
            .attr("fill", function (d) {
                // Check if the current node is the root or has children to apply different logic
                if (d === root) {
                    // Apply color shading to the root based on its w_AI value
                    return '#fff'; // Using d.value which is the sum for the root node
                } else if (d.children) {
                    // Apply a different shading for parents (non-leaf nodes)
                    return colorScaleDomain(d.value);
                } else {
                    // Apply color shading for leaves based on w_AI_percent
                    return d.data.w_AI !== undefined ? colorScale(d.data.w_AI) : "#fff";
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
    // d3.select("#chart").append(svg.node());

    return svg.node();

}).then((chart) => console.log(chart))
    ;


