let density_var = 0;
let eign_var = 0;
let betweenness_var = 0;
let closeness_var = 0;

// ============================================================
// Active dataset
// The community filter defines the active subset: every ranking, node
// filter, colouring, search and Most Connected works only on it.
// global_data_unchanged stays the full master list of nodes.
// ============================================================
let community_ranking_key = null      // null = page-load order, else 'size' | 'degree' | 'density' | 'connections'
let node_ranking_key = 'centrality'   // 'centrality' (degree) | 'closeness' | 'eign' | 'betwness'
let full_community_stats              // whole-dataset community stats {size, degree, density, connections}
let active_communities = new Set()    // community ids in the active subset
let active_data = []                  // nodes of the active communities
let active_node_community = new Map() // node id -> community, for active nodes
let layout_data = []                  // active_data with positions for the current ranking

function all_community_ids(){
  return full_community_stats.size.map(function(d){ return d.community })
}

function community_filter_active(){
  return active_communities.size < full_community_stats.size.length
}

// neighbours of a node that are inside the active subset
function active_neighbours(node){
  var neighbours = connections_list[node] || []
  if (!community_filter_active()) return neighbours
  return neighbours.filter(function(m){ return active_node_community.has(+m) })
}

// "(full network: N)" after a degree that was counted inside the active subset
function degree_label_suffix(d){
  if (!d || !community_filter_active() || d.centrality == d.centrality_full) return ""
  return " (full network: " + d.centrality_full + ")"
}

// closeness and eigenvector are always whole-network values
function full_network_suffix(){
  return community_filter_active() ? " (full network)" : ""
}

// make `ids` the active subset; degree and community stats are recomputed inside it
function set_active_communities(ids){
  active_communities = new Set(ids)
  active_data = global_data_unchanged.filter(function(d){ return active_communities.has(d.community) })
  active_node_community = new Map()
  active_data.forEach(function(d){ active_node_community.set(d.node, d.community) })
  var filtered = community_filter_active()

  global_data_unchanged.forEach(function(d){
    d.centrality = (filtered && active_node_community.has(d.node)) ? active_neighbours(d.node).length : d.centrality_full
  })

  var keep = function(d){ return active_communities.has(d.community) }
  community_size_data = full_community_stats.size.filter(keep)
  heighest_density_data = full_community_stats.density.filter(keep)
  if (!filtered){
    heighest_degree_data = full_community_stats.degree.slice()
    number_of_community_connections_data = full_community_stats.connections.slice()
    update_slider_ranges()
    return
  }
  var max_degree = {}
  active_data.forEach(function(d){ max_degree[d.community] = Math.max(max_degree[d.community] || 0, d.centrality) })
  heighest_degree_data = full_community_stats.degree.filter(keep).map(function(d){
    return {community: d.community, degree: max_degree[d.community] || 0}
  })
  number_of_community_connections_data = full_community_stats.connections.filter(keep).map(function(d){
    var linked = community_view_mode === 'louvain' ? (community_connections_list[d.community] || []) : []
    var count = linked.filter(function(c){ return c != d.community && active_communities.has(+c) }).length
    return {community: d.community, connections: count}
  })
  update_slider_ranges()
}

// round up to the slider step, e.g. 0.4631 -> 0.47 for a step of 0.01
function round_up_to_step(value, step, decimals){
  return Number((Math.ceil(value / step) * step).toFixed(decimals))
}

function set_slider_range(id, max, step){
  var el = document.getElementById(id)
  if (!el) return
  // never below the slider's current value, so an applied threshold stays on the slider
  el.max = Math.max(max, parseFloat(el.value) || 0)
  el.step = step
}

// slider ranges follow the data in view (active subset), so every threshold is reachable
function update_slider_ranges(){
  var max_of = function(data, key){ return d3.max(data, function(d){ return d[key] }) || 0 }
  set_slider_range('Degree', max_of(active_data, 'centrality'), 1)
  set_slider_range('MostConnected', max_of(active_data, 'centrality'), 1)
  set_slider_range('Closeness', round_up_to_step(max_of(active_data, 'closeness'), 0.01, 2), 0.01)
  set_slider_range('Eign', round_up_to_step(max_of(active_data, 'eign'), 0.001, 3), 0.001)
  set_slider_range('commRangeMinSize', max_of(community_size_data, 'size'), 1)
  set_slider_range('commRangeMinDensity', round_up_to_step(max_of(heighest_density_data, 'density'), 0.01, 2), 0.01)
  set_slider_range('commRangeMinDegree', max_of(heighest_degree_data, 'degree'), 1)
  set_slider_range('commRangeMinConn', max_of(number_of_community_connections_data, 'connections'), 1)
}

// community order for the current community ranking, active communities only
function current_community_order(){
  var keep = function(d){ return active_communities.has(d.community) }
  if (community_ranking_key === null) return initial_state.community_order.filter(keep)
  var sources = {
    size: [community_size_data, 'size'],
    degree: [heighest_degree_data, 'degree'],
    density: [heighest_density_data, 'density'],
    connections: [number_of_community_connections_data, 'connections']
  }
  var source = sources[community_ranking_key] || sources.size
  return source[0].filter(keep).sort(function(a,b){ return d3.descending(a[source[1]], b[source[1]]) })
}

// lay out the active subset for the current rankings and start a fresh chart (also clears zoom)
function relayout(){
  var ordered = []
  d3.group(active_data, function(d){ return d.community }).forEach(function(nodes){
    nodes.sort(function(a,b){ return d3.descending(a[node_ranking_key], b[node_ranking_key]) })
    ordered.push.apply(ordered, nodes)
  })

  d3.select("#chart").selectAll("svg").remove()
  d3.select("#legend1").selectAll("canvas").remove()
  var svg = d3.select("#chart").attr("height", "80vh") // the height set in the dataset pages
  var bounds = svg.node().getBoundingClientRect()
  var width = bounds.width
  var height = bounds.height
  layout_data = computing_spiral_positions(current_community_order(), ordered, optimal_no_of_nodes, height, width)
  if (computed_total_community_height > height){
    height = computed_total_community_height
    svg.attr("height", height)
  }
  initializeSpiralChart(svg, height, width)
}

function passes_node_filters(d){
  return d.centrality>=density_var && d.betwness>=betweenness_var && d.eign>=eign_var && d.closeness>=closeness_var
}

// node filters only hide nodes of the active subset; positions stay where they are
function apply_node_filters(){
  global_data = layout_data.filter(passes_node_filters)
  draw_spiral_community()
  table.selectAll("tr").remove()
  show_table_data(global_data)
  update_counts()
}

// "Nodes / Edges" header: what is currently drawn
function update_counts(){
  var shown = new Set(global_data.map(function(d){ return d.node }))
  var edge_ends = 0
  global_data.forEach(function(d){
    (connections_list[d.node] || []).forEach(function(m){ if (shown.has(+m) && +m != d.node) edge_ends++ })
  })
  d3.select("#connection_tooltip").html("<b>Nodes:</b> " + global_data.length + " &emsp; <b>Edges:</b> " + (edge_ends / 2))
}

// clear the node / community details in the right-hand panel
function clear_selection_panels(){
  d3.select("#node_textbox").html("")
  d3.select("#community_textbox").html("")
  d3.select("#community_connection_textbox").html("")
  d3.select("#community_spiral").selectAll("svg").remove()
  d3.select("#community_barchart").html("")
  d3.select("#community_piechart").html("")
  d3.select("#community_histogram").selectAll("svg").remove()
}

// redraw everything after the active subset changed
function show_active_subset(){
  // a found node outside the new subset is no longer selected
  if (find_node_id != -1 && !active_node_community.has(+find_node_id)){
    find_node_id = -1
    setInputValue('textInputNodeId', '')
  }
  clear_selection_panels()
  relayout()
  apply_node_filters()
  redraw_community_charts()
}

function clear_community_filter_inputs(){
  setInputValue('textInputCommunityFilter', '')
  setInputValue('commRangeMinSize', 0)
  setInputValue('commRangeMinSizeText', 0)
  setInputValue('commRangeMinDensity', 0)
  setInputValue('commRangeMinDensityText', 0)
  setInputValue('commRangeMinDegree', 0)
  setInputValue('commRangeMinDegreeText', 0)
  setInputValue('commRangeMinConn', 0)
  setInputValue('commRangeMinConnText', 0)
}

//community ranking (active communities only)
function Community_ranking_size(){
  turnOffMostConnected()
  community_ranking_key = 'size'
  relayout()
  apply_node_filters()
  d3.select("#community_ranking_tooltip").html("<b>Community ranking:</b> Size ")
}

function Community_ranking_degree(){
  turnOffMostConnected()
  community_ranking_key = 'degree'
  relayout()
  apply_node_filters()
  d3.select("#community_ranking_tooltip").html("<b>Community ranking:</b> Max degree ")
}

function Community_ranking_density(){
  turnOffMostConnected()
  community_ranking_key = 'density'
  relayout()
  apply_node_filters()
  d3.select("#community_ranking_tooltip").html("<b>Community ranking:</b> Edge density ")
}

function Community_ranking_connection(){
  turnOffMostConnected()
  community_ranking_key = 'connections'
  relayout()
  apply_node_filters()
  d3.select("#community_ranking_tooltip").html("<b>Community ranking:</b> Connections ")
}




//most connected node identification (nodes currently in view only)
//degree range_bar
function MostConnectedNodes(val) {
  // one mode at a time: Most Connected clears Find Node
  find_node_id = -1
  setInputValue('textInputNodeId', '')

  // slider at 0 means Most Connected is off
  if (+val === 0) {
    turnOffMostConnected()
    apply_node_filters()
    return
  }

  //first set the flag
  flag_most_connected_nodes = 1
  document.getElementById('textInputConnecteddeg').value=val;
  // nodes in view: active communities with the node filters applied
  // (degree is counted inside the active subset)
  var nodes_in_view = layout_data.filter(passes_node_filters)
  most_connected_nodes_data = nodes_in_view.filter(function(d){
        return d.centrality>=val
        })
  //most connected communities
  var list_of_most_connected_communities = [... new Set(most_connected_nodes_data.map(function(d){return d.community}))]
  //filter the community data since you also want to show those communities
  global_data = nodes_in_view.filter(function(d){
    return list_of_most_connected_communities.includes(d.community)
  })
  var list_of_most_connected_nodes = new Set(most_connected_nodes_data.map(function(d){return d.node}))

  g.select(".brush").call(brush.move, null);
  draw_spiral_community()
  update_counts()

  d3.selectAll("circle")
.attr("opacity", function(d){
    if(d && list_of_most_connected_nodes.has(d.node) ) return 1
    else return .05} )

}

//ranking button: order of nodes inside each active community
function rank_nodes_by(key, label){
  turnOffMostConnected()
  node_ranking_key = key
  relayout()
  apply_node_filters()
  d3.select("#ranking_tooltip").html("<b>Node ranking:</b> " + label + " ")
}

//ranking based on degree
function degree_ranking(){
  rank_nodes_by('centrality', 'Degree')
}

// ranking based on closeness
function closeness_ranking(){
  rank_nodes_by('closeness', 'Closeness')
}

//ranking based on eign centrality
function eign_ranking(){
  rank_nodes_by('eign', 'Eigenvector')
}

//ranking based on betweenness centrality
function between_ranking(){
  rank_nodes_by('betwness', 'Betweenness')
}

//radius range bar
function updateTextInputRadius(val) {
  console.log(val)
  console.log(global_data)
  document.getElementById('textInputradius').value=val;
  global_radius = val
  g.select(".brush").call(brush.move, null);
  draw_spiral_community()
  //show only selected community in table
  table.selectAll("tr").remove()
  show_table_data(global_data)
}

//degree range_bar (node filters apply inside the active subset)
function updateTextInputdeg(val) {
  turnOffMostConnected()
  document.getElementById('textInputdeg').value=val;
  density_var = val;
  apply_node_filters()
}

//betweenness range_bar
function updateTextInputbet(val) {
  turnOffMostConnected()
  document.getElementById('textInputbet').value=val;
  betweenness_var = val
  apply_node_filters()
}

//eign range_bar
function updateTextInputeig(val) {
  turnOffMostConnected()
  document.getElementById('textInputeig').value=val;
  eign_var = val ;
  apply_node_filters()
}

//closeness range_bar
function updateTextInputclo(val) {
  turnOffMostConnected()
  document.getElementById('textInputclo').value=val;
  closeness_var =val
  apply_node_filters()
}

//colorcoding
function colorNodesByDensity(){
  turnOffMostConnected()
   densityColFlag = 1
   degreeColFlag = 0
   closenessColFlag = 0
   betweennessColFlag = 0
   eignColFlag = 0
   g.select(".brush").call(brush.move, null);
   draw_spiral_community()
   d3.select("#color_tooltip").html("<b>Color:</b> Edge density ")
}

function colorNodesByDegree(){
  turnOffMostConnected()
  densityColFlag = 0
  degreeColFlag = 1
  closenessColFlag = 0
  betweennessColFlag = 0
  eignColFlag = 0
  g.select(".brush").call(brush.move, null);
  draw_spiral_community()
  d3.select("#color_tooltip").html("<b>Color:</b> Degree ")
}

function colorNodesByCloseness(){
  turnOffMostConnected()
  densityColFlag = 0
  degreeColFlag = 0
  closenessColFlag = 1
  betweennessColFlag = 0
  eignColFlag = 0
  g.select(".brush").call(brush.move, null);
  draw_spiral_community()
  d3.select("#color_tooltip").html("<b>Color:</b> Closeness ")
}

function colorNodesByBetweeness(){
  turnOffMostConnected()
  densityColFlag = 0
  degreeColFlag = 0
  closenessColFlag = 0
  betweennessColFlag = 1
  eignColFlag = 0
  g.select(".brush").call(brush.move, null);
  draw_spiral_community()
  d3.select("#color_tooltip").html("<b>Color:</b> Betweenness ")
}

function colorNodesByEign(){
  turnOffMostConnected()
  densityColFlag = 0
  degreeColFlag = 0
  closenessColFlag = 0
  betweennessColFlag = 0
  eignColFlag = 1
  g.select(".brush").call(brush.move, null);
  draw_spiral_community()
  d3.select("#color_tooltip").html("<b>Color:</b> Eigenvector ")

}


  function find_node_by_label(){

    var node_community;
    var node_density,
    node_centrality,
    node_closeness,
    node_eign;

    var input_text = document.getElementById('textInputNodeId').value.trim()
    var searched_node = /^\d+$/.test(input_text) ? +input_text : null
    if (searched_node === null){
      showStatusMessage(input_text === '' ? 'Enter a node ID' : 'Node ' + input_text + ' not found', 'warning')
      return
    }
    // only nodes in view (active communities, node filters applied) can be found
    var nodes_in_view = layout_data.filter(passes_node_filters)
    if (!nodes_in_view.some(function(d){ return d.node == searched_node })){
      var node_exists = global_data_unchanged.some(function(d){ return d.node == searched_node })
      showStatusMessage(node_exists ? 'Node ' + input_text + ' is not in the current filtered view' : 'Node ' + input_text + ' not found', 'warning')
      return
    }

    // one mode at a time: finding a node turns Most Connected off
    turnOffMostConnected()
    find_node_id = searched_node
    g.select(".brush").call(brush.move, null);
    draw_spiral_community()



    //search the nodes in view to find the node and then community and denstity of searched node
    var found_node
    for(i=0; i<global_data.length; i++)
    {
      if (global_data[i].node == find_node_id)
      {
        found_node = global_data[i]
        node_community = global_data[i].community
        node_density = global_data[i].density
        node_centrality = global_data[i].centrality
        node_closeness = global_data[i].closeness
        node_eign = global_data[i].eign
        break;
      }
    }
    //highlighting the node and commun ijty in seperate window (nodes in view only)
    var node_community_data = global_data.filter(function(client){return client.community==node_community})
    node_community_data.sort(function(a,b){return d3.descending(a.centrality,b.centrality)})
    find_node_draw_spiral(node_community_data)
    //node textbox
    var margin = {top: 10, right: 30, bottom: 30, left: 40},
      width = 250 - margin.left - margin.right,
      height = 250 - margin.top - margin.bottom;

      d3.select("#community_histogram").select("svg").remove()
    d3.select("#node_textbox").select("svg").remove()
    d3.select("#community_barchart").html("")

  // append the svg object to the body of the page
    var featureHtml = "";
    if (Object.keys(nodeFeatureLookup).length > 0) {
      var colLabel = feature_column_label();
      var fieldVal = nodeFeatureLookup.hasOwnProperty(+find_node_id) ? nodeFeatureLookup[+find_node_id] : -1;
      var fieldName = typeof FIELD_NAMES !== 'undefined' && FIELD_NAMES.hasOwnProperty(fieldVal) ? FIELD_NAMES[fieldVal] : (fieldVal === -1 ? "Unknown" : fieldVal);
      featureHtml = "<b>" + colLabel + ":</b> " + fieldName + "<br/>";
    }

    var svg = d3.select("#node_textbox")
      .html("<br/><b>Found node:</b> " + find_node_id + "<br/><b>Community: </b>"+ node_community +"<br/>" + 
      featureHtml +
      "<b>Degree:</b> "+ node_centrality + degree_label_suffix(found_node) + "<br/>" +
       "<b>Closeness:</b> " + node_closeness + full_network_suffix() + "<br/>" +
       "<b>Eigenvector:</b> " + node_eign + full_network_suffix() )
       .style("font-size", "12px")
    //highlight the node in table also
    //introduce the reset button to reset the entire visualization again

    //highlight the searched node in table
      table.selectAll("tr").remove()
      show_table_data(global_data)

  }


//show and hide edges button
  function edge_visualization(){
    let opa =d3.selectAll(".spiral_edges").style("stroke-opacity")
    //console.log(active_community)
    if (opa ==1){
      d3.selectAll(".spiral_edges")
      .style("stroke-opacity", 0)
    }else{
      d3.selectAll(".spiral_edges")
      .style("stroke-opacity", 1)

    }
  }



  // set an input's value only if the element exists, so a missing id can't abort reset
  function setInputValue(id, value){
    var el = document.getElementById(id)
    if (el) el.value = value
  }

  // brief on-screen message, e.g. "View reset" (success) or "Node 99999 not found" (warning)
  var statusMessageTimer
  function showStatusMessage(text, variant){
    var el = document.getElementById('status_message')
    if (!el){
      el = document.createElement('div')
      el.id = 'status_message'
      el.setAttribute('role', 'status')
      el.setAttribute('aria-live', 'polite')
      el.style.cssText = 'position:fixed; top:64px; left:50%; transform:translateX(-50%); z-index:2000; margin:0; display:none;'
      document.body.appendChild(el)
    }
    el.className = 'alert alert-' + (variant || 'success') + ' py-1 px-3 shadow-sm'
    el.textContent = text
    el.style.display = 'block'
    clearTimeout(statusMessageTimer)
    statusMessageTimer = setTimeout(function(){ el.style.display = 'none' }, 2500)
  }

  // Most Connected and Find Node are used one at a time, and any other control
  // (colour, filter, ranking, view) also ends Most Connected mode
  function turnOffMostConnected(){
    if (flag_most_connected_nodes) global_data = layout_data.filter(passes_node_filters)
    flag_most_connected_nodes = 0
    most_connected_nodes_data = undefined
    setInputValue('MostConnected', 0)
    setInputValue('textInputConnecteddeg', 0)
  }

  //reset button: restore the exact page-load view
  function reset_button(){
    if (!initial_state) return // data not loaded yet

    //community view: restore Louvain communities and densities by node id
    global_data_unchanged.forEach(function(d){
      var attrs = initial_state.node_attrs[d.node]
      if (attrs){
        d.community = attrs.community
        d.density = attrs.density
      }
    })
    community_view_mode = 'louvain'
    // clear the metadata-view backup so the next switch takes a fresh one
    original_community_backup = null
    original_density_backup = null
    original_community_size_data = null
    original_heighest_degree_data = null
    original_heighest_density_data = null
    original_number_of_community_connections_data = null

    //community stats and rankings
    full_community_stats = {
      size: initial_state.size.slice(),
      degree: initial_state.degree.slice(),
      density: initial_state.density.slice(),
      connections: initial_state.connections.slice()
    }
    community_ranking_key = null
    node_ranking_key = 'centrality'

    //node filters
    density_var = 0
    eign_var = 0
    betweenness_var = 0
    closeness_var = 0

    //find node and most connected nodes
    find_node_id = -1
    turnOffMostConnected()

    //color-coding back to density
    densityColFlag = 1
    degreeColFlag = 0
    closenessColFlag = 0
    betweennessColFlag = 0
    eignColFlag = 0

    //zoom and hover state
    brushFlag = 0
    clearTimeout(idleTimeout)
    idleTimeout = null
    activeCommunity = 200

    //sidebar controls (sliders get '0', never '' which jumps to the midpoint)
    setInputValue('textInputNodeId', '')
    setInputValue('textInputdeg', 0)
    setInputValue('Degree', 0)
    setInputValue('textInputclo', 0)
    setInputValue('Closeness', 0)
    setInputValue('textInputeig', 0)
    setInputValue('Eign', 0)
    setInputValue('textInputbet', 0)
    setInputValue('Betweenness', 0)
    setInputValue('textInputCommunityFilter', '')
    setInputValue('commRangeMinSize', 0)
    setInputValue('commRangeMinSizeText', 0)
    setInputValue('commRangeMinDensity', 0)
    setInputValue('commRangeMinDensityText', 0)
    setInputValue('commRangeMinDegree', 0)
    setInputValue('commRangeMinDegreeText', 0)
    setInputValue('commRangeMinConn', 0)
    setInputValue('commRangeMinConnText', 0)

    //clearing the highlight window and hover highlights
    clear_selection_panels()
    div.style("opacity", 0)
    d3.selectAll(".bar-feature-tooltip").style("opacity", 0)
    d3.selectAll(".barLight").attr("class", "bar")

    //complete dataset back in page-load order; the community filter is cleared
    global_data_unchanged.sort(function(a,b){return d3.descending(a.node, b.node)})
    set_active_communities(all_community_ids())
    relayout()
    apply_node_filters()
    redraw_community_charts()

    //header labels
    d3.select("#ranking_tooltip").html(initial_state.ranking_label)
    d3.select("#community_ranking_tooltip").html(initial_state.community_ranking_label)

    showStatusMessage('View reset', 'success')
  }

  // Community filter: keep only the selected communities of the current subset
  function applyCommunityFilter() {
    var filterInput = document.getElementById('textInputCommunityFilter').value.trim();
    var requested = filterInput.split(',').map(function(s) { return s.trim(); })
      .filter(function(s) { return s !== '' && !isNaN(+s); }).map(Number);
    if (requested.length === 0) {
      showStatusMessage('Enter community IDs, e.g. 0,1,5', 'warning');
      return;
    }

    // a further filter narrows the current subset
    var kept = requested.filter(function(c) { return active_communities.has(c); });
    var ignored = requested.filter(function(c) { return !active_communities.has(c); });
    if (kept.length === 0) {
      showStatusMessage('None of these communities are in the current view', 'warning');
      return;
    }

    turnOffMostConnected();
    set_active_communities(kept);
    show_active_subset();
    if (ignored.length > 0)
      showStatusMessage('Not in the current view, ignored: ' + ignored.join(', '), 'warning');
  }

  // Reset community filter: back to all communities (rankings, colouring and node filters stay)
  function resetCommunityFilter() {
    clearCommunityFilters()
  }

  function clearCommunityFilters() {
    turnOffMostConnected()
    clear_community_filter_inputs()
    set_active_communities(all_community_ids())
    show_active_subset()
  }


// ============================================================
// Community Range Filter
// Keep only the communities of the current subset whose size, density,
// max-degree, and connections (counted inside the subset) pass the minimums.
// ============================================================

function applyCommunityRangeFilter() {
  var minSize = parseFloat(document.getElementById('commRangeMinSize').value) || 0;
  var minDensity = parseFloat(document.getElementById('commRangeMinDensity').value) || 0;
  var minDegree = parseFloat(document.getElementById('commRangeMinDegree').value) || 0;
  var minConn = parseFloat(document.getElementById('commRangeMinConn').value) || 0;

  // the stats arrays only hold the active communities
  var densityMap = {};
  heighest_density_data.forEach(function(d) { densityMap[d.community] = d.density; });
  var degreeMap = {};
  heighest_degree_data.forEach(function(d) { degreeMap[d.community] = d.degree; });
  var connMap = {};
  number_of_community_connections_data.forEach(function(d) { connMap[d.community] = d.connections; });

  var passingCommunities = community_size_data.filter(function(d) {
    var comm = d.community;
    return d.size >= minSize &&
      (densityMap[comm] || 0) >= minDensity &&
      (degreeMap[comm] || 0) >= minDegree &&
      (connMap[comm] || 0) >= minConn;
  }).map(function(d) { return d.community; });

  if (passingCommunities.length === 0) {
    showStatusMessage('No communities in the current view match these ranges', 'warning');
    return;
  }

  turnOffMostConnected();
  set_active_communities(passingCommunities);
  show_active_subset();
}

function resetCommunityRangeFilter() {
  clearCommunityFilters()
}
// ============================================================
// Community View Toggle: Louvain vs Metadata
// ============================================================
var community_view_mode = 'louvain'; // 'louvain' or 'metadata'
var original_community_backup = null; // stores original Louvain community assignments
var original_density_backup = null;   // stores original Louvain density assignments
var original_community_size_data = null;
var original_heighest_degree_data = null;
var original_heighest_density_data = null;
var original_number_of_community_connections_data = null;

function switchCommunityView(mode) {
  if (mode === community_view_mode) return; // already in this mode

  // Backup original Louvain communities on first switch
  if (!original_community_backup && global_data_unchanged && global_data_unchanged.length > 0) {
    original_community_backup = global_data_unchanged.map(function(d) { return d.community; });
    original_density_backup = global_data_unchanged.map(function(d) { return d.density; });
    original_community_size_data = full_community_stats.size.slice();
    original_heighest_degree_data = full_community_stats.degree.slice();
    original_heighest_density_data = full_community_stats.density.slice();
    original_number_of_community_connections_data = full_community_stats.connections.slice();
  }

  community_view_mode = mode;

  if (mode === 'metadata') {
    // Check if nodeFeatureLookup has data
    if (!nodeFeatureLookup || Object.keys(nodeFeatureLookup).length === 0) {
      showStatusMessage("Metadata groups are not available for this dataset", "warning");
      community_view_mode = 'louvain';
      return;
    }

    // Replace community field with cs_field (metadata group)
    global_data_unchanged.forEach(function(d) {
      d.community = d.cs_field !== undefined && d.cs_field !== -1 ? d.cs_field : -1;
    });

    // Recompute community ranking data from the metadata communities
    var communityCountMap = {};
    global_data_unchanged.forEach(function(d) {
      var key = String(d.community);
      communityCountMap[key] = (communityCountMap[key] || 0) + 1;
    });

    // Build community_size_data preserving original type
    var uniqueComms = [];
    var seen = {};
    global_data_unchanged.forEach(function(d) {
      var key = String(d.community);
      if (!seen[key]) {
        seen[key] = true;
        uniqueComms.push(d.community);
      }
    });

    community_size_data = uniqueComms.map(function(comm) {
      return { community: comm, size: communityCountMap[String(comm)] || 0 };
    }).sort(function(a, b) { return d3.descending(a.size, b.size); });

    // Build placeholder degree/connections data, but accurately compute density
    var commNodesMap = {};
    global_data_unchanged.forEach(function(d) {
      if (!commNodesMap[d.community]) commNodesMap[d.community] = [];
      commNodesMap[d.community].push(d);
    });

    heighest_degree_data = community_size_data.map(function(d) {
      return { community: d.community, degree: 0 };
    });
    
    heighest_density_data = community_size_data.map(function(d) {
      var comm_nodes = commNodesMap[d.community] || [];
      var nSize = comm_nodes.length;
      var edges = 0;
      
      var nodeIds = new Set(comm_nodes.map(function(n) { return n.node; }));
      comm_nodes.forEach(function(nodeObj) {
         var neighbors = connections_list[nodeObj.node] || [];
         neighbors.forEach(function(nb) {
            // connections_list nodes are sometimes strings, sometimes numbers. Standardize lookup.
            if (nodeIds.has(String(nb)) || nodeIds.has(Number(nb))) {
               edges++;
            }
         });
      });
      edges = edges / 2;
      var density = 0;
      if (nSize > 1) {
         density = edges / (nSize * (nSize - 1) / 2);
      }
      
      // Assign the new community-wide density to each metadata node
      comm_nodes.forEach(function(nodeObj) {
         nodeObj.density = density;
      });

      return { community: d.community, density: density };
    });
    
    number_of_community_connections_data = community_size_data.map(function(d) {
      return { community: d.community, connections: 0 };
    });

    console.log("Metadata communities:", community_size_data.length, community_size_data);

  } else {
    // Restore original Louvain communities
    if (original_community_backup) {
      global_data_unchanged.forEach(function(d, i) {
        d.community = original_community_backup[i];
        d.density = original_density_backup[i];
      });
      community_size_data = original_community_size_data.slice();
      heighest_degree_data = original_heighest_degree_data.slice();
      heighest_density_data = original_heighest_density_data.slice();
      number_of_community_connections_data = original_number_of_community_connections_data.slice();
    }
  }

  turnOffMostConnected();

  // the community filter is cleared: community ids mean something else in the other view
  full_community_stats = {
    size: community_size_data.slice(),
    degree: heighest_degree_data.slice(),
    density: heighest_density_data.slice(),
    connections: number_of_community_connections_data.slice()
  };
  community_ranking_key = mode === 'metadata' ? 'size' : null;
  clear_community_filter_inputs();
  set_active_communities(all_community_ids());
  show_active_subset();

  // Update tooltip
  var numComms = community_size_data.length;
  var modeLabel = mode === 'metadata' ? 'Metadata (' + numComms + ' groups)' : 'Louvain';
  d3.select("#community_ranking_tooltip").html("<b>Community View:</b> " + modeLabel);
}
