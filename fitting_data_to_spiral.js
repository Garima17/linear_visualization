
//these variables are use to update the charts based on settings
var global_data;
var global_data_unchanged;
var global_data_sorted;//
let gBrush;
let brush;
let brushFlag =0
let densityColFlag = 1
let degreeColFlag = 0
let closenessColFlag = 0
let betweennessColFlag = 0
let eignColFlag = 0
let global_radius = 2
let new_data1;
let domain_for_community_legend=[]
let range_for_community_legend=[]
let adjacent_community
let edge_strength_scale
let edge_strength_scale_highlight
var computed_total_community_height = 0;


let find_node_id = -1;
//let optimal_no_of_nodes =0;

var flag_most_connected_nodes = 0
var most_connected_nodes_data;
var connections_list;
var community_connections_list;
var extent_of_centralities_after_removing_outliers;

var activeCommunity =200;

var     idleTimeout,
idleDelay = 350;

var highlight_table_node = -1;

var table = d3.select("#table-location")
	.append("table")
	.attr("class", "table table-condensed table-striped"),
	thead = table.append("thead"),
	tbody = table.append("tbody");


  function show_edge_tooltip(source, target, weight){
    //d3.select("#connection_tooltip").html("Community "+ source +" and " +target+ " share "+ weight + " links.")
  }

function draw_textbox(data, adjacent_nodes, activeNode, count, deg, bet, clo, eig){

  var centrality_data = data.map(function(d){return d.centrality})
  count =0
  console.log(data.forEach((d)=>{
    if (adjacent_nodes.includes(d.node))
    count = count +1

  }))

  var margin = {top: 10, right: 30, bottom: 30, left: 40},
      width = 250 - margin.left - margin.right,
      height = 250 - margin.top - margin.bottom;

  var inter_community_connections =adjacent_nodes.length - count;

  // Build node feature string conditionally
  var featureHtml = "";
  if (Object.keys(nodeFeatureLookup).length > 0) {
    var colLabel = nodeFeatureColumnName ? (nodeFeatureColumnName.charAt(0).toUpperCase() + nodeFeatureColumnName.slice(1).replace(/_/g, ' ')) : "Feature";
    var fieldVal = nodeFeatureLookup.hasOwnProperty(activeNode) ? nodeFeatureLookup[activeNode] : -1;
    // For mapping like CS fields, use FIELD_NAMES if present, else just show the raw value.
    var fieldName = typeof FIELD_NAMES !== 'undefined' && FIELD_NAMES.hasOwnProperty(fieldVal) ? FIELD_NAMES[fieldVal] : (fieldVal === -1 ? "Unknown" : fieldVal);
    featureHtml = "<b>" + colLabel + ": </b>" + fieldName + "<br/>";
  }

  d3.select("#node_textbox").select("svg").remove()
  //d3.select("#node_textbox").html("")

  // append the svg object to the body of the page
  var svg = d3.select("#node_textbox")
      .html("<b>Node of interest: </b>"+ activeNode +"<br/>" + featureHtml +"<b>Degree: </b>"+ deg +"<br/>" +"<b>Closeness: </b>"+ clo +"<br/>" + "<b>Betweenness: </b>"+ bet +"<br/>" +"<b>Eigen: </b>"+ eig +"<br/>" + "<br/>"
       + "<b>Total edges:</b> " + adjacent_nodes.length + "<br/>" +
       "<b>Intra-community node-to-node edges:</b> " + count + "<br/>" +
       "<b>Inter-community node-to-node edges:</b> " + inter_community_connections + "<br/>" +
       "<b>List of Adjacent nodes:</b> " + adjacent_nodes+"<br/>"+"<br/>")
       .style("font-size", "17px")

}


function draw_textbox_community_connections(){

  var output_number_of_inter_community_links = coarse_graph.links.filter(function(d){ if(d.source.id==activeCommunity || d.target.id == activeCommunity)
  return d})

  output_number_of_inter_community_links = output_number_of_inter_community_links.map(d=> ({
    
    source : +d.source.id,
    target : +d.target.id,
    weight : +d.WEIGHT
  }))
  

  console.log(output_number_of_inter_community_links)

  var margin = {top: 10, right: 30, bottom: 30, left: 40},
      width = 250 - margin.left - margin.right,
      height = 250 - margin.top - margin.bottom;

  d3.select("#community_textbox").select("svg").remove()
  d3.select("#node_textbox").html("")
  d3.select("#community_connection_textbox").html("")
  d3.select("#community_barchart").select("svg").remove()
  d3.select("#community_barchart").html("")


  //console.log(active_community)
  let display_size
  community_size_data.forEach(function(d){
    //console.log(d.community, activeCommunity)
    if(d.community == activeCommunity)
    display_size = d.size})
  let display_density 
  heighest_density_data.forEach(function(d){
    if(d.community == activeCommunity)
        display_density = d.density})

        //community_size_data[activeCommunity].size

 // community_size_data.sort(function(a,b){return d3.descending(a.size,b.size)})
  //heighest_density_data.sort(function(a,b){return d3.descending(a.density,b.density)})

  // append the svg object to the body of the page
  var svg = d3.select("#community_textbox")
      .html("<b>Community: </b>"+ "<b>"+activeCommunity +"</b>" +
      "<br/>" +"<b>Number_of_node: </b>"+"<b>"+display_size +"</b>"+
      "<br/>" +"<b>Edge_density: </b>"+"<b>"+ display_density +"</b>"+
      "<br/>" + "<br/>" + "<b>Community Connections:</b> "+  "<br/>" )
       .style("font-size", "18px")
       
      
       output_number_of_inter_community_links.sort(function(a,b){return d3.descending(a.weight,b.weight)})
       output_number_of_inter_community_links.forEach((item) => {
      
        d3.select("#community_connection_textbox").append("li").html("<b>"+item.source+"&nbsp-&nbsp"+item.target+"</b>"+"&nbsp&nbsp:&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp"+ "<b>"+item.weight + "</b>"+"<br/>").style("font-size", "17px");
       
    }); 

  // Draw bar chart of node types if feature data is available
  draw_community_feature_barchart(activeCommunity);
}


// Draw a horizontal bar chart showing the distribution of node feature types
// within a given community. Only renders when nodeFeatureLookup has data.
// Works with any dataset — uses FIELD_NAMES for labels with fallback to raw values.
function draw_community_feature_barchart(communityId) {
  // Clear previous
  d3.select("#community_barchart").select("svg").remove();
  d3.select("#community_barchart").selectAll("div").remove();

  // Only draw if we have node feature data
  if (!nodeFeatureLookup || Object.keys(nodeFeatureLookup).length === 0) return;

  // Get nodes in this community
  var communityNodes = global_data_unchanged.filter(function(d) {
    return d.community == communityId;
  });

  if (communityNodes.length === 0) return;

  // Count by feature field
  var fieldCounts = {};
  communityNodes.forEach(function(d) {
    var field = -1;
    if (nodeFeatureLookup.hasOwnProperty(d.node)) {
      field = nodeFeatureLookup[d.node];
    }
    // Get display name: use FIELD_NAMES mapping if it exists, otherwise use raw value
    var fieldName;
    if (typeof FIELD_NAMES !== 'undefined' && FIELD_NAMES.hasOwnProperty(field)) {
      fieldName = FIELD_NAMES[field];
    } else if (field === -1) {
      fieldName = "Unknown";
    } else {
      fieldName = String(field);
    }
    if (!fieldCounts[fieldName]) fieldCounts[fieldName] = 0;
    fieldCounts[fieldName]++;
  });

  // Convert to array and sort descending
  var barData = Object.keys(fieldCounts).map(function(key) {
    return { label: key, value: fieldCounts[key] };
  });
  barData.sort(function(a, b) { return b.value - a.value; });

  // Dimensions
  var margin = { top: 28, right: 20, bottom: 20, left: 110 },
      chartWidth = 320 - margin.left - margin.right,
      barHeight = 18,
      barGap = 3,
      chartHeight = barData.length * (barHeight + barGap);

  // Cap height
  var maxHeight = 300;
  if (chartHeight > maxHeight) chartHeight = maxHeight;

  // Title
  var featureLabel = nodeFeatureColumnName
    ? nodeFeatureColumnName.replace(/_/g, ' ')
    : "Node Type";
  d3.select("#community_barchart")
    .append("div")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("margin-bottom", "4px")
    .style("margin-top", "8px")
    .text(featureLabel.charAt(0).toUpperCase() + featureLabel.slice(1) + " Distribution");

  // Color scale
  var barColors = [
    "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
    "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
    "#af7aa1", "#86bcb6", "#d37295", "#8cd17d", "#b6992d",
    "#499894"
  ];
  var color = d3.scaleOrdinal()
    .domain(barData.map(function(d) { return d.label; }))
    .range(barColors);

  // Scales
  var xScale = d3.scaleLinear()
    .domain([0, d3.max(barData, function(d) { return d.value; })])
    .range([0, chartWidth]);

  var yScale = d3.scaleBand()
    .domain(barData.map(function(d) { return d.label; }))
    .range([0, chartHeight])
    .padding(0.15);

  // SVG
  var svg = d3.select("#community_barchart")
    .append("svg")
      .attr("width", chartWidth + margin.left + margin.right)
      .attr("height", chartHeight + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Tooltip
  var barTooltip = d3.select("body").select(".bar-feature-tooltip");
  if (barTooltip.empty()) {
    barTooltip = d3.select("body").append("div")
      .attr("class", "bar-feature-tooltip tooltip")
      .style("opacity", 0);
  }

  // Bars
  svg.selectAll(".feature-bar")
    .data(barData)
    .enter()
    .append("rect")
      .attr("class", "feature-bar")
      .attr("x", 0)
      .attr("y", function(d) { return yScale(d.label); })
      .attr("width", 0)
      .attr("height", yScale.bandwidth())
      .attr("fill", function(d) { return color(d.label); })
      .attr("rx", 3)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 0.8);
        var pct = ((d.value / communityNodes.length) * 100).toFixed(1);
        barTooltip.transition().duration(150).style("opacity", 0.95);
        barTooltip.html("<b>" + d.label + "</b><br/>" + d.value + " nodes (" + pct + "%)")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px")
          .style("text-align", "left");
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 1);
        barTooltip.transition().duration(300).style("opacity", 0);
      })
      .transition()
      .duration(400)
      .attr("width", function(d) { return xScale(d.value); });

  // Value labels on bars
  svg.selectAll(".feature-bar-label")
    .data(barData)
    .enter()
    .append("text")
      .attr("class", "feature-bar-label")
      .attr("x", function(d) { return xScale(d.value) + 4; })
      .attr("y", function(d) { return yScale(d.label) + yScale.bandwidth() / 2; })
      .attr("dy", "0.35em")
      .style("font-size", "10px")
      .style("fill", "#333")
      .text(function(d) { return d.value; });

  // Y axis (labels)
  svg.append("g")
    .call(d3.axisLeft(yScale).tickSize(0))
    .select(".domain").remove();

  svg.selectAll(".tick text")
    .style("font-size", "10px");
}


function draw_histogram(centrality_data, width, height){

console.log(centrality_data)

  // Generate a histogram using twenty uniformly-spaced bins.
  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 40, bottom: 50, left: 50},
      width = 300 - margin.left - margin.right,
      height = 250 - margin.top - margin.bottom;

  d3.select("#community_histogram").select("svg").remove()

  // append the svg object to the body of the page
  var svg = d3.select("#community_histogram")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    // X axis: scale and draw:
    var max = d3.max(centrality_data);
    var min = d3.min(centrality_data);

    var x = d3.scaleLinear()
          .domain([min, max])
          .range([0, width]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
  .style("text-anchor", "end")
  .attr("dx", "-.8em")
  .attr("dy", ".15em")
  .style("font-size", 14)
  .attr("transform", "rotate(-65)");

    // text label for the x axis
    svg.append("text")
        .attr("x", width/2)
        .attr("y", height + margin.top + 40)
         .style("text-anchor", "middle")
         .attr("dx", "1em")
         .attr("fill", "black")
         .style("font-size", 14)
         .text("Degree-centrality");

    // set the parameters for the histogram
    var histogram = d3.histogram()
        .value(function(d) { return d; })   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(10)); // then the numbers of bins

    // And apply this function to data to get the bins
    var bins = histogram(centrality_data);

    // Y axis: scale and draw:
    var y = d3.scaleLinear()
        .range([height, 0]);
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    //label y-axis
    svg.append("g")
        .call(d3.axisLeft(y))
        .style("font-size", 14)
        .call(g => g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("fill", "black")
        .text("Number of Nodes"));

    // append the bar rectangles to the svg element
    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
          .attr("x", 1)
          .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
          .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
          .attr("height", function(d) { return height - y(d.length); })
          .style("fill", "teal")


  ////end of function

}


// the spiral is drawn in a seperate window on find node functionality
function find_node_draw_spiral(new_data1){

  var width = 400,
  height = 300;

let centerX = 150,
centerY = 150,
radius = 250,
sides = 1000,
coils = 20,
rotation = 0;
let count =0;
    let awayStep = radius/sides
    // How far to rotate around center for each side.
    let aroundStep = coils/sides
    // Convert aroundStep to radians.
    let aroundRadians = aroundStep * 2 * 3.14;
    // Convert rotation to radians.
     rotation *= 2 * 3.14;

     no_of_points_in_community = new_data1.length

     for (i=0; i<no_of_points_in_community;i++){
         //How far away from center
         away = i * awayStep;
         // How far around the center.


         around = i * aroundRadians + rotation;



         new_data1[i]['new_x'] = centerX + Math.cos(around) * (away );
         new_data1[i]['new_y'] = centerY + Math.sin(around) * (away);

         if (new_data1[i]['node']== find_node_id)
         {
          xCoordinateOfActiveNode_new = new_data1[i]['new_x']
          yCoordinateOfActiveNode_new = new_data1[i]['new_y']
          deg = new_data1[i]['centrality']
          clo = new_data1[i]['closeness']
          bet = new_data1[i]['betwness']
          eig = new_data1[i]['eign']
         }
     }

let adjacent_nodes_find_node = connections_list[find_node_id]
d3.select("#community_spiral").select("svg").remove()
d3.select("#node_spiral").select("svg").remove()
d3.select("#community_textbox").html("")
d3.select("#community_piechart").html("")

var svg_community = d3.select("#community_spiral").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g");



var circles = svg_community.selectAll("circle")
                .data(new_data1)
              .enter()
                .append("circle")
                .attr("cx", function (d) { return d.new_x; })
                .attr("cy", function (d) { return d.new_y; })
                .attr("r", function(d){
                  if (d.node == find_node_id)
                    return 5
                  else
                    return 2;})
                .style("fill", function(d){
                  if (d.node == find_node_id)
                    return "black"

                  if (adjacent_nodes_find_node.includes(d.node)){
                    count =count+1
                    svg_community.append('line')
                    //.attr("class", "adjacent_edges")
                          .style("stroke", "#253494" )
                          .style("strokeOpacity",.5)
                          .style("stroke-width",1.5)


                          .attr("x1",xCoordinateOfActiveNode_new)
                          .attr("y1", yCoordinateOfActiveNode_new)
                          .attr("x2", d.new_x)
                          .attr("y2", d.new_y)
                    return "#253494"}
                  
                  else
                  {
                    if (densityColFlag ==1)
                      return colorscaleDensity(d.density);

                    else if (degreeColFlag==1){
                      if (d.centrality>extent_of_centralities_after_removing_outliers.degree_range[1])
                        return "black"
                      else
                      return colorscaleDegree(d.centrality);
                    }

                    else if (closenessColFlag==1){
                      if (d.closeness > extent_of_centralities_after_removing_outliers.closeness_range[1])
                        return "black"
                      else
                        return colorscaleCloseness(d.closeness);
                      }

                    else if (betweennessColFlag==1){
                      if (d.betwness > extent_of_centralities_after_removing_outliers.betwness_range[1])
                        return "black"
                      else
                        return colorscaleBetwness(d.betwness);
                    }

                    else if (eignColFlag==1){
                      if (d.eign > extent_of_centralities_after_removing_outliers.eign_range[1])
                        return "black"
                      else
                        return (colorscaleEign(d.eign))
                    }

                  } });

//also draw histogram for centrality disrtibution
var centrality_data = new_data1.map(function(d){return d.centrality})

//draw_histogram(centrality_data, width,height)
//chage the draw textbox for findnode functionality
//draw_textbox(new_data1)
draw_textbox(new_data1, adjacent_nodes_find_node, find_node_id, count, deg, bet, clo, eig)
//console.log(adjacent_nodes_find_node)

}


// draw spiral in side window on click community
function draw_spiral(new_data1, adjacent_nodes, activeNode){

  var width = 400,
      height = 300;



     no_of_points_in_community = new_data1.length

     for (i=0; i<no_of_points_in_community;i++){

         if (new_data1[i]['node']== activeNode)
         {
          deg = new_data1[i]['centrality']
          clo = new_data1[i]['closeness']
          bet = new_data1[i]['betwness']
          eig = new_data1[i]['eign']
          
         }

     }


d3.select("#node_spiral").select("svg").remove()


//for time being
//draw_histogram(centrality_data, width,height)
draw_textbox(new_data1, adjacent_nodes, activeNode, no_of_points_in_community , deg, bet, clo, eig)
console.log(adjacent_nodes)

}













var svg_community

// draw spiral in side window on click community
function draw_coarse_graph_in_side_window( adjacent_nodes, activeNode){
console.log("inside_coarse")
let bodyHeight = 200
let bodyWidth = 400
var width = 400,
    height = 300;

d3.select("#community_spiral").select("svg").remove()
d3.select("#node_spiral").select("svg").remove()

 svg_community = d3.select("#community_spiral").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g");



  //calcolate scale for edge width
  temp_data = coarse_graph.links.filter(function(d){if(d.source != d.target) return d})
  var max_edge_strength = d3.max(temp_data, function(d){return d.WEIGHT});
  var min_edge_strength = d3.min(temp_data, function(d){return d.WEIGHT});
  
  //define scales for highlight and non-highlight
   edge_strength_scale = d3.scaleLinear()
    .domain([min_edge_strength, max_edge_strength])
    .range([1, 5]);
   edge_strength_scale_highlight = d3.scaleLinear()
    .domain([min_edge_strength, max_edge_strength])
    .range([2,6 ]);

  
 `//first define links`
  let links = svg_community.append("g")
    .attr("class", "community_links")
    .selectAll("line")
    .data(coarse_graph.links)
    .enter()
    .append("line")
    .style('stroke', function(d){    
      if ((d.source == activeNode && adjacent_nodes.includes(d.target))|| d.target == activeNode && adjacent_nodes.includes(d.source))
        return "red"
      else return "grey"
    })
    .style("stroke-width",function(d){
      if ((d.source == activeNode && adjacent_nodes.includes(d.target))|| d.target == activeNode && adjacent_nodes.includes(d.source))
        return edge_strength_scale_highlight(d.WEIGHT)
      else 
        return edge_strength_scale(d.WEIGHT)
     } )


  //first define nodes
  let nodes = svg_community.append("g")
      .attr("class", "community_nodes")
      .selectAll("circle")
      .data(coarse_graph.nodes)
      .enter()
      .append("circle")
          .attr("r", 5)
          .attr("fill", function(d){ if (d.id == activeNode || adjacent_nodes.includes(d.id)) return'#69b3b2'
          else return "#B8B8B8"
       })

//labels
  let lebels = svg_community.append("g").attr("class", "community_text").selectAll("text").data(coarse_graph.nodes).enter().append("text").text(function(d){
   // console.log(d)
    return d.id})


  nodes.on('mouseover', function (e,d) {
    activeCommunity =  d.id
    adjacent_community = community_connections_list[d.id]

    // Highlight the nodes: every node is green except of him
    nodes.style('fill', "#B8B8B8")
    d3.select(this).style('fill', '#69b3b2')

   /* d3.selectAll("circle").attr("opacity", function(check){
      if(d.id == check.community)
      return 1
      else return 0
    })*/

    d3.selectAll("circle")
    .attr("opacity", function(check){
      if(adjacent_community.includes(check.community))
        return 1 
      else 
        return .1
    })


    d3.selectAll("rect")
    .classed("barLight", function(d) {
       if ( d.x == activeCommunity) return true;
       else return false;
    })


    draw_coarse_graph_in_side_window(adjacent_community,activeCommunity)
     
    // Highlight the connections
    /*links
      .style('stroke', function (link_d) {  
       // console.log(link_d)
        //console.log(d)
         return link_d.source.id === d.id || link_d.target.id === d.id ?"#253494" : '#b8b8b8';})
      .style('stroke-width', function (link_d) { 
        return (link_d.source.id === d.id || link_d.target.id === d.id) ? 4 : edge_strength_scale(d.WEIGHT);})
      */ } )
  .on('mouseout', function (d) {
    nodes.style('fill', "#69b3a2")
    console.log("log out this ")
    d3.selectAll("circle")
    .attr("opacity", 1)

    links
      .style('stroke', "grey")
      .style('stroke-width', function(d){
        
        return  edge_strength_scale(d.WEIGHT)})
  })



  //simulation
  let simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d) => d.id).distance(30))
      .force("charge", d3.forceManyBody().strength(d => -30))
      .force("center", d3.forceCenter(bodyWidth / 3, bodyHeight / 2))
  
      simulation
      .nodes(coarse_graph.nodes)
      .on("tick", updateElements);

  simulation.force("link")
      .links(coarse_graph.links);




//for time being
//draw_histogram(centrality_data, width,height)
draw_textbox_community_connections()


}

function updateElements() {

  
  //update node 
  d3.select(".community_nodes")
      .selectAll("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("fill", function(d){ if (d.id == activeCommunity || adjacent_community.includes(d.id)) return'#69b3b2'
          else return "#B8B8B8"
       })

  d3.selectAll(".community_text").selectAll("text").attr("x", (d) => d.x).attr("y", (d) => d.y)

  //update links
  d3.select(".community_links")
      .selectAll("line")
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y) 
      .style('stroke', function(d){
        //console.log(d)    
        if ((d.source.id == activeCommunity && adjacent_community.includes(d.target.id))|| d.target.id == activeCommunity && adjacent_community.includes(d.source.id))
          return "#69b3b2"
        else return "grey"
      })
      .style("stroke-width",function(d){
        if ((d.source.id == activeCommunity && adjacent_community.includes(d.target.id))|| d.target.id == activeCommunity && adjacent_community.includes(d.source.id))
          return edge_strength_scale_highlight(d.WEIGHT)
        else 
          return edge_strength_scale(d.WEIGHT)
       } ) 
}


//convert node data from string to integers
function transform_data(data){
  data = data.map(d=> ({
    node : +d.node,
    centrality : +d.centrality,
    community : +d.community,
    density : parseFloat(d.density),
    eign : parseFloat(d.eign),
    closeness : parseFloat(d.closeness),
    betwness: parseFloat(d.betwness),
    cs_field: d.cs_field !== undefined ? +d.cs_field : (nodeFeatureLookup.hasOwnProperty(+d.node) ? nodeFeatureLookup[+d.node] : -1),
    x : +d.x,
    y: +d.y
  }))
  return data
}

//convert node data from string to integers
function transform_link_data(data){
  data = data.map(d=> ({
    source : +d.source,
    target: +d.target,
    weight: +d.weight
  }))
  return data
}

//convert node data from string to integers
function transform_node_to_node_link_data(data){
  data = data.map(d=> ({
    source : +d.source,
    target: +d.target
  }))
  return data
}

//convert coarse graph center points from string to integers
function string_to_numbers_graph_centers(data){
  data = data.map(d=> ({
    community : +d.node,
    cx : parseFloat(d.x_pos),
    cy: parseFloat(d.y_pos)
  }))
  return data
}

function transform_graph_centers(data, height, width){
  console.log(height, width)
  //define scales for center positions
    let xExtent_central_pos = d3.extent(data, d=>d.cx)
    let xScale_central_pos = d3.scaleLinear()
                  //.domain(xExtent_central_pos)
                  .domain([-1,1])
                  .range([40,width-40])


    let yExtent_central_pos = d3.extent(data, d=>d.cy)
    //console.log(xExtent_central_pos)
    let yScale_central_pos = d3.scaleLinear()
                  //.domain(yExtent_central_pos)
                  .domain([-1,1])
                  .range([40,height-40])

    data = data.map(d=> ({
      community : +d.community,
      cx : xScale_central_pos(d.cx),
      cy: yScale_central_pos(d.cy)
    }))
    return data
}

// the function bootstrap-5-admin-dashboard-template-main_5Nov22 is added by bhanu
function optimal_no_of_nodes(community_count) {

	let range_for_same_point = -1
	next_range_for_same_point = 1
	part_of_sprial_considered_same = 7*12 //no of coil * nth part of circle (for example: if in 7 coil spriral, 30degree of circle
		                                    //can be considered same then 7*12th part of 7 coil spiral can be considered same)
	set_of_disticnt_ranges = new Set();
	optimal_no_of_nodes = 0

	while (range_for_same_point != next_range_for_same_point) {
		range_for_same_point = next_range_for_same_point
		console.log("bbbbbbbbbbbbb  bbbbbb  range:" + range_for_same_point)
		set_of_disticnt_ranges.add(range_for_same_point)
		set_of_node_counts = new Set();
		community_count.forEach(function(d){
			set_of_node_counts.add(range_for_same_point*Math.floor(d.count/range_for_same_point))
		});
		console.log("bbbbb set:")
		console.log(set_of_node_counts)
		var sum = 0;
		set_of_node_counts.forEach(function(num) { sum += num });
		console.log("bbbbbbbbbbbbb  bbbbbb  sum:" + sum)
		console.log("bbbbbbbbbbbbb  bbbbbb  length:" + set_of_node_counts.size)

		average = Math.floor(sum / set_of_node_counts.size);
		console.log("bbbbbbbbbbbbb  bbbbbb  average:" + average)
		next_range_for_same_point = Math.floor(average/part_of_sprial_considered_same)
		optimal_no_of_nodes = average
		console.log("bbbbbbbbbbbbb  bbbbbb  optimal_no_of_nodes:" + optimal_no_of_nodes)
		if (set_of_disticnt_ranges.has(next_range_for_same_point)) {
			break;
		}
	}
	console.log("bbbbbbbbbbbbb  bbbbbb  optimal_no_of_nodes:" + optimal_no_of_nodes)
	return optimal_no_of_nodes

}





function computing_spiral_positions(center_positions_spiral, data_points, sides, height, width) {

  //let centerX = 50,
//  centerY = 50,
  let radius = 40,
  coils = 7,
  rotation = 0;
  sides = 500
  let awayStep = radius/sides
  // How far to rotate around center for each side.
  let aroundStep = coils/sides
  // Convert aroundStep to radians.
  let aroundRadians = aroundStep * 2 * 3.14;
  // Convert rotation to radians.
   rotation *= 2 * 3.14;

  let waveangle = 0.314;

  let initial_x = 60
  let initial_y = 60
  let x_increment = 0
 
  
domain_for_community_legend=[]
range_for_community_legend=[]

// Reset the total content height tracker for this computation
computed_total_community_height = 0;

newdata1=[]

center_positions_spiral.forEach(function(community_data){
  console.log(community_data)
  console.log(community_data.community)
  domain_for_community_legend.push(community_data.community)
  filtered_community= data_points.filter(function(d){
   
    
    return d.community==community_data.community})
  console.log(filtered_community)
  no_of_points_in_community = filtered_community.length
  let flag_last = 0
  let flag_first = 1 
  let increment_var = 1
  let count_for_zigzag = 0
  let flagzizag = 0

  range_for_community_legend.push(initial_y)

  for (i=0; i<no_of_points_in_community;i++){


    
    if (flag_first == 1 && increment_var<170 ){

        increment_var = increment_var + 1;
      }
    else if (increment_var == 170)
      initial_y = initial_y +3
    else if (flag_last == 1 && increment_var >0 &&increment_var !=170)
     increment_var = increment_var - 1
   else if (increment_var == 0)
      initial_y = initial_y +3
      //How far away from center



      if (increment_var == 170)
      {
        flagzizag =1
        count_for_zigzag= count_for_zigzag + 1
        if (count_for_zigzag == 3){
          count_for_zigzag =0
          increment_var = increment_var - 1
        }
        flag_first = 0
        flag_last = 1}
    else if (increment_var == 0 && flag_last ==1)
      { count_for_zigzag= count_for_zigzag + 1
        if (count_for_zigzag == 3){
          count_for_zigzag =0
          increment_var = increment_var +1 
          flag_first = 1
          flag_last = 0
        }
  
      }
      away = i * awayStep;
      // How far around the center.
      x_increment = increment_var * 4;


      //console.log("hey bahnu")


      around = i * aroundRadians + rotation;

      let no_of_waves_completed = Math.floor(around/waveangle);

      let current_part_of_waveangle = around - (no_of_waves_completed * waveangle);

      let twopie_mapped_current_part_of_waveangle = ((2 * 3.14)/waveangle) * current_part_of_waveangle;

      //let wave_coff =  * Math.sin(twopie_mapped_current_part_of_waveangle)



      filtered_community[i]['x'] = initial_x + x_increment;
      filtered_community[i]['y'] = initial_y;

     // filtered_community[i]['x'] = community_data.cx + Math.cos(around) * (away );
      //filtered_community[i]['y'] = community_data.cy + Math.sin(around) * (away);
  }
  initial_y = initial_y +20
  //console.log("hey")
  newdata1=newdata1.concat(filtered_community)
  //console.log(newdata1.concat(filtered_community))
  //console.log(newdata1)

})
// Store final height so SVG and containers can be sized appropriately
computed_total_community_height = initial_y + 40; // add bottom padding
return newdata1
/*
for j in unique_communities:
    x_list=[]
    y_list=[]
    #no. of points of community
    no_of_points_in_community = df.loc[df["community"]==j].shape[0]
    for i in range(1, no_of_points_in_community+1):
        #How far away from center
        away = i * awayStep;
        #// How far around the center.
        around = i * aroundRadians + rotation;

        x = centerX +(j+1)*50 + math.cos(around) * away;
        y = centerY + (j+1)*50+math.sin(around) * away;
        x_list.append(x)
        y_list.append(y)
    full_x_list.extend(x_list)
    full_y_list.extend(y_list)
df["x"]= full_x_list
df["y"]= full_y_list
*/
}

// Define the div for the tooltip
var div = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0);


count = 0
function draw_spiral_community(){




  // Find Node and Most Connected turn each other off in settings.js
  console.log(find_node_id)

  g.selectAll(".brush").remove()
  count =count +1
  g.selectAll("circle").remove()
//define scale
  let xExtent = d3.extent(global_data, d=>d.x)
  let xScale = d3.scaleLinear()
                  .domain(xExtent)
                  .range(xExtent)


  let yExtent = d3.extent(global_data, d=>d.y)
  let yScale = d3.scaleLinear()
                  .domain(yExtent)
                  .range(yExtent)

  let max_density = d3.max(global_data, d=>d.density)


//define colorscale
colorscaleDensity = d3.scaleSequential(d3.interpolateRdYlBu)
                .domain([max_density,0]);
console.log([extent_of_centralities_after_removing_outliers.degree_range[1], extent_of_centralities_after_removing_outliers.degree_range[0] -10])
colorscaleDegree = d3.scaleSequential(d3.interpolateRdYlBu)
//.domain(extent_of_centralities_after_removing_outliers.degree_range)
.domain([extent_of_centralities_after_removing_outliers.degree_range[1], extent_of_centralities_after_removing_outliers.degree_range[0]-3]);
colorscaleCloseness = d3.scaleSequential(d3.interpolateRdYlBu)
.domain([extent_of_centralities_after_removing_outliers.closeness_range[1], extent_of_centralities_after_removing_outliers.closeness_range[0]] );
colorscaleBetwness = d3.scaleSequential(d3.interpolateRdYlBu)
.domain([extent_of_centralities_after_removing_outliers.betwness_range[1], extent_of_centralities_after_removing_outliers.betwness_range[0]]);
colorscaleEign = d3.scaleSequential(d3.interpolateRdYlBu)
.domain([extent_of_centralities_after_removing_outliers.eign_range[1], extent_of_centralities_after_removing_outliers.eign_range[0]]);

gBrush = g.append("g")
.attr("class", "brush")

//define brush
brush = d3.brush().on("end", function() {
  brushFlag=1
  var s = d3.brushSelection(this);
  if (!s) {
    if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
    xScale.domain(xExtent);
    yScale.domain(yExtent);
  } else {
    console.log([s[0][0], s[1][0]].map(xScale.invert, xScale))
    xScale.domain([s[0][0], s[1][0]].map(xScale.invert, xScale));
    yScale.domain([s[1][1], s[0][1]].map(yScale.invert, yScale));
    g.select(".brush").call(brush.move, null);
  }
  var t = g.transition().duration(750);
  g.selectAll("circle").transition(t)
      .attr("cx", function(d) {  return xScale(d.x); })
      .attr("cy", function(d) { return yScale(d.y); });;
  //d3.selectAll(".spiral_edges").style("stroke-opacity", 0)



})

//g.addEventListener("dblclick", function(){brushFlag=0
  //d3.selectAll(".spiral_edges").style("stroke-opacity", 1)});


//call brush

gBrush.call(brush);


// scale based on strength and draw:
var max_edge_strength = d3.max(link_data, function(d){return d.weight});
console.log(max_edge_strength )


var edge_strength_scale = d3.scaleLinear()
      .domain([0, max_edge_strength])
      .range([.4, 10]);
console.log(link_data)

g.selectAll("line")

/*comment edges code
for (let link in link_data){
 console.log("this is new file")
 g.append('line')//..data(link_data[link]).enter()
 .attr("class", "spiral_edges")
      .style("stroke", "#DCDCDC")
      .style("strokeOpacity",0)
      .style("stroke-width", edge_strength_scale(link_data[link].weight))
      .attr("x1",center_positions_spiral[link_data[link].source].cx)
      .attr("y1", center_positions_spiral[link_data[link].source].cy)
      .attr("x2", center_positions_spiral[link_data[link].target].cx)
      .attr("y2", center_positions_spiral[link_data[link].target].cy)
      .on("mouseover", function(event, d){show_edge_tooltip(d.source, d.target, d.weight)})

}
g.selectAll(".spiral_edges").data(link_data).enter()
*/



//draw nodes
  var node = g.selectAll("circle")
                  .data(global_data)
console.log(global_data)
  var newElements = node.enter()
                 // .append("g")
                  //.attr("class", "all_nodes")
                  .append("circle")
                  .attr("r", function(d){

                    if (d.node == find_node_id)
                      return 4
                    else
                      return global_radius
                  })
                  .style("fill", function(d){
                    if (d.node == find_node_id)
                      return "black"
                    else
                    {
                      if (densityColFlag ==1)
                        return colorscaleDensity(d.density);

                      else if (degreeColFlag==1){
                        if (d.centrality>extent_of_centralities_after_removing_outliers.degree_range[1])
                          return "black"
                          //return "#5e3c99"
                          //return "#d7301f"
                          //return "#d7301f"
                         // return "#253494"
                        else
                        return colorscaleDegree(d.centrality);
                      }

                      else if (closenessColFlag==1){
                        if (d.closeness > extent_of_centralities_after_removing_outliers.closeness_range[1])
                          return "black"
                        else
                          return colorscaleCloseness(d.closeness);
                        }

                      else if (betweennessColFlag==1){
                        if (d.betwness > extent_of_centralities_after_removing_outliers.betwness_range[1])
                          return "black"
                        else
                          return colorscaleBetwness(d.betwness);
                      }

                      else if (eignColFlag==1){
                        if (d.eign > extent_of_centralities_after_removing_outliers.eign_range[1])
                          return "black"
                        else
                          return (colorscaleEign(d.eign))
                      }

                    }
                       })
                  .attr("pointer-events", "all")
                  .on("mouseover", function(event,d) {
                                     
                                      div.transition()
                                          .duration(200)
                                          .style("opacity", .9);

                                      if (flag_most_connected_nodes){
                                        div.html("<b>Community:</b> " +d.community)
                                        .style("left", (event.pageX) + "px")
                                        .style("top", (event.pageY - 28) + "px");

                                      }
                                      else{
                                        var csClass = nodeFeatureLookup.hasOwnProperty(d.node) ? nodeFeatureLookup[d.node] : -1;
                                        var csName = CS_FIELD_NAMES.hasOwnProperty(csClass) ? CS_FIELD_NAMES[csClass] : "Unknown";
                                        div.html("<b>Node:</b> "+ d.node +"<br/>" +"<b>Community:</b> " +d.community+ "<br/>"+
                                                 "<b>Degree:</b> "+ parseFloat(d.centrality).toFixed(2) +"<br/>"+
                                                 "<b>Closeness:</b> "+ parseFloat(d.closeness).toFixed(4) +"<br/>"+
                                                 "<b>Betweenness:</b> "+ parseFloat(d.betwness).toFixed(4) +"<br/>"+
                                                 "<b>Eigenvector:</b> "+ parseFloat(d.eign).toFixed(4) +"<br/>"+
                                                 "<b>CS Field:</b> "+ csName )
                                        .style("left", (event.pageX) + "px")
                                        .style("top", (event.pageY - 28) + "px")
                                        .style("text-align", "left");

                                      }



                                          activeCommunity = d.community
                                          activeNode = d.node
                                          adjacent_community = community_connections_list[activeCommunity]
                                          xCoordinateOfActiveNode = d.x
                                          yCoordinateOfActiveNode = d.y

                                          //code to show adjacent node
                                          let adjacent_nodes = connections_list[activeNode]



                                          d3.selectAll("circle")
                                          .attr("r", function(d){
                                            if (adjacent_nodes.includes(d.node))
                                              return 3
                                            else
                                              return global_radius
                                          })
                                          .style("fill", function(d){
                                            if (adjacent_nodes.includes(d.node)){
                                              
                                              
                                              /*let edgecolor;
                                              if (d.community==activeCommunity)
                                                edgecolor ="#253494"
                                              else 
                                                edgecolor = "#253494"


                                              g.append('line')
                                              .attr("class", "adjacent_edges")
                                                   .style("stroke", edgecolor)
                                                   .style("strokeOpacity",.5)
                                                   .style("stroke-width",1)


                                                   .attr("x1",function(){
                                                                if(brushFlag==1)
                                                                  return xScale(xCoordinateOfActiveNode)
                                                                else 
                                                                  return xCoordinateOfActiveNode})
                                                   .attr("y1", function(){
                                                    if(brushFlag==1)
                                                      return yScale(yCoordinateOfActiveNode)
                                                    else 
                                                      return yCoordinateOfActiveNode})
                                                   .attr("x2", function(){
                                                    if(brushFlag==1)
                                                      return xScale(d.x)
                                                    else 
                                                      return d.x})
                                                   .attr("y2", function(){
                                                    if(brushFlag==1)
                                                      return yScale(d.y)
                                                    else 
                                                      return d.y})*/
                                              return "#253494"}
                                            else
                                              {
                                                if (densityColFlag ==1)
                                                return colorscaleDensity(d.density);

                                              else if (degreeColFlag==1){
                                                if (d.centrality>extent_of_centralities_after_removing_outliers.degree_range[1])
                                                  return "black"
                                                else
                                                return colorscaleDegree(d.centrality);
                                              }

                                              else if (closenessColFlag==1){
                                                if (d.closeness > extent_of_centralities_after_removing_outliers.closeness_range[1])
                                                  return "black"
                                                else
                                                  return colorscaleCloseness(d.closeness);
                                                }

                                              else if (betweennessColFlag==1){
                                                if (d.betwness > extent_of_centralities_after_removing_outliers.betwness_range[1])
                                                  return "black"
                                                else
                                                  return colorscaleBetwness(d.betwness);
                                              }

                                              else if (eignColFlag==1){
                                                if (d.eign > extent_of_centralities_after_removing_outliers.eign_range[1])
                                                  return "black"
                                                else
                                                  return (colorscaleEign(d.eign))
                                              }

                                              }
                                          })
                                          console.log(global_data)
                                          new_data1 = global_data.filter(function(client){return client.community==d.community}) 
                                          //sort this data based on flag  
                                          console.log(new_data1)                                    
                                         // draw_spiral(new_data1, adjacent_nodes, activeNode)
                                        


                                          d3.selectAll("rect")
                                           .classed("strokechange", function(d) {
                                              if ( d.target == activeCommunity) return true;
                                              else return false;
                                           })

                                           d3.selectAll("rect")
                                           .classed("barLight", function(d) {
                                              if ( d.x == activeCommunity) return true;
                                              else return false;
                                           })

                                          //highlight table column on hover
                                            d3.selectAll("tr").style("background-color", function(dat,i){
                                              if (dat!== undefined)
                                               {
                                                if(dat.node == find_node_id)
                                                  return "blue";
                                                else if (dat.node == activeNode)
                                                  return "orange";
                                                else
                                                  return "transparent"
                                                }})


                                          if (!flag_most_connected_nodes){
                                           d3.selectAll("circle")
                                           .attr("opacity", function(d){
                                             if(d.community == activeCommunity || adjacent_nodes.includes(d.node) ) return 1
                                             else return .1} )}



                                             coarse_graph_nodes
                                             .attr("r", 9)
                                             .style("fill", "#69b3a2")
                                             .attr("opacity", function(d){
                                               if(d.id==(activeCommunity) || adjacent_community.includes(d.id))
                                                 return 1 
                                               else 
                                                 return .1
                                             })

                                             draw_coarse_graph_in_side_window(adjacent_community, activeCommunity)
                                             draw_spiral(new_data1, adjacent_nodes, activeNode)

                                            


                                         /* if(brushFlag==0){
                                             all_lines = d3.selectAll(".spiral_edges")
                                             .nodes()
                                             for (each in all_lines){
                                             if(
                                             parseInt(all_lines[each].x1.baseVal.value) == parseInt(center_positions_spiral[activeCommunity].cx) &&
                                             parseInt(all_lines[each].y1.baseVal.value) == parseInt(center_positions_spiral[activeCommunity].cy) ||
                                             parseInt(all_lines[each].x2.baseVal.value) == parseInt(center_positions_spiral[activeCommunity].cx )&&
                                             parseInt(all_lines[each].y2.baseVal.value) == parseInt(center_positions_spiral[activeCommunity].cy))
                                             all_lines[each].style.strokeOpacity = 1
                                             else
                                             all_lines[each].style.strokeOpacity = 0;
                                             }}
                                            else {
                                              d3.selectAll(".spiral_edges").style("stroke-opacity", 0)
                                            }*/

                                            /*for (let link in adjacent_nodes){
                                              //console.log("I am in line code")
                                              console.log(global_data[link])
                                              if (global_data_unchanged[activeNode].community != global_data_unchanged[link].community)
                                              console.log("yes")
                                              g.append('line')
                                              .attr("class", "adjacent_edges")
                                                   .style("stroke", "yellow")
                                                   .style("strokeOpacity",.5)
                                                   .style("stroke-width",1)

                                                   .attr("x1",global_data_unchanged[activeNode].x)
                                                   .attr("y1", global_data_unchanged[activeNode].y)
                                                   .attr("x2", global_data_unchanged[link].x)
                                                   .attr("y2", global_data_unchanged[link].y)

                                                   //.style("stroke-opacity", .5);
                                            }*/

                                      })

                  .on("mouseout", function(d) {
                                      div.transition()
                                          .duration(500)
                                          .style("opacity", 0);

                                      d3.selectAll(".adjacent_edges")
                                      .remove()

                                      d3.selectAll(".barLight")
                                      .attr("class", "bar");

                                      d3.selectAll(".strokechange")
                                      .attr("class", "heat_map")

                                      if(!flag_most_connected_nodes){
                                      d3.selectAll("circle")
                                      .attr("opacity", 1)}

                                      d3.select("table").selectAll("tr").style("background-color", function(d,i){
                                        if (d!== undefined)
                                          {
                                            if (d.node == find_node_id)
                                              return "blue";
                                            else
                                              return "transparent"

                                          }})

                                     /* if (brushFlag==0)
                                      {
                                        d3.selectAll(".spiral_edges").style("stroke-opacity", 1)
                                      }
                                      else
                                      {
                                        d3.selectAll(".spiral_edges").style("stroke-opacity", 0)
                                      }
                                      console.log(d3.selectAll(".spiral_edges").style("stroke-opacity"))
*/
                                  })
                  /*.on("click", function(event,d) {
                                                    //console.log(d.community)
                                                    new_data1 = global_data_unchanged.filter(function(client){return client.community==d.community})                                       
                                                    draw_spiral(new_data1)
 
                                                    //links_to_highlight = link_data.filter(function(client){return client.source==d.community || client.source==d.community})
                                                    
                                                    d3.selectAll("line")
                                                    .style("stroke", "#DCDCDC")

                                                    
                                                    //show only selected community in table
                                                    table.selectAll("tr").remove()
                                                    show_table_data(new_data1)


                                                  })*/;


   node.merge(newElements).transition()
                  .attr("cx", function (d) { return xScale(d.x); })
                  .attr("cy", function (d) { return yScale(d.y); })




//zoom functionality
    /*g.call(d3.zoom().on("zoom", function(event){
      let newXScale = event.transform.rescaleX(xScale)
      let newYScale = event.transform.rescaleY(yScale)


      node.merge(newElements)
          .attr("cx", d=> newXScale(d.x) )
          .attr("cy", d=> newYScale(d.y) )

    }))*/
//comenting legend till line

    //legend attaching
 //commentig till 565

//garima commenting legend code



 g.selectAll(".axis").remove()
 g.selectAll(".text_for_legend").remove()
var legendheight = 200,
    legendwidth = 80,
    margin = {top: 10, right: 60, bottom: 10, left: 2};

var canvas = d3.select("#legend1")
  .style("height", legendheight + "px")
  .style("width", legendwidth + "px")
  .style("position", "relative")
  .append("canvas")
  .attr("height", legendheight - margin.top - margin.bottom)
  .attr("width", 1)
  .style("height", (legendheight - margin.top - margin.bottom) + "px")
  .style("width", (legendwidth - margin.left - margin.right) + "px")
  .style("border", "1px solid #000")
  .style("position", "absolute")
  .style("top",  (margin.top) +"px")
  .style("left", (margin.left) + "px")
  .node();

var ctx = canvas.getContext("2d");

// to change legend according to selected centrality
let domain_used_for_legend;
if (densityColFlag ==1)
domain_used_for_legend= colorscaleDensity.domain();
else if (degreeColFlag==1)
domain_used_for_legend=  colorscaleDegree.domain();
else if (closenessColFlag==1)
domain_used_for_legend=  colorscaleCloseness.domain();
else if (betweennessColFlag==1)
domain_used_for_legend =  colorscaleBetwness.domain();
else if (eignColFlag==1)
domain_used_for_legend= colorscaleEign.domain()

var legendscale = d3.scaleLinear()
  .range([1, legendheight - margin.top - margin.bottom])
  .domain(domain_used_for_legend);
 // .domain(colorscaleDensity.domain());

// image data hackery based on http://bl.ocks.org/mbostock/048d21cf747371b11884f75ad896e5a5
var image = ctx.createImageData(1, legendheight);
d3.range(legendheight).forEach(function(i) {
var c;
if (densityColFlag ==1)
c = d3.rgb(colorscaleDensity(legendscale.invert(i)));
else if (degreeColFlag==1)
c =  d3.rgb(colorscaleDegree(legendscale.invert(i)));
else if (closenessColFlag==1)
c =  d3.rgb(colorscaleCloseness(legendscale.invert(i)));
else if (betweennessColFlag==1)
c =  d3.rgb(colorscaleBetwness(legendscale.invert(i)));
else if (eignColFlag==1)
c = d3.rgb(colorscaleEign(legendscale.invert(i)));

  image.data[4*i] = c.r;
  image.data[4*i + 1] = c.g;
  image.data[4*i + 2] = c.b;
  image.data[4*i + 3] = 255;
});
ctx.putImageData(image, 0, 0);



var legendaxis = d3.axisRight()
  .scale(legendscale)
  .tickSize(6)
  .ticks(8);

   d3.select("#legend1")
    .attr("height", (legendheight) + "px")
    .attr("width", (legendwidth) + "px")
    //.attr("translate", "transform(750, 0)")
    .style("position", "absolute")
    .style("left", "790px")
    .style("top", margin.top)
  

 


g
  .append("g")
  .attr("class", "axis")
  .attr("transform", "translate(800, "+margin.top+")")
  //.attr("transform", "translate(" + (legendwidth - margin.left - margin.right + 3) + "," + (margin.top) + ")")
  .call(legendaxis);

  var text_for_legend;
  if (densityColFlag ==1)
  text_for_legend = "Density";
  else if (degreeColFlag==1)
  text_for_legend =  "Degree";
  else if (closenessColFlag==1)
  text_for_legend=  "Closeness";
  else if (betweennessColFlag==1)
  text_for_legend =  "Betweeness";
  else if (eignColFlag==1)
  text_for_legend = "Eigen";

  g
  .append("g")
  .attr("class", "text_for_legend")
  .append("text")
  .text(text_for_legend)
  //.attr("transform", "translate")
  //.attr("class", "axis")
  .attr("transform", "translate( 770 ," + (legendheight+10) + ")")
  //.call(legendaxis);

//g.append


let community_scale = d3.scaleOrdinal()
                        .range(range_for_community_legend)
                        .domain(domain_for_community_legend)

let community_axis = d3.axisLeft(community_scale)

g.append("g")
.attr("transform", "translate(50,0)")
.call(community_axis)

g.append("text")
.attr("transform", "translate(100,100)")
.attr("transform", "rotate(-90)")
.attr('text-anchor', 'middle')
.attr("y",50)
.attr("x",0 - 200)

.attr("dy", "-3em")
.attr("font-size", 13.4)

.attr("font-weight", "bold")
.attr("text-anchor", "end")
.attr("fill", "black")
.text("Communities");



//add arc chart
// append the svg object to the body of the page
d3.selectAll("mynodes").remove()
d3.selectAll("mylabels").remove()
d3.selectAll("mylinks").remove()

// Use the computed height from community layout, with a minimum of 700
let height = Math.max(700, computed_total_community_height || 700)
let width =1200
var svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(5,0)")
    //.attr("transform",
      //    "translate(" + margin.left + "," + margin.top + ")");

var allNodes = coarse_graph.nodes.map(function(d){return d.id})

// A linear scale to position the nodes on the X axis
var y = d3.scaleOrdinal()
.range(range_for_community_legend)
.domain(domain_for_community_legend)


/*var y = d3.scalePoint()
.range([0, height])
.domain(allNodes)*/

// Add the circle for the nodes
let coarse_graph_nodes = svg
.selectAll("mynodes")

.data(coarse_graph.nodes)
.enter()
.append("g")
.attr("class", "comm_nodes")
.append("circle")
  .attr("cx", 17)
  .attr("cy", function(d){ return(y(d.id))})
  .attr("r", 9)
  .style("fill", "#69b3a2")





// Add links between nodes. Here is the tricky part.
// In my input data, links are provided between nodes -id-, NOT between node names.
// So I have to do a link between this id and the name
var idToNode = {};
coarse_graph.nodes.forEach(function (n) {
idToNode[n.id] = n;
});
// Cool, now if I do idToNode["2"].name I've got the name of the node with id 2
/*
// Add the links
coarse_graph_links = svg
.selectAll('mylinks')
.data(coarse_graph.links)
.enter()
.append('path')

.attr('d', function (d) {
  start = y(idToNode[d.source].id)    // X position of start node on the X axis
  end = y(idToNode[d.target].id)      // X position of end node
  return ['M', 50, start,    // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
    'A',                            // This means we're gonna build an elliptical arc
    (start - end)/2, ',',    // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
    (start - end)/2, 0, 0, ',',
    start < end ? 0 : 1, 50, ',', end] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
    .join(' ');
})
.style("fill", "none")
.style("stroke", "#DCDCDC")
.style("strokeOpacity",1)
//.style("stroke-width", edge_strength_scale(+d.WEIGHT))

*/
    // Add the highlighting functionality
    coarse_graph_nodes.on('mouseover', function (e,d) {
      activeCommunity = d.id
      console.log(d)
      adjacent_community = community_connections_list[d.id]

      d3.selectAll("circle")
        .attr("opacity", function(d){
          if(adjacent_community.includes(d.community))
            return 1 
          else 
            return .1
        })
      
        coarse_graph_nodes
        .attr("opacity", function(d){
          if(adjacent_community.includes(d.id))
            return 1 
          else 
            return .1
        })

        coarse_graph_nodes
        .attr("opacity", function(d){
          if(adjacent_community.includes(d.id))
            return 1 
          else 
            return .1
        })

        d3.selectAll("rect")
        .classed("barLight", function(d) {
           if ( d.x == activeCommunity) return true;
           else return false;
        })



        draw_coarse_graph_in_side_window(adjacent_community, activeCommunity)
      // Highlight the nodes: every node is green except of him
      //nodes.style('fill', "#B8B8B8")
      d3.select(this).style('fill', '#69b3b2')
      // Highlight the connections
      //coarse_graph_links
        //.style('stroke', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? '#69b3b2' : '#b8b8b8';})
        //.style('stroke-width', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? 4 : 1;})
    })
    .on('mouseout', function (d) {
       d3.selectAll("circle")
        .attr("opacity", 1)
      //nodes.style('fill', "#69b3a2")
      //coarse_graph_links
        //.style('stroke', 'black')
        //.style('stroke-width', '1')
    })


  





/*for (let link in node_to_node_link_data){
  console.log("I am in line code")

  g.append('line')
  .attr("class", "node_edges")
       .style("stroke", "#DCDCDC")
       .style("strokeOpacity",0)
       .style("stroke-width", 3)
       .attr("x1",global_data_sorted[node_to_node_link_data[link].source].x)
       .attr("y1", global_data_sorted[node_to_node_link_data[link].source].y)
       .attr("x2", global_data_sorted[node_to_node_link_data[link].target].x)
       .attr("y2", global_data_sorted[node_to_node_link_data[link].target].y)

       .style("stroke-opacity", 1);
}*/






}



function idled() {
  idleTimeout = null;
}


/*function draw_most_connected_communities(){

  g.selectAll(".brush").remove()
  count =count +1
  g.selectAll("circle").remove()
//define scale
  let xExtent = d3.extent(global_data, d=>d.x)
  let xScale = d3.scaleLinear()
                  .domain(xExtent)
                  .range(xExtent)


  let yExtent = d3.extent(global_data, d=>d.y)
  let yScale = d3.scaleLinear()
                  .domain(yExtent)
                  .range(yExtent)


//define colorscale
colorscale = d3.scaleSequential(d3.interpolateRdYlGn)
                .domain([0,1]);

gBrush = g.append("g")
.attr("class", "brush")

//define brush
brush = d3.brush().on("end", function() {
  var s = d3.brushSelection(this);
  if (!s) {
    if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
    xScale.domain(xExtent);
    yScale.domain(yExtent);
  } else {
    console.log([s[0][0], s[1][0]].map(xScale.invert, xScale))
    xScale.domain([s[0][0], s[1][0]].map(xScale.invert, xScale));
    yScale.domain([s[1][1], s[0][1]].map(yScale.invert, yScale));
    g.select(".brush").call(brush.move, null);
  }
  var t = g.transition().duration(750);
  g.selectAll("circle").transition(t)
      .attr("cx", function(d) {  return xScale(d.x); })
      .attr("cy", function(d) { return yScale(d.y); });;
  d3.selectAll(".spiral_edges").style("stroke-opacity", 0)
})



//call brush

gBrush.call(brush);



//draw nodes
  var node = g.selectAll("circle")
                  .data(global_data)
console.log(find_node_id)
  var newElements = node.enter()
                  .append("circle")
                  .attr("r", function(d){

                    if (d.node == find_node_id)
                      return 10
                    else
                      return global_radius
                  })
                  .style("fill", function(d){
                    if (d.node == find_node_id)
                      return "black"
                    else
                      return colorscale(d.density); })
                  .attr("pointer-events", "all")
                  .on("mouseover", function(event,d) {
                                      console.log(event)
                                      console.log(d)
                                      div.transition()
                                          .duration(200)
                                          .style("opacity", .9);

                                      div.html("<b>Community:</b> " +d.community)
                                          .style("left", (event.pageX) + "px")
                                          .style("top", (event.pageY - 28) + "px");

                                          activeCommunity = d.community
                                          activeNode = d.node
                                          d3.selectAll("rect")
                                           .classed("strokechange", function(d) {
                                              if ( d.target == activeCommunity) return true;
                                              else return false;
                                           })

                                           d3.selectAll("rect")
                                           .classed("barLight", function(d) {
                                              if ( d.x == activeCommunity) return true;
                                              else return false;
                                           })

                                          //highlight table column on hover
                                            d3.selectAll("tr").style("background-color", function(dat,i){
                                              if (dat!== undefined)
                                               {
                                                if(dat.node == find_node_id)
                                                  return "blue";
                                                else if (dat.node == activeNode)
                                                  return "orange";
                                                else
                                                  return "transparent"
                                                }})



                                          /* d3.selectAll("circle")
                                           .attr("opacity", function(d){
                                             if(d.community == activeCommunity) return 1
                                             else return .1} )

                                             all_lines = d3.selectAll("line")
                                             .nodes()
                                             for (each in all_lines){
                                             if(
                                             parseInt(all_lines[each].x1.baseVal.value) == parseInt(center_positions_spiral[activeCommunity].cx) &&
                                             parseInt(all_lines[each].y1.baseVal.value) == parseInt(center_positions_spiral[activeCommunity].cy) ||
                                             parseInt(all_lines[each].x2.baseVal.value) == parseInt(center_positions_spiral[activeCommunity].cx )&&
                                             parseInt(all_lines[each].y2.baseVal.value) == parseInt(center_positions_spiral[activeCommunity].cy))
                                             all_lines[each].style.strokeOpacity = 1
                                             else
                                             all_lines[each].style.strokeOpacity = 0;
                                             }

                                      })

                  .on("mouseout", function(d) {
                                      div.transition()
                                          .duration(500)
                                          .style("opacity", 0);

                                      d3.selectAll(".barLight")
                                      .attr("class", "bar");

                                      d3.selectAll(".strokechange")
                                      .attr("class", "heat_map")

                                      /*d3.selectAll("circle")
                                      .attr("opacity", 1)

                                      d3.select("table").selectAll("tr").style("background-color", function(d,i){
                                        if (d!== undefined)
                                          {
                                            if (d.node == find_node_id)
                                              return "blue";
                                            else
                                              return "transparent"

                                          }})


                                      d3.selectAll(".spiral_edges").style("stroke-opacity", 0)
                                      console.log(d3.selectAll(".spiral_edges").style("stroke-opacity"))

                                  })
                  .on("click", function(event,d) {
                                                    //console.log(d.community)
                                                    new_data1 = global_data_unchanged.filter(function(client){return client.community==d.community})
                                                    console.log(new_data1)
                                                    draw_spiral(new_data1, colorscale(d.density))
                                                    console.log("in click function_now")
                                                    console.log(link_data)
                                                    links_to_highlight = link_data.filter(function(client){return client.source==d.community || client.source==d.community})
                                                    console.log(links_to_highlight)
                                                    d3.selectAll("line")
                                                    .style("stroke", "#DCDCDC")

                                                    console.log(d3.selectAll("line").attr("stroke-opacity"))
                                                    //show only selected community in table
                                                    table.selectAll("tr").remove()
                                                    show_table_data(new_data1)


                                                  });

   node.merge(newElements).transition()
                  .attr("cx", function (d) { return xScale(d.x); })
                  .attr("cy", function (d) { return yScale(d.y); })




//zoom functionality
    /*g.call(d3.zoom().on("zoom", function(event){
      let newXScale = event.transform.rescaleX(xScale)
      let newYScale = event.transform.rescaleY(yScale)


      node.merge(newElements)
          .attr("cx", d=> newXScale(d.x) )
          .attr("cy", d=> newYScale(d.y) )

    }))*/
//comenting legend till line

    //legend attaching
 /*//commentig till 565
var legendheight = 200,
    legendwidth = 80,
    margin = {top: 10, right: 60, bottom: 10, left: 2};

var canvas = d3.select("#legend1")
  .style("height", legendheight + "px")
  .style("width", legendwidth + "px")
  .style("position", "relative")
  .append("canvas")
  .attr("height", legendheight - margin.top - margin.bottom)
  .attr("width", 1)
  .style("height", (legendheight - margin.top - margin.bottom) + "px")
  .style("width", (legendwidth - margin.left - margin.right) + "px")
  .style("border", "1px solid #000")
  .style("position", "absolute")
  .style("top", (margin.top) + "px")
  .style("left", (margin.left) + "px")
  .node();

var ctx = canvas.getContext("2d");

var legendscale = d3.scaleLinear()
  .range([1, legendheight - margin.top - margin.bottom])
  .domain(colorscale.domain());

// image data hackery based on http://bl.ocks.org/mbostock/048d21cf747371b11884f75ad896e5a5
var image = ctx.createImageData(1, legendheight);
d3.range(legendheight).forEach(function(i) {
  var c = d3.rgb(colorscale(legendscale.invert(i)));
  image.data[4*i] = c.r;
  image.data[4*i + 1] = c.g;
  image.data[4*i + 2] = c.b;
  image.data[4*i + 3] = 255;
});
ctx.putImageData(image, 0, 0);



var legendaxis = d3.axisRight()
  .scale(legendscale)
  .tickSize(6)
  .ticks(8);

   d3.select("#legend1")
    .attr("height", (legendheight) + "px")
    .attr("width", (legendwidth) + "px")
    .style("position", "absolute")
    .style("left", "15px")
    .style("top", "55px")

g
  .append("g")
  .attr("class", "axis")
  .attr("transform", "translate(" + (legendwidth - margin.left - margin.right + 3) + "," + (margin.top) + ")")
  .call(legendaxis);



g.selectAll("line")

for (let link in link_data){
  console.log("this is new file")
  g.append('line')
  .attr("class", "spiral_edges")
       .style("stroke", "#DCDCDC")
       .style("strokeOpacity",0)
       .style("stroke-width", 3)
       .attr("x1",center_positions_spiral[link_data[link].source].cx)
       .attr("y1", center_positions_spiral[link_data[link].source].cy)
       .attr("x2", center_positions_spiral[link_data[link].target].cx)
       .attr("y2", center_positions_spiral[link_data[link].target].cy)

       .style("stroke-opacity", 0);
}



}*/
