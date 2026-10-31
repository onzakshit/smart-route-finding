# Smart Route Finder (DAA)

A browser-based route planner for demonstrating shortest-path algorithms. It runs locally in VS Code with no dependencies or build step.

## Run it

1. Open this folder in VS Code.
2. Open `index.html` in a browser. For live reload, install the VS Code **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.
3. Choose a start and destination, select Dijkstra or A*, then press **Find route**. Use **Step** or **Play** to inspect the search.

## Features

- Interactive schematic road network with Rupnagar, Kharar, Chandigarh, Mohali, Zirakpur, Panchkula, Airport, Landran, and Dera Bassi.
- Dijkstra's algorithm and A* search, implemented from scratch.
- Animated exploration: visited locations, frontier, current location, and final route are highlighted separately.
- Route distance, locations examined, and a live event log.
- Click a location on the map to use it as the start; choose a destination from the selector.
- Reset and replay searches; compare algorithms on the same map.
- Responsive desktop and mobile layouts.

## What is happening?

The map is a graph: locations are vertices and roads are weighted edges. Search starts at the selected source and repeatedly considers its best candidate location. It tracks the best known distance to every location and the road used to reach it. When the destination is reached, predecessor links are followed backward to reconstruct the route.

**Dijkstra** chooses the unvisited location with the smallest known distance from the start. It finds an optimal route when road weights are non-negative. This implementation scans the candidate set to choose each next location, so its time complexity is `O(V² + E)` and space complexity is `O(V + E)`.

**A\*** ranks candidates by `f(n) = g(n) + h(n)`: `g(n)` is the distance already traveled; `h(n)` estimates the distance remaining. This map uses straight-line distance as the heuristic. The schematic road weights are scaled from map positions and rounded up so the estimate does not exceed a road route; A* therefore remains optimal for this graph. This implementation uses the same array-based candidate selection, so its time complexity is `O(V² + E)` and space is `O(V + E)`. General A* worst-case performance can still be exponential in path depth.

**Distance note:** This is a teaching visualization, not a live navigation map. The displayed road lengths are illustrative estimates based on the schematic layout, not verified driving distances.

### Animation legend

- **Blue** — discovered and waiting in the frontier.
- **Amber** — currently being examined.
- **Green** — examined and closed.
- **Violet** — final shortest route.
- **Gray road** — not part of the selected route.

Each **Step** processes one search event: it selects a candidate, marks a location visited, or relaxes a road (updates a neighbor if a shorter route was found). **Play** repeats events until the destination is reached or no route remains.

## DAA concepts demonstrated

Graph representation, weighted edges, greedy choice, heuristic search, relaxation, predecessor tracking, path reconstruction, correctness conditions, and time/space complexity.

