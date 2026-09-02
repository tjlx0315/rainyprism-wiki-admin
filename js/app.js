"use strict";


/* =========================================================
   01. 常量
========================================================= */

const CARD_TYPES = {

  "角色":[
    "角色"
  ],

  "组织":[
    "政府机构",
    "执法机构",
    "学校",
    "企业／集团",
    "医疗机构",
    "研究机构",
    "媒体机构",
    "社团／协会",
    "政治势力",
    "犯罪组织",
    "家族",
    "非正式组织",
    "其他"
  ],

  "地区":[
    "国家",
    "城市",
    "城镇",
    "建筑",
    "地标",
    "店铺",
    "其他"
  ],

  "事件":[
    "案件",
    "事件",
    "会议",
    "节庆",
    "行动",
    "其他"
  ],

  "其他":[
    "武器",
    "设备",
    "载具",
    "文献",
    "物件",
    "其他"
  ]

};


const MODULE_TYPES_BY_CARD_TYPE = {
  "角色":["职务","经历"],
  "组织":["位置","创始人","创立时间","部门"],
  "地区":["区划","生态"],
  "事件":["参与者","发生地点","事件经过","影响"],
  "其他":[]
};


const COMMON_MODULE_TYPES = [
  "卡片引用",
  "关系",
  "事件",
  "时间轴",
  "地图",
  "图片",
  "自定义"
];


const GENERIC_MODULE_SCHEMAS = {
  "卡片引用":[
    {key:"relatedCardId",label:"引用卡片",type:"card",cardTypes:["角色","组织","地区","事件","其他"]},
    {key:"referenceText",label:"身份或补充文字",type:"text"},
    {key:"note",label:"详细说明",type:"textarea"}
  ],
  "位置":[
    {key:"name",label:"位置名称",type:"text"},
    {key:"placeCardId",label:"关联地区",type:"card",cardTypes:["地区"]},
    {key:"note",label:"说明",type:"textarea"}
  ],
  "创始人":[
    {key:"founderCardId",label:"关联角色",type:"card",cardTypes:["角色"]},
    {key:"name",label:"姓名或称呼",type:"text"},
    {key:"note",label:"说明",type:"textarea"}
  ],
  "创立时间":[
    {key:"time",label:"创立时间",type:"text"},
    {key:"note",label:"说明",type:"textarea"}
  ],
  "部门":[
    {key:"name",label:"部门名称",type:"text"},
    {key:"departmentType",label:"部门类型",type:"text"},
    {key:"parentDepartmentId",label:"上级部门",type:"department"},
    {key:"departmentCardId",label:"关联机构词条",type:"card",cardTypes:["组织"]},
    {key:"leaderCardId",label:"负责人",type:"card",cardTypes:["角色"]},
    {key:"note",label:"说明",type:"textarea"}
  ],
  "区划":[
    {key:"name",label:"区划名称",type:"text"},
    {key:"category",label:"区划类型",type:"text"},
    {key:"note",label:"说明",type:"textarea"}
  ],
  "生态":[
    {key:"name",label:"生态名称",type:"text"},
    {key:"category",label:"类型",type:"text"},
    {key:"note",label:"说明",type:"textarea"}
  ],
  "参与者":[
    {key:"relatedCardId",label:"参与者",type:"card",cardTypes:["角色","组织"]},
    {key:"role",label:"参与身份",type:"text"},
    {key:"note",label:"说明",type:"textarea"}
  ],
  "发生地点":[
    {key:"placeCardId",label:"地点",type:"card",cardTypes:["地区"]},
    {key:"note",label:"说明",type:"textarea"}
  ],
  "事件经过":[
    {key:"time",label:"时间",type:"text"},
    {key:"title",label:"阶段标题",type:"text"},
    {key:"content",label:"经过",type:"textarea"}
  ],
  "影响":[
    {key:"title",label:"影响对象或标题",type:"text"},
    {key:"content",label:"影响内容",type:"textarea"}
  ],
  "事件":[
    {key:"eventCardId",label:"关联事件",type:"card",cardTypes:["事件"]},
    {key:"note",label:"说明",type:"textarea"}
  ]
};


function availableModuleTypes(card){
  return [
    ...(MODULE_TYPES_BY_CARD_TYPE[card.type] || []),
    ...COMMON_MODULE_TYPES
  ];
}


const EXPERIENCE_TYPES = [
  "工作",
  "学习",
  "任职",
  "资格",
  "其他"
];


const SEX_OPTIONS = [
  "女",
  "男",
  "其他",
  "未知",
  "自定义"
];


const RELATION_REVERSE_MAP = {

  "姐姐":"妹妹",
  "妹妹":"姐姐",

  "哥哥":"弟弟",
  "弟弟":"哥哥",

  "母亲":"女儿",
  "父亲":"女儿",

  "女儿":"母亲",
  "儿子":"父亲",

  "姥姥":"外孙女",
  "姥爷":"外孙女",

  "奶奶":"孙女",
  "爷爷":"孙女",

  "师父":"徒弟",
  "师傅":"徒弟",
  "徒弟":"师父",

  "老师":"学生",
  "学生":"老师",

  "导师":"学生",

  "上司":"下属",
  "下属":"上司",

  "领导":"部下",
  "部下":"领导",

  "朋友":"朋友",
  "好友":"好友",
  "搭档":"搭档",
  "同事":"同事",
  "青梅竹马":"青梅竹马",
  "姐妹":"姐妹",
  "兄弟":"兄弟",

  "恋人":"恋人",
  "爱人":"爱人",
  "配偶":"配偶",

  "暗恋对象":"暗恋者",
  "暗恋者":"暗恋对象",

  "调查对象":"调查者",
  "调查者":"调查对象",

  "保护对象":"保护者",
  "保护者":"保护对象",

  "负责人":"成员",
  "成员":"负责人"

};


const NODE_COLORS = {
  "角色":"#79b8c9",
  "组织":"#a69ac7",
  "地区":"#8eb89b",
  "事件":"#caa174",
  "其他":"#b88d8d"
};


/* =========================================================
   02. 运行状态
========================================================= */

let db = blankDB();

let currentView = "cards";

let currentCardId = null;

let draggedModuleId = null;

let lastDeletedModule = null;

let heroImageIndex = 0;

let collapsedCatalogTypes = new Set();
let collapsedCatalogFolders = new Set();

let catalogCardDragJustEnded = false;

let draggedCatalogCardId = null;

let networkRuntime = {
  nodes:[],
  edges:[],
  dragging:null,
  panning:null,
  relationStart:null,
  dragStart:null,
  dragOffset:{x:0,y:0},
  hoverNode:null,
  hoverEdge:null,
  positions:{},
  viewport:{x:0,y:0,scale:1}
};

function openQuickRoleRelationModal(sourceCard,targetCard){
  if(!sourceCard || !targetCard || sourceCard.type !== "角色" || targetCard.type !== "角色"){
    toast("目前只支持在两个角色之间建立关系。");
    return;
  }

  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <div class="modal-head">
      <h3>添加人物关系</h3>
      <button class="icon-btn" data-close-modal>×</button>
    </div>
    <div class="network-role-pair">
      <strong>${escapeHTML(sourceCard.name)}</strong>
      <span>—</span>
      <strong>${escapeHTML(targetCard.name)}</strong>
    </div>
    <div class="field" style="margin-top:16px">
      <label>关系名称</label>
      <input id="quickRoleRelationName" type="text" placeholder="例如：朋友、同学、前恋人" autofocus>
    </div>
    <div class="field" style="margin-top:12px">
      <label>关系方向</label>
      <select id="quickRoleRelationDirection">
        <option value="both" selected>${escapeHTML(sourceCard.name)} ↔ ${escapeHTML(targetCard.name)}（双向）</option>
        <option value="forward">${escapeHTML(sourceCard.name)} → ${escapeHTML(targetCard.name)}（单向）</option>
        <option value="reverse">${escapeHTML(targetCard.name)} → ${escapeHTML(sourceCard.name)}（单向）</option>
      </select>
      <div class="field-help">双向关系只保存和展示一次；单向关系会在线上显示箭头。</div>
    </div>
    <div class="field" style="margin-top:12px">
      <label>备注</label>
      <textarea id="quickRoleRelationNote" placeholder="可选"></textarea>
    </div>
    <div class="drawer-actions">
      <button class="btn" data-close-modal>取消</button>
      <button id="saveQuickRoleRelation" class="btn primary">保存关系</button>
    </div>
  `;

  openModal();
  const nameInput = document.getElementById("quickRoleRelationName");
  setTimeout(()=>nameInput?.focus(),0);

  function saveQuickRelation(){
    const relation = nameInput.value.trim();
    const note = document.getElementById("quickRoleRelationNote").value.trim();
    const direction = document.getElementById("quickRoleRelationDirection").value;
    if(!relation){
      toast("请填写关系名称。");
      nameInput.focus();
      return;
    }
    const pairId = `role:${[sourceCard.id,targetCard.id].sort().join("::")}`;
    const fromCardId = direction === "reverse" ? targetCard.id : sourceCard.id;
    const toCardId = direction === "reverse" ? sourceCard.id : targetCard.id;
    db.relations.push({
      id:uid(),
      pairId,
      fromCardId,
      toCardId,
      relation,
      note,
      undirected:direction === "both",
      createdAt:Date.now()
    });
    saveDB();
    closeModal();
    initRelationNetwork();
    toast(`已添加「${relation}」关系`);
  }

  document.getElementById("saveQuickRoleRelation").onclick = saveQuickRelation;
  nameInput.onkeydown = event =>{
    if(event.key === "Enter"){
      event.preventDefault();
      saveQuickRelation();
    }
  };
}


/* =========================================================
   03. 工具函数
========================================================= */

function uid(){

  return (
    Math.random()
      .toString(36)
      .slice(2,9)
    +
    Date.now()
      .toString(36)
      .slice(-5)
  );

}


function escapeHTML(value=""){

  return String(value)
    .replace(
      /[&<>"']/g,
      char => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
      }[char])
    );

}


function clone(value){
  return JSON.parse(
    JSON.stringify(value)
  );
}


function fileSize(bytes=0){

  if(bytes < 1024){
    return bytes + " B";
  }

  if(bytes < 1024 * 1024){
    return (
      bytes / 1024
    ).toFixed(1) + " KB";
  }

  return (
    bytes / 1024 / 1024
  ).toFixed(1) + " MB";

}


function getCard(id){
  return db.cards.find(
    card => card.id === id
  );
}


function getCurrentCard(){
  return getCard(currentCardId);
}


function organizationDescendantIds(parentId){
  const found = new Set();
  let changed = true;
  while(changed){
    changed = false;
    db.cards.forEach(card =>{
      const directParent = card.basic?.parentOrgCardId;
      if(!found.has(card.id) && (directParent === parentId || found.has(directParent))){
        found.add(card.id);
        changed = true;
      }
    });
  }
  return found;
}


function getModule(card,moduleId){

  return (
    card.modules || []
  ).find(
    module => module.id === moduleId
  );

}


function getTimelineNodeByRef(ref){

  if(!ref){
    return null;
  }

  const [
    cardId,
    moduleId,
    nodeId
  ] = ref.split("::");

  const card = getCard(cardId);

  if(!card){
    return null;
  }

  const module = getModule(
    card,
    moduleId
  );

  if(!module){
    return null;
  }

  const node = (
    module.items || []
  ).find(
    item => item.id === nodeId
  );

  if(!node){
    return null;
  }

  return {
    card,
    module,
    node
  };

}


function toast(message,withUndo=false){

  const toast = document.getElementById(
    "toast"
  );

  if(withUndo){

    toast.innerHTML = `
      <span>${escapeHTML(message)}</span>
      &nbsp;&nbsp;
      <button
        id="undoDeleteBtn"
        class="text-btn"
      >
        撤销
      </button>
    `;

  }else{

    toast.textContent = message;

  }

  toast.classList.add("show");

  clearTimeout(
    window.__toastTimer
  );


  if(withUndo){

    const undo = document.getElementById(
      "undoDeleteBtn"
    );

    undo.onclick = undoDeleteModule;

  }


  window.__toastTimer = setTimeout(
    ()=>{
      toast.classList.remove("show");
      lastDeletedModule = null;
    },
    5000
  );

}


/* =========================================================
   05. 卡片初始结构
========================================================= */

function createEmptyCard(
  type,
  subtype,
  name,
  subtitle
){

  return {

    id:uid(),

    type,

    subtype,

    name,

    subtitle,

    heroImages:[],

    basic:{

      aliases:"",

      birthday:"",

      sex:"",

      customSex:"",

      ageMode:"auto",

      fixedAge:"",

      height:"",

      birthplaceCardId:"",

      parentOrgCardId:"",

      locationCardId:"",

      parentRegionCardId:"",

      locationDescription:"",

      folderId:"",

      interest:"",

      publicSummary:"",

      customAttributes:[]

    },

    modules:[],

    createdAt:Date.now(),

    updatedAt:Date.now()

  };

}


/* =========================================================
   06. 年龄
========================================================= */

function calculateAge(card){

  const basic = card.basic || {};

  if(
    basic.ageMode === "fixed"
  ){

    return (
      basic.fixedAge !== ""
      ? basic.fixedAge
      : ""
    );

  }


  if(!basic.birthday){
    return "";
  }


  const birthday =
    new Date(
      basic.birthday + "T00:00:00"
    );

  if(
    Number.isNaN(
      birthday.getTime()
    )
  ){
    return "";
  }


  const today = new Date();

  let age =
    today.getFullYear()
    -
    birthday.getFullYear();


  const monthDiff =
    today.getMonth()
    -
    birthday.getMonth();


  if(
    monthDiff < 0
    ||
    (
      monthDiff === 0
      &&
      today.getDate()
      <
      birthday.getDate()
    )
  ){
    age--;
  }


  return Math.max(
    0,
    age
  );

}


/* =========================================================
   07. View 切换
========================================================= */

function switchView(view){

  currentView = view;

  document.querySelector(".inner").classList.toggle(
    "card-workspace-mode",
    view === "cards" || view === "editor"
  );

  document.querySelector(".content").classList.toggle(
    "card-workspace-content",
    view === "cards" || view === "editor"
  );


  document
    .querySelectorAll(".view")
    .forEach(
      element =>
        element.classList.remove(
          "active"
        )
    );


  const target =
    document.getElementById(
      view + "View"
    );

  if(target){
    target.classList.add("active");
  }


  document
    .querySelectorAll(".nav-btn")
    .forEach(
      button =>{
        button.classList.toggle(
          "active",
          button.dataset.view === view
        );
      }
    );


  if(view === "cards"){
    renderCardList();
  }

  if(view === "relations"){
    renderRelationFilters();
    initRelationNetwork();
  }

  if(view === "timeline"){
    renderTimelineFilters();
    renderGlobalTimeline();
  }

}


/* =========================================================
   08. 顶部筛选
========================================================= */

function renderTypeFilter(){

  const select =
    document.getElementById(
      "cardTypeFilter"
    );

  select.innerHTML =
    `<option value="">全部类型</option>`;

  Object.keys(
    CARD_TYPES
  ).forEach(
    type =>{

      select.insertAdjacentHTML(
        "beforeend",
        `
          <option value="${escapeHTML(type)}">
            ${escapeHTML(type)}
          </option>
        `
      );

    }
  );

}


/* =========================================================
   09. 卡片列表
========================================================= */

function getHeroImage(card){

  return (
    card.heroImages &&
    card.heroImages.length
  )
  ? card.heroImages[0]
  : null;

}


function renderCardList(){

  const container =
    document.getElementById(
      "cardGrid"
    );

  const search =
    document.getElementById(
      "globalSearch"
    ).value
    .trim()
    .toLowerCase();

  const typeFilter =
    document.getElementById(
      "cardTypeFilter"
    ).value;


  const cards = db.cards.filter(
    card =>{

      if(
        typeFilter &&
        card.type !== typeFilter
      ){
        return false;
      }


      if(!search){
        return true;
      }


      const aliases =
        card.basic?.aliases || "";

      const haystack = [
        card.name,
        card.subtitle,
        card.type,
        card.subtype,
        aliases
      ]
      .join(" ")
      .toLowerCase();


      return haystack.includes(
        search
      );

    }
  );


  container.innerHTML = Object.keys(CARD_TYPES).map(type =>{
    const grouped = cards.filter(card => card.type === type);
    const folders = catalogFoldersForType(type);
    return `
      <section class="catalog-group ${collapsedCatalogTypes.has(type) ? "collapsed" : ""}">
        <div class="catalog-group-head">
          <button class="catalog-group-title" data-toggle-catalog="${escapeHTML(type)}">
            <span>${escapeHTML(type)}</span><span class="catalog-chevron">⌄</span>
          </button>
          <button class="catalog-folder-add" data-add-catalog-folder="${escapeHTML(type)}" title="在${escapeHTML(type)}中建立文件夹">＋</button>
        </div>
        <div class="catalog-group-items">
          ${renderCatalogFolderItems(grouped,type,folders)}
        </div>
      </section>
    `;
  }).join("") || `<div class="catalog-empty">没有符合条件的卡片</div>`;

  container.querySelectorAll("[data-toggle-catalog]").forEach(button =>{
    button.onclick = ()=>{
      const type = button.dataset.toggleCatalog;
      if(collapsedCatalogTypes.has(type)){
        collapsedCatalogTypes.delete(type);
      }else{
        collapsedCatalogTypes.add(type);
      }
      renderCardList();
    };
  });

  container.querySelectorAll("[data-add-catalog-folder]").forEach(button =>{
    button.onclick = event =>{
      event.stopPropagation();
      createCatalogFolder(button.dataset.addCatalogFolder);
    };
  });

  container.querySelectorAll("[data-toggle-folder]").forEach(button =>{
    button.onclick = ()=>{
      const id = button.dataset.toggleFolder;
      if(collapsedCatalogFolders.has(id)){ collapsedCatalogFolders.delete(id); }
      else{ collapsedCatalogFolders.add(id); }
      renderCardList();
    };
  });

  container.querySelectorAll("[data-rename-folder]").forEach(button =>{
    button.onclick = event =>{
      event.stopPropagation();
      renameCatalogFolder(button.dataset.renameFolder);
    };
  });

  container.querySelectorAll("[data-delete-folder]").forEach(button =>{
    button.onclick = event =>{
      event.stopPropagation();
      deleteCatalogFolder(button.dataset.deleteFolder);
    };
  });

  container.querySelectorAll("[data-drop-folder]").forEach(folderElement =>{
    folderElement.ondragover = event =>{
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      folderElement.classList.add("drag-over");
    };

    folderElement.ondragleave = event =>{
      if(!folderElement.contains(event.relatedTarget)){
        folderElement.classList.remove("drag-over");
      }
    };

    folderElement.ondrop = event =>{
      event.preventDefault();
      folderElement.classList.remove("drag-over");
      const cardId = draggedCatalogCardId || event.dataTransfer.getData("text/yulengjing-card-id") || event.dataTransfer.getData("text/plain");
      const folderId = folderElement.dataset.dropFolder;
      const card = getCard(cardId);
      const folder = db.settings.catalogFolders.find(item => item.id === folderId);
      if(!card || !folder){ return; }
      if(card.type !== folder.type){
        toast(`「${folder.name}」只接收${folder.type}卡片。`);
        return;
      }
      card.basic = card.basic || {};
      card.basic.folderId = folder.id;
      const fromIndex = db.cards.findIndex(item => item.id === card.id);
      if(fromIndex >= 0){
        const [moved] = db.cards.splice(fromIndex,1);
        let insertAt = -1;
        db.cards.forEach((item,index) =>{
          if(item.type === folder.type && item.basic?.folderId === folder.id){ insertAt = index; }
        });
        db.cards.splice(insertAt + 1,0,moved);
      }
      collapsedCatalogFolders.delete(folder.id);
      touchCard(card);
      renderCardList();
      toast(`已将「${card.name || "未命名"}」移入「${folder.name}」`);
    };
  });


  container
    .querySelectorAll(
      "[data-card-id]"
    )
    .forEach(
      cardElement =>{

        cardElement.onclick =
          event =>{

            if(catalogCardDragJustEnded){ return; }

            openCardEditor(
              cardElement.dataset.cardId
            );

          };

        cardElement.ondragstart = event =>{
          catalogCardDragJustEnded = false;
          draggedCatalogCardId = cardElement.dataset.cardId;
          cardElement.classList.add("dragging");
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/yulengjing-card-id",cardElement.dataset.cardId);
          event.dataTransfer.setData("text/plain",cardElement.dataset.cardId);
        };

        cardElement.ondragover = event =>{
          event.preventDefault();
          event.stopPropagation();
          const draggedId = draggedCatalogCardId;
          if(draggedId && draggedId !== cardElement.dataset.cardId){
            cardElement.classList.add("sort-target");
            event.dataTransfer.dropEffect = "move";
          }
        };

        cardElement.ondragleave = ()=>{
          cardElement.classList.remove("sort-target");
        };

        cardElement.ondrop = event =>{
          event.preventDefault();
          event.stopPropagation();
          cardElement.classList.remove("sort-target");
          const draggedId = draggedCatalogCardId || event.dataTransfer.getData("text/yulengjing-card-id") || event.dataTransfer.getData("text/plain");
          const targetId = cardElement.dataset.cardId;
          if(!draggedId || draggedId === targetId){ return; }
          const draggedCard = getCard(draggedId);
          const targetCard = getCard(targetId);
          if(!draggedCard || !targetCard){ return; }
          if(draggedCard.type !== targetCard.type){
            toast("只能在同一种主类型中调整顺序。");
            return;
          }
          draggedCard.basic = draggedCard.basic || {};
          draggedCard.basic.folderId = targetCard.basic?.folderId || "";
          const fromIndex = db.cards.findIndex(card => card.id === draggedId);
          if(fromIndex < 0){ return; }
          const [moved] = db.cards.splice(fromIndex,1);
          const targetIndex = db.cards.findIndex(card => card.id === targetId);
          db.cards.splice(targetIndex,0,moved);
          touchCard(moved);
          renderCardList();
          toast(`已调整「${moved.name || "未命名"}」的位置`);
        };

        cardElement.ondragend = ()=>{
          draggedCatalogCardId = null;
          cardElement.classList.remove("dragging");
          container.querySelectorAll(".catalog-folder.drag-over").forEach(folder => folder.classList.remove("drag-over"));
          container.querySelectorAll(".catalog-card.sort-target").forEach(card => card.classList.remove("sort-target"));
          catalogCardDragJustEnded = true;
          setTimeout(()=>{ catalogCardDragJustEnded = false; },0);
        };

        cardElement.oncontextmenu = event =>{
          event.preventDefault();
          document.querySelector(".catalog-context-menu")?.remove();

          const menu = document.createElement("div");
          menu.className = "catalog-context-menu";
          menu.style.left = Math.min(event.clientX,window.innerWidth - 150) + "px";
          menu.style.top = Math.min(event.clientY,window.innerHeight - 60) + "px";
          menu.innerHTML = `<button type="button">删除卡片</button>`;

          menu.querySelector("button").onclick = ()=>{
            currentCardId = cardElement.dataset.cardId;
            renderCardList();
            menu.remove();
            openDeleteCardDrawer();
          };

          document.body.appendChild(menu);
        };

      }
    );


}


function catalogFoldersForType(type){
  db.settings.catalogFolders = Array.isArray(db.settings.catalogFolders)
    ? db.settings.catalogFolders
    : [];
  return db.settings.catalogFolders.filter(folder => folder.type === type);
}


function renderCatalogFolderItems(cards,type,folders){
  const folderIds = new Set(folders.map(folder => folder.id));
  const unfiled = cards.filter(card => !card.basic?.folderId || !folderIds.has(card.basic.folderId));
  return folders.map(folder =>{
    const folderCards = cards.filter(card => card.basic?.folderId === folder.id);
    return `
      <section class="catalog-folder ${collapsedCatalogFolders.has(folder.id) ? "collapsed" : ""}" data-drop-folder="${folder.id}">
        <div class="catalog-folder-head">
          <button class="catalog-folder-toggle" data-toggle-folder="${folder.id}">
            <span class="catalog-folder-icon">▾</span>
            <span>${escapeHTML(folder.name)}</span>
            <small>${folderCards.length}</small>
          </button>
          <button class="catalog-folder-action" data-rename-folder="${folder.id}" title="重命名">✎</button>
          <button class="catalog-folder-action" data-delete-folder="${folder.id}" title="删除文件夹">×</button>
        </div>
        <div class="catalog-folder-cards">${renderCatalogCards(folderCards,type)}</div>
      </section>
    `;
  }).join("") + (unfiled.length ? `<div class="catalog-unfiled">${folders.length ? `<span>未分组</span>` : ""}${renderCatalogCards(unfiled,type)}</div>` : "");
}


function createCatalogFolder(type){
  const name = prompt(`在「${type}」中建立文件夹：`);
  if(!name?.trim()){ return; }
  db.settings.catalogFolders.push({id:uid(),type,name:name.trim(),createdAt:Date.now()});
  saveDB();
  renderCardList();
}


function renameCatalogFolder(folderId){
  const folder = db.settings.catalogFolders.find(item => item.id === folderId);
  if(!folder){ return; }
  const name = prompt("文件夹名称：",folder.name);
  if(!name?.trim()){ return; }
  folder.name = name.trim();
  saveDB();
  renderCardList();
}


function deleteCatalogFolder(folderId){
  const folder = db.settings.catalogFolders.find(item => item.id === folderId);
  if(!folder){ return; }
  if(!confirm(`删除文件夹「${folder.name}」吗？\n\n文件夹里的卡片不会删除，只会移到“未分组”。`)){ return; }
  db.cards.forEach(card =>{
    if(card.basic?.folderId === folderId){ card.basic.folderId = ""; }
  });
  db.settings.catalogFolders = db.settings.catalogFolders.filter(item => item.id !== folderId);
  collapsedCatalogFolders.delete(folderId);
  saveDB();
  renderCardList();
}


function renderCatalogCards(cards,type){

  if(type !== "组织"){
    return cards.map(card => catalogCardHTML(card,0)).join("");
  }

  const ids = new Set(cards.map(card => card.id));
  const children = new Map();

  cards.forEach(card =>{
    const parentId = card.basic?.parentOrgCardId || "";
    if(!children.has(parentId)){ children.set(parentId,[]); }
    children.get(parentId).push(card);
  });

  const rendered = new Set();

  function branch(card,depth,path=new Set()){
    if(rendered.has(card.id) || path.has(card.id)){ return ""; }
    rendered.add(card.id);
    const nextPath = new Set(path);
    nextPath.add(card.id);
    return catalogCardHTML(card,depth)
      + (children.get(card.id) || []).map(child => branch(child,depth + 1,nextPath)).join("");
  }

  const roots = cards.filter(card =>{
    const parentId = card.basic?.parentOrgCardId || "";
    return !parentId || !ids.has(parentId);
  });

  let html = roots.map(card => branch(card,0)).join("");
  html += cards.filter(card => !rendered.has(card.id)).map(card => branch(card,0)).join("");
  return html;
}


function catalogCardHTML(card,depth){
  return `
    <button
      class="catalog-card ${card.id === currentCardId ? "active" : ""} ${depth ? "catalog-card-child" : ""}"
      data-card-id="${card.id}"
      draggable="true"
      style="--catalog-depth:${depth}"
    >
      ${depth ? `<span class="catalog-tree-mark">↳</span>` : ""}
      ${escapeHTML(card.name || "未命名")}
    </button>
  `;
}


/* =========================================================
   10. 新建卡片
========================================================= */

function openNewCardModal(){

  const modal =
    document.getElementById(
      "modal"
    );

  modal.innerHTML = `

    <div class="modal-head">

      <h3>
        新建世界观卡片
      </h3>

      <button
        class="icon-btn"
        data-close-modal
      >
        ×
      </button>

    </div>


    <div class="field-grid">

      <div class="field">

        <label>
          主类型
        </label>

        <select id="newCardType">

          ${
            Object.keys(
              CARD_TYPES
            )
            .map(
              type => `
                <option value="${escapeHTML(type)}">
                  ${escapeHTML(type)}
                </option>
              `
            )
            .join("")
          }

        </select>

      </div>


      <div id="newCardSubtypeField" class="field">

        <label>
          子类型
        </label>

        <select id="newCardSubtype"></select>

      </div>


      <div class="field full">

        <label>
          名称
        </label>

        <input
          id="newCardName"
          type="text"
          placeholder="请输入词条名称"
        >

      </div>


      <div class="field full">

        <label>
          副标题
        </label>

        <input
          id="newCardSubtitle"
          type="text"
          placeholder="可以自由填写，也可以留空"
        >

      </div>

      <label class="new-card-timeline-option full">
        <input id="newCardAddTimeline" type="checkbox">
        <span>
          <strong>创建后添加时间节点</strong>
          <small>卡片创建完成后，直接填写与它相关的时间节点</small>
        </span>
      </label>

    </div>


    <div class="modal-actions">

      <button
        class="btn"
        data-close-modal
      >
        取消
      </button>

      <button
        id="createCardConfirm"
        class="btn primary"
      >
        创建并编辑
      </button>

    </div>

  `;


  openModal();


  const typeSelect =
    document.getElementById(
      "newCardType"
    );

  const subtypeSelect =
    document.getElementById(
      "newCardSubtype"
    );


  function syncSubtypes(){

    document.getElementById("newCardSubtypeField").classList.toggle("hidden",typeSelect.value === "角色");

    subtypeSelect.innerHTML =
      CARD_TYPES[
        typeSelect.value
      ]
      .map(
        subtype => `
          <option value="${escapeHTML(subtype)}">
            ${escapeHTML(subtype)}
          </option>
        `
      )
      .join("")
      +
      `
        <option value="__custom__">
          自定义……
        </option>
      `;

  }


  typeSelect.onchange =
    syncSubtypes;


  syncSubtypes();


  document.getElementById(
    "createCardConfirm"
  ).onclick = ()=>{

    const name =
      document.getElementById(
        "newCardName"
      )
      .value
      .trim();


    if(!name){

      toast(
        "请先填写卡片名称。"
      );

      return;

    }


    let subtype =
      subtypeSelect.value;


    if(
      subtype === "__custom__"
    ){

      subtype =
        prompt(
          "请输入自定义子类型："
        )
        ||
        "其他";

    }


    const card =
      createEmptyCard(
        typeSelect.value,
        subtype,
        name,
        document.getElementById(
          "newCardSubtitle"
        ).value
      );

    const addTimelineNode =
      document.getElementById("newCardAddTimeline").checked;

    if(addTimelineNode){
      card.modules.push(createTimelineModule());
    }


    db.cards.push(card);

    saveDB();

    closeModal();

    refreshGlobalSelectors();

    openCardEditor(
      card.id
    );

    if(addTimelineNode){
      const timelineModule = card.modules.find(module => module.kind === "时间轴");
      openTimelineNodeDrawer(timelineModule.id,null);
    }

  };

}


/* =========================================================
   11. 打开卡片编辑器
========================================================= */

function openCardEditor(cardId){

  currentCardId = cardId;

  heroImageIndex = 0;

  switchView("editor");

  renderCardList();

  renderCardEditor();

}


/* =========================================================
   12. 编辑器整体
========================================================= */

function renderCardEditor(){

  const card =
    getCurrentCard();

  if(!card){
    return;
  }


  card.basic =
    card.basic || {};

  card.basic.customAttributes =
    card.basic.customAttributes || [];

  card.heroImages =
    card.heroImages || [];

  card.modules =
    card.modules || [];


  const editor =
    document.getElementById(
      "editorView"
    );


  editor.innerHTML = `

    <div class="editor-top">

      <div class="editor-top-left">

        <button
          id="backToCards"
          class="back-btn"
        >
          ← 返回
        </button>


        <div class="editor-identity">


          <div class="identity-main">

            <div class="editor-title-line">
              <input
                id="editCardName"
                class="title-input"
                type="text"
                value="${escapeHTML(card.name)}"
                placeholder="卡片名称"
              >
              <span id="editorTypeBadge" class="editor-type-badge">${escapeHTML(card.type)}</span>
            </div>

            <div class="editor-alias-line">
              <span>别名：</span>
              <input id="editCardAliases" type="text" value="${escapeHTML(card.basic.aliases || "")}" placeholder="暂无别名">
            </div>


            <div class="editor-summary-row">
              <div class="editor-summary-meta">
                <div class="editor-meta-grid">
                  <label><span>主类型</span><select id="editCardType">

                ${
                  Object.keys(
                    CARD_TYPES
                  )
                  .map(
                    type => `
                      <option
                        value="${escapeHTML(type)}"
                        ${
                          card.type === type
                          ? "selected"
                          : ""
                        }
                      >
                        ${escapeHTML(type)}
                      </option>
                    `
                  )
                  .join("")
                }

                  </select></label>
                  ${card.type === "角色" ? `<select id="editCardSubtype" class="hidden"><option value="角色">角色</option></select>` : `<label><span>子类型</span><select id="editCardSubtype"></select></label>`}
                  <label>
                    <span>所属文件夹</span>
                    <select id="editCardFolder">
                      <option value="">未分组</option>
                      ${catalogFoldersForType(card.type)
                        .map(folder => `
                          <option
                            value="${folder.id}"
                            ${card.basic.folderId === folder.id ? "selected" : ""}
                          >
                            ${escapeHTML(folder.name)}
                          </option>
                        `)
                        .join("")}
                    </select>
                  </label>
                  ${
                    card.type === "组织"
                    ? `
                      <label>
                        <span>上级机构</span>
                        <select id="editParentOrg">
                          <option value="">无上级机构</option>
                          ${db.cards
                            .filter(item => item.id !== card.id && item.type === "组织" && !organizationDescendantIds(card.id).has(item.id))
                            .map(item => `
                              <option
                                value="${item.id}"
                                ${card.basic.parentOrgCardId === item.id ? "selected" : ""}
                              >
                                ${escapeHTML(item.name || "未命名机构")}
                              </option>
                            `)
                            .join("")}
                        </select>
                      </label>
                    `
                    : ""
                  }
                  ${card.type === "组织" ? `
                    <label>
                      <span>主要所在地</span>
                      <select id="editLocationCard">
                        <option value="">未选择地区</option>
                        ${db.cards.filter(item => item.type === "地区").map(item => `
                          <option value="${item.id}" ${card.basic.locationCardId === item.id ? "selected" : ""}>${escapeHTML(item.name)}</option>
                        `).join("")}
                      </select>
                    </label>
                  ` : ""}
                  ${card.type === "地区" ? `
                    <label>
                      <span>上级地区</span>
                      <select id="editParentRegion">
                        <option value="">无上级地区</option>
                        ${db.cards.filter(item => item.type === "地区" && item.id !== card.id).map(item => `
                          <option value="${item.id}" ${card.basic.parentRegionCardId === item.id ? "selected" : ""}>${escapeHTML(item.name)}</option>
                        `).join("")}
                      </select>
                    </label>
                  ` : ""}
                  ${(card.type === "组织" || card.type === "地区") ? `
                    <label>
                      <span>${card.type === "地区" ? "相对位置" : "位置说明"}</span>
                      <input id="editLocationDescription" type="text" value="${escapeHTML(card.basic.locationDescription || "")}" placeholder="可以留空">
                    </label>
                  ` : ""}
                </div>
              </div>
            </div>

            ${card.type === "角色" ? `
              <section class="character-quick-info" aria-label="角色基本信息">
                <label>
                  <span>出生地</span>
                  <select id="editCharacterBirthplace">
                    <option value="">未填写</option>
                    ${db.cards
                      .filter(item => item.type === "地区")
                      .map(item => `<option value="${item.id}" ${card.basic.birthplaceCardId === item.id ? "selected" : ""}>${escapeHTML(item.name || "未命名地区")}</option>`)
                      .join("")}
                  </select>
                </label>
                <label>
                  <span>出生日期</span>
                  <input id="editCharacterBirthday" type="date" value="${escapeHTML(card.basic.birthday || "")}">
                </label>
                <label>
                  <span>年龄</span>
                  <input id="editCharacterAge" type="text" value="${calculateAge(card) !== "" ? `${calculateAge(card)} 岁` : ""}" placeholder="根据出生日期自动计算" disabled>
                </label>
                <label>
                  <span>身高</span>
                  <div class="character-height-input">
                    <input id="editCharacterHeight" type="number" min="0" step="1" value="${escapeHTML(card.basic.height || "")}" placeholder="未填写">
                    <span>cm</span>
                  </div>
                </label>
              </section>
            ` : ""}

          </div>


          <div id="heroImageBox"></div>


        </div>

      </div>


    </div>


    <div
      class="field full"
      style="margin:18px 0 24px;"
    >

      <label
        for="editPublicSummary"
        style="display:block;margin-bottom:8px;font-weight:700;"
      >
        百科简介
      </label>

      <textarea
        id="editPublicSummary"
        rows="4"
        style="width:100%;resize:vertical;"
        placeholder="填写访客在百科词条开头看到的简介；留空时百科不会自行补写"
      >${escapeHTML(card.basic.publicSummary || "")}</textarea>

      <div class="small" style="margin-top:6px;">
        此内容会显示在公开百科的词条标题下方。
      </div>

    </div>


    <div class="editor-modules-head">
      <h2 class="content-section-title">资料内容</h2>
      <div class="module-add">

      <button
        id="addModuleButton"
        class="btn primary"
      >
        ＋ 添加模块
      </button>


      <div
        id="moduleMenu"
        class="module-menu"
      >

        <div class="module-menu-title">
          世界观资料
        </div>

        ${
          availableModuleTypes(card)
          .map(
            type => `
              <button
                data-add-module="${escapeHTML(type)}"
              >
                ${escapeHTML(type)}
              </button>
            `
          )
          .join("")
        }

      </div>

      </div>
    </div>

    <div id="moduleContainer"></div>

  `;


  bindEditorHeader();

  renderHeroImages();

  renderModules();

}


/* =========================================================
   13. 编辑器头部事件
========================================================= */

function bindEditorHeader(){

  const card =
    getCurrentCard();


  document.getElementById(
    "backToCards"
  ).onclick = ()=>{

    currentCardId = null;

    switchView("cards");

  };


  document.getElementById(
    "editCardName"
  ).oninput = event =>{

    card.name =
      event.target.value;

    touchCard(card);

  };

  document.getElementById("editCardName").onblur = renderCardList;


  document.getElementById("editCardAliases").oninput = event =>{
    card.basic.aliases = event.target.value;
    touchCard(card);
  };

  document.getElementById("editPublicSummary").oninput = event =>{
    card.basic.publicSummary = event.target.value;
    touchCard(card);
  };

  const characterBirthplace = document.getElementById("editCharacterBirthplace");
  if(characterBirthplace){
    characterBirthplace.onchange = event =>{
      card.basic.birthplaceCardId = event.target.value;
      touchCard(card);
    };
  }

  const characterBirthday = document.getElementById("editCharacterBirthday");
  if(characterBirthday){
    characterBirthday.onchange = event =>{
      card.basic.birthday = event.target.value;
      touchCard(card);
      const ageInput = document.getElementById("editCharacterAge");
      if(ageInput){
        const age = calculateAge(card);
        ageInput.value = age !== "" ? `${age} 岁` : "";
      }
    };
  }

  const characterHeight = document.getElementById("editCharacterHeight");
  if(characterHeight){
    characterHeight.oninput = event =>{
      card.basic.height = event.target.value;
      touchCard(card);
    };
  }


  const typeSelect =
    document.getElementById(
      "editCardType"
    );

  const subtypeSelect =
    document.getElementById(
      "editCardSubtype"
    );

  const parentOrgSelect =
    document.getElementById(
      "editParentOrg"
    );

  if(parentOrgSelect){
    parentOrgSelect.onchange = ()=>{
      card.basic.parentOrgCardId = parentOrgSelect.value;
      touchCard(card);
      renderCardList();
    };
  }

  const locationCardSelect = document.getElementById("editLocationCard");
  if(locationCardSelect){
    locationCardSelect.onchange = ()=>{
      card.basic.locationCardId = locationCardSelect.value;
      touchCard(card);
    };
  }

  const parentRegionSelect = document.getElementById("editParentRegion");
  if(parentRegionSelect){
    parentRegionSelect.onchange = ()=>{
      card.basic.parentRegionCardId = parentRegionSelect.value;
      touchCard(card);
    };
  }

  const locationDescriptionInput = document.getElementById("editLocationDescription");
  if(locationDescriptionInput){
    locationDescriptionInput.oninput = ()=>{
      card.basic.locationDescription = locationDescriptionInput.value;
      touchCard(card);
    };
  }

  const folderSelect =
    document.getElementById(
      "editCardFolder"
    );

  folderSelect.onchange = ()=>{
    card.basic.folderId = folderSelect.value;
    touchCard(card);
    renderCardList();
  };


  function syncSubtypeSelect(){

    const options =
      CARD_TYPES[
        typeSelect.value
      ] || [];


    const current =
      card.subtype;


    subtypeSelect.innerHTML =
      options
      .map(
        subtype => `
          <option
            value="${escapeHTML(subtype)}"
            ${
              subtype === current
              ? "selected"
              : ""
            }
          >
            ${escapeHTML(subtype)}
          </option>
        `
      )
      .join("")
      +
      (
        current &&
        !options.includes(current)

        ? `
          <option
            value="${escapeHTML(current)}"
            selected
          >
            ${escapeHTML(current)}
          </option>
        `

        : ""
      )
      +
      `
        <option value="__custom__">
          自定义……
        </option>
      `;

  }


  typeSelect.onchange = ()=>{

    card.type =
      typeSelect.value;

    if(card.type !== "组织"){
      card.basic.parentOrgCardId = "";
    }

    card.basic.folderId = "";

    card.subtype =
      CARD_TYPES[
        card.type
      ][0]
      || "";

    document.getElementById("editorTypeBadge").textContent = card.type;

    syncSubtypeSelect();

    touchCard(card);

    renderCardList();

    renderCardEditor();

  };


  subtypeSelect.onchange = ()=>{

    if(
      subtypeSelect.value
      ===
      "__custom__"
    ){

      const custom =
        prompt(
          "请输入自定义子类型："
        );

      if(custom){

        card.subtype =
          custom.trim();

      }

      syncSubtypeSelect();

    }else{

      card.subtype =
        subtypeSelect.value;

    }

    touchCard(card);

  };


  syncSubtypeSelect();


  const addButton =
    document.getElementById(
      "addModuleButton"
    );

  const menu =
    document.getElementById(
      "moduleMenu"
    );


  addButton.onclick = event =>{

    event.stopPropagation();

    menu.classList.toggle(
      "open"
    );

  };


  menu
    .querySelectorAll(
      "[data-add-module]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          addModule(
            button.dataset.addModule
          );

          menu.classList.remove(
            "open"
          );

        };

      }
    );

}


/* =========================================================
   14. touch card
========================================================= */

function touchCard(card){

  card.updatedAt =
    Date.now();

  saveDB();

}


/* =========================================================
   15. 固定代表图
========================================================= */

function renderHeroImages(){

  const card =
    getCurrentCard();

  const box =
    document.getElementById(
      "heroImageBox"
    );

  const images =
    card.heroImages || [];


  if(
    heroImageIndex
    >=
    images.length
  ){

    heroImageIndex =
      Math.max(
        0,
        images.length - 1
      );

  }


  const current =
    images[
      heroImageIndex
    ];


  box.innerHTML = `

    <div class="hero-images">

      <div class="hero-preview" id="heroPreview">

        ${
          current

          ? `
            <img
              src="${escapeHTML(current.src)}"
              alt=""
            >

            ${images.length > 1 ? `
              <button id="heroPrev" class="hero-nav prev" aria-label="上一张">‹</button>
              <button id="heroNext" class="hero-nav next" aria-label="下一张">›</button>
            ` : ""}

            <button id="editHeroImages" class="hero-edit-float" aria-label="编辑图片">✎</button>
          `

          : `
            <button id="editHeroImages" class="hero-empty">添加代表图</button>
          `
        }

      </div>

    </div>

  `;


  const prevButton = document.getElementById("heroPrev");
  const nextButton = document.getElementById("heroNext");

  if(prevButton){
    prevButton.onclick = event =>{
      event.stopPropagation();

      heroImageIndex = (heroImageIndex - 1 + images.length) % images.length;

      renderHeroImages();
    };
  }

  if(nextButton){
    nextButton.onclick = event =>{
      event.stopPropagation();

      heroImageIndex = (heroImageIndex + 1) % images.length;

      renderHeroImages();
    };
  }


  document.getElementById(
    "editHeroImages"
  ).onclick =
    openHeroImageDrawer;

}


/* =========================================================
   16. 代表图 Drawer
========================================================= */

function openHeroImageDrawer(){

  const card =
    getCurrentCard();


  openDrawer(`

    <div class="drawer-head">

      <h3>
        编辑代表图
      </h3>

      <button
        class="icon-btn"
        data-close-drawer
      >
        ×
      </button>

    </div>


    <div class="upload-zone">

      <label
        for="heroUploadInput"
        style="cursor:pointer"
      >
        选择本地图片
      </label>

      <input
        id="heroUploadInput"
        type="file"
        accept="image/*"
        multiple
      >

      <div class="small" style="margin-top:8px">
        当前版本会保存在浏览器中。
        接入图床后这里会改成云端 URL。
      </div>

    </div>


    <div
      class="field"
      style="margin-top:12px"
    >

      <label>
        或添加图片 URL
      </label>

      <div class="inline-row">

        <input
          id="heroUrl"
          type="url"
          placeholder="https://..."
        >

        <button
          id="addHeroUrl"
          class="btn"
        >
          添加
        </button>

      </div>

    </div>


    <div
      id="heroImageList"
      style="margin-top:16px"
    ></div>

  `);


  function renderList(){

    const list =
      document.getElementById(
        "heroImageList"
      );


    if(
      !card.heroImages.length
    ){

      list.innerHTML = `
        <div class="empty">
          还没有代表图。
        </div>
      `;

      return;

    }


    list.innerHTML =
      card.heroImages
      .map(
        image => `
          <div class="list-item">

            <div class="list-item-head">

              <strong>
                ${escapeHTML(image.name || "未命名图片")}
              </strong>

              <button
                class="icon-btn danger"
                data-delete-hero="${image.id}"
              >
                ×
              </button>

            </div>

            <div class="field">

              <label>
                图片名称
              </label>

              <input
                data-hero-name="${image.id}"
                type="text"
                value="${escapeHTML(image.name || "")}"
              >

            </div>

          </div>
        `
      )
      .join("");


    list
      .querySelectorAll(
        "[data-hero-name]"
      )
      .forEach(
        input =>{

          input.oninput = ()=>{

            const image =
              card.heroImages.find(
                item =>
                  item.id
                  ===
                  input.dataset.heroName
              );

            if(image){

              image.name =
                input.value;

              touchCard(card);

              renderHeroImages();

            }

          };

        }
      );


    list
      .querySelectorAll(
        "[data-delete-hero]"
      )
      .forEach(
        button =>{

          button.onclick = ()=>{

            card.heroImages =
              card.heroImages.filter(
                image =>
                  image.id
                  !==
                  button.dataset.deleteHero
              );

            touchCard(card);

            renderList();

            renderHeroImages();

          };

        }
      );

  }


  document.getElementById(
    "heroUploadInput"
  ).onchange = event =>{

    const files =
      Array.from(
        event.target.files
      );


    files.forEach(
      file =>{

        fileToDataURL(
          file
        )
        .then(
          src =>{

            card.heroImages.push({

              id:uid(),

              src,

              name:
                file.name
                .replace(
                  /\.[^.]+$/,
                  ""
                ),

              cloudUrl:""

            });

            touchCard(card);

            renderList();

            renderHeroImages();

          }
        );

      }
    );


    event.target.value = "";

  };


  document.getElementById(
    "addHeroUrl"
  ).onclick = ()=>{

    const url =
      document.getElementById(
        "heroUrl"
      )
      .value
      .trim();


    if(!url){
      return;
    }


    card.heroImages.push({

      id:uid(),

      src:url,

      cloudUrl:url,

      name:"图片"

    });


    touchCard(card);

    document.getElementById(
      "heroUrl"
    ).value = "";

    renderList();

    renderHeroImages();

  };


  renderList();

}


/* =========================================================
   17. File → DataURL
========================================================= */

function fileToDataURL(file){

  return new Promise(
    (resolve,reject)=>{

      const reader =
        new FileReader();

      reader.onload = async ()=>{
        const original = reader.result;

        if(!file.type.startsWith("image/") || file.type === "image/gif"){
          resolve(original);
          return;
        }

        try{
          // 保存适合浏览器持久化的高质量网页版本；关系网绘制阶段
          // 仍使用高质量采样与设备像素对齐保护细轮廓。
          resolve(await optimizeImageDataURL(original));
        }catch(error){
          console.warn("图片压缩失败，将保留原图",error);
          resolve(original);
        }
      };

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );

    }
  );

}


function optimizeImageDataURL(src,maxSide=1200,quality=.97){
  return new Promise((resolve,reject)=>{
    const image = new Image();
    image.onload = ()=>{
      const scale = Math.min(1,maxSide / Math.max(image.naturalWidth,image.naturalHeight));
      const width = Math.max(1,Math.round(image.naturalWidth * scale));
      const height = Math.max(1,Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(image,0,0,width,height);
      const optimized = canvas.toDataURL("image/webp",quality);
      resolve(optimized.length < src.length ? optimized : src);
    };
    image.onerror = reject;
    image.src = src;
  });
}


async function optimizeStoredImagesForStorage(){
  const targets = [];

  db.cards.forEach(card =>{
    (card.heroImages || []).forEach(image => targets.push(image));
    (card.modules || []).forEach(module =>{
      (module.items || []).forEach(item =>{
        if(typeof item.src === "string"){ targets.push(item); }
      });
    });
  });

  let changed = false;
  for(const target of targets){
    if(!target.src?.startsWith("data:image/") || target.src.startsWith("data:image/gif")){
      continue;
    }
    const optimized = await optimizeImageDataURL(target.src);
    if(optimized.length < target.src.length){
      target.src = optimized;
      changed = true;
    }
  }

  return changed;
}


/* =========================================================
   18. 基本信息
========================================================= */

function renderBasicInfo(){

  const card =
    getCurrentCard();

  const basic =
    card.basic;


  const container =
    document.getElementById(
      "basicInfoBody"
    );


  const isCharacter =
    card.type === "角色";


  container.innerHTML = `

    <div class="field-grid">

      <div class="field full">

        <label>
          百科简介
        </label>

        <textarea
          id="basicPublicSummary"
          placeholder="填写访客在百科词条开头看到的简介；留空时百科只显示标题和已有章节"
        >${escapeHTML(basic.publicSummary || "")}</textarea>

      </div>

      <div class="field full">

        <label>
          别名
        </label>

        <input
          id="basicAliases"
          type="text"
          value="${escapeHTML(basic.aliases || "")}"
          placeholder="多个别名可用逗号分隔"
        >

      </div>


      ${
        isCharacter

        ? characterBasicHTML(card)

        : ""
      }

    </div>


    <div id="customBasicList"></div>


    <div class="basic-add-wrap">

      <button
        id="addBasicAttribute"
        class="btn small"
      >
        ＋ 添加属性
      </button>


      <div
        id="basicAddMenu"
        class="basic-add-menu"
      >

        ${
          isCharacter

          ? `
            <button data-basic-preset="生日">
              生日
            </button>

            <button data-basic-preset="性别">
              性别
            </button>

            <button data-basic-preset="年龄">
              年龄
            </button>

            <button data-basic-preset="身高">
              身高
            </button>

            <button data-basic-preset="出生地">
              出生地
            </button>

            <button data-basic-preset="兴趣">
              兴趣
            </button>
          `

          : ""
        }

        <button data-basic-custom>
          自定义属性
        </button>

      </div>

    </div>

  `;


  bindBasicInfo(
    card
  );

  renderCustomBasicAttributes();

}


function characterBasicHTML(card){

  const basic =
    card.basic;


  return `

    <div class="field">

      <label>
        生日
      </label>

      <input
        id="basicBirthday"
        type="date"
        value="${escapeHTML(basic.birthday || "")}"
      >

    </div>


    <div class="field">

      <label>
        性别
      </label>

      <select id="basicSex">

        <option value="">
          未填写
        </option>

        ${
          SEX_OPTIONS
          .map(
            option => `
              <option
                value="${escapeHTML(option)}"
                ${
                  basic.sex === option
                  ? "selected"
                  : ""
                }
              >
                ${escapeHTML(option)}
              </option>
            `
          )
          .join("")
        }

      </select>

    </div>


    <div
      id="customSexWrap"
      class="field ${
        basic.sex === "自定义"
        ? ""
        : "hidden"
      }"
    >

      <label>
        自定义性别
      </label>

      <input
        id="basicCustomSex"
        type="text"
        value="${escapeHTML(basic.customSex || "")}"
      >

    </div>


    <div class="field">

      <label>
        年龄
      </label>

      <div class="inline-row">

        <select id="ageMode">

          <option
            value="auto"
            ${
              basic.ageMode !== "fixed"
              ? "selected"
              : ""
            }
          >
            自动计算
          </option>

          <option
            value="fixed"
            ${
              basic.ageMode === "fixed"
              ? "selected"
              : ""
            }
          >
            固定年龄
          </option>

        </select>

        ${
          basic.ageMode === "fixed"

          ? `
            <input
              id="fixedAge"
              type="number"
              min="0"
              value="${escapeHTML(basic.fixedAge || "")}"
            >
          `

          : `
            <input
              type="text"
              disabled
              value="${
                calculateAge(card) !== ""
                ? calculateAge(card) + " 岁"
                : "需要填写生日"
              }"
            >
          `
        }

      </div>

    </div>


    <div class="field">

      <label>
        身高
      </label>

      <div class="inline-row">

        <input
          id="basicHeight"
          type="number"
          min="0"
          step="1"
          value="${escapeHTML(basic.height || "")}"
        >

        <input
          type="text"
          disabled
          value="cm"
          style="max-width:65px"
        >

      </div>

    </div>


    <div class="field">

      <label>
        出生地
      </label>

      <select id="basicBirthplace">

        <option value="">
          未关联
        </option>

        ${
          db.cards
          .filter(
            item =>
              item.type === "地区"
          )
          .map(
            item => `
              <option
                value="${item.id}"
                ${
                  basic.birthplaceCardId
                  ===
                  item.id
                  ? "selected"
                  : ""
                }
              >
                ${escapeHTML(item.name)}
              </option>
            `
          )
          .join("")
        }

      </select>

    </div>


    <div class="field full">

      <label>
        兴趣
      </label>

      <textarea
        id="basicInterest"
        placeholder="可以自由填写"
      >${escapeHTML(basic.interest || "")}</textarea>

    </div>

  `;

}


/* =========================================================
   19. 基本信息绑定
========================================================= */

function bindBasicInfo(card){

  const basic =
    card.basic;

  const publicSummary =
    document.getElementById(
      "basicPublicSummary"
    );

  publicSummary.oninput = ()=>{

    basic.publicSummary =
      publicSummary.value;

    touchCard(card);

  };


  const aliases =
    document.getElementById(
      "basicAliases"
    );

  aliases.oninput = ()=>{

    basic.aliases =
      aliases.value;

    touchCard(card);

  };


  const birthday =
    document.getElementById(
      "basicBirthday"
    );

  if(birthday){

    birthday.oninput = ()=>{

      basic.birthday =
        birthday.value;

      touchCard(card);

      renderBasicInfo();

    };

  }


  const sex =
    document.getElementById(
      "basicSex"
    );

  if(sex){

    sex.onchange = ()=>{

      basic.sex =
        sex.value;

      touchCard(card);

      renderBasicInfo();

    };

  }


  const customSex =
    document.getElementById(
      "basicCustomSex"
    );

  if(customSex){

    customSex.oninput = ()=>{

      basic.customSex =
        customSex.value;

      touchCard(card);

    };

  }


  const ageMode =
    document.getElementById(
      "ageMode"
    );

  if(ageMode){

    ageMode.onchange = ()=>{

      basic.ageMode =
        ageMode.value;

      touchCard(card);

      renderBasicInfo();

    };

  }


  const fixedAge =
    document.getElementById(
      "fixedAge"
    );

  if(fixedAge){

    fixedAge.oninput = ()=>{

      basic.fixedAge =
        fixedAge.value;

      touchCard(card);

    };

  }


  const height =
    document.getElementById(
      "basicHeight"
    );

  if(height){

    height.oninput = ()=>{

      basic.height =
        height.value;

      touchCard(card);

    };

  }


  const birthplace =
    document.getElementById(
      "basicBirthplace"
    );

  if(birthplace){

    birthplace.onchange = ()=>{

      basic.birthplaceCardId =
        birthplace.value;

      touchCard(card);

    };

  }


  const interest =
    document.getElementById(
      "basicInterest"
    );

  if(interest){

    interest.oninput = ()=>{

      basic.interest =
        interest.value;

      touchCard(card);

    };

  }


  const add =
    document.getElementById(
      "addBasicAttribute"
    );

  const menu =
    document.getElementById(
      "basicAddMenu"
    );


  add.onclick = event =>{

    event.stopPropagation();

    menu.classList.toggle(
      "open"
    );

  };


  menu
    .querySelectorAll(
      "[data-basic-preset]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          toast(
            "该属性已经属于角色的预设基本信息。"
          );

          menu.classList.remove(
            "open"
          );

        };

      }
    );


  const custom =
    menu.querySelector(
      "[data-basic-custom]"
    );

  custom.onclick = ()=>{

    basic.customAttributes.push({

      id:uid(),

      key:"",

      value:""

    });

    touchCard(card);

    menu.classList.remove(
      "open"
    );

    renderCustomBasicAttributes();

  };

}


/* =========================================================
   20. 自定义基本属性
========================================================= */

function renderCustomBasicAttributes(){

  const card =
    getCurrentCard();

  const list =
    document.getElementById(
      "customBasicList"
    );

  if(!list){
    return;
  }


  list.innerHTML =
    card.basic.customAttributes
    .map(
      attribute => `
        <div class="basic-row">

          <input
            data-basic-key="${attribute.id}"
            type="text"
            value="${escapeHTML(attribute.key || "")}"
            placeholder="属性名"
          >

          <textarea
            data-basic-value="${attribute.id}"
            placeholder="属性内容"
          >${escapeHTML(attribute.value || "")}</textarea>

          <button
            class="icon-btn danger"
            data-delete-basic="${attribute.id}"
          >
            ×
          </button>

        </div>
      `
    )
    .join("");


  list
    .querySelectorAll(
      "[data-basic-key]"
    )
    .forEach(
      input =>{

        input.oninput = ()=>{

          const attribute =
            card.basic.customAttributes.find(
              item =>
                item.id
                ===
                input.dataset.basicKey
            );

          if(attribute){

            attribute.key =
              input.value;

            touchCard(card);

          }

        };

      }
    );


  list
    .querySelectorAll(
      "[data-basic-value]"
    )
    .forEach(
      textarea =>{

        textarea.oninput = ()=>{

          const attribute =
            card.basic.customAttributes.find(
              item =>
                item.id
                ===
                textarea.dataset.basicValue
            );

          if(attribute){

            attribute.value =
              textarea.value;

            touchCard(card);

          }

        };

      }
    );


  list
    .querySelectorAll(
      "[data-delete-basic]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          card.basic.customAttributes =
            card.basic.customAttributes.filter(
              item =>
                item.id
                !==
                button.dataset.deleteBasic
            );

          touchCard(card);

          renderCustomBasicAttributes();

        };

      }
    );

}


/* =========================================================
   21. 添加模块
========================================================= */

function addModule(kind){

  const card =
    getCurrentCard();


  const module = {

    id:uid(),

    kind,

    title:kind,

    collapsed:false,

    items:[]

  };


  if(kind === "图片"){
    module.description = "";
  }

  if(kind === "地图"){
    module.mapId = "";
    module.items = [];
  }


  card.modules.push(
    module
  );

  touchCard(card);

  renderModules();

  toast(
    `已添加「${kind}」模块`
  );

}


function createTimelineModule(){
  return {
    id:uid(),
    kind:"时间轴",
    title:"时间轴",
    collapsed:false,
    items:[]
  };
}


function ensureTimelineModule(card){
  let module = (card.modules || []).find(item => item.kind === "时间轴");
  if(!module){
    module = createTimelineModule();
    card.modules.push(module);
  }
  return module;
}


function openGlobalTimelineNodeModal(){
  if(!db.cards.length){
    toast("请先新建一张卡片，再添加时间节点。");
    openNewCardModal();
    return;
  }

  const selectedId = document.getElementById("timelineCardFilter").value || "";
  const ownerCardIds = getCard(selectedId) ? [selectedId] : [];
  openTimelineNodeDrawer(null,null,null,ownerCardIds,true);
}


/* =========================================================
   22. 模块渲染
========================================================= */

function renderModules(){

  const card =
    getCurrentCard();

  const container =
    document.getElementById(
      "moduleContainer"
    );

  if(!container){
    return;
  }


  container.innerHTML = card.modules.length
    ? card.modules.map(module => renderModuleHTML(module)).join("")
    : `<div class="module-empty">暂无模块<br><span class="small">点击右上方“＋ 添加模块”开始整理资料</span></div>`;


  bindModuleEvents();

}


/* =========================================================
   23. 模块 Header
========================================================= */

function moduleHeaderHTML(module){

  return `

    <div
      class="section-head"
      draggable="true"
      data-drag-module="${module.id}"
    >

      <span class="drag-handle">
        ⠿
      </span>


      <h3>
        ${escapeHTML(module.title || module.kind)}
      </h3>


      <div class="section-actions">
        <button
          class="icon-btn"
          data-collapse-module="${module.id}"
          aria-label="${module.collapsed ? "展开" : "折叠"}"
        >
          ${module.collapsed ? "⌄" : "⌃"}
        </button>

        <div class="section-more-wrap">
          <button class="icon-btn" data-module-more="${module.id}" aria-label="更多操作">⋯</button>
          <div class="section-more-menu" data-module-menu="${module.id}">
            <button data-rename-module="${module.id}">修改名称</button>
            <button data-copy-module="${module.id}">复制模块</button>
            <button class="danger" data-delete-module="${module.id}">删除模块</button>
          </div>
        </div>

      </div>

    </div>

  `;

}


/* =========================================================
   24. 单模块 HTML
========================================================= */

function renderGenericModule(module){

  const schema = GENERIC_MODULE_SCHEMAS[module.kind] || [];

  return `
    ${(module.items || []).map((item,index)=>`
      <div class="list-item">
        <div class="list-item-head">
          <strong>${escapeHTML(module.kind)} ${index + 1}</strong>
          <button class="icon-btn danger" data-remove-item="${module.id}|${item.id}">×</button>
        </div>

        <div class="field-grid">
          ${schema.map(field =>{
            const value = item[field.key] || "";

            if(field.type === "textarea"){
              return `
                <div class="field full">
                  <label>${escapeHTML(field.label)}</label>
                  <textarea data-module-item="${module.id}|${item.id}|${field.key}">${escapeHTML(value)}</textarea>
                </div>
              `;
            }

            if(field.type === "card"){
              const choices = db.cards.filter(card =>
                card.id !== currentCardId && field.cardTypes.includes(card.type)
              );

              return `
                <div class="field">
                  <label>${escapeHTML(field.label)}</label>
                  <select data-module-item="${module.id}|${item.id}|${field.key}">
                    <option value="">不关联</option>
                    ${choices.map(card =>`
                      <option value="${card.id}" ${value === card.id ? "selected" : ""}>
                        ${escapeHTML(card.name || "未命名")}
                      </option>
                    `).join("")}
                  </select>
                </div>
              `;
            }

            if(field.type === "department"){
              const choices = (module.items || []).filter(choice => choice.id !== item.id);

              return `
                <div class="field">
                  <label>${escapeHTML(field.label)}</label>
                  <select data-module-item="${module.id}|${item.id}|${field.key}">
                    <option value="">直属于当前机构</option>
                    ${choices.map(choice =>`
                      <option value="${choice.id}" ${value === choice.id ? "selected" : ""}>
                        ${escapeHTML(choice.name || "未命名部门")}
                      </option>
                    `).join("")}
                  </select>
                </div>
              `;
            }

            return `
              <div class="field">
                <label>${escapeHTML(field.label)}</label>
                <input data-module-item="${module.id}|${item.id}|${field.key}" type="text" value="${escapeHTML(value)}">
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `).join("")}

    <button class="add-row" data-add-item="${module.id}">＋ 添加${escapeHTML(module.kind)}</button>
  `;

}

function renderModuleHTML(module){

  let body = "";


  switch(module.kind){

    case "职务":
      body =
        renderJobModule(module);
      break;

    case "经历":
      body =
        renderExperienceModule(module);
      break;

    case "关系":
      body =
        renderRelationModule(module);
      break;

    case "时间轴":
      body =
        renderTimelineModule(module);
      break;

    case "地图":
      body =
        renderMapModule(module);
      break;

    case "图片":
      body =
        renderImageModule(module);
      break;

    case "自定义":
      body =
        renderCustomModule(module);
      break;

    default:
      body = GENERIC_MODULE_SCHEMAS[module.kind]
        ? renderGenericModule(module)
        : "";
  }


  return `

    <section
      class="
        section
        module
        ${
          module.collapsed
          ? "collapsed"
          : ""
        }
      "
      data-module-id="${module.id}"
    >

      ${moduleHeaderHTML(module)}

      <div class="section-body">
        ${body}
      </div>

    </section>

  `;

}


/* =========================================================
   25. 职务模块
========================================================= */

function renderJobModule(module){

  return `

    ${
      module.items
      .map(
        (item,index)=>`

          <div class="list-item">

            <div class="list-item-head">

              <strong>
                职务 ${index + 1}
              </strong>

              <button
                class="icon-btn danger"
                data-remove-item="${module.id}|${item.id}"
              >
                ×
              </button>

            </div>


            <div class="field-grid">

              <div class="field">

                <label>
                  职务
                </label>

                <input
                  data-module-item="${module.id}|${item.id}|name"
                  type="text"
                  value="${escapeHTML(item.name || "")}"
                  placeholder="例如：副局长"
                >

              </div>


              <div class="field">

                <label>
                  所属组织
                </label>

                <select
                  data-module-item="${module.id}|${item.id}|orgCardId"
                >

                  <option value="">
                    不关联
                  </option>

                  ${
                    db.cards
                    .filter(
                      card =>
                        card.id !== currentCardId
                        &&
                        card.type === "组织"
                    )
                    .map(
                      card => `
                        <option
                          value="${card.id}"
                          ${
                            item.orgCardId === card.id
                            ? "selected"
                            : ""
                          }
                        >
                          ${escapeHTML(card.name)}
                        </option>
                      `
                    )
                    .join("")
                  }

                </select>

              </div>

              <div class="field full job-extra-text-field">
                <label>
                  <input
                    class="job-extra-label-input"
                    data-module-item="${module.id}|${item.id}|extraLabel"
                    type="text"
                    value="${escapeHTML(item.extraLabel || "编号")}"
                    aria-label="附加字段名称"
                  >
                </label>
                <input
                  data-module-item="${module.id}|${item.id}|extraValue"
                  type="text"
                  value="${escapeHTML(item.extraValue || "")}"
                  placeholder="填写${escapeHTML(item.extraLabel || "编号")}"
                >
              </div>

            </div>

          </div>

        `
      )
      .join("")
    }


    <button
      class="add-row"
      data-add-item="${module.id}"
    >
      ＋ 添加职务
    </button>

  `;

}


/* =========================================================
   26. 经历模块
========================================================= */

function timelineReferenceOptions(
  selected=""
){

  let html = "";


  db.cards.forEach(
    card =>{

      card.modules
      .filter(
        module =>
          module.kind === "时间轴"
      )
      .forEach(
        module =>{

          module.items.forEach(
            node =>{

              const ref =
                [
                  card.id,
                  module.id,
                  node.id
                ]
                .join("::");


              html += `

                <option
                  value="${ref}"
                  ${
                    ref === selected
                    ? "selected"
                    : ""
                  }
                >
                  ${escapeHTML(card.name)}
                  ·
                  ${escapeHTML(node.title || "未命名节点")}
                </option>

              `;

            }
          );

        }
      );

    }
  );


  return html;

}


function cardOptions(
  selected="",
  excludeCurrent=true
){

  return db.cards
    .filter(
      card =>
        !excludeCurrent
        ||
        card.id !== currentCardId
    )
    .map(
      card => `
        <option
          value="${card.id}"
          ${
            card.id === selected
            ? "selected"
            : ""
          }
        >
          ${escapeHTML(card.name)}
          ·
          ${escapeHTML(card.type)}
        </option>
      `
    )
    .join("");

}


function renderExperienceModule(module){

  return `

    ${
      module.items
      .map(
        (item,index)=>`

          <div class="list-item">

            <div class="list-item-head">

              <strong>
                经历 ${index + 1}
              </strong>

              <button
                class="icon-btn danger"
                data-remove-item="${module.id}|${item.id}"
              >
                ×
              </button>

            </div>


            <div class="field-grid">

              <div class="field">

                <label>
                  类型
                </label>

                <select
                  data-module-item="${module.id}|${item.id}|type"
                >

                  ${
                    EXPERIENCE_TYPES
                    .map(
                      type => `
                        <option
                          value="${type}"
                          ${
                            item.type === type
                            ? "selected"
                            : ""
                          }
                        >
                          ${type}
                        </option>
                      `
                    )
                    .join("")
                  }

                </select>

              </div>


              <div class="field">

                <label>
                  时间
                </label>

                <input
                  data-module-item="${module.id}|${item.id}|time"
                  type="text"
                  value="${escapeHTML(item.time || "")}"
                  placeholder="例如：2022—至今"
                >

              </div>


              <div class="field full">

                <label>
                  标题
                </label>

                <input
                  data-module-item="${module.id}|${item.id}|title"
                  type="text"
                  value="${escapeHTML(item.title || "")}"
                >

              </div>


              <div class="field">

                <label>
                  关联卡片
                </label>

                <select
                  data-module-item="${module.id}|${item.id}|relatedCardId"
                >

                  <option value="">
                    不关联
                  </option>

                  ${
                    cardOptions(
                      item.relatedCardId || ""
                    )
                  }

                </select>

              </div>


              <div class="field">

                <label>
                  关联时间轴节点
                </label>

                <select
                  data-module-item="${module.id}|${item.id}|timelineRef"
                >

                  <option value="">
                    不关联
                  </option>

                  ${
                    timelineReferenceOptions(
                      item.timelineRef || ""
                    )
                  }

                </select>

              </div>


              <div class="field full">

                <label>
                  内容
                </label>

                <textarea
                  data-module-item="${module.id}|${item.id}|content"
                >${escapeHTML(item.content || "")}</textarea>

              </div>

            </div>

          </div>

        `
      )
      .join("")
    }


    <button
      class="add-row"
      data-add-item="${module.id}"
    >
      ＋ 添加经历
    </button>

  `;

}


/* =========================================================
   27. 关系模块
========================================================= */

function relationsForCard(cardId){

  return db.relations.filter(
    relation =>
      relation.fromCardId === cardId
      || (
        relation.undirected !== false
        && relation.toCardId === cardId
      )
  );

}


function renderRelationModule(module){

  const relations =
    relationsForCard(
      currentCardId
    );


  return `

    ${
      relations.length

      ? `

        <table class="relation-table">

          <thead>

            <tr>
              <th>对象</th>
              <th>关系</th>
              <th>备注</th>
              <th></th>
            </tr>

          </thead>

          <tbody>

            ${
              relations
              .map(
                relation =>{

                  const isOutgoing =
                    relation.fromCardId === currentCardId;

                  const relatedCardId =
                    isOutgoing
                    ? relation.toCardId
                    : relation.fromCardId;

                  const target =
                    getCard(
                      relatedCardId
                    );

                  return `

                    <tr>

                      <td>

                        <button
                          class="relation-name-btn"
                          data-open-related-card="${relatedCardId}"
                        >
                          ${
                            escapeHTML(
                              target
                              ?
                              target.name
                              :
                              "已删除卡片"
                            )
                          }
                        </button>

                      </td>

                      <td>
                        ${escapeHTML(relation.relation || "")}
                      </td>

                      <td>
                        ${escapeHTML(relation.note || "")}
                      </td>

                      <td>

                        <button
                          class="icon-btn"
                          data-edit-relation="${relation.id}"
                        >
                          编辑
                        </button>

                        <button
                          class="icon-btn danger"
                          data-delete-relation="${relation.id}"
                        >
                          ×
                        </button>

                      </td>

                    </tr>

                  `;

                }
              )
              .join("")
            }

          </tbody>

        </table>

      `

      : `
        <div class="empty">
          还没有关系。
        </div>
      `
    }


    <button
      class="add-row"
      data-add-relation="${module.id}"
    >
      ＋ 添加关系
    </button>

  `;

}


/* =========================================================
   28. 时间轴模块
========================================================= */

function renderTimelineModule(module){

  const currentCard = getCurrentCard();
  const isFirstTimelineModule = currentCard && (currentCard.modules || []).find(item => item.kind === "时间轴")?.id === module.id;
  const sharedItems = isFirstTimelineModule
    ? collectTimelineNodes().filter(item =>
        item.sourceCardId !== currentCard.id
        && (item.ownerCardIds || []).includes(currentCard.id)
      )
    : [];
  const sorted =
    [
      ...module.items.map(item => ({
        ...item,
        sourceCardId:currentCard.id,
        sourceModuleId:module.id,
        isLocalSource:true
      })),
      ...sharedItems.map(item => ({...item,isLocalSource:false}))
    ]
    .sort(
      (a,b)=>
        timelineSortValue(a.date)
        -
        timelineSortValue(b.date)
    );


  return `

    <div class="timeline">

      ${
        sorted
        .map(
          item =>`

            <div class="timeline-item">

              <div class="timeline-date">
                ${escapeHTML(item.date || "未填写时间")}
              </div>

              <div class="timeline-title">
                ${escapeHTML(item.title || "未命名节点")}
              </div>

              <div class="timeline-preview">
                ${escapeHTML(item.content || "")}
              </div>

              ${
                item.tags

                ? `
                  <div
                    class="tag-list"
                    style="margin-top:7px"
                  >
                    ${
                      splitTags(item.tags)
                      .map(
                        tag => `
                          <span class="tag">
                            ${escapeHTML(tag)}
                          </span>
                        `
                      )
                      .join("")
                    }
                  </div>
                `

                : ""
              }

              <div class="timeline-actions">

                <button
                  class="btn small"
                  data-edit-timeline="${item.sourceCardId}|${item.sourceModuleId}|${item.id}"
                >
                  编辑
                </button>

                ${item.isLocalSource ? `
                  <button
                    class="icon-btn danger"
                    data-remove-item="${module.id}|${item.id}"
                  >
                    ×
                  </button>
                ` : ""}

              </div>

            </div>

          `
        )
        .join("")
      }

    </div>


    <button
      class="add-row"
      data-add-item="${module.id}"
    >
      ＋ 添加时间节点
    </button>

  `;

}


/* =========================================================
   29. 地图模块
========================================================= */

function renderMapModule(module){

  return `

    <div class="map-placeholder">

      地图生成器将在后续独立接入

    </div>


    ${
      module.items
      .map(
        (item,index)=>`

          <div class="list-item">

            <div class="list-item-head">

              <strong>
                位置 ${index + 1}
              </strong>

              <button
                class="icon-btn danger"
                data-remove-item="${module.id}|${item.id}"
              >
                ×
              </button>

            </div>


            <div class="field-grid">

              <div class="field">

                <label>
                  模式
                </label>

                <select
                  data-module-item="${module.id}|${item.id}|mode"
                >

                  <option
                    value="card"
                    ${
                      item.mode !== "custom"
                      ? "selected"
                      : ""
                    }
                  >
                    关联已有地点
                  </option>

                  <option
                    value="custom"
                    ${
                      item.mode === "custom"
                      ? "selected"
                      : ""
                    }
                  >
                    自定义地图位置
                  </option>

                </select>

              </div>


              ${
                item.mode !== "custom"

                ? `

                  <div class="field">

                    <label>
                      地点卡片
                    </label>

                    <select
                      data-module-item="${module.id}|${item.id}|placeCardId"
                    >

                      <option value="">
                        未选择
                      </option>

                      ${
                        db.cards
                        .filter(
                          card =>
                            card.type === "地区"
                        )
                        .map(
                          card => `
                            <option
                              value="${card.id}"
                              ${
                                item.placeCardId
                                ===
                                card.id
                                ? "selected"
                                : ""
                              }
                            >
                              ${escapeHTML(card.name)}
                            </option>
                          `
                        )
                        .join("")
                      }

                    </select>

                  </div>

                `

                : `

                  <div class="field">

                    <label>
                      位置名称
                    </label>

                    <input
                      data-module-item="${module.id}|${item.id}|customName"
                      type="text"
                      value="${escapeHTML(item.customName || "")}"
                    >

                  </div>


                  <div class="field">

                    <label>
                      X
                    </label>

                    <input
                      data-module-item="${module.id}|${item.id}|x"
                      type="text"
                      value="${escapeHTML(item.x || "")}"
                    >

                  </div>


                  <div class="field">

                    <label>
                      Y
                    </label>

                    <input
                      data-module-item="${module.id}|${item.id}|y"
                      type="text"
                      value="${escapeHTML(item.y || "")}"
                    >

                  </div>

                `
              }


              <div class="field full">

                <label>
                  备注
                </label>

                <textarea
                  data-module-item="${module.id}|${item.id}|note"
                >${escapeHTML(item.note || "")}</textarea>

              </div>

            </div>

          </div>

        `
      )
      .join("")
    }


    <button
      class="add-row"
      data-add-item="${module.id}"
    >
      ＋ 添加位置
    </button>

  `;

}


/* =========================================================
   30. 图片模块
========================================================= */

function renderImageModule(module){

  return `

    <div class="photo-group-desc">

      <label>
        图片组整体说明
      </label>

      <textarea
        data-module-field="${module.id}|description"
        placeholder="可以留空"
      >${escapeHTML(module.description || "")}</textarea>

    </div>


    <div class="upload-zone">

      <label
        for="photoUpload-${module.id}"
        style="cursor:pointer"
      >
        点击选择图片
      </label>

      <input
        id="photoUpload-${module.id}"
        type="file"
        accept="image/*"
        multiple
        data-photo-upload="${module.id}"
      >

      <div class="small" style="margin-top:8px">
        当前先保存本地预览；
        后续接图床后改为云端地址。
      </div>

    </div>


    <div class="photo-grid">

      ${
        module.items
        .map(
          image =>`

            <div class="photo-card">

              <img
                src="${escapeHTML(image.src || "")}"
                alt=""
              >

              <div class="photo-body">

                <input
                  data-module-item="${module.id}|${image.id}|name"
                  type="text"
                  value="${escapeHTML(image.name || "")}"
                  placeholder="图片名称"
                >

                <textarea
                  data-module-item="${module.id}|${image.id}|note"
                  placeholder="图片说明"
                >${escapeHTML(image.note || "")}</textarea>

                <button
                  class="icon-btn danger"
                  data-remove-item="${module.id}|${image.id}"
                >
                  删除
                </button>

              </div>

            </div>

          `
        )
        .join("")
      }

    </div>

  `;

}


/* =========================================================
   31. 自定义模块
========================================================= */

function renderCustomModule(module){

  return `

    ${
      module.items
      .map(
        item =>
          renderCustomItem(
            module,
            item
          )
      )
      .join("")
    }


    <button
      class="add-row"
      data-add-custom-content="${module.id}"
    >
      ＋ 添加内容
    </button>

  `;

}


function renderCustomItem(module,item){

  if(item.type === "文字"){

    return `

      <div class="custom-content-item">

        <div class="list-item-head">

          <strong>
            文字
          </strong>

          <button
            class="icon-btn danger"
            data-remove-item="${module.id}|${item.id}"
          >
            ×
          </button>

        </div>

        <textarea
          data-module-item="${module.id}|${item.id}|content"
        >${escapeHTML(item.content || "")}</textarea>

      </div>

    `;

  }


  if(item.type === "链接"){

    return `

      <div class="custom-content-item">

        <div class="list-item-head">

          <strong>
            链接
          </strong>

          <button
            class="icon-btn danger"
            data-remove-item="${module.id}|${item.id}"
          >
            ×
          </button>

        </div>


        <div class="field-grid">

          <div class="field">

            <label>
              名称
            </label>

            <input
              data-module-item="${module.id}|${item.id}|name"
              type="text"
              value="${escapeHTML(item.name || "")}"
            >

          </div>


          <div class="field">

            <label>
              地址
            </label>

            <input
              data-module-item="${module.id}|${item.id}|url"
              type="url"
              value="${escapeHTML(item.url || "")}"
            >

          </div>

        </div>

      </div>

    `;

  }


  if(item.type === "引用卡片"){

    return `

      <div class="custom-content-item">

        <div class="list-item-head">

          <strong>
            引用卡片
          </strong>

          <button
            class="icon-btn danger"
            data-remove-item="${module.id}|${item.id}"
          >
            ×
          </button>

        </div>


        <select
          data-module-item="${module.id}|${item.id}|cardId"
        >

          <option value="">
            请选择
          </option>

          ${
            cardOptions(
              item.cardId || ""
            )
          }

        </select>

      </div>

    `;

  }


  if(item.type === "图片"){

    return `

      <div class="custom-content-item">

        <div class="list-item-head">

          <strong>
            图片
          </strong>

          <button
            class="icon-btn danger"
            data-remove-item="${module.id}|${item.id}"
          >
            ×
          </button>

        </div>


        ${
          item.src

          ? `
            <img
              src="${escapeHTML(item.src)}"
              alt=""
              style="
                width:100%;
                max-height:300px;
                object-fit:contain;
                border-radius:8px;
                margin-bottom:10px;
              "
            >
          `

          : ""
        }


        <div class="upload-zone">

          <label
            for="customImage-${item.id}"
            style="cursor:pointer"
          >
            ${
              item.src
              ? "替换图片"
              : "选择图片"
            }
          </label>

          <input
            id="customImage-${item.id}"
            type="file"
            accept="image/*"
            data-custom-image="${module.id}|${item.id}"
          >

        </div>

      </div>

    `;

  }


  if(
    item.type === "文件"
    ||
    item.type === "音频"
    ||
    item.type === "视频"
  ){

    return `

      <div class="file-card">

        <div class="list-item-head">

          <strong>
            ${escapeHTML(item.type)}
          </strong>

          <button
            class="icon-btn danger"
            data-remove-item="${module.id}|${item.id}"
          >
            ×
          </button>

        </div>


        <div class="file-title">

          ${
            escapeHTML(
              item.name
              ||
              "尚未选择文件"
            )
          }

        </div>


        ${
          item.size

          ? `
            <div class="file-meta">
              ${
                escapeHTML(
                  item.mime
                  ||
                  item.type
                )
              }
              ·
              ${fileSize(item.size)}
            </div>
          `

          : ""
        }


        <textarea
          data-module-item="${module.id}|${item.id}|note"
          placeholder="文件说明"
        >${escapeHTML(item.note || "")}</textarea>


        <div class="upload-zone">

          <label
            for="customFile-${item.id}"
            style="cursor:pointer"
          >
            选择${escapeHTML(item.type)}
          </label>

          <input
            id="customFile-${item.id}"
            type="file"
            data-custom-file="${module.id}|${item.id}"
          >

        </div>

      </div>

    `;

  }


  return "";

}


/* =========================================================
   32. 模块事件绑定
========================================================= */

function bindModuleEvents(){

  const card =
    getCurrentCard();

  const container =
    document.getElementById(
      "moduleContainer"
    );

  container.querySelectorAll("[data-module-more]").forEach(button =>{
    button.onclick = event =>{
      event.stopPropagation();
      const target = container.querySelector(`[data-module-menu="${button.dataset.moduleMore}"]`);
      container.querySelectorAll(".section-more-menu.open").forEach(menu =>{
        if(menu !== target){ menu.classList.remove("open"); }
      });
      target.classList.toggle("open");
    };
  });


  container
    .querySelectorAll(
      "[data-collapse-module]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          const module =
            getModule(
              card,
              button.dataset.collapseModule
            );

          module.collapsed =
            !module.collapsed;

          touchCard(card);

          renderModules();

        };

      }
    );


  container
    .querySelectorAll(
      "[data-rename-module]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          const module =
            getModule(
              card,
              button.dataset.renameModule
            );

          const name =
            prompt(
              "模块名称：",
              module.title
            );

          if(
            name !== null
            &&
            name.trim()
          ){

            module.title =
              name.trim();

            touchCard(card);

            renderModules();

          }

        };

      }
    );


  container
    .querySelectorAll(
      "[data-copy-module]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          copyModule(
            button.dataset.copyModule
          );

        };

      }
    );


  container
    .querySelectorAll(
      "[data-delete-module]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          deleteModule(
            button.dataset.deleteModule
          );

        };

      }
    );


  container
    .querySelectorAll(
      "[data-add-item]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          addModuleItem(
            button.dataset.addItem
          );

        };

      }
    );


  container
    .querySelectorAll(
      "[data-remove-item]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          const [
            moduleId,
            itemId
          ] =
            button.dataset.removeItem
            .split("|");

          removeModuleItem(
            moduleId,
            itemId
          );

        };

      }
    );


  container
    .querySelectorAll(
      "[data-module-item]"
    )
    .forEach(
      element =>{

        element.oninput =
        element.onchange =
          ()=>{

            const [
              moduleId,
              itemId,
              field
            ] =
              element.dataset.moduleItem
              .split("|");


            const module =
              getModule(
                card,
                moduleId
              );


            const item =
              module.items.find(
                item =>
                  item.id === itemId
              );


            if(!item){
              return;
            }


            item[field] =
              element.value;


            touchCard(card);


            if(
              module.kind === "地图"
              &&
              field === "mode"
            ){

              renderModules();

            }

          };

      }
    );


  container
    .querySelectorAll(
      "[data-module-field]"
    )
    .forEach(
      element =>{

        element.oninput = ()=>{

          const [
            moduleId,
            field
          ] =
            element.dataset.moduleField
            .split("|");


          const module =
            getModule(
              card,
              moduleId
            );


          module[field] =
            element.value;

          touchCard(card);

        };

      }
    );


  container
    .querySelectorAll(
      "[data-add-relation]"
    )
    .forEach(
      button =>{

        button.onclick =
          openAddRelationDrawer;

      }
    );


  container
    .querySelectorAll(
      "[data-edit-relation]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          openEditRelationDrawer(
            button.dataset.editRelation
          );

        };

      }
    );


  container
    .querySelectorAll(
      "[data-delete-relation]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          deleteRelation(
            button.dataset.deleteRelation
          );

        };

      }
    );


  container
    .querySelectorAll(
      "[data-open-related-card]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          const id =
            button.dataset.openRelatedCard;

          if(getCard(id)){

            openCardEditor(id);

          }

        };

      }
    );


  container
    .querySelectorAll(
      "[data-edit-timeline]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          const [
            sourceCardId,
            moduleId,
            nodeId
          ] =
            button.dataset.editTimeline
            .split("|");


          openTimelineNodeDrawer(
            moduleId,
            nodeId,
            sourceCardId
          );

        };

      }
    );


  container
    .querySelectorAll(
      "[data-photo-upload]"
    )
    .forEach(
      input =>{

        input.onchange = ()=>{

          handleImageModuleUpload(
            input
          );

        };

      }
    );


  container
    .querySelectorAll(
      "[data-add-custom-content]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          openCustomContentModal(
            button.dataset.addCustomContent
          );

        };

      }
    );


  container
    .querySelectorAll(
      "[data-custom-image]"
    )
    .forEach(
      input =>{

        input.onchange = ()=>{

          handleCustomImage(
            input
          );

        };

      }
    );


  container
    .querySelectorAll(
      "[data-custom-file]"
    )
    .forEach(
      input =>{

        input.onchange = ()=>{

          handleCustomFile(
            input
          );

        };

      }
    );


  bindModuleDragging();

}


/* =========================================================
   33. 添加模块条目
========================================================= */

function addModuleItem(moduleId){

  const card =
    getCurrentCard();

  const module =
    getModule(
      card,
      moduleId
    );


  if(!module){
    return;
  }


  if(module.kind === "职务"){

    module.items.push({

      id:uid(),

      name:"",

      orgCardId:"",

      extraLabel:"编号",

      extraValue:""

    });

  }


  if(module.kind === "经历"){

    module.items.push({

      id:uid(),

      type:"工作",

      time:"",

      title:"",

      content:"",

      relatedCardId:"",

      timelineRef:""

    });

  }


  if(GENERIC_MODULE_SCHEMAS[module.kind]){

    const item = {id:uid()};

    GENERIC_MODULE_SCHEMAS[module.kind].forEach(field =>{
      item[field.key] = "";
    });

    module.items.push(item);

  }


  if(module.kind === "时间轴"){

    openTimelineNodeDrawer(
      module.id,
      null
    );

    return;

  }


  if(module.kind === "地图"){

    module.items.push({

      id:uid(),

      mode:"card",

      placeCardId:"",

      customName:"",

      x:"",

      y:"",

      note:""

    });

  }


  touchCard(card);

  renderModules();

}


/* =========================================================
   34. 删除条目
========================================================= */

function removeModuleItem(
  moduleId,
  itemId
){

  const card =
    getCurrentCard();

  const module =
    getModule(
      card,
      moduleId
    );


  if(!module){
    return;
  }


  module.items =
    module.items.filter(
      item =>
        item.id !== itemId
    );


  touchCard(card);

  renderModules();

}


/* =========================================================
   35. 模块复制
========================================================= */

function copyModule(moduleId){

  const card =
    getCurrentCard();

  const module =
    getModule(
      card,
      moduleId
    );


  if(!module){
    return;
  }


  const copy =
    clone(module);


  copy.id =
    uid();

  copy.title =
    (
      module.title
      ||
      module.kind
    )
    +
    "（副本）";

  copy.collapsed =
    false;


  copy.items =
    (
      copy.items || []
    )
    .map(
      item => ({
        ...item,
        id:uid()
      })
    );


  const index =
    card.modules.findIndex(
      item =>
        item.id === moduleId
    );


  card.modules.splice(
    index + 1,
    0,
    copy
  );


  touchCard(card);

  renderModules();

  toast(
    "已复制模块"
  );

}


/* =========================================================
   36. 删除模块 + 撤销
========================================================= */

function deleteModule(moduleId){

  const card =
    getCurrentCard();

  const index =
    card.modules.findIndex(
      module =>
        module.id === moduleId
    );


  if(index < 0){
    return;
  }


  const [
    removed
  ] =
    card.modules.splice(
      index,
      1
    );


  lastDeletedModule = {

    cardId:card.id,

    index,

    module:removed

  };


  touchCard(card);

  renderModules();

  toast(
    `已删除「${removed.title || removed.kind}」模块`,
    true
  );

}


function undoDeleteModule(){

  if(!lastDeletedModule){
    return;
  }


  const card =
    getCard(
      lastDeletedModule.cardId
    );


  if(!card){
    return;
  }


  card.modules.splice(
    lastDeletedModule.index,
    0,
    lastDeletedModule.module
  );


  lastDeletedModule = null;

  touchCard(card);

  if(
    card.id === currentCardId
  ){

    renderModules();

  }


  toast(
    "已撤销删除"
  );

}


/* =========================================================
   37. 模块拖动
========================================================= */

function bindModuleDragging(){

  const container =
    document.getElementById(
      "moduleContainer"
    );


  container
    .querySelectorAll(
      "[data-drag-module]"
    )
    .forEach(
      header =>{

        header.addEventListener(
          "dragstart",
          event =>{

            draggedModuleId =
              header.dataset.dragModule;

            header
              .closest(".module")
              .classList.add(
                "dragging"
              );

            event.dataTransfer.effectAllowed =
              "move";

          }
        );


        header.addEventListener(
          "dragend",
          ()=>{

            draggedModuleId =
              null;

            container
              .querySelectorAll(
                ".module"
              )
              .forEach(
                module =>{

                  module.classList.remove(
                    "dragging",
                    "drop-target"
                  );

                }
              );

          }
        );


        header.addEventListener(
          "dragover",
          event =>{

            event.preventDefault();

            const target =
              header.closest(
                ".module"
              );

            if(
              target.dataset.moduleId
              !==
              draggedModuleId
            ){

              target.classList.add(
                "drop-target"
              );

            }

          }
        );


        header.addEventListener(
          "dragleave",
          ()=>{

            header
              .closest(".module")
              .classList.remove(
                "drop-target"
              );

          }
        );


        header.addEventListener(
          "drop",
          event =>{

            event.preventDefault();

            const targetId =
              header
              .closest(".module")
              .dataset.moduleId;


            reorderModules(
              draggedModuleId,
              targetId
            );

          }
        );

      }
    );

}


function reorderModules(
  fromId,
  toId
){

  if(
    !fromId
    ||
    !toId
    ||
    fromId === toId
  ){
    return;
  }


  const card =
    getCurrentCard();


  const from =
    card.modules.findIndex(
      module =>
        module.id === fromId
    );


  const to =
    card.modules.findIndex(
      module =>
        module.id === toId
    );


  if(
    from < 0
    ||
    to < 0
  ){
    return;
  }


  const [
    module
  ] =
    card.modules.splice(
      from,
      1
    );


  card.modules.splice(
    to,
    0,
    module
  );


  touchCard(card);

  renderModules();

}


/* =========================================================
   38. 关系添加
========================================================= */

function openAddRelationDrawer(){

  const source =
    getCurrentCard();


  const targets =
    db.cards.filter(
      card =>
        card.id !== source.id
    );


  if(!targets.length){

    toast(
      "目前没有其他卡片可以建立关系。"
    );

    return;

  }


  openDrawer(`

    <div class="drawer-head">

      <h3>
        添加关系
      </h3>

      <button
        class="icon-btn"
        data-close-drawer
      >
        ×
      </button>

    </div>


    <div class="field">

      <label>
        对象
      </label>

      <select id="relationTarget">

        ${
          targets
          .map(
            card => `
              <option value="${card.id}">
                ${escapeHTML(card.name)}
                ·
                ${escapeHTML(card.type)}
              </option>
            `
          )
          .join("")
        }

      </select>

    </div>


    <div
      class="field"
      style="margin-top:12px"
    >

      <label>
        当前卡片 → 对方
      </label>

      <input
        id="relationForward"
        type="text"
        placeholder="例如：姐姐、搭档、上司"
      >

    </div>


    <div
      class="field"
      style="margin-top:12px"
    >

      <label>
        备注
      </label>

      <textarea
        id="relationNote"
        placeholder="可选"
      ></textarea>

    </div>


    <div
      style="
        margin-top:14px;
        padding:12px;
        border:1px solid var(--line);
        border-radius:9px;
      "
    >

      <label
        style="
          display:flex;
          align-items:center;
          gap:8px;
          color:var(--text);
        "
      >

        <input
          id="createReverseRelation"
          type="checkbox"
          checked
          style="width:auto"
        >

        同时为对方添加反向关系

      </label>


      <div
        id="reverseRelationWrap"
        class="field"
        style="margin-top:12px"
      >

        <label>
          反向关系
        </label>

        <input
          id="relationReverse"
          type="text"
          placeholder="系统会尽量自动建议"
        >

      </div>

    </div>


    <div class="drawer-actions">

      <button
        class="btn"
        data-close-drawer
      >
        取消
      </button>

      <button
        id="saveNewRelation"
        class="btn primary"
      >
        添加关系
      </button>

    </div>

  `);


  const forward =
    document.getElementById(
      "relationForward"
    );

  const reverse =
    document.getElementById(
      "relationReverse"
    );

  const reverseCheck =
    document.getElementById(
      "createReverseRelation"
    );

  const reverseWrap =
    document.getElementById(
      "reverseRelationWrap"
    );


  forward.oninput = ()=>{

    const word =
      forward.value.trim();

    reverse.value =
      RELATION_REVERSE_MAP[
        word
      ]
      || "";

  };


  reverseCheck.onchange = ()=>{

    reverseWrap.classList.toggle(
      "hidden",
      !reverseCheck.checked
    );

  };


  document.getElementById(
    "saveNewRelation"
  ).onclick = ()=>{

    const toCardId =
      document.getElementById(
        "relationTarget"
      ).value;

    const forwardRelation =
      forward.value.trim();

    const note =
      document.getElementById(
        "relationNote"
      ).value.trim();


    if(
      !toCardId
      ||
      !forwardRelation
    ){

      toast(
        "请填写关系对象和关系性质。"
      );

      return;

    }


    const pairId =
      uid();


    db.relations.push({

      id:uid(),

      pairId,

      fromCardId:
        source.id,

      toCardId,

      relation:
        forwardRelation,

      note,

      undirected:false,

      createdAt:
        Date.now()

    });


    if(
      reverseCheck.checked
    ){

      const reverseRelation =
        reverse.value.trim();


      if(reverseRelation){

        db.relations.push({

          id:uid(),

          pairId,

          fromCardId:
            toCardId,

          toCardId:
            source.id,

          relation:
            reverseRelation,

          note:"",

          undirected:false,

          createdAt:
            Date.now()

        });

      }

    }


    saveDB();

    closeDrawer();

    renderModules();

    toast(
      "关系已添加"
    );

  };

}


/* =========================================================
   39. 编辑关系
========================================================= */

function openEditRelationDrawer(
  relationId
){

  const relation =
    db.relations.find(
      item =>
        item.id === relationId
    );


  if(!relation){
    return;
  }


  const target =
    getCard(
      relation.toCardId
    );

  const sourceCard = getCard(relation.fromCardId);


  openDrawer(`

    <div class="drawer-head">

      <h3>
        编辑关系
      </h3>

      <button
        class="icon-btn"
        data-close-drawer
      >
        ×
      </button>

    </div>


    <div class="field">

      <label>
        对象
      </label>

      <input
        type="text"
        value="${escapeHTML(target ? target.name : "已删除卡片")}"
        disabled
      >

    </div>

    <div class="field" style="margin-top:12px">
      <label>关系方向</label>
      <select id="editRelationDirection">
        <option value="both" ${relation.undirected !== false ? "selected" : ""}>${escapeHTML(sourceCard?.name || "起点")} ↔ ${escapeHTML(target?.name || "终点")}（双向）</option>
        <option value="keep" ${relation.undirected === false ? "selected" : ""}>${escapeHTML(sourceCard?.name || "起点")} → ${escapeHTML(target?.name || "终点")}（单向）</option>
        <option value="reverse">${escapeHTML(target?.name || "终点")} → ${escapeHTML(sourceCard?.name || "起点")}</option>
      </select>
    </div>


    <div
      class="field"
      style="margin-top:12px"
    >

      <label>
        关系
      </label>

      <input
        id="editRelationWord"
        type="text"
        value="${escapeHTML(relation.relation || "")}"
      >

    </div>


    <div
      class="field"
      style="margin-top:12px"
    >

      <label>
        备注
      </label>

      <textarea id="editRelationNote">${escapeHTML(relation.note || "")}</textarea>

    </div>


    <div class="drawer-actions">

      <button
        class="btn"
        data-close-drawer
      >
        取消
      </button>

      <button
        id="saveEditedRelation"
        class="btn primary"
      >
        保存
      </button>

    </div>

  `);


  document.getElementById(
    "saveEditedRelation"
  ).onclick = ()=>{

    const direction = document.getElementById("editRelationDirection").value;
    if(direction === "reverse"){
      const oldFrom = relation.fromCardId;
      relation.fromCardId = relation.toCardId;
      relation.toCardId = oldFrom;
    }
    relation.undirected = direction === "both";

    relation.relation =
      document.getElementById(
        "editRelationWord"
      )
      .value
      .trim();


    relation.note =
      document.getElementById(
        "editRelationNote"
      ).value;


    saveDB();

    closeDrawer();

    if(currentView === "relations"){
      closeRelationDetail();
      initRelationNetwork();
    }else{
      renderModules();
    }

    toast(
      "关系已保存"
    );

  };

}


function openInferredRelationEditor(relation){
  const source = getCard(relation.fromCardId);
  const target = getCard(relation.toCardId);
  const baseId = relation.id.replace(/:reverse$/,"");
  const current = db.settings.networkRelationOverrides?.[baseId] || {};

  openDrawer(`
    <div class="drawer-head"><h3>修改关系</h3><button class="icon-btn" data-close-drawer>×</button></div>
    <div class="field"><label>关系名称</label><input id="autoRelationLabel" value="${escapeHTML(relation.relation || "关系")}"></div>
    <div class="field" style="margin-top:12px">
      <label>方向</label>
      <select id="autoRelationDirection">
        <option value="keep" ${!current.bidirectional ? "selected" : ""}>${escapeHTML(source?.name || "起点")} → ${escapeHTML(target?.name || "终点")}</option>
        <option value="flip">${escapeHTML(target?.name || "终点")} → ${escapeHTML(source?.name || "起点")}</option>
        <option value="both" ${current.bidirectional ? "selected" : ""}>${escapeHTML(source?.name || "起点")} ↔ ${escapeHTML(target?.name || "终点")}</option>
      </select>
    </div>
    <div class="drawer-actions"><button class="btn" data-close-drawer>取消</button><button id="saveAutoRelation" class="btn primary">保存</button></div>
  `);

  document.getElementById("saveAutoRelation").onclick = ()=>{
    const direction = document.getElementById("autoRelationDirection").value;
    db.settings.networkRelationOverrides = db.settings.networkRelationOverrides || {};
    db.settings.networkRelationOverrides[baseId] = {
      label:document.getElementById("autoRelationLabel").value.trim() || "关系",
      reverse:direction === "flip" ? !Boolean(current.reverse) : Boolean(current.reverse),
      bidirectional:direction === "both"
    };
    saveDB();
    closeDrawer();
    closeRelationDetail();
    initRelationNetwork();
    toast("关系已修改");
  };
}


/* =========================================================
   40. 删除关系
========================================================= */

function deleteRelation(
  relationId
){

  db.relations =
    db.relations.filter(
      relation =>
        relation.id !== relationId
    );


  saveDB();

  renderModules();

}


/* =========================================================
   41. 时间轴节点 Drawer
========================================================= */

function openTimelineNodeDrawer(
  moduleId,
  nodeId,
  sourceCardId = null,
  initialOwnerCardIds = null,
  globalCreate = false
){

  const card = globalCreate
    ? null
    : sourceCardId
      ? getCard(sourceCardId)
      : getCurrentCard();


  if(!globalCreate && !card){
    return;
  }

  const module = globalCreate
    ? null
    : getModule(card,moduleId);


  if(!globalCreate && !module){
    return;
  }


  const existing =
    nodeId
    ?
    module.items.find(
      item =>
        item.id === nodeId
    )
    :
    null;


  const node =
    existing
    ?
    clone(existing)
    :
    {

      id:uid(),

      date:"",

      title:"",

      content:"",

      tags:"",

      relatedCardIds:[],

      ownerCardIds:Array.isArray(initialOwnerCardIds) && initialOwnerCardIds.length
        ? [...initialOwnerCardIds]
        : card
          ? [card.id]
          : []

    };


  openDrawer(`

    <div class="drawer-head">

      <h3>
        ${
          existing
          ? "编辑时间节点"
          : "新建时间节点"
        }
      </h3>

      <button
        class="icon-btn"
        data-close-drawer
      >
        ×
      </button>

    </div>


    <div class="field">

      <label>
        时间
      </label>

      <input
        id="timelineNodeDate"
        type="text"
        value="${escapeHTML(node.date || "")}"
        placeholder="例如：2025 / 2025.06 / 2025.06.18"
      >

    </div>


    <div
      class="field"
      style="margin-top:12px"
    >

      <label>
        标题
      </label>

      <input
        id="timelineNodeTitle"
        type="text"
        value="${escapeHTML(node.title || "")}"
      >

    </div>


    <div
      class="field"
      style="margin-top:12px"
    >

      <label>
        内容
      </label>

      <textarea
        id="timelineNodeContent"
        style="min-height:170px"
      >${escapeHTML(node.content || "")}</textarea>

    </div>


    <div
      class="field"
      style="margin-top:12px"
    >

      <label>
        标签
      </label>

      <input
        id="timelineNodeTags"
        type="text"
        value="${escapeHTML(node.tags || "")}"
        placeholder="多个标签用逗号分隔"
      >

    </div>


    <div
      class="field"
      style="margin-top:12px"
    >

      <label>
        归属卡片
      </label>

      <div id="timelineOwnerCards" class="tag-list" style="margin-bottom:8px"></div>

      <div class="inline-row">

        <select id="timelineOwnerSelect">

          <option value="">
            选择已有卡片
          </option>

          ${cardOptions("",false)}

        </select>

        <button id="addTimelineOwner" class="btn">
          添加
        </button>

      </div>

      <div class="field-help">至少选择一张。节点只保存一份，并同时显示在每张归属卡片的时间轴中。</div>

    </div>


    <div
      class="field"
      style="margin-top:12px"
    >

      <label>
        引用卡片
      </label>

      <div
        id="timelineRelatedCards"
        class="tag-list"
        style="margin-bottom:8px"
      ></div>


      <div class="inline-row">

        <select id="timelineRelatedSelect">

          <option value="">
            选择人物、地点、组织或其他卡片
          </option>

          ${
            cardOptions(
              "",
              false
            )
          }

        </select>

        <button
          id="addTimelineRelated"
          class="btn"
        >
          添加
        </button>

      </div>

      <div class="field-help">引用只表示该事件涉及这些对象，方便建立联系和跳转，不会写入它们的时间轴。</div>

    </div>


    <div class="drawer-actions">

      <button
        class="btn"
        data-close-drawer
      >
        取消
      </button>

      <button
        id="saveTimelineNode"
        class="btn primary"
      >
        保存节点
      </button>

    </div>

  `);


  node.relatedCardIds =
    node.relatedCardIds || [];

  node.ownerCardIds = Array.from(new Set([
    ...(node.ownerCardIds || []),
    ...(card && !(node.ownerCardIds || []).length ? [card.id] : []),
    ...(Array.isArray(initialOwnerCardIds) ? initialOwnerCardIds : [])
  ]));


  let draggedOwnerId = null;

  function renderOwners(){
    const box = document.getElementById("timelineOwnerCards");
    box.innerHTML = node.ownerCardIds.map(id => {
      const owner = getCard(id);
      if(!owner){ return ""; }
      return `<span class="tag" draggable="true" data-timeline-owner-id="${id}" title="拖动调整顺序" style="cursor:grab">${escapeHTML(owner.name)}<button data-remove-timeline-owner="${id}" style="margin-left:4px;border:0;background:none;color:inherit;cursor:pointer">×</button></span>`;
    }).join("");
    box.querySelectorAll("[data-remove-timeline-owner]").forEach(button => {
      button.onclick = ()=>{
        node.ownerCardIds = node.ownerCardIds.filter(id => id !== button.dataset.removeTimelineOwner);
        renderOwners();
      };
    });
    box.querySelectorAll("[data-timeline-owner-id]").forEach(tag => {
      tag.ondragstart = event => {
        draggedOwnerId = tag.dataset.timelineOwnerId;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain",draggedOwnerId);
        tag.style.opacity = ".45";
      };
      tag.ondragover = event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      };
      tag.ondrop = event => {
        event.preventDefault();
        const sourceId = draggedOwnerId || event.dataTransfer.getData("text/plain");
        const targetId = tag.dataset.timelineOwnerId;
        if(!sourceId || sourceId === targetId){ return; }
        const next = node.ownerCardIds.filter(id => id !== sourceId);
        const targetIndex = next.indexOf(targetId);
        next.splice(targetIndex < 0 ? next.length : targetIndex,0,sourceId);
        node.ownerCardIds = next;
        renderOwners();
      };
      tag.ondragend = () => {
        draggedOwnerId = null;
        tag.style.opacity = "";
      };
    });
  }


  document.getElementById("addTimelineOwner").onclick = ()=>{
    const select = document.getElementById("timelineOwnerSelect");
    const id = select.value;
    if(id && !node.ownerCardIds.includes(id)){
      node.ownerCardIds.push(id);
      renderOwners();
      select.value = "";
    }
  };


  function renderRelated(){

    const box =
      document.getElementById(
        "timelineRelatedCards"
      );


    box.innerHTML =
      node.relatedCardIds
      .map(
        id =>{

          const card =
            getCard(id);

          if(!card){
            return "";
          }

          return `
            <span class="tag">

              ${escapeHTML(card.name)}

              <button
                data-remove-related="${id}"
                style="
                  margin-left:4px;
                  border:0;
                  background:none;
                  color:inherit;
                  cursor:pointer;
                "
              >
                ×
              </button>

            </span>
          `;

        }
      )
      .join("");


    box
      .querySelectorAll(
        "[data-remove-related]"
      )
      .forEach(
        button =>{

          button.onclick = ()=>{

            node.relatedCardIds =
              node.relatedCardIds.filter(
                id =>
                  id !==
                  button.dataset.removeRelated
              );

            renderRelated();

          };

        }
      );

  }


  document.getElementById(
    "addTimelineRelated"
  ).onclick = ()=>{

    const select = document.getElementById("timelineRelatedSelect");
    const id = select.value;

    if(
      id
      &&
      !node.relatedCardIds.includes(id)
    ){

      node.relatedCardIds.push(
        id
      );

      renderRelated();
      select.value = "";

    }

  };


  document.getElementById(
    "saveTimelineNode"
  ).onclick = ()=>{

    node.date =
      document.getElementById(
        "timelineNodeDate"
      ).value.trim();

    node.title =
      document.getElementById(
        "timelineNodeTitle"
      ).value.trim();

    node.content =
      document.getElementById(
        "timelineNodeContent"
      ).value;

    node.tags =
      document.getElementById(
        "timelineNodeTags"
      ).value;


    if(
      !node.title
    ){

      toast(
        "请填写时间节点标题。"
      );

      return;

    }

    node.ownerCardIds = node.ownerCardIds.filter(id => Boolean(getCard(id)));

    if(!node.ownerCardIds.length){
      toast("请至少添加一张归属卡片。");
      return;
    }


    let savedCard;

    if(existing && card && !node.ownerCardIds.includes(card.id)){
      module.items = module.items.filter(item => item.id !== existing.id);
      const targetCard = getCard(node.ownerCardIds[0]);
      ensureTimelineModule(targetCard).items.push(node);
      touchCard(card);
      savedCard = targetCard;
    }else if(existing){
      Object.assign(existing,node);
      savedCard = card;
    }else{
      const targetCard = getCard(node.ownerCardIds[0]);
      const targetModule = targetCard === card && module ? module : ensureTimelineModule(targetCard);
      targetModule.items.push(node);
      savedCard = targetCard;
    }

    touchCard(savedCard);

    closeDrawer();

    if(currentView === "timeline"){
      renderTimelineFilters();
      renderGlobalTimeline();
    }else{
      renderModules();
    }

    refreshGlobalSelectors();

    toast(
      "时间节点已保存"
    );

  };


  renderRelated();

  renderOwners();

}


/* =========================================================
   42. 图片模块上传
========================================================= */

function handleImageModuleUpload(
  input
){

  const card =
    getCurrentCard();

  const module =
    getModule(
      card,
      input.dataset.photoUpload
    );


  const files =
    Array.from(
      input.files
    );


  files.forEach(
    file =>{

      fileToDataURL(
        file
      )
      .then(
        src =>{

          module.items.push({

            id:uid(),

            src,

            cloudUrl:"",

            name:
              file.name
              .replace(
                /\.[^.]+$/,
                ""
              ),

            note:""

          });


          touchCard(card);

          renderModules();

        }
      );

    }
  );


  input.value = "";

}


/* =========================================================
   43. 自定义内容 Modal
========================================================= */

function openCustomContentModal(
  moduleId
){

  const modal =
    document.getElementById(
      "modal"
    );


  const options = [
    "文字",
    "图片",
    "文件",
    "音频",
    "视频",
    "链接",
    "引用卡片"
  ];


  modal.innerHTML = `

    <div class="modal-head">

      <h3>
        添加内容
      </h3>

      <button
        class="icon-btn"
        data-close-modal
      >
        ×
      </button>

    </div>


    <div
      style="
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:8px;
      "
    >

      ${
        options
        .map(
          type => `
            <button
              class="btn"
              data-custom-type="${type}"
              style="
                min-height:48px;
                text-align:left;
              "
            >
              ${type}
            </button>
          `
        )
        .join("")
      }

    </div>

  `;


  openModal();


  modal
    .querySelectorAll(
      "[data-custom-type]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          const card =
            getCurrentCard();

          const module =
            getModule(
              card,
              moduleId
            );


          module.items.push({

            id:uid(),

            type:
              button.dataset.customType,

            content:"",

            name:"",

            url:"",

            cardId:"",

            src:"",

            note:"",

            size:0,

            mime:""

          });


          touchCard(card);

          closeModal();

          renderModules();

        };

      }
    );

}


/* =========================================================
   44. 自定义图片
========================================================= */

function handleCustomImage(
  input
){

  const [
    moduleId,
    itemId
  ] =
    input.dataset.customImage
    .split("|");


  const card =
    getCurrentCard();

  const module =
    getModule(
      card,
      moduleId
    );

  const item =
    module.items.find(
      item =>
        item.id === itemId
    );


  const file =
    input.files[0];


  if(!file){
    return;
  }


  fileToDataURL(
    file
  )
  .then(
    src =>{

      item.src =
        src;

      item.name =
        file.name;

      touchCard(card);

      renderModules();

    }
  );

}


/* =========================================================
   45. 自定义文件
========================================================= */

function handleCustomFile(
  input
){

  const [
    moduleId,
    itemId
  ] =
    input.dataset.customFile
    .split("|");


  const card =
    getCurrentCard();

  const module =
    getModule(
      card,
      moduleId
    );

  const item =
    module.items.find(
      item =>
        item.id === itemId
    );


  const file =
    input.files[0];


  if(!file){
    return;
  }


  item.name =
    file.name;

  item.mime =
    file.type;

  item.size =
    file.size;


  /*
    V1 不把大型文件本体塞进 localStorage。
    后续云端版本会在这里上传文件，
    然后把返回的 URL 写进 item.url。
  */

  item.url =
    "";


  touchCard(card);

  renderModules();

  toast(
    `已记录文件「${file.name}」`
  );

}


/* =========================================================
   46. 删除卡片
========================================================= */

function countCardReferences(
  cardId
){

  let count = 0;


  db.relations.forEach(
    relation =>{

      if(
        relation.fromCardId === cardId
        ||
        relation.toCardId === cardId
      ){
        count++;
      }

    }
  );


  db.cards.forEach(
    card =>{

      if(
        card.basic?.birthplaceCardId
        ===
        cardId
      ){
        count++;
      }

      if(
        card.basic?.parentOrgCardId
        ===
        cardId
      ){
        count++;
      }

      if(card.basic?.locationCardId === cardId){ count++; }
      if(card.basic?.parentRegionCardId === cardId){ count++; }


      card.modules.forEach(
        module =>{

          module.items.forEach(
            item =>{

              [
                "orgCardId",
                "relatedCardId",
                "placeCardId",
                "founderCardId",
                "leaderCardId",
                "departmentCardId",
                "eventCardId",
                "cardId"
              ]
              .forEach(
                key =>{

                  if(
                    item[key]
                    ===
                    cardId
                  ){
                    count++;
                  }

                }
              );


              if(
                Array.isArray(
                  item.relatedCardIds
                )
                &&
                item.relatedCardIds.includes(
                  cardId
                )
              ){
                count++;
              }

              if(
                card.id !== cardId
                && Array.isArray(item.ownerCardIds)
                && item.ownerCardIds.includes(cardId)
              ){
                count++;
              }

            }
          );

        }
      );

    }
  );


  return count;

}


function openDeleteCardDrawer(){

  const card =
    getCurrentCard();

  const count =
    countCardReferences(
      card.id
    );


  openDrawer(`

    <div class="drawer-head">

      <h3>
        删除卡片
      </h3>

      <button
        class="icon-btn"
        data-close-drawer
      >
        ×
      </button>

    </div>


    <p
      style="
        color:var(--muted);
        line-height:1.8;
      "
    >

      你正在删除

      <strong style="color:var(--text)">
        「${escapeHTML(card.name)}」
      </strong>。

      <br><br>

      当前检测到

      <strong style="color:var(--text)">
        ${count}
      </strong>

      处结构引用。

      删除后，
      相关关系和指向这张卡片的引用会被清理。

    </p>


    <div class="drawer-actions">

      <button
        class="btn"
        data-close-drawer
      >
        取消
      </button>

      <button
        id="confirmDeleteCard"
        class="btn danger"
      >
        确认删除
      </button>

    </div>

  `);


  document.getElementById(
    "confirmDeleteCard"
  ).onclick = ()=>{

    deleteCurrentCard();

  };

}


function deleteCurrentCard(){

  const card =
    getCurrentCard();

  const id =
    card.id;


  db.cards =
    db.cards.filter(
      item =>
        item.id !== id
    );


  db.relations =
    db.relations.filter(
      relation =>
        relation.fromCardId !== id
        &&
        relation.toCardId !== id
    );


  db.cards.forEach(
    other =>{

      if(
        other.basic?.birthplaceCardId
        ===
        id
      ){
        other.basic.birthplaceCardId =
          "";
      }

      if(
        other.basic?.parentOrgCardId
        ===
        id
      ){
        other.basic.parentOrgCardId =
          "";
      }

      if(other.basic?.locationCardId === id){ other.basic.locationCardId = ""; }
      if(other.basic?.parentRegionCardId === id){ other.basic.parentRegionCardId = ""; }


      other.modules.forEach(
        module =>{

          module.items.forEach(
            item =>{

              [
                "orgCardId",
                "relatedCardId",
                "placeCardId",
                "founderCardId",
                "leaderCardId",
                "departmentCardId",
                "eventCardId",
                "cardId"
              ]
              .forEach(
                key =>{

                  if(
                    item[key] === id
                  ){
                    item[key] = "";
                  }

                }
              );


              if(
                Array.isArray(
                  item.relatedCardIds
                )
              ){

                item.relatedCardIds =
                  item.relatedCardIds.filter(
                    cardId =>
                      cardId !== id
                  );

              }

              if(Array.isArray(item.ownerCardIds)){
                item.ownerCardIds = item.ownerCardIds.filter(cardId => cardId !== id);
              }

            }
          );

        }
      );

    }
  );


  saveDB();

  closeDrawer();

  currentCardId =
    null;

  refreshGlobalSelectors();

  switchView(
    "cards"
  );

  toast(
    `已删除「${card.name}」`
  );

}


/* =========================================================
   47. 时间排序
========================================================= */

function timelineSortValue(
  dateText=""
){

  const numbers =
    String(dateText)
    .match(/\d+/g);


  if(!numbers){
    return Number.MAX_SAFE_INTEGER;
  }


  const year =
    Number(numbers[0] || 0);

  const month =
    Number(numbers[1] || 1);

  const day =
    Number(numbers[2] || 1);


  return (
    year * 10000
    +
    month * 100
    +
    day
  );

}


function splitTags(text=""){

  return String(text)
    .split(/[，,\n]/)
    .map(
      item =>
        item.trim()
    )
    .filter(Boolean);

}


/* =========================================================
   48. 收集所有时间节点
========================================================= */

function collectTimelineNodes(){

  const nodes = [];


  db.cards.forEach(
    card =>{

      card.modules
      .filter(
        module =>
          module.kind === "时间轴"
      )
      .forEach(
        module =>{

          module.items.forEach(
            node =>{

              nodes.push({

                ...node,

                ownerCardIds:Array.from(new Set(
                  (node.ownerCardIds || []).length
                    ? node.ownerCardIds
                    : [card.id]
                )),

                sourceCardId:
                  card.id,

                sourceCardName:
                  card.name,

                sourceModuleId:
                  module.id,

                sourceModuleTitle:
                  module.title

              });

            }
          );

        }
      );

    }
  );


  return nodes;

}


/* =========================================================
   49. 全局时间轴
========================================================= */

function renderTimelineFilters(){

  const select =
    document.getElementById(
      "timelineCardFilter"
    );


  const value =
    select.value;


  select.innerHTML =
    `
      <option value="">
        全部卡片
      </option>
    `
    +
    db.cards
    .map(
      card => `
        <option
          value="${card.id}"
          ${
            card.id === value
            ? "selected"
            : ""
          }
        >
          ${escapeHTML(card.name)}
        </option>
      `
    )
    .join("");

}


function renderGlobalTimeline(){

  const container =
    document.getElementById(
      "globalTimeline"
    );

  const cardFilter =
    document.getElementById(
      "timelineCardFilter"
    ).value;

  const tagFilter =
    document.getElementById(
      "timelineTagFilter"
    )
    .value
    .trim()
    .toLowerCase();

  const mode =
    document.getElementById(
      "timelineLayoutMode"
    ).value;


  let nodes =
    collectTimelineNodes();


  if(cardFilter){

    nodes =
      nodes.filter(
        node =>
          (node.ownerCardIds || [node.sourceCardId]).includes(cardFilter)
          || (node.relatedCardIds || []).includes(cardFilter)
      );

  }


  if(tagFilter){

    nodes =
      nodes.filter(
        node =>
          splitTags(
            node.tags || ""
          )
          .some(
            tag =>
              tag
              .toLowerCase()
              .includes(
                tagFilter
              )
          )
      );

  }


  nodes.sort(
    (a,b)=>
      timelineSortValue(a.date)
      -
      timelineSortValue(b.date)
  );


  if(!nodes.length){

    container.innerHTML = `
      <div class="empty">
        还没有符合条件的时间节点。
      </div>
    `;

    closeTimelineDetail();

    return;

  }


  let previousTime = null;


  container.innerHTML =
    nodes
    .map(
      node =>{

        let spacing = 0;


        if(
          mode === "real"
        ){

          const current =
            timelineSortValue(
              node.date
            );


          if(
            previousTime !== null
            &&
            current
            <
            Number.MAX_SAFE_INTEGER
          ){

            const difference =
              Math.abs(
                current
                -
                previousTime
              );


            spacing =
              Math.min(
                90,
                Math.max(
                  0,
                  difference / 150
                )
              );

          }


          previousTime =
            current;

        }


        return `

          <div
            class="timeline-item"
            style="
              margin-top:${spacing}px;
              cursor:pointer;
            "
            data-global-timeline="${node.sourceCardId}|${node.sourceModuleId}|${node.id}"
          >

            <div class="timeline-date">

              ${escapeHTML(node.date || "未填写时间")}

              ·

              ${escapeHTML((node.ownerCardIds || [node.sourceCardId]).map(id => getCard(id)?.name).filter(Boolean).join("、") || node.sourceCardName)}

            </div>

            <div class="timeline-title">
              ${escapeHTML(node.title || "未命名节点")}
            </div>

            ${
              node.tags

              ? `
                <div
                  class="tag-list"
                  style="margin-top:7px"
                >
                  ${
                    splitTags(node.tags)
                    .map(
                      tag => `
                        <span class="tag">
                          ${escapeHTML(tag)}
                        </span>
                      `
                    )
                    .join("")
                  }
                </div>
              `

              : ""
            }

          </div>

        `;

      }
    )
    .join("");


  container
    .querySelectorAll(
      "[data-global-timeline]"
    )
    .forEach(
      element =>{

        element.onclick = ()=>{

          const [
            cardId,
            moduleId,
            nodeId
          ] =
            element.dataset.globalTimeline
            .split("|");


          openTimelineDetail(
            cardId,
            moduleId,
            nodeId
          );

        };

      }
    );

}


/* =========================================================
   50. 时间轴详情
========================================================= */

function openTimelineDetail(
  cardId,
  moduleId,
  nodeId
){

  const card =
    getCard(cardId);

  const module =
    getModule(
      card,
      moduleId
    );

  const node =
    module.items.find(
      item =>
        item.id === nodeId
    );


  if(!node){
    return;
  }


  const panel =
    document.getElementById(
      "timelineDetail"
    );


  panel.innerHTML = `

    <button
      id="closeTimelineDetail"
      class="icon-btn detail-close"
    >
      ×
    </button>


    <div class="small">
      ${escapeHTML(node.date || "未填写时间")}
    </div>


    <div class="detail-title">
      ${escapeHTML(node.title || "未命名节点")}
    </div>


    <div class="small">
      归属：
      ${escapeHTML((node.ownerCardIds || [card.id]).map(id => getCard(id)?.name).filter(Boolean).join("、"))}
      · 保存于 ${escapeHTML(card.name)} / ${escapeHTML(module.title)}
    </div>


    <div class="detail-section">

      <div class="detail-section-title">
        内容
      </div>

      <div
        style="
          line-height:1.8;
          white-space:pre-wrap;
        "
      >
        ${escapeHTML(node.content || "暂无内容")}
      </div>

    </div>


    ${
      node.tags

      ? `
        <div class="detail-section">

          <div class="detail-section-title">
            标签
          </div>

          <div class="tag-list">

            ${
              splitTags(node.tags)
              .map(
                tag => `
                  <span class="tag">
                    ${escapeHTML(tag)}
                  </span>
                `
              )
              .join("")
            }

          </div>

        </div>
      `

      : ""
    }


    <div class="detail-section">

      <div class="detail-section-title">
        相关卡片
      </div>

      <div
        style="
          display:grid;
          gap:6px;
        "
      >

        ${
          (
            node.relatedCardIds
            || []
          )
          .map(
            id =>{

              const related =
                getCard(id);

              if(!related){
                return "";
              }

              return `
                <button
                  class="btn small"
                  data-timeline-open-card="${id}"
                >
                  ${escapeHTML(related.name)}
                </button>
              `;

            }
          )
          .join("")
          ||
          `
            <span class="small">
              暂无关联卡片
            </span>
          `
        }

      </div>

    </div>


    <div class="detail-section">

      <div class="inline-row">
        <button id="timelineEditNode" class="btn primary" style="flex:1">编辑节点</button>
        <button id="timelineOpenSourceCard" class="btn" style="flex:1">打开<br>「${escapeHTML(card.name)}」</button>
      </div>

      <button id="timelineDeleteNode" class="btn danger" style="width:100%;margin-top:9px">删除节点</button>

    </div>

  `;


  panel.classList.add(
    "open"
  );


  document.getElementById(
    "closeTimelineDetail"
  ).onclick =
    closeTimelineDetail;


  document.getElementById(
    "timelineEditNode"
  ).onclick = ()=>{

    closeTimelineDetail();

    openTimelineNodeDrawer(
      moduleId,
      nodeId,
      cardId
    );

  };


  document.getElementById(
    "timelineOpenSourceCard"
  ).onclick = ()=>{

    closeTimelineDetail();

    openCardEditor(
      card.id
    );

  };


  document.getElementById("timelineDeleteNode").onclick = ()=>{

    const ownerNames = (node.ownerCardIds || [card.id])
      .map(id => getCard(id)?.name)
      .filter(Boolean)
      .join("、");

    if(!confirm(`删除时间节点「${node.title || "未命名节点"}」吗？\n\n它将同时从总时间轴和这些归属卡片的时间轴中消失：${ownerNames || card.name}`)){
      return;
    }

    module.items = module.items.filter(item => item.id !== node.id);
    touchCard(card);
    closeTimelineDetail();
    renderTimelineFilters();
    renderGlobalTimeline();
    refreshGlobalSelectors();
    toast("时间节点已同步删除");

  };


  panel
    .querySelectorAll(
      "[data-timeline-open-card]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          closeTimelineDetail();

          openCardEditor(
            button.dataset.timelineOpenCard
          );

        };

      }
    );

}


function closeTimelineDetail(){

  document.getElementById(
    "timelineDetail"
  )
  .classList.remove(
    "open"
  );

}


/* =========================================================
   51. 关系网筛选
========================================================= */

function renderRelationFilters(){

  const select =
    document.getElementById(
      "relationFocus"
    );

  const current =
    select.value;

  const typeFilter = document.getElementById("relationTypeFilter")?.value || "";

  const cards = typeFilter
    ? db.cards.filter(card => card.type === typeFilter)
    : db.cards;


  select.innerHTML = `
    <option value="">
      全部卡片
    </option>

    ${
      cards
      .map(
        card => `
          <option
            value="${card.id}"
            ${
              current === card.id
              ? "selected"
              : ""
            }
          >
            ${escapeHTML(card.name)}
          </option>
        `
      )
      .join("")
    }
  `;

}


/* =========================================================
   52. 构建关系网 Edge
========================================================= */

function collectNetworkRelations(){
  return (db.relations || [])
    .filter(item =>{
      const source = getCard(item.fromCardId);
      const target = getCard(item.toCardId);
      return source?.type === "角色" && target?.type === "角色";
    })
    .map(item => ({
      ...item,
      inferred:false,
      // 旧数据没有方向字段；沿用此前默认双向的表现。
      undirected:item.undirected !== false
    }));
}


function renderNetworkRelationFilters(){
  const container = document.getElementById("networkRelationFilterList");
  if(!container){ return; }
  db.settings.hiddenNetworkRelationLabels = Array.isArray(db.settings.hiddenNetworkRelationLabels)
    ? db.settings.hiddenNetworkRelationLabels
    : [];
  const hidden = new Set(db.settings.hiddenNetworkRelationLabels);
  const labels = [...new Set(collectNetworkRelations().map(relation => relation.relation || "关系"))]
    .sort((a,b)=>a.localeCompare(b,"zh-CN"));
  container.innerHTML = labels.length
    ? labels.map(label => `
        <label>
          <input type="checkbox" data-network-relation-label="${escapeHTML(label)}" ${hidden.has(label) ? "" : "checked"}>
          <span>${escapeHTML(label)}</span>
        </label>
      `).join("")
    : `<div class="small" style="padding:7px">暂无关系</div>`;

  container.querySelectorAll("[data-network-relation-label]").forEach(input =>{
    input.onchange = ()=>{
      const label = input.dataset.networkRelationLabel;
      const nextHidden = new Set(db.settings.hiddenNetworkRelationLabels || []);
      if(input.checked){ nextHidden.delete(label); }
      else{ nextHidden.add(label); }
      db.settings.hiddenNetworkRelationLabels = [...nextHidden];
      saveDB();
      closeRelationDetail();
      initRelationNetwork();
    };
  });
}

function buildNetworkEdges(){

  const grouped =
    new Map();


  const hiddenLabels = new Set(db.settings.hiddenNetworkRelationLabels || []);

  collectNetworkRelations().filter(relation => !hiddenLabels.has(relation.relation || "关系")).forEach(
    relation =>{

      // 不同入口可能重复建立同一对角色的关系。数据各自保留，
      // 关系网则按无方向的卡片对合并成一条共享连线。
      const key = [
        relation.fromCardId,
        relation.toCardId
      ]
      .sort()
      .join("::");


      if(!grouped.has(key)){

        grouped.set(
          key,
          []
        );

      }


      grouped
        .get(key)
        .push(
          relation
        );

    }
  );


  return Array.from(
    grouped.entries()
  )
  .map(
    ([key,relations])=>{

      const first =
        relations[0];


      const a =
        first.fromCardId;

      const b =
        first.toCardId;


      const undirectedRelations = relations.filter(item => item.undirected);
      const forwardRelations = relations.filter(item => !item.undirected && item.fromCardId === a && item.toCardId === b);
      const reverseRelations = relations.filter(item => !item.undirected && item.fromCardId === b && item.toCardId === a);

      const combine = items => items.length ? {
        ...items[0],
        relation:[...new Set(items.map(item => item.relation || "关系"))].join(" / "),
        note:[...new Set(items.map(item => item.note).filter(Boolean))].join("\n"),
        relations:items
      } : null;


      const forward = combine(forwardRelations);
      const reverse = combine(reverseRelations);
      const undirected = combine(undirectedRelations);


      return {

        id:key,

        a,

        b,

        forward,

        reverse,

        undirected

      };

    }
  );

}


/* =========================================================
   53. 初始化关系网
========================================================= */

function initRelationNetwork(){

  const canvas =
    document.getElementById(
      "relationCanvas"
    );

  const wrapper =
    canvas.parentElement;

  const snapModeSelect = document.getElementById("relationSnapMode");
  const layoutSelect = document.getElementById("relationLayoutMode");
  const primaryFolderSelect = document.getElementById("relationPrimaryFolder");
  if(snapModeSelect){ snapModeSelect.value = db.settings.networkSnapMode || "off"; }
  if(layoutSelect){ layoutSelect.value = db.settings.networkLayoutMode || "free"; }
  if(primaryFolderSelect){
    primaryFolderSelect.innerHTML = `<option value="">选择核心文件夹</option>` +
      catalogFoldersForType("角色").map(folder => `<option value="${folder.id}" ${db.settings.networkPrimaryFolderId === folder.id ? "selected" : ""}>核心：${escapeHTML(folder.name)}</option>`).join("");
  }


  let rect =
    wrapper.getBoundingClientRect();


  const dpr =
    window.devicePixelRatio || 1;


  canvas.width =
    Math.floor(
      rect.width * dpr
    );

  canvas.height =
    Math.floor(
      rect.height * dpr
    );


  canvas.style.width =
    rect.width + "px";

  canvas.style.height =
    rect.height + "px";


  const ctx =
    canvas.getContext(
      "2d"
    );


  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  const focus =
    document.getElementById(
      "relationFocus"
    ).value;

  renderNetworkRelationFilters();

  const allEdges = buildNetworkEdges();

  const typeFilter = document.getElementById("relationTypeFilter")?.value || "";
  const allowedIds = new Set(
    db.cards
      .filter(card => !typeFilter || card.type === typeFilter)
      .map(card => card.id)
  );


  let visibleIds;


  if(focus && allowedIds.has(focus)){

    visibleIds =
      new Set([
        focus
      ]);


    allEdges.forEach(
      edge =>{

        if(
          edge.a === focus
        ){

          if(allowedIds.has(edge.b)){ visibleIds.add(edge.b); }

        }


        if(
          edge.b === focus
        ){

          if(allowedIds.has(edge.a)){ visibleIds.add(edge.a); }

        }

      }
    );

  }else{

    visibleIds =
      new Set(allowedIds);

  }


  const primaryFolder = (db.settings.catalogFolders || []).find(folder =>
    folder.type === "角色" && folder.id === db.settings.networkPrimaryFolderId
  ) || (db.settings.catalogFolders || []).find(folder => folder.type === "角色" && folder.name.trim() === "主要角色");
  const primaryCards = primaryFolder
    ? db.cards.filter(card => card.type === "角色" && card.basic?.folderId === primaryFolder.id).slice(0,6)
    : [];
  const primaryIndex = new Map(primaryCards.map((card,index) => [card.id,index]));
  const primaryLayout = (db.settings.networkLayoutMode || "free") === "primary";

  const layoutEdges = allEdges.filter(edge => visibleIds.has(edge.a) && visibleIds.has(edge.b));
  const layoutPositions = new Map();
  const center = {x:rect.width / 2,y:rect.height / 2};
  const coreRadius = Math.min(175,Math.max(105,Math.min(rect.width,rect.height) * .22));

  function clampPosition(position){
    return {
      x:Math.max(54,Math.min(rect.width - 54,position.x)),
      y:Math.max(54,Math.min(rect.height - 74,position.y))
    };
  }

  if(primaryLayout){
    primaryCards.forEach((card,index) =>{
      const angle = -Math.PI / 2 + index * Math.PI / 3;
      layoutPositions.set(card.id,{
        x:center.x + Math.cos(angle) * coreRadius,
        y:center.y + Math.sin(angle) * coreRadius,
        angle,
        core:true
      });
    });

    const adjacency = new Map();
    visibleIds.forEach(id => adjacency.set(id,[]));
    layoutEdges.forEach(edge =>{
      adjacency.get(edge.a)?.push(edge.b);
      adjacency.get(edge.b)?.push(edge.a);
    });

    const oneCoreGroups = new Map();
    visibleIds.forEach(id =>{
      if(primaryIndex.has(id)){ return; }
      const coreNeighbors = (adjacency.get(id) || []).filter(neighborId => primaryIndex.has(neighborId));
      if(coreNeighbors.length === 1){
        if(!oneCoreGroups.has(coreNeighbors[0])){ oneCoreGroups.set(coreNeighbors[0],[]); }
        oneCoreGroups.get(coreNeighbors[0]).push(id);
      }
      if(coreNeighbors.length > 1){
        let x = 0;
        let y = 0;
        coreNeighbors.forEach(coreId =>{
          const position = layoutPositions.get(coreId);
          x += position.x;
          y += position.y;
        });
        x /= coreNeighbors.length;
        y /= coreNeighbors.length;
        let angle = Math.atan2(y - center.y,x - center.x);
        if(Math.hypot(x - center.x,y - center.y) < 20){
          angle = layoutPositions.get(coreNeighbors[0]).angle;
        }
        const distance = coreRadius + 105;
        layoutPositions.set(id,{...clampPosition({x:center.x + Math.cos(angle) * distance,y:center.y + Math.sin(angle) * distance}),angle});
      }
    });

    oneCoreGroups.forEach((ids,coreId) =>{
      const core = layoutPositions.get(coreId);
      ids.sort((a,b)=>String(getCard(a)?.name || "").localeCompare(String(getCard(b)?.name || ""),"zh-CN"));
      ids.forEach((id,index) =>{
        const slot = index % 5;
        const layer = Math.floor(index / 5);
        const angle = core.angle + (slot - (Math.min(ids.length,5) - 1) / 2) * .18;
        const distance = coreRadius + 100 + layer * 72;
        layoutPositions.set(id,{...clampPosition({x:center.x + Math.cos(angle) * distance,y:center.y + Math.sin(angle) * distance}),angle});
      });
    });

    const childCounts = new Map();
    for(let pass = 0;pass < 5;pass++){
      visibleIds.forEach(id =>{
        if(layoutPositions.has(id)){ return; }
        const parentId = (adjacency.get(id) || []).find(neighborId => layoutPositions.has(neighborId));
        if(!parentId){ return; }
        const parent = layoutPositions.get(parentId);
        const count = childCounts.get(parentId) || 0;
        childCounts.set(parentId,count + 1);
        const baseAngle = Math.atan2(parent.y - center.y,parent.x - center.x);
        const angle = baseAngle + (count % 2 ? 1 : -1) * Math.ceil(count / 2) * .20;
        layoutPositions.set(id,{...clampPosition({x:parent.x + Math.cos(angle) * 96,y:parent.y + Math.sin(angle) * 96}),angle});
      });
    }

    const remaining = [...visibleIds].filter(id => !layoutPositions.has(id));
    remaining.forEach((id,index) =>{
      const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(remaining.length,1);
      const distance = Math.min(rect.width,rect.height) * .43;
      layoutPositions.set(id,{...clampPosition({x:center.x + Math.cos(angle) * distance,y:center.y + Math.sin(angle) * distance}),angle});
    });

    const positionedIds = [...visibleIds].filter(id => layoutPositions.has(id));
    for(let pass = 0;pass < 80;pass++){
      let moved = false;
      for(let i = 0;i < positionedIds.length;i++){
        for(let j = i + 1;j < positionedIds.length;j++){
          const a = layoutPositions.get(positionedIds[i]);
          const b = layoutPositions.get(positionedIds[j]);
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let distance = Math.hypot(dx,dy);
          const minimum = 82;
          if(distance >= minimum){ continue; }
          if(distance < .01){
            const angle = (i * 2.399963 + j * .73) % (Math.PI * 2);
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }
          const push = (minimum - distance) / 2 + .6;
          const ux = dx / distance;
          const uy = dy / distance;
          if(!a.core && !b.core){
            a.x -= ux * push;
            a.y -= uy * push;
            b.x += ux * push;
            b.y += uy * push;
          }else if(a.core && !b.core){
            b.x += ux * push * 2;
            b.y += uy * push * 2;
          }else if(!a.core && b.core){
            a.x -= ux * push * 2;
            a.y -= uy * push * 2;
          }
          if(!a.core){ Object.assign(a,clampPosition(a)); }
          if(!b.core){ Object.assign(b,clampPosition(b)); }
          moved = true;
        }
      }
      if(!moved){ break; }
    }

    function labelHalfWidth(id){
      const length = [...String(getCard(id)?.name || "")].length;
      return Math.min(118,Math.max(29,length * 7.5));
    }

    for(let pass = 0;pass < 100;pass++){
      let moved = false;
      for(let i = 0;i < positionedIds.length;i++){
        for(let j = i + 1;j < positionedIds.length;j++){
          const a = layoutPositions.get(positionedIds[i]);
          const b = layoutPositions.get(positionedIds[j]);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const neededX = labelHalfWidth(positionedIds[i]) + labelHalfWidth(positionedIds[j]) + 14;
          const neededY = 78;
          const overlapX = neededX - Math.abs(dx);
          const overlapY = neededY - Math.abs(dy);
          if(overlapX <= 0 || overlapY <= 0 || (a.core && b.core)){ continue; }
          const pushX = Math.abs(dx) / neededX >= Math.abs(dy) / neededY;
          if(pushX){
            const direction = dx >= 0 ? 1 : -1;
            const amount = overlapX / 2 + .8;
            if(!a.core){ a.x -= direction * (b.core ? amount * 2 : amount); }
            if(!b.core){ b.x += direction * (a.core ? amount * 2 : amount); }
          }else{
            const direction = dy >= 0 ? 1 : -1;
            const amount = overlapY / 2 + .8;
            if(!a.core){ a.y -= direction * (b.core ? amount * 2 : amount); }
            if(!b.core){ b.y += direction * (a.core ? amount * 2 : amount); }
          }
          if(!a.core){ Object.assign(a,clampPosition(a)); }
          if(!b.core){ Object.assign(b,clampPosition(b)); }
          moved = true;
        }
      }
      if(!moved){ break; }
    }
  }

  function initialNetworkPosition(card){
    if(primaryLayout && layoutPositions.has(card.id)){ return layoutPositions.get(card.id); }
    return {
      x:80 + Math.random() * Math.max(100,rect.width - 160),
      y:80 + Math.random() * Math.max(100,rect.height - 160)
    };
  }

  const nodes =
    db.cards
    .filter(
      card =>
        visibleIds.has(
          card.id
        )
    )
    .map(
      card =>{

        const saved =
          db.settings
          .networkPositions[
            card.id
          ];


        const position = saved || initialNetworkPosition(card);


        return {

          id:card.id,

          card,

          x:position.x,

          y:position.y

        };

      }
    );


  const edges = layoutEdges;


  networkRuntime = {

    nodes,

    edges,

    dragging:null,

    panning:null,

    relationStart:null,

    dragStart:null,

    dragOffset:{
      x:0,
      y:0
    },

    hoverNode:null,

    hoverEdge:null,

    positions:
      db.settings
      .networkPositions,

    viewport:normalizeNetworkViewport(db.settings.networkViewport)

  };

  db.settings.networkViewport = networkRuntime.viewport;

  function updateZoomValue(){
    const output = document.getElementById("networkZoomValue");
    if(output){ output.textContent = `${Math.round(networkRuntime.viewport.scale * 100)}%`; }
  }

  function saveNetworkViewport(){
    db.settings.networkViewport = {...networkRuntime.viewport};
    saveDB();
  }

  const networkImageCache = new Map();

  function networkNodeImage(card){
    const src = getHeroImage(card)?.src;
    if(!src){ return null; }
    if(networkImageCache.has(src)){ return networkImageCache.get(src); }
    const image = new Image();
    networkImageCache.set(src,image);
    image.onload = draw;
    image.src = src;
    return image;
  }

  function nodeById(id){

    return nodes.find(
      node =>
        node.id === id
    );

  }


  function drawSnapGrid(){
    const mode = db.settings.networkSnapMode || "off";
    if(mode === "off"){ return; }

    const viewport = networkRuntime.viewport;
    const minX = -viewport.x / viewport.scale;
    const minY = -viewport.y / viewport.scale;
    const maxX = (rect.width - viewport.x) / viewport.scale;
    const maxY = (rect.height - viewport.y) / viewport.scale;

    ctx.save();
    if(mode === "square"){
      const size = 32;
      ctx.beginPath();
      for(let x = Math.floor(minX / size) * size;x <= maxX;x += size){
        ctx.moveTo(x,minY);
        ctx.lineTo(x,maxY);
      }
      for(let y = Math.floor(minY / size) * size;y <= maxY;y += size){
        ctx.moveTo(minX,y);
        ctx.lineTo(maxX,y);
      }
      ctx.strokeStyle = "rgba(109,145,166,.105)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }else if(mode === "hex"){
      const spacing = 48;
      const rowHeight = spacing * Math.sqrt(3) / 2;
      ctx.fillStyle = "rgba(92,137,164,.18)";
      const firstRow = Math.floor(minY / rowHeight) - 1;
      const lastRow = Math.ceil(maxY / rowHeight) + 1;
      for(let row = firstRow;row <= lastRow;row++){
        const y = row * rowHeight;
        const offset = Math.abs(row % 2) * spacing / 2;
        const firstColumn = Math.floor((minX - offset) / spacing) - 1;
        const lastColumn = Math.ceil((maxX - offset) / spacing) + 1;
        for(let column = firstColumn;column <= lastColumn;column++){
          const x = column * spacing + offset;
          ctx.beginPath();
          ctx.arc(x,y,1.25,0,Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }


  function draw(){
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(
      0,
      0,
      rect.width,
      rect.height
    );

    ctx.save();
    ctx.translate(networkRuntime.viewport.x,networkRuntime.viewport.y);
    ctx.scale(networkRuntime.viewport.scale,networkRuntime.viewport.scale);

    drawSnapGrid();


    /* ---------------------------------------------
       连线
    --------------------------------------------- */

    edges.forEach(
      edge =>{

        const a =
          nodeById(edge.a);

        const b =
          nodeById(edge.b);


        if(
          !a
          ||
          !b
        ){
          return;
        }


        const hovered =
          networkRuntime
          .hoverEdge
          ===
          edge.id;


        ctx.beginPath();

        ctx.moveTo(
          a.x,
          a.y
        );

        ctx.lineTo(
          b.x,
          b.y
        );


        ctx.strokeStyle =
          hovered
          ?
          "rgba(49,103,133,.85)"
          :
          "rgba(105,139,158,.40)";


        ctx.lineWidth =
          hovered
          ?
          2
          :
          1.2;


        ctx.stroke();

        function drawArrow(from,to){
          const angle = Math.atan2(to.y - from.y,to.x - from.x);
          const tipX = to.x - Math.cos(angle) * 27;
          const tipY = to.y - Math.sin(angle) * 27;
          ctx.beginPath();
          ctx.moveTo(tipX,tipY);
          ctx.lineTo(tipX - Math.cos(angle - .55) * 9,tipY - Math.sin(angle - .55) * 9);
          ctx.lineTo(tipX - Math.cos(angle + .55) * 9,tipY - Math.sin(angle + .55) * 9);
          ctx.closePath();
          ctx.fillStyle = hovered ? "rgba(49,103,133,.9)" : "rgba(105,139,158,.68)";
          ctx.fill();
        }

        if(edge.forward){ drawArrow(a,b); }
        if(edge.reverse){ drawArrow(b,a); }


        const label =
          networkEdgeLabel(
            edge
          );


        const edgeLength = Math.hypot(b.x - a.x,b.y - a.y);

        if(label){

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const normalX = edgeLength > 0 ? -dy / edgeLength : 0;
          const normalY = edgeLength > 0 ? dx / edgeLength : 0;
          const labelOffset = 10;

          const mx =
            (
              a.x
              +
              b.x
            )
            /
            2
            + normalX * labelOffset;

          const my =
            (
              a.y
              +
              b.y
            )
            /
            2
            + normalY * labelOffset;


          ctx.font = hovered ? "600 11px sans-serif" : "11px sans-serif";


          const width =
            ctx.measureText(
              label
            ).width;


          ctx.fillStyle =
            "rgba(255,255,255,.94)";


          ctx.fillRect(
            mx
            -
            width / 2
            -
            5,
            my - 9,
            width + 10,
            18
          );


          ctx.fillStyle =
            "#657b89";

          ctx.textAlign =
            "center";

          ctx.textBaseline =
            "middle";

          ctx.fillText(
            label,
            mx,
            my
          );

        }

      }
    );


    /* ---------------------------------------------
       节点
    --------------------------------------------- */

    nodes.forEach(
      node =>{

        const hovered =
          networkRuntime
          .hoverNode
          ===
          node.id;


        const radius =
          hovered
          ?
          25
          :
          22;

        const portrait = networkNodeImage(node.card);

        ctx.save();


        ctx.beginPath();

        ctx.arc(
          node.x,
          node.y,
          radius,
          0,
          Math.PI * 2
        );


        ctx.fillStyle = "#fff";


        ctx.fill();

        if(portrait?.complete && portrait.naturalWidth){
          ctx.clip();
          const innerRadius = radius - 3;
          const scale = Math.min(innerRadius * 2 / portrait.naturalWidth,innerRadius * 2 / portrait.naturalHeight);
          const width = portrait.naturalWidth * scale;
          const height = portrait.naturalHeight * scale;
          // 按最终屏幕像素对齐，避免缩放后细轮廓落在半像素上。
          const viewportScale = networkRuntime.viewport.scale;
          const snapWorld = (value,offset)=>{
            const screen = offset + value * viewportScale;
            return (Math.round(screen * dpr) / dpr - offset) / viewportScale;
          };
          const drawX = snapWorld(node.x - width / 2,networkRuntime.viewport.x);
          const drawY = snapWorld(node.y - height / 2,networkRuntime.viewport.y);
          const drawRight = snapWorld(node.x + width / 2,networkRuntime.viewport.x);
          const drawBottom = snapWorld(node.y + height / 2,networkRuntime.viewport.y);
          ctx.drawImage(portrait,drawX,drawY,drawRight-drawX,drawBottom-drawY);
        }

        ctx.restore();

        ctx.beginPath();
        ctx.arc(node.x,node.y,radius,0,Math.PI * 2);

        ctx.strokeStyle =
          hovered
          ?
          NODE_COLORS[node.card.type] || "#315f79"
          :
          NODE_COLORS[node.card.type] || "#8fa2ae";


        ctx.lineWidth =
          hovered
          ?
          3.2
          :
          2.4;


        ctx.stroke();

        if(networkRuntime.relationStart === node.id){
          ctx.beginPath();
          ctx.arc(node.x,node.y,radius + 7,0,Math.PI * 2);
          ctx.setLineDash([4,3]);
          ctx.strokeStyle = "#347da5";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);
        }


        ctx.font =
          hovered
          ?
          "600 12px sans-serif"
          :
          "12px sans-serif";


        ctx.fillStyle =
          hovered
          ?
          "#263f4e"
          :
          "#526a78";


        ctx.textAlign =
          "center";

        ctx.textBaseline =
          "top";


        ctx.fillText(
          node.card.name,
          node.x,
          node.y
          +
          radius
          +
          5
        );

      }
    );

    ctx.restore();
    updateZoomValue();

  }


  function screenPoint(
    event
  ){

    const canvasRect =
      canvas.getBoundingClientRect();

    return {

      x:
        event.clientX
        -
        canvasRect.left,

      y:
        event.clientY
        -
        canvasRect.top

    };

  }

  function point(event){
    const screen = screenPoint(event);
    const viewport = networkRuntime.viewport;
    return {
      x:(screen.x - viewport.x) / viewport.scale,
      y:(screen.y - viewport.y) / viewport.scale
    };
  }


  function hitNode(
    x,
    y
  ){

    for(
      let i =
        nodes.length - 1;

      i >= 0;

      i--
    ){

      const node =
        nodes[i];

      const dx =
        x - node.x;

      const dy =
        y - node.y;


      if(
        dx * dx
        +
        dy * dy
        <=
        29 * 29
      ){

        return node;

      }

    }


    return null;

  }


  function distanceToSegment(
    px,
    py,
    x1,
    y1,
    x2,
    y2
  ){

    const dx =
      x2 - x1;

    const dy =
      y2 - y1;


    if(
      dx === 0
      &&
      dy === 0
    ){

      return Math.hypot(
        px - x1,
        py - y1
      );

    }


    const t =
      Math.max(
        0,
        Math.min(
          1,
          (
            (
              px - x1
            )
            *
            dx
            +
            (
              py - y1
            )
            *
            dy
          )
          /
          (
            dx * dx
            +
            dy * dy
          )
        )
      );


    const cx =
      x1 + t * dx;

    const cy =
      y1 + t * dy;


    return Math.hypot(
      px - cx,
      py - cy
    );

  }


  function hitEdge(
    x,
    y
  ){

    let best =
      null;

    let bestDistance =
      8;


    edges.forEach(
      edge =>{

        const a =
          nodeById(
            edge.a
          );

        const b =
          nodeById(
            edge.b
          );


        if(
          !a
          ||
          !b
        ){
          return;
        }


        const distance =
          distanceToSegment(
            x,
            y,
            a.x,
            a.y,
            b.x,
            b.y
          );


        if(
          distance
          <
          bestDistance
        ){

          best =
            edge;

          bestDistance =
            distance;

        }

      }
    );


    return best;

  }

  let shiftSelectionClick = false;


  canvas.onmousemove =
    event =>{

      const screen = screenPoint(event);

      if(networkRuntime.panning){
        const pan = networkRuntime.panning;
        const dx = screen.x - pan.startX;
        const dy = screen.y - pan.startY;
        if(Math.hypot(dx,dy) > 2){ pan.moved = true; }
        networkRuntime.viewport.x = pan.originX + dx;
        networkRuntime.viewport.y = pan.originY + dy;
        canvas.classList.add("is-panning");
        draw();
        return;
      }

      const p =
        point(event);

      if(
        networkRuntime.dragging
      ){

        const dragStart = networkRuntime.dragStart;
        if(dragStart && !dragStart.moved){
          const distance = Math.hypot(screen.x - dragStart.screenX,screen.y - dragStart.screenY);
          if(distance <= 3){ return; }
          dragStart.moved = true;
        }

        const node =
          networkRuntime.dragging;

        node.x =
          p.x
          -
          networkRuntime
          .dragOffset.x;


        node.y =
          p.y
          -
          networkRuntime
          .dragOffset.y;

        canvas.style.cursor = "grabbing";


        draw();

        return;

      }


      const node =
        hitNode(
          p.x,
          p.y
        );


      networkRuntime.hoverNode =
        node
        ?
        node.id
        :
        null;


      networkRuntime.hoverEdge =
        node
        ?
        null
        :
        (
          hitEdge(
            p.x,
            p.y
          )
          ?.
          id
          ||
          null
        );


      canvas.style.cursor =
        node
        ||
        networkRuntime.hoverEdge
        ?
        "pointer"
        :
        "grab";


      draw();

    };


  canvas.onmousedown =
    event =>{

      const p =
        point(event);

      const node =
        hitNode(
          p.x,
          p.y
        );

      if(event.shiftKey){
        shiftSelectionClick = true;
        if(!node){
          networkRuntime.relationStart = null;
          draw();
          toast("已取消人物关系选择。");
          return;
        }
        if(node.card.type !== "角色"){
          toast("目前只能选择角色卡片建立关系。");
          return;
        }
        if(!networkRuntime.relationStart){
          networkRuntime.relationStart = node.id;
          draw();
          toast(`已选择「${node.card.name}」，继续按住 Shift 点击另一个角色。`);
          return;
        }
        if(networkRuntime.relationStart === node.id){
          networkRuntime.relationStart = null;
          draw();
          toast("已取消人物关系选择。");
          return;
        }
        const sourceCard = getCard(networkRuntime.relationStart);
        networkRuntime.relationStart = null;
        draw();
        openQuickRoleRelationModal(sourceCard,node.card);
        return;
      }

      if(networkRuntime.relationStart){
        networkRuntime.relationStart = null;
        draw();
      }


      if(node){

        networkRuntime.dragging =
          node;

        const screen = screenPoint(event);
        networkRuntime.dragStart = {
          screenX:screen.x,
          screenY:screen.y,
          nodeX:node.x,
          nodeY:node.y,
          moved:false
        };

        networkRuntime.dragOffset =
          {

            x:
              p.x
              -
              node.x,

            y:
              p.y
              -
              node.y

          };

      }else{

        const screen = screenPoint(event);
        networkRuntime.panning = {
          startX:screen.x,
          startY:screen.y,
          originX:networkRuntime.viewport.x,
          originY:networkRuntime.viewport.y,
          moved:false
        };

      }

    };


  canvas.onmouseup =
    event =>{

      if(shiftSelectionClick){
        shiftSelectionClick = false;
        return;
      }

      const p =
        point(event);


      if(
        networkRuntime.dragging
      ){

        const node =
          networkRuntime.dragging;

        const moved = Boolean(networkRuntime.dragStart?.moved);

        networkRuntime.dragging = null;
        networkRuntime.dragStart = null;
        canvas.style.cursor = "pointer";

        if(!moved){
          return;
        }

        if((db.settings.networkSnapMode || "off") !== "off"){
          if(db.settings.networkSnapMode === "hex"){
            const spacing = 48;
            const rowHeight = spacing * Math.sqrt(3) / 2;
            const row = Math.round(node.y / rowHeight);
            const offset = Math.abs(row % 2) * spacing / 2;
            node.y = row * rowHeight;
            node.x = Math.round((node.x - offset) / spacing) * spacing + offset;
          }else{
            const gridSize = 32;
            node.x = Math.round(node.x / gridSize) * gridSize;
            node.y = Math.round(node.y / gridSize) * gridSize;
          }
          draw();
        }


        db.settings
          .networkPositions[
            node.id
          ]
          =
          {
            x:node.x,
            y:node.y
          };


        saveDB();


        return;

      }

      if(networkRuntime.panning){
        const moved = networkRuntime.panning.moved;
        networkRuntime.panning = null;
        canvas.classList.remove("is-panning");
        canvas.style.cursor = "grab";
        if(moved){
          saveNetworkViewport();
          return;
        }
      }


      const node =
        hitNode(
          p.x,
          p.y
        );


      if(node){

        openNetworkNodeDetail(
          node.card
        );

        return;

      }


      const edge =
        hitEdge(
          p.x,
          p.y
        );


      if(edge){

        openNetworkEdgeDetail(
          edge
        );

      }

    };

  canvas.onmouseleave = ()=>{
    shiftSelectionClick = false;
    if(networkRuntime.dragging){
      const node = networkRuntime.dragging;
      if(networkRuntime.dragStart?.moved){
        db.settings.networkPositions[node.id] = {x:node.x,y:node.y};
        saveDB();
      }
      networkRuntime.dragging = null;
      networkRuntime.dragStart = null;
    }
    if(networkRuntime.panning){
      networkRuntime.panning = null;
      canvas.classList.remove("is-panning");
      saveNetworkViewport();
    }
  };

  let wheelSaveTimer = null;
  canvas.onwheel = event =>{
    event.preventDefault();
    const screen = screenPoint(event);
    const viewport = networkRuntime.viewport;
    const oldScale = viewport.scale;
    const factor = Math.exp(-event.deltaY * .0015);
    const nextScale = Math.max(.35,Math.min(2.5,oldScale * factor));
    if(Math.abs(nextScale - oldScale) < .0001){ return; }
    const worldX = (screen.x - viewport.x) / oldScale;
    const worldY = (screen.y - viewport.y) / oldScale;
    viewport.scale = nextScale;
    viewport.x = screen.x - worldX * nextScale;
    viewport.y = screen.y - worldY * nextScale;
    draw();
    clearTimeout(wheelSaveTimer);
    wheelSaveTimer = setTimeout(saveNetworkViewport,220);
  };


  canvas.ondblclick =
    event =>{

      const p =
        point(event);

      const node =
        hitNode(
          p.x,
          p.y
        );


      if(node){

        openNetworkNodeDetail(node.card);

      }

    };

  function centerNetworkAtScale(requestedScale){
    if(!nodes.length){ return; }
    const xs = nodes.map(node => node.x);
    const ys = nodes.map(node => node.y);
    const minX = Math.min(...xs) - 70;
    const maxX = Math.max(...xs) + 70;
    const minY = Math.min(...ys) - 85;
    const maxY = Math.max(...ys) + 85;
    const contentWidth = Math.max(140,maxX - minX);
    const contentHeight = Math.max(170,maxY - minY);
    const scale = requestedScale === undefined
      ? Math.max(.35,Math.min(2.5,Math.min((rect.width - 48) / contentWidth,(rect.height - 48) / contentHeight)))
      : Math.max(.35,Math.min(2.5,requestedScale));
    networkRuntime.viewport.scale = scale;
    networkRuntime.viewport.x = rect.width / 2 - (minX + maxX) / 2 * scale;
    networkRuntime.viewport.y = rect.height / 2 - (minY + maxY) / 2 * scale;
    draw();
    saveNetworkViewport();
  }

  function centerPrimaryNetwork(requestedScale){
    const primaryNodes = nodes.filter(node => primaryIndex.has(node.id));
    const focusNodes = primaryNodes.length ? primaryNodes : nodes;
    if(!focusNodes.length){ return; }
    const centerX = focusNodes.reduce((sum,node)=>sum + node.x,0) / focusNodes.length;
    const centerY = focusNodes.reduce((sum,node)=>sum + node.y,0) / focusNodes.length;
    const scale = Math.max(.6,Math.min(1.15,requestedScale ?? .85));
    networkRuntime.viewport.scale = scale;
    networkRuntime.viewport.x = rect.width / 2 - centerX * scale;
    networkRuntime.viewport.y = rect.height / 2 - centerY * scale;
    draw();
    saveNetworkViewport();
  }

  networkRuntime.fitAll = ()=>centerNetworkAtScale();
  networkRuntime.centerPrimary = ()=>centerPrimaryNetwork(.85);
  networkRuntime.resetZoom = ()=>centerNetworkAtScale(1);
  networkRuntime.resize = ()=>{
    rect = wrapper.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const aspectRatio = rect.width / Math.max(1,rect.height);
    if(aspectRatio >= 1.45){
      centerNetworkAtScale();
    }else if(aspectRatio >= .85){
      centerPrimaryNetwork(.85);
    }else{
      centerPrimaryNetwork(.78);
    }
  };

  networkRuntime.redraw = draw;
  networkRuntime.resize();

}


/* =========================================================
   54. 关系网标签
========================================================= */

function networkEdgeLabel(
  edge
){

  const shared = edge.undirected ? edge.undirected.relation : "";

  const forward =
    edge.forward
    ?
    edge.forward.relation
    :
    "";

  const reverse =
    edge.reverse
    ?
    edge.reverse.relation
    :
    "";


  if(
    forward
    &&
    reverse
    &&
    forward !== reverse
  ){

    return (
      forward
      +
      " / "
      +
      reverse
    );

  }


  return [...new Set([shared,forward,reverse].filter(Boolean))].join(" / ") || "关系";

}


/* =========================================================
   55. 关系网节点详情
========================================================= */

function openNetworkNodeDetail(
  card
){

  const panel =
    document.getElementById(
      "relationDetail"
    );


  const outgoing = collectNetworkRelations().filter(relation =>
    relation.fromCardId === card.id
    || (relation.undirected && relation.toCardId === card.id)
  );


  panel.innerHTML = `

    <button
      id="closeRelationDetail"
      class="icon-btn detail-close"
    >
      ×
    </button>


    <div class="small">
      ${escapeHTML(card.type)}
      ·
      ${escapeHTML(card.subtype || "")}
    </div>


    <div class="detail-title">
      ${escapeHTML(card.name)}
    </div>


    <div class="small">
      ${escapeHTML(card.subtitle || "")}
    </div>


    <div class="detail-section">

      <div class="detail-section-title">
        直接关系
      </div>


      <div
        style="
          display:grid;
          gap:7px;
        "
      >

        ${
          outgoing
          .map(
            relation =>{

              const target = getCard(
                relation.fromCardId === card.id
                  ? relation.toCardId
                  : relation.fromCardId
              );

              if(!target){
                return "";
              }

              return `

                <button
                  class="btn small"
                  data-network-related="${target.id}"
                >
                  ${
                    escapeHTML(
                      relation.relation
                    )
                  }
                  ·
                  ${
                    escapeHTML(
                      target.name
                    )
                  }
                </button>

              `;

            }
          )
          .join("")
          ||
          `
            <span class="small">
              暂无关系
            </span>
          `
        }

      </div>

    </div>


    <div class="detail-section">

      <button
        id="networkOpenCard"
        class="btn"
        style="width:100%"
      >
        打开卡片
      </button>

    </div>

  `;


  panel.classList.add(
    "open"
  );


  document.getElementById(
    "closeRelationDetail"
  ).onclick =
    closeRelationDetail;


  document.getElementById(
    "networkOpenCard"
  ).onclick = ()=>{

    closeRelationDetail();

    openCardEditor(
      card.id
    );

  };


  panel
    .querySelectorAll(
      "[data-network-related]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          document.getElementById(
            "relationFocus"
          ).value =
            button.dataset.networkRelated;

          closeRelationDetail();

          initRelationNetwork();

        };

      }
    );

}


/* =========================================================
   56. 关系网关系详情
========================================================= */

function openNetworkEdgeDetail(
  edge
){

  const panel =
    document.getElementById(
      "relationDetail"
    );


  const a =
    getCard(
      edge.a
    );

  const b =
    getCard(
      edge.b
    );


  if(
    !a
    ||
    !b
  ){
    return;
  }

  const titleSymbol = edge.undirected || (edge.forward && edge.reverse)
    ? "↔"
    : edge.forward
      ? "→"
      : "←";


  panel.innerHTML = `

    <button
      id="closeRelationDetail"
      class="icon-btn detail-close"
    >
      ×
    </button>


    <div class="small">
      关系
    </div>


    <div class="detail-title">
      ${escapeHTML(a.name)}
      ${titleSymbol}
      ${escapeHTML(b.name)}
    </div>


    ${
      edge.undirected

      ? `
        <div class="detail-section">
          <div class="detail-section-title">
            ${escapeHTML(a.name)} ↔ ${escapeHTML(b.name)}
          </div>
          <div>${escapeHTML(edge.undirected.relation)}</div>
          ${edge.undirected.note ? `<div class="small" style="margin-top:8px;line-height:1.7">${escapeHTML(edge.undirected.note)}</div>` : ""}
          <div class="network-relation-edit-list">
            ${(edge.undirected.relations || [edge.undirected]).map(relation => `
              <button class="btn small" data-edit-network-relation="${relation.id}">修改「${escapeHTML(relation.relation || "关系")}」</button>
              <button class="btn small danger" data-delete-network-relation="${relation.id}">删除</button>
            `).join("")}
          </div>
        </div>
      `

      : ""
    }


    ${
      edge.forward

      ? `
        <div class="detail-section">

          <div class="detail-section-title">
            ${escapeHTML(a.name)}
            →
            ${escapeHTML(b.name)}
          </div>

          <div>
            ${escapeHTML(edge.forward.relation)}
          </div>

          ${
            edge.forward.note

            ? `
              <div
                class="small"
                style="
                  margin-top:8px;
                  line-height:1.7;
                "
              >
                ${escapeHTML(edge.forward.note)}
              </div>
            `

            : ""
          }

          <div class="network-relation-edit-list">
            ${(edge.forward.relations || [edge.forward]).map(relation => `
              <button class="btn small" data-edit-network-relation="${relation.id}">
                修改「${escapeHTML(relation.relation || "关系")}」
              </button>
              <button class="btn small danger" data-delete-network-relation="${relation.id}">删除</button>
            `).join("")}
          </div>

        </div>
      `

      : ""
    }


    ${
      edge.reverse

      ? `
        <div class="detail-section">

          <div class="detail-section-title">
            ${escapeHTML(b.name)}
            →
            ${escapeHTML(a.name)}
          </div>

          <div>
            ${escapeHTML(edge.reverse.relation)}
          </div>

          ${
            edge.reverse.note

            ? `
              <div
                class="small"
                style="
                  margin-top:8px;
                  line-height:1.7;
                "
              >
                ${escapeHTML(edge.reverse.note)}
              </div>
            `

            : ""
          }

          <div class="network-relation-edit-list">
            ${(edge.reverse.relations || [edge.reverse]).map(relation => `
              <button class="btn small" data-edit-network-relation="${relation.id}">
                修改「${escapeHTML(relation.relation || "关系")}」
              </button>
              <button class="btn small danger" data-delete-network-relation="${relation.id}">删除</button>
            `).join("")}
          </div>

        </div>
      `

      : ""
    }


    <div class="detail-section">

      <button
        class="btn"
        data-edge-card="${a.id}"
        style="
          width:100%;
          margin-bottom:7px;
        "
      >
        打开「${escapeHTML(a.name)}」
      </button>


      <button
        class="btn"
        data-edge-card="${b.id}"
        style="width:100%"
      >
        打开「${escapeHTML(b.name)}」
      </button>

    </div>

  `;


  panel.classList.add(
    "open"
  );


  document.getElementById(
    "closeRelationDetail"
  ).onclick =
    closeRelationDetail;

  panel
    .querySelectorAll("[data-edit-network-relation]")
    .forEach(button =>{
      button.onclick = ()=>{
        const relation = collectNetworkRelations().find(item => item.id === button.dataset.editNetworkRelation);
        if(!relation){ return; }
        if(!relation.inferred){
          closeRelationDetail();
          openEditRelationDrawer(relation.id);
          return;
        }
        openInferredRelationEditor(relation);
      };
    });

  panel
    .querySelectorAll("[data-delete-network-relation]")
    .forEach(button =>{
      button.onclick = ()=>{
        const relation = db.relations.find(item => item.id === button.dataset.deleteNetworkRelation);
        if(!relation){ return; }
        if(!confirm(`删除关系「${relation.relation || "关系"}」吗？`)){ return; }
        deleteRelation(relation.id);
        closeRelationDetail();
        initRelationNetwork();
        toast("关系已删除");
      };
    });


  panel
    .querySelectorAll(
      "[data-edge-card]"
    )
    .forEach(
      button =>{

        button.onclick = ()=>{

          closeRelationDetail();

          openCardEditor(
            button.dataset.edgeCard
          );

        };

      }
    );

}


function closeRelationDetail(){

  document.getElementById(
    "relationDetail"
  )
  .classList.remove(
    "open"
  );

}


/* =========================================================
   57. 关系网重新布局
========================================================= */

function resetRelationNetwork(){

  db.settings.networkPositions =
    {};

  db.settings.networkViewport =
    {x:0,y:0,scale:1};

  saveDB();

  initRelationNetwork();

}


/* =========================================================
   58. 全局 Selector 刷新
========================================================= */

function refreshGlobalSelectors(){

  renderTypeFilter();

  renderRelationFilters();

  renderTimelineFilters();

  renderCardList();

}


/* =========================================================
   59. Drawer
========================================================= */

function openDrawer(
  html
){

  const mask =
    document.getElementById(
      "drawerMask"
    );

  const drawer =
    document.getElementById(
      "drawer"
    );


  drawer.innerHTML =
    html;

  mask.classList.add(
    "open"
  );


  drawer
    .querySelectorAll(
      "[data-close-drawer]"
    )
    .forEach(
      button =>{

        button.onclick =
          closeDrawer;

      }
    );

}


function closeDrawer(){

  document.getElementById(
    "drawerMask"
  )
  .classList.remove(
    "open"
  );

}


/* =========================================================
   60. Modal
========================================================= */

function openModal(){

  const mask =
    document.getElementById(
      "modalMask"
    );


  mask.classList.add(
    "open"
  );


  document
    .getElementById(
      "modal"
    )
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach(
      button =>{

        button.onclick =
          closeModal;

      }
    );

}


function closeModal(){

  document.getElementById(
    "modalMask"
  )
  .classList.remove(
    "open"
  );

}


/* =========================================================
   61. 页面全局事件
========================================================= */

document
  .querySelectorAll(
    ".nav-btn"
  )
  .forEach(
    button =>{

      button.onclick = ()=>{

        switchView(
          button.dataset.view
        );

      };

    }
  );


document.getElementById(
  "newCardBtn"
).onclick =
  openNewCardModal;

document.getElementById("newTimelineNodeBtn").onclick =
  openGlobalTimelineNodeModal;


document.getElementById("exportDataBtn").onclick = exportAllData;

document.getElementById("exportWikiDataBtn").onclick = exportWikiData;


document.getElementById("importDataBtn").onclick = ()=>{
  document.getElementById("importDataInput").click();
};


document.getElementById("importDataInput").onchange = event =>{
  const file = event.target.files?.[0];

  if(file){
    importAllData(file);
  }

  event.target.value = "";
};


document.getElementById(
  "globalSearch"
).oninput = ()=>{

  if(currentView === "cards" || currentView === "editor"){
    renderCardList();
  }

};


document.getElementById(
  "cardTypeFilter"
).onchange =
  renderCardList;


document.getElementById(
  "relationFocus"
).onchange = ()=>{

  closeRelationDetail();

  initRelationNetwork();

};

document.getElementById("relationTypeFilter").onchange = ()=>{
  closeRelationDetail();
  renderRelationFilters();
  initRelationNetwork();
};

document.getElementById("relationSnapMode").onchange = event =>{
  db.settings.networkSnapMode = event.target.value;
  db.settings.networkSnap = event.target.value !== "off";
  saveDB();
  if(typeof networkRuntime.redraw === "function"){ networkRuntime.redraw(); }
  toast(event.target.value === "hex" ? "已开启六边形吸附" : event.target.value === "square" ? "已开启方形网格吸附" : "已关闭位置吸附");
};

document.getElementById("relationPrimaryFolder").onchange = event =>{
  db.settings.networkPrimaryFolderId = event.target.value;
  saveDB();
  if(db.settings.networkLayoutMode === "primary"){ resetRelationNetwork(); }
};

document.getElementById("relationLayoutMode").onchange = event =>{
  db.settings.networkLayoutMode = event.target.value;
  saveDB();
  resetRelationNetwork();
};


document.getElementById(
  "resetNetworkBtn"
).onclick =
  resetRelationNetwork;

document.getElementById("fitNetworkBtn").onclick = ()=>{
  if(typeof networkRuntime.fitAll === "function"){ networkRuntime.fitAll(); }
};

document.getElementById("centerPrimaryNetworkBtn").onclick = ()=>{
  if(typeof networkRuntime.centerPrimary === "function"){ networkRuntime.centerPrimary(); }
};

document.getElementById("resetNetworkZoomBtn").onclick = ()=>{
  if(typeof networkRuntime.resetZoom === "function"){ networkRuntime.resetZoom(); }
};


document.getElementById(
  "timelineCardFilter"
).onchange =
  renderGlobalTimeline;


document.getElementById(
  "timelineTagFilter"
).oninput =
  renderGlobalTimeline;


document.getElementById(
  "timelineLayoutMode"
).onchange =
  renderGlobalTimeline;


document.getElementById(
  "drawerMask"
).onclick = event =>{

  if(
    event.target.id
    ===
    "drawerMask"
  ){
    closeDrawer();
  }

};


document.getElementById(
  "modalMask"
).onclick = event =>{

  if(
    event.target.id
    ===
    "modalMask"
  ){
    closeModal();
  }

};


document.addEventListener(
  "click",
  event =>{

    if(!event.target.closest(".catalog-context-menu")){
      document.querySelector(".catalog-context-menu")?.remove();
    }

    if(!event.target.closest(".section-more-wrap")){
      document.querySelectorAll(".section-more-menu.open").forEach(menu => menu.classList.remove("open"));
    }

    const moduleMenu =
      document.getElementById(
        "moduleMenu"
      );

    if(
      moduleMenu
      &&
      !event.target.closest(
        ".module-add"
      )
    ){
      moduleMenu.classList.remove(
        "open"
      );
    }


    const basicMenu =
      document.getElementById(
        "basicAddMenu"
      );

    if(
      basicMenu
      &&
      !event.target.closest(
        ".basic-add-wrap"
      )
    ){
      basicMenu.classList.remove(
        "open"
      );
    }

  }
);


let networkResizeTimer = null;

window.addEventListener(
  "resize",
  ()=>{

    if(currentView !== "relations"){
      return;
    }

    clearTimeout(networkResizeTimer);
    networkResizeTimer = setTimeout(()=>{
      if(typeof networkRuntime.resize === "function"){
        networkRuntime.resize();
      }
    },160);

  }
);


/* =========================================================
   62. 初始示例
========================================================= */

function migrateLegacyCardTypes(){
  let changed = false;

  db.cards.forEach(card =>{
    if(card.type === "阵营" || card.type === "势力"){
      card.type = "组织";
      changed = true;
    }

    if(card.type === "世界观"){
      card.type = "其他";
      card.subtype = "其他";
      changed = true;
    }
  });

  (db.settings.catalogFolders || []).forEach(folder =>{
    if(folder.type === "阵营" || folder.type === "势力"){
      folder.type = "组织";
      changed = true;
    }
  });

  if(changed){
    saveDB();
  }
}

/* =========================================================
   63. 初始化
========================================================= */

async function startApplication(){
  try{
    db = await loadDB();
  }catch(error){
    console.error("初始化世界观数据失败",error);
    db = blankDB();
    alert("读取本地资料失败，请使用此前导出的 JSON 备份恢复数据。");
  }

  migrateLegacyCardTypes();
  renderTypeFilter();
  refreshGlobalSelectors();
  document.querySelector(".inner").classList.add("card-workspace-mode");
  document.querySelector(".content").classList.add("card-workspace-content");
  renderCardList();

  if(window.__worldStorageMigrated){
    toast("本地资料已升级到大容量存储");
  }
}

startApplication();
