# Linear Visualization for Graph Data

**[🚀 Live Application (GitHub Pages)](https://garima17.github.io/linear_visualization/)**

A robust, multi-page web application featuring dynamic D3.js interactive linear visualizations for complex graph datasets.

## Overview
This platform visualizes multiple distinct datasets using interactive linear diagrams organized effectively into communities. Viewers can interactively inspect nodes, monitor multi-dataset health directly from the homepage, and investigate community boundaries depending on features such as "CS Field", "Page Type", and dynamic ranges generated depending on existing metadata in `node_features.csv`.

## Setup and Development

### Running locally
Since the code loads various CSV and JSON files using AJAX requests directly from the local file system, if you run the `index.html` file right away, browser CORS restrictions will prevent it. Run the local development server:

```bash
python server.py
# Or standard python 3:
python3 -m http.server 5000
```
Open `http://localhost:5000` in your web browser.

## Adding Datasets and Hosting on GitHub Pages

This app is architected into 4 interactive dataset slots: `Dataset 1`, `Dataset 2`, `Dataset 3`, and `Dataset 4`.

1. **Where to upload data:** To deploy a dataset into a given slot, place your preprocessed CSV/JSON files into its matching folder: 
   * `temp_data_1/` for Dataset 1
   * `temp_data_2/` for Dataset 2
   * `temp_data_3/` for Dataset 3
   * `temp_data_4/` for Dataset 4
2. **What to upload:** Ensure your uploaded data features at minimum:
   - `coarse_graph_data.json`
   - `coarse_graph_pos.csv`
   - `commuity_count.csv`
   - `commuity_density.csv`
   - `commuity_h_degree.csv`
   - `commuity_number_of_connections.csv`
   - `community_connection_list.json`
   - `connection_list.json`
   - `facebook_data_transformed_new.csv`
   - `heatmap_data.csv`
   - `link_data.csv`
   - `node_features.csv` (Optional metadata — handled dynamically if absent) 
   - `node_to_node_link_data.csv`
3. **Deploying to GitHub Pages:** 
   This application is 100% front-end. GitHub Pages renders the site directly from your repository's files without a build process. You do not need to create any extra configurations.
   To make things live, just upload the files using git and commit:
   ```bash
   git add temp_data_X/*
   git commit -m "Add data for dataset X"
   git push origin main
   ```
   **Important note about changes:** Any newly added files must be committed to the github repo to be accessible at the live `https://garima17.github.io/linear_visualization/` link. The `index.html` file acts as the router to the rest of the datasets.
