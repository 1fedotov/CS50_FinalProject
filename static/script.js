//-----------------------------------------------------//

// Initialize constants
const initialScale = 1;

// Initialize variables
var svg = null;
var svgRect = null;
var contextMenu = null;
var treeContainer = null;
var width = 0;
var height = 0;
var currentScale = initialScale;
var selectedCircle = null;
var initialTransform = null;
var treeData = null;

//-----------------------------------------------------//

document.addEventListener("DOMContentLoaded", function()
{
  svg = d3.select("#tree-display");
  contextMenu = d3.select("#context-menu");

  d3.json("/static/data.json").then(function(treeData)
  {
    treeData = treeData;
    update(treeData);
  })
    
  svg.on("click", hideContextMenu);
  //window.addEventListener("resize", update(treeData));
})


function update(data)
{
  svg = d3.select("#tree-display");
  svgRect = svg.node().getBoundingClientRect(); 
  width = svgRect.width;
  height = svgRect.height;
  let initialX = width*0.125;
  let initialY = height*0.70;
  treeContainer = svg.append("g").attr("transform", `translate(${initialX},${initialY})`);
  initialTransform = d3.zoomIdentity.translate(initialX, initialY).scale(initialScale);

  let root = d3.hierarchy(data);
  let treeLayout = d3.tree().size([height, width*0.25]);

  treeLayout(root);
  
  const links = treeContainer.selectAll(".link")
    .data(root.links())
    .enter().append("path")
    .attr("class", "link")
    .attr("d", d3.linkVertical()
      .x(d => d.x)
      .y(d => -d.y));
  
  const node = treeContainer.selectAll(".node")
    .data(root.descendants(), function(d) { return d.id; })
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${-d.y})`);
  
  node.append("circle")
    .attr("r", 10)
    .on("contextmenu", function(event, d) {
      showContextMenu(d3.select(this, d));
    })
    .on("mouseenter", function(event) {
      if (selectedCircle == null)
      {
        console.log("Circle hovered");
        svg.style("cursor", "pointer");
        d3.select(this).style("stroke", "blue");
      }
    })
    .on("mouseleave", function(event) {
      if (selectedCircle == null)
      {
        console.log("Circle out");
        svg.style("cursor", "default");
        d3.select(this).style("stroke", "steelblue");
      }
    });
  
  node.append("text")
    .attr("dy", "0.35em")
    .attr("x", d => d.children ? -13 : 13)
    .style("text-anchor", d => d.children ? "end" : "start")
    .text(d => d.data.name);   

  var zoom = d3.zoom()      
    .on("zoom", function(event) {
      // Hide the menu  
      hideContextMenu();
  
      let transform = d3.event.transform;
  
      console.log(transform);
      
      // Change cursor
      if (transform.k - currentScale > 0) {
        svg.style("cursor", "zoom-in");
      } else if (transform.k - currentScale < 0) {
        svg.style('cursor', 'zoom-out');
      } else {
        svg.style('cursor', 'grabbing');
      }
  
      treeContainer.attr("transform", transform);
  
      currentScale = transform.k;
    })
    .on("end", function(event) {
      svg.style("cursor", "default");
  
    })
  
  
  svg.call(zoom).call(zoom.transform, initialTransform);
}

function showContextMenu(circle, d)
{
  d3.event.preventDefault();
  console.log(d);

  resetCircle();
  selectedCircle = circle;
  selectCircle();
  // Position and show the menu
  contextMenu.style("left", (d3.event.pageX) + "px")
  .style("top", (d3.event.pageY) + "px")
  .style("display", "block");

   // Append behavior for menu items
  contextMenu.select("#add-button").on("click", function() {
    console.log(d.data.id);
  })

}

function hideContextMenu() 
{
  contextMenu.style("display", "none");
  resetCircle();
}

function selectCircle()
{ 
  console.log("Circle selected");
  selectedCircle.style("stroke", "red");
  svg.style("cursor", "default");
}

function resetCircle()
{
  console.log("Circle reset");
  if (selectedCircle)
  {
    selectedCircle.style("stroke", "steelblue");
    selectedCircle = null;
  }
}

function addNodes()
{

}

function removeNode()
{

}

function editNode()
{

}