let density_var = 0;
let eign_var = 0;
let betweenness_var = 0;
let closeness_var = 0;

let flag_community_size =1
let flag_community_degree =0
let flag_community_density=0
let flag_community_connections=0

//community ranking
function Community_ranking_size(){
  turnOffMostConnected()
  let height = 1200
  let width =1200
  let prepare_data = []
  unique_communities = new Set(global_data_unchanged.map(function(d){return d.community}))
  console.log("updated_version_degree")
  unique_communities.forEach(function(entry) {
    community_data = global_data_unchanged.filter(function(d){ return d.community == entry});
    community_data.sort(function(a,b){return d3.descending(a.centrality,b.centrality)})
    prepare_data.push.apply(prepare_data,community_data)
  })
  console.log(prepare_data)

  flag_community_size =1
  flag_community_degree =0
  flag_community_density=0
  flag_community_connections=0
 
  community_size_data.sort(function(a,b){return d3.descending(a.size,b.size)})

//sort all other community files based on degree
let new_heighest_degree_data=[]
let new_connection_data =[]
let new_density_data =[]

community_size_data.forEach(function(d){
  //console.log(d.community)
  heighest_degree_data .forEach(function(degree_d){
    if (degree_d.community == d.community)
    new_heighest_degree_data.push(degree_d)})
  
  number_of_community_connections_data.forEach(function(connect_d){
    if (connect_d.community == d.community)
    new_connection_data.push(connect_d)})

  heighest_density_data.forEach(function(density_d){
    if (density_d.community == d.community)
    new_density_data.push(density_d)})   
})

heighest_degree_data= new_heighest_degree_data
number_of_community_connections_data = new_connection_data
heighest_density_data = new_density_data

console.log(community_size_data)
console.log(heighest_density_data )
console.log(heighest_degree_data )
console.log(number_of_community_connections_data)




  
  //calculate final x and y position for each point
  //computing_spiral_positions(center_positions_spiral, data, optimal_no_of_nodes, height, width)
  //prepare_data = computing_spiral_positions(center_positions_spiral, prepare_data, height, width)
  prepare_data = computing_spiral_positions(community_size_data, prepare_data,optimal_no_of_nodes, height, width)
  // Update height to match the actual content
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data
  global_data_unchanged = prepare_data


  d3.select("#chart").selectAll("svg").remove()


  //assign height and width of svg
  let svg = d3.select("#chart")
  initializeSpiralChart(svg, height, width)
  draw_spiral_community()
  d3.select("#community_ranking_tooltip").html("<b>Community Ranking:</b> Size ")

}
//
function Community_ranking_degree(){
  turnOffMostConnected()
  flag_community_size =0
  flag_community_degree =1
  flag_community_density=0
  flag_community_connections=0

  let height = 1200
  let width =1200

  // Pre-sort nodes within each community (same pattern as Community_ranking_size)
  let prepare_data = []
  let unique_communities = new Set(global_data_unchanged.map(function(d){return d.community}))
  unique_communities.forEach(function(entry) {
    let community_data = global_data_unchanged.filter(function(d){ return d.community == entry});
    community_data.sort(function(a,b){return d3.descending(a.centrality,b.centrality)})
    prepare_data.push.apply(prepare_data,community_data)
  })

  heighest_degree_data.sort(function(a,b){return d3.descending(a.degree,b.degree)})
  console.log(heighest_degree_data)

  //sort all other community files based on degree
  let new_size_data=[]
  let new_connection_data =[]
  let new_density_data =[]

  heighest_degree_data.forEach(function(d){
    community_size_data.forEach(function(size_d){
      if (size_d.community == d.community)
        new_size_data.push(size_d)})
    number_of_community_connections_data.forEach(function(connect_d){
      if (connect_d.community == d.community)
        new_connection_data.push(connect_d)})
    heighest_density_data.forEach(function(density_d){
      if (density_d.community == d.community)
        new_density_data.push(density_d)})
  })

  community_size_data= new_size_data
  number_of_community_connections_data = new_connection_data
  heighest_density_data = new_density_data

  //calculate final x and y position for each point
  prepare_data = computing_spiral_positions(heighest_degree_data, prepare_data, optimal_no_of_nodes, height, width)
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data
  global_data_unchanged = prepare_data

  d3.select("#chart").selectAll("svg").remove()

  //assign height and width of svg
  let svg = d3.select("#chart")
  initializeSpiralChart(svg, height, width)
  draw_spiral_community()
  d3.select("#community_ranking_tooltip").html("<b>Community Ranking:</b> Heighest Degree ")
}
function Community_ranking_density(){
  turnOffMostConnected()
  flag_community_size =0
  flag_community_degree =0
  flag_community_density=1
  flag_community_connections=0

  let height = 1200
  let width =1200

  // Pre-sort nodes within each community (same pattern as Community_ranking_size)
  let prepare_data = []
  let unique_communities = new Set(global_data_unchanged.map(function(d){return d.community}))
  unique_communities.forEach(function(entry) {
    let community_data = global_data_unchanged.filter(function(d){ return d.community == entry});
    community_data.sort(function(a,b){return d3.descending(a.centrality,b.centrality)})
    prepare_data.push.apply(prepare_data,community_data)
  })

  heighest_density_data.sort(function(a,b){return d3.descending(a.density,b.density)})
  console.log(heighest_density_data)

  //sort all other community files based on edge-density
  let new_size_data=[]
  let new_connection_data =[]
  let new_heighest_degree_data = []

  heighest_density_data.forEach(function(d){
    community_size_data.forEach(function(size_d){
      if (size_d.community == d.community)
        new_size_data.push(size_d)})
    number_of_community_connections_data.forEach(function(connect_d){
      if (connect_d.community == d.community)
        new_connection_data.push(connect_d)})
    heighest_degree_data.forEach(function(degree_d){
      if (degree_d.community == d.community)
        new_heighest_degree_data.push(degree_d)})
  })

  community_size_data= new_size_data
  number_of_community_connections_data = new_connection_data
  heighest_degree_data = new_heighest_degree_data

  //calculate final x and y position for each point
  prepare_data = computing_spiral_positions(heighest_density_data, prepare_data, optimal_no_of_nodes, height, width)
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data
  global_data_unchanged = prepare_data

  d3.select("#chart").selectAll("svg").remove()

  //assign height and width of svg
  let svg = d3.select("#chart")
  initializeSpiralChart(svg, height, width)
  draw_spiral_community()
  d3.select("#community_ranking_tooltip").html("<b>Community Ranking:</b> Edge-Density ")
}
function Community_ranking_connection(){
  turnOffMostConnected()
  flag_community_size =0
  flag_community_degree =0
  flag_community_density=0
  flag_community_connections=1

  let height = 1200
  let width =1200

  // Pre-sort nodes within each community (same pattern as Community_ranking_size)
  let prepare_data = []
  let unique_communities = new Set(global_data_unchanged.map(function(d){return d.community}))
  unique_communities.forEach(function(entry) {
    let community_data = global_data_unchanged.filter(function(d){ return d.community == entry});
    community_data.sort(function(a,b){return d3.descending(a.centrality,b.centrality)})
    prepare_data.push.apply(prepare_data,community_data)
  })

  number_of_community_connections_data.sort(function(a,b){return d3.descending(a.connections,b.connections)})
  console.log(number_of_community_connections_data)

  //sort all other community files based on community connections
  let new_size_data=[]
  let new_density_data =[]
  let new_heighest_degree_data = []

  number_of_community_connections_data.forEach(function(d){
    community_size_data.forEach(function(size_d){
      if (size_d.community == d.community)
        new_size_data.push(size_d)})
    heighest_density_data.forEach(function(density_d){
      if (density_d.community == d.community)
        new_density_data.push(density_d)})
    heighest_degree_data.forEach(function(degree_d){
      if (degree_d.community == d.community)
        new_heighest_degree_data.push(degree_d)})
  })

  community_size_data= new_size_data
  heighest_density_data = new_density_data
  heighest_degree_data = new_heighest_degree_data

  //calculate final x and y position for each point
  prepare_data = computing_spiral_positions(number_of_community_connections_data, prepare_data, optimal_no_of_nodes, height, width)
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data
  global_data_unchanged = prepare_data

  d3.select("#chart").selectAll("svg").remove()

  //assign height and width of svg
  let svg = d3.select("#chart")
  initializeSpiralChart(svg, height, width)
  draw_spiral_community()
  d3.select("#community_ranking_tooltip").html("<b>Community Ranking:</b> Community Connections ")
}




//most connected node identification
//degree range_bar
function MostConnectedNodes(val) {
  // one mode at a time: Most Connected clears Find Node
  find_node_id = -1
  setInputValue('textInputNodeId', '')

  // slider at 0 means Most Connected is off
  if (+val === 0) {
    turnOffMostConnected()
    g.select(".brush").call(brush.move, null);
    draw_spiral_community()
    return
  }

  //first set the flag
  flag_most_connected_nodes = 1
  document.getElementById('textInputConnecteddeg').value=val;
  //node data that are most connected
  most_connected_nodes_data = global_data_unchanged.filter(function(d){
        return d.centrality>=val
        })
  //most connected communities
  var list_of_communities = most_connected_nodes_data.map(function(d){return d.community})
  console.log([... new Set(list_of_communities)])
  var list_of_most_connected_communities = [... new Set(list_of_communities)]
  //filter the community data since you also want to show those communities
  var most_connected_community_data = global_data_unchanged.filter(function(d){
    if(list_of_most_connected_communities.includes(d.community))
      return d
  })
  console.log(most_connected_community_data)
  global_data = most_connected_community_data



  console.log(most_connected_nodes_data)
  var list_of_most_connected_nodes = most_connected_nodes_data.map(function(d){return d.node})
  console.log(list_of_most_connected_nodes)




 // g.call(brush.move, null);
  g.select(".brush").call(brush.move, null);
  draw_spiral_community()

  d3.selectAll("circle")
.attr("opacity", function(d){
    if(list_of_most_connected_nodes.includes(d.node) ) return 1
    else return .05} )

}

//ranking button
//ranking based on degree
function degree_ranking(){
  turnOffMostConnected()
  let height = 1200
  let width =1200
  let prepare_data = []
  unique_communities = new Set(global_data_unchanged.map(function(d){return d.community}))
  console.log("updated_version_degree")
  unique_communities.forEach(function(entry) {
    community_data = global_data_unchanged.filter(function(d){ return d.community == entry});
    community_data.sort(function(a,b){return d3.descending(a.centrality,b.centrality)})
    prepare_data.push.apply(prepare_data,community_data)
  })
  console.log(prepare_data)

  let positions_spiral
  if (flag_community_size ==1)
    positions_spiral = community_size_data
  else if (flag_community_degree ==1)
    positions_spiral = heighest_degree_data
  else if (flag_community_density==1)
    positions_spiral = heighest_density_data
  //else if (flag_community_connections==1)
    //positions_spiral = community_connection_data

  //calculate final x and y position for each point
  //computing_spiral_positions(center_positions_spiral, data, optimal_no_of_nodes, height, width)
  //prepare_data = computing_spiral_positions(center_positions_spiral, prepare_data, height, width)
  prepare_data = computing_spiral_positions(positions_spiral, prepare_data,optimal_no_of_nodes, height, width)
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data
  global_data_unchanged = prepare_data


  d3.select("#chart").select("svg").remove()


  //assign height and width of svg
  let svg = d3.select("#chart")
  initializeSpiralChart(svg, height, width)
  draw_spiral_community()
  d3.select("#ranking_tooltip").html("<b>Ranking:</b> Degree ")

}

// ranking based on closeness
function closeness_ranking(){
  turnOffMostConnected()
  let height = 1200
  let width =1200
  let prepare_data = []
  unique_communities = new Set(global_data_unchanged.map(function(d){return d.community}))
  console.log("updated_version_closeness")
  unique_communities.forEach(function(entry) {
    community_data = global_data_unchanged.filter(function(d){ return d.community == entry});
    community_data.sort(function(a,b){return d3.descending(a.closeness,b.closeness)})
    prepare_data.push.apply(prepare_data,community_data)
  })
  console.log(prepare_data)

  let positions_spiral
  if (flag_community_size ==1)
    positions_spiral = community_size_data
  else if (flag_community_degree ==1)
    positions_spiral = heighest_degree_data
  else if (flag_community_density==1)
    positions_spiral = heighest_density_data

  //calculate final x and y position for each point
  //prepare_data = computing_spiral_positions(center_positions_spiral, prepare_data, height, width)
  prepare_data = computing_spiral_positions(positions_spiral, prepare_data,optimal_no_of_nodes, height, width)
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data
  global_data_unchanged = prepare_data


  d3.select("#chart").select("svg").remove()


  //assign height and width of svg
  let svg = d3.select("#chart")
  initializeSpiralChart(svg, height, width)
  draw_spiral_community()
  d3.select("#ranking_tooltip").html("<b>Ranking:</b> Closeness ")

}

//ranking based on eign centrality
function eign_ranking(){
  turnOffMostConnected()
  let height = 1200
  let width =1200
  let prepare_data = []
  unique_communities = new Set(global_data_unchanged.map(function(d){return d.community}))
  console.log("updated_version_eign")
  unique_communities.forEach(function(entry) {
    community_data = global_data_unchanged.filter(function(d){ return d.community == entry});
    community_data.sort(function(a,b){return d3.descending(a.eign,b.eign)})
    prepare_data.push.apply(prepare_data,community_data)
  })
  console.log(prepare_data)

  let positions_spiral
  if (flag_community_size ==1)
    positions_spiral = community_size_data
  else if (flag_community_degree ==1)
    positions_spiral = heighest_degree_data
  else if (flag_community_density==1)
    positions_spiral = heighest_density_data

  //calculate final x and y position for each point
  //prepare_data = computing_spiral_positions(center_positions_spiral, prepare_data, height, width)
  prepare_data = computing_spiral_positions(positions_spiral, prepare_data,optimal_no_of_nodes, height, width)
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data
  global_data_unchanged = prepare_data


  d3.select("#chart").select("svg").remove()


  //assign height and width of svg
  let svg = d3.select("#chart")
  initializeSpiralChart(svg, height, width)
  draw_spiral_community()
  d3.select("#ranking_tooltip").html("<b>Ranking:</b> Eigen Centrality ")

}

//ranking based on betweenness centrality
function between_ranking(){
  turnOffMostConnected()
  let height = 1200
  let width =1200
  let prepare_data = []
  unique_communities = new Set(global_data_unchanged.map(function(d){return d.community}))
  console.log("updated_version_betweenness")
  unique_communities.forEach(function(entry) {
    community_data = global_data_unchanged.filter(function(d){ return d.community == entry});
    community_data.sort(function(a,b){return d3.descending(a.betwness,b.betwness)})
    prepare_data.push.apply(prepare_data,community_data)
  })
  console.log(prepare_data)

  let positions_spiral
  if (flag_community_size ==1)
    positions_spiral = community_size_data
  else if (flag_community_degree ==1)
    positions_spiral = heighest_degree_data
  else if (flag_community_density==1)
    positions_spiral = heighest_density_data

  //calculate final x and y position for each point
  //prepare_data = computing_spiral_positions(center_positions_spiral, prepare_data, height, width)
  prepare_data = computing_spiral_positions(positions_spiral, prepare_data,optimal_no_of_nodes, height, width)
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data
  global_data_unchanged = prepare_data


  d3.select("#chart").select("svg").remove()


  //assign height and width of svg
  let svg = d3.select("#chart")
  initializeSpiralChart(svg, height, width)
  draw_spiral_community()
  d3.select("#ranking_tooltip").html("<b>Ranking:</b> Betweenness ")

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

//degree range_bar
function updateTextInputdeg(val) {
  turnOffMostConnected()
    document.getElementById('textInputdeg').value=val;
    density_var = val;
    console.log(val)
    global_data = global_data_unchanged.filter(function(d){
          return d.centrality>=density_var && d.betwness>=betweenness_var && d.eign>=eign_var && d.closeness>=closeness_var
          })
    console.log(global_data)
   // g.call(brush.move, null);
    g.select(".brush").call(brush.move, null);
    draw_spiral_community()
    //show only selected community in table
    table.selectAll("tr").remove()
    show_table_data(global_data)
  }


  //betweenness range_bar
  function updateTextInputbet(val) {
    turnOffMostConnected()
    document.getElementById('textInputbet').value=val;
    betweenness_var = val
    global_data = global_data_unchanged.filter(function(d){
        return d.centrality>=density_var && d.betwness>=betweenness_var && d.eign>=eign_var && d.closeness>=closeness_var
        })
  console.log(global_data)
  g.select(".brush").call(brush.move, null);
  draw_spiral_community()
  //show only selected community in table
  table.selectAll("tr").remove()
  show_table_data(global_data)
  }


  //eign range_bar
  function updateTextInputeig(val) {
    turnOffMostConnected()
    document.getElementById('textInputeig').value=val;
    eign_var = val ;
    global_data = global_data_unchanged.filter(function(d){
        return d.centrality>=density_var && d.betwness>=betweenness_var && d.eign>=eign_var && d.closeness>=closeness_var
        })
  console.log(global_data)
  g.select(".brush").call(brush.move, null);
  draw_spiral_community()
  //show only selected community in table
  table.selectAll("tr").remove()
  show_table_data(global_data)
  }
//closeness range_bar
  function updateTextInputclo(val) {
    turnOffMostConnected()
    document.getElementById('textInputclo').value=val;
    closeness_var =val
    global_data = global_data_unchanged.filter(function(d){
        return d.centrality>=density_var && d.betwness>=betweenness_var && d.eign>=eign_var && d.closeness>=closeness_var
        })
  console.log(global_data)
  g.select(".brush").call(brush.move, null);
  draw_spiral_community()
  //show only selected community in table
  table.selectAll("tr").remove()
  show_table_data(global_data)
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
   d3.select("#color_tooltip").html("<b>Color-Coding:</b> Density ")
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
  d3.select("#color_tooltip").html("<b>Color-Coding:</b> Degree ")
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
  d3.select("#color_tooltip").html("<b>Color-Coding:</b> Closeness ")
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
  d3.select("#color_tooltip").html("<b>Color-Coding:</b> Betweenness ")
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
  d3.select("#color_tooltip").html("<b>Color-Coding:</b> Eigen Centrality ")

}


  function find_node_by_label(){

    var node_community;
    var node_density,
    node_centrality,
    node_betweness,
    node_closeness,
    node_eign;

    var input_text = document.getElementById('textInputNodeId').value.trim()
    var searched_node = /^\d+$/.test(input_text) ? +input_text : null
    var node_exists = searched_node !== null && global_data_unchanged.some(function(d){ return d.node == searched_node })
    if (!node_exists){
      showStatusMessage(input_text === '' ? 'Enter a node ID' : 'Node ' + input_text + ' not found', 'warning')
      return
    }

    // one mode at a time: finding a node turns Most Connected off
    turnOffMostConnected()
    find_node_id = searched_node
    g.select(".brush").call(brush.move, null);
    draw_spiral_community()



    //search data to find the node and then community and denstity of searched node
    for(i=0; i<global_data_unchanged.length; i++)
    {
      if (global_data_unchanged[i].node == find_node_id)
      {
        node_community = global_data_unchanged[i].community
        node_density = global_data_unchanged[i].density
        node_centrality = global_data_unchanged[i].centrality
        node_betweness = global_data_unchanged[i].betwness
        node_closeness = global_data_unchanged[i].closeness
        node_eign = global_data_unchanged[i].eign
        break;
      }
    }
    //highlighting the node and commun ijty in seperate window
    var node_community_data = global_data_unchanged.filter(function(client){return client.community==node_community})
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
      var colLabel = nodeFeatureColumnName ? (nodeFeatureColumnName.charAt(0).toUpperCase() + nodeFeatureColumnName.slice(1).replace(/_/g, ' ')) : "Feature";
      var fieldVal = nodeFeatureLookup.hasOwnProperty(+find_node_id) ? nodeFeatureLookup[+find_node_id] : -1;
      var fieldName = typeof FIELD_NAMES !== 'undefined' && FIELD_NAMES.hasOwnProperty(fieldVal) ? FIELD_NAMES[fieldVal] : (fieldVal === -1 ? "Unknown" : fieldVal);
      featureHtml = "<b>" + colLabel + ":</b> " + fieldName + "<br/>";
    }

    var svg = d3.select("#node_textbox")
      .html("<br/><b>NODE DATA</b><br/><b>Community: </b>"+ node_community +"<br/>" + 
      featureHtml +
      "<b>Degree:</b> "+ node_centrality + "<br/>" +
       "<b>Betweeness:</b> " + node_betweness + "<br/>" +
       "<b>Closeness:</b> " + node_closeness + "<br/>" +
       "<b>Eign:</b> " + node_eign )
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
    if (flag_most_connected_nodes) global_data = global_data_unchanged
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

    //community ranking data and flags
    community_size_data = initial_state.size.slice()
    heighest_degree_data = initial_state.degree.slice()
    heighest_density_data = initial_state.density.slice()
    number_of_community_connections_data = initial_state.connections.slice()
    flag_community_size = 1
    flag_community_degree = 0
    flag_community_density = 0
    flag_community_connections = 0

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
    d3.select("#node_textbox").html("")
    d3.select("#community_textbox").html("")
    d3.select("#community_connection_textbox").html("")
    d3.select("#community_spiral").selectAll("svg").remove()
    d3.select("#community_barchart").html("")
    d3.select("#community_piechart").html("")
    d3.select("#community_histogram").selectAll("svg").remove()
    div.style("opacity", 0)
    d3.selectAll(".bar-feature-tooltip").style("opacity", 0)
    d3.selectAll(".barLight").attr("class", "bar")

    //recompute every node position in the page-load order
    let base_data = global_data_unchanged.slice()
    base_data.sort(function(a,b){return d3.descending(a.node, b.node)})
    let prepare_data = []
    let unique_communities = new Set(base_data.map(function(d){return d.community}))
    unique_communities.forEach(function(entry) {
      let community_data = base_data.filter(function(d){ return d.community == entry})
      community_data.sort(function(a,b){return d3.descending(a.centrality,b.centrality)})
      prepare_data.push.apply(prepare_data, community_data)
    })

    //redraw the chart from scratch (this also clears any zoom)
    d3.select("#chart").selectAll("svg").remove()
    d3.select("#legend1").selectAll("canvas").remove()
    d3.select("#chart").attr("height", initial_state.chart_height_attr)
    let svg = d3.select("#chart")
    let bounds = svg.node().getBoundingClientRect()
    let width = bounds.width
    let height = bounds.height
    prepare_data = computing_spiral_positions(initial_state.community_order, prepare_data, optimal_no_of_nodes, height, width)
    global_data_unchanged = base_data
    global_data = prepare_data
    initializeSpiralChart(svg, height, width)
    draw_spiral_community()

    //header labels
    d3.select("#ranking_tooltip").html(initial_state.ranking_label)
    d3.select("#community_ranking_tooltip").html(initial_state.community_ranking_label)

    //table with all nodes
    table.selectAll("tr").remove()
    show_table_data(global_data)

    showStatusMessage('View reset', 'success')
  }

  // Community filter: show only selected communities
  function applyCommunityFilter() {
    var filterInput = document.getElementById('textInputCommunityFilter').value.trim();
    if (!filterInput) return;

    // Parse comma-separated community IDs
    var selectedCommunities = filterInput.split(',').map(function(s) { return +s.trim(); }).filter(function(n) { return !isNaN(n); });
    if (selectedCommunities.length === 0) return;

    console.log("Filtering to communities:", selectedCommunities);

    let height = 1200;
    let width = 1200;

    // Filter node data to only include selected communities
    var filteredData = global_data_unchanged.filter(function(d) {
      return selectedCommunities.includes(d.community);
    });

    if (filteredData.length === 0) {
      alert("No nodes found in the specified communities.");
      return;
    }

    turnOffMostConnected();

    // Filter community ranking data to only include selected communities
    var filtered_community_size = community_size_data.filter(function(d) {
      return selectedCommunities.includes(d.community);
    });

    // Sort by current ranking
    let positions_spiral;
    if (flag_community_size == 1)
      positions_spiral = filtered_community_size;
    else if (flag_community_degree == 1) {
      positions_spiral = heighest_degree_data.filter(function(d) {
        return selectedCommunities.includes(d.community);
      });
    } else if (flag_community_density == 1) {
      positions_spiral = heighest_density_data.filter(function(d) {
        return selectedCommunities.includes(d.community);
      });
    } else if (flag_community_connections == 1) {
      positions_spiral = number_of_community_connections_data.filter(function(d) {
        return selectedCommunities.includes(d.community);
      });
    } else {
      positions_spiral = filtered_community_size;
    }

    // Sort nodes within each community by degree
    let prepare_data = [];
    selectedCommunities.forEach(function(comm) {
      var comm_data = filteredData.filter(function(d) { return d.community == comm; });
      comm_data.sort(function(a, b) { return d3.descending(a.centrality, b.centrality); });
      prepare_data.push.apply(prepare_data, comm_data);
    });

    // Recompute positions
    prepare_data = computing_spiral_positions(positions_spiral, prepare_data, optimal_no_of_nodes, height, width);
    height = Math.max(height, computed_total_community_height || height);
    global_data = prepare_data;

    d3.select("#chart").selectAll("svg").remove();

    let svg = d3.select("#chart");
    initializeSpiralChart(svg, height, width);
    draw_spiral_community();

    // Update table
    table.selectAll("tr").remove();
    show_table_data(global_data);
  }

  // Reset community filter
  function resetCommunityFilter() {
    turnOffMostConnected()
    document.getElementById('textInputCommunityFilter').value = '';
    global_data = global_data_unchanged;
    
    let height = 1200;
    let width = 1200;

    let positions_spiral;
    if (flag_community_size == 1)
      positions_spiral = community_size_data;
    else if (flag_community_degree == 1)
      positions_spiral = heighest_degree_data;
    else if (flag_community_density == 1)
      positions_spiral = heighest_density_data;
    else if (flag_community_connections == 1)
      positions_spiral = number_of_community_connections_data;
    else
      positions_spiral = community_size_data;

    let prepare_data = [];
    let unique_communities = new Set(global_data_unchanged.map(function(d) { return d.community; }));
    unique_communities.forEach(function(entry) {
      var comm_data = global_data_unchanged.filter(function(d) { return d.community == entry; });
      comm_data.sort(function(a, b) { return d3.descending(a.centrality, b.centrality); });
      prepare_data.push.apply(prepare_data, comm_data);
    });

    prepare_data = computing_spiral_positions(positions_spiral, prepare_data, optimal_no_of_nodes, height, width);
    height = Math.max(height, computed_total_community_height || height);
    global_data = prepare_data;

    d3.select("#chart").selectAll("svg").remove();
    let svg = d3.select("#chart");
    initializeSpiralChart(svg, height, width);
    draw_spiral_community();

    table.selectAll("tr").remove();
    show_table_data(global_data);
  }


// ============================================================
// Community Range Filter
// Show only communities whose size, density, max-degree, and
// connections fall within the ranges set by the user.
// ============================================================

function applyCommunityRangeFilter() {
  var minSize = parseFloat(document.getElementById('commRangeMinSize').value) || 0;
  var maxSize = Infinity;
  var minDensity = parseFloat(document.getElementById('commRangeMinDensity').value) || 0;
  var maxDensity = Infinity;
  var minDegree = parseFloat(document.getElementById('commRangeMinDegree').value) || 0;
  var maxDegree = Infinity;
  var minConn = parseFloat(document.getElementById('commRangeMinConn').value) || 0;
  var maxConn = Infinity;

  // Build lookup maps for fast access
  var sizeMap = {};
  community_size_data.forEach(function(d) { sizeMap[d.community] = d.size; });
  var densityMap = {};
  heighest_density_data.forEach(function(d) { densityMap[d.community] = d.density; });
  var degreeMap = {};
  heighest_degree_data.forEach(function(d) { degreeMap[d.community] = d.degree; });
  var connMap = {};
  number_of_community_connections_data.forEach(function(d) { connMap[d.community] = d.connections; });

  // Find communities that pass all filters
  var passingCommunities = [];
  community_size_data.forEach(function(d) {
    var comm = d.community;
    var s = sizeMap[comm] !== undefined ? sizeMap[comm] : 0;
    var den = densityMap[comm] !== undefined ? densityMap[comm] : 0;
    var deg = degreeMap[comm] !== undefined ? degreeMap[comm] : 0;
    var con = connMap[comm] !== undefined ? connMap[comm] : 0;

    if (s >= minSize && s <= maxSize &&
        den >= minDensity && den <= maxDensity &&
        deg >= minDegree && deg <= maxDegree &&
        con >= minConn && con <= maxConn) {
      passingCommunities.push(comm);
    }
  });

  if (passingCommunities.length === 0) {
    alert("No communities match the specified ranges.");
    return;
  }

  turnOffMostConnected();

  console.log("Community range filter — passing communities:", passingCommunities);

  let height = 1200;
  let width = 1200;

  // Filter node data to only include passing communities
  var filteredData = global_data_unchanged.filter(function(d) {
    return passingCommunities.includes(d.community);
  });

  // Filter community ranking arrays
  var filtered_size = community_size_data.filter(function(d) {
    return passingCommunities.includes(d.community);
  });

  // Select the right ordering based on current ranking flag
  var positions_spiral;
  if (flag_community_size == 1)
    positions_spiral = filtered_size;
  else if (flag_community_degree == 1)
    positions_spiral = heighest_degree_data.filter(function(d) { return passingCommunities.includes(d.community); });
  else if (flag_community_density == 1)
    positions_spiral = heighest_density_data.filter(function(d) { return passingCommunities.includes(d.community); });
  else if (flag_community_connections == 1)
    positions_spiral = number_of_community_connections_data.filter(function(d) { return passingCommunities.includes(d.community); });
  else
    positions_spiral = filtered_size;

  // Sort nodes within each community by degree
  var prepare_data = [];
  passingCommunities.forEach(function(comm) {
    var comm_data = filteredData.filter(function(d) { return d.community == comm; });
    comm_data.sort(function(a, b) { return d3.descending(a.centrality, b.centrality); });
    prepare_data.push.apply(prepare_data, comm_data);
  });

  // Recompute positions
  prepare_data = computing_spiral_positions(positions_spiral, prepare_data, optimal_no_of_nodes, height, width);
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data;

  d3.select("#chart").selectAll("svg").remove();
  var svg = d3.select("#chart");
  initializeSpiralChart(svg, height, width);
  draw_spiral_community();

  table.selectAll("tr").remove();
  show_table_data(global_data);
}

function resetCommunityRangeFilter() {
  turnOffMostConnected()
  document.getElementById('commRangeMinSize').value = '0';
  if(document.getElementById('commRangeMinSizeText')) document.getElementById('commRangeMinSizeText').value = '0';
  document.getElementById('commRangeMinDensity').value = '0';
  if(document.getElementById('commRangeMinDensityText')) document.getElementById('commRangeMinDensityText').value = '0';
  document.getElementById('commRangeMinDegree').value = '0';
  if(document.getElementById('commRangeMinDegreeText')) document.getElementById('commRangeMinDegreeText').value = '0';
  document.getElementById('commRangeMinConn').value = '0';
  if(document.getElementById('commRangeMinConnText')) document.getElementById('commRangeMinConnText').value = '0';

  global_data = global_data_unchanged;

  let height = 1200;
  let width = 1200;

  var positions_spiral;
  if (flag_community_size == 1)
    positions_spiral = community_size_data;
  else if (flag_community_degree == 1)
    positions_spiral = heighest_degree_data;
  else if (flag_community_density == 1)
    positions_spiral = heighest_density_data;
  else if (flag_community_connections == 1)
    positions_spiral = number_of_community_connections_data;
  else
    positions_spiral = community_size_data;

  var prepare_data = [];
  var unique_communities = new Set(global_data_unchanged.map(function(d) { return d.community; }));
  unique_communities.forEach(function(entry) {
    var comm_data = global_data_unchanged.filter(function(d) { return d.community == entry; });
    comm_data.sort(function(a, b) { return d3.descending(a.centrality, b.centrality); });
    prepare_data.push.apply(prepare_data, comm_data);
  });

  prepare_data = computing_spiral_positions(positions_spiral, prepare_data, optimal_no_of_nodes, height, width);
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data;

  d3.select("#chart").selectAll("svg").remove();
  var svg = d3.select("#chart");
  initializeSpiralChart(svg, height, width);
  draw_spiral_community();

  table.selectAll("tr").remove();
  show_table_data(global_data);
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
    original_community_size_data = community_size_data.slice();
    original_heighest_degree_data = heighest_degree_data.slice();
    original_heighest_density_data = heighest_density_data.slice();
    original_number_of_community_connections_data = number_of_community_connections_data.slice();
  }

  community_view_mode = mode;

  if (mode === 'metadata') {
    // Check if nodeFeatureLookup has data
    if (!nodeFeatureLookup || Object.keys(nodeFeatureLookup).length === 0) {
      alert("No metadata available for this dataset. Node features CSV may not be loaded.");
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

  // Rebuild positions
  var height = 1200;
  var width = 1200;

  var prepare_data = [];
  var unique_communities_set = new Set(global_data_unchanged.map(function(d) { return d.community; }));
  unique_communities_set.forEach(function(entry) {
    var comm_data = global_data_unchanged.filter(function(d) { return d.community == entry; });
    comm_data.sort(function(a, b) { return d3.descending(a.centrality, b.centrality); });
    prepare_data.push.apply(prepare_data, comm_data);
  });

  prepare_data = computing_spiral_positions(community_size_data, prepare_data, optimal_no_of_nodes, height, width);
  height = Math.max(height, computed_total_community_height || height);
  global_data = prepare_data;

  d3.select("#chart").selectAll("svg").remove();
  d3.select("#chart").attr("height", height);
  var svg = d3.select("#chart");
  initializeSpiralChart(svg, height, width);
  draw_spiral_community();

  // Update tooltip
  var numComms = community_size_data.length;
  var modeLabel = mode === 'metadata' ? 'Metadata (' + numComms + ' groups)' : 'Louvain';
  d3.select("#community_ranking_tooltip").html("<b>Community View:</b> " + modeLabel);

  table.selectAll("tr").remove();
  show_table_data(global_data);
}
