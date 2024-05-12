
document.addEventListener("DOMContentLoaded", function() {
    // Get pointer to SVG element
    var svg = d3.select("#mySVG");
    var rect = svg.node().getBoundingClientRect();

    // Define const
    const width = rect.width;
    const radius = 5;
    const thickness = 1.5;
    const fontSize = 5;

    // Create graph's elements
    var link;
    var node;

    const zoom = d3.zoom()
    .scaleExtent([0.5, 32])
    .on("zoom", zoomed);
    

    // Fetch doesnt work with .onload (used chatGPT to help with a problem)
    fetch('/static/flare.json')
    .then(response => response.json())
    .then(data => { 
        // This code is from D3.js and optimised for my usage 
        // Compute the tree height; this approach will allow the height of the
        // SVG to scale according to the breadth (width) of the tree layout.
        const root = d3.hierarchy(data);
        const dx = 10;
        const dy = width / (root.height + 1);
        
        // Create a tree layout.
        const tree = d3.tree().nodeSize([dx, dy]);
        
        // Sort the tree and apply the layout.
        root.sort((a, b) => d3.ascending(a.data.name, b.data.name));
        tree(root);
        
        // Compute the extent of the tree. Note that x and y are swapped here
        // because in the tree layout, x is the breadth, but when displayed, the
        // tree extends right rather than down.
        let x0 = Infinity;
        let x1 = -x0;
        root.each(d => {
            if (d.x > x1) x1 = d.x;
            if (d.x < x0) x0 = d.x;
        });
    
        // Compute the adjusted height of the tree.
        const height = x1 - x0 + dx * 2;
        
        /*const svg = d3.create("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [-dy / 3, x0 - dx, width, height])
                .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;"); */
        
        link = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", thickness)
        .selectAll()
        .data(root.links())
        .join("path")
                .attr("d", d3.linkHorizontal()
                    .x(d => d.y)
                    .y(d => d.x));
            
        node = svg.append("g")
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
        .selectAll()
        .data(root.descendants())
        .join("g")
            .attr("transform", d => `translate(${d.y},${d.x})`);
        
        node.append("circle")
            .attr("fill", d => d.children ? "#555" : "#999")
            .attr("r", radius);
        
        node.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children ? -6 : 6)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.name)
             .attr("stroke", "white")
             .attr("paint-order", "stroke")
             .attr("font-size", fontSize); 
    })
    //Zooming logic
    console.log("Tree drew");

    svg.call(zoom);

    // Zoom function
    function zoomed(/*{transform}*/) 
    {   
        const transform = d3.event.transform;
        console.log(transform.x, transform.y);

        link.attr("transform", transform)
            .attr("stroke-width", thickness / transform.k);

        node.selectAll("circle")
            .attr("transform", d => {
                var x = transform.x * (transform.k),
                    y = transform.y * (transform.k);
                return `translate(${x},${y})`
            });
        //node.selectAll("circle").attr("transform", transform);    
        node.selectAll("circle")
            .attr("r", radius * transform.k);

        node.selectAll("text")
            .attr("transform", d => {
                var x =  transform.x * transform.k,
                    y =  transform.y * transform.k;
                return `translate(${x},${y})`
            })
            .attr("font-size", fontSize * transform.k);
        // Fat lines once zoomed and text with circles disappear
        //link.attr("transform", transform).attr("stroke-width", 5 / transform.k);
        //node.attr("transform", transform).attr("stroke-width", 5 / transform.k);

        // Lines are the same but text and circles disappear
        //link.attr("transform", transform);
        //node.selectAll("circle").attr("transform", transform);
        //node.selectAll("text").attr("transform", transform)

        // node.selectAll("circle").attr("transform", d => {
        //     var x = d.x * transform.k + transform.y,
        //         y = d.y * transform.k + transform.x;
        //     return `translate(${y},${x})`;  // Note that y and x are switched depending on your layout orientation
        // })
        /*
        node.selectAll("text").attr("transform", d => {
            var newX = transform.applyX(d.y);  // Applying scaling to original positions
            var newY = transform.applyY(d.x);
            return `translate(${newX - transform.x},${newY - transform.y})`;  // Subtracting translation components
        })*/
        //link.attr("transform", transform);
        
        //node.selectAll("g")
           //.attr("transform", transform);

        /*node.selectAll("circle")
            //.attr("transform", transform)
            .attr("r", d => d.r * transform.k);
            //.attr("cx", d => (d.x * transform.k + transform.x))   
            //.attr("cy", d => (d.y * transform.k + transform.y));

        node.selectAll("text")
            .attr("transform", transform)
            .style("font-size", `${1 / transform.k * 10}px`);*/
        //link.attr("transform", transform).attr("stroke-width", 5 / transform.k)
        //const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
        //const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
        //gDot.attr("transform", transform).attr("stroke-width", 5 / transform.k);
        //gx.call(xAxis, zx);
        //gy.call(yAxis, zy);
        //gGrid.call(grid, zx, zy);
    }
}) 

// window.addEventListener("resize", function() {
//     var svg = d3.select("#mySVG");
//     var rect = svg.node().getBoundingClientRect();
    
//     // Update any SVG elements based on new dimensions
//     svg.select("circle")
//         .attr("cx", rect.width / 2)
//         .attr("cy", rect.height / 2);
// });

