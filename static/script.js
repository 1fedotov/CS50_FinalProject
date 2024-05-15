//-----------------------------------------------------//

// Initialize constants
const initialScale = 1;

// Initialize variables
let svg = null;
let svgRect = null;
let contextMenu = null;
let treeContainer = null;
let width = 0;
let height = 0;
let currentScale = initialScale;
let selectedCircle = null;
let initialTransform = null;
let root = null;

//-----------------------------------------------------//

document.addEventListener("DOMContentLoaded", function()
{
  svg = d3.select("#tree-display");
  contextMenu = d3.select("#context-menu");
  treeContainer = svg.append("g");

  console.log(tree_data);

  //d3.json(tree_data).then(function(treeData)
  {
    root = d3.hierarchy(tree_data);
    update(root);
  }
    
  svg.on("click", hideContextMenu);
  //window.addEventListener("resize", update(treeData));
})


function update(root)
{
  svg = d3.select("#tree-display");
  svgRect = svg.node().getBoundingClientRect(); 
  width = svgRect.width;
  height = svgRect.height;
  let initialX = width*0.125;
  let initialY = height*0.70;
  treeContainer.selectAll("*").remove();
  treeContainer.attr("transform", `translate(${initialX},${initialY})`);
  initialTransform = d3.zoomIdentity.translate(initialX, initialY).scale(initialScale);

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
    .data(root.descendants())
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${-d.y})`);

  node.exit().remove();

  node.append("circle")
    .attr("r", 10)
    .on("contextmenu", function(event) {
      let node = d3.select(this.parentNode);
      showContextMenu(d3.select(this), node);
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

  // Merge new and updated elements
  // node.merge(node.select("g"))
  //     .transition()  // Apply transitions if needed
  //     .duration(750)
  //     .attr("transform", d => `translate(${d.x},${-d.y})`);

  var zoom = d3.zoom()      
    .on("zoom", function(event) {
      // Hide the menu  
      hideContextMenu();
  
      let transform = d3.event.transform;
      
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

function showContextMenu(circle, node)
{
  d3.event.preventDefault();

  resetCircle();
  selectedCircle = circle;
  selectCircle();
  // Position and show the menu
  contextMenu.style("left", (d3.event.pageX) + "px")
  .style("top", (d3.event.pageY) + "px")
  .style("display", "block");

   // Append behavior for menu items
  contextMenu.select("#add-button").on("click", function() {
    addNodes(node);
  })
  contextMenu.select("#delete-button").on("click", function() {
    deleteNode(node);
  })
  // contextMenu.select("#edit-button").on("click", function() {
  //   editNode(node);
  // })


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

function addNodes(node)
{
  let data = node.datum().data;

  console.log("adding children to " + data.name);
  if(!data.children)
    {
      console.log("creating children array");
      data.children = [];
    }
  data.children.push({ name: "Parent1"});
  data.children.push({ name: "Parent2"});

  console.log(root.descendants());

  root = d3.hierarchy(root.data);

  console.log(root.descendants());

  update(root);
}
// TO DO!!
function deleteNode(node)
{
  let data = node.datum().data;
  let id = 0;
  parentNode = node.datum().parent;

  console.log(data.children);

  if(data.name == "Root")
    {
      console.log("Can't delete root node!");
      return false;
    }

  if(data.children && data.children.length != 0)
    {
      console.log("Can't delete a node with parents! Remove parents first.");
      return false;
    }

  for (let i = 0; i < parentNode.children.length; i++) {
    if (parentNode.children[i].data.name === data.name) {
      id = i;
    }
  }

  console.log("Removing node: " + parentNode.children[id].data.name)
  parentNode.data.children.splice(id, 1); // Remove the node
  console.log("branch removed!");

  console.log(root.descendants());

  root = d3.hierarchy(root.data);

  console.log(root.descendants());
  
  update(root);
}

// function editNode()
// {

// }