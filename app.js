const nodes = [
  {id:'A',name:'Rupnagar',x:390,y:55},{id:'B',name:'Kharar',x:215,y:155},{id:'C',name:'Panchkula',x:650,y:150},
  {id:'D',name:'Chandigarh',x:460,y:220},{id:'E',name:'Mohali',x:345,y:325},{id:'F',name:'Zirakpur',x:605,y:305},{id:'G',name:'Airport',x:170,y:415},
  {id:'H',name:'Landran',x:340,y:430},{id:'I',name:'Dera Bassi',x:735,y:230}
];
// The graph is undirected. Road weights are scaled straight-line distances, keeping the A* heuristic admissible.
const links = [['A','B'],['B','D'],['B','E'],['D','C'],['D','E'],['D','F'],['E','F'],['E','G'],['C','F'],['E','H'],['F','I'],['C','I']];
const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));
const factor = 1.12;
const edgeData = links.map(([a,b])=>({a,b,w:Math.ceil(Math.hypot(byId[a].x-byId[b].x,byId[a].y-byId[b].y)/10*factor*10)/10}));
const graph = Object.fromEntries(nodes.map(n=>[n.id,[]]));
edgeData.forEach(e=>{graph[e.a].push({to:e.b,w:e.w});graph[e.b].push({to:e.a,w:e.w})});
const svg = document.getElementById('map');
const sourceSelect=document.getElementById('source'), targetSelect=document.getElementById('target'), algoSelect=document.getElementById('algorithm');
let source='A', target='G', steps=[], stepIndex=0, timer=null, zoom=1, state=null;
const label = id => byId[id].name;
for(const n of nodes){for(const sel of [sourceSelect,targetSelect]){const opt=document.createElement('option');opt.value=n.id;opt.textContent=n.name;sel.append(opt)}}
sourceSelect.value=source;targetSelect.value=target;
function draw(){
  const groups={};
  const routeEdges=new Set((state?.routeEdges||[]).map(([a,b])=>[a,b].sort().join('-')));
  const activeEdge=state?.activeEdge ? [state.activeEdge[0],state.activeEdge[1]].sort().join('-') : null;
  let html='<g id="zoom-layer">';
  for(const e of edgeData){const p=byId[e.a],q=byId[e.b],key=[e.a,e.b].sort().join('-'), cls=routeEdges.has(key)?'route':activeEdge===key?'active':'';
    html+=`<line class="road ${cls}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`;
    const x=(p.x+q.x)/2,y=(p.y+q.y)/2;
    html+=`<g class="road-label"><rect x="${x-13}" y="${y-8}" width="26" height="15" rx="5"/><text x="${x}" y="${y+3}" text-anchor="middle">${e.w.toFixed(1)}</text></g>`;
  }
  for(const n of nodes){let cls=''; if(state){if(state.closed.has(n.id))cls='visited';if(state.frontier.has(n.id))cls='frontier';if(state.current===n.id)cls='current';if(state.route?.includes(n.id))cls='on-route'}
    if(n.id===source)cls+=' selected-start';if(n.id===target)cls+=' selected-end';
    html+=`<g class="node ${cls}" data-id="${n.id}" tabindex="0" role="button" aria-label="${n.name}"><circle cx="${n.x}" cy="${n.y}" r="11"/><circle class="pin" cx="${n.x}" cy="${n.y}" r="3"/><text x="${n.x}" y="${n.y+27}">${n.name}</text></g>`;
  }
  html+='</g>';svg.innerHTML=html;
  document.getElementById('zoom-layer').setAttribute('transform',`translate(${390*(1-zoom)} ${240*(1-zoom)}) scale(${zoom})`);
  svg.querySelectorAll('.node').forEach(el=>{el.addEventListener('click',()=>{source=el.dataset.id;sourceSelect.value=source;resetSearch()});el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){source=el.dataset.id;sourceSelect.value=source;resetSearch()}})});
}
function log(message){const box=document.getElementById('log');const empty=box.querySelector('.log-empty');if(empty)empty.remove();const row=document.createElement('div');row.className='log-item';row.innerHTML=`<span class="log-step">${String(box.querySelectorAll('.log-item').length+1).padStart(2,'0')}</span>${message}`;box.prepend(row)}
function clearLog(){document.getElementById('log').innerHTML='<div class="log-empty"><span>◷</span> Search events will appear here as the algorithm runs.</div>'}
function heuristic(id){return Math.hypot(byId[id].x-byId[target].x,byId[id].y-byId[target].y)/10*factor}
function prepare(){
  stop();state={dist:Object.fromEntries(nodes.map(n=>[n.id,Infinity])),prev:{},closed:new Set(),frontier:new Set([source]),current:null,route:null,routeEdges:[],activeEdge:null,examined:0};state.dist[source]=0;
  steps=[];stepIndex=0;
  const aStar=algoSelect.value==='astar';
  const open=new Set([source]), closed=new Set(), dist={...state.dist}, prev={};
  while(open.size){let current=[...open].sort((a,b)=>(dist[a]+(aStar?heuristic(a):0))-(dist[b]+(aStar?heuristic(b):0)))[0];open.delete(current);
    if(closed.has(current))continue;
    const outgoing=graph[current].slice().sort((a,b)=>a.to.localeCompare(b.to));
    steps.push({type:'visit',current,dist:dist[current],frontier:[...open],closed:[...closed],distances:{...dist}});
    closed.add(current);
    if(current===target)break;
    for(const edge of outgoing){if(closed.has(edge.to))continue;const candidate=dist[current]+edge.w;if(candidate<dist[edge.to]){dist[edge.to]=candidate;prev[edge.to]=current;open.add(edge.to);steps.push({type:'relax',from:current,to:edge.to,candidate,old:state.dist[edge.to],frontier:[...open],closed:[...closed],distances:{...dist}})}}
  }
  let route=[];if(Number.isFinite(dist[target])){for(let at=target;at!=null;at=prev[at]){route.unshift(at);if(at===source)break}if(route[0]!==source)route=[]}
  const routeEdges=[];for(let i=1;i<route.length;i++)routeEdges.push([route[i-1],route[i]]);
  steps.push({type:'finish',route,routeEdges,total:dist[target],closed:[...closed],frontier:[...open],distances:{...dist}});
  state.final={route,routeEdges,total:dist[target],closed,dist,prev};
  clearLog(); document.getElementById('distance').innerHTML='— <em>km</em>';document.getElementById('visited-count').textContent='0';
  document.getElementById('result-title').textContent=`Searching ${label(source)} → ${label(target)}`;document.getElementById('result-message').textContent=aStar?'A* is scoring routes using distance traveled + estimated distance remaining.':'Dijkstra is expanding the closest known location first.';document.getElementById('result-chip').textContent='SEARCHING';document.getElementById('result-chip').className='result-chip';
  document.getElementById('progress-label').textContent='0 events';document.getElementById('progress-fill').style.width='0%';
  draw();
}
function applyNext(){if(!state||stepIndex>=steps.length)return false;const s=steps[stepIndex++];state.current=null;state.activeEdge=null;
  if(s.type==='visit'){state.current=s.current;state.closed=new Set(s.closed);state.frontier=new Set(s.frontier);state.examined=s.closed.length+1;state.dist=s.distances;log(`<strong>${label(s.current)}</strong> selected — ${s.dist.toFixed(1)} km from start.`)}
  else if(s.type==='relax'){state.frontier=new Set(s.frontier);state.closed=new Set(s.closed);state.dist=s.distances;state.activeEdge=[s.from,s.to];log(`Road to <strong>${label(s.to)}</strong> improved to ${s.candidate.toFixed(1)} km via ${label(s.from)}.`)}
  else {state.route=s.route;state.routeEdges=s.routeEdges;state.closed=new Set(s.closed);state.frontier=new Set(s.frontier);state.current=null;state.activeEdge=null;state.dist=s.distances;
    if(s.route.length){document.getElementById('distance').innerHTML=`${s.total.toFixed(1)} <em>km</em>`;document.getElementById('result-title').textContent=`Shortest route: ${s.route.map(label).join(' → ')}`;document.getElementById('result-message').textContent=`${s.route.length} locations · ${state.examined} locations examined · ${s.total.toFixed(1)} km total`;document.getElementById('result-chip').textContent='ROUTE FOUND';document.getElementById('result-chip').className='result-chip done';log(`<strong>Route found</strong> — ${s.total.toFixed(1)} km across ${s.route.length} locations.`)}else{document.getElementById('result-title').textContent='No route found';document.getElementById('result-message').textContent='There is no connected road path between these locations.';document.getElementById('result-chip').textContent='NO ROUTE';log('<strong>Search complete</strong> — no route connects those locations.')}
  }
  const progress=Math.min(100,stepIndex/steps.length*100);document.getElementById('progress-fill').style.width=`${progress}%`;document.getElementById('progress-label').textContent=stepIndex>=steps.length?'Complete':`${stepIndex} / ${steps.length} events`;document.getElementById('visited-count').textContent=state.examined||0;draw();
  if(stepIndex>=steps.length){stop();document.getElementById('play').textContent='▶';return false}return true;
}
function play(){if(!state||stepIndex>=steps.length)prepare();if(timer){stop();return}document.getElementById('play').textContent='Ⅱ';timer=setInterval(()=>{if(!applyNext())stop()},620)}
function stop(){if(timer){clearInterval(timer);timer=null}document.getElementById('play').textContent='▶'}
function resetSearch(){stop();state=null;steps=[];stepIndex=0;document.getElementById('distance').innerHTML='— <em>km</em>';document.getElementById('visited-count').textContent='0';document.getElementById('result-title').textContent='Ready when you are';document.getElementById('result-message').textContent='Choose two locations and find the shortest route.';document.getElementById('result-chip').textContent='AWAITING SEARCH';document.getElementById('result-chip').className='result-chip';document.getElementById('progress-label').textContent='Ready to begin';document.getElementById('progress-fill').style.width='0';clearLog();draw()}
document.getElementById('find').addEventListener('click',()=>{source=sourceSelect.value;target=targetSelect.value;if(source===target){resetSearch();document.getElementById('result-title').textContent='Choose two different locations';document.getElementById('result-message').textContent='Start and destination must be different.';return}prepare();applyNext()});
document.getElementById('step').addEventListener('click',()=>{if(!state)prepare();if(!applyNext())stop()});document.getElementById('play').addEventListener('click',play);document.getElementById('reset').addEventListener('click',resetSearch);
sourceSelect.addEventListener('change',()=>{source=sourceSelect.value;resetSearch()});targetSelect.addEventListener('change',()=>{target=targetSelect.value;resetSearch()});
algoSelect.addEventListener('change',()=>{document.getElementById('complexity').textContent='O(V² + E)';document.getElementById('algo-description').textContent=algoSelect.value==='astar'?'A* balances travel so far with an estimate of the distance left.':'Dijkstra expands outward in order of known travel distance.';document.getElementById('formula').innerHTML=algoSelect.value==='astar'?'priority = g(n) + h(n) <span>·</span> distance traveled + straight-line estimate':'priority = distance from start <span>·</span> optimal for non-negative roads';resetSearch()});
document.getElementById('clear-log').addEventListener('click',clearLog);document.getElementById('zoom-in').addEventListener('click',()=>{zoom=Math.min(1.3,zoom+.1);document.getElementById('zoom-level').textContent=`${Math.round(zoom*100)}%`;draw()});document.getElementById('zoom-out').addEventListener('click',()=>{zoom=Math.max(.8,zoom-.1);document.getElementById('zoom-level').textContent=`${Math.round(zoom*100)}%`;draw()});
draw();




