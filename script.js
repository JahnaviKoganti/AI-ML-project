
/* DATA: product catalogue and dictionaries used by the models */

const P = [
    [1, 'Sapphire Chronograph', 'watch', 24999, '⌚', 'blue luxury formal leather'],
    [2, 'Royal Blue Automatic', 'watch', 18999, '⌚', 'blue luxury formal steel'],
    [3, 'Quicksand Dress Watch', 'watch', 12999, '⌚', 'gold minimal formal leather'],
    [4, 'Sapphire Pendant', 'jewellery', 15999, '💎', 'blue luxury gift silver'],
    [5, 'Gold Filigree Bracelet', 'jewellery', 9999, '📿', 'gold gift minimal'],
    [6, 'Pearl Drop Earrings', 'jewellery', 4999, '✨', 'pearl gift minimal silver'],
    [7, 'Shellstone Tote', 'bag', 8999, '👜', 'leather beige minimal casual'],
    [8, 'Navy Leather Briefcase', 'bag', 13999, '💼', 'leather blue formal luxury'],
    [9, 'Oud Royale Perfume', 'fragrance', 6999, '🧴', 'luxury gift gold'],
    [10, 'Swan Wing Parfum', 'fragrance', 3999, '🌸', 'minimal gift casual'],
    [11, 'Oxford Brogues', 'footwear', 7499, '👞', 'leather formal blue'],
    [12, 'Suede Loafers', 'footwear', 5999, '👟', 'beige casual minimal']
].map(a => ({
    id: a[0],
    n: a[1],
    c: a[2],
    p: a[3],
    e: a[4],
    t: [a[2], ...a[5].split(' ')]
}));

const CATS = {
    watch: /watch|timepiece|chrono/,
    jewellery: /jewel|necklace|pendant|earring|bracelet/,
    bag: /\bbags?\b|tote|briefcase|purse/,
    fragrance: /perfum|fragran|scent|oud|parfum/,
    footwear: /shoe|footwear|loafer|brogue|sneaker/
};

const SYN = [
    [/wedding|party|office|interview|meeting|dress/, 'formal'],
    [/present|birthday|anniversary|mom|mother|wife|girlfriend|friend|sister/, 'gift'],
    [/simple|subtle|clean|plain/, 'minimal'],
    [/daily|everyday|weekend|college/, 'casual'],
    [/expensive|premium|rich|royal|fancy/, 'luxury'],
    [/navy|sapphire|sky/, 'blue'],
    [/golden/, 'gold']
];

const LEX = {
    love: 3, loved: 3, excellent: 3, amazing: 3, beautiful: 2,
    elegant: 2, great: 2, good: 1, perfect: 3, stunning: 3,
    premium: 2, comfortable: 1, worth: 2, gorgeous: 3, fast: 1,
    recommend: 2, nice: 1, happy: 2, bad: -2, poor: -2,
    terrible: -3, awful: -3, worst: -3, broke: -2, broken: -2,
    cheap: -1, disappointed: -2, disappointing: -2, late: -1,
    delay: -1, fake: -3, fragile: -1, waste: -3, refund: -2,
    horrible: -3, ugly: -2, slow: -1
};

const NEG = [
    'not', 'no', 'never', "don't", "didn't", "isn't", "wasn't", 'hardly'
];

const INT = {
    very: 1.5,
    extremely: 1.8,
    really: 1.3,
    so: 1.2,
    absolutely: 1.6
};

const RV = [
    'Absolutely stunning watch, perfect for formal events. Highly recommend!',
    'The strap broke in a week. Terrible quality, I want a refund.',
    'Elegant design but delivery was late.',
    'Not bad, but not worth the price either.',
    'Gorgeous perfume, I love the packaging and it is really premium.'
];


/* UTILS: small helpers (DOM shortcut, currency format, HTML escape) */

const $ = s => document.querySelector(s),
    fmt = n => '₹' + n.toLocaleString('en-IN'),
    esc = s => s.replace(/[&<>]/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    }[c]));


/* STATE: what the shop knows about the current user */

const prof = {},
    liked = new Set(),
    cart = [];

const VOC = [...new Set(P.flatMap(p => p.t.slice(1)))];


/* ML 1: recommendation engine. User profile vector + cosine similarity */

function bump(id, w) {
    P.find(p => p.id == id).t.forEach(t => prof[t] = (prof[t] || 0) + w);
}

function cos(p) {
    const n = Math.sqrt(
        Object.values(prof).reduce((s, v) => s + v * v, 0)
    );

    if (!n) return 0;

    return p.t.reduce((s, t) => s + (prof[t] || 0), 0) /
        (n * Math.sqrt(p.t.length));
}


/* ML 2: NLP intent parser (category, budget, style) and smart search */

function parse(q) {
    const L = q.toLowerCase();
    const cat = Object.keys(CATS).find(k => CATS[k].test(L));

    const m = L.match(
        /(?:under|below|within|less than|upto|up to|<)\s*(?:₹|rs\.?|inr)?\s*(\d[\d,]*)\s*(k?)/
    );

    return {
        cat,
        budget: m
            ? parseInt(m[1].replace(/,/g, '')) * (m[2] ? 1000 : 1)
            : null,
        tags: [
            ...new Set([
                ...VOC.filter(t => L.includes(t)),
                ...SYN.filter(s => s[0].test(L)).map(s => s[1])
            ])
        ]
    };
}

function search(q) {
    const i = parse(q);

    const r = P.filter(
        p => (!i.cat || p.c == i.cat) && (!i.budget || p.p <= i.budget)
    )
        .map(p => ({
            p,
            s: i.tags.filter(t => p.t.includes(t)).length
        }))
        .filter(x => !i.tags.length || x.s > 0 || i.cat)
        .sort((a, b) => b.s - a.s || a.p.p - b.p.p);

    if (!i.cat && !i.budget && !i.tags.length) {
        const w = q.toLowerCase().split(/\W+/).filter(x => x.length > 2);

        return {
            i,
            r: P.filter(p => w.some(x => p.n.toLowerCase().includes(x)))
        };
    }

    return {
        i,
        r: r.map(x => x.p)
    };
}

const desc = i => [
    i.cat && 'category: ' + i.cat,
    i.budget && 'budget ≤ ' + fmt(i.budget),
    i.tags.length && 'style: ' + i.tags.join(', ')
].filter(Boolean).join(' · ');


/* ML 3: lexicon-based sentiment analysis with negation and intensifiers */

function sent(t) {
    const w = t.toLowerCase().match(/[a-z']+/g) || [];
    let s = 0;
    const hits = [];

    w.forEach((x, i) => {
        if (!(x in LEX)) return;

        let v = LEX[x];

        if (INT[w[i - 1]]) v *= INT[w[i - 1]];

        if (NEG.includes(w[i - 1]) || NEG.includes(w[i - 2])) {
            v *= -.8;
        }

        s += v;
        hits.push([x, v]);
    });

    const pct = Math.round((Math.tanh(s / 4) + 1) / 2 * 100);

    return {
        pct,
        hits,
        lab: pct > 60 ? 'Positive' : pct < 40 ? 'Negative' : 'Neutral'
    };
}


/* UI: rendering functions and event actions */

function act(k, id) {
    if (k == 'view') bump(id, 1);

    if (k == 'like') {
        const on = !liked.has(id);

        on ? liked.add(id) : liked.delete(id);
        bump(id, on ? 3 : -3);
    }

    if (k == 'cart') {
        bump(id, 5);
        cart.push(P.find(p => p.id == id));
    }

    refresh();
}

function card(p, m) {
    const s = m && m.s > 0
        ? `<span class="badge">${Math.round(m.s * 100)}% match</span>`
        : '';

    const w = m && m.w
        ? `<div class="why">Because you like: ${m.w}</div>`
        : '';

    return `<div class="card">
        ${s}
        <div class="art" onclick="act('view',${p.id})">${p.e}</div>
        <div class="cb">
            <h3>${p.n}</h3>
            <div class="meta">${p.c}</div>
            <div class="price">${fmt(p.p)}</div>
            <div>
                ${p.t.slice(1).map(t => `<span class="chip">${t}</span>`).join(' ')}
            </div>
            ${w}
            <div class="row">
                <button class="btn o" onclick="act('like',${p.id})">
                    ${liked.has(p.id) ? '♥ Liked' : '♡ Like'}
                </button>
                <button class="btn" onclick="act('cart',${p.id})">Add</button>
            </div>
        </div>
    </div>`;
}

function recs() {
    if (!Object.keys(prof).length) {
        return $('#recs').innerHTML =
            '<div class="note">Cold start: no data yet. Interact with a few products and the model will learn your taste.</div>';
    }

    const r = P.filter(p => !liked.has(p.id) && !cart.includes(p))
        .map(p => ({
            p,
            s: cos(p),
            w: p.t.filter(t => prof[t] > 0)
                .sort((a, b) => prof[b] - prof[a])
                .slice(0, 2)
                .join(', ')
        }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 4);

    $('#recs').innerHTML =
        '<div class="grid">' + r.map(x => card(x.p, x)).join('') + '</div>';
}

function grid(list, txt) {
    $('#grid').innerHTML = list.length
        ? list.map(p => card(p)).join('')
        : '<div class="note">No matches. Try a higher budget.</div>';

    if (txt) $('#parsed').textContent = txt;
}

function doSearch() {
    const q = $('#q').value.trim();

    if (!q) {
        $('#ttl').textContent = 'The Collection';
        return grid(P);
    }

    const s = search(q);

    $('#ttl').textContent = 'Results for “' + q + '”';

    grid(
        s.r,
        'AI understood → ' + (desc(s.i) || 'no filters detected') +
        ' · ' + s.r.length + ' matches'
    );

    document.querySelector('[data-t=shop]').click();
    $('#ttl').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cartUI() {
    $('#cart').textContent =
        `🛍 ${cart.length} · ${fmt(cart.reduce((s, p) => s + p.p, 0))}`;
}

function insights() {
    const e = Object.entries(prof)
        .filter(x => x[1] > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    if (!e.length) return;

    const mx = e[0][1];

    $('#pv').innerHTML = e.map(([t, v]) => `
        <div class="bar">
            <b>${t}</b>
            <i style="width:${v / mx * 100}%"></i>
            <span>${v}</span>
        </div>
    `).join('');
}

function refresh() {
    doSearchKeep();
    recs();
    cartUI();
    insights();
}

function doSearchKeep() {
    const q = $('#q').value.trim();
    const l = q ? search(q).r : P;

    $('#grid').innerHTML = l.map(p => card(p)).join('');
}

function analyse() {
    const r = sent($('#rt').value);
    const c = r.lab == 'Positive' ? 'pos' : r.lab == 'Negative' ? 'neg' : '';

    $('#so').innerHTML =
        `<span class="big ${c}">${r.lab}</span> ` +
        `<span class="sub">${r.pct}/100</span>`;

    $('#rs').innerHTML =
        `<div class="meter"><u style="left:calc(${r.pct}% - 3px)"></u></div>` +
        r.hits.map(([w, v]) =>
            `<span class="chip ${v > 0 ? 'pos' : 'neg'}">${w} ${v > 0 ? '+' : ''}${v.toFixed(1)}</span>`
        ).join(' ');
}

function say(t, c) {
    const d = document.createElement('div');

    d.className = 'm ' + c;
    d.innerHTML = t;

    $('#log').append(d);
    $('#log').scrollTop = 1e5;
}

const picks = l => l.slice(0, 3).map(p =>
    `${p.e} ${p.n} — ${fmt(p.p)} <button class="btn o" onclick="act('cart',${p.id})">Add</button>`
).join('<br>');

const fav = () => P.filter(p => [1, 5, 9].includes(p.id));

function ask() {
    const q = $('#ci').value.trim();

    if (!q) return;

    $('#ci').value = '';
    say(esc(q), 'u');

    const L = q.toLowerCase();

    setTimeout(() => {
        if (/^(hi|hello|hey|namaste|hola)\b/.test(L)) {
            return say(
                'Hello! Tell me what you need, for example “a gift under 6000” or “blue leather watch”.',
                'b'
            );
        }

        if (/thank/.test(L)) {
            return say('Happy to help! Anything else?', 'b');
        }

        if (/help|what can you/.test(L)) {
            return say(
                'I understand a category (watch, jewellery, bag, fragrance, footwear), a budget (“under 8000”) and styles (formal, minimal, gold, blue…). You can also say “recommend something for me”.',
                'b'
            );
        }

        if (/recommend|suggest|for me|surprise/.test(L)) {
            const r = P.filter(p => !liked.has(p.id) && !cart.includes(p))
                .map(p => ({ p, s: cos(p) }))
                .sort((a, b) => b.s - a.s)
                .map(x => x.p);

            return say(
                Object.keys(prof).length
                    ? 'Based on your taste profile:<br>' + picks(r)
                    : 'You have not browsed yet, so here are some favourites:<br>' + picks(fav()),
                'b'
            );
        }

        const s = search(q);
        const d = desc(s.i);
        let r = s.r;

        if (!d) {
            r = P.filter(p =>
                L.split(/\W+/).some(w =>
                    w.length > 2 && p.n.toLowerCase().includes(w)
                )
            );
        }

        if (/cheap|afford|lowest/.test(L)) {
            r = [...r].sort((a, b) => a.p - b.p);
        }

        if (/priciest|most expensive/.test(L)) {
            r = [...r].sort((a, b) => b.p - a.p);
        }

        if (!r.length) {
            return say(
                d
                    ? `I understood <b>${d}</b>, but nothing fits. Try a higher budget or fewer filters.`
                    : 'I am not sure what you mean. Here are a few favourites:<br>' + picks(fav()),
                'b'
            );
        }

        say(
            (d ? `I understood <b>${d}</b>.` : 'Matched by name.') +
            ' Top picks:<br>' + picks(r),
            'b'
        );
    }, 350);
}


/* APP: wires events together and starts the app */

$('#rvs').innerHTML = RV.map(t => {
    const r = sent(t);

    return `<div class="rv">
        <span>${t}</span>
        <b class="${r.lab == 'Positive' ? 'pos' : r.lab == 'Negative' ? 'neg' : ''}">${r.lab} · ${r.pct}</b>
    </div>`;
}).join('');

document.querySelectorAll('nav button').forEach(b => {
    b.onclick = () => {
        document.querySelectorAll('nav button,section')
            .forEach(x => x.classList.remove('on'));

        b.classList.add('on');
        $('#' + b.dataset.t).classList.add('on');
    };
});

[
    'blue leather watch under 20000',
    'gift jewellery under 6000',
    'formal shoes',
    'minimal bag'
].forEach(s => {
    const e = document.createElement('span');

    e.textContent = s;

    e.onclick = () => {
        $('#q').value = s;
        doSearch();
    };

    $('#sug').append(e);
});

$('#go').onclick = doSearch;

$('#q').onkeydown = e => {
    if (e.key == 'Enter') doSearch();
};

$('#cs').onclick = ask;

$('#ci').onkeydown = e => {
    if (e.key == 'Enter') ask();
};

$('#an').onclick = analyse;

say(
    'Welcome to Aurelia. Describe what you are looking for in your own words.',
    'b'
);

grid(P);
recs();
analyse();
