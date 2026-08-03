const ROWS=12,COLS=20,VISIT_DELAY=18,PATH_DELAY=38;
const gridEl=document.querySelector("#grid"),algo=document.querySelector("#algorithm-select"),
visualizeBtn=document.querySelector("#visualize-button"),clearPathBtn=document.querySelector("#clear-path-button"),
clearBoardBtn=document.querySelector("#clear-board-button"),statusText=document.querySelector("#status-text");
let start={row:5,col:3},end={row:5,col:16},mouseDown=false,mode=null,drag=null,animating=false;
const grid=[];

function makeGrid(){
  gridEl.innerHTML="";grid.length=0;
  for(let r=0;r<ROWS;r++){const row=[];
    for(let c=0;c<COLS;c++){
      const n={row:r,col:c,isStart:r===start.row&&c===start.col,isEnd:r===end.row&&c===end.col,
      isWall:false,distance:Infinity,heuristic:0,previous:null,visited:false,element:document.createElement("div")};
      n.element.className="node";n.element.dataset.row=r;n.element.dataset.col=c;bind(n);row.push(n);gridEl.appendChild(n.element);
    }grid.push(row);
  }renderAll();
}
function bind(n){
  n.element.addEventListener("mousedown",e=>{if(animating)return;e.preventDefault();mouseDown=true;
    if(n.isStart){drag="start";return} if(n.isEnd){drag="end";return}
    mode=n.isWall?"erase":"draw";n.isWall=mode==="draw";render(n);
  });
  n.element.addEventListener("mouseenter",()=>{if(!mouseDown||animating)return;
    if(drag){moveSpecial(n,drag);return} if(n.isStart||n.isEnd)return;
    n.isWall=mode==="draw";render(n);
  });
  n.element.addEventListener("mouseup",stop);
}
function stop(){mouseDown=false;mode=null;drag=null} document.addEventListener("mouseup",stop);
function moveSpecial(target,type){
  if(target.isWall||(type==="start"&&target.isEnd)||(type==="end"&&target.isStart))return;
  clearPath(false);
  if(type==="start"){const old=grid[start.row][start.col];old.isStart=false;start={row:target.row,col:target.col};target.isStart=true;render(old)}
  else{const old=grid[end.row][end.col];old.isEnd=false;end={row:target.row,col:target.col};target.isEnd=true;render(old)}
  render(target);
}
function renderAll(){grid.flat().forEach(render)}
function render(n){n.element.className="node";if(n.isWall)n.element.classList.add("wall");if(n.visited)n.element.classList.add("visited");
  if(n.isStart)n.element.classList.add("start");if(n.isEnd)n.element.classList.add("end")}
function reset(){grid.flat().forEach(n=>{n.distance=Infinity;n.heuristic=0;n.previous=null;n.visited=false;n.element.classList.remove("visited","path")})}
function clearPath(update=true){if(animating)return;reset();if(update)statusText.textContent="Caminho limpo. As paredes foram preservadas."}
function clearBoard(){if(animating)return;grid.flat().forEach(n=>n.isWall=false);reset();renderAll();statusText.textContent="Grade limpa."}
function neighbors(n){return[[n.row-1,n.col],[n.row+1,n.col],[n.row,n.col-1],[n.row,n.col+1]]
  .filter(([r,c])=>r>=0&&r<ROWS&&c>=0&&c<COLS).map(([r,c])=>grid[r][c]).filter(x=>!x.isWall)}
function buildPath(endNode){const path=[];let cur=endNode;while(cur){path.unshift(cur);cur=cur.previous}
  return path[0]===grid[start.row][start.col]?path:[]}
function bfs(){const s=grid[start.row][start.col],e=grid[end.row][end.col],q=[s],visited=[];s.visited=true;
  while(q.length){const cur=q.shift();visited.push(cur);if(cur===e)break;
    for(const nb of neighbors(cur)){if(nb.visited)continue;nb.visited=true;nb.previous=cur;q.push(nb)}}
  return{visited,path:buildPath(e)}}
function dijkstra(){const s=grid[start.row][start.col],e=grid[end.row][end.col],u=grid.flat(),visited=[];s.distance=0;
  while(u.length){u.sort((a,b)=>a.distance-b.distance);const cur=u.shift();if(!cur||cur.distance===Infinity)break;if(cur.isWall)continue;
    cur.visited=true;visited.push(cur);if(cur===e)break;
    for(const nb of neighbors(cur)){if(nb.visited)continue;const nd=cur.distance+1;if(nd<nb.distance){nb.distance=nd;nb.previous=cur}}}
  return{visited,path:buildPath(e)}}
function manhattan(a,b){return Math.abs(a.row-b.row)+Math.abs(a.col-b.col)}
function astar(){const s=grid[start.row][start.col],e=grid[end.row][end.col],open=[s],visited=[];s.distance=0;s.heuristic=manhattan(s,e);
  while(open.length){open.sort((a,b)=>(a.distance+a.heuristic)-(b.distance+b.heuristic));const cur=open.shift();if(cur.visited)continue;
    cur.visited=true;visited.push(cur);if(cur===e)break;
    for(const nb of neighbors(cur)){if(nb.visited)continue;const td=cur.distance+1;if(td<nb.distance){nb.distance=td;nb.heuristic=manhattan(nb,e);nb.previous=cur;if(!open.includes(nb))open.push(nb)}}}
  return{visited,path:buildPath(e)}}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function animate({visited,path}){for(const n of visited){if(!n.isStart&&!n.isEnd)n.element.classList.add("visited");await sleep(VISIT_DELAY)}
  if(!path.length){statusText.textContent="Nenhum caminho foi encontrado.";return}
  for(const n of path){if(!n.isStart&&!n.isEnd){n.element.classList.remove("visited");n.element.classList.add("path")}await sleep(PATH_DELAY)}
  statusText.textContent=`Caminho encontrado com ${Math.max(path.length-1,0)} passos.`}
async function visualize(){if(animating)return;clearPath(false);animating=true;[visualizeBtn,clearPathBtn,clearBoardBtn,algo].forEach(x=>x.disabled=true);
  statusText.textContent="Executando algoritmo...";const result=algo.value==="bfs"?bfs():algo.value==="dijkstra"?dijkstra():astar();
  await animate(result);animating=false;[visualizeBtn,clearPathBtn,clearBoardBtn,algo].forEach(x=>x.disabled=false)}
visualizeBtn.addEventListener("click",visualize);clearPathBtn.addEventListener("click",()=>clearPath(true));clearBoardBtn.addEventListener("click",clearBoard);makeGrid();
