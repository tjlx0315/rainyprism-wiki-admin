'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type View = 'home' | 'category' | 'article' | 'relations' | 'timeline' | 'map';
type Entry = { id:string; name:string; type:string; subtype?:string; folderId?:string; folderName?:string; subtitle?:string; summary?:string; image?:string; facts?:string[][]; sections?:Array<{title:string;paragraphs:string[]}> };
type Relation = { id:string; fromId:string; toId:string; fromName:string; toName:string; label:string; note?:string };
type TimelineItem = { id:string; date:string; title:string; content?:string; sourceId:string; sourceName:string };
type NetworkData = { positions?:Record<string,{x:number;y:number}>; primaryIds?:string[]; hiddenLabels?:string[] };
type WikiData = { format:string; version:number; exportedAt?:string; entries:Entry[]; relations?:Relation[]; timeline?:TimelineItem[]; network?:NetworkData };

const STORAGE_KEY = 'yulengjing_public_wiki_v1';
const INDEXED_DB_NAME = 'yulengjing_public_wiki';
const INDEXED_DB_STORE = 'wiki_data';
const INDEXED_DB_KEY = 'preview';

function openWikiDB():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(INDEXED_DB_NAME,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(INDEXED_DB_STORE))request.result.createObjectStore(INDEXED_DB_STORE)};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('无法打开浏览器大容量储存'));
  });
}

async function readManagedWikiData():Promise<WikiData|null>{
  const database=await openWikiDB();
  try{
    return await new Promise((resolve,reject)=>{
      const request=database.transaction(INDEXED_DB_STORE,'readonly').objectStore(INDEXED_DB_STORE).get(INDEXED_DB_KEY);
      request.onsuccess=()=>resolve(request.result?validateData(request.result):null);
      request.onerror=()=>reject(request.error||new Error('读取预览数据失败'));
    });
  }finally{database.close()}
}

async function writeManagedWikiData(value:WikiData):Promise<void>{
  const database=await openWikiDB();
  try{
    await new Promise<void>((resolve,reject)=>{
      const transaction=database.transaction(INDEXED_DB_STORE,'readwrite');
      transaction.objectStore(INDEXED_DB_STORE).put(value,INDEXED_DB_KEY);
      transaction.oncomplete=()=>resolve();
      transaction.onerror=()=>reject(transaction.error||new Error('保存预览数据失败'));
      transaction.onabort=()=>reject(transaction.error||new Error('保存预览数据已取消'));
    });
  }finally{database.close()}
}

async function clearManagedWikiData():Promise<void>{
  const database=await openWikiDB();
  try{
    await new Promise<void>((resolve,reject)=>{
      const transaction=database.transaction(INDEXED_DB_STORE,'readwrite');
      transaction.objectStore(INDEXED_DB_STORE).delete(INDEXED_DB_KEY);
      transaction.oncomplete=()=>resolve();
      transaction.onerror=()=>reject(transaction.error||new Error('清除预览数据失败'));
    });
  }finally{database.close()}
  localStorage.removeItem(STORAGE_KEY);
}

function validateData(value:unknown):WikiData {
  const data=value as WikiData;
  if(!data || data.format!=='yulengjing-public-wiki' || !Array.isArray(data.entries)){
    throw new Error('这不是有效的雨棱镜百科数据文件');
  }
  return data;
}

export default function Home(){
  const [data,setData]=useState<WikiData|null>(null);
  const [view,setView]=useState<View>('home');
  const [entryId,setEntryId]=useState('');
  const [categoryType,setCategoryType]=useState('');
  const [query,setQuery]=useState('');
  const [menu,setMenu]=useState(false);

  useEffect(()=>{
    let active=true;
    const load=async()=>{
      try{
        const indexed=await readManagedWikiData();
        if(indexed){if(active)setData(indexed);return}
        const saved=localStorage.getItem(STORAGE_KEY);
        if(saved){
          const legacy=validateData(JSON.parse(saved));
          await writeManagedWikiData(legacy);
          localStorage.removeItem(STORAGE_KEY);
          if(active)setData(legacy);
          return;
        }
      }catch{localStorage.removeItem(STORAGE_KEY)}
      try{
        const response=await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/wiki-data.json`,{cache:'no-store'});
        const value=response.ok?await response.json():null;
        if(value&&active)setData(validateData(value));
      }catch{}
    };
    load();
    return()=>{active=false};
  },[]);

  const entries=data?.entries||[];
  const selected=entries.find(item=>item.id===entryId)||null;
  const results=useMemo(()=>query.trim()?entries.filter(item=>`${item.name} ${item.subtitle||''} ${item.type} ${item.subtype||''}`.includes(query.trim())):[],[entries,query]);
  const nav=(next:View)=>{setView(next);setMenu(false);scrollTo({top:0,behavior:'smooth'})};
  const openEntry=(id:string)=>{setEntryId(id);nav('article')};
  const openCategory=(type:string)=>{setCategoryType(type);nav('category')};

  return <div className="site-shell">
    <LocalImporter data={data} onData={value=>{setData(value);setView('home');setEntryId('')}} />
    <header className="topbar">
      <button className="brand" onClick={()=>nav('home')}><span className="brand-prism">◇</span><span><b>雨棱镜</b><small>世界观百科</small></span></button>
      <div className="search-wrap"><span>⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜索人物、地点、事件…" aria-label="搜索百科"/>{query&&<div className="search-results">{results.length?results.map(item=><button key={item.id} onClick={()=>{openEntry(item.id);setQuery('')}}>{item.name}<small>{item.subtype||item.type}</small></button>):<p>暂无匹配词条</p>}</div>}</div>
      <button className="menu-button" onClick={()=>setMenu(!menu)}>☰</button>
      <nav className={menu?'main-nav open':'main-nav'}><button className={view==='home'||view==='article'?'active':''} onClick={()=>nav('home')}>百科</button><button className={view==='timeline'?'active':''} onClick={()=>nav('timeline')}>时间轴</button><button className={view==='relations'?'active':''} onClick={()=>nav('relations')}>关系网</button><button className={view==='map'?'active':''} onClick={()=>nav('map')}>地图</button></nav>
    </header>
    {data&&<div className="demo-strip"><span className="demo-mark">已载入</span> 当前公开资料：{entries.length} 个词条 · 数据日期 {data.exportedAt?.slice(0,10)||'未记录'}</div>}
    {view==='home'&&<WikiHome data={data} openEntry={openEntry} openCategory={openCategory} nav={nav}/>} 
    {view==='category'&&<CategoryPage data={data} type={categoryType} openEntry={openEntry} back={()=>nav('home')}/>} 
    {view==='article'&&selected&&<Article entry={selected} openEntry={openEntry}/>} 
    {view==='article'&&!selected&&<Empty title="未找到词条" text="这个词条不存在，或尚未导入公开资料。"/>}
    {view==='relations'&&<Relations data={data} openEntry={openEntry}/>} 
    {view==='timeline'&&<Timeline data={data} openEntry={openEntry}/>} 
    {view==='map'&&<Empty title="地图暂无内容" text="编辑器中的公开地图数据接入后，会显示在这里。"/>}
    <footer><button onClick={()=>nav('home')}>雨棱镜百科</button><span>{data?'公开资料版本':'尚未导入资料'}</span><span>{data?.exportedAt?.slice(0,10)||''}</span></footer>
  </div>;
}

function LocalImporter({data,onData}:{data:WikiData|null;onData:(data:WikiData|null)=>void}){
  const [visible,setVisible]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const [message,setMessage]=useState('');
  useEffect(()=>{setVisible(new URLSearchParams(location.search).get('manage')==='1')},[]);
  if(!visible)return null;
  const importFile=async(file?:File)=>{if(!file)return;try{const value=validateData(JSON.parse(await file.text()));await writeManagedWikiData(value);localStorage.removeItem(STORAGE_KEY);onData(value);setMessage(`导入成功：${value.entries.length} 个词条`) }catch(error){setMessage(`导入失败：${error instanceof Error?error.message:'文件错误'}`)}};
  const downloadData=()=>{if(!data)return;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='wiki-data.json';link.click();URL.revokeObjectURL(url);setMessage('已下载 wiki-data.json；用 GitHub Desktop 发布后，所有访客都会看到这份资料')};
  if(!expanded)return <button className="wiki-import-toggle" onClick={()=>setExpanded(true)}>管理数据</button>;
  return <aside className="wiki-importer"><div><b>百科数据管理</b><span>导入只影响当前浏览器；不会让访客修改公开网站</span></div><label className="import-button">选择百科 JSON<input type="file" accept="application/json,.json" onChange={event=>importFile(event.target.files?.[0])}/></label>{data&&<button onClick={downloadData}>下载公开数据</button>}{data&&<button onClick={async()=>{try{await clearManagedWikiData();onData(null);setMessage('已清除本机预览数据')}catch(error){setMessage(`清除失败：${error instanceof Error?error.message:'浏览器储存错误'}`)}}}>清除预览</button>}<button className="import-collapse" onClick={()=>setExpanded(false)}>收起</button>{message&&<p>{message}</p>}<small className="import-help">预览确认后，将 wiki-data.json 放入仓库的 wiki/public 文件夹，再用 GitHub Desktop 推送，即可更新所有访客看到的内容。</small></aside>;
}

function WikiHome({data,openEntry,openCategory,nav}:{data:WikiData|null;openEntry:(id:string)=>void;openCategory:(type:string)=>void;nav:(view:View)=>void}){
  if(!data||!data.entries.length)return <Empty title="雨棱镜百科" text="尚未导入公开资料。请先在世界观编辑器中创建词条、填写百科简介，然后导出百科数据。"/>;
  const first=data.entries[0];
  const counts=Object.entries(data.entries.reduce<Record<string,number>>((all,item)=>{all[item.type]=(all[item.type]||0)+1;return all},{}));
  const recent=[...(data.timeline||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,4);
  return <main className="wiki-home"><section className="wiki-welcome"><div><h1>雨棱镜百科</h1><p>《雨棱镜》世界观资料库</p></div><p>目前收录 <b>{data.entries.length}</b> 个词条</p></section><div className="wiki-columns"><div className="wiki-main-column"><Panel title="精选条目"><h2><button className="wiki-link" onClick={()=>openEntry(first.id)}>{first.name}</button></h2>{first.summary?<p>{first.summary}</p>:<p>该词条尚未填写百科简介。</p>}<button className="wiki-more" onClick={()=>openEntry(first.id)}>阅读全文 →</button></Panel><Panel title="世界观分类"><div className="wiki-categories">{counts.map(([type,count])=><button className="category-link" key={type} onClick={()=>openCategory(type)}><span><b>{type}</b><small>{count} 个词条</small></span><i>→</i></button>)}</div></Panel></div><aside className="wiki-side-column"><Panel title="百科导航"><ul className="portal-links"><li><button onClick={()=>openEntry(first.id)}>浏览词条</button><span>从第一个公开词条开始</span></li><li><button onClick={()=>nav('timeline')}>时间轴</button><span>按日期浏览公开事件</span></li><li><button onClick={()=>nav('relations')}>关系网</button><span>查看公开实体关联</span></li><li><button onClick={()=>nav('map')}>地图</button><span>查看公开地点</span></li></ul></Panel><Panel title="近期事件">{recent.length?<ul className="recent-list">{recent.map(item=><li key={item.id}><b>{item.date||'—'}</b><span>{item.title}</span></li>)}</ul>:<p>暂无公开时间轴内容。</p>}</Panel></aside></div><section className="wiki-index"><h2>全部词条</h2><div>{data.entries.map(item=><button key={item.id} onClick={()=>openEntry(item.id)}>{item.name}</button>)}</div></section></main>;
}

function CategoryPage({data,type,openEntry,back}:{data:WikiData|null;type:string;openEntry:(id:string)=>void;back:()=>void}){const entries=(data?.entries||[]).filter(item=>item.type===type);const groups=entries.reduce<Record<string,Entry[]>>((all,item)=>{const group=item.subtype||'其他';(all[group]||=[]).push(item);return all},{});return <main className="tool-page category-page"><button className="back-link" onClick={back}>← 返回百科首页</button><div className="tool-heading"><h1>{type||'分类'}词条</h1><p>共收录 {entries.length} 个公开词条。</p></div>{Object.entries(groups).map(([group,items])=><section className="wiki-panel gray category-group" key={group}><h1 className="panel-title">{group}</h1><div className="category-entry-list">{items.map(item=><button key={item.id} onClick={()=>openEntry(item.id)}><b>{item.name}</b>{item.subtitle&&<small>{item.subtitle}</small>}<span>→</span></button>)}</div></section>)}</main>}

function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="wiki-panel gray"><h1 className="panel-title">{title}</h1><div className="panel-body">{children}</div></section>}

function Article({entry,openEntry}:{entry:Entry;openEntry:(id:string)=>void}){const sections=(entry.sections||[]).filter(section=>section.title&&section.paragraphs?.length);return <main className="article-layout"><aside className="toc"><b>目录</b><a href="#intro">简介</a>{sections.map(section=><a key={section.title} href={`#${section.title}`}>{section.title}</a>)}</aside><article className="article"><div className="breadcrumb"><span>百科</span><span>/</span><span>{entry.type}</span><span>/</span><b>{entry.name}</b></div><header className="article-title" id="intro"><div><span className="demo-mark">{entry.subtype||entry.type}</span><h1>{entry.name}</h1>{entry.subtitle&&<p>{entry.subtitle}</p>}</div><button className="share" onClick={()=>navigator.clipboard?.writeText(location.href)}>复制链接</button></header>{entry.summary&&<p className="lead">{entry.summary}</p>}{sections.map((section,index)=><section key={section.title} id={section.title} className="article-section"><div className="article-heading"><span>{String(index+1).padStart(2,'0')}</span><h2>{section.title}</h2></div>{section.paragraphs.map((text,i)=><p key={i}><MentionText text={text} openEntry={openEntry}/></p>)}</section>)}</article><aside className="infobox"><div className="info-cover">{entry.image?<img src={entry.image} alt={`${entry.name}代表图`}/>:<><span>◇</span><small>RAIN PRISM ARCHIVE</small></>}</div><h2>{entry.name}</h2>{entry.subtitle&&<p>{entry.subtitle}</p>}<dl>{(entry.facts||[]).map(([key,value])=><div key={`${key}-${value}`}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>{!(entry.facts||[]).length&&<small className="source-note">暂无公开基础资料</small>}</aside></main>}

function MentionText({text,openEntry}:{text:string;openEntry:(id:string)=>void}){const pattern=/\[\[card:([^|\]]+)\|([^\]]+)\]\]/g;const parts:React.ReactNode[]=[];let last=0;let match:RegExpExecArray|null;while((match=pattern.exec(text))){if(match.index>last)parts.push(text.slice(last,match.index));const id=match[1];const name=match[2];parts.push(<button key={`${id}-${match.index}`} className="inline-link" onClick={()=>openEntry(id)}>{name}</button>);last=pattern.lastIndex}if(last<text.length)parts.push(text.slice(last));return <>{parts}</>}

function Relations({data,openEntry}:{data:WikiData|null;openEntry:(id:string)=>void}){const [mode,setMode]=useState<'network'|'list'>('network');const relations=(data?.relations||[]).filter(item=>{const from=data?.entries.find(entry=>entry.id===item.fromId);const to=data?.entries.find(entry=>entry.id===item.toId);return from?.type==='角色'&&to?.type==='角色'});if(!relations.length)return <Empty title="关系网暂无内容" text="在编辑器中为角色建立关系并重新导出后，这里会自动显示。"/>;return <main className="tool-page relations-page"><div className="tool-heading relation-heading"><div><h1>人物关系</h1><p>以下关系来自编辑器公开数据。</p></div><div className="relation-tabs"><button className={mode==='network'?'active':''} onClick={()=>setMode('network')}>关系网</button><button className={mode==='list'?'active':''} onClick={()=>setMode('list')}>关系列表</button></div></div>{mode==='network'?<PublicRelationGraph data={data!} relations={relations} openEntry={openEntry}/>:<section className="wiki-panel gray"><div className="panel-body"><ul className="relation-text-list">{relations.map(item=><li key={item.id}><button onClick={()=>openEntry(item.fromId)}>{item.fromName}</button><b>{item.label}</b><button onClick={()=>openEntry(item.toId)}>{item.toName}</button>{item.note&&<small>{item.note}</small>}</li>)}</ul></div></section>}</main>}

type GraphNode = Entry & {x:number;y:number;core:boolean};
type GraphEdge = {id:string;a:string;b:string;label:string};

function PublicRelationGraph({data,relations,openEntry}:{data:WikiData;relations:Relation[];openEntry:(id:string)=>void}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const stageRef=useRef<HTMLDivElement>(null);
  const movedRef=useRef(false);
  const [view,setView]=useState({x:0,y:0,scale:1.35});
  const [drag,setDrag]=useState<{x:number;y:number;originX:number;originY:number}|null>(null);
  const graph=useMemo(()=>buildPublicGraph(data,relations),[data,relations]);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
    const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));canvas.width=1000*dpr;canvas.height=900*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    const nodeMap=new Map(graph.nodes.map(node=>[node.id,node]));const images=new Map<string,HTMLImageElement>();
    const draw=()=>{ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,1000,900);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      graph.edges.forEach(edge=>{const a=nodeMap.get(edge.a),b=nodeMap.get(edge.b);if(!a||!b)return;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='rgba(105,139,158,.40)';ctx.lineWidth=1.2;ctx.stroke();if(!edge.label)return;const length=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/length,ny=(b.x-a.x)/length,mx=(a.x+b.x)/2+nx*10,my=(a.y+b.y)/2+ny*10;ctx.font='11px sans-serif';const width=ctx.measureText(edge.label).width;ctx.fillStyle='rgba(247,250,251,.95)';ctx.fillRect(mx-width/2-5,my-9,width+10,18);ctx.fillStyle='#657b89';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(edge.label,mx,my)});
      graph.nodes.forEach(node=>{const radius=22;ctx.save();ctx.beginPath();ctx.arc(node.x,node.y,radius,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();const portrait=node.image?images.get(node.image):undefined;if(portrait?.complete&&portrait.naturalWidth){ctx.clip();const inner=radius-3,scale=Math.min(inner*2/portrait.naturalWidth,inner*2/portrait.naturalHeight),width=portrait.naturalWidth*scale,height=portrait.naturalHeight*scale;ctx.drawImage(portrait,node.x-width/2,node.y-height/2,width,height)}ctx.restore();ctx.beginPath();ctx.arc(node.x,node.y,radius,0,Math.PI*2);ctx.strokeStyle='#82b4c7';ctx.lineWidth=2.4;ctx.stroke();if(!node.image){ctx.fillStyle='#638899';ctx.font='600 18px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText([...node.name][0]||'人',node.x,node.y)}ctx.fillStyle='#526a78';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(node.name,node.x,node.y+radius+5)})};
    graph.nodes.forEach(node=>{if(!node.image||images.has(node.image))return;const image=new Image();images.set(node.image,image);image.onload=draw;image.src=node.image});draw();
  },[graph]);
  useEffect(()=>{const stage=stageRef.current;if(!stage)return;const wheel=(event:WheelEvent)=>{event.preventDefault();event.stopPropagation();setView(current=>({...current,scale:Math.max(.45,Math.min(1.8,current.scale*Math.exp(-event.deltaY*.0012)))}))};stage.addEventListener('wheel',wheel,{passive:false});return()=>stage.removeEventListener('wheel',wheel)},[]);
  const point=(event:React.MouseEvent<HTMLCanvasElement>)=>{const rect=event.currentTarget.getBoundingClientRect();return{x:(event.clientX-rect.left)*1000/rect.width,y:(event.clientY-rect.top)*900/rect.height}};
  const hit=(x:number,y:number)=>graph.nodes.find(node=>Math.hypot(node.x-x,node.y-y)<=30);
  const zoom=(next:number)=>setView(current=>({...current,scale:Math.max(.45,Math.min(1.8,next))}));
  return <section className="public-network readonly"><div className="public-network-toolbar"><strong>人物关系</strong><span>滚轮缩放 · 按住拖动画布 · 点击人物打开词条</span><div className="network-view-buttons"><button onClick={()=>zoom(view.scale-.1)} aria-label="缩小百分之十">−</button><input type="range" min="45" max="180" step="5" value={Math.round(view.scale*100)} onChange={event=>zoom(Number(event.target.value)/100)} aria-label="关系网缩放比例"/><output>{Math.round(view.scale*100)}%</output><button onClick={()=>zoom(view.scale+.1)} aria-label="放大百分之十">＋</button><button onClick={()=>setView({x:0,y:0,scale:1.35})}>重置</button></div></div><div ref={stageRef} className="public-network-stage" onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);movedRef.current=false;setDrag({x:event.clientX,y:event.clientY,originX:view.x,originY:view.y})}} onPointerMove={event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>3)movedRef.current=true;setView(current=>({...current,x:drag.originX+dx,y:drag.originY+dy}))}} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)}><div className="public-network-canvas-world" style={{transform:`translate(-50%,-50%) translate(${view.x}px,${view.y}px) scale(${view.scale})`}}><canvas ref={canvasRef} aria-label="人物关系网" onClick={event=>{if(movedRef.current){movedRef.current=false;return}const p=point(event),node=hit(p.x,p.y);if(node)openEntry(node.id)}} onMouseMove={event=>{if(drag){event.currentTarget.style.cursor='grabbing';return}const p=point(event);event.currentTarget.style.cursor=hit(p.x,p.y)?'pointer':'grab'}}/></div></div></section>
}

function buildPublicGraph(data:WikiData,relations:Relation[]):{nodes:GraphNode[];edges:GraphEdge[]}{
  const entries=data.entries.filter(entry=>entry.type==='角色');
  const entryMap=new Map(entries.map(entry=>[entry.id,entry]));
  const grouped=new Map<string,Relation[]>();
  relations.forEach(relation=>{const key=[relation.fromId,relation.toId].sort().join('::');(grouped.get(key)||grouped.set(key,[]).get(key)!).push(relation)});
  const edges=[...grouped.entries()].map(([id,items])=>({id,a:items[0].fromId,b:items[0].toId,label:[...new Set(items.flatMap(item=>item.label.split(/\s*[、,/]\s*/)).filter(Boolean))].join(' · ')}));
  const visibleIds=new Set(edges.flatMap(edge=>[edge.a,edge.b]));
  const source=entries.filter(entry=>visibleIds.has(entry.id));
  const primaryIds=(data.network?.primaryIds?.length?data.network.primaryIds:source.filter(entry=>entry.folderName==='主要角色').map(entry=>entry.id)).filter(id=>visibleIds.has(id)).slice(0,6);
  const coreIds=new Set(primaryIds);
  const positions=new Map<string,{x:number;y:number;angle:number;core?:boolean}>();
  const center={x:500,y:450},coreRadius=175;
  const clamp=(point:{x:number;y:number})=>({x:Math.max(54,Math.min(946,point.x)),y:Math.max(54,Math.min(826,point.y))});
  primaryIds.forEach((id,index)=>{const angle=-Math.PI/2+index*Math.PI*2/Math.max(primaryIds.length,1);positions.set(id,{x:center.x+Math.cos(angle)*coreRadius,y:center.y+Math.sin(angle)*coreRadius,angle,core:true})});
  const adjacency=new Map(source.map(entry=>[entry.id,[] as string[]]));
  edges.forEach(edge=>{adjacency.get(edge.a)?.push(edge.b);adjacency.get(edge.b)?.push(edge.a)});
  const oneCoreGroups=new Map<string,string[]>();
  source.forEach(entry=>{if(coreIds.has(entry.id))return;const neighbors=(adjacency.get(entry.id)||[]).filter(id=>coreIds.has(id));if(neighbors.length===1){const group=oneCoreGroups.get(neighbors[0])||[];group.push(entry.id);oneCoreGroups.set(neighbors[0],group)}else if(neighbors.length>1){let x=0,y=0;neighbors.forEach(id=>{const point=positions.get(id)!;x+=point.x;y+=point.y});x/=neighbors.length;y/=neighbors.length;let angle=Math.atan2(y-center.y,x-center.x);if(Math.hypot(x-center.x,y-center.y)<20)angle=positions.get(neighbors[0])!.angle;positions.set(entry.id,{...clamp({x:center.x+Math.cos(angle)*(coreRadius+105),y:center.y+Math.sin(angle)*(coreRadius+105)}),angle})}});
  oneCoreGroups.forEach((ids,coreId)=>{const core=positions.get(coreId)!;ids.sort((a,b)=>(entryMap.get(a)?.name||'').localeCompare(entryMap.get(b)?.name||'','zh-CN'));ids.forEach((id,index)=>{const slot=index%5,layer=Math.floor(index/5),angle=core.angle+(slot-(Math.min(ids.length,5)-1)/2)*.18,distance=coreRadius+100+layer*72;positions.set(id,{...clamp({x:center.x+Math.cos(angle)*distance,y:center.y+Math.sin(angle)*distance}),angle})})});
  const childCounts=new Map<string,number>();
  for(let pass=0;pass<5;pass++)source.forEach(entry=>{if(positions.has(entry.id))return;const parentId=(adjacency.get(entry.id)||[]).find(id=>positions.has(id));if(!parentId)return;const parent=positions.get(parentId)!;const count=childCounts.get(parentId)||0;childCounts.set(parentId,count+1);const baseAngle=Math.atan2(parent.y-center.y,parent.x-center.x),angle=baseAngle+(count%2?1:-1)*Math.ceil(count/2)*.2;positions.set(entry.id,{...clamp({x:parent.x+Math.cos(angle)*96,y:parent.y+Math.sin(angle)*96}),angle})});
  const remaining=source.filter(entry=>!positions.has(entry.id));
  remaining.forEach((entry,index)=>{const angle=-Math.PI/2+index*Math.PI*2/Math.max(remaining.length,1);positions.set(entry.id,{...clamp({x:center.x+Math.cos(angle)*387,y:center.y+Math.sin(angle)*387}),angle})});
  const savedLayout=source.flatMap(entry=>{const point=data.network?.positions?.[entry.id];return point&&Number.isFinite(point.x)&&Number.isFinite(point.y)?[{id:entry.id,x:point.x,y:point.y}]:[]});
  const usesSavedLayout=savedLayout.length>=2&&savedLayout.length===source.length;
  if(usesSavedLayout){
    const minX=Math.min(...savedLayout.map(point=>point.x)),maxX=Math.max(...savedLayout.map(point=>point.x));
    const minY=Math.min(...savedLayout.map(point=>point.y)),maxY=Math.max(...savedLayout.map(point=>point.y));
    const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY);
    const scale=Math.min(840/width,720/height);
    const offsetX=500-(minX+maxX)/2*scale,offsetY=440-(minY+maxY)/2*scale;
    savedLayout.forEach(point=>positions.set(point.id,{x:point.x*scale+offsetX,y:point.y*scale+offsetY,angle:0,core:coreIds.has(point.id)}));
  }
  const positionedIds=source.map(entry=>entry.id);
  if(!usesSavedLayout)for(let pass=0;pass<80;pass++){let moved=false;for(let i=0;i<positionedIds.length;i++)for(let j=i+1;j<positionedIds.length;j++){const a=positions.get(positionedIds[i])!,b=positions.get(positionedIds[j])!;let dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);if(distance>=82)continue;if(distance<.01){const angle=(i*2.399963+j*.73)%(Math.PI*2);dx=Math.cos(angle);dy=Math.sin(angle);distance=1}const push=(82-distance)/2+.6,ux=dx/distance,uy=dy/distance;if(!a.core&&!b.core){a.x-=ux*push;a.y-=uy*push;b.x+=ux*push;b.y+=uy*push}else if(a.core&&!b.core){b.x+=ux*push*2;b.y+=uy*push*2}else if(!a.core&&b.core){a.x-=ux*push*2;a.y-=uy*push*2}if(!a.core)Object.assign(a,clamp(a));if(!b.core)Object.assign(b,clamp(b));moved=true}if(!moved)break}
  const nodes:GraphNode[]=source.map(entry=>({...entry,...positions.get(entry.id)!,core:coreIds.has(entry.id)}));
  return {nodes,edges};
}

function Timeline({data,openEntry}:{data:WikiData|null;openEntry:(id:string)=>void}){const items=[...(data?.timeline||[])].sort((a,b)=>(a.date||'').localeCompare(b.date||''));if(!items.length)return <Empty title="时间轴暂无内容" text="在编辑器中添加时间轴节点并重新导出后，这里会自动显示。"/>;return <main className="tool-page"><div className="tool-heading"><h1>世界观时间轴</h1><p>按日期浏览公开事件。</p></div><section className="timeline"><div className="timeline-line"/>{items.map(item=><article key={item.id}><time>{item.date||'—'}</time><span className="timeline-dot"/><div><small>{item.sourceName}</small><h2>{item.title}</h2>{item.content&&<p>{item.content}</p>}<button onClick={()=>openEntry(item.sourceId)}>查看来源词条 →</button></div></article>)}</section></main>}

function Empty({title,text}:{title:string;text:string}){return <main className="wiki-home"><section className="wiki-welcome"><div><h1>{title}</h1><p>{text}</p></div></section></main>}
