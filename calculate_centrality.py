"""
Recompute node centralities for the existing study datasets and regenerate
the colour-coding extents used by the front end.

- Keeps the existing Louvain communities: only the 'eign', 'closeness' and
  'betwness' columns of facebook_data_transformed_new.csv are rewritten.
- Closeness: exact (nx.closeness_centrality).
- Eigenvector: nx.eigenvector_centrality_numpy (no convergence failures,
  no silent fallback to another measure).
- Betweenness: not computed for now, kept at 0 (its UI controls are hidden).
- new_extent_without_outliers_for_colorcoding.json is regenerated from the
  updated CSV with the same 1.5 x IQR rule as coarse_graph.py.

Usage: python calculate_centrality.py [temp_data_1 temp_data_2 ...]
"""
import json
import os
import sys
import time

import networkx as nx
import pandas as pd

DEFAULT_DIRS = ['temp_data_1', 'temp_data_2', 'temp_data_3', 'temp_data_4']
NODES_FILE = 'facebook_data_transformed_new.csv'
EDGES_FILE = 'node_to_node_link_data.csv'
EXTENT_FILE = 'new_extent_without_outliers_for_colorcoding.json'


# Same rule as findOutlierRangeForInputCemtrality in coarse_graph.py
def find_outlier_range(centrality):
    quartile1 = centrality.quantile(.25)
    quartile3 = centrality.quantile(.75)
    IQR = quartile3 - quartile1

    lowerBondValue = quartile1 - (1.5 * IQR)
    upperBondValue = quartile3 + (1.5 * IQR)

    low = min(centrality) if lowerBondValue <= min(centrality) else lowerBondValue
    high = max(centrality) if upperBondValue >= max(centrality) else upperBondValue
    return [float(low), float(high)]


def extents_after_outlier_removal(data):
    return {
        'degree_range': find_outlier_range(data['centrality']),
        'eign_range': find_outlier_range(data['eign']),
        'closeness_range': find_outlier_range(data['closeness']),
        'betwness_range': find_outlier_range(data['betwness']),
    }


def build_graph(dir_name, nodes_df):
    edges_df = pd.read_csv(os.path.join(dir_name, EDGES_FILE))
    G = nx.Graph()
    # keep every node, even if isolated
    G.add_nodes_from(nodes_df['node'].tolist())
    G.add_edges_from(zip(edges_df['source'], edges_df['target']))
    return G


def process_dataset(dir_name):
    print(f"\n--- Processing {dir_name} ---")
    nodes_path = os.path.join(dir_name, NODES_FILE)
    if not os.path.exists(nodes_path) or not os.path.exists(os.path.join(dir_name, EDGES_FILE)):
        raise FileNotFoundError(f"Data files not found in {dir_name}")

    nodes_df = pd.read_csv(nodes_path)
    before = nodes_df[['node', 'centrality', 'community', 'density']].copy()

    G = build_graph(dir_name, nodes_df)
    print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, "
          f"{nx.number_connected_components(G)} component(s)")

    # degree in the CSV must match the graph, otherwise the edge file is not the one the data came from.
    # The only allowed difference is +2 per node: self-loops counted in the original degree
    # but left out of node_to_node_link_data.csv (dataset 2 has 179 of them).
    degree_diff = nodes_df['centrality'] - nodes_df['node'].map(dict(G.degree()))
    if not degree_diff.isin([0, 2]).all():
        raise ValueError(f"{dir_name}: degree in {NODES_FILE} does not match {EDGES_FILE}")
    if (degree_diff == 2).any():
        print(f"{(degree_diff == 2).sum()} nodes had a self-loop in the original graph (ignored)")

    start = time.time()
    eig = nx.eigenvector_centrality_numpy(G)
    print(f"Eigenvector centrality done in {time.time() - start:.1f}s")

    start = time.time()
    clo = nx.closeness_centrality(G)
    print(f"Closeness centrality done in {time.time() - start:.1f}s")

    # the numpy solver can return values like -4e-18 for peripheral nodes; treat them as 0
    nodes_df['eign'] = nodes_df['node'].map(eig).clip(lower=0)
    nodes_df['closeness'] = nodes_df['node'].map(clo)
    nodes_df['betwness'] = 0.0  # not computed for now; UI controls are hidden

    if nodes_df[['eign', 'closeness']].isna().any().any():
        raise ValueError(f"{dir_name}: some nodes have no centrality value")

    # only the centrality columns may change
    after = nodes_df[['node', 'centrality', 'community', 'density']]
    if not before.equals(after):
        raise ValueError(f"{dir_name}: node/degree/community/density columns changed")

    extents = extents_after_outlier_removal(nodes_df)
    for key in ['degree_range', 'eign_range', 'closeness_range']:
        low, high = extents[key]
        if low == high:
            raise ValueError(f"{dir_name}: {key} is degenerate {extents[key]}")

    nodes_df.to_csv(nodes_path, index=False)
    with open(os.path.join(dir_name, EXTENT_FILE), 'w') as outfile:
        json.dump(extents, outfile)

    n = len(nodes_df)
    print(f"Extents: {extents}")
    for col, key in [('centrality', 'degree_range'), ('closeness', 'closeness_range'), ('eign', 'eign_range')]:
        black = (nodes_df[col] > extents[key][1]).sum()
        print(f"  {col}: {black / n:.1%} of nodes above upper bound (drawn black)")
    print(f"Updated {nodes_path} and {EXTENT_FILE}")


if __name__ == "__main__":
    for d in sys.argv[1:] or DEFAULT_DIRS:
        process_dataset(d)
