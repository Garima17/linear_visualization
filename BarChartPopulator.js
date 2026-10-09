let coarse_graph_data;
let center_positions_spiral;
let link_data;
let node_to_node_link_data
let community_size_data
let heighest_density_data
let heighest_degree_data
let coarse_graph
let number_of_community_connections_data
let nodeFeatureLookup = {}
let nodeFeatureColumnName = "" // The name of the feature column in node_features.csv

// display name of the metadata column, e.g. cs_field_class -> "CS field"
var FEATURE_COLUMN_LABELS = { cs_field_class: "CS field", page_type: "Page type" }
function feature_column_label(){
  if (!nodeFeatureColumnName) return "Feature"
  if (FEATURE_COLUMN_LABELS[nodeFeatureColumnName]) return FEATURE_COLUMN_LABELS[nodeFeatureColumnName]
  var name = nodeFeatureColumnName.replace(/_/g, ' ')
  return name.charAt(0).toUpperCase() + name.slice(1)
}
let initial_state // snapshot of the page-load view, restored by reset_button()

// Field name mapping — can be overridden per dataset via window.FIELD_NAMES
// Falls back to showing raw values if no mapping provided
let FIELD_NAMES = window.FIELD_NAMES || {
  0: "Artificial Intelligence",
  1: "Comp. Linguistics",
  2: "Comp. Vision",
  3: "Databases",
  4: "Data Mining",
  5: "Graphics",
  6: "HCI",
  7: "Info. Retrieval",
  8: "Machine Learning",
  9: "Multimedia",
  10: "Networking",
  11: "NLP",
  12: "Operating Systems",
  13: "Programming Lang.",
  14: "Security"
}
// Keep CS_FIELD_NAMES as alias for backward compatibility
var CS_FIELD_NAMES = FIELD_NAMES;

//for community size barchart
function showdata_count(data){
  //transform data
  data = data.map(d=> ({
    x : d.community,
    y : parseFloat(d.count)
  }))
  data = data.sort(function(a,b){return d3.descending(a.y,b.y)})
  var svg = d3.select("#barchart-no_of_nodes")
  initializeChart(svg),
  draw(data, "Community", "Size (nodes)", "Size of each community");
}

//for density barchart
function showdata_density(data){
  //transform data
  data = data.map(d=> ({
    x : d.community,
    y : parseFloat(d.density)
  }))
  data = data.sort(function(a,b){return d3.descending(a.y,b.y)})
  var svg = d3.select("#barchart-density")
  initializeChart(svg),
  draw(data, "Community", "Edge density", "Edge density of each community");
}

//for max degree barchart
function showdata_hdegree(data){
  //transform data
  data = data.map(d=> ({
    x : d.community,
    y : +d.h_degree
  }))
  data = data.sort(function(a,b){return d3.descending(a.y,b.y)})
  var svg = d3.select("#barchart-h_degree")
  initializeChart(svg),
  draw(data, "Community", "Max degree", "Max degree in each community");
}


//for community connections barchart
function showdata_connections(data){
  //transform data
  data = data.map(d=> ({
    x : d.community,
    y : +d.connections
  }))
  data = data.sort(function(a,b){return d3.descending(a.y,b.y)})
  var svg = d3.select("#heatmap-connectivity")
  initializeChart(svg),
  draw(data, "Community", "Connections", "Connections to other communities");
}

//for connection heatmap
function showdata_connectivity_heatmap(data){
  //transform data
  data = data.map(d=> ({
    source : d.source,
    target : d.target,
    weight : +d.weight
  }))
  //theData = data;
  var svg = d3.select("#heatmap-connectivity")
  initializeChart(svg),
  draw_heatmap(data, "Community", "Community", "Community to community connections");
}

// redraw the community bar charts for the active communities (pages that have them)
function redraw_community_charts(){
  if (!document.getElementById("barchart-no_of_nodes")) return
  // the bar charts share the g / svg1 globals with the main chart, so keep the main chart's
  var main_g = g, main_svg1 = svg1
  d3.selectAll("#barchart-no_of_nodes, #barchart-density, #barchart-h_degree, #heatmap-connectivity").selectAll("*").remove()
  showdata_count(community_size_data.map(function(d){ return {community: d.community, count: d.size} }))
  showdata_density(heighest_density_data.map(function(d){ return {community: d.community, density: d.density} }))
  showdata_hdegree(heighest_degree_data.map(function(d){ return {community: d.community, h_degree: d.degree} }))
  showdata_connections(number_of_community_connections_data.map(function(d){ return {community: d.community, connections: d.connections} }))
  g = main_g
  svg1 = main_svg1
}

function  show_table_data(data){
  // Get every column value
  // internal columns are hidden: positions, the CSV index, the full-network degree,
  // betweenness (not computed, always 0) and the metadata column when there is no metadata
  var hidden_columns = ["x", "y", "new_x", "new_y", "centrality_full", "Unnamed: 0", "betwness"]
  if (Object.keys(nodeFeatureLookup).length === 0) hidden_columns.push("cs_field")
  var column_labels = {node: "Node", community: "Community", centrality: "Degree", closeness: "Closeness",
                       eign: "Eigenvector", density: "Edge density", cs_field: feature_column_label()}
  var columns = Object.keys(data[0])
  .filter(function(d){
    return !hidden_columns.includes(d);
  });

  var header = thead.append("tr")
      .selectAll("th")
      .data(columns)
      .enter()
      .append("th")
          .text(function(d){ return column_labels[d] || d;})
          .on("click", function(d, da){
              rows.sort(function(a, b){
                  return b[da] - a[da];
              })

            });

  var rows = tbody.selectAll("tr")
      .data(data)
      .enter()
      .append("tr")
      .on("mouseover", function(d){
        if (d3.select(this).style("background-color")== "blue")
          d3.select(this)
            .style("background-color", "blue")
        else
          d3.select(this)
              .style("background-color", "orange");
      })
      .on("mouseout", function(d){
        if (d3.select(this).style("background-color")== "blue")
         d3.select(this)
          .style("background-color", "blue")
        else
          d3.select(this)
              .style("background-color","transparent");
      });



  var cells = rows.selectAll("td")
      .data(function(row){
          return columns.map(function(d, i){

              return {i: d, value: row[d]};
          });
      })
      .enter()
      .append("td")
      .html(function(d){ return d.value;});

  //highlight the find_node_data if present
  d3.selectAll("tr").style("background-color", function(d,i){
    if (d!== undefined)
      {
        if (d.node == find_node_id)
        { console.log(d.node, find_node_id)
          return "blue";}

      }})
  }


function showdata_spiral_community_chart(data){

  //define height and width of svg
  //let width = 700,
  //height = 700;

    //assign height and width of svg
    let svg = d3.select("#chart")
    let bounds = svg.node().getBoundingClientRect()
    let width = bounds.width
    let height = bounds.height
    console.log(width, height)
    initializeSpiralChart(svg, height, width)

    //community ranking data 
      //transform data
      community_size_data = data[6].map(d=> ({
        community : +d.community,
        size : parseFloat(d.count)
      }))

      //transform data
      heighest_density_data = data[7].map(d=> ({
        community : +d.community,
        density : parseFloat(d.density)
      }))

      //transform data
      heighest_degree_data = data[8].map(d=> ({
        community : +d.community,
        degree : +d.h_degree
      }))

      number_of_community_connections_data = data[11].map(d=> ({
        community : +d.community,
        connections : +d.connections
      }))

      coarse_graph = data[9]

    // Build node feature lookup from node_features.csv (data[12])
    // Dynamically detects whichever columns exist beyond 'node_id'
    if (data[12] && data[12].length > 0) {
      var columns = data[12].columns || Object.keys(data[12][0]);
      // Find the ID column (node_id) and the feature column (everything else)
      var idCol = columns.find(function(c) { return c.toLowerCase().replace(/[_\s]/g,'') === 'nodeid'; }) || columns[0];
      var featureCol = columns.find(function(c) { return c !== idCol; }) || columns[1];
      nodeFeatureColumnName = featureCol;
      console.log("Node features detected — ID column: '" + idCol + "', Feature column: '" + featureCol + "'");

      data[12].forEach(function(d) {
        nodeFeatureLookup[+d[idCol]] = isNaN(+d[featureCol]) ? d[featureCol] : +d[featureCol];
      });
      console.log("Node feature lookup built with " + Object.keys(nodeFeatureLookup).length + " entries");
    }

  //coarse_graph_data
    coarse_graph_data = data[1]
    center_positions_spiral = string_to_numbers_graph_centers(coarse_graph_data)
  //transforming the coordinates
    center_positions_spiral=transform_graph_centers(center_positions_spiral, height, width)
    console.log(center_positions_spiral)
    //transform_link data
    link_data = transform_link_data(data[2])
    //connections list
    connections_list = data[4]
    community_connections_list = data[10]
    extent_of_centralities_after_removing_outliers = data[5]
    //console.log(connections_list)
    optimal_no_of_nodes = optimal_no_of_nodes(data[6]) //added by bhanu
    /*
    //all links read here
    node_to_node_link_data = transform_node_to_node_link_data(data[3])
    console.log(node_to_node_link_data)
    */
  //transform data from strings to integers
    data = transform_data(data[0])
    console.log(data)

    // Attach cs_field feature to each node data point
    data.forEach(function(d) {
      if (nodeFeatureLookup.hasOwnProperty(d.node)) {
        d.cs_field = nodeFeatureLookup[d.node];
      } else {
        d.cs_field = -1; // unknown
      }
    });

  //calculate final x and y position for each point
  //data= computing_spiral_positions_barchart_inspired((center_positions_spiral, data, optimal_no_of_nodes, height, width))
    data = computing_spiral_positions(center_positions_spiral, data, optimal_no_of_nodes, height, width)
    // added one more variable optimal_no_of_nodes by bhanu in computing_spiral_positions function
    global_data = data //changes with interactions
    global_data_unchanged = data
    global_data_sorted = data
    global_data_sorted.sort(function(a,b){return d3.descending(a.node, b.node)})
    console.log(global_data_sorted)
    global_data = global_data_sorted

    let prepare_data = []
    unique_communities = new Set(global_data_unchanged.map(function(d){return d.community}))
    console.log("updated_version_degree")
    unique_communities.forEach(function(entry) {
      community_data = global_data_unchanged.filter(function(d){ return d.community == entry});
      community_data.sort(function(a,b){return d3.descending(a.centrality,b.centrality)})
      prepare_data.push.apply(prepare_data,community_data)
    })
    console.log(prepare_data)

    prepare_data = computing_spiral_positions(center_positions_spiral, prepare_data,optimal_no_of_nodes, height, width)
    global_data = prepare_data

    // If more height is needed for all communities, reinitialize chart with proper size
    if (computed_total_community_height > height) {
      d3.select("#chart").selectAll("svg").remove();
      height = computed_total_community_height;
      d3.select("#chart").attr("height", height);
      svg = d3.select("#chart");
      initializeSpiralChart(svg, height, width);
    }

    // Snapshot the page-load state so reset_button() can restore it exactly.
    // Ranking buttons re-sort these arrays in place, so keep copies.
    let node_attrs = {}
    global_data_unchanged.forEach(function(d){
      node_attrs[d.node] = {community: d.community, density: d.density}
    })
    initial_state = {
      community_order: center_positions_spiral.slice(),
      size: community_size_data.slice(),
      degree: heighest_degree_data.slice(),
      density: heighest_density_data.slice(),
      connections: number_of_community_connections_data.slice(),
      node_attrs: node_attrs,
      ranking_label: d3.select("#ranking_tooltip").html(),
      community_ranking_label: d3.select("#community_ranking_tooltip").html()
    }

    // active dataset (settings.js): every community is active at page load.
    // centrality_full keeps the whole-network degree; centrality is counted inside the active subset
    global_data_unchanged.forEach(function(d){ d.centrality_full = d.centrality })
    full_community_stats = {
      size: initial_state.size.slice(),
      degree: initial_state.degree.slice(),
      density: initial_state.density.slice(),
      connections: initial_state.connections.slice()
    }
    set_active_communities(all_community_ids())
    layout_data = prepare_data

  draw_spiral_community()
  update_counts()
  /*var brush = d3.brush()
  .on("brush", function(){
    console.log("i am in brush")
    let coords = d3.brushSelection(this);
    console.log(coords)


  g.selectAll("circle")
      .style("fill", function(){
        let cx = d3.select(this).attr("cx");
        let cy = d3.select(this).attr("cy")
        console.log(cx,cy)


        let selected = isSelected(coords, cx, cy)
        return selected ? "yellow" : "green"
      } )
  })


  g.append("g")
  .attr("class", "brush")
  .call(brush)*/

}

/*function isSelected(brush_coords, cx, cy) {

  var x0 = brush_coords[0][0],
      x1 = brush_coords[1][0],
      y0 = brush_coords[0][1],
      y1 = brush_coords[1][1];

 return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}
*/




// START!
//d3.select("#barchart_count").on("resize", draw)

//window.addEventListener("resize", draw);

DATADIR = window.DATADIR || "./temp_data/"

// Loading overlay: covers the page until the data is drawn (so nothing can be
// clicked too early), or explains a load failure instead of leaving a blank page
var loadStartTime = performance.now()
var loadingOverlay = document.createElement("div")
loadingOverlay.id = "loading_overlay"
loadingOverlay.setAttribute("role", "status")
loadingOverlay.setAttribute("aria-live", "polite")
loadingOverlay.style.cssText = "position:fixed; top:0; right:0; bottom:0; left:0; z-index:1050; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.9);"
loadingOverlay.innerHTML = '<div class="text-center"><div class="spinner-border text-secondary" aria-hidden="true"></div><div class="mt-2">Loading data…</div></div>'
document.body.appendChild(loadingOverlay)

function show_load_error(err){
  console.error("Data loading failed:", err)
  loadingOverlay.innerHTML = '<div class="text-center p-4">' +
    '<div class="fw-bold mb-2">The data for this page could not be loaded.</div>' +
    '<div class="mb-3">Please tell the study facilitator.</div>' +
    '<button type="button" class="btn btn-sm btn-outline-secondary" onclick="location.reload()">Reload page</button></div>'
}

// Load node features CSV (optional - may not exist for all datasets)
var nodeFeaturesCsvPath = window.NODE_FEATURES_CSV || (DATADIR + "node_features.csv");
var nodeFeaturesPromise = d3.csv(nodeFeaturesCsvPath).catch(function() {
  console.log("No node_features.csv found at " + nodeFeaturesCsvPath + " — skipping node feature lookup.");
  return null;
});

var tableAndChartsLoaded = Promise.all([
  d3.csv(DATADIR+"facebook_data_transformed_new.csv"),
  d3.csv(DATADIR+"commuity_count.csv"),
  d3.csv(DATADIR+"commuity_density.csv"),
  d3.csv(DATADIR+"commuity_h_degree.csv"),
  d3.csv(DATADIR+"commuity_number_of_connections.csv")
]).then((data) => {

  console.log("ALL DATA LOADED");
  console.log(data.map(d => d.length));

  show_table_data(data[0]);
  console.log("table OK");

  if (document.getElementById("barchart-no_of_nodes")) {
    showdata_count(data[1]);
    console.log("count OK");
  }

  if (document.getElementById("barchart-density")) {
    showdata_density(data[2]);
    console.log("density OK");
  }

  if (document.getElementById("barchart-h_degree")) {
    showdata_hdegree(data[3]);
    console.log("hdegree OK");
  }

  if (document.getElementById("heatmap-connectivity")) {
    showdata_connections(data[4]);
    console.log("connections OK");
  }

});


var mainChartLoaded = Promise.all([
  d3.csv(DATADIR+"facebook_data_transformed_new.csv"),
  d3.csv(DATADIR+"coarse_graph_pos.csv"),
  d3.csv(DATADIR+"link_data.csv"),
  d3.csv(DATADIR+"node_to_node_link_data.csv"),
  d3.json(DATADIR+"connection_list.json"),
  d3.json(DATADIR+"new_extent_without_outliers_for_colorcoding.json"),
  d3.csv(DATADIR+"commuity_count.csv"), 
  d3.csv(DATADIR+"commuity_density.csv"),
  d3.csv(DATADIR+"commuity_h_degree.csv"),
  d3.json(DATADIR+"coarse_graph_data.json"),
  d3.json(DATADIR+"community_connection_list.json"),
  d3.csv(DATADIR+"commuity_number_of_connections.csv"),
  nodeFeaturesPromise
  ]).then(showdata_spiral_community_chart)

// remove the overlay once everything is drawn; this is the point to start timing a task
Promise.all([tableAndChartsLoaded, mainChartLoaded]).then(function(){
  loadingOverlay.remove()
  window.dashboardReadyTime = performance.now()
  console.info("Dashboard ready after " + Math.round(window.dashboardReadyTime - loadStartTime) + " ms")
}).catch(show_load_error)
