//-----------------------------------------------------//

// Initialize constants
const initialScale = 1;

// Initialize variables
let svg = null;
let svgRect = null;
let contextMenu = null;
let sidePanel = null;
let treeContainer = null;  // Using treeContainer for panning and zooming functionality
let width = 0;
let height = 0;
let currentScale = initialScale;
let selectedCircle = null;
let initialTransform = null;
let root = null;

//-----------------------------------------------------//

document.addEventListener("DOMContentLoaded", function()
{
  // Selecting main components
  svg = d3.select("#tree-display");
  contextMenu = d3.select("#context-menu");
  sidePanel = d3.select("#edit-person");
  treeContainer = svg.append("g");

  // Delete these lines later
  //console.log(tree_data);
  //d3.json(tree_data).then(function(treeData)

  {
    root = d3.hierarchy(tree_data);
    update(root);
  }
    
  svg.on("click", hideAll);
  // If have time write code for window resize
  //window.addEventListener("resize", update(treeData));
})

// Function mainly copied from d3.js template and by means of AI + of my own understanding
// modified for the current application of tree visualization
function update(root)
{
  svg = d3.select("#tree-display");
  svgRect = svg.node().getBoundingClientRect(); 
  width = svgRect.width;
  height = svgRect.height;
  let initialX = width * -0.0;
  let initialY = height * 0.75;
  // treeContainer.selectAll("*").remove();
  // treeContainer.attr("transform", `translate(${initialX},${initialY})`);
  // initialTransform = d3.zoomIdentity.translate(initialX, initialY).scale(0.5);

  let maxDepth = 0;
  root.each(d => {
      if (d.depth > maxDepth) {
          maxDepth = d.depth;
      }
  });

  // Setting tree size
  //let treeLayout = d3.tree().size([height, width * 0.25]);

  // let treeLayout = d3.tree().size([width * 2, height * 1.5])
  // .separation(function(a, b) {
  //   return a.depth == b.depth ? a.depth/maxDepth * 4 : 0.5;
  // });

  let treeLayout = d3.tree().nodeSize([350, 250]);

  treeContainer.selectAll("*").remove();
  treeContainer.attr("transform", `translate(${initialX},${initialY})`);
  initialTransform = d3.zoomIdentity.translate(initialX + 625, initialY).scale(initialScale);
  

  treeLayout(root); // Some treeLayout magic

  // Initializing links
  const links = treeContainer.selectAll(".link")
    .data(root.links())
    .enter().append("path")
    .attr("class", "link")
    .attr("d", d3.linkVertical()
      .x(d => d.x)
      .y(d => -d.y));
  
  // Initializing nodes which contains graphic element + circle + text for each node object
  // Why do we need to add "g" element first, I don't know....   
  const node = treeContainer.selectAll(".node")
    .data(root.descendants())
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${-d.y})`);

  
  node.exit().remove(); // Some magic for deleting nodes "without information", AI suggestion

  node.append("circle")
    .attr("r", 10)
    .on("contextmenu", function(event) {  // Binding event for right click on circle
      let node = d3.select(this.parentNode);
      showContextMenu(d3.select(this), node);
    })
    .on("mouseenter", function(event) { // Binding event for circle being hovered by mouse
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
    .text(d => d.data.name.first + " " + d.data.name.last);   

  // Merge new and updated elements
  // node.merge(node.select("g"))
  //     .transition()  // Apply transitions if needed
  //     .duration(750)
  //     .attr("transform", d => `translate(${d.x},${-d.y})`);

  // Adding zoom and panning functionality, used AI for a direction and write ~70% of my own
  var zoom = d3.zoom()      
    .on("zoom", function(event) {
      // Hide the menu  
      hideAll();
  
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
  
  // Using initial transform for preventing tree from "teleporting" while first panning
  svg.call(zoom).call(zoom.transform, initialTransform);

  // Add tree rename button functionality
  let buttons = document.getElementsByName("rename-tree");
  for(let i = 0; i < buttons.length; i++)
    {
      buttons[i].addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        let treeId = this.value;
        let aTag = this.parentElement.previousElementSibling;
        let treeName = aTag.textContent;
        let href = aTag.getAttribute("href");
        aTag.innerHTML = `<input type="text" value="${treeName}">`;
    
        aTag.addEventListener("click", function(event) {
          event.preventDefault();
        })
    
        let input = aTag.querySelector("input");
        input.addEventListener("blur", function (event) {
          //event.preventDefault();
          let newTreeName = this.value;
          aTag.innerHTML = `<a class="dropdown-item" href="${href}">${newTreeName}</a>`;
          postName(newTreeName, treeId);
        })
    
        input.addEventListener("keydown", function(event) {
          if (event.key === "Enter") {
            this.blur();
          }
        });
      })
    }
}

function showContextMenu(circle, node)
{
  d3.event.preventDefault();

  hideElement(sidePanel);

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
  contextMenu.select("#edit-button").on("click", function(event) {
    editNode(node);
  })
}

function hideElement(elmt)
{
  elmt.style("display", "none");
  resetCircle()
}

function hideAll()
{
  hideElement(contextMenu);
  hideElement(sidePanel);
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
  data.children.push({ name: {first : "Name", last: "Surname"}});
  data.children.push({ name: {first : "Name", last: "Surname"}});

  root = d3.hierarchy(root.data);

  postChanges(root.data);

  update(root);
}
// Deleting node functionality, still need to read more about data and .data
// While coding first times messed up with them
function deleteNode(node)
{
  let data = node.datum().data;
  let id = 0;
  parentNode = node.datum().parent;

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

  root = d3.hierarchy(root.data);
  
  postChanges(root.data);

  update(root);
}

function editNode(node)
{
  let data = node.datum().data;

  hideElement(contextMenu);

  console.log("edit person");
  console.log(sidePanel);
  
  sidePanel.style("left", (d3.event.pageX) + "px")
  .style("top", (d3.event.pageY) + "px")
  .style("display", "block");

  console.log(data.name.first);
  console.log(data.name.last);

  document.getElementById("fname").value = data.name.first;
  document.getElementById("lname").value = data.name.last;

  document.getElementById("update-person").addEventListener("submit", updatePerson)

  function updatePerson(event)
  {
    event.preventDefault();

    data.name.first = document.getElementById("fname").value;
    data.name.last = document.getElementById("lname").value;

    root = d3.hierarchy(root.data);

    postChanges(root.data);
  
    update(root);

    document.getElementById("update-person").removeEventListener("submit", updatePerson);
  }
}

// Completely taken from CS50.ai, still need to study this function
function postChanges(data)
{
  fetch('/treengine', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch((error) => console.error('Error:', error));
}

function postName(name, id)
{
  fetch('/treengine', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "tree_name" : name, "id" : id})
  })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch((error) => console.error('Error:', error));
}
