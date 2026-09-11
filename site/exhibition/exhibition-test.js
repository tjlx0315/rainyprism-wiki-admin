const DEFAULT_ROLES = ["陆黎", "魏舒桐", "顾遥洲", "姜徕", "林典", "顾南风"];

const FALLBACK_DATA = {
  version: 1,
  site: {
    title: "展览",
    eyebrow: "02｜EXHIBITION ARCHIVE",
    statement: "We look.\nWe connect.\nWe feel alive.",
    homeFeaturedWorkIds: []
  },
  roles: DEFAULT_ROLES,
  series: [
    {
      id: "series-gaze",
      title: "人物与目光",
      year: "2026",
      description: "关于人物、注视与彼此抵达的一组角色约稿。",
      roles: ["陆黎", "魏舒桐"],
      coverId: "work-gaze-01",
      relatedMerchId: "merch-gaze",
      works: [
        { id: "work-gaze-01", title: "目光之一", image: "", alt: "人物与目光系列作品", roles: ["陆黎"], span: 4, ratio: "1 / 1", angle: "138deg", x: "28%", y: "22%" },
        { id: "work-gaze-02", title: "目光之二", image: "", alt: "人物与目光系列作品", roles: ["魏舒桐"], span: 3, ratio: "3 / 4", angle: "212deg", x: "62%", y: "31%" },
        { id: "work-gaze-03", title: "并肩", image: "", alt: "人物与目光系列作品", roles: ["陆黎", "魏舒桐"], span: 4, ratio: "1 / 1", angle: "166deg", x: "45%", y: "20%" }
      ]
    },
    {
      id: "series-rain",
      title: "雨中的花",
      year: "2025",
      description: "朋友的赠图、合作与发生在雨中的片刻。",
      roles: ["顾遥洲"],
      coverId: "work-rain-01",
      relatedMerchId: "",
      works: [
        { id: "work-rain-01", title: "花枝", image: "", alt: "雨中的花系列作品", roles: ["顾遥洲"], span: 7, ratio: "5 / 4", angle: "118deg", x: "72%", y: "38%" },
        { id: "work-rain-02", title: "留住一场雨", image: "", alt: "雨中的花系列作品", roles: ["顾遥洲"], span: 5, ratio: "4 / 5", angle: "245deg", x: "36%", y: "52%" }
      ]
    },
    {
      id: "series-footnote",
      title: "世界的注脚",
      year: "2026",
      description: "文字、图像与视觉设计的交叠实验。",
      roles: [],
      coverId: "work-footnote-01",
      relatedMerchId: "",
      works: [
        { id: "work-footnote-01", title: "注脚", image: "", alt: "世界的注脚系列作品", roles: [], span: 12, ratio: "3 / 2", angle: "152deg", x: "54%", y: "24%" }
      ]
    }
  ],
  merchandise: [
    {
      id: "merch-gaze",
      title: "人物与目光｜周边",
      description: "从系列原画延伸出的纸品与小型周边。",
      relatedSeriesIds: ["series-gaze"],
      items: [
        { id: "merch-gaze-01", title: "纸品样本", image: "", alt: "人物与目光系列周边", span: 5, ratio: "4 / 5", angle: "196deg", x: "58%", y: "24%" }
      ]
    }
  ]
};

const params = new URLSearchParams(location.search);
const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
const isAdmin = params.get("manage") === "1" && isLocalHost;

const els = {
  catalog: document.querySelector("#catalog"),
  count: document.querySelector("#result-count"),
  label: document.querySelector("#result-label"),
  empty: document.querySelector("#empty-state"),
  search: document.querySelector("#series-search"),
  title: document.querySelector("#site-title"),
  eyebrow: document.querySelector("#site-eyebrow"),
  statement: document.querySelector("#site-statement"),
  adminDock: document.querySelector("#admin-dock"),
  localBadge: document.querySelector("#local-badge"),
  saveStatus: document.querySelector("#save-status"),
  statusDot: document.querySelector("#status-dot"),
  drawer: document.querySelector("#editor-drawer"),
  drawerBackdrop: document.querySelector("#drawer-backdrop"),
  drawerTitle: document.querySelector("#drawer-title"),
  editorForm: document.querySelector("#editor-form"),
  imageInput: document.querySelector("#image-input"),
  toastRegion: document.querySelector("#toast-region")
};

let archiveData = structuredClone(FALLBACK_DATA);
let currentView = "series";
let currentRole = "全部角色";
let activeDetail = null;
let uploadTarget = null;
let saveTimer = null;
let draggedWork = null;
let draggedSeriesId = null;
let selectedImage = null;

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => value.trim()).filter(Boolean))];
}

function splitList(value) {
  return unique(String(value || "").split(/[，,、｜|]/));
}

function normalizeRole(role) {
  const value = String(role || "").trim();
  return value === "陆絮" ? "陆黎" : value;
}

function normalizeData(input) {
  const normalized = input && typeof input === "object" ? input : {};
  normalized.version = 1;
  normalized.site = { ...FALLBACK_DATA.site, ...(normalized.site || {}) };
  normalized.roles = Array.isArray(normalized.roles) ? unique(normalized.roles.map(normalizeRole)) : [];
  normalized.series = Array.isArray(normalized.series) ? normalized.series : [];
  normalized.merchandise = Array.isArray(normalized.merchandise) ? normalized.merchandise : [];
  normalized.series.forEach((series) => {
    series.id ||= uid("series");
    series.title ||= "未命名系列";
    series.creditLabel ||= "备注";
    series.credit ||= "";
    series.roles = Array.isArray(series.roles) ? unique(series.roles.map(normalizeRole)) : [];
    series.works = Array.isArray(series.works) ? series.works : [];
    series.works.forEach((work) => normalizeItem(work, series.title));
    const sharedRatio = series.works[0]?.ratio || "1 / 1";
    series.works.forEach((work) => { work.ratio = sharedRatio; });
  });
  normalized.merchandise.forEach((merch) => {
    merch.id ||= uid("merch");
    merch.title ||= "未命名周边";
    merch.relatedSeriesIds = Array.isArray(merch.relatedSeriesIds) ? merch.relatedSeriesIds : [];
    merch.items = Array.isArray(merch.items) ? merch.items : [];
    merch.items.forEach((item) => normalizeItem(item, merch.title));
  });
  const workIds = normalized.series.flatMap((series) => series.works.map((work) => work.id));
  const selectedIds = Array.isArray(normalized.site.homeFeaturedWorkIds) ? normalized.site.homeFeaturedWorkIds : [];
  normalized.site.homeFeaturedWorkIds = unique([...selectedIds.filter((id) => workIds.includes(id)), ...workIds]).slice(0, 3);
  normalized.roles = unique([
    ...DEFAULT_ROLES,
    ...normalized.roles,
    ...normalized.series.flatMap((series) => series.roles),
    ...normalized.series.flatMap((series) => series.works.flatMap((work) => work.roles || []))
  ]);
  return normalized;
}

function normalizeItem(item, fallbackTitle) {
  item.id ||= uid("image");
  item.title ||= fallbackTitle || "未命名作品";
  item.image ||= "";
  item.alt ||= item.title;
  item.roles = Array.isArray(item.roles) ? unique(item.roles.map(normalizeRole)) : [];
  item.span = Number(item.span) || 4;
  item.ratio ||= "1 / 1";
  item.angle ||= `${120 + Math.floor(Math.random() * 120)}deg`;
  item.x ||= "38%";
  item.y ||= "28%";
}

async function loadData() {
  const endpoint = isAdmin ? "/api/draft" : `exhibition-data.json?v=${Date.now()}`;
  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    archiveData = normalizeData(await response.json());
  } catch (error) {
    archiveData = normalizeData(structuredClone(FALLBACK_DATA));
    if (isAdmin) toast("未能读取本地草稿，已载入示例内容。请确认管理器正在运行。");
  }
  render();
}

function coverForSeries(series) {
  return series.works.find((work) => work.id === series.coverId) || series.works[0] || null;
}

function coverForMerch(merch) {
  return merch.items[0] || null;
}

function artwork(item, className) {
  if (item?.image) {
    return `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.title)}" loading="lazy" />`;
  }
  const style = item
    ? `--angle:${escapeHtml(item.angle)};--x:${escapeHtml(item.x)};--y:${escapeHtml(item.y)}`
    : "--angle:145deg;--x:28%;--y:30%";
  return `<span class="placeholder-art ${className || ""}" style="${style}" aria-hidden="true"></span>`;
}

function editAttrs(entity, field, id = "", ownerId = "", kind = "", multiline = false) {
  if (!isAdmin) return "";
  return `contenteditable="true" spellcheck="false" data-inline-entity="${entity}" data-inline-field="${field}" data-inline-id="${escapeHtml(id)}" data-inline-owner-id="${escapeHtml(ownerId)}" data-inline-kind="${kind}" data-multiline="${multiline}" data-placeholder="点击输入"`;
}

function seriesCard(series, index) {
  const cover = coverForSeries(series);
  return `
    <article class="series-card" data-series-id="${escapeHtml(series.id)}" draggable="${isAdmin}">
      <button class="series-cover" type="button" data-action="open-series" data-id="${escapeHtml(series.id)}" data-kind="series" data-owner-id="${escapeHtml(series.id)}" data-work-id="${escapeHtml(cover?.id || "")}" style="--angle:${escapeHtml(cover?.angle || "145deg")};--x:${escapeHtml(cover?.x || "28%")};--y:${escapeHtml(cover?.y || "30%")}" aria-label="进入${escapeHtml(series.title)}系列">
        ${artwork(cover)}
        <span class="cover-index">${String(index + 1).padStart(2, "0")}</span>
        ${isAdmin ? '<span class="direct-edit-hint">点击进入系列</span>' : ""}
      </button>
      <div class="card-copy">
        <h2 ${editAttrs("series", "title", series.id)}>${escapeHtml(series.title)}</h2>
        <small>${String(series.works.length).padStart(2, "0")}</small>
      </div>
      ${isAdmin ? `<div class="series-admin-row"><button class="card-action" type="button" data-action="open-series" data-id="${escapeHtml(series.id)}">进入系列</button><button class="card-action" type="button" data-action="replace-cover" data-kind="series" data-owner-id="${escapeHtml(series.id)}" data-work-id="${escapeHtml(cover?.id || "")}">更换封面</button><button class="card-action" type="button" data-action="delete-series" data-id="${escapeHtml(series.id)}">删除系列</button></div>` : ""}
    </article>`;
}

function merchCard(merch, index) {
  const cover = coverForMerch(merch);
  return `
    <article class="merch-card" data-merch-id="${escapeHtml(merch.id)}">
      <button class="merch-cover" type="button" data-action="open-merch" data-id="${escapeHtml(merch.id)}" data-kind="merch" data-owner-id="${escapeHtml(merch.id)}" data-work-id="${escapeHtml(cover?.id || "")}" style="--angle:${escapeHtml(cover?.angle || "178deg")};--x:${escapeHtml(cover?.x || "42%")};--y:${escapeHtml(cover?.y || "26%")}" aria-label="进入${escapeHtml(merch.title)}周边栏目">
        ${artwork(cover)}
        <span class="cover-index">M${String(index + 1).padStart(2, "0")}</span>
        ${isAdmin ? '<span class="direct-edit-hint">点击进入栏目 · 右键更换封面</span>' : ""}
      </button>
      <div class="card-copy">
        <h2 ${editAttrs("merch", "title", merch.id)}>${escapeHtml(merch.title)}</h2>
        <small>${String(merch.items.length).padStart(2, "0")} ITEMS</small>
        <p ${editAttrs("merch", "description", merch.id, "", "", true)}>${escapeHtml(merch.description || "")}</p>
      </div>
      ${isAdmin ? `<div class="series-admin-row"><button class="card-action" type="button" data-action="open-merch" data-id="${escapeHtml(merch.id)}">进入栏目</button><button class="card-action" type="button" data-action="replace-cover" data-kind="merch" data-owner-id="${escapeHtml(merch.id)}" data-work-id="${escapeHtml(cover?.id || "")}">更换封面</button><button class="card-action" type="button" data-action="delete-merch" data-id="${escapeHtml(merch.id)}">删除周边</button></div>` : ""}
    </article>`;
}

function galleryItem(item, ownerId, kind) {
  const isSelected = selectedImage?.kind === kind && selectedImage?.ownerId === ownerId && selectedImage?.workId === item.id;
  return `
    <article class="gallery-item ${isSelected ? "is-selected" : ""}" data-owner-id="${escapeHtml(ownerId)}" data-kind="${kind}" data-work-id="${escapeHtml(item.id)}" ${isAdmin ? 'draggable="true"' : ""}>
      <div class="gallery-image" data-action="select-image" data-kind="${kind}" data-owner-id="${escapeHtml(ownerId)}" data-work-id="${escapeHtml(item.id)}" style="--ratio:${escapeHtml(item.ratio || "1 / 1")};--angle:${escapeHtml(item.angle || "145deg")};--x:${escapeHtml(item.x || "28%")};--y:${escapeHtml(item.y || "30%")}">
        ${artwork(item)}
        ${isAdmin ? `<span class="direct-edit-hint">${isSelected ? "再点一次替换图片" : "点击选择图片"}</span>` : ""}
        ${isAdmin ? `<div class="image-admin-controls">
          <div class="control-cluster"><button class="drag-handle" type="button" aria-label="拖动排序" title="拖动排序">↕</button></div>
          <div class="control-cluster"><button type="button" data-action="replace-image" aria-label="替换图片">↺</button><button type="button" data-action="delete-image" aria-label="删除图片">×</button></div>
        </div>` : ""}
      </div>
      <div class="gallery-copy"><h3 ${editAttrs("image", "title", item.id, ownerId, kind)}>${escapeHtml(item.title)}</h3><small ${editAttrs("image", "roles", item.id, ownerId, kind)}>${escapeHtml((item.roles || []).join("｜") || "IMAGE")}</small></div>
    </article>`;
}

function ratioToNumber(ratio) {
  const parts = String(ratio || "1").split("/").map(Number);
  const value = parts.length === 2 && parts[1] ? parts[0] / parts[1] : Number(ratio);
  return Number.isFinite(value) ? value : 1;
}

function setItemRatio(kind, ownerId, workId, ratio, shouldRender = true) {
  const { list, item } = findItem(kind, ownerId, workId);
  if (!item) return;
  if (kind === "series") list.forEach((work) => { work.ratio = ratio; });
  else item.ratio = ratio;
  if (shouldRender) render();
  setDirty("图片比例已调整，正在保存…");
}

function ratioEditor(ownerId, kind) {
  if (!isAdmin) return "";
  const selected = selectedImage?.kind === kind && selectedImage?.ownerId === ownerId
    ? findItem(kind, ownerId, selectedImage.workId).item
    : null;
  if (!selected) return '<div class="ratio-editor is-empty"><span>选择一张图片后，可在这里调整长宽比例。</span></div>';
  const numeric = ratioToNumber(selected.ratio);
  return `<div class="ratio-editor" data-ratio-owner="${escapeHtml(ownerId)}" data-ratio-kind="${kind}" data-ratio-work="${escapeHtml(selected.id)}">
    <div class="ratio-heading"><span>${kind === "series" ? "本系列图片比例" : "所选图片比例"}</span><b data-ratio-label>${numeric.toFixed(2)}</b></div>
    <div class="ratio-presets" aria-label="常用图片比例">
      ${[["1 / 1", "1:1"], ["4 / 5", "4:5"], ["3 / 2", "3:2"]].map(([ratio, label]) => `<button type="button" class="${selected.ratio === ratio ? "is-active" : ""}" data-action="set-ratio" data-kind="${kind}" data-owner-id="${escapeHtml(ownerId)}" data-work-id="${escapeHtml(selected.id)}" data-ratio="${ratio}">${label}</button>`).join("")}
    </div>
    <label class="ratio-range"><span>自定义</span><input type="range" min="0.6" max="1.8" step="0.01" value="${numeric}" data-ratio-range data-kind="${kind}" data-owner-id="${escapeHtml(ownerId)}" data-work-id="${escapeHtml(selected.id)}" /></label>
    <small>${kind === "series" ? "六张图片共用同一比例，调整一次会同步全部图片。" : "滑块只改变所选图片的长宽比例，不改变网格列数。"}</small>
  </div>`;
}

function seriesDetail(series) {
  const merch = archiveData.merchandise.find((item) => item.id === series.relatedMerchId);
  const roleTags = isAdmin
    ? `<span class="meta-label">角色</span><span class="inline-role-editor" ${editAttrs("series", "roles", series.id)}>${escapeHtml(series.roles.join("，"))}</span>`
    : series.roles.map((role) => `<span>${escapeHtml(role)}</span>`).join("");
  const credit = isAdmin || series.credit
    ? `<div class="series-credit"><span ${editAttrs("series", "creditLabel", series.id)}>${escapeHtml(series.creditLabel || "备注")}</span><p ${editAttrs("series", "credit", series.id, "", "", true)}>${escapeHtml(series.credit || "")}</p></div>`
    : "";
  return `
    <section class="series-detail" id="series-detail-${escapeHtml(series.id)}">
      <div class="series-detail-header">
        <div><span class="eyebrow">SERIES · <span ${editAttrs("series", "year", series.id)}>${escapeHtml(series.year || "—")}</span></span><h2 ${editAttrs("series", "title", series.id)}>${escapeHtml(series.title)}</h2><p class="series-detail-intro" ${editAttrs("series", "description", series.id, "", "", true)}>${escapeHtml(series.description || "")}</p>${roleTags ? `<div class="card-tags">${roleTags}</div>` : ""}${credit}</div>
        <button class="card-action close-detail" type="button" data-action="close-detail">← 返回全部系列</button>
      </div>
      <div class="gallery-grid">${series.works.map((item) => galleryItem(item, series.id, "series")).join("")}</div>
      ${ratioEditor(series.id, "series")}
      ${isAdmin ? `<button class="upload-drop" type="button" data-action="add-images" data-kind="series" data-id="${escapeHtml(series.id)}"><span><strong>＋ 添加图片</strong><small>上传后可拖动排序；点击图片选中，再点一次即可替换</small></span></button>` : ""}
      ${merch ? `<div class="related-merch"><span>这个系列还有延伸周边</span><button type="button" data-action="show-related-merch" data-id="${escapeHtml(merch.id)}">查看「${escapeHtml(merch.title)}」→</button></div>` : ""}
    </section>`;
}

function merchDetail(merch) {
  const related = archiveData.series.filter((series) => merch.relatedSeriesIds.includes(series.id));
  return `
    <section class="series-detail" id="merch-detail-${escapeHtml(merch.id)}">
      <div class="series-detail-header">
        <div><span class="eyebrow">MERCHANDISE</span><h2 ${editAttrs("merch", "title", merch.id)}>${escapeHtml(merch.title)}</h2><p class="series-detail-intro" ${editAttrs("merch", "description", merch.id, "", "", true)}>${escapeHtml(merch.description || "")}</p></div>
        <button class="card-action close-detail" type="button" data-action="close-detail">← 返回全部周边</button>
      </div>
      <div class="gallery-grid">${merch.items.map((item) => galleryItem(item, merch.id, "merch")).join("")}</div>
      ${ratioEditor(merch.id, "merch")}
      ${isAdmin ? `<button class="upload-drop" type="button" data-action="add-images" data-kind="merch" data-id="${escapeHtml(merch.id)}"><span><strong>＋ 添加周边图片</strong><small>图片仅保存在本地草稿中，发布后访客才会看到</small></span></button>` : ""}
      ${related.length ? `<div class="related-merch"><span>来源系列</span><span>${related.map((series) => escapeHtml(series.title)).join("｜")}</span></div>` : ""}
    </section>`;
}

function filteredSeries() {
  const query = els.search.value.trim().toLocaleLowerCase("zh-CN");
  return archiveData.series.filter((series) => {
    const roleMatch = currentRole === "全部角色" || series.roles.includes(currentRole) || series.works.some((work) => (work.roles || []).includes(currentRole));
    const haystack = [series.title, series.description, series.year, ...series.roles].join(" ").toLocaleLowerCase("zh-CN");
    return roleMatch && (!query || haystack.includes(query));
  });
}

function render() {
  els.title.textContent = archiveData.site.title;
  els.eyebrow.textContent = archiveData.site.eyebrow;
  els.statement.innerHTML = escapeHtml(archiveData.site.statement).replaceAll("\n", "<br>");
  if (isAdmin) {
    [
      [els.title, "title", false],
      [els.eyebrow, "eyebrow", false],
      [els.statement, "statement", true]
    ].forEach(([node, field, multiline]) => {
      node.contentEditable = "true";
      node.spellcheck = false;
      node.dataset.inlineEntity = "site";
      node.dataset.inlineField = field;
      node.dataset.multiline = String(multiline);
      node.dataset.placeholder = "点击输入";
    });
  }
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.view === currentView));

  if (currentView === "merchandise") renderMerchandise();
  else if (currentView === "roles") renderRoles();
  else renderSeries();
}

function renderSeries() {
  const series = filteredSeries();
  els.label.textContent = els.search.value.trim() ? "查找结果" : "全部系列";
  els.count.textContent = String(series.length).padStart(2, "0");
  els.empty.hidden = series.length > 0;
  const detail = activeDetail?.kind === "series" ? archiveData.series.find((item) => item.id === activeDetail.id) : null;
  els.catalog.innerHTML = detail ? seriesDetail(detail) : `<div class="catalog-grid">${series.map(seriesCard).join("")}</div>`;
}

function renderRoles() {
  const roles = unique(["全部角色", ...archiveData.roles]);
  const series = filteredSeries();
  els.label.textContent = currentRole;
  els.count.textContent = String(series.length).padStart(2, "0");
  els.empty.hidden = series.length > 0;
  const detail = activeDetail?.kind === "series" ? archiveData.series.find((item) => item.id === activeDetail.id) : null;
  els.catalog.innerHTML = detail ? seriesDetail(detail) : `<section class="role-index"><div class="role-chips">${roles.map((role) => `<button class="chip ${role === currentRole ? "is-active" : ""}" type="button" data-action="role-filter" data-role="${escapeHtml(role)}">${escapeHtml(role)}</button>`).join("")}</div><p class="role-intro">角色是一种交叉索引：同一张图可以同时出现在不同角色之下。</p><div class="catalog-grid role-results">${series.map(seriesCard).join("")}</div></section>`;
}

function renderMerchandise() {
  const query = els.search.value.trim().toLocaleLowerCase("zh-CN");
  const merchandise = archiveData.merchandise.filter((merch) => !query || [merch.title, merch.description].join(" ").toLocaleLowerCase("zh-CN").includes(query));
  els.label.textContent = "周边档案";
  els.count.textContent = String(merchandise.length).padStart(2, "0");
  els.empty.hidden = merchandise.length > 0;
  const detail = activeDetail?.kind === "merch" ? archiveData.merchandise.find((item) => item.id === activeDetail.id) : null;
  els.catalog.innerHTML = detail ? merchDetail(detail) : `<div class="catalog-grid">${merchandise.map(merchCard).join("")}</div>`;
}

function setDirty(message = "正在保存草稿…") {
  if (!isAdmin) return;
  clearTimeout(saveTimer);
  els.saveStatus.textContent = message;
  els.saveStatus.parentElement.className = "admin-status is-saving";
  saveTimer = setTimeout(saveDraft, 420);
}

async function saveDraft() {
  try {
    const response = await fetch("/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(archiveData)
    });
    if (!response.ok) throw new Error(await response.text());
    els.saveStatus.textContent = "草稿已保存";
    els.saveStatus.parentElement.className = "admin-status";
  } catch (error) {
    els.saveStatus.textContent = "保存失败";
    els.saveStatus.parentElement.className = "admin-status is-error";
    toast("草稿保存失败，请确认本地管理器仍在运行。");
  }
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  els.toastRegion.append(node);
  setTimeout(() => {
    node.classList.add("is-leaving");
    setTimeout(() => node.remove(), 220);
  }, 2800);
}

function openDrawer(title, html, onSubmit) {
  els.drawerTitle.textContent = title;
  els.editorForm.innerHTML = html;
  els.editorForm.onsubmit = async (event) => {
    event.preventDefault();
    await onSubmit(new FormData(els.editorForm), event.submitter);
  };
  els.drawerBackdrop.hidden = false;
  requestAnimationFrame(() => els.drawerBackdrop.classList.add("is-visible"));
  els.drawer.classList.add("is-open");
  els.drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  setTimeout(() => els.editorForm.querySelector("input, textarea, select")?.focus(), 100);
}

function closeDrawer() {
  els.drawer.classList.remove("is-open");
  els.drawer.setAttribute("aria-hidden", "true");
  els.drawerBackdrop.classList.remove("is-visible");
  document.body.classList.remove("drawer-open");
  setTimeout(() => { els.drawerBackdrop.hidden = true; }, 190);
}

function formActions({ allowDelete = false } = {}) {
  return `<div class="form-actions">${allowDelete ? '<button class="editor-button danger" type="submit" name="intent" value="delete">删除</button>' : ""}<button class="editor-button" type="button" data-action="close-drawer">取消</button><button class="editor-button primary" type="submit" name="intent" value="save">保存</button></div>`;
}

function editSite() {
  openDrawer("页面文字", `
    <label class="field"><span>页面标题</span><input name="title" value="${escapeHtml(archiveData.site.title)}" required /></label>
    <label class="field"><span>英文眉题</span><input name="eyebrow" value="${escapeHtml(archiveData.site.eyebrow)}" /></label>
    <label class="field"><span>右侧文案</span><textarea name="statement">${escapeHtml(archiveData.site.statement)}</textarea><small>换行会保留在访客页面中。</small></label>
    ${formActions()}`,
  (form) => {
    archiveData.site.title = form.get("title").trim();
    archiveData.site.eyebrow = form.get("eyebrow").trim();
    archiveData.site.statement = form.get("statement").trim();
    closeDrawer(); render(); setDirty();
  });
}

function editSeries(seriesId = null) {
  const existing = archiveData.series.find((item) => item.id === seriesId);
  const series = existing || { id: uid("series"), title: "", year: new Date().getFullYear().toString(), description: "", roles: [], coverId: "", relatedMerchId: "", works: [] };
  const coverOptions = series.works.map((work) => `<option value="${escapeHtml(work.id)}" ${work.id === series.coverId ? "selected" : ""}>${escapeHtml(work.title)}</option>`).join("");
  const merchOptions = archiveData.merchandise.map((merch) => `<option value="${escapeHtml(merch.id)}" ${merch.id === series.relatedMerchId ? "selected" : ""}>${escapeHtml(merch.title)}</option>`).join("");
  openDrawer(existing ? "编辑系列" : "新建系列", `
    <label class="field"><span>系列名称</span><input name="title" value="${escapeHtml(series.title)}" required /></label>
    <div class="form-grid"><label class="field"><span>年份</span><input name="year" value="${escapeHtml(series.year)}" /></label><label class="field"><span>系列封面</span><select name="coverId"><option value="">第一张图片</option>${coverOptions}</select></label></div>
    <label class="field"><span>系列说明</span><textarea name="description">${escapeHtml(series.description)}</textarea></label>
    <label class="field"><span>角色标签</span><input name="roles" value="${escapeHtml(series.roles.join("，"))}" placeholder="陆黎，魏舒桐" /><small>用逗号分隔，一个系列可以关联多个角色。</small></label>
    <label class="field"><span>关联周边</span><select name="relatedMerchId"><option value="">暂不关联</option>${merchOptions}</select></label>
    ${formActions({ allowDelete: Boolean(existing) })}`,
  (form, submitter) => {
    if (submitter?.value === "delete") {
      if (!confirm(`确定删除系列“${series.title}”吗？图片文件不会自动删除。`)) return;
      archiveData.series = archiveData.series.filter((item) => item.id !== series.id);
      if (activeDetail?.id === series.id) activeDetail = null;
    } else {
      series.title = form.get("title").trim();
      series.year = form.get("year").trim();
      series.description = form.get("description").trim();
      series.roles = splitList(form.get("roles"));
      series.coverId = form.get("coverId");
      series.relatedMerchId = form.get("relatedMerchId");
      archiveData.roles = unique([...archiveData.roles, ...series.roles]);
      if (!existing) archiveData.series.push(series);
      activeDetail = { kind: "series", id: series.id };
    }
    closeDrawer(); render(); setDirty();
  });
}

function chooseSeriesCover(seriesId) {
  const series = archiveData.series.find((item) => item.id === seriesId);
  if (!series) return;
  if (!series.works.length) {
    toast("这个系列还没有图片，请先进入系列添加图片。");
    return;
  }
  openDrawer("选择系列封面", `
    <p class="config-state">从“${escapeHtml(series.title)}”已有的图片中选择一张封面。</p>
    <div class="cover-choice-grid">
      ${series.works.map((work) => `
        <button class="cover-choice ${work.id === series.coverId ? "is-current" : ""}" type="button" data-action="set-series-cover" data-id="${escapeHtml(series.id)}" data-work-id="${escapeHtml(work.id)}">
          <span class="cover-choice-image">${artwork(work)}</span>
          <span>${escapeHtml(work.title || "未命名图片")}</span>
          ${work.id === series.coverId ? "<small>当前封面</small>" : ""}
        </button>`).join("")}
    </div>
    <div class="form-actions"><button class="editor-button" type="button" data-action="close-drawer">取消</button></div>`,
  () => {});
}

function allSeriesWorks() {
  return archiveData.series.flatMap((series) => series.works.map((work) => ({ ...work, seriesTitle: series.title })));
}

function editHomeFeatured() {
  const works = allSeriesWorks().filter((work) => work.image);
  const selected = archiveData.site.homeFeaturedWorkIds || [];
  const slots = selected.map((id, index) => {
    const work = works.find((item) => item.id === id);
    return `<div class="home-featured-slot"><small>展示位 ${String(index + 1).padStart(2, "0")}</small><strong>${escapeHtml(work?.title || "未选择")}</strong><div class="home-featured-order"><button type="button" data-action="move-home-featured" data-id="${escapeHtml(id)}" data-direction="-1" aria-label="向前移动" ${index === 0 ? "disabled" : ""}>←</button><button type="button" data-action="move-home-featured" data-id="${escapeHtml(id)}" data-direction="1" aria-label="向后移动" ${index === selected.length - 1 ? "disabled" : ""}>→</button></div></div>`;
  }).join("");
  openDrawer("首页展示图", `
    <p class="config-state">按 01、02、03 的顺序展示在首页。点击图片可选中或取消；同一张图不会重复出现。</p>
    <div class="home-featured-slots">${slots}</div>
    <div class="cover-choice-grid">
      ${works.map((work) => {
        const index = selected.indexOf(work.id);
        return `<button class="cover-choice home-featured-choice ${index >= 0 ? "is-current" : ""}" type="button" data-action="toggle-home-featured" data-id="${escapeHtml(work.id)}"><span class="cover-choice-image">${artwork(work)}</span><span>${escapeHtml(work.title)}</span><small>${escapeHtml(work.seriesTitle)}</small>${index >= 0 ? `<b class="home-featured-choice-index">${index + 1}</b>` : ""}</button>`;
      }).join("") || '<p class="config-state">还没有可用于首页展示的作品图片。</p>'}
    </div>
    <div class="form-actions"><button class="editor-button primary" type="button" data-action="close-drawer">完成</button></div>`,
  () => {});
}

function toggleHomeFeatured(workId) {
  const selected = archiveData.site.homeFeaturedWorkIds || [];
  const index = selected.indexOf(workId);
  if (index >= 0) selected.splice(index, 1);
  else if (selected.length < 3) selected.push(workId);
  else { toast("首页最多展示三张图片，请先取消一张。"); return; }
  archiveData.site.homeFeaturedWorkIds = selected;
  setDirty("首页展示图已更新，正在保存…");
  editHomeFeatured();
}

function moveHomeFeatured(workId, direction) {
  const selected = archiveData.site.homeFeaturedWorkIds || [];
  const from = selected.indexOf(workId);
  const to = from + Number(direction);
  if (from < 0 || to < 0 || to >= selected.length) return;
  [selected[from], selected[to]] = [selected[to], selected[from]];
  setDirty("首页展示顺序已更新，正在保存…");
  editHomeFeatured();
}

function reorderSeries(targetSeriesId) {
  if (!draggedSeriesId || draggedSeriesId === targetSeriesId) return;
  const fromIndex = archiveData.series.findIndex((item) => item.id === draggedSeriesId);
  const targetIndex = archiveData.series.findIndex((item) => item.id === targetSeriesId);
  if (fromIndex < 0 || targetIndex < 0) return;
  const [series] = archiveData.series.splice(fromIndex, 1);
  const insertIndex = archiveData.series.findIndex((item) => item.id === targetSeriesId);
  archiveData.series.splice(insertIndex, 0, series);
  render();
  setDirty("系列顺序已调整，正在保存…");
}

function editMerch(merchId = null) {
  const existing = archiveData.merchandise.find((item) => item.id === merchId);
  const merch = existing || { id: uid("merch"), title: "", description: "", relatedSeriesIds: [], items: [] };
  const seriesChecks = archiveData.series.map((series) => `<label class="field" style="display:flex;grid-template-columns:auto 1fr;align-items:center"><input style="width:auto" type="checkbox" name="relatedSeriesIds" value="${escapeHtml(series.id)}" ${merch.relatedSeriesIds.includes(series.id) ? "checked" : ""} /><span>${escapeHtml(series.title)}</span></label>`).join("");
  openDrawer(existing ? "编辑周边" : "新建周边", `
    <label class="field"><span>周边栏目名称</span><input name="title" value="${escapeHtml(merch.title)}" required /></label>
    <label class="field"><span>栏目说明</span><textarea name="description">${escapeHtml(merch.description)}</textarea></label>
    <span class="field-label">关联原画系列</span><div>${seriesChecks || '<p class="config-state">请先建立一个系列。</p>'}</div>
    ${formActions({ allowDelete: Boolean(existing) })}`,
  (form, submitter) => {
    if (submitter?.value === "delete") {
      if (!confirm(`确定删除周边栏目“${merch.title}”吗？`)) return;
      archiveData.merchandise = archiveData.merchandise.filter((item) => item.id !== merch.id);
      archiveData.series.forEach((series) => { if (series.relatedMerchId === merch.id) series.relatedMerchId = ""; });
      if (activeDetail?.id === merch.id) activeDetail = null;
    } else {
      merch.title = form.get("title").trim();
      merch.description = form.get("description").trim();
      merch.relatedSeriesIds = form.getAll("relatedSeriesIds");
      if (!existing) archiveData.merchandise.push(merch);
      merch.relatedSeriesIds.forEach((seriesId) => {
        const series = archiveData.series.find((item) => item.id === seriesId);
        if (series && !series.relatedMerchId) series.relatedMerchId = merch.id;
      });
      activeDetail = { kind: "merch", id: merch.id };
      currentView = "merchandise";
    }
    closeDrawer(); render(); setDirty();
  });
}

function findItem(kind, ownerId, workId) {
  const owner = kind === "series"
    ? archiveData.series.find((item) => item.id === ownerId)
    : archiveData.merchandise.find((item) => item.id === ownerId);
  const list = kind === "series" ? owner?.works : owner?.items;
  return { owner, list, item: list?.find((work) => work.id === workId) };
}

function editImage(kind, ownerId, workId) {
  const { item } = findItem(kind, ownerId, workId);
  if (!item) return;
  openDrawer("编辑图片", `
    <label class="field"><span>图片标题</span><input name="title" value="${escapeHtml(item.title)}" required /></label>
    <label class="field"><span>图片说明（无障碍文本）</span><input name="alt" value="${escapeHtml(item.alt || item.title)}" /></label>
    <label class="field"><span>角色标签</span><input name="roles" value="${escapeHtml((item.roles || []).join("，"))}" /></label>
    <div class="form-grid"><label class="field"><span>画面比例</span><select name="ratio">${["1 / 1", "4 / 5", "3 / 4", "3 / 2", "5 / 4"].map((ratio) => `<option ${item.ratio === ratio ? "selected" : ""}>${ratio}</option>`).join("")}</select></label><label class="field"><span>网格宽度</span><select name="span">${[3, 4, 5, 6, 8, 12].map((span) => `<option value="${span}" ${Number(item.span) === span ? "selected" : ""}>${span} / 12</option>`).join("")}</select></label></div>
    ${formActions()}`,
  (form) => {
    item.title = form.get("title").trim();
    item.alt = form.get("alt").trim();
    item.roles = splitList(form.get("roles"));
    item.ratio = form.get("ratio");
    item.span = Number(form.get("span"));
    archiveData.roles = unique([...archiveData.roles, ...item.roles]);
    closeDrawer(); render(); setDirty();
  });
}

async function editPublishSettings() {
  let config = { owner: "", repo: "", branch: "main", basePath: "", configured: false };
  try {
    const response = await fetch("/api/config");
    if (response.ok) config = await response.json();
  } catch {}
  openDrawer("发布设置", `
    <p class="config-state">${config.configured ? "已保存 GitHub 发布凭据。Token 不会显示，也不会进入访客网页。" : "尚未连接线上仓库。此时“发布”只会更新硬盘中的访客数据。"}</p>
    <label class="field"><span>GitHub 用户名或组织</span><input name="owner" value="${escapeHtml(config.owner || "")}" placeholder="例如 tjlx0315" required /></label>
    <label class="field"><span>仓库名称</span><input name="repo" value="${escapeHtml(config.repo || "")}" placeholder="例如 rainy-prism-home" required /></label>
    <div class="form-grid"><label class="field"><span>分支</span><input name="branch" value="${escapeHtml(config.branch || "main")}" /></label><label class="field"><span>站点所在目录</span><input name="basePath" value="${escapeHtml(config.basePath || "")}" placeholder="根目录请留空" /></label></div>
    <label class="field"><span>GitHub Fine-grained Token</span><input name="token" type="password" autocomplete="off" placeholder="${config.configured ? "留空则保留原 Token" : "仅保存在这块硬盘"}" ${config.configured ? "" : "required"} /><small>Token 只需要目标仓库 Contents 的读写权限。</small></label>
    ${formActions()}`,
  async (form) => {
    const response = await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    if (!response.ok) { toast(`发布设置保存失败：${await response.text()}`); return; }
    closeDrawer(); toast("发布设置已安全保存在本地。");
  });
}

async function publish() {
  if (!confirm("确认把当前草稿发布给访客吗？")) return;
  const button = document.querySelector('[data-action="publish"]');
  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = "正在发布…";
  try {
    await saveDraft();
    const response = await fetch("/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(archiveData) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "发布失败");
    toast(result.github ? "已发布并同步到 GitHub，访客页面即将更新。" : "已更新硬盘中的访客页面；连接 GitHub 后可自动上线。");
  } catch (error) {
    toast(`发布失败：${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

function focusInline(selector) {
  requestAnimationFrame(() => {
    const target = document.querySelector(selector);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      target?.focus();
      if (target) document.getSelection()?.selectAllChildren(target);
    }, 260);
  });
}

function createSeriesInline() {
  const works = DEFAULT_ROLES.map((role, index) => ({
    id: uid("image"),
    title: role,
    image: "",
    alt: `${role}的系列作品`,
    roles: [role],
    ratio: "1 / 1",
    span: 4,
    angle: `${132 + index * 17}deg`,
    x: `${28 + (index % 3) * 15}%`,
    y: `${22 + (index % 2) * 16}%`
  }));
  const series = {
    id: uid("series"),
    title: "新系列",
    year: String(new Date().getFullYear()),
    description: "点击这里输入系列说明。",
    creditLabel: "备注",
    credit: "",
    roles: [...DEFAULT_ROLES],
    coverId: works[0].id,
    relatedMerchId: "",
    works
  };
  archiveData.series.push(series);
  currentView = "series";
  currentRole = "全部角色";
  activeDetail = { kind: "series", id: series.id };
  selectedImage = { kind: "series", ownerId: series.id, workId: works[0].id };
  render();
  setDirty("新系列已建立，正在保存…");
  focusInline(`[data-inline-entity="series"][data-inline-field="title"][data-inline-id="${CSS.escape(series.id)}"]`);
}

function createMerchInline() {
  const merch = {
    id: uid("merch"),
    title: "新周边栏目",
    description: "点击这里输入周边说明。",
    relatedSeriesIds: [],
    items: []
  };
  archiveData.merchandise.push(merch);
  currentView = "merchandise";
  activeDetail = { kind: "merch", id: merch.id };
  render();
  setDirty("新周边栏目已建立，正在保存…");
  focusInline(`[data-inline-entity="merch"][data-inline-field="title"][data-inline-id="${CSS.escape(merch.id)}"]`);
}

function deleteSeries(seriesId) {
  const series = archiveData.series.find((item) => item.id === seriesId);
  if (!series || !confirm(`确定删除系列“${series.title}”吗？图片文件不会自动删除。`)) return;
  archiveData.series = archiveData.series.filter((item) => item.id !== seriesId);
  archiveData.merchandise.forEach((merch) => { merch.relatedSeriesIds = merch.relatedSeriesIds.filter((id) => id !== seriesId); });
  if (activeDetail?.id === seriesId) activeDetail = null;
  render(); setDirty();
}

function deleteMerch(merchId) {
  const merch = archiveData.merchandise.find((item) => item.id === merchId);
  if (!merch || !confirm(`确定删除周边栏目“${merch.title}”吗？`)) return;
  archiveData.merchandise = archiveData.merchandise.filter((item) => item.id !== merchId);
  archiveData.series.forEach((series) => { if (series.relatedMerchId === merchId) series.relatedMerchId = ""; });
  if (activeDetail?.id === merchId) activeDetail = null;
  render(); setDirty();
}

function beginUpload(kind, id, workId = "") {
  uploadTarget = { kind, id, workId };
  els.imageInput.value = "";
  els.imageInput.click();
}

async function uploadFiles(files) {
  if (!uploadTarget || !files.length) return;
  const owner = uploadTarget.kind === "series"
    ? archiveData.series.find((item) => item.id === uploadTarget.id)
    : archiveData.merchandise.find((item) => item.id === uploadTarget.id);
  if (!owner) return;
  const list = uploadTarget.kind === "series" ? owner.works : owner.items;
  const selectedFiles = uploadTarget.workId ? files.slice(0, 1) : files;
  els.saveStatus.textContent = uploadTarget.workId ? "正在替换图片…" : `正在上传 ${selectedFiles.length} 张图片…`;
  els.saveStatus.parentElement.className = "admin-status is-saving";
  for (const file of selectedFiles) {
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "上传失败");
      const existing = uploadTarget.workId ? list.find((item) => item.id === uploadTarget.workId) : null;
      if (existing) {
        existing.image = result.path;
        existing.alt ||= existing.title;
      } else {
        const item = { id: uid("image"), title: file.name.replace(/\.[^.]+$/, ""), image: result.path, alt: file.name.replace(/\.[^.]+$/, ""), roles: [], span: 4, ratio: "1 / 1" };
        normalizeItem(item, owner.title);
        list.push(item);
        if (uploadTarget.kind === "series" && !owner.coverId) owner.coverId = item.id;
      }
    } catch (error) {
      toast(`${file.name} 上传失败：${error.message}`);
    }
  }
  activeDetail = { kind: uploadTarget.kind === "series" ? "series" : "merch", id: uploadTarget.id };
  if (uploadTarget.workId) selectedImage = { kind: uploadTarget.kind, ownerId: uploadTarget.id, workId: uploadTarget.workId };
  render(); setDirty();
}

function deleteItem(kind, ownerId, workId) {
  const { owner, list, item } = findItem(kind, ownerId, workId);
  if (!owner || !item || !confirm(`确定从展览中移除“${item.title}”吗？`)) return;
  const index = list.indexOf(item);
  list.splice(index, 1);
  if (kind === "series" && owner.coverId === workId) owner.coverId = list[0]?.id || "";
  render(); setDirty();
}

function reorderWork(targetElement) {
  if (!draggedWork) return;
  const target = {
    kind: targetElement.dataset.kind,
    ownerId: targetElement.dataset.ownerId,
    workId: targetElement.dataset.workId
  };
  if (target.kind !== draggedWork.kind || target.ownerId !== draggedWork.ownerId || target.workId === draggedWork.workId) return;
  const { list, item } = findItem(draggedWork.kind, draggedWork.ownerId, draggedWork.workId);
  const targetIndex = list.findIndex((work) => work.id === target.workId);
  list.splice(list.indexOf(item), 1);
  list.splice(targetIndex, 0, item);
  render(); setDirty("顺序已调整，正在保存…");
}

function updateInlineValue(node) {
  if (!isAdmin) return;
  const value = node.innerText.replace(/\u00a0/g, " ").trim();
  const { inlineEntity: entity, inlineField: field, inlineId: id, inlineOwnerId: ownerId, inlineKind: kind } = node.dataset;
  if (entity === "site") {
    archiveData.site[field] = value;
  } else if (entity === "series") {
    const series = archiveData.series.find((item) => item.id === id);
    if (!series) return;
    series[field] = field === "roles" ? splitList(value) : value;
    if (field === "roles") archiveData.roles = unique([...archiveData.roles, ...series.roles]);
  } else if (entity === "merch") {
    const merch = archiveData.merchandise.find((item) => item.id === id);
    if (!merch) return;
    merch[field] = value;
  } else if (entity === "image") {
    const { item } = findItem(kind, ownerId, id);
    if (!item) return;
    item[field] = field === "roles" ? splitList(value === "IMAGE" ? "" : value) : value;
    if (field === "roles") archiveData.roles = unique([...archiveData.roles, ...item.roles]);
  }
  setDirty("正在保存页面内修改…");
}

function hideContextMenu() {
  const menu = document.querySelector(".context-menu");
  if (!menu) return;
  menu.classList.add("is-leaving");
  setTimeout(() => menu.remove(), 130);
}

function showImageContextMenu(event, node) {
  hideContextMenu();
  const kind = node.dataset.kind;
  const ownerId = node.dataset.ownerId;
  const workId = node.dataset.workId;
  if (!kind || !ownerId) return;
  const isGalleryItem = node.classList.contains("gallery-image") && Boolean(workId);
  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.style.left = `${Math.min(event.clientX, window.innerWidth - 174)}px`;
  menu.style.top = `${Math.min(event.clientY, window.innerHeight - 190)}px`;
  menu.innerHTML = `
    <button type="button" data-action="replace-image" data-kind="${escapeHtml(kind)}" data-owner-id="${escapeHtml(ownerId)}" data-work-id="${escapeHtml(workId || "")}"><span>替换图片</span><span>↺</span></button>
    ${isGalleryItem ? `<button type="button" data-action="set-ratio" data-ratio="1 / 1" data-kind="${escapeHtml(kind)}" data-owner-id="${escapeHtml(ownerId)}" data-work-id="${escapeHtml(workId)}"><span>正方形</span><span>1:1</span></button><button type="button" data-action="set-ratio" data-ratio="4 / 5" data-kind="${escapeHtml(kind)}" data-owner-id="${escapeHtml(ownerId)}" data-work-id="${escapeHtml(workId)}"><span>竖幅</span><span>4:5</span></button><button type="button" data-action="set-ratio" data-ratio="3 / 2" data-kind="${escapeHtml(kind)}" data-owner-id="${escapeHtml(ownerId)}" data-work-id="${escapeHtml(workId)}"><span>横幅</span><span>3:2</span></button><button class="danger" type="button" data-action="delete-image" data-kind="${escapeHtml(kind)}" data-owner-id="${escapeHtml(ownerId)}" data-work-id="${escapeHtml(workId)}"><span>移除图片</span><span>×</span></button>` : ""}`;
  document.body.append(menu);
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".context-menu")) hideContextMenu();
  if (event.target.closest('[contenteditable="true"]')) return;
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    currentView = viewButton.dataset.view;
    activeDetail = null;
    selectedImage = null;
    if (currentView !== "roles") currentRole = "全部角色";
    render();
    return;
  }
  const actionNode = event.target.closest("[data-action]");
  if (!actionNode) return;
  const { action, id, kind, role } = actionNode.dataset;
  if (action === "clear-search") { els.search.value = ""; render(); }
  if (action === "open-series") {
    const owner = archiveData.series.find((item) => item.id === id);
    activeDetail = { kind: "series", id };
    selectedImage = owner?.works[0] ? { kind: "series", ownerId: id, workId: owner.works[0].id } : null;
    render();
    setTimeout(() => document.querySelector(`#series-detail-${CSS.escape(id)}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  if (action === "open-merch") {
    const owner = archiveData.merchandise.find((item) => item.id === id);
    activeDetail = { kind: "merch", id };
    selectedImage = owner?.items[0] ? { kind: "merch", ownerId: id, workId: owner.items[0].id } : null;
    render();
  }
  if (action === "close-detail") { activeDetail = null; selectedImage = null; render(); }
  if (action === "role-filter") { currentRole = role; activeDetail = null; selectedImage = null; render(); }
  if (action === "show-related-merch") {
    const owner = archiveData.merchandise.find((item) => item.id === id);
    currentView = "merchandise";
    activeDetail = { kind: "merch", id };
    selectedImage = owner?.items[0] ? { kind: "merch", ownerId: id, workId: owner.items[0].id } : null;
    render();
    setTimeout(() => document.querySelector(`#merch-detail-${CSS.escape(id)}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  if (!isAdmin) return;
  if (action === "add-series") createSeriesInline();
  if (action === "add-merch") createMerchInline();
  if (action === "delete-series") deleteSeries(id);
  if (action === "delete-merch") deleteMerch(id);
  if (action === "add-images") beginUpload(kind, id);
  if (action === "replace-cover") {
    if (kind === "series") chooseSeriesCover(actionNode.dataset.ownerId);
    else beginUpload(kind, actionNode.dataset.ownerId, actionNode.dataset.workId);
  }
  if (action === "set-series-cover") {
    const series = archiveData.series.find((item) => item.id === id);
    if (!series?.works.some((work) => work.id === actionNode.dataset.workId)) return;
    series.coverId = actionNode.dataset.workId;
    closeDrawer();
    render();
    setDirty("封面已更换，正在保存…");
  }
  if (action === "edit-home-featured") editHomeFeatured();
  if (action === "toggle-home-featured") toggleHomeFeatured(id);
  if (action === "move-home-featured") moveHomeFeatured(id, actionNode.dataset.direction);
  if (action === "replace-image") {
    const card = actionNode.closest(".gallery-item");
    beginUpload(actionNode.dataset.kind || card?.dataset.kind, actionNode.dataset.ownerId || card?.dataset.ownerId, actionNode.dataset.workId || card?.dataset.workId);
  }
  if (action === "select-image") {
    const target = { kind: actionNode.dataset.kind, ownerId: actionNode.dataset.ownerId, workId: actionNode.dataset.workId };
    if (selectedImage?.kind === target.kind && selectedImage?.ownerId === target.ownerId && selectedImage?.workId === target.workId) beginUpload(target.kind, target.ownerId, target.workId);
    else { selectedImage = target; render(); }
  }
  if (action === "set-ratio") {
    selectedImage = { kind: actionNode.dataset.kind, ownerId: actionNode.dataset.ownerId, workId: actionNode.dataset.workId };
    setItemRatio(actionNode.dataset.kind, actionNode.dataset.ownerId, actionNode.dataset.workId, actionNode.dataset.ratio);
  }
  if (action === "publish-settings") editPublishSettings();
  if (action === "publish") publish();
  if (action === "close-drawer") closeDrawer();
  if (action === "delete-image") {
    const card = actionNode.closest(".gallery-item");
    const targetKind = actionNode.dataset.kind || card?.dataset.kind;
    const targetOwner = actionNode.dataset.ownerId || card?.dataset.ownerId;
    const targetWork = actionNode.dataset.workId || card?.dataset.workId;
    if (!targetKind || !targetOwner || !targetWork) return;
    deleteItem(targetKind, targetOwner, targetWork);
  }
});

document.addEventListener("input", (event) => {
  const ratioInput = event.target.closest("[data-ratio-range]");
  if (ratioInput) {
    const ratio = Number(ratioInput.value).toFixed(2);
    setItemRatio(ratioInput.dataset.kind, ratioInput.dataset.ownerId, ratioInput.dataset.workId, ratio, false);
    ratioInput.closest(".ratio-editor")?.querySelector("[data-ratio-label]")?.replaceChildren(document.createTextNode(ratio));
    const selector = ratioInput.dataset.kind === "series"
      ? `.gallery-item[data-kind="series"][data-owner-id="${CSS.escape(ratioInput.dataset.ownerId)}"] .gallery-image`
      : `.gallery-item[data-kind="${CSS.escape(ratioInput.dataset.kind)}"][data-owner-id="${CSS.escape(ratioInput.dataset.ownerId)}"][data-work-id="${CSS.escape(ratioInput.dataset.workId)}"] .gallery-image`;
    document.querySelectorAll(selector).forEach((card) => card.style.setProperty("--ratio", ratio));
    return;
  }
  const editable = event.target.closest("[data-inline-entity]");
  if (editable) updateInlineValue(editable);
});

document.addEventListener("contextmenu", (event) => {
  if (!isAdmin) return;
  const image = event.target.closest(".gallery-image, .merch-cover");
  if (!image) return;
  event.preventDefault();
  const card = image.closest(".gallery-item");
  if (card) {
    image.dataset.kind = card.dataset.kind;
    image.dataset.ownerId = card.dataset.ownerId;
    image.dataset.workId = card.dataset.workId;
  }
  showImageContextMenu(event, image);
});

els.search.addEventListener("input", () => { activeDetail = null; selectedImage = null; render(); });
els.imageInput.addEventListener("change", () => uploadFiles([...els.imageInput.files]));
els.drawerBackdrop.addEventListener("click", closeDrawer);

document.addEventListener("keydown", (event) => {
  const editable = event.target.closest('[contenteditable="true"]');
  if (editable && event.key === "Enter" && editable.dataset.multiline !== "true") {
    event.preventDefault();
    editable.blur();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    els.search.focus();
  }
  if (event.key === "Escape" && els.drawer.classList.contains("is-open")) closeDrawer();
});

document.addEventListener("dragstart", (event) => {
  if (!isAdmin) return;
  const seriesCard = event.target.closest(".series-card");
  if (seriesCard) {
    draggedSeriesId = seriesCard.dataset.seriesId;
    seriesCard.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    return;
  }
  const card = event.target.closest(".gallery-item");
  if (!card) return;
  draggedWork = { kind: card.dataset.kind, ownerId: card.dataset.ownerId, workId: card.dataset.workId };
  card.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
});
document.addEventListener("dragover", (event) => {
  const seriesCard = event.target.closest(".series-card");
  if (seriesCard && draggedSeriesId) {
    event.preventDefault();
    document.querySelectorAll(".series-drop-before").forEach((node) => node.classList.remove("series-drop-before"));
    seriesCard.classList.add("series-drop-before");
    return;
  }
  const card = event.target.closest(".gallery-item");
  if (!card || !draggedWork) return;
  event.preventDefault();
  document.querySelectorAll(".drop-before").forEach((node) => node.classList.remove("drop-before"));
  card.classList.add("drop-before");
});
document.addEventListener("drop", (event) => {
  const seriesCard = event.target.closest(".series-card");
  if (seriesCard && draggedSeriesId) {
    event.preventDefault();
    reorderSeries(seriesCard.dataset.seriesId);
    return;
  }
  const card = event.target.closest(".gallery-item");
  if (!card) return;
  event.preventDefault();
  reorderWork(card);
});
document.addEventListener("dragend", () => {
  document.querySelectorAll(".is-dragging,.drop-before,.series-drop-before").forEach((node) => node.classList.remove("is-dragging", "drop-before", "series-drop-before"));
  draggedWork = null;
  draggedSeriesId = null;
});

if (isAdmin) {
  document.body.classList.add("is-admin");
  els.adminDock.hidden = false;
  els.localBadge.hidden = false;
}

loadData();
