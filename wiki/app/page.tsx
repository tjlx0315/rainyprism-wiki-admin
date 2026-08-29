'use client';

import { useEffect, useMemo, useState } from 'react';

type View = 'home' | 'category' | 'article' | 'relations' | 'timeline' | 'map';
type Entry = { id:string; name:string; type:string; subtype?:string; folderId?:string; folderName?:string; subtitle?:string; summary?:string; image?:string; facts?:string[][]; sections?:Array<{title:string;paragraphs:string[]}> };
type Relation = { id:string; fromId:string; toId:string; fromName:string; toName:string; label:string; note?:string };
type TimelineItem = { id:string; date:string; title:string; content?:string; sourceId:string; sourceName:string };
type NetworkData = { positions?:Record<string,{x:number;y:number}>; primaryIds?:string[]; hiddenLabels?:string[] };
type WikiData = { format:string; version:number; exportedAt?:string; entries:Entry[]; relations?:Relation[]; timeline?:TimelineItem[]; network?:NetworkData };

const STORAGE_KEY = 'yulengjing_public_wiki_v1';

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
    const saved=localStorage.getItem(STORAGE_KEY);
    if(saved){
      try{setData(validateData(JSON.parse(saved)));return}catch{localStorage.removeItem(STORAGE_KEY)}
    }
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/wiki-data.json`,{cache:'no-store'})
      .then(response=>response.ok?response.json():null)
      .then(value=>{if(value)setData(validateData(value))})
      .catch(()=>undefined);
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
  useEffect(()=>{const local=['localhost','127.0.0.1'].includes(location.hostname);setVisible(local&&new URLSearchParams(location.search).get('manage')==='1')},[]);
  if(!visible)return null;
  const importFile=async(file?:File)=>{if(!file)return;try{const value=validateData(JSON.parse(await file.text()));localStorage.setItem(STORAGE_KEY,JSON.stringify(value));onData(value);setMessage(`导入成功：${value.entries.length} 个词条`) }catch(error){setMessage(`导入失败：${error instanceof Error?error.message:'文件错误'}`)}};
  if(!expanded)return <button className="wiki-import-toggle" onClick={()=>setExpanded(true)}>管理数据</button>;
  return <aside className="wiki-importer"><div><b>本机百科数据预览</b><span>只在 localhost 管理地址显示，不是网络登录入口</span></div><label className="import-button">选择百科 JSON<input type="file" accept="application/json,.json" onChange={event=>importFile(event.target.files?.[0])}/></label>{data&&<button onClick={()=>{localStorage.removeItem(STORAGE_KEY);onData(null);setMessage('已清除本机预览数据')}}>清除预览</button>}<button className="import-collapse" onClick={()=>setExpanded(false)}>收起</button>{message&&<p>{message}</p>}</aside>;
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
  const [layout,setLayout]=useState<'auto'|'original'>('auto');
  const [view,setView]=useState({x:0,y:0,scale:1});
  const [drag,setDrag]=useState<{x:number;y:number;originX:number;originY:number}|null>(null);
  const graph=useMemo(()=>buildPublicGraph(data,relations,layout),[data,relations,layout]);
  const nodeMap=useMemo(()=>new Map(graph.nodes.map(node=>[node.id,node])),[graph.nodes]);
  const reset=()=>setView({x:0,y:0,scale:1});
  return <section className="public-network"><div className="public-network-toolbar"><div><button className={layout==='auto'?'active':''} onClick={()=>{setLayout('auto');reset()}}>自动整理</button><button className={layout==='original'?'active':''} onClick={()=>{setLayout('original');reset()}}>原始布局</button></div><button onClick={reset}>居中显示</button><span>滚轮缩放 · 拖动画布 · 双击人物打开词条</span></div><div className="public-network-stage" onWheel={event=>{event.preventDefault();const rect=event.currentTarget.getBoundingClientRect();const px=event.clientX-rect.left;const py=event.clientY-rect.top;const next=Math.max(.45,Math.min(2.2,view.scale*Math.exp(-event.deltaY*.001)));const worldX=(px-view.x)/view.scale;const worldY=(py-view.y)/view.scale;setView({scale:next,x:px-worldX*next,y:py-worldY*next})}} onPointerDown={event=>{if((event.target as HTMLElement).closest('.public-node'))return;event.currentTarget.setPointerCapture(event.pointerId);setDrag({x:event.clientX,y:event.clientY,originX:view.x,originY:view.y})}} onPointerMove={event=>{if(drag)setView(current=>({...current,x:drag.originX+event.clientX-drag.x,y:drag.originY+event.clientY-drag.y}))}} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)}><div className="public-network-world" style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`}}><svg viewBox="0 0 1000 680" aria-hidden="true">{graph.edges.map((edge,index)=>{const a=nodeMap.get(edge.a);const b=nodeMap.get(edge.b);if(!a||!b)return null;const dx=b.x-a.x;const dy=b.y-a.y;const length=Math.hypot(dx,dy)||1;const curve=((index%3)-1)*18;const nx=-dy/length*curve;const ny=dx/length*curve;const cx=(a.x+b.x)/2+nx;const cy=(a.y+b.y)/2+ny;return <g key={edge.id}><path d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}/><foreignObject x={cx-58} y={cy-14} width="116" height="28"><div className="public-edge-label">{edge.label}</div></foreignObject></g>})}</svg>{graph.nodes.map(node=><button key={node.id} className={`public-node ${node.core?'core':''}`} style={{left:`${node.x/10}%`,top:`${node.y/6.8}%`}} onDoubleClick={()=>openEntry(node.id)} title={`双击打开${node.name}`}>{node.image?<span className="public-node-image"><img src={node.image} alt=""/></span>:<span className="public-node-empty">{[...node.name][0]||'人'}</span>}<b>{node.name}</b></button>)}</div></div></section>
}

function buildPublicGraph(data:WikiData,relations:Relation[],layout:'auto'|'original'):{nodes:GraphNode[];edges:GraphEdge[]}{
  const entries=data.entries.filter(entry=>entry.type==='角色');
  const entryMap=new Map(entries.map(entry=>[entry.id,entry]));
  const grouped=new Map<string,Relation[]>();
  relations.forEach(relation=>{const key=[relation.fromId,relation.toId].sort().join('::');(grouped.get(key)||grouped.set(key,[]).get(key)!).push(relation)});
  const edges=[...grouped.entries()].map(([id,items])=>({id,a:items[0].fromId,b:items[0].toId,label:[...new Set(items.flatMap(item=>item.label.split(/\s*[、,/]\s*/)).filter(Boolean))].join(' · ')}));
  const visibleIds=new Set(edges.flatMap(edge=>[edge.a,edge.b]));
  const source=entries.filter(entry=>visibleIds.has(entry.id));
  const saved=data.network?.positions||{};
  const coreIds=new Set((data.network?.primaryIds?.length?data.network.primaryIds:source.filter(entry=>entry.folderName==='主要角色').map(entry=>entry.id)).slice(0,6));
  const savedPoints=source.map(entry=>saved[entry.id]).filter((point):point is {x:number;y:number}=>Boolean(point&&Number.isFinite(point.x)&&Number.isFinite(point.y)));
  const minX=Math.min(...savedPoints.map(point=>point.x),0),maxX=Math.max(...savedPoints.map(point=>point.x),1),minY=Math.min(...savedPoints.map(point=>point.y),0),maxY=Math.max(...savedPoints.map(point=>point.y),1);
  const normalize=(point:{x:number;y:number})=>({x:110+(point.x-minX)/Math.max(1,maxX-minX)*780,y:90+(point.y-minY)/Math.max(1,maxY-minY)*500});
  const nodes:GraphNode[]=source.map((entry,index)=>{const point=saved[entry.id]?normalize(saved[entry.id]):{x:500+Math.cos(index/source.length*Math.PI*2)*300,y:340+Math.sin(index/source.length*Math.PI*2)*230};return {...entry,...point,core:coreIds.has(entry.id)}});
  if(layout==='original')return {nodes,edges};
  const core=nodes.filter(node=>node.core);
  core.forEach((node,index)=>{const angle=-Math.PI/2+index*Math.PI*2/Math.max(core.length,1);node.x=500+Math.cos(angle)*145;node.y=340+Math.sin(angle)*145});
  for(let pass=0;pass<120;pass++)for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];let dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);const minimum=a.core||b.core?112:96;if(distance>=minimum)continue;if(distance<.1){dx=Math.cos((i+1)*(j+2));dy=Math.sin((i+1)*(j+2));distance=1}const push=(minimum-distance)/2+.4,ux=dx/distance,uy=dy/distance;if(!a.core){a.x-=ux*push;a.y-=uy*push}if(!b.core){b.x+=ux*push;b.y+=uy*push}a.x=Math.max(65,Math.min(935,a.x));a.y=Math.max(65,Math.min(615,a.y));b.x=Math.max(65,Math.min(935,b.x));b.y=Math.max(65,Math.min(615,b.y))}
  return {nodes,edges};
}

function Timeline({data,openEntry}:{data:WikiData|null;openEntry:(id:string)=>void}){const items=[...(data?.timeline||[])].sort((a,b)=>(a.date||'').localeCompare(b.date||''));if(!items.length)return <Empty title="时间轴暂无内容" text="在编辑器中添加时间轴节点并重新导出后，这里会自动显示。"/>;return <main className="tool-page"><div className="tool-heading"><h1>世界观时间轴</h1><p>按日期浏览公开事件。</p></div><section className="timeline"><div className="timeline-line"/>{items.map(item=><article key={item.id}><time>{item.date||'—'}</time><span className="timeline-dot"/><div><small>{item.sourceName}</small><h2>{item.title}</h2>{item.content&&<p>{item.content}</p>}<button onClick={()=>openEntry(item.sourceId)}>查看来源词条 →</button></div></article>)}</section></main>}

function Empty({title,text}:{title:string;text:string}){return <main className="wiki-home"><section className="wiki-welcome"><div><h1>{title}</h1><p>{text}</p></div></section></main>}
