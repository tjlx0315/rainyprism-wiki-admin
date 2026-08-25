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
      networkPositions:{}
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

    return parsed;

  }catch(error){

    console.error(
      "读取数据库失败",
      error
    );

    return blankDB();

  }

}


function saveDB(){

  try{

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(db)
    );

  }catch(error){

    console.error(
      "保存数据库失败",
      error
    );

    toast(
      "本地存储空间不足。图片较多时请尽快接入云端存储。"
    );

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


