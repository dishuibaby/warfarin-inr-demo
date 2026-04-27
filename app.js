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

const serverPayload = {
  settings: {
    targetInrMin: 1.8,
    targetInrMax: 2.5,
    defaultMedicationTime: '08:00',
    testCycle: { unit: 'week', interval: 2 },
    testMethods: ['hospital_lab', 'home_device'],
    inrOffset: 0.1,
    displayText: {
      locale: 'zh-CN',
      inrRangeTitle: '目标 INR 范围',
      inrRangeHint: '当前目标 1.8–2.5，异常提示按 ±0.1 分层',
      testMethodTitle: '检测方式',
      testMethodHint: '可选择医院静脉血、POCT 或家用指尖血设备',
      offsetTitle: '检测偏移量',
      offsetHint: '全站优先显示校正后 INR，校准前数值弱展示',
      cycleTitle: '检测周期',
      cycleHint: '每 2 周，可按天/按周/按月',
      medicationTimeTitle: '默认服药时间',
      saveAction: '保存设置'
    }
  },
  homeSummary: {
    prominentReminder: { level: 'normal', title: 'INR 处于目标范围', body: '状态稳定：保持当前记录节奏，到期检测。' },
    latestInr: { correctedValue: 2.1, rawValue: 2.0, offsetValue: 0.1, testMethod: 'home_device', testedAtLabel: '2026/04/23', displayText: { rawLabel: '校准前', methodLabel: '指尖血 INR 仪', statusLabel: '正常', note: '回到目标范围' } },
    nextTestAtLabel: '2026/05/07',
    todayMedication: { status: 'pending', plannedDoseTablets: 1.25, plannedDoseMg: '3.75mg', tomorrowPlannedDoseText: '明日 1.5 片 · 4.5mg' },
    displayText: {
      locale: 'zh-CN',
      latestInr: { label: '最新 INR', targetLabel: '目标 1.8–2.5', rawLabel: '校准前' },
      nextTest: { label: '下次检测', cycleText: '每 2 周' },
      todayMedication: { title: '今日服药', primaryAction: '完成服药', pauseAction: '停服', missAction: '漏服', yesterdayDoseText: '昨日服药量：1.5 片', statusText: '状态：待完成', tomorrowDoseTitle: '选择明日剂量', plannedDoseLabel: '按计划服用', manualDoseLabel: '手动输入', recordedAtHint: '系统记录当前操作时间作为服药时间', confirmAction: '确认明日剂量' },
      reminders: {
        normalBadge: '当前稳定',
        normalTitle: 'INR 处于目标范围',
        normalBody: '最近结果稳定，下次检测 05/07。',
        softBadge: '轻度关注',
        softTitle: 'INR 接近阈值',
        softBody: '接近目标边界，请按计划复测并持续记录。',
        strongBadge: '必须关注',
        strongTitle: 'INR 明显异常',
        strongBody: '超过目标范围 ±0.1 以上，首页首屏强提醒；建议复测并咨询医生。',
        homeTitle: '超明显提醒',
        softHomeBody: 'INR 接近目标边界，请继续观察并按周期复测。',
        strongHomeBody: 'INR 明显超出目标范围，请尽快复测并咨询医生。'
      }
    }
  },
  inrRecordsResponse: {
    displayText: {
      locale: 'zh-CN',
      trend: { title: 'INR 趋势', subtitle: '校正后 / 校准前', correctedSeriesLabel: '校准后', rawSeriesLabel: '校准前', strongLabel: '强异常', weakLabel: '弱提示' },
      recordLabels: { normal: '正常', weakLow: '弱提示', strongLow: '强提示', weakHigh: '弱提示', strongHigh: '强提示' },
      recordsTitle: 'INR 检测记录',
      recordsHint: '校准后为主，校准前作为参考'
    },
    records: [
      { date: '03/12', correctedValue: 1.6, rawValue: 1.5, displayText: { methodLabel: '医院静脉血', note: '低于目标 0.2，强提示', statusLabel: '强提示', rawLabel: '校准前' }, abnormalTier: 'strong_low', s: 'danger' },
      { date: '03/19', correctedValue: 1.8, rawValue: 1.7, displayText: { methodLabel: '指尖血', note: '目标内，接近下沿', statusLabel: '正常', rawLabel: '校准前' }, abnormalTier: 'normal', s: 'ok' },
      { date: '03/26', correctedValue: 1.9, rawValue: 1.8, displayText: { methodLabel: '指尖血', note: '稳定', statusLabel: '正常', rawLabel: '校准前' }, abnormalTier: 'normal', s: 'ok' },
      { date: '04/02', correctedValue: 2.2, rawValue: 2.1, displayText: { methodLabel: '指尖血', note: '稳定', statusLabel: '正常', rawLabel: '校准前' }, abnormalTier: 'normal', s: 'ok' },
      { date: '04/09', correctedValue: 2.6, rawValue: 2.5, displayText: { methodLabel: '指尖血', note: '高于上限 0.1，弱提示', statusLabel: '弱提示', rawLabel: '校准前' }, abnormalTier: 'weak_high', s: 'soft' },
      { date: '04/16', correctedValue: 2.8, rawValue: 2.7, displayText: { methodLabel: '医院静脉血', note: '高于上限 0.3，强提示', statusLabel: '强提示', rawLabel: '校准前' }, abnormalTier: 'strong_high', s: 'danger' },
      { date: '04/23', correctedValue: 2.1, rawValue: 2.0, displayText: { methodLabel: '指尖血 INR 仪', note: '回到目标范围', statusLabel: '正常', rawLabel: '校准前' }, abnormalTier: 'normal', s: 'ok' }
    ]
  },
  medicationRecords: [
    { date: '04/19', day: '19', weekday: '日', time: '08:04', dose: '1.25 片', mg: '3.75mg', type: '按计划服用', status: '已完成', inr: null, raw: null },
    { date: '04/20', day: '20', weekday: '一', time: '07:58', dose: '1.5 片', mg: '4.5mg', type: '按计划服用', status: '已完成', inr: null, raw: null },
    { date: '04/21', day: '21', weekday: '二', time: '08:03', dose: '1.25 片', mg: '3.75mg', type: '手动确认', status: '已完成', inr: null, raw: null },
    { date: '04/22', day: '22', weekday: '三', time: '08:01', dose: '0 片', mg: '0mg', type: '停服', status: '停服', inr: null, raw: null },
    { date: '04/23', day: '23', weekday: '四', time: '08:03', dose: '1.25 片', mg: '3.75mg', type: '按计划服用', status: '已完成', inr: 'INR 2.1', raw: '校准前 2.0' }
  ]
};

const latest = serverPayload.homeSummary.latestInr;
const inrRecords = serverPayload.inrRecordsResponse.records;
const medRecords = serverPayload.medicationRecords;
const copy = serverPayload.homeSummary.displayText;
const inrCopy = serverPayload.inrRecordsResponse.displayText;
const settingsCopy = serverPayload.settings.displayText;

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
function alertBox(kind = statusKind(latest.correctedValue)) {
  const c = copy.reminders;
  const data = kind === 'danger'
    ? [c.strongBadge, c.strongTitle, c.strongBody, '2.8']
    : kind === 'soft'
      ? [c.softBadge, c.softTitle, c.softBody, '2.6']
      : [c.normalBadge, c.normalTitle, c.normalBody, latest.correctedValue.toFixed(1)];
  return `<section class="alert ${kind}"><div><span class="badge">${data[0]}</span><h3>${data[1]}</h3><p>${data[2]}</p></div><strong>${data[3]}</strong></section>`;
}
function addInrButton(platform) { return `<button class="iconCta" onclick="showInrDialog('${platform}')">＋ INR</button>`; }
function inrCard(platform, kind = statusKind(latest.correctedValue)) {
  const latestCopy = copy.latestInr;
  const nextCopy = copy.nextTest;
  const reminder = copy.reminders;
  const reminderBody = kind === 'danger' ? reminder.strongHomeBody : kind === 'soft' ? reminder.softHomeBody : serverPayload.homeSummary.prominentReminder.body;
  return `<section class="card inrCard ${kind}"><div class="sectionTitle"><div><h3>${latestCopy.label} <em class="targetInline">${latestCopy.targetLabel}</em></h3><small>${latest.testedAtLabel} · ${latest.displayText.methodLabel}</small></div>${addInrButton(platform)}</div><div class="bigMetric inrMetric"><strong>${latest.correctedValue.toFixed(1)}</strong><em class="rawBeside">${latestCopy.rawLabel} ${latest.rawValue.toFixed(1)}</em></div><div class="nextTest">${nextCopy.label}：<b>${serverPayload.homeSummary.nextTestAtLabel}</b> · ${nextCopy.cycleText}</div><div class="homeReminder ${kind}"><b>${reminder.homeTitle}</b><span>${reminderBody}</span></div></section>`;
}
function statusClass(status) { return status === '停服' ? 'paused' : status === '漏服' ? 'missed' : 'done'; }
function home(platform) {
  const med = serverPayload.homeSummary.todayMedication;
  const medCopy = copy.todayMedication;
  return shell(platform, 'home', `
  <section class="heroDose card">
    <div class="doseHeroHead"><h3>${medCopy.title}</h3><span class="doseTime">${serverPayload.settings.defaultMedicationTime}</span></div>
    <div class="doseAmount"><strong>${med.plannedDoseTablets} 片</strong><em>${med.plannedDoseMg}</em></div><small>${medCopy.yesterdayDoseText} · ${medCopy.statusText}</small>
    <div class="doseActions"><button class="btn primary doseDone" onclick="showDoseDialog()">${medCopy.primaryAction}</button><button class="btn dosePause">${medCopy.pauseAction}</button><button class="btn doseMiss">${medCopy.missAction}</button></div>
  </section>
  ${inrCard(platform, 'ok')}
  ${trendCard()}
  ${doseSheet()}`);
}
function records(platform) {
  return shell(platform, 'records', `<section class="monthTimeline compactTimeline"><div class="monthHeader compactMonth"><span>2026年4月</span><em>共 5 条 · 最近在上</em></div><div class="timelineList compactList">${[...medRecords].reverse().map(r => `<article class="timelineItem compactItem ${statusClass(r.status)}"><div class="timelineDot ${statusClass(r.status)}"></div><div class="datePill"><strong>${r.day}</strong><span>周${r.weekday}</span></div><div class="compactMedCard"><div class="compactMedMain"><div><b>${r.dose}</b><small>${r.mg}</small></div><span class="medStatus ${statusClass(r.status)}">${r.status}</span></div><div class="compactMeta"><span>${r.time}</span><span>${r.type}</span><span>系统记录</span></div>${r.inr ? `<div class="compactInr"><b>${r.inr}</b><span>${r.raw}</span></div>` : ''}</div></article>`).join('')}</div></section>`);
}
function inr(platform) {
  return shell(platform, 'inr', `${alertBox('danger')}<section class="card"><div class="sectionTitle"><div><h3>${inrCopy.trend.title}</h3><small>${inrCopy.trend.subtitle}</small></div>${addInrButton(platform)}</div>${trendCard(true, false)}</section><section class="card"><div class="sectionTitle"><h3>${inrCopy.recordsTitle}</h3><small>${inrCopy.recordsHint}</small></div><div class="list">${inrRecords.map(r => `<article class="record inrRecord"><div class="recordHead"><div><span class="recordDate">${r.date}</span><strong class="inrRecordValue">INR ${r.correctedValue.toFixed(1)}</strong></div><span class="status ${r.s}">${r.displayText.statusLabel}</span></div><p>${r.displayText.note}</p><small>${r.displayText.rawLabel} ${r.rawValue.toFixed(1)} · ${r.displayText.methodLabel}</small></article>`).join('')}</div></section>${inrDialog(platform)}`);
}
function me(platform) {
  return shell(platform, 'me', `<section class="profile card"><div class="avatar">饼</div><div><h3>小饼</h3><p>目标 INR 1.8–2.5 · 华法林长期管理</p></div></section><section class="card"><div class="subpageLinks"><a href="/${platform}/inr-settings/">INR 设置 ›<small>检测方式、目标范围、偏移量、检测周期</small></a><a href="/${platform}/dose-settings/">服药设置 ›<small>药品、循环剂量、完成后规则</small></a><a href="/${platform}/notifications/">通知设置 ›<small>服药提醒、INR 检测提醒</small></a><a href="/${platform}/account/">账号绑定 ›<small>微信/手机号/Google/Apple</small></a><a href="/${platform}/profile/">个人资料 ›<small>年龄、性别、疾病类型</small></a><a href="/${platform}/help/">使用帮助 ›<small>新用户初始设置</small></a></div></section><section class="card"><div class="notice info"><strong>医疗边界</strong><span>本工具只做记录和提醒，剂量调整与异常 INR 处理请遵医嘱。</span></div></section>`);
}
function inrSettings(platform) {
  const c = settingsCopy;
  return shell(platform, 'inr-settings', `<section class="card settingsGroup"><h3>${c.testMethodTitle}</h3><p class="hint">${c.testMethodHint}</p>${settings([['默认方式', '指尖血 INR 仪（偏移 +0.22）'], ['医院静脉血', '偏移 0.00'], ['自定义方式', '可设置名称、备注、偏移量']])}<button class="btn primary full" onclick="openModal('methodDialog')">新增检测方式</button></section><section class="card settingsGroup"><h3>${c.inrRangeTitle}</h3><p class="hint">${c.inrRangeHint}</p>${settings([['目标范围', `${serverPayload.settings.targetInrMin}–${serverPayload.settings.targetInrMax}`], [c.cycleTitle, c.cycleHint], [c.offsetTitle, `+${serverPayload.settings.inrOffset.toFixed(2)}`], ['下次检测', serverPayload.homeSummary.nextTestAtLabel]])}<button class="btn full" onclick="openModal('cycleDialog')">设置检测周期</button></section><section class="card"><div class="notice info"><strong>${c.offsetTitle}</strong><span>${c.offsetHint}</span></div></section>${methodDialog()}${cycleDialog()}`);
}
function inrMethods(platform) { return inrSettings(platform); }
function testSettings(platform) { return inrSettings(platform); }
function doseSettings(platform) {
  const c = settingsCopy;
  const med = copy.todayMedication;
  return shell(platform, 'dose-settings', `<section class="card settingsGroup"><h3>药品与单位</h3>${settings([['品牌', 'Marevan'], ['输入单位', '片 / 毫克，按品牌自动匹配'], [c.medicationTimeTitle, serverPayload.settings.defaultMedicationTime]])}</section><section class="card settingsGroup"><h3>循环剂量</h3><div class="doseLoop"><span>1.25 片</span><span>1.5 片</span><button onclick="openModal('dosePickerDialog')">＋ 设置剂量</button></div><p class="hint">支持添加 1–3 个剂量，按顺序循环。</p></section><section class="card settingsGroup"><h3>${med.tomorrowDoseTitle}</h3><div class="choiceGrid"><button class="choice on"><b>${med.plannedDoseLabel}</b><span>完成服药后自动带出明日循环剂量</span></button><button class="choice"><b>${med.manualDoseLabel}</b><span>完成后要求填写明日剂量</span></button></div></section><button class="btn primary full">${c.saveAction}</button>${dosePickerDialog()}`);
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
  const items = [
    '登录账号后可同步服药、INR 与提醒设置。',
    `${settingsCopy.testMethodHint}，并可配置${settingsCopy.offsetTitle}。`,
    `${settingsCopy.inrRangeHint}，${settingsCopy.cycleTitle}为${settingsCopy.cycleHint}。`,
    `${copy.todayMedication.recordedAtHint}，完成后确认明日剂量。`,
    '检测 INR 后录入数值和检测方式，系统保存校正后结果。'
  ];
  return shell(platform, 'help', `<section class="card"><h3>使用说明</h3><ol class="help">${items.map(item => `<li>${item}</li>`).join('')}</ol></section>`);
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
  const tc = inrCopy.trend;
  const inner = `${includeTitle ? `<div class="sectionTitle"><h3>${tc.title}</h3><small>${tc.subtitle}</small></div>` : ''}<div class="chartBox valueChart"><div class="legend"><span><i class="cal"></i>${tc.correctedSeriesLabel}</span><span><i class="raw"></i>${tc.rawSeriesLabel}</span><span><i class="high"></i>${tc.strongLabel}</span><span><i class="low"></i>${tc.weakLabel}</span></div><svg viewBox="0 0 320 190" role="img" aria-label="INR 趋势"><path class="abnormalBand" d="M12 18H308V45H12Z M12 136H308V164H12Z"/><path class="range" d="M12 55H308V126H12Z"/><path class="grid" d="M12 25H308M12 55H308M12 90H308M12 126H308M12 156H308"/><text x="14" y="38" class="warnText">强提醒区</text><text x="14" y="152" class="warnText">强提醒区</text><path class="line raw" d="M22 134 C58 121,78 110,104 96 S150 69,174 82 S216 31,238 39 S276 73,298 85"/><path class="line cal" d="M22 123 C58 112,78 101,104 87 S150 60,174 73 S216 22,238 30 S276 64,298 76"/>${labels}${dots}</svg></div>`;
  return wrapped ? `<section class="card">${inner}</section>` : inner;
}
function methodDialog() { return `<section id="methodDialog" class="modalLayer" onclick="closeModal(event, 'methodDialog')"><div class="dialog card modalCard"><button class="modalClose" onclick="openModal('methodDialog', false)">×</button><div class="sectionTitle"><h3>新增检测方式</h3><small>不同检测设备可设置独立偏移量</small></div><label class="field"><span>方式名称</span><input value="家用指尖血 INR 仪" /></label><label class="field"><span>偏移量</span><input type="number" step="0.01" value="0.22" placeholder="例如 0.22 或 -0.10" /></label><label class="field"><span>备注</span><input value="同步时弱展示校准前值" /></label><button class="btn primary full">保存检测方式</button></div></section>`; }
function cycleDialog() { return `<section id="cycleDialog" class="modalLayer" onclick="closeModal(event, 'cycleDialog')"><div class="dialog card modalCard"><button class="modalClose" onclick="openModal('cycleDialog', false)">×</button><div class="sectionTitle"><h3>设置检测周期</h3><small>可按天、按周、按月自由设置，保存后自动计算下次检测日期</small></div><div class="cycleTabs"><button class="pickChip">按天</button><button class="pickChip on">按周</button><button class="pickChip">按月</button></div><label class="field"><span>间隔数值</span><input type="number" value="2" min="1" /></label><div class="dosePreview"><span>当前周期</span><strong>每 2 周</strong></div><button class="btn primary full">保存周期</button></div></section>`; }
function dosePickerDialog() { const ints = [1,2,3,4,5,6,7,8,9]; const fracs = ['0.25','0.75','⅓','三分之二','0.5']; return `<section id="dosePickerDialog" class="modalLayer" onclick="closeModal(event, 'dosePickerDialog')"><div class="dialog card dosePicker modalCard"><button class="modalClose" onclick="openModal('dosePickerDialog', false)">×</button><div class="sectionTitle"><h3>设置剂量</h3><small>弹窗选择整数片和小数片，组合成每日剂量</small></div><div class="pickerColumns"><div><b>整数片</b><div class="chipGrid">${ints.map(n => `<button class="pickChip ${n===1?'on':''}">${n}</button>`).join('')}</div></div><div><b>小数片</b><div class="chipGrid">${fracs.map((f,i) => `<button class="pickChip ${i===0?'on':''}">${f}</button>`).join('')}</div></div></div><div class="dosePreview"><span>当前选择</span><strong>1.25 片</strong></div><button class="btn primary full">保存剂量</button></div></section>`; }
function doseSheet(open = false) { const medCopy = copy.todayMedication; return `<section id="doseDoneSheet" class="bottomSheet ${open ? 'open' : ''}"><div class="grab"></div><div class="sectionTitle"><h3>${medCopy.tomorrowDoseTitle}</h3><small>${medCopy.recordedAtHint}</small></div><div class="choiceGrid tomorrowChoice"><button class="choice on"><b>${medCopy.plannedDoseLabel}</b><span>${serverPayload.homeSummary.todayMedication.tomorrowPlannedDoseText}</span></button><label class="choice manualDose"><b>${medCopy.manualDoseLabel}</b><span>输入片或毫克</span><input aria-label="手动输入明日剂量" type="number" step="0.25" min="0" placeholder="如 1.25" /></label></div><button class="btn primary full">${medCopy.confirmAction}</button></section>`; }
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
  const routes = ['home', 'records', 'inr', 'me', 'login', 'inr-settings', 'inr-methods', 'test-settings', 'dose-settings', 'after-dose-rule', 'notifications', 'account', 'profile', 'help'];
  const docGroups = [
    {
      title: '需求与功能清单',
      desc: '按端、模块、功能节点说明实现方式、方案和采用理由。',
      links: [
        ['端模块功能清单', '/docs/product/module-feature-inventory/'],
        ['当前进度与交付状态', '/docs/product/current-progress/'],
        ['基础数据与结构审核', '/docs/tech/base-data-and-schema-review/']
      ]
    },
    {
      title: 'UI 与原型',
      desc: '三端页面、首页状态卡片、强提醒、INR 趋势和设置交互说明。',
      links: [
        ['UI 设计说明', '/docs/ui/README/'],
        ['微信首页原型', '/wechat/home/'],
        ['Android INR 原型', '/android/inr/'],
        ['iOS 设置原型', '/ios/me/']
      ]
    },
    {
      title: '技术方案与架构',
      desc: '服务端、小程序、Flutter、API 契约、部署拓扑与后续扩展路线。',
      links: [
        ['完整技术方案', '/docs/tech/technical-proposal/'],
        ['架构梳理报告', '/docs/tech/architecture-report/'],
        ['数据库与缓存设计', '/docs/tech/database-and-cache-design/'],
        ['多端 MVP 计划', '/docs/plans/2026-04-24-multiplatform-mvp/']
      ]
    },
    {
      title: '迭代报告与审计',
      desc: '记录每轮大改的现有问题、改动原因、实际改动、验证结果和线上效果。',
      links: [
        ['2026-04-25 INR 产品完善与契约对齐报告', '/docs/reports/2026-04-25-inr-refinement-implementation/'],
        ['2026-04-25 服务端文案契约与多语言准备报告', '/docs/reports/2026-04-25-server-copy-contract/'],
        ['2026-04-27 项目边界与独立运行报告', '/docs/reports/2026-04-27-project-boundary-independent-run/']
      ]
    }
  ];
  const highlights = ['首页：最近 INR、下次检测、超明显提醒', '服药：完成后选择明日剂量，不做补服', 'INR：校正值主显示，原始值弱展示，双曲线趋势', '设置：检测方式、校正偏移、按天/周/月周期'];
  return `<main class="landing docPortal"><section class="hero"><div><p class="eyebrow">Warfarin INR Tracker · Documentation Portal</p><h1>抗凝小助手文档入口</h1><p class="lead">集中查看需求、UI、技术方案、架构、数据库缓存设计和当前进度；所有 Markdown 文档已支持 Cloudflare 在线美化预览。</p><div class="heroBullets">${highlights.map(item => `<span>${item}</span>`).join('')}</div></div><span class="chip">目标 INR 1.8–2.5</span></section><section class="docGroupGrid">${docGroups.map(group => `<article class="docGroup"><div><p class="eyebrow">Document</p><h2>${group.title}</h2><p>${group.desc}</p></div><div class="docGroupLinks">${group.links.map(([label, href]) => `<a href="${href}">${label}<span>›</span></a>`).join('')}</div></article>`).join('')}</section><section class="platform-grid">${Object.entries(platforms).map(([k, p]) => `<article class="platform-card"><h2>${p.label}</h2><p>${k === 'wechat' ? '微信快捷登录，适合日常快速记录。' : '适合手机端长期记录和提醒。'}</p><div class="route-links">${routes.map(id => `<a href="/${k}/${id}/">${routeMap[id]}<span>›</span></a>`).join('')}</div></article>`).join('')}</section></main>`;
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
