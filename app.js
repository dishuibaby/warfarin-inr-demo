const platforms = {
  wechat: { label: '微信小程序', cls: 'wechat', homeNav: '抗凝助手' },
  android: { label: 'Android', cls: 'android', homeNav: '抗凝助手' },
  ios: { label: 'iOS', cls: 'ios', homeNav: '抗凝助手' }
};

const tabs = [
  ['home', '首页', '⌂'],
  ['records', '记录', '☷'],
  ['inr', 'INR', '◷'],
  ['me', '我的', '⚙']
];

const routeMap = {
  home: '首页', records: '记录', inr: 'INR', me: '我的', login: '登录',
  'inr-settings': 'INR 设置', 'inr-methods': 'INR 设置', 'test-settings': 'INR 设置',
  'dose-settings': '服药设置', 'after-dose-rule': '服药设置', help: '使用帮助', account: '账号绑定', profile: '个人资料', notifications: '通知设置'
};

const latest = { value: 2.1, raw: 2.0, date: '2026/04/23', next: '2026/05/07', method: '指尖血 INR 仪' };
const inrRecords = [
  { date: '03/12', v: 1.6, raw: 1.5, method: '医院静脉血', note: '低于目标 0.2，强提示', s: 'danger' },
  { date: '03/19', v: 1.8, raw: 1.7, method: '指尖血', note: '目标内，接近下沿', s: 'ok' },
  { date: '03/26', v: 1.9, raw: 1.8, method: '指尖血', note: '稳定', s: 'ok' },
  { date: '04/02', v: 2.2, raw: 2.1, method: '指尖血', note: '稳定', s: 'ok' },
  { date: '04/09', v: 2.6, raw: 2.5, method: '指尖血', note: '高于上限 0.1，弱提示', s: 'soft' },
  { date: '04/16', v: 2.8, raw: 2.7, method: '医院静脉血', note: '高于上限 0.3，强提示', s: 'danger' },
  { date: '04/23', v: 2.1, raw: 2.0, method: '指尖血 INR 仪', note: '回到目标范围', s: 'ok' }
];

const medRecords = [
  { date: '04/19', day: '19', weekday: '日', time: '08:04', dose: '1.25 片', mg: '3.75mg', type: '按计划服用', status: '已完成', inr: null, raw: null },
  { date: '04/20', day: '20', weekday: '一', time: '07:58', dose: '1.5 片', mg: '4.5mg', type: '按计划服用', status: '已完成', inr: null, raw: null },
  { date: '04/21', day: '21', weekday: '二', time: '08:03', dose: '1.25 片', mg: '3.75mg', type: '手动确认', status: '已完成', inr: null, raw: null },
  { date: '04/22', day: '22', weekday: '三', time: '08:01', dose: '0 片', mg: '0mg', type: '停服', status: '停服', inr: null, raw: null },
  { date: '04/23', day: '23', weekday: '四', time: '08:03', dose: '1.25 片', mg: '3.75mg', type: '按计划服用', status: '已完成', inr: 'INR 2.1', raw: '校准前 2.0' }
];

function pathParts() { return location.pathname.split('/').filter(Boolean); }
function platformOf(parts) { return platforms[parts[0]] ? parts[0] : 'wechat'; }
function pageOf(parts) { return parts[1] || 'home'; }
function isSubpage(page) { return !['home', 'records', 'inr', 'me'].includes(page); }
function nav(platform, page) {
  return `<nav class="tabbar">${tabs.map(([id, label, icon]) => `<a class="${page === id ? 'on' : ''}" href="/${platform}/${id}/"><span>${icon}</span><span>${label}</span></a>`).join('')}</nav>`;
}
function renderTopBar(platform, title) {
  if (platform === 'ios') return `<div class="statusbar">9:41<span>Wi‑Fi 🔋</span></div><section class="ios-title noAction"><small>抗凝小助手</small><h1>${title}</h1></section>`;
  return `<div class="statusbar">9:41<span>${platform === 'wechat' ? '微信' : '5G'} ▰</span></div><div class="nav noAction"><button onclick="location.href='/'">‹</button><h2>${title}</h2><i></i></div>`;
}
function shell(platform, page, body) {
  const active = isSubpage(page) ? 'me' : page;
  return `<a class="backlink" href="/">← 总览</a><main class="app-shell"><section class="device ${platforms[platform].cls}"><div class="screen">${renderTopBar(platform, routeMap[page] || '抗凝助手')}<div class="content">${body}</div>${nav(platform, active)}</div></section></main>`;
}

function statusKind(value) {
  if (value < 1.7 || value > 2.6) return 'danger';
  if (value < 1.8 || value > 2.5) return 'soft';
  return 'ok';
}
function alertBox(kind = statusKind(latest.value)) {
  const data = kind === 'danger'
    ? ['必须关注', 'INR 明显异常', '超过目标范围 ±0.1 以上，首页首屏强提醒；建议复测并咨询医生。', '2.8']
    : kind === 'soft'
      ? ['轻度关注', 'INR 接近阈值', '接近目标边界，请按计划复测并持续记录。', '2.6']
      : ['当前稳定', 'INR 处于目标范围', '最近结果稳定，下次检测 05/07。', latest.value.toFixed(1)];
  return `<section class="alert ${kind}"><div><span class="badge">${data[0]}</span><h3>${data[1]}</h3><p>${data[2]}</p></div><strong>${data[3]}</strong></section>`;
}
function addInrButton(platform) { return `<button class="iconCta" onclick="showInrDialog('${platform}')">＋ INR</button>`; }
function inrCard(platform, kind = statusKind(latest.value)) {
  return `<section class="card inrCard ${kind}"><div class="sectionTitle"><div><h3>最新 INR <em class="targetInline">目标 1.8–2.5</em></h3><small>${latest.date} · ${latest.method}</small></div>${addInrButton(platform)}</div><div class="bigMetric inrMetric"><strong>${latest.value.toFixed(1)}</strong><em class="rawBeside">校准前 ${latest.raw.toFixed(1)}</em></div><div class="nextTest">下次检测：<b>${latest.next}</b> · 每 2 周</div><div class="homeReminder ${kind}"><b>超明显提醒</b><span>${kind === 'danger' ? 'INR 明显超出目标范围，请尽快复测并咨询医生。' : kind === 'soft' ? 'INR 接近目标边界，请继续观察并按周期复测。' : '状态稳定：保持当前记录节奏，到期检测。'}</span></div></section>`;
}
function statusClass(status) { return status === '停服' ? 'paused' : status === '漏服' ? 'missed' : 'done'; }
function home(platform) {
  return shell(platform, 'home', `
  <section class="heroDose card">
    <div class="doseHeroHead"><h3>今日服药</h3><span class="doseTime">08:00</span></div>
    <div class="doseAmount"><strong>1.25 片</strong><em>3.75mg</em></div><small>昨日服药量：1.5 片 · 状态：待完成</small>
    <div class="doseActions"><button class="btn primary doseDone" onclick="showDoseDialog()">完成服药</button><button class="btn dosePause">停服</button><button class="btn doseMiss">漏服</button></div>
  </section>
  ${inrCard(platform, 'ok')}
  ${trendCard()}
  ${doseSheet()}`);
}
function records(platform) {
  return shell(platform, 'records', `<section class="monthTimeline compactTimeline"><div class="monthHeader compactMonth"><span>2026年4月</span><em>共 5 条 · 最近在上</em></div><div class="timelineList compactList">${[...medRecords].reverse().map(r => `<article class="timelineItem compactItem ${statusClass(r.status)}"><div class="timelineDot ${statusClass(r.status)}"></div><div class="datePill"><strong>${r.day}</strong><span>周${r.weekday}</span></div><div class="compactMedCard"><div class="compactMedMain"><div><b>${r.dose}</b><small>${r.mg}</small></div><span class="medStatus ${statusClass(r.status)}">${r.status}</span></div><div class="compactMeta"><span>${r.time}</span><span>${r.type}</span><span>系统记录</span></div>${r.inr ? `<div class="compactInr"><b>${r.inr}</b><span>${r.raw}</span></div>` : ''}</div></article>`).join('')}</div></section>`);
}
function inr(platform) {
  return shell(platform, 'inr', `${alertBox('danger')}<section class="card"><div class="sectionTitle"><div><h3>INR 趋势</h3><small>校准后 / 校准前</small></div>${addInrButton(platform)}</div>${trendCard(true, false)}</section><section class="card"><div class="sectionTitle"><h3>INR 检测记录</h3><small>校准后为主，校准前作为参考</small></div><div class="list">${inrRecords.map(r => `<article class="record inrRecord"><div class="recordHead"><div><span class="recordDate">${r.date}</span><strong class="inrRecordValue">INR ${r.v.toFixed(1)}</strong></div><span class="status ${r.s}">${r.s === 'danger' ? '强提示' : r.s === 'soft' ? '弱提示' : '正常'}</span></div><p>${r.note}</p><small>校准前 ${r.raw.toFixed(1)} · ${r.method}</small></article>`).join('')}</div></section>${inrDialog(platform)}`);
}
function me(platform) {
  return shell(platform, 'me', `<section class="profile card"><div class="avatar">饼</div><div><h3>小饼</h3><p>目标 INR 1.8–2.5 · 华法林长期管理</p></div></section><section class="card"><div class="subpageLinks"><a href="/${platform}/inr-settings/">INR 设置 ›<small>检测方式、目标范围、偏移量、检测周期</small></a><a href="/${platform}/dose-settings/">服药设置 ›<small>药品、循环剂量、完成后规则</small></a><a href="/${platform}/notifications/">通知设置 ›<small>服药提醒、INR 检测提醒</small></a><a href="/${platform}/account/">账号绑定 ›<small>微信/手机号/Google/Apple</small></a><a href="/${platform}/profile/">个人资料 ›<small>年龄、性别、疾病类型</small></a><a href="/${platform}/help/">使用帮助 ›<small>新用户初始设置</small></a></div></section><section class="card"><div class="notice info"><strong>医疗边界</strong><span>本工具只做记录和提醒，剂量调整与异常 INR 处理请遵医嘱。</span></div></section>`);
}
function inrSettings(platform) {
  return shell(platform, 'inr-settings', `<section class="card settingsGroup"><h3>检测方式</h3>${settings([['默认方式', '指尖血 INR 仪（偏移 +0.22）'], ['医院静脉血', '偏移 0.00'], ['自定义方式', '可设置名称、备注、偏移量']])}<button class="btn primary full" onclick="openModal('methodDialog')">新增检测方式</button></section><section class="card settingsGroup"><h3>检测设置</h3>${settings([['目标范围', '1.8–2.5'], ['异常提醒', '接近边界提醒，明显异常重点提醒'], ['检测周期', '每 2 周，可按天/按周/按月'], ['下次检测', '2026/05/07']])}<button class="btn full" onclick="openModal('cycleDialog')">设置检测周期</button></section><section class="card"><div class="notice info"><strong>校正显示规则</strong><span>页面优先显示校正后 INR，校准前数值作为参考信息保留。</span></div></section>${methodDialog()}${cycleDialog()}`);
}
function inrMethods(platform) { return inrSettings(platform); }
function testSettings(platform) { return inrSettings(platform); }
function doseSettings(platform) {
  return shell(platform, 'dose-settings', `<section class="card settingsGroup"><h3>药品与单位</h3>${settings([['品牌', 'Marevan'], ['输入单位', '片 / 毫克，按品牌自动匹配'], ['默认服药时间', '08:00']])}</section><section class="card settingsGroup"><h3>循环剂量</h3><div class="doseLoop"><span>1.25 片</span><span>1.5 片</span><button onclick="openModal('dosePickerDialog')">＋ 设置剂量</button></div><p class="hint">支持添加 1–3 个剂量，按顺序循环。</p></section><section class="card settingsGroup"><h3>完成后规则</h3><div class="choiceGrid"><button class="choice on"><b>按计划服用</b><span>完成服药后自动带出明日循环剂量</span></button><button class="choice"><b>手动输入</b><span>完成后要求填写明日剂量</span></button></div></section>${dosePickerDialog()}`);
}
function afterDoseRule(platform) { return doseSettings(platform); }
function notifications(platform) {
  return shell(platform, 'notifications', `<section class="card settingsGroup"><h3>服药提醒</h3>${settings([['提醒时间', '08:00'], ['频率', '每天'], ['渠道', platform === 'wechat' ? '微信服务通知' : 'App Push']])}</section><section class="card settingsGroup"><h3>INR 检测提醒</h3>${settings([['提醒时间', '09:00'], ['频率', '按检测周期'], ['提前提醒', '检测前 1 天']])}</section>`);
}
function account(platform) {
  return shell(platform, 'account', `<section class="card settingsGroup"><h3>账号绑定</h3>${settings([['微信', platform === 'wechat' ? '已快捷登录' : '可绑定'], ['手机号', '未绑定'], ['Google', platform === 'android' ? '可绑定' : '不可用'], ['Apple', platform === 'ios' ? '可绑定' : '不可用']])}</section>`);
}
function profile(platform) {
  return shell(platform, 'profile', `<section class="card settingsGroup"><h3>个人资料</h3>${settings([['年龄', '39'], ['性别', '男'], ['疾病类型', '机械瓣置换 / 房颤 / 血栓史等可选']])}<button class="btn primary full">保存资料</button></section>`);
}
function help(platform) {
  return shell(platform, 'help', `<section class="card"><h3>使用说明</h3><ol class="help"><li>登录账号后可同步服药、INR 与提醒设置。</li><li>在“我的”中设置药品品牌、服药时间和循环剂量。</li><li>添加医院静脉血、指尖血等检测方式，并设置偏移量。</li><li>设置目标范围与检测周期。</li><li>每天完成服药后，系统记录操作时间并确认明日剂量。</li><li>检测 INR 后录入数值和检测方式，系统保存校正后结果。</li></ol></section>`);
}
function login(platform) {
  const providers = platform === 'wechat' ? ['微信快捷登录'] : platform === 'android' ? ['手机号', 'Google'] : ['手机号', 'Apple'];
  return shell(platform, 'login', `<section class="loginCard card"><h3>登录抗凝小助手</h3><p>同步服药、INR 与提醒设置。</p><div class="loginGrid">${providers.map(p => `<button><span>${p === '手机号' ? '☎' : p === 'Google' ? 'G' : p === 'Apple' ? '' : '微'}</span>${p}</button>`).join('')}</div><small>账号可在“我的-账号绑定”继续绑定微信、手机号、Google、Apple。</small></section>`);
}
function settings(rows) { return rows.map(([a, b]) => `<div class="setting"><span>${a}</span><em>${b}</em></div>`).join(''); }
function trendCard(wrapped = true, includeTitle = true) {
  const points = [
    [22,123,134,'danger','1.6','1.5'], [68,104,121,'ok','1.8','1.7'], [114,82,96,'ok','1.9','1.8'],
    [160,58,69,'ok','2.2','2.1'], [206,47,31,'soft','2.6','2.5'], [244,28,39,'danger','2.8','2.7'], [298,76,85,'ok','2.1','2.0']
  ];
  const labels = points.map(p => `<text class="nodeLabel calLabel" x="${p[0]}" y="${p[1]-10}">${p[4]}</text><text class="nodeLabel rawLabel" x="${p[0]}" y="${p[2]+18}">${p[5]}</text>`).join('');
  const dots = points.map(p => `<circle class="dot ${p[3]}" cx="${p[0]}" cy="${p[1]}" r="5.5"/>`).join('');
  const inner = `${includeTitle ? '<div class="sectionTitle"><h3>INR 趋势</h3><small>校准后 / 校准前</small></div>' : ''}<div class="chartBox valueChart"><div class="legend"><span><i class="cal"></i>校准后</span><span><i class="raw"></i>校准前</span><span><i class="high"></i>强异常</span><span><i class="low"></i>弱提示</span></div><svg viewBox="0 0 320 190" role="img" aria-label="INR 趋势"><path class="abnormalBand" d="M12 18H308V45H12Z M12 136H308V164H12Z"/><path class="range" d="M12 55H308V126H12Z"/><path class="grid" d="M12 25H308M12 55H308M12 90H308M12 126H308M12 156H308"/><text x="14" y="38" class="warnText">强提醒区</text><text x="14" y="152" class="warnText">强提醒区</text><path class="line raw" d="M22 134 C58 121,78 110,104 96 S150 69,174 82 S216 31,238 39 S276 73,298 85"/><path class="line cal" d="M22 123 C58 112,78 101,104 87 S150 60,174 73 S216 22,238 30 S276 64,298 76"/>${labels}${dots}</svg></div>`;
  return wrapped ? `<section class="card">${inner}</section>` : inner;
}
function methodDialog() { return `<section id="methodDialog" class="modalLayer" onclick="closeModal(event, 'methodDialog')"><div class="dialog card modalCard"><button class="modalClose" onclick="openModal('methodDialog', false)">×</button><div class="sectionTitle"><h3>新增检测方式</h3><small>不同检测设备可设置独立偏移量</small></div><label class="field"><span>方式名称</span><input value="家用指尖血 INR 仪" /></label><label class="field"><span>偏移量</span><input type="number" step="0.01" value="0.22" placeholder="例如 0.22 或 -0.10" /></label><label class="field"><span>备注</span><input value="同步时弱展示校准前值" /></label><button class="btn primary full">保存检测方式</button></div></section>`; }
function cycleDialog() { return `<section id="cycleDialog" class="modalLayer" onclick="closeModal(event, 'cycleDialog')"><div class="dialog card modalCard"><button class="modalClose" onclick="openModal('cycleDialog', false)">×</button><div class="sectionTitle"><h3>设置检测周期</h3><small>可按天、按周、按月自由设置，保存后自动计算下次检测日期</small></div><div class="cycleTabs"><button class="pickChip">按天</button><button class="pickChip on">按周</button><button class="pickChip">按月</button></div><label class="field"><span>间隔数值</span><input type="number" value="2" min="1" /></label><div class="dosePreview"><span>当前周期</span><strong>每 2 周</strong></div><button class="btn primary full">保存周期</button></div></section>`; }
function dosePickerDialog() { const ints = [1,2,3,4,5,6,7,8,9]; const fracs = ['0.25','0.75','⅓','三分之二','0.5']; return `<section id="dosePickerDialog" class="modalLayer" onclick="closeModal(event, 'dosePickerDialog')"><div class="dialog card dosePicker modalCard"><button class="modalClose" onclick="openModal('dosePickerDialog', false)">×</button><div class="sectionTitle"><h3>设置剂量</h3><small>弹窗选择整数片和小数片，组合成每日剂量</small></div><div class="pickerColumns"><div><b>整数片</b><div class="chipGrid">${ints.map(n => `<button class="pickChip ${n===1?'on':''}">${n}</button>`).join('')}</div></div><div><b>小数片</b><div class="chipGrid">${fracs.map((f,i) => `<button class="pickChip ${i===0?'on':''}">${f}</button>`).join('')}</div></div></div><div class="dosePreview"><span>当前选择</span><strong>1.25 片</strong></div><button class="btn primary full">保存剂量</button></div></section>`; }
function doseSheet(open = false) { return `<section id="doseDoneSheet" class="bottomSheet ${open ? 'open' : ''}"><div class="grab"></div><div class="sectionTitle"><h3>选择明日剂量</h3><small>系统记录当前操作时间作为服药时间</small></div><div class="choiceGrid tomorrowChoice"><button class="choice on"><b>按计划服用</b><span>明日 1.5 片 · 4.5mg</span></button><label class="choice manualDose"><b>手动输入</b><span>输入片或毫克</span><input aria-label="手动输入明日剂量" type="number" step="0.25" min="0" placeholder="如 1.25" /></label></div><button class="btn primary full">确认明日剂量</button></section>`; }
function inrDialog(platform) { return `<section class="dialogMask"><div class="dialog card"><div class="sectionTitle"><h3>记录 INR</h3><small>弹窗录入，检测方式用单选/下拉选择</small></div><label class="field"><span>检测方式</span><select><option>指尖血 INR 仪（偏移 +0.1）</option><option>医院静脉血（偏移 0.0）</option><option>其他方式</option></select></label><div class="methodRadios"><label><input type="radio" checked> 指尖血</label><label><input type="radio"> 医院静脉血</label></div>${settings([['录入值', '2.0（校准前）'], ['显示值', '2.1（校准后）']])}<button class="btn primary full">保存 INR</button></div></section>`; }

function openModal(id, show = true) {
  const el = document.getElementById(id);
  if (!el) return;
  if (id === 'doseDoneSheet') el.classList.toggle('open', show);
  else el.classList.toggle('show', show);
}
function closeModal(event, id) {
  if (event.target && event.target.id === id) openModal(id, false);
}
function showDoseDialog() { openModal('doseDoneSheet', true); }
function showInrDialog(platform) { location.href = `/${platform}/inr/`; }

function landing() {
  const routes = ['home', 'records', 'inr', 'me', 'login', 'inr-settings', 'dose-settings', 'notifications', 'account', 'profile', 'help'];
  const docLinks = [
    ['完整技术方案', '/docs/tech/technical-proposal/'],
    ['技术方案 .md 美化页', '/docs/tech/technical-proposal.md#preview'],
    ['UI 设计说明', '/docs/ui/README/'],
    ['README 完整版', '/README/']
  ];
  return `<main class="landing"><section class="hero"><div><p class="eyebrow">Warfarin INR Tracker</p><h1>抗凝小助手</h1><p class="lead">记录每日服药、INR 检测、提醒设置和长期趋势，帮助持续管理华法林抗凝治疗。</p></div><span class="chip">目标 INR 1.8–2.5</span></section><section class="doc-links"><div><h2>完整版本文档</h2><p>技术方案与 UI 说明均支持美观预览；需要原始 Markdown 时可在文档页点击查看。</p></div><div>${docLinks.map(([label, href]) => `<a href="${href}">${label}<span>›</span></a>`).join('')}</div></section><section class="platform-grid">${Object.entries(platforms).map(([k, p]) => `<article class="platform-card"><h2>${p.label}</h2><p>${k === 'wechat' ? '微信快捷登录，适合日常快速记录。' : '适合手机端长期记录和提醒。'}</p><div class="route-links">${routes.map(id => `<a href="/${k}/${id}/">${routeMap[id]}<span>›</span></a>`).join('')}</div></article>`).join('')}</section></main>`;
}
function render() {
  const doRender = () => {
    const parts = pathParts(); const platform = platformOf(parts); const page = pageOf(parts);
    const pages = { home, records, inr, me, login, 'inr-settings': inrSettings, 'inr-methods': inrMethods, 'test-settings': testSettings, 'dose-settings': doseSettings, 'after-dose-rule': afterDoseRule, notifications, account, profile, help };
    const html = !parts.length ? landing() : (pages[page] ? pages[page](platform) : landing());
    document.getElementById('app').innerHTML = html;
  };
  if (window.HermesMarkdownPreview && (document.getElementById('md-source') || (/\.md$/i.test(location.pathname) && !/[?&]raw=1\b/.test(location.search)))) {
    window.HermesMarkdownPreview.boot().then((handled) => { if (!handled) doRender(); });
    return;
  }
  doRender();
}
render();
