
(() => {
'use strict';

/* STIMULATION OVERDRIVE X.3 */

const VERSION = 'X.3';
const STORAGE = 'stim_overdrive_x3';
const OLD = window.__STIM_X3__;

if (OLD) {
    OLD.toggle();
    return;
}

document.getElementById('od3')?.remove();
document.getElementById('od3-style')?.remove();

const $ = (s, r = document) => r.querySelector(s);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const fmt = n => {
    if (!Number.isFinite(Number(n))) return String(n);
    return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
};

let stored = {};
try {
    stored = JSON.parse(localStorage.getItem(STORAGE) || '{}');
} catch {}

const S = {
    tab: 'HOME',
    search: '',
    category: 'ALL',
    page: 0,
    hue: Number(stored.hue) || 0,
    rgb: !!stored.rgb,
    multiplier: Number(stored.multiplier) || 1,
    passiveRate: Number(stored.passiveRate) || 100,
    interval: clamp(Number(stored.interval) || 150, 50, 10000),
    auto: stored.auto || {},
    favorites: stored.favorites || [],
    compact: !!stored.compact,
    game: null,
    visible: true,
    destroyed: false,
    timers: [],
    rgbTimer: null,
    stats: {
        injected: 0,
        clicks: 0,
        collected: 0,
        actions: 0,
        commands: 0
    },
    history: [],
    logs: [],
    featurePageSize: 45,
    commandPageSize: 35
};

function save() {
    try {
        localStorage.setItem(STORAGE, JSON.stringify({
            hue: S.hue,
            rgb: S.rgb,
            multiplier: S.multiplier,
            passiveRate: S.passiveRate,
            interval: S.interval,
            auto: S.auto,
            favorites: S.favorites,
            compact: S.compact
        }));
    } catch (e) {
        console.warn('[OD3] Save failed', e);
    }
}

function log(message, type = 'info') {
    S.logs.unshift({
        time: new Date().toLocaleTimeString(),
        message: String(message),
        type
    });
    S.logs.length = Math.min(S.logs.length, 100);

    const status = $('#od3-status');
    if (status) status.textContent = message;
}

function findGame() {
    const container = $('.container');
    if (!container) return null;

    const queue = [
        container.__vue__,
        container.__vueParentComponent?.proxy,
        container.__vueParentComponent?.setupState
    ];
    const seen = new Set();

    while (queue.length) {
        const obj = queue.shift();

        if (!obj || typeof obj !== 'object' || seen.has(obj)) continue;
        seen.add(obj);

        if (
            typeof obj.addStimulation === 'function' ||
            typeof obj.onMainClick === 'function'
        ) return obj;

        for (const child of [
            obj.$children,
            obj.$data ? [obj.$data] : [],
            obj.setupState ? [obj.setupState] : [],
            obj.proxy ? [obj.proxy] : [],
            obj._vnode?.component?.proxy ? [obj._vnode.component.proxy] : []
        ]) {
            if (Array.isArray(child)) queue.push(...child);
            else if (child) queue.push(child);
        }
    }

    return null;
}

async function connect() {
    for (let i = 0; i < 40; i++) {
        S.game = findGame();
        if (S.game) {
            log('GAME CONNECTION ESTABLISHED', 'success');
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    log('GAME CONNECTION NOT FOUND', 'error');
    return false;
}

function balance() {
    const n = Number(S.game?.stimulation);
    return Number.isFinite(n) ? n : 0;
}

function inject(amount, applyMultiplier = true) {
    amount = Number(amount);
    if (!S.game || !Number.isFinite(amount) || amount <= 0) return false;

    const value = amount * (applyMultiplier ? S.multiplier : 1);
    if (!Number.isFinite(value)) return false;

    try {
        if (typeof S.game.addStimulation === 'function') {
            S.game.addStimulation(value);
        } else if (typeof S.game.stimulation === 'number') {
            S.game.stimulation += value;
        } else {
            return false;
        }

        S.stats.injected += value;
        S.stats.actions++;
        return true;
    } catch (e) {
        log('INJECTION ERROR: ' + e.message, 'error');
        return false;
    }
}

function clickMain() {
    try {
        if (typeof S.game?.onMainClick === 'function') {
            S.game.onMainClick();
            S.stats.clicks++;
            S.stats.actions++;
            return true;
        }

        const button = $$('button').find(
            b => b.textContent.trim() === 'Click me'
        );

        if (button) {
            button.click();
            S.stats.clicks++;
            S.stats.actions++;
            return true;
        }
    } catch (e) {
        log(e.message, 'error');
    }

    return false;
}

const SELECTORS = {
    rewards: '.reward .collect',
    press: '.hydraulic-press .press-collect:not(.press-collect-hide)',
    lootboxes: '.loot-box-target',
    powerups: '.powerup',
    quiz: '.question-choice',
    notifications: '.inbox .close',
    inbox: '.inbox .action',
    buy: '.stock-buy:not([disabled])',
    sell: '.stock-sell:not([disabled])',
    eggs: '.egg'
};

function clickElements(selector, limit = 20) {
    let count = 0;

    for (const el of $$(selector)) {
        if (count >= limit) break;
        if (!el || el.disabled || el.offsetParent === null) continue;

        try {
            el.click();
            count++;
        } catch {}
    }

    S.stats.collected += count;
    S.stats.actions += count;
    return count;
}

function clickText(text) {
    const el = $$('button').find(b =>
        b.textContent.trim().toLowerCase() === text.toLowerCase() &&
        !b.disabled && b.offsetParent !== null
    );

    if (!el) return false;
    el.click();
    S.stats.actions++;
    return true;
}

function collectAll() {
    return Object.values(SELECTORS).reduce(
        (total, selector) => total + clickElements(selector, 15),
        0
    );
}

function setMultiplier(value) {
    value = Number(value);
    if (!Number.isFinite(value) || value <= 0) {
        log('INVALID MULTIPLIER', 'error');
        return;
    }

    S.multiplier = clamp(value, 0.000001, 1e100);
    save();
    log('MULTIPLIER: ' + fmt(S.multiplier) + 'x', 'success');
    refresh();
}

/* AUTOMATION REGISTRY */

const AUTOMATIONS = [
    ['Clicker', clickMain],
    ['Reward Collector', () => clickElements(SELECTORS.rewards)],
    ['Hydraulic Press', () => clickElements(SELECTORS.press)],
    ['Lootbox Collector', () => clickElements(SELECTORS.lootboxes)],
    ['Powerup Collector', () => clickElements(SELECTORS.powerups)],
    ['Notification Cleaner', () => clickElements(SELECTORS.notifications)],
    ['Inbox Actions', () => clickElements(SELECTORS.inbox)],
    ['Stock Buyer', () => clickElements(SELECTORS.buy, 1)],
    ['Stock Seller', () => clickElements(SELECTORS.sell, 1)],
    ['Tamagotchi', () => clickElements(SELECTORS.eggs, 1)],
    ['Feed', () => clickText('Feed')],
    ['Collect All', collectAll],
    ['Passive Injector', () => inject(S.passiveRate / 10)],
    ['Rapid Clicker', clickMain]
];

function automationTick() {
    if (!S.game || S.destroyed) return;

    for (const [name, action] of AUTOMATIONS) {
        if (!S.auto[name]) continue;

        try {
            action();
        } catch (e) {
            log(name + ': ' + e.message, 'error');
        }
    }
}

function setIntervalValue(value) {
    value = Number(value);
    if (!Number.isFinite(value) || value < 50 || value > 10000) {
        log('INTERVAL RANGE: 50–10000 MS', 'error');
        return;
    }

    S.interval = value;
    clearInterval(S.automationTimer);
    S.automationTimer = setInterval(automationTick, S.interval);
    save();
    log('AUTOMATION INTERVAL: ' + value + 'MS');
}

/* FEATURE DATABASE */

const FEATURES = [];

function addFeature(name, category, description, action, command) {
    FEATURES.push({
        id: FEATURES.length,
        name,
        category,
        description,
        action,
        command
    });
}

function addCommand(name, description, action, aliases = []) {
    COMMANDS.push({
        name,
        description,
        action,
        aliases
    });
}

const COMMANDS = [];

function addInjectionPreset(index, amount) {
    const name = 'inject.p' + String(index).padStart(4, '0');

    addFeature(
        'Injection Preset ' + index,
        'STIM',
        'Inject ' + fmt(amount) + ' stimulation.',
        () => {
            log(inject(amount) ? 'INJECTION COMPLETE' : 'INJECTION FAILED',
                'success');
            refresh();
        },
        name
    );

    addCommand(name, 'Inject ' + fmt(amount) + ' stimulation.', () => {
        log(inject(amount) ? 'INJECTION COMPLETE' : 'INJECTION FAILED',
            'success');
    });
}

function addMultiplierPreset(index, multiplier) {
    const name = 'mult.p' + String(index).padStart(4, '0');

    addFeature(
        'Multiplier Preset ' + index,
        'MULTIPLIER',
        'Set multiplier to ' + fmt(multiplier) + 'x.',
        () => setMultiplier(multiplier),
        name
    );

    addCommand(name, 'Set multiplier to ' + fmt(multiplier) + 'x.',
        () => setMultiplier(multiplier));
}

function addRatePreset(index, rate) {
    const name = 'rate.p' + String(index).padStart(4, '0');

    addFeature(
        'Passive Rate Preset ' + index,
        'PASSIVE',
        'Set passive rate to ' + fmt(rate) + '/s.',
        () => {
            S.passiveRate = rate;
            save();
            log('PASSIVE RATE UPDATED');
            refresh();
        },
        name
    );

    addCommand(name, 'Set passive rate to ' + fmt(rate) + '/s.', () => {
        S.passiveRate = rate;
        save();
        log('PASSIVE RATE UPDATED');
    });
}

function addIntervalPreset(index, interval) {
    const name = 'interval.p' + String(index).padStart(4, '0');

    addFeature(
        'Interval Preset ' + index,
        'AUTOMATION',
        'Set automation interval to ' + interval + 'ms.',
        () => setIntervalValue(interval),
        name
    );

    addCommand(name, 'Set automation interval to ' + interval + 'ms.',
        () => setIntervalValue(interval));
}

/* 10,000 injection configurations */
for (let i = 1; i <= 10000; i++) {
    const exponent = Math.floor((i - 1) / 1000);
    const base = (i - exponent * 1000) * 1000;
    addInjectionPreset(i, base * Math.pow(10, exponent));
}

/* 10,000 multiplier configurations */
for (let i = 1; i <= 10000; i++) {
    addMultiplierPreset(i, i);
}

/* 1,000 passive-rate configurations */
for (let i = 1; i <= 1000; i++) {
    addRatePreset(i, i * 100);
}

/* 1,000 automation interval configurations */
for (let i = 1; i <= 1000; i++) {
    addIntervalPreset(i, 50 + (i - 1) * 10);
}

/* CORE FEATURES */

const CORE = [
    ['Custom Injection', 'STIM', 'Enter a custom amount.', () => {
        const n = prompt('STIMULATION AMOUNT');
        if (n !== null) log(inject(Number(n)) ? 'INJECTED' : 'INVALID AMOUNT');
    }],
    ['Inject Current Balance', 'STIM', 'Inject the current balance.', () => inject(balance())],
    ['Inject 10x Balance', 'STIM', 'Inject ten times the current balance.', () => inject(balance() * 10)],
    ['Inject 100x Balance', 'STIM', 'Inject one hundred times the current balance.', () => inject(balance() * 100)],
    ['Set Multiplier', 'MULTIPLIER', 'Set a custom multiplier.', () => {
        const n = prompt('MULTIPLIER', String(S.multiplier));
        if (n !== null) setMultiplier(n);
    }],
    ['Double Multiplier', 'MULTIPLIER', 'Double the current multiplier.', () => setMultiplier(S.multiplier * 2)],
    ['Multiply x10', 'MULTIPLIER', 'Multiply current multiplier by 10.', () => setMultiplier(S.multiplier * 10)],
    ['Reset Multiplier', 'MULTIPLIER', 'Reset multiplier to 1x.', () => setMultiplier(1)],
    ['Set Passive Rate', 'PASSIVE', 'Set custom passive rate.', () => {
        const n = Number(prompt('PASSIVE RATE', String(S.passiveRate)));
        if (Number.isFinite(n) && n >= 0) {
            S.passiveRate = n;
            save();
            refresh();
        }
    }],
    ['Set Automation Interval', 'AUTOMATION', 'Set the automation interval.', () => {
        const n = prompt('INTERVAL IN MS', String(S.interval));
        if (n !== null) setIntervalValue(n);
    }],
    ['Enable All Automation', 'AUTOMATION', 'Enable all automation modules.', () => {
        AUTOMATIONS.forEach(([name]) => S.auto[name] = true);
        save();
        refresh();
    }],
    ['Disable All Automation', 'AUTOMATION', 'Disable all automation modules.', () => {
        S.auto = {};
        save();
        refresh();
    }],
    ['Collect Everything', 'GAME', 'Collect visible game items.', () => {
        log('COLLECTED ' + collectAll() + ' ITEMS');
        refresh();
    }],
    ['Reconnect Game', 'SYSTEM', 'Reconnect to the game object.', connect],
    ['Inspect Game', 'SYSTEM', 'Print the game object to console.', () => {
        console.log('[OD3] Game object:', S.game);
        log('GAME OBJECT PRINTED');
    }],
    ['Copy Balance', 'SYSTEM', 'Copy current balance.', async () => {
        try {
            await navigator.clipboard.writeText(String(balance()));
            log('BALANCE COPIED');
        } catch {
            prompt('BALANCE', String(balance()));
        }
    }],
    ['Reset Statistics', 'SYSTEM', 'Reset session statistics.', () => {
        S.stats = { injected: 0, clicks: 0, collected: 0, actions: 0, commands: 0 };
        log('STATISTICS RESET');
        refresh();
    }]
];

for (const [name, category, description, action] of CORE) {
    const command = name.toLowerCase().replace(/[^a-z0-9]+/g, '.');
    addFeature(name, category, description, action, command);
    addCommand(command, description, action);
}

for (const [name, action] of AUTOMATIONS) {
    const command = 'auto.' + name.toLowerCase().replace(/[^a-z0-9]+/g, '.');

    addFeature(
        'Automation: ' + name,
        'AUTOMATION',
        'Toggle ' + name + ' automation.',
        () => {
            S.auto[name] = !S.auto[name];
            save();
            log(name + (S.auto[name] ? ' ENABLED' : ' DISABLED'));
            refresh();
        },
        command
    );

    addCommand(command, 'Toggle ' + name + ' automation.', () => {
        S.auto[name] = !S.auto[name];
        save();
        log(name + (S.auto[name] ? ' ENABLED' : ' DISABLED'));
    });
}

/* COMMAND ENGINE */

function executeCommand(raw) {
    raw = String(raw || '').trim();
    if (!raw) return;

    S.stats.commands++;
    S.history.unshift(raw);
    S.history.length = Math.min(S.history.length, 100);

    const [first, ...rest] = raw.split(/\s+/);
    const name = first.toLowerCase();
    const args = rest;

    const match = COMMANDS.find(c =>
        c.name === name || c.aliases?.includes(name)
    );

    if (match) {
        try {
            const result = match.action(args);
            if (result instanceof Promise) {
                result.catch(e => log(e.message, 'error'));
            }
        } catch (e) {
            log('COMMAND ERROR: ' + e.message, 'error');
        }
        return;
    }

    switch (name) {
        case 'help':
            log('help, list, search, inject, mult, rate, interval, click, collect, auto, balance, stats, theme, hide, reconnect, clear');
            break;

        case 'list':
            log('COMMAND COUNT: ' + COMMANDS.length);
            break;

        case 'search':
            S.search = args.join(' ');
            S.tab = 'FEATURES';
            S.page = 0;
            refresh();
            break;

        case 'inject':
            log(inject(Number(args[0])) ? 'INJECTION COMPLETE' : 'INJECTION FAILED');
            break;

        case 'mult':
        case 'multiplier':
            setMultiplier(args[0]);
            break;

        case 'rate':
            S.passiveRate = Math.max(0, Number(args[0]) || 0);
            save();
            log('PASSIVE RATE UPDATED');
            break;

        case 'interval':
            setIntervalValue(args[0]);
            break;

        case 'click':
            log(clickMain() ? 'CLICK EXECUTED' : 'CLICK FAILED');
            break;

        case 'collect':
            log('COLLECTED ' + collectAll() + ' ITEMS');
            break;

        case 'auto':
            if (args[0] === 'on') {
                AUTOMATIONS.forEach(([n]) => S.auto[n] = true);
                log('ALL AUTOMATIONS ENABLED');
            } else if (args[0] === 'off') {
                S.auto = {};
                log('ALL AUTOMATIONS DISABLED');
            } else {
                const target = AUTOMATIONS.find(([n]) =>
                    n.toLowerCase() === args.join(' ').toLowerCase()
                );
                if (target) {
                    S.auto[target[0]] = !S.auto[target[0]];
                    log(target[0] + ': ' + (S.auto[target[0]] ? 'ON' : 'OFF'));
                } else {
                    log('USAGE: auto on/off/name');
                }
            }
            save();
            break;

        case 'balance':
            log('BALANCE: ' + fmt(balance()));
            break;

        case 'stats':
            log(JSON.stringify(S.stats));
            break;

        case 'theme':
            S.hue = clamp(Number(args[0]) || 0, 0, 360);
            applyHue();
            save();
            log('THEME UPDATED');
            break;

        case 'hide':
            toggle();
            break;

        case 'reconnect':
            connect();
            break;

        case 'clear':
            S.logs = [];
            log('TERMINAL CLEARED');
            break;

        default:
            log('UNKNOWN COMMAND: ' + name, 'error');
    }
}

/* MOBILE INTERFACE */

const style = document.createElement('style');
style.id = 'od3-style';
style.textContent = `
#od3{
 --h:${S.hue};
 position:fixed;z-index:2147483647;
 left:50%;top:50%;transform:translate(-50%,-50%);
 width:min(480px,calc(100vw - 16px));
 height:min(850px,88dvh);
 max-height:calc(100dvh - 16px);
 display:flex;flex-direction:column;overflow:hidden;
 color:#e9eaf0;background:#090b10;
 border:1px solid hsl(var(--h) 95% 60% / .55);
 border-radius:15px;
 box-shadow:0 20px 70px #000e,0 0 28px hsl(var(--h) 100% 50% / .14);
 font:12px/1.4 ui-monospace,Menlo,monospace;
 padding:0;
 padding-bottom:env(safe-area-inset-bottom);
}
#od3 *{box-sizing:border-box}
#od3 button,#od3 input,#od3 select{
 font:inherit;color:inherit;background:#151923;
 border:1px solid #ffffff20;border-radius:8px;
 min-height:38px;padding:9px;
}
#od3 button{cursor:pointer;touch-action:manipulation}
#od3 button:active{transform:scale(.97)}
#od3 button.active{
 border-color:hsl(var(--h) 100% 65%);
 background:hsl(var(--h) 70% 30% / .35);
}
#od3 input{min-width:0;width:100%}
#od3 .header{
 flex:none;padding:12px 13px 8px;
 background:#0b0d13;border-bottom:1px solid #ffffff15;
}
#od3 .headrow{display:flex;align-items:center;justify-content:space-between;gap:8px}
#od3 .brand{font-weight:1000;letter-spacing:1.5px;font-size:14px}
#od3 .version{font-size:9px;color:#747b8b}
#od3 .status{font-size:10px;color:#84e7a5;margin-top:7px;min-height:14px}
#od3 .rgb{
 height:2px;margin-top:9px;
 background:linear-gradient(90deg,red,#ff0,lime,cyan,blue,magenta,red);
 background-size:200% 100%;
 animation:od3rgb 3s linear infinite;
}
@keyframes od3rgb{to{background-position:200% 0}}
#od3 .tabs{
 display:flex;gap:5px;overflow-x:auto;padding:8px 9px;
 flex:none;scrollbar-width:none;border-bottom:1px solid #ffffff12;
}
#od3 .tabs button{flex:none;min-width:67px;min-height:35px;font-size:10px}
#od3 main{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:10px}
#od3 .bottom{
 flex:none;padding:8px 10px calc(8px + env(safe-area-inset-bottom));
 border-top:1px solid #ffffff18;background:#0b0d13;
 display:grid;grid-template-columns:repeat(4,1fr);gap:6px;
}
#od3 .bottom button{font-size:10px;min-height:39px}
#od3 .panel{
 padding:10px;margin-bottom:9px;
 background:#ffffff07;border:1px solid #ffffff14;border-radius:10px;
}
#od3 .ptitle{
 font-weight:900;letter-spacing:1px;color:hsl(var(--h) 100% 75%);
 font-size:10px;margin-bottom:9px;
}
#od3 .muted{font-size:10px;color:#858b9a}
#od3 .stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
#od3 .stat{background:#ffffff08;border-radius:8px;padding:10px;min-width:0}
#od3 .stat strong{display:block;font-size:15px;overflow-wrap:anywhere}
#od3 .stat span{font-size:9px;color:#82899a;letter-spacing:1px}
#od3 .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
#od3 .grid button{font-size:10px;overflow:hidden;text-overflow:ellipsis}
#od3 .line{display:flex;align-items:center;gap:7px;margin:7px 0}
#od3 .line>*{flex:1;min-width:0}
#od3 .feature{
 display:flex;align-items:center;justify-content:space-between;
 gap:8px;padding:9px 2px;border-bottom:1px solid #ffffff12;
}
#od3 .feature:last-child{border:0}
#od3 .fname{font-weight:800;font-size:11px;overflow-wrap:anywhere}
#od3 .fdesc{font-size:9px;color:#858b9a;overflow-wrap:anywhere}
#od3 .feature button{flex:none;min-width:63px;font-size:9px}
#od3 .search{position:sticky;top:-10px;z-index:2;padding:2px 0 8px;background:#090b10}
#od3 .chips{display:flex;gap:5px;overflow-x:auto;padding:5px 0 9px;scrollbar-width:none}
#od3 .chips button{flex:none;font-size:9px;min-height:32px}
#od3 .pager{display:flex;align-items:center;gap:8px;margin:10px 0}
#od3 .pager button{flex:1}
#od3 .terminal{
 background:#030508;border:1px solid #ffffff1c;border-radius:8px;
 padding:8px;max-height:190px;overflow:auto;
}
#od3 .log{padding:5px 0;border-bottom:1px solid #ffffff0d;font-size:10px;overflow-wrap:anywhere}
#od3 .log.error{color:#ff7777}
#od3 .log.success{color:#80e5a1}
#od3 .time{color:#697184;margin-right:6px}
#od3 .hidden{display:none!important}
#od3 .danger{color:#ff7777}
#od3 .full{width:100%}
#od3 .badge{font-size:9px;color:#9aa2b4}
#od3 .command-input{display:flex;gap:6px;margin-top:8px}
#od3 .command-input input{flex:1}
#od3 .command-input button{flex:none}
@media(max-width:600px){
 #od3{
  left:0;top:auto;bottom:0;transform:none;
  width:100vw;height:88dvh;max-height:94dvh;
  border-radius:16px 16px 0 0;
  border-left:0;border-right:0;border-bottom:0;
 }
 #od3 .header{padding-top:max(10px,env(safe-area-inset-top))}
 #od3 .grid{grid-template-columns:repeat(3,minmax(0,1fr))}
 #od3 button{min-height:42px}
 #od3 .feature button{min-height:38px}
}
`;

document.head.appendChild(style);

const root = document.createElement('div');
root.id = 'od3';
root.innerHTML = `
 <header class="header">
  <div class="headrow">
   <div>
    <div class="brand">◈ OVERDRIVE <span style="color:hsl(var(--h) 100% 65%)">X</span></div>
    <div class="version">STIMULATION CLIENT // ${VERSION}</div>
   </div>
   <div class="headrow">
    <button id="od3-min">—</button>
    <button id="od3-hide">×</button>
   </div>
  </div>
  <div class="rgb"></div>
  <div class="status" id="od3-status">INITIALIZING CLIENT...</div>
 </header>
 <nav class="tabs" id="od3-tabs"></nav>
 <main id="od3-content"></main>
 <footer class="bottom" id="od3-bottom"></footer>
`;

document.body.appendChild(root);

function applyHue() {
    root.style.setProperty('--h', S.hue);
}

function button(label, action, active = false) {
    const el = document.createElement('button');
    el.textContent = label;
    if (active) el.classList.add('active');
    el.addEventListener('click', action);
    return el;
}

function panel(title, subtitle = '') {
    const el = document.createElement('section');
    el.className = 'panel';

    const heading = document.createElement('div');
    heading.className = 'ptitle';
    heading.textContent = title;
    el.append(heading);

    if (subtitle) {
        const sub = document.createElement('div');
        sub.className = 'muted';
        sub.textContent = subtitle;
        el.append(sub);
    }

    return el;
}

function stat(label, value) {
    const el = document.createElement('div');
    el.className = 'stat';

    const strong = document.createElement('strong');
    strong.textContent = value;

    const span = document.createElement('span');
    span.textContent = label;

    el.append(strong, span);
    return el;
}

function renderHome(content) {
    const p = panel('LIVE TELEMETRY', 'SESSION OVERVIEW');
    const grid = document.createElement('div');
    grid.className = 'stats';

    grid.append(
        stat('GAME LINK', S.game ? 'ONLINE' : 'OFFLINE'),
        stat('BALANCE', fmt(balance())),
        stat('MULTIPLIER', fmt(S.multiplier) + 'x'),
        stat('PASSIVE RATE', fmt(S.passiveRate) + '/s'),
        stat('INJECTED', fmt(S.stats.injected)),
        stat('COMMANDS', fmt(S.stats.commands))
    );

    p.append(grid);
    content.append(p);

    const quick = panel('QUICK ACTIONS');
    const actions = document.createElement('div');
    actions.className = 'grid';

    for (const [name, amount] of [
        ['+1M', 1e6], ['+1B', 1e9], ['+1T', 1e12],
        ['+1Q', 1e15], ['+1Qi', 1e18], ['+1Sx', 1e21]
    ]) {
        actions.append(button(name, () => {
            log(inject(amount) ? name + ' INJECTED' : 'INJECTION FAILED');
            refresh();
        }));
    }

    actions.append(
        button('CLICK', () => { clickMain(); refresh(); }),
        button('COLLECT', () => { log('COLLECTED ' + collectAll()); refresh(); }),
        button('RECONNECT', connect)
    );

    quick.append(actions);
    content.append(quick);

    const metrics = panel('SESSION STATISTICS');
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats';

    for (const [key, value] of Object.entries(S.stats)) {
        statsGrid.append(stat(key.toUpperCase(), fmt(value)));
    }

    metrics.append(statsGrid);
    content.append(metrics);
}

function renderStim(content) {
    const p = panel('STIMULATION LAB', 'CUSTOM INPUT / PRESETS');

    const input = document.createElement('input');
    input.placeholder = 'Stimulation amount';
    input.inputMode = 'decimal';
    input.value = '1000000';

    const row = document.createElement('div');
    row.className = 'line';
    row.append(input, button('INJECT', () => {
        log(inject(Number(input.value)) ? 'INJECTION COMPLETE' : 'INVALID AMOUNT');
        refresh();
    }));

    p.append(row);

    const grid = document.createElement('div');
    grid.className = 'grid';

    for (const [name, value] of [
        ['1K', 1e3], ['10K', 1e4], ['100K', 1e5],
        ['1M', 1e6], ['10M', 1e7], ['100M', 1e8],
        ['1B', 1e9], ['10B', 1e10], ['100B', 1e11],
        ['1T', 1e12], ['1Q', 1e15], ['1Qi', 1e18]
    ]) {
        grid.append(button(name, () => {
            log(inject(value) ? name + ' INJECTED' : 'INJECTION FAILED');
            refresh();
        }));
    }

    p.append(grid);
    content.append(p);

    const m = panel('MULTIPLIER');
    const multiplier = document.createElement('input');
    multiplier.type = 'number';
    multiplier.value = String(S.multiplier);

    m.append(multiplier);

    const mg = document.createElement('div');
    mg.className = 'grid';

    for (const value of [1, 10, 100, 1000, 1e6, 1e9]) {
        mg.append(button(fmt(value) + 'x', () => setMultiplier(value)));
    }

    m.append(mg, button('APPLY CUSTOM', () => setMultiplier(multiplier.value)));
    content.append(m);

    const passive = panel('PASSIVE GENERATOR');
    const rate = document.createElement('input');
    rate.type = 'number';
    rate.value = String(S.passiveRate);

    passive.append(
        rate,
        button('SET PASSIVE RATE', () => {
            const n = Number(rate.value);
            if (Number.isFinite(n) && n >= 0) {
                S.passiveRate = n;
                save();
                refresh();
            }
        }),
        button(S.auto['Passive Injector'] ? 'PASSIVE ON' : 'PASSIVE OFF', () => {
            S.auto['Passive Injector'] = !S.auto['Passive Injector'];
            save();
            refresh();
        }, !!S.auto['Passive Injector'])
    );

    content.append(passive);
}

function renderFeatures(content) {
    const searchWrap = document.createElement('div');
    searchWrap.className = 'search';

    const search = document.createElement('input');
    search.placeholder = '⌕ Search 22,000+ feature configurations...';
    search.value = S.search;

    search.oninput = () => {
        S.search = search.value;
        S.page = 0;
        render();
        const next = $('#od3-content input');
        next?.focus();
        if (next) next.setSelectionRange(next.value.length, next.value.length);
    };

    searchWrap.append(search);
    content.append(searchWrap);

    const categories = ['ALL', ...new Set(FEATURES.map(f => f.category))];
    const chips = document.createElement('div');
    chips.className = 'chips';

    categories.forEach(category => {
        chips.append(button(category, () => {
            S.category = category;
            S.page = 0;
            refresh();
        }, S.category === category));
    });

    content.append(chips);

    const query = S.search.toLowerCase();
    const filtered = FEATURES.filter(f =>
        (S.category === 'ALL' || f.category === S.category) &&
        (!query || (
            f.name + ' ' + f.description + ' ' + f.command + ' ' + f.category
        ).toLowerCase().includes(query))
    );

    const pages = Math.max(1, Math.ceil(filtered.length / S.featurePageSize));
    S.page = clamp(S.page, 0, pages - 1);

    const info = document.createElement('div');
    info.className = 'muted';
    info.textContent = fmt(filtered.length) + ' MATCHES · ' +
        fmt(FEATURES.length) + ' TOTAL CONFIGURATIONS';
    content.append(info);

    const start = S.page * S.featurePageSize;
    const shown = filtered.slice(start, start + S.featurePageSize);

    for (const feature of shown) {
        const row = document.createElement('div');
        row.className = 'feature';

        const details = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'fname';
        name.textContent = feature.name;

        const desc = document.createElement('div');
        desc.className = 'fdesc';
        desc.textContent = feature.description + ' · ' + feature.command;

        details.append(name, desc);

        row.append(
            details,
            button('EXEC', () => {
                try {
                    const result = feature.action();
                    if (result instanceof Promise) {
                        result.catch(e => log(e.message, 'error'));
                    }
                } catch (e) {
                    log(e.message, 'error');
                }
            })
        );

        content.append(row);
    }

    const pager = document.createElement('div');
    pager.className = 'pager';

    pager.append(
        button('PREVIOUS', () => { S.page--; refresh(); }),
        button((S.page + 1) + ' / ' + pages, () => {}),
        button('NEXT', () => { S.page++; refresh(); })
    );

    pager.children[0].disabled = S.page <= 0;
    pager.children[2].disabled = S.page >= pages - 1;

    content.append(pager);
}

function renderAuto(content) {
    const p = panel('AUTOMATION CORE', 'TOGGLE INDIVIDUAL MODULES');

    for (const [name] of AUTOMATIONS) {
        const row = document.createElement('div');
        row.className = 'feature';

        const label = document.createElement('div');
        label.innerHTML = '';

        const title = document.createElement('div');
        title.className = 'fname';
        title.textContent = name;

        const desc = document.createElement('div');
        desc.className = 'fdesc';
        desc.textContent = 'Automatic game interaction';

        label.append(title, desc);

        row.append(label, button(
            S.auto[name] ? 'ACTIVE' : 'OFF',
            () => {
                S.auto[name] = !S.auto[name];
                save();
                refresh();
            },
            !!S.auto[name]
        ));

        p.append(row);
    }

    p.append(
        button('ENABLE ALL', () => {
            AUTOMATIONS.forEach(([name]) => S.auto[name] = true);
            save();
            refresh();
        }),
        button('DISABLE ALL', () => {
            S.auto = {};
            save();
            refresh();
        })
    );

    content.append(p);

    const timing = panel('AUTOMATION TIMING');
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(S.interval);

    timing.append(
        input,
        button('APPLY INTERVAL', () => setIntervalValue(input.value)),
        document.createElement('div')
    );

    content.append(timing);
}

function renderTerminal(content) {
    const p = panel('COMMAND TERMINAL', 'COMMAND REGISTRY / EXECUTION');

    const count = document.createElement('div');
    count.className = 'muted';
    count.textContent = fmt(COMMANDS.length) + ' REGISTERED COMMANDS';
    p.append(count);

    const output = document.createElement('div');
    output.className = 'terminal';

    for (const entry of S.logs.slice(0, 18).reverse()) {
        const line = document.createElement('div');
        line.className = 'log ' + entry.type;

        const time = document.createElement('span');
        time.className = 'time';
        time.textContent = '[' + entry.time + ']';

        const text = document.createElement('span');
        text.textContent = entry.message;

        line.append(time, text);
        output.append(line);
    }

    p.append(output);

    const commandRow = document.createElement('div');
    commandRow.className = 'command-input';

    const input = document.createElement('input');
    input.placeholder = 'root@overdrive:~$';
    input.autocomplete = 'off';
    input.spellcheck = false;

    const run = button('RUN', () => {
        executeCommand(input.value);
        input.value = '';
        refresh();
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') run.click();
    });

    commandRow.append(input, run);
    p.append(commandRow);
    content.append(p);

    const examples = panel('COMMAND EXAMPLES');
    const help = document.createElement('div');
    help.className = 'muted';
    help.textContent =
        'help · list · inject 1000000 · mult 100 · rate 500 · interval 150 · ' +
        'click · collect · auto on · auto off · balance · stats · theme 220 · hide';
    examples.append(help);
    content.append(examples);
}

function renderStyle(content) {
    const p = panel('CHROMA CONTROL', 'RGB / COLOR / INTERFACE');

    const hue = document.createElement('input');
    hue.type = 'range';
    hue.min = 0;
    hue.max = 360;
    hue.value = S.hue;

    hue.oninput = () => {
        S.hue = Number(hue.value);
        applyHue();
        save();
    };

    p.append(hue);

    const grid = document.createElement('div');
    grid.className = 'grid';

    for (const [name, value] of [
        ['RED', 0], ['ORANGE', 30], ['GOLD', 48],
        ['GREEN', 120], ['CYAN', 180], ['BLUE', 220],
        ['PURPLE', 275], ['PINK', 320], ['LIME', 90]
    ]) {
        grid.append(button(name, () => {
            S.hue = value;
            applyHue();
            refresh();
            save();
        }));
    }

    p.append(grid);

    p.append(button(S.rgb ? 'STOP RGB' : 'START RGB', () => {
        S.rgb = !S.rgb;
        if (S.rgb) {
            S.rgbTimer = setInterval(() => {
                S.hue = (S.hue + 2) % 360;
                applyHue();
            }, 40);
        } else {
            clearInterval(S.rgbTimer);
            S.rgbTimer = null;
        }
        save();
        refresh();
    }, S.rgb));

    p.append(button(S.compact ? 'COMPACT: ON' : 'COMPACT: OFF', () => {
        S.compact = !S.compact;
        root.classList.toggle('compact', S.compact);
        save();
        log('COMPACT MODE UPDATED');
    }, S.compact));

    content.append(p);
}

function renderTools(content) {
    const p = panel('SYSTEM CONTROL');

    p.append(
        button('RECONNECT GAME', connect),
        button('COPY BALANCE', async () => {
            try {
                await navigator.clipboard.writeText(String(balance()));
                log('BALANCE COPIED');
            } catch {
                prompt('BALANCE', String(balance()));
            }
        }),
        button('EXPORT SETTINGS', () => {
            prompt('CONFIGURATION', JSON.stringify({
                hue: S.hue,
                multiplier: S.multiplier,
                passiveRate: S.passiveRate,
                interval: S.interval,
                auto: S.auto
            }, null, 2));
        }),
        button('RESET SESSION STATS', () => {
            S.stats = { injected: 0, clicks: 0, collected: 0, actions: 0, commands: 0 };
            refresh();
            log('STATISTICS RESET');
        }),
        button('STOP ALL AUTOMATION', () => {
            S.auto = {};
            save();
            refresh();
            log('AUTOMATION STOPPED');
        }),
        button('DESTROY CLIENT', destroy)
    );

    content.append(p);
}

const TABS = [
    ['HOME', renderHome],
    ['STIM', renderStim],
    ['FEATURES', renderFeatures],
    ['AUTO', renderAuto],
    ['TERMINAL', renderTerminal],
    ['STYLE', renderStyle],
    ['TOOLS', renderTools]
];

function render() {
    if (S.destroyed) return;

    const tabs = $('#od3-tabs');
    const content = $('#od3-content');
    const bottom = $('#od3-bottom');

    tabs.innerHTML = '';
    content.innerHTML = '';
    bottom.innerHTML = '';

    TABS.forEach(([name]) => {
        tabs.append(button(name, () => {
            S.tab = name;
            S.page = 0;
            S.search = '';
            S.category = 'ALL';
            refresh();
        }, S.tab === name));
    });

    const selected = TABS.find(([name]) => name === S.tab);
    selected?.[1](content);

    for (const name of ['HOME', 'STIM', 'FEATURES', 'TERMINAL']) {
        bottom.append(button(name, () => {
            S.tab = name;
            S.page = 0;
            refresh();
        }, S.tab === name));
    }
}

function refresh() {
    if (!S.destroyed) render();
}

function toggle() {
    S.visible = !S.visible;
    root.style.display = S.visible ? 'flex' : 'none';
}

function destroy() {
    if (S.destroyed) return;
    S.destroyed = true;

    S.timers.forEach(clearInterval);
    clearInterval(S.automationTimer);
    if (S.rgbTimer) clearInterval(S.rgbTimer);

    root.remove();
    style.remove();

    delete window.__STIM_X3__;
}

$('#od3-hide', root).onclick = toggle;

$('#od3-min', root).onclick = () => {
    root.style.height = root.style.height === '52px' ? '88dvh' : '52px';
    $('#od3-tabs').classList.toggle('hidden');
    $('#od3-content').classList.toggle('hidden');
    $('#od3-bottom').classList.toggle('hidden');
};

S.toggle = toggle;
S.destroy = destroy;
S.refresh = refresh;
S.execute = executeCommand;
S.inject = inject;
S.connect = connect;
S.features = FEATURES;
S.commands = COMMANDS;
S.version = VERSION;

window.__STIM_X3__ = S;

document.addEventListener('keydown', e => {
    if (
        e.code === 'ShiftRight' &&
        !e.repeat &&
        !e.target.matches('input,textarea')
    ) toggle();

    if (e.key === 'Escape' && S.visible) toggle();
});

let startY = 0;
root.addEventListener('touchstart', e => {
    startY = e.touches[0]?.clientY || 0;
}, { passive: true });

root.addEventListener('touchend', e => {
    const endY = e.changedTouches[0]?.clientY || 0;
    if (endY - startY > 130 && root.scrollTop === 0) {
        root.style.height = '52dvh';
    }
}, { passive: true });

render();
applyHue();

S.automationTimer = setInterval(automationTick, S.interval);
connect();

log(
    'OVERDRIVE ' + VERSION + ' ONLINE · ' +
    fmt(FEATURES.length) + ' FEATURES · ' +
    fmt(COMMANDS.length) + ' COMMANDS',
    'success'
);

console.info('[OD3] Loaded', {
    version: VERSION,
    features: FEATURES.length,
    commands: COMMANDS.length
});

})();
