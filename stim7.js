
(() => {
'use strict';

/* STIMULATION OVERDRIVE X */

if (window.__STIM_X__) {
    window.__STIM_X__.toggle();
    return;
}

const VERSION = 'X.1';
const STORAGE = 'stim_overdrive_x_settings';

const S = {
    game: null,
    multiplier: 1,
    passiveRate: 100,
    clickRate: 10,
    auto: {},
    upgrades: {},
    hue: 0,
    tab: 'Dashboard',
    search: '',
    minimized: false,
    started: Date.now(),
    stats: {
        injected: 0,
        clicks: 0,
        collected: 0,
        purchases: 0
    },
    timers: [],
    rgb: false,
    destroyed: false
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
        Object.assign(S.auto, saved.auto || {});
        Object.assign(S.upgrades, saved.upgrades || {});
        if (Number.isFinite(saved.hue)) S.hue = saved.hue;
        if (Number.isFinite(saved.multiplier)) S.multiplier = saved.multiplier;
    } catch {}
}

function saveSettings() {
    try {
        localStorage.setItem(STORAGE, JSON.stringify({
            auto: S.auto,
            upgrades: S.upgrades,
            hue: S.hue,
            multiplier: S.multiplier
        }));
    } catch {}
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

        if (obj.$children) queue.push(...obj.$children);
        if (obj.$root && obj.$root !== obj) queue.push(obj.$root);
        if (obj.$data) queue.push(obj.$data);
        if (obj.setupState) queue.push(obj.setupState);
        if (obj.proxy) queue.push(obj.proxy);
        if (obj._vnode?.component?.proxy) queue.push(obj._vnode.component.proxy);
    }

    return null;
}

async function connect() {
    for (let i = 0; i < 40; i++) {
        S.game = findGame();
        if (S.game) return true;
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    return false;
}

function getBalance() {
    const g = S.game;
    if (!g) return 0;

    const value = Number(g.stimulation);
    return Number.isFinite(value) ? value : 0;
}

function inject(amount, useMultiplier = true) {
    const g = S.game;
    if (!g || !Number.isFinite(amount) || amount <= 0) return false;

    const finalAmount = amount * (useMultiplier ? S.multiplier : 1);

    try {
        if (typeof g.addStimulation === 'function') {
            g.addStimulation(finalAmount);
        } else if (typeof g.stimulation === 'number') {
            g.stimulation += finalAmount;
        } else {
            return false;
        }

        S.stats.injected += finalAmount;
        return true;
    } catch (error) {
        console.error('[Stim X]', error);
        return false;
    }
}

function mainClick() {
    const g = S.game;

    try {
        if (typeof g?.onMainClick === 'function') {
            g.onMainClick();
            S.stats.clicks++;
            return true;
        }

        const button = $$('button').find(
            b => b.textContent.trim() === 'Click me'
        );

        if (button) {
            button.click();
            S.stats.clicks++;
            return true;
        }
    } catch (error) {
        console.error('[Stim X]', error);
    }

    return false;
}

const selectors = {
    rewards: '.reward .collect',
    press: '.hydraulic-press .press-collect:not(.press-collect-hide)',
    lootboxes: '.loot-box-target',
    powerups: '.powerup',
    quiz: '.question-choice',
    notifications: '.inbox .close',
    inbox: '.inbox .action',
    stocksBuy: '.stock-buy:not([disabled])',
    stocksSell: '.stock-sell:not([disabled])',
    tamagotchi: '.egg',
    feed: 'button'
};

function clickSelector(selector, limit = 20) {
    let count = 0;

    try {
        for (const el of $$(selector)) {
            if (count >= limit) break;
            if (el.offsetParent === null || el.disabled) continue;
            el.click();
            count++;
        }
    } catch (error) {
        console.error('[Stim X]', error);
    }

    S.stats.collected += count;
    return count;
}

function collectEverything() {
    let total = 0;

    for (const selector of [
        selectors.rewards,
        selectors.press,
        selectors.lootboxes,
        selectors.powerups
    ]) {
        total += clickSelector(selector, 10);
    }

    return total;
}

/* FEATURE REGISTRY */

const FEATURES = [
    {
        category: 'Stimulation',
        name: 'Custom Injection',
        description: 'Inject a custom amount.',
        type: 'action',
        run: () => {
            const amount = Number(prompt('Stimulation amount:', '1000000'));
            if (Number.isFinite(amount) && amount > 0) {
                notify(inject(amount) ? 'Injection successful.' : 'Injection failed.');
            }
        }
    },
    {
        category: 'Stimulation',
        name: 'Add 1 Thousand',
        type: 'action',
        run: () => inject(1e3)
    },
    {
        category: 'Stimulation',
        name: 'Add 1 Million',
        type: 'action',
        run: () => inject(1e6)
    },
    {
        category: 'Stimulation',
        name: 'Add 1 Billion',
        type: 'action',
        run: () => inject(1e9)
    },
    {
        category: 'Stimulation',
        name: 'Add 1 Trillion',
        type: 'action',
        run: () => inject(1e12)
    },
    {
        category: 'Stimulation',
        name: 'Add 1 Quadrillion',
        type: 'action',
        run: () => inject(1e15)
    },
    {
        category: 'Stimulation',
        name: 'Add Maximum Safe Integer',
        type: 'action',
        run: () => inject(Number.MAX_SAFE_INTEGER)
    },
    {
        category: 'Stimulation',
        name: 'Set Multiplier',
        type: 'action',
        run: () => {
            const n = Number(prompt('New multiplier:', String(S.multiplier)));
            if (Number.isFinite(n) && n > 0) {
                S.multiplier = n;
                saveSettings();
                refresh();
            }
        }
    },
    {
        category: 'Stimulation',
        name: 'Reset Multiplier',
        type: 'action',
        run: () => {
            S.multiplier = 1;
            saveSettings();
            refresh();
        }
    },
    {
        category: 'Stimulation',
        name: 'Multiply ×10',
        type: 'action',
        run: () => {
            S.multiplier *= 10;
            saveSettings();
            refresh();
        }
    },
    {
        category: 'Stimulation',
        name: 'Multiply ×100',
        type: 'action',
        run: () => {
            S.multiplier *= 100;
            saveSettings();
            refresh();
        }
    },
    {
        category: 'Stimulation',
        name: 'Multiply ×1000',
        type: 'action',
        run: () => {
            S.multiplier *= 1000;
            saveSettings();
            refresh();
        }
    },
    {
        category: 'Automation',
        name: 'Auto Main Click',
        type: 'toggle',
        run: () => mainClick()
    },
    {
        category: 'Automation',
        name: 'Auto Rewards',
        type: 'toggle',
        run: () => clickSelector(selectors.rewards)
    },
    {
        category: 'Automation',
        name: 'Auto Hydraulic Press',
        type: 'toggle',
        run: () => clickSelector(selectors.press)
    },
    {
        category: 'Automation',
        name: 'Auto Lootboxes',
        type: 'toggle',
        run: () => clickSelector(selectors.lootboxes)
    },
    {
        category: 'Automation',
        name: 'Auto Powerups',
        type: 'toggle',
        run: () => clickSelector(selectors.powerups)
    },
    {
        category: 'Automation',
        name: 'Auto Quiz',
        type: 'toggle',
        run: () => clickSelector(selectors.quiz, 1)
    },
    {
        category: 'Automation',
        name: 'Auto Notifications',
        type: 'toggle',
        run: () => clickSelector(selectors.notifications)
    },
    {
        category: 'Automation',
        name: 'Auto Inbox Actions',
        type: 'toggle',
        run: () => clickSelector(selectors.inbox)
    },
    {
        category: 'Automation',
        name: 'Auto Stock Buying',
        type: 'toggle',
        run: () => clickSelector(selectors.stocksBuy, 1)
    },
    {
        category: 'Automation',
        name: 'Auto Stock Selling',
        type: 'toggle',
        run: () => clickSelector(selectors.stocksSell, 1)
    },
    {
        category: 'Automation',
        name: 'Auto Feed',
        type: 'toggle',
        run: () => {
            const feed = $$('button').find(b => b.textContent.trim() === 'Feed');
            if (feed && feed.offsetParent !== null) feed.click();
        }
    },
    {
        category: 'Automation',
        name: 'Auto Collect Everything',
        type: 'toggle',
        run: () => collectEverything()
    },
    {
        category: 'Automation',
        name: 'Passive Stimulation',
        type: 'toggle',
        run: () => inject(S.passiveRate / 10)
    },
    {
        category: 'Automation',
        name: 'Rapid Click Mode',
        type: 'toggle',
        run: () => mainClick()
    },
    {
        category: 'Tools',
        name: 'Inspect Game State',
        type: 'action',
        run: () => {
            console.log('[Stim X] Game state:', S.game);
            notify('Game state logged to console.');
        }
    },
    {
        category: 'Tools',
        name: 'Reconnect Game',
        type: 'action',
        run: async () => notify(await connect() ? 'Connected.' : 'Game not found.')
    },
    {
        category: 'Tools',
        name: 'Copy Game Balance',
        type: 'action',
        run: () => {
            const value = String(getBalance());
            navigator.clipboard?.writeText(value);
            notify('Balance: ' + value);
        }
    },
    {
        category: 'Tools',
        name: 'Reset Session Statistics',
        type: 'action',
        run: () => {
            S.stats = { injected: 0, clicks: 0, collected: 0, purchases: 0 };
            notify('Statistics reset.');
            refresh();
        }
    },
    {
        category: 'Tools',
        name: 'Export Settings',
        type: 'action',
        run: () => {
            const data = JSON.stringify({
                auto: S.auto,
                upgrades: S.upgrades,
                hue: S.hue,
                multiplier: S.multiplier
            }, null, 2);

            prompt('Copy your settings:', data);
        }
    },
    {
        category: 'Tools',
        name: 'Import Settings',
        type: 'action',
        run: () => {
            try {
                const data = JSON.parse(prompt('Paste settings JSON:') || '{}');
                Object.assign(S.auto, data.auto || {});
                Object.assign(S.upgrades, data.upgrades || {});
                if (Number.isFinite(data.hue)) S.hue = data.hue;
                if (Number.isFinite(data.multiplier) && data.multiplier > 0) {
                    S.multiplier = data.multiplier;
                }
                saveSettings();
                refresh();
                notify('Settings imported.');
            } catch {
                notify('Invalid settings JSON.');
            }
        }
    },
    {
        category: 'Tools',
        name: 'Reset All Settings',
        type: 'action',
        run: () => {
            if (!confirm('Reset all Overdrive settings?')) return;
            S.auto = {};
            S.upgrades = {};
            S.multiplier = 1;
            S.passiveRate = 100;
            S.clickRate = 10;
            saveSettings();
            refresh();
        }
    }
];

/* CUSTOM UPGRADE SHOP */

const UPGRADES = [
    { name: 'Click Amplifier', desc: 'Increase stimulation multiplier.', cost: 100, factor: 2 },
    { name: 'Neural Network', desc: 'A stronger stimulation multiplier.', cost: 1000, factor: 5 },
    { name: 'Quantum Processor', desc: 'Massively increase stimulation.', cost: 10000, factor: 10 },
    { name: 'Reactor Core', desc: 'Increase passive stimulation.', cost: 5000, rate: 100 },
    { name: 'Singularity Engine', desc: 'Major passive stimulation boost.', cost: 100000, rate: 10000 },
    { name: 'Infinity Core', desc: 'Extreme passive stimulation boost.', cost: 100000000, rate: 1000000 }
];

function purchaseUpgrade(index) {
    const u = UPGRADES[index];
    if (!u || !S.game || typeof S.game.stimulation !== 'number') {
        notify('Game balance cannot be edited.');
        return;
    }

    const level = S.upgrades[index] || 0;
    const cost = Math.floor(u.cost * Math.pow(1.8, level));

    if (getBalance() < cost) {
        notify('Not enough stimulation.');
        return;
    }

    S.game.stimulation -= cost;
    S.upgrades[index] = level + 1;

    if (u.factor) S.multiplier *= u.factor;
    if (u.rate) S.passiveRate += u.rate;

    S.stats.purchases++;
    saveSettings();
    notify(u.name + ' purchased.');
    refresh();
}

/* INTERFACE */

loadSettings();

const style = document.createElement('style');
style.textContent = `
#stimx {
 --hue:${S.hue};
 position:fixed;z-index:2147483647;top:16px;right:16px;
 width:370px;max-height:88vh;overflow:auto;
 padding:14px;background:#101014;color:#eee;
 border:1px solid hsl(var(--hue) 100% 65% / .7);
 border-radius:15px;font:13px system-ui;
 box-shadow:0 0 25px #000b,0 0 20px hsl(var(--hue) 100% 55% / .25);
 scrollbar-width:thin
}
#stimx *{box-sizing:border-box}
#stimx header{display:flex;align-items:center;justify-content:space-between;gap:8px}
#stimx h3{font-size:13px;letter-spacing:1px;margin:4px 0}
#stimx button,#stimx input{
 background:#1b1b23;color:#eee;border:1px solid #ffffff25;
 border-radius:8px;padding:9px;font:inherit
}
#stimx button{cursor:pointer}
#stimx button:hover{border-color:hsl(var(--hue) 100% 65%)}
#stimx button.active{background:hsl(var(--hue) 60% 25% / .4);border-color:hsl(var(--hue) 100% 65%)}
#stimx input{width:100%;min-width:0}
#stimx .rgb{height:3px;margin:10px 0;border-radius:5px;background:linear-gradient(90deg,red,yellow,lime,cyan,blue,magenta,red)}
#stimx .status{color:#9df5b0;font-size:11px;min-height:16px;margin:8px 0}
#stimx .tabs{display:flex;gap:5px;flex-wrap:wrap;margin:10px 0}
#stimx .tabs button{flex:1;min-width:60px;font-size:10px}
#stimx .panel{background:#ffffff08;border:1px solid #ffffff18;padding:10px;border-radius:10px;margin:8px 0}
#stimx .line{display:flex;gap:6px;margin:7px 0;align-items:center}
#stimx .line>*{flex:1;min-width:0}
#stimx .muted{font-size:11px;color:#999}
#stimx .feature{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #ffffff12}
#stimx .feature:last-child{border:0}
#stimx .feature-name{font-weight:600}
#stimx .feature-desc{font-size:10px;color:#999;margin-top:3px}
#stimx .feature button{font-size:10px;min-width:65px}
#stimx .stat{font-size:12px;padding:7px 0;border-bottom:1px solid #ffffff12}
#stimx .stat:last-child{border:0}
#stimx .search{margin:8px 0}
#stimx .search input{background:#17171d}
#stimx .section-title{font-size:11px;color:#aaa;letter-spacing:1px;margin:12px 0 5px}
`;
document.head.appendChild(style);

const root = document.createElement('div');
root.id = 'stimx';
root.innerHTML = `
<header>
 <h3>◈ STIMULATION OVERDRIVE X</h3>
 <button id="minimize">—</button>
</header>
<div class="rgb"></div>
<div class="status" id="status">Connecting to game...</div>
<div class="tabs" id="tabs"></div>
<main id="content"></main>
`;
document.body.appendChild(root);

function notify(message) {
    const el = $('#status', root);
    if (el) el.textContent = message;
}

function setHue(hue) {
    S.hue = ((hue % 360) + 360) % 360;
    root.style.setProperty('--hue', S.hue);
    saveSettings();
}

function createButton(label, fn, active = false) {
    const b = document.createElement('button');
    b.textContent = label;
    if (active) b.classList.add('active');
    b.onclick = fn;
    return b;
}

function makePanel(title, description = '') {
    const p = document.createElement('section');
    p.className = 'panel';

    const h = document.createElement('b');
    h.textContent = title;
    p.append(h);

    if (description) {
        const d = document.createElement('div');
        d.className = 'muted';
        d.textContent = description;
        p.append(d);
    }

    return p;
}

function renderDashboard(content) {
    const p = makePanel('LIVE GAME STATUS');
    const stats = [
        ['Connection', S.game ? 'Connected' : 'Disconnected'],
        ['Stimulation', getBalance().toLocaleString()],
        ['Multiplier', S.multiplier.toLocaleString() + '×'],
        ['Passive rate', S.passiveRate.toLocaleString() + '/s'],
        ['Session time', Math.floor((Date.now() - S.started) / 1000) + ' seconds']
    ];

    stats.forEach(([name, value]) => {
        const row = document.createElement('div');
        row.className = 'stat';
        row.textContent = name + ': ' + value;
        p.append(row);
    });

    content.append(p);

    const quick = makePanel('QUICK ACTIONS');
    const row = document.createElement('div');
    row.className = 'line';

    row.append(
        createButton('+1M', () => { inject(1e6); refresh(); }),
        createButton('+1B', () => { inject(1e9); refresh(); }),
        createButton('+1T', () => { inject(1e12); refresh(); }),
        createButton('CLICK', () => { mainClick(); refresh(); })
    );

    quick.append(row);
    content.append(quick);

    const p2 = makePanel('SESSION STATISTICS');
    Object.entries(S.stats).forEach(([name, value]) => {
        const row = document.createElement('div');
        row.className = 'stat';
        row.textContent = name + ': ' + Number(value).toLocaleString();
        p2.append(row);
    });

    content.append(p2);
}

function renderBoost(content) {
    const p = makePanel('CUSTOM STIMULATION INPUT', 'Enter any positive number.');

    const row = document.createElement('div');
    row.className = 'line';

    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = 'Enter amount';
    input.value = '1000000';

    row.append(input, createButton('INJECT', () => {
        const n = Number(input.value);
        notify(Number.isFinite(n) && n > 0
            ? (inject(n) ? 'Stimulation injected.' : 'Game connection unavailable.')
            : 'Enter a valid positive amount.');
        refresh();
    }));

    p.append(row);

    const presets = document.createElement('div');
    presets.className = 'line';

    [
        ['1K', 1e3],
        ['1M', 1e6],
        ['1B', 1e9],
        ['1T', 1e12],
        ['1Q', 1e15]
    ].forEach(([label, value]) => {
        presets.append(createButton(label, () => {
            notify(inject(value) ? label + ' injected.' : 'Injection failed.');
            refresh();
        }));
    });

    p.append(presets);
    content.append(p);

    const m = makePanel('MULTIPLIER CONTROL');
    const mrow = document.createElement('div');
    mrow.className = 'line';

    [1, 10, 100, 1000, 1e6].forEach(value => {
        mrow.append(createButton(
            value === 1e6 ? '1M×' : value + '×',
            () => {
                S.multiplier = value;
                saveSettings();
                refresh();
            },
            S.multiplier === value
        ));
    });

    m.append(mrow);

    const custom = document.createElement('input');
    custom.type = 'number';
    custom.placeholder = 'Custom multiplier';
    custom.value = S.multiplier;

    m.append(custom, createButton('SET MULTIPLIER', () => {
        const value = Number(custom.value);
        if (Number.isFinite(value) && value > 0) {
            S.multiplier = value;
            saveSettings();
            refresh();
        }
    }));

    content.append(m);
}

function renderFeatures(content) {
    const search = document.createElement('div');
    search.className = 'search';

    const input = document.createElement('input');
    input.placeholder = 'Search features...';
    input.value = S.search;

    input.oninput = () => {
        S.search = input.value.toLowerCase();
        render();
        const next = $('.search input', root);
        if (next) {
            next.focus();
            next.setSelectionRange(next.value.length, next.value.length);
        }
    };

    search.append(input);
    content.append(search);

    const features = FEATURES.filter(f =>
        f.category === S.tab &&
        (f.name.toLowerCase().includes(S.search) ||
         f.description?.toLowerCase().includes(S.search))
    );

    features.forEach(f => {
        const row = document.createElement('div');
        row.className = 'feature';

        const info = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'feature-name';
        name.textContent = f.name;

        const desc = document.createElement('div');
        desc.className = 'feature-desc';
        desc.textContent = f.description || f.category;

        info.append(name, desc);

        const enabled = !!S.auto[f.name];
        const action = createButton(
            f.type === 'toggle' ? (enabled ? 'ON' : 'OFF') : 'RUN',
            () => {
                if (f.type === 'toggle') {
                    S.auto[f.name] = !S.auto[f.name];
                    saveSettings();
                    refresh();
                } else {
                    f.run();
                }
            },
            enabled
        );

        row.append(info, action);
        content.append(row);
    });

    if (!features.length) {
        const empty = document.createElement('div');
        empty.className = 'muted';
        empty.textContent = 'No matching features.';
        content.append(empty);
    }
}

function renderUpgrades(content) {
    const info = makePanel('CUSTOM UPGRADE SHOP', 'Costs scale with each purchase.');
    const balance = document.createElement('div');
    balance.className = 'muted';
    balance.textContent = 'Balance: ' + getBalance().toLocaleString();
    info.append(balance);
    content.append(info);

    UPGRADES.forEach((u, i) => {
        const level = S.upgrades[i] || 0;
        const cost = Math.floor(u.cost * Math.pow(1.8, level));
        const p = makePanel(u.name, u.desc);

        const row = document.createElement('div');
        row.className = 'line';

        const label = document.createElement('span');
        label.textContent = 'Level ' + level;

        const costLabel = document.createElement('span');
        costLabel.textContent = 'Cost: ' + cost.toLocaleString();

        row.append(label, costLabel);
        p.append(row, createButton('PURCHASE', () => purchaseUpgrade(i)));
        content.append(p);
    });
}

function renderStyle(content) {
    const p = makePanel('RGB CHROMA');

    const hue = document.createElement('input');
    hue.type = 'range';
    hue.min = '0';
    hue.max = '360';
    hue.value = S.hue;
    hue.oninput = () => setHue(Number(hue.value));

    p.append(hue);

    const row = document.createElement('div');
    row.className = 'line';

    [
        ['Red', 0],
        ['Orange', 30],
        ['Yellow', 55],
        ['Green', 120],
        ['Cyan', 180],
        ['Blue', 220],
        ['Purple', 275],
        ['Pink', 320]
    ].forEach(([name, value]) => {
        row.append(createButton(name, () => {
            setHue(value);
            hue.value = value;
        }));
    });

    p.append(row);

    p.append(createButton(S.rgb ? 'STOP RGB CYCLE' : 'START RGB CYCLE', () => {
        S.rgb = !S.rgb;

        if (S.rgb) {
            S.rgbTimer = setInterval(() => setHue(S.hue + 2), 40);
        } else {
            clearInterval(S.rgbTimer);
            S.rgbTimer = null;
        }

        refresh();
    }));

    content.append(p);
}

function renderTools(content) {
    const p = makePanel('SYSTEM TOOLS');

    [
        ['Reconnect', async () => notify(await connect() ? 'Connected.' : 'Not detected.')],
        ['Inspect state', () => {
            console.log('[Stim X]', {
                game: S.game,
                balance: getBalance(),
                settings: S
            });
            notify('State printed to console.');
        }],
        ['Refresh interface', () => refresh()],
        ['Reset session stats', () => {
            S.stats = { injected: 0, clicks: 0, collected: 0, purchases: 0 };
            refresh();
        }],
        ['Close menu', () => destroy()]
    ].forEach(([name, fn]) => {
        p.append(createButton(name, fn));
    });

    content.append(p);
}

const TABS = [
    'Dashboard',
    'Boost',
    'Stimulation',
    'Automation',
    'Upgrades',
    'Style',
    'Tools'
];

function render() {
    if (S.destroyed) return;

    const tabs = $('#tabs', root);
    const content = $('#content', root);
    tabs.innerHTML = '';
    content.innerHTML = '';

    TABS.forEach(name => {
        tabs.append(createButton(name, () => {
            S.tab = name;
            S.search = '';
            render();
        }, S.tab === name));
    });

    if (S.tab === 'Dashboard') renderDashboard(content);
    if (S.tab === 'Boost') renderBoost(content);
    if (S.tab === 'Stimulation' || S.tab === 'Automation') renderFeatures(content);
    if (S.tab === 'Upgrades') renderUpgrades(content);
    if (S.tab === 'Style') renderStyle(content);
    if (S.tab === 'Tools') renderTools(content);
}

function refresh() {
    if (!S.destroyed) render();
}

/* AUTOMATION ENGINE */

function automationTick() {
    if (S.destroyed) return;

    for (const feature of FEATURES) {
        if (feature.type !== 'toggle' || !S.auto[feature.name]) continue;

        try {
            feature.run();
        } catch (error) {
            console.error('[Stim X automation]', feature.name, error);
        }
    }
}

function destroy() {
    S.destroyed = true;

    S.timers.forEach(clearInterval);
    if (S.rgbTimer) clearInterval(S.rgbTimer);

    root.remove();
    style.remove();

    delete window.__STIM_X__;
}

root.querySelector('#minimize').onclick = () => {
    S.minimized = !S.minimized;
    $('#content', root).style.display = S.minimized ? 'none' : '';
    $('#tabs', root).style.display = S.minimized ? 'none' : '';
    root.style.width = S.minimized ? '220px' : '370px';
};

S.toggle = () => {
    root.style.display = root.style.display === 'none' ? 'block' : 'none';
};

S.destroy = destroy;
window.__STIM_X__ = S;

render();
setHue(S.hue);

S.timers.push(setInterval(automationTick, 100));
S.timers.push(setInterval(() => {
    if (!S.destroyed && S.tab === 'Dashboard') render();
}, 1500));

connect().then(ok => {
    notify(ok ? 'Game connected. Overdrive X ready.' : 'Game not detected. Reload the game and retry.');
});

console.info('[Stim X] Loaded version', VERSION);

})();
