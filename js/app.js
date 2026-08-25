"use strict";


/* =========================================================
   01. 常量
========================================================= */

const CARD_TYPES = {

  "角色":[
    "角色"
  ],

  "势力":[
    "公司",
    "机构",
    "组织",
    "帮派",
    "家族",
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
  "势力":["位置","创始人","创立时间","部门"],
  "地区":["区划","生态"],
  "事件":["参与者","发生地点","事件经过","影响"],
  "其他":[]
};


const COMMON_MODULE_TYPES = [
  "关系",
  "事件",
  "时间轴",
  "地图",
  "图片",
  "自定义"
];


const GENERIC_MODULE_SCHEMAS = {
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
    {key:"relatedCardId",label:"参与者",type:"card",cardTypes:["角色","势力"]},
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
  "势力":"#a69ac7",
  "地区":"#8eb89b",
  "事件":"#caa174",
  "其他":"#b88d8d"
};


/* =========================================================
   02. 运行状态
========================================================= */

let db = loadDB();

let currentView = "cards";

let currentCardId = null;

let draggedModuleId = null;

let lastDeletedModule = null;

let heroImageIndex = 0;

let collapsedCatalogTypes = new Set();

let networkRuntime = {
  nodes:[],
  edges:[],
  dragging:null,
  dragOffset:{x:0,y:0},
  hoverNode:null,
  hoverEdge:null,
  positions:{}
};


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

      interest:"",

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
    if(!grouped.length){ return ""; }
    return `
      <section class="catalog-group ${collapsedCatalogTypes.has(type) ? "collapsed" : ""}">
        <button class="catalog-group-title" data-toggle-catalog="${escapeHTML(type)}">
          <span>${escapeHTML(type)}</span><span class="catalog-chevron">⌄</span>
        </button>
        <div class="catalog-group-items">
          ${grouped.map(card => `
            <button class="catalog-card ${card.id === currentCardId ? "active" : ""}" data-card-id="${card.id}">
              ${escapeHTML(card.name || "未命名")}
            </button>
          `).join("")}
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


  container
    .querySelectorAll(
      "[data-card-id]"
    )
    .forEach(
      cardElement =>{

        cardElement.onclick =
          event =>{

            openCardEditor(
              cardElement.dataset.cardId
            );

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


      <div class="field">

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
          placeholder="例如：陆黎"
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


    db.cards.push(card);

    saveDB();

    closeModal();

    refreshGlobalSelectors();

    openCardEditor(
      card.id
    );

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
                  <label><span>子类型</span><select id="editCardSubtype"></select></label>
                </div>
              </div>
              <div id="heroImageBox"></div>
            </div>

          </div>


        </div>

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


  const typeSelect =
    document.getElementById(
      "editCardType"
    );

  const subtypeSelect =
    document.getElementById(
      "editCardSubtype"
    );


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

      reader.onload = ()=>
        resolve(
          reader.result
        );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );

    }
  );

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
                        card.type === "势力"
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

                  const target =
                    getCard(
                      relation.toCardId
                    );

                  return `

                    <tr>

                      <td>

                        <button
                          class="relation-name-btn"
                          data-open-related-card="${relation.toCardId}"
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

  const sorted =
    [...module.items]
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
                  data-edit-timeline="${module.id}|${item.id}"
                >
                  编辑
                </button>

                <button
                  class="icon-btn danger"
                  data-remove-item="${module.id}|${item.id}"
                >
                  ×
                </button>

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
            moduleId,
            nodeId
          ] =
            button.dataset.editTimeline
            .split("|");


          openTimelineNodeDrawer(
            moduleId,
            nodeId
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

      orgCardId:""

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

    renderModules();

    toast(
      "关系已保存"
    );

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
  nodeId
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

      relatedCardIds:[]

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
        关联卡片
      </label>

      <div
        id="timelineRelatedCards"
        class="tag-list"
        style="margin-bottom:8px"
      ></div>


      <div class="inline-row">

        <select id="timelineRelatedSelect">

          <option value="">
            选择已有卡片
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

    const id =
      document.getElementById(
        "timelineRelatedSelect"
      ).value;


    if(
      id
      &&
      !node.relatedCardIds.includes(id)
    ){

      node.relatedCardIds.push(
        id
      );

      renderRelated();

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


    if(existing){

      Object.assign(
        existing,
        node
      );

    }else{

      module.items.push(
        node
      );

    }


    touchCard(card);

    closeDrawer();

    renderModules();

    refreshGlobalSelectors();

    toast(
      "时间节点已保存"
    );

  };


  renderRelated();

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
          node.sourceCardId
          ===
          cardFilter
          ||
          (
            node.relatedCardIds
            || []
          ).includes(
            cardFilter
          )
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

              ${escapeHTML(node.sourceCardName)}

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
      来源：
      ${escapeHTML(card.name)}
      /
      ${escapeHTML(module.title)}
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

      <button
        id="timelineOpenSourceCard"
        class="btn"
        style="width:100%"
      >
        打开「${escapeHTML(card.name)}」
      </button>

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
    "timelineOpenSourceCard"
  ).onclick = ()=>{

    closeTimelineDetail();

    openCardEditor(
      card.id
    );

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


  select.innerHTML = `
    <option value="">
      全部卡片
    </option>

    ${
      db.cards
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

function buildNetworkEdges(){

  const grouped =
    new Map();


  db.relations.forEach(
    relation =>{

      const key =
        relation.pairId
        ||
        [
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


      const forward =
        relations.find(
          item =>
            item.fromCardId === a
            &&
            item.toCardId === b
        );


      const reverse =
        relations.find(
          item =>
            item.fromCardId === b
            &&
            item.toCardId === a
        );


      return {

        id:key,

        a,

        b,

        forward,

        reverse

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


  const rect =
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


  let visibleIds;


  if(focus){

    visibleIds =
      new Set([
        focus
      ]);


    db.relations.forEach(
      relation =>{

        if(
          relation.fromCardId
          ===
          focus
        ){

          visibleIds.add(
            relation.toCardId
          );

        }


        if(
          relation.toCardId
          ===
          focus
        ){

          visibleIds.add(
            relation.fromCardId
          );

        }

      }
    );

  }else{

    visibleIds =
      new Set(
        db.cards.map(
          card =>
            card.id
        )
      );

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


        const position =
          saved
          ||
          {

            x:
              80
              +
              Math.random()
              *
              Math.max(
                100,
                rect.width - 160
              ),

            y:
              80
              +
              Math.random()
              *
              Math.max(
                100,
                rect.height - 160
              )

          };


        return {

          id:card.id,

          card,

          x:position.x,

          y:position.y

        };

      }
    );


  const edges =
    buildNetworkEdges()
    .filter(
      edge =>
        visibleIds.has(edge.a)
        &&
        visibleIds.has(edge.b)
    );


  networkRuntime = {

    nodes,

    edges,

    dragging:null,

    dragOffset:{
      x:0,
      y:0
    },

    hoverNode:null,

    hoverEdge:null,

    positions:
      db.settings
      .networkPositions

  };


  function nodeById(id){

    return nodes.find(
      node =>
        node.id === id
    );

  }


  function draw(){

    ctx.clearRect(
      0,
      0,
      rect.width,
      rect.height
    );


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


        const label =
          networkEdgeLabel(
            edge
          );


        if(label){

          const mx =
            (
              a.x
              +
              b.x
            )
            /
            2;

          const my =
            (
              a.y
              +
              b.y
            )
            /
            2;


          ctx.font =
            "11px sans-serif";


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
          15
          :
          12;


        ctx.beginPath();

        ctx.arc(
          node.x,
          node.y,
          radius,
          0,
          Math.PI * 2
        );


        ctx.fillStyle =
          NODE_COLORS[
            node.card.type
          ]
          ||
          "#8fa2ae";


        ctx.fill();


        ctx.strokeStyle =
          hovered
          ?
          "#315f79"
          :
          "rgba(61,94,112,.25)";


        ctx.lineWidth =
          hovered
          ?
          2.4
          :
          1.2;


        ctx.stroke();


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

  }


  function point(
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
        18 * 18
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


  canvas.onmousemove =
    event =>{

      const p =
        point(event);


      if(
        networkRuntime.dragging
      ){

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


        node.x =
          Math.max(
            30,
            Math.min(
              rect.width - 30,
              node.x
            )
          );


        node.y =
          Math.max(
            30,
            Math.min(
              rect.height - 30,
              node.y
            )
          );


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
        "default";


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


      if(node){

        networkRuntime.dragging =
          node;

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

      }

    };


  canvas.onmouseup =
    event =>{

      const p =
        point(event);


      if(
        networkRuntime.dragging
      ){

        const node =
          networkRuntime.dragging;


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


        networkRuntime.dragging =
          null;

        return;

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

        openCardEditor(
          node.card.id
        );

      }

    };


  draw();

}


/* =========================================================
   54. 关系网标签
========================================================= */

function networkEdgeLabel(
  edge
){

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


  return (
    forward
    ||
    reverse
    ||
    "关系"
  );

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


  const outgoing =
    relationsForCard(
      card.id
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

              const target =
                getCard(
                  relation.toCardId
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
      ↔
      ${escapeHTML(b.name)}
    </div>


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


document.getElementById("exportDataBtn").onclick = exportAllData;


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


document.getElementById(
  "resetNetworkBtn"
).onclick =
  resetRelationNetwork;


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


window.addEventListener(
  "resize",
  ()=>{

    if(
      currentView === "relations"
    ){

      initRelationNetwork();

    }

  }
);


/* =========================================================
   62. 初始示例
========================================================= */

function migrateLegacyCardTypes(){
  let changed = false;

  db.cards.forEach(card =>{
    if(card.type === "阵营"){
      card.type = "势力";
      changed = true;
    }

    if(card.type === "世界观"){
      card.type = "其他";
      card.subtype = "其他";
      changed = true;
    }
  });

  if(changed){
    saveDB();
  }
}

function seedDemoIfEmpty(){

  if(
    db.cards.length
  ){
    return;
  }


  const lu =
    createEmptyCard(
      "角色",
      "角色",
      "陆黎",
      ""
    );


  lu.basic.height =
    "171";


  const police =
    createEmptyCard(
      "势力",
      "机构",
      "南海市警局",
      ""
    );


  const city =
    createEmptyCard(
      "地区",
      "城市",
      "南海市",
      ""
    );


  db.cards.push(
    lu,
    police,
    city
  );


  const jobModule = {

    id:uid(),

    kind:"职务",

    title:"职务",

    collapsed:false,

    items:[

      {
        id:uid(),
        name:"州枪械处处长",
        orgCardId:
          police.id
      },

      {
        id:uid(),
        name:"副局长",
        orgCardId:
          police.id
      }

    ]

  };


  lu.modules.push(
    jobModule
  );


  saveDB();

}


/* =========================================================
   63. 初始化
========================================================= */

migrateLegacyCardTypes();

seedDemoIfEmpty();

renderTypeFilter();

refreshGlobalSelectors();

document.querySelector(".inner").classList.add("card-workspace-mode");
document.querySelector(".content").classList.add("card-workspace-content");

renderCardList();
