"use strict";

const STORAGE_KEY = "yulengjing_world_wiki_v1";

/* =========================================================
   04. 数据库
========================================================= */

function blankDB(){

  return {

    cards:[],

    relations:[],

    settings:{
      networkPositions:{},
      networkRelationLabels:{},
      networkSnap:false,
      networkSnapMode:"off",
      networkLayoutMode:"free",
      networkPrimaryFolderId:"",
      networkRelationOverrides:{},
      hiddenNetworkRelationLabels:[],
      networkViewport:{x:0,y:0,scale:1},
      catalogFolders:[]
    }

  };

}


function loadDB(){

  try{

    const raw = localStorage.getItem(
      STORAGE_KEY
    );

    if(!raw){
      return blankDB();
    }

    const parsed = JSON.parse(raw);

    if(
      !parsed ||
      !Array.isArray(parsed.cards)
    ){
      return blankDB();
    }

    parsed.relations =
      parsed.relations || [];

    parsed.settings =
      parsed.settings || {};

    parsed.settings.networkPositions =
      parsed.settings.networkPositions || {};

    parsed.settings.networkRelationLabels =
      parsed.settings.networkRelationLabels || {};

    parsed.settings.networkSnap = Boolean(parsed.settings.networkSnap);
    parsed.settings.networkSnapMode = parsed.settings.networkSnapMode || (parsed.settings.networkSnap ? "square" : "off");
    parsed.settings.networkLayoutMode = parsed.settings.networkLayoutMode || "free";
    parsed.settings.networkPrimaryFolderId = parsed.settings.networkPrimaryFolderId || "";
    parsed.settings.networkRelationOverrides = parsed.settings.networkRelationOverrides || {};
    parsed.settings.hiddenNetworkRelationLabels = Array.isArray(parsed.settings.hiddenNetworkRelationLabels) ? parsed.settings.hiddenNetworkRelationLabels : [];
    parsed.settings.networkViewport = normalizeNetworkViewport(parsed.settings.networkViewport);

    parsed.settings.catalogFolders =
      Array.isArray(parsed.settings.catalogFolders)
      ? parsed.settings.catalogFolders
      : [];

    return parsed;

  }catch(error){

    console.error(
      "读取数据库失败",
      error
    );

    return blankDB();

  }

}

function normalizeNetworkViewport(viewport){
  const value = viewport && typeof viewport === "object" ? viewport : {};
  const x = Number(value.x);
  const y = Number(value.y);
  const scale = Number(value.scale);
  return {
    x:Number.isFinite(x) ? x : 0,
    y:Number.isFinite(y) ? y : 0,
    scale:Number.isFinite(scale) ? Math.max(.35,Math.min(2.5,scale)) : 1
  };
}


function saveDB(){

  try{

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(db)
    );

    window.__storageQuotaBlocked = false;

  }catch(error){

    console.error(
      "保存数据库失败",
      error
    );

    if(window.__storageQuotaBlocked){
      return;
    }

    window.__storageQuotaBlocked = true;
    toast("本地图片较大，正在生成高质量网页版本后重新保存……");
    Promise.resolve(typeof optimizeStoredImagesForStorage === "function" ? optimizeStoredImagesForStorage() : false)
      .then(changed =>{
        if(!changed){
          toast("本地存储空间不足，当前修改可能尚未保存；请导出备份。");
          return;
        }
        try{
          localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
          window.__storageQuotaBlocked = false;
          toast("图片已保存；刷新页面后仍会保留。");
        }catch(retryError){
          console.error("高质量图片优化后仍无法保存",retryError);
          toast("本地存储空间仍然不足，请先导出备份。");
        }
      })
      .catch(optimizeError=>{
        console.error("生成网页图片失败",optimizeError);
        toast("图片保存失败，请先导出备份。");
      });

  }

}


function exportAllData(){

  const backup = {
    format:"yulengjing-world-wiki-backup",
    version:1,
    exportedAt:new Date().toISOString(),
    data:clone(db)
  };

  const text = JSON.stringify(backup,null,2);
  const blob = new Blob([text],{type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0,10);

  link.href = url;
  link.download = `雨棱镜-世界观备份-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  toast("全部数据已导出");

}


function normalizeImportedDB(value){

  const imported =
    value?.format === "yulengjing-world-wiki-backup"
    ? value.data
    : value;

  if(!imported || !Array.isArray(imported.cards)){
    throw new Error("备份文件中缺少卡片数据");
  }

  if(imported.relations !== undefined && !Array.isArray(imported.relations)){
    throw new Error("备份文件中的关系数据格式不正确");
  }

  const normalized = clone(imported);
  normalized.relations = normalized.relations || [];
  normalized.settings = normalized.settings || {};
  normalized.settings.networkPositions = normalized.settings.networkPositions || {};
  normalized.settings.networkRelationLabels = normalized.settings.networkRelationLabels || {};
  normalized.settings.networkSnap = Boolean(normalized.settings.networkSnap);
  normalized.settings.networkSnapMode = normalized.settings.networkSnapMode || (normalized.settings.networkSnap ? "square" : "off");
  normalized.settings.networkLayoutMode = normalized.settings.networkLayoutMode || "free";
  normalized.settings.networkPrimaryFolderId = normalized.settings.networkPrimaryFolderId || "";
  normalized.settings.networkRelationOverrides = normalized.settings.networkRelationOverrides || {};
  normalized.settings.hiddenNetworkRelationLabels = Array.isArray(normalized.settings.hiddenNetworkRelationLabels) ? normalized.settings.hiddenNetworkRelationLabels : [];
  normalized.settings.networkViewport = normalizeNetworkViewport(normalized.settings.networkViewport);
  normalized.settings.catalogFolders = Array.isArray(normalized.settings.catalogFolders) ? normalized.settings.catalogFolders : [];

  normalized.cards.forEach(card =>{
    card.basic = card.basic || {};
    card.basic.customAttributes = card.basic.customAttributes || [];
    card.heroImages = card.heroImages || [];
    card.modules = card.modules || [];

    card.modules.forEach(module =>{
      module.items = module.items || [];
    });
  });

  return normalized;

}


async function importAllData(file){

  try{

    const text = await file.text();
    const parsed = JSON.parse(text);
    const imported = normalizeImportedDB(parsed);

    const confirmed = confirm(
      `确定导入这份备份吗？\n\n备份中有 ${imported.cards.length} 张卡片。\n导入后会覆盖当前浏览器中的全部世界观数据。`
    );

    if(!confirmed){
      return;
    }

    db = imported;
    currentCardId = null;
    currentView = "cards";
    heroImageIndex = 0;

    migrateLegacyCardTypes();
    saveDB();
    refreshGlobalSelectors();
    renderTypeFilter();
    switchView("cards");
    renderCardList();

    toast(`已导入 ${db.cards.length} 张卡片`);

  }catch(error){

    console.error("导入备份失败",error);
    alert(`导入失败：${error.message || "文件格式不正确"}`);

  }

}


/* =========================================================
   公开百科数据导出
   与完整备份分离：只输出访客页面需要的文字与关联数据。
========================================================= */

function exportWikiData(){

  const cardById = new Map(
    db.cards.map(card => [card.id,card])
  );

  const fieldLabels = {
    aliases:"别名",birthday:"出生日期",sex:"性别",customSex:"性别",
    fixedAge:"年龄",height:"身高",interest:"兴趣",
    name:"名称",time:"时间",title:"标题",content:"内容",note:"说明",
    role:"身份",category:"类型",departmentType:"部门类型",referenceText:"说明",date:"日期",tags:"标签"
  };

  function linkedName(id){
    return cardById.get(id)?.name || "";
  }

  function cleanText(value){
    return typeof value === "string" ? value.trim() : "";
  }

  function factsFor(card){
    const basic = card.basic || {};
    const facts = [];
    ["aliases","birthday","sex","customSex","height","interest"]
      .forEach(key => {
        const value = cleanText(basic[key]);
        if(value){ facts.push([fieldLabels[key] || key,key === "height" ? `${value} cm` : value]); }
      });
    if(card.type === "角色"){
      const age = typeof calculateAge === "function" ? calculateAge(card) : "";
      if(age !== ""){ facts.push(["年龄",`${age} 岁`]); }
    }
    if(basic.birthplaceCardId){
      const value = linkedName(basic.birthplaceCardId);
      if(value){ facts.push(["出生地",value]); }
    }
    if(basic.parentOrgCardId){
      const value = linkedName(basic.parentOrgCardId);
      if(value){ facts.push(["上级机构",value]); }
    }
    if(basic.locationCardId){
      const value = linkedName(basic.locationCardId);
      if(value){ facts.push(["主要所在地",value]); }
    }
    if(basic.parentRegionCardId){
      const value = linkedName(basic.parentRegionCardId);
      if(value){ facts.push(["上级地区",value]); }
    }
    if(cleanText(basic.locationDescription)){
      facts.push([card.type === "地区" ? "相对位置" : "位置说明",cleanText(basic.locationDescription)]);
    }
    (basic.customAttributes || []).forEach(item => {
      const label = cleanText(item.label || item.key || item.name);
      const value = cleanText(item.value || item.content);
      if(label && value){ facts.push([label,value]); }
    });
    return facts;
  }

function readableItem(item,module){
  if(module?.kind === "职务"){
    const role = cleanText(item.name || item.role);
    const orgName = linkedName(item.orgCardId);
    const org = orgName ? `[[card:${item.orgCardId}|${orgName}]]` : "";
    const lines = [];
    if(org || role){ lines.push(`${org}${role}`); }
    const extraValue = cleanText(item.extraValue);
    if(extraValue){ lines.push(`${cleanText(item.extraLabel) || "编号"}：${extraValue}`); }
    return lines.join("\n");
  }

  if(module?.kind === "卡片引用"){
      const name = linkedName(item.relatedCardId);
      if(!name){ return ""; }
      const text = cleanText(item.referenceText);
      const note = cleanText(item.note);
      return `[[card:${item.relatedCardId}|${name}]]${text ? ` ${text}` : ""}${note ? `\n${note}` : ""}`;
    }

    const lines = [];
    Object.entries(item || {}).forEach(([key,value]) => {
      if(key === "id" || key.endsWith("Ref") || key === "relatedCardIds") return;
      if(key === "extraLabel") return;
      if(key === "extraValue"){
        const text = cleanText(value);
        if(text){ lines.push(`${cleanText(item.extraLabel) || "编号"}：${text}`); }
        return;
      }
      if(key === "parentDepartmentId"){
        const parent = (module?.items || []).find(candidate => candidate.id === value);
        if(parent){ lines.push(`上级部门：${parent.name || "未命名部门"}`); }
        return;
      }
      if(key.endsWith("CardId")){
        const name = linkedName(value);
        if(name){ lines.push(name); }
        return;
      }
      if(typeof value !== "string") return;
      const text = cleanText(value);
      if(!text || text.startsWith("data:")) return;
      if(["content","note"].includes(key)){ lines.push(text); }
      else if(["title","name","time","date","role","category","departmentType","type"].includes(key)){
        lines.push(`${fieldLabels[key] || key}：${text}`);
      }
    });
    return lines.join("\n");
  }

  function sectionsFor(card){
    return (card.modules || []).map(module => {
      if(["图片","地图","关系"].includes(module.kind)) return null;
      const paragraphs = (module.items || []).map(item => readableItem(item,module)).filter(Boolean);
      const description = cleanText(module.description);
      if(description){ paragraphs.unshift(description); }
      if(!paragraphs.length) return null;
      return {
        id:module.id,
        title:cleanText(module.title) || module.kind,
        paragraphs
      };
    }).filter(Boolean);
  }

  const entries = db.cards.map(card => ({
    id:card.id,
    name:cleanText(card.name) || "未命名词条",
    type:card.type || "其他",
    subtype:card.subtype || "",
    folderId:card.basic?.folderId || "",
    folderName:(db.settings.catalogFolders || []).find(folder => folder.id === card.basic?.folderId)?.name || "",
    subtitle:cleanText(card.subtitle),
    summary:cleanText(card.basic?.publicSummary),
    image:cleanText(card.heroImages?.[0]?.cloudUrl) || cleanText(card.heroImages?.[0]?.src),
    facts:factsFor(card),
    sections:sectionsFor(card),
    updatedAt:card.updatedAt || card.createdAt || null
  }));

  const relations = (db.relations || []).map(relation => ({
    id:relation.id,
    fromId:relation.fromCardId,
    toId:relation.toCardId,
    fromName:linkedName(relation.fromCardId),
    toName:linkedName(relation.toCardId),
    label:relation.relation || "相关",
    note:cleanText(relation.note)
  })).filter(item => item.fromName && item.toName);

  db.cards.forEach(card =>{
    const parentId = card.basic?.parentOrgCardId;
    const parent = parentId ? cardById.get(parentId) : null;
    if(parent){
      relations.push({
        id:`org-parent-${card.id}`,
        fromId:parent.id,
        toId:card.id,
        fromName:parent.name,
        toName:card.name,
        label:"下辖",
        note:""
      });
    }

    const locationId = card.basic?.locationCardId;
    const location = locationId ? cardById.get(locationId) : null;
    if(location){
      relations.push({
        id:`main-location-${card.id}`,
        fromId:card.id,toId:location.id,
        fromName:card.name,toName:location.name,
        label:"位于",note:cleanText(card.basic?.locationDescription)
      });
    }

    const parentRegionId = card.basic?.parentRegionCardId;
    const parentRegion = parentRegionId ? cardById.get(parentRegionId) : null;
    if(parentRegion){
      relations.push({
        id:`parent-region-${card.id}`,
        fromId:card.id,toId:parentRegion.id,
        fromName:card.name,toName:parentRegion.name,
        label:"属于",note:cleanText(card.basic?.locationDescription)
      });
    }
  });

  const timeline = [];
  db.cards.forEach(card => {
    (card.modules || []).filter(module => module.kind === "时间轴").forEach(module => {
      (module.items || []).forEach(item => {
        if(!cleanText(item.title)) return;
        timeline.push({
          id:item.id,
          date:cleanText(item.date),
          title:cleanText(item.title),
          content:cleanText(item.content),
          tags:cleanText(item.tags),
          sourceId:card.id,
          sourceName:card.name,
          relatedIds:Array.isArray(item.relatedCardIds) ? item.relatedCardIds : []
        });
      });
    });
  });

  const payload = {
    format:"yulengjing-public-wiki",
    version:1,
    exportedAt:new Date().toISOString(),
    entries,
    relations,
    timeline,
    network:{
      positions:Object.fromEntries(
        Object.entries(db.settings.networkPositions || {})
          .filter(([id,position]) => cardById.get(id)?.type === "角色" && Number.isFinite(Number(position?.x)) && Number.isFinite(Number(position?.y)))
          .map(([id,position]) => [id,{x:Number(position.x),y:Number(position.y)}])
      ),
      primaryIds:db.cards
        .filter(card => card.type === "角色" && card.basic?.folderId === db.settings.networkPrimaryFolderId)
        .map(card => card.id),
      hiddenLabels:Array.isArray(db.settings.hiddenNetworkRelationLabels)
        ? db.settings.hiddenNetworkRelationLabels
        : []
    }
  };

  const blob = new Blob(
    [JSON.stringify(payload,null,2)],
    {type:"application/json;charset=utf-8"}
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "wiki-data.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast(`已导出 ${entries.length} 个百科词条`);
}
