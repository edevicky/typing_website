/* =========================================================
   TypePulse — typing engine
   ========================================================= */

(() => {
    'use strict';

    /* -----------------------------------------------------
       Data
       ----------------------------------------------------- */

    const WORD_POOL = (
        'the be to of and a in that have it for not on with he as you do at this but his by from they we say her ' +
        'she or an will my one all would there their what so up out if about who get which go me when make can like ' +
        'time no just him know take people into year your good some could them see other than then now look only come ' +
        'its over think also back after use two how our work first well way even new want because any these give day ' +
        'most us is was are been has had were said did having may should am shall might must where every much before ' +
        'right too means old same tell does set three air play small end put home read hand port large spell add even ' +
        'land here must big high such follow act why ask men change went light kind off need house picture try again ' +
        'animal point mother world near build self earth father head stand own page should country found answer school ' +
        'grow study still learn plant cover food sun four thought let keep eye never last door between city tree cross ' +
        'since hard start might story saw far sea draw left late run while press close night real life few north open ' +
        'seem together next white children begin got walk example ease paper group always music those both mark often ' +
        'letter until mile river car feet care second book carry took science eat room friend began idea fish mountain ' +
        'stop once base hear horse cut sure watch color face wood main enough plain girl usual young ready above ever ' +
        'red list though feel talk bird soon body dog family direct pose leave song measure state product black short ' +
        'numeral class wind question happen complete ship area half rock order fire south problem piece told knew pass ' +
        'farm top whole king size heard best hour better true during hundred five remember step early hold west ground ' +
        'interest reach fast verb sing listen six table travel less morning ten simple several vowel toward war lay ' +
        'against pattern slow center love person money serve appear road map rain rule govern pull cold notice voice ' +
        'fall power town fine certain fly unit lead cry dark machine note wait plan figure star box noun field rest ' +
        'correct able pound done beauty drive stood contain front teach week final gave green oh quick develop sleep ' +
        'warm free minute strong special mind behind clear tail produce fact street inch lot nothing course stay wheel ' +
        'full force blue object decide surface deep moon island foot yet busy test record boat common gold possible ' +
        'plane age dry wonder laugh thousand ago ran check game shape yes hot miss brought heat snow bed bring sit ' +
        'perhaps fill east weight language among'
    ).split(/\s+/);

    const WORD_COUNTS = { 15: 48, 30: 95, 60: 185, 120: 360 };
    const DURATIONS = [15, 30, 60, 120];
    const MODES = ['timed', 'row', 'paragraph', 'online'];
    const ROW_WORD_COUNT = 10;
    const RECORD_KEYS = [...DURATIONS, 'row', 'paragraph', 'online'];
    const ONLINE_QUOTE_URL = 'https://dummyjson.com/quotes/random';
    const STORAGE_KEY = 'typepulse.stats';
    const THEME_KEY = 'typepulse.theme';

    const PARAGRAPHS = [
        'Small habits quietly shape the way we work. A few minutes of focused practice each day can turn a difficult skill into something that feels natural. The trick is to keep showing up, even when progress seems slow.',
        'The morning light moved slowly across the kitchen table. She poured a cup of tea, opened her notebook, and wrote down three things she wanted to finish before noon. By the end of the day, two of them were done.',
        'Good typing is less about speed than control. When your hands know where each key lives, your attention can stay on the words instead of the keyboard. Speed arrives later, almost as a side effect of that calm rhythm.',
        'A quiet street can tell you a lot about a town. There are the small shops that open early, the bicycles leaning against brick walls, and the neighbour who waters the same row of plants every evening. Nothing loud, but everything alive.',
        'Learning anything new takes a strange kind of patience. You practice the same movements until they stop feeling like decisions. One day the work becomes smooth, and you cannot quite remember when the change happened.',
        'The library closed at six, but the reading room stayed busy until the last minute. Students stacked their books, someone laughed softly near the window, and the librarian began switching off the long rows of lamps one by one.'
    ];

    /* -----------------------------------------------------
       Elements
       ----------------------------------------------------- */

    const el = {
        header: document.getElementById('site-header'),
        card: document.getElementById('typing-card'),
        input: document.getElementById('typing-input'),
        words: document.getElementById('words'),
        caret: document.getElementById('caret'),
        hint: document.getElementById('focus-hint'),
        hintText: document.getElementById('hint-text'),
        status: document.getElementById('status-text'),
        liveWpm: document.getElementById('live-wpm'),
        liveAccuracy: document.getElementById('live-accuracy'),
        liveTime: document.getElementById('live-time'),
        liveTimeLabel: document.getElementById('live-time-label'),
        timerFill: document.getElementById('timer-fill'),

        results: document.getElementById('results'),
        resultsEyebrow: document.getElementById('results-eyebrow'),
        resultWpm: document.getElementById('result-wpm'),
        resultAccuracy: document.getElementById('result-accuracy'),
        resultRaw: document.getElementById('result-raw'),
        resultChars: document.getElementById('result-chars'),
        resultTime: document.getElementById('result-time'),
        resultMode: document.getElementById('result-mode'),
        againBtn: document.getElementById('again-btn'),
        closeBtn: document.getElementById('close-btn'),

        restartBtn: document.getElementById('restart-btn'),
        modeButtons: Array.from(document.querySelectorAll('[data-duration]')),
        testButtons: Array.from(document.querySelectorAll('button[data-mode]')),
        durationGroup: document.getElementById('duration-group'),
        themeToggle: document.getElementById('theme-toggle'),
        themeColor: document.getElementById('theme-color'),

        testsCount: document.getElementById('tests-count'),
        avgAccuracy: document.getElementById('avg-accuracy'),
        resetRecords: document.getElementById('reset-records'),
        recordNums: Array.from(document.querySelectorAll('[data-best]')),
        recordBars: Array.from(document.querySelectorAll('[data-bar]')),
        recordNotes: Array.from(document.querySelectorAll('[data-note]')),
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    /* -----------------------------------------------------
       State
       ----------------------------------------------------- */

    const state = {
        mode: 'timed',
        duration: 30,
        words: [],
        flat: '',
        typed: [],
        charEls: new Map(),
        index: 0,
        running: false,
        finished: false,
        focused: false,
        startedAt: 0,
        elapsed: 0,
        timerId: null,
        totalKeys: 0,
        correctKeys: 0,
        onlineLabel: '',
    };

    let onlineRequest = 0;
    let store = loadStore();

    /* -----------------------------------------------------
       Local storage
       ----------------------------------------------------- */

    function loadStore() {
        const fresh = { records: {}, tests: 0, accuracyTotal: 0, wpmTotal: 0 };

        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return fresh;

            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return fresh;

            for (const key of RECORD_KEYS) {
                const value = Number(parsed.records && parsed.records[key]);
                if (Number.isFinite(value) && value > 0) {
                    fresh.records[key] = Math.round(value);
                }
            }

            fresh.tests = Math.max(0, Math.floor(Number(parsed.tests) || 0));
            fresh.accuracyTotal = Math.max(0, Number(parsed.accuracyTotal) || 0);
            fresh.wpmTotal = Math.max(0, Number(parsed.wpmTotal) || 0);
        } catch (error) {
            /* Storage can be unavailable in private or file:// contexts. */
        }

        return fresh;
    }

    function saveStore() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        } catch (error) {
            /* Ignore storage failures. */
        }
    }

    /* -----------------------------------------------------
       Test generation
       ----------------------------------------------------- */

    function randomWord(previous) {
        let word = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
        let attempts = 0;

        while (word === previous && attempts < 12) {
            word = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
            attempts += 1;
        }

        return word;
    }

    function randomWords(count) {
        const words = [];
        let previous = '';

        for (let index = 0; index < count; index += 1) {
            const word = randomWord(previous);
            words.push(word);
            previous = word;
        }

        return words;
    }

    function randomParagraph() {
        return PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)];
    }

    function normalizeText(value) {
        return String(value || '')
            .replace(/[\u2018\u2019\u02bc]/g, "'")
            .replace(/[\u201c\u201d]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[^\x20-\x7e]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function buildTest(textOverride) {
        const override = normalizeText(textOverride);
        let text = override;

        if (!text) {
            if (state.mode === 'timed') {
                text = randomWords(WORD_COUNTS[state.duration] || 120).join(' ');
            } else if (state.mode === 'row') {
                text = randomWords(ROW_WORD_COUNT).join(' ');
            } else {
                text = randomParagraph();
            }
        }

        state.words = text.split(' ');
        state.flat = text;
        state.typed = new Array(state.flat.length).fill(null);
        state.charEls = new Map();
        state.index = 0;
        state.elapsed = 0;

        const fragment = document.createDocumentFragment();
        let flatIndex = 0;

        state.words.forEach((word, wordIndex) => {
            const wordEl = document.createElement('span');
            wordEl.className = 'word';

            for (const character of word) {
                const charEl = document.createElement('span');
                charEl.className = 'char';
                charEl.textContent = character;
                state.charEls.set(flatIndex, charEl);
                wordEl.appendChild(charEl);
                flatIndex += 1;
            }

            fragment.appendChild(wordEl);

            if (wordIndex < state.words.length - 1) {
                flatIndex += 1; // the space between words
            }
        });

        el.words.replaceChildren(fragment);
        el.card.dataset.mode = state.mode;
        renderText();
        resetLiveStats();
        requestAnimationFrame(updateCaret);
    }

    /* -----------------------------------------------------
       Rendering
       ----------------------------------------------------- */

    function renderText() {
        for (const [index, node] of state.charEls) {
            const expected = state.flat[index];
            const typed = state.typed[index];
            let className = 'char';

            if (typed === null) {
                if (index < state.index) className += ' missed';
                node.textContent = expected;
            } else if (typed === expected) {
                className += ' correct';
                node.textContent = expected;
            } else {
                className += ' incorrect';
                node.textContent = typed;
            }

            node.className = className;
        }
    }

    function updateCaret() {
        if (state.finished) return;

        let target = state.charEls.get(state.index);
        let placeAfter = false;

        if (!target) {
            const previous = state.charEls.get(state.index - 1);

            if (previous) {
                target = previous;
                placeAfter = true;
            } else if (state.index >= state.flat.length) {
                const last = state.charEls.get(state.flat.length - 1);
                if (last) {
                    target = last;
                    placeAfter = true;
                }
            }
        }

        if (!target) return;

        const x = placeAfter ? target.offsetLeft + target.offsetWidth : target.offsetLeft;
        const y = target.offsetTop;

        el.caret.style.transform = `translate(${x}px, ${y}px)`;
        el.caret.style.height = `${target.offsetHeight}px`;
    }

    function resetLiveStats() {
        const timed = state.mode === 'timed';

        el.liveWpm.textContent = '0';
        el.liveAccuracy.textContent = '100';
        el.liveTimeLabel.textContent = timed ? 'remaining' : 'elapsed';
        el.liveTime.textContent = timed ? String(state.duration) : '0';
        el.timerFill.style.width = '0%';
        el.status.textContent = statusText();
    }

    function statusText() {
        if (state.mode === 'row') return 'Finish the row to see your score. Timer starts on your first keystroke.';
        if (state.mode === 'paragraph') return 'Type the paragraph at your own pace. Timer starts on your first keystroke.';
        if (state.mode === 'online') return 'Online quote practice. Timer starts on your first keystroke.';
        return 'Timer starts on your first keystroke.';
    }

    function modeLabel() {
        if (state.mode === 'row') return `Row practice · ${state.words.length} words`;
        if (state.mode === 'paragraph') return `Paragraph practice · ${state.words.length} words`;
        if (state.mode === 'online') {
            return state.onlineLabel ? `Online quote · ${state.onlineLabel}` : 'Online quote practice';
        }
        return `${state.duration} second test`;
    }

    function countCorrectChars() {
        let correct = 0;

        for (let index = 0; index < state.flat.length; index += 1) {
            if (state.typed[index] === state.flat[index]) correct += 1;
        }

        return correct;
    }

    function updateLiveStats() {
        if (!state.startedAt) return;

        const elapsed = (performance.now() - state.startedAt) / 1000;
        const correct = countCorrectChars();
        const wpm = elapsed > 0.5 ? Math.round((correct / 5) / (elapsed / 60)) : 0;
        const accuracy = state.totalKeys > 0
            ? Math.round((state.correctKeys / state.totalKeys) * 100)
            : 100;

        el.liveWpm.textContent = String(Math.min(999, Math.max(0, wpm)));
        el.liveAccuracy.textContent = String(accuracy);
    }

    /* -----------------------------------------------------
       Timer
       ----------------------------------------------------- */

    function startTest() {
        if (state.running || state.finished) return;

        state.running = true;
        state.startedAt = performance.now();
        state.elapsed = 0;
        el.card.classList.add('is-running');
        el.card.classList.remove('is-finished');
        el.status.textContent = 'Keep going — Esc restarts with fresh text.';
        hideHintForFocus();

        state.timerId = window.setInterval(tick, 100);
        tick();
    }

    function tick() {
        if (!state.running) return;

        const elapsed = (performance.now() - state.startedAt) / 1000;

        if (state.mode === 'timed') {
            const remaining = Math.max(0, state.duration - elapsed);

            state.elapsed = Math.min(elapsed, state.duration);
            el.liveTime.textContent = String(Math.ceil(remaining));
            el.timerFill.style.width = `${Math.min(100, (elapsed / state.duration) * 100)}%`;
            updateLiveStats();

            if (remaining <= 0) finishTest();
            return;
        }

        state.elapsed = elapsed;
        el.liveTime.textContent = String(Math.floor(elapsed));
        el.timerFill.style.width = `${Math.min(100, (state.index / Math.max(1, state.flat.length)) * 100)}%`;
        updateLiveStats();
    }

    function stopTimer() {
        if (state.timerId !== null) {
            window.clearInterval(state.timerId);
            state.timerId = null;
        }
    }

    /* -----------------------------------------------------
       Typing input
       ----------------------------------------------------- */

    function recordKey(correct) {
        state.totalKeys += 1;
        if (correct) state.correctKeys += 1;
    }

    function skipToNextWord(fromIndex) {
        const nextSpace = state.flat.indexOf(' ', fromIndex);

        if (nextSpace === -1) {
            state.index = state.flat.length;
        } else {
            state.typed[nextSpace] = ' ';
            state.index = nextSpace + 1;
        }
    }

    function handleCharacter(character) {
        if (state.finished || character.length !== 1) return;

        if (!state.running) startTest();

        const index = state.index;
        if (index >= state.flat.length) return;

        const expected = state.flat[index];

        if (expected === ' ') {
            if (character === ' ') {
                recordKey(true);
                state.typed[index] = ' ';
                state.index += 1;
            } else {
                recordKey(false);
            }
        } else if (character === ' ') {
            recordKey(false);
            skipToNextWord(index);
        } else {
            const correct = character === expected;
            recordKey(correct);
            state.typed[index] = character;
            state.index += 1;
        }

        renderText();
        updateCaret();
        updateLiveStats();

        if (state.index >= state.flat.length) finishTest();
    }

    function handleBackspace() {
        if (state.finished || !state.running || state.index === 0) return;

        let index = state.index - 1;

        if (state.flat[index] === ' ') {
            state.typed[index] = null;
            index -= 1;
        }

        if (index < 0) {
            state.index = 0;
        } else {
            state.index = index;
            state.typed[index] = null;
        }

        renderText();
        updateCaret();
        updateLiveStats();
    }

    /* -----------------------------------------------------
       Finishing
       ----------------------------------------------------- */

    function finishTest() {
        if (!state.running) return;

        state.running = false;
        state.finished = true;
        stopTimer();

        const timed = state.mode === 'timed';
        const elapsedCap = timed ? state.duration : 3600;
        const elapsedRaw = state.startedAt
            ? (performance.now() - state.startedAt) / 1000
            : elapsedCap;
        const elapsed = Math.max(0.1, Math.min(elapsedRaw, elapsedCap));

        state.elapsed = elapsed;
        el.card.classList.remove('is-running');
        el.card.classList.add('is-finished');
        el.liveTime.textContent = timed ? '0' : String(Math.round(elapsed));
        el.timerFill.style.width = '100%';
        el.hint.classList.add('is-hidden');
        el.status.textContent = 'Nice run. Review your results.';

        state.focused = false;
        el.input.blur();
        el.card.classList.remove('is-focused');

        const correctChars = countCorrectChars();
        const totalKeys = state.totalKeys;
        const accuracy = totalKeys > 0 ? (state.correctKeys / totalKeys) * 100 : 100;
        const minutes = Math.max(elapsed, 0.5) / 60;
        const wpm = correctChars > 0 ? Math.round((correctChars / 5) / minutes) : 0;
        const rawWpm = totalKeys > 0 ? Math.round((totalKeys / 5) / minutes) : 0;
        const recordKey = timed ? String(state.duration) : state.mode;

        const previousBest = Number(store.records[recordKey]) || 0;
        const isNewBest = wpm > previousBest && correctChars > 0;

        if (isNewBest) store.records[recordKey] = wpm;
        store.tests += 1;
        store.accuracyTotal += accuracy;
        store.wpmTotal += wpm;
        saveStore();
        renderRecords();

        el.resultsEyebrow.textContent = isNewBest ? '★ New personal best' : 'Test complete';
        el.resultWpm.textContent = String(wpm);
        el.resultAccuracy.textContent = formatPercent(accuracy);
        el.resultRaw.textContent = `${rawWpm} wpm`;
        el.resultChars.textContent = String(correctChars);
        el.resultTime.textContent = formatSeconds(elapsed);
        el.resultMode.textContent = modeLabel();

        el.results.hidden = false;
        el.againBtn.focus({ preventScroll: true });
    }

    /* -----------------------------------------------------
       Reset / focus
       ----------------------------------------------------- */

    function restart(options = {}) {
        const focus = options.focus !== false;

        stopTimer();
        state.running = false;
        state.finished = false;
        state.startedAt = 0;
        state.elapsed = 0;
        state.totalKeys = 0;
        state.correctKeys = 0;
        state.onlineLabel = '';

        el.results.hidden = true;
        el.card.classList.remove('is-running', 'is-finished');
        el.status.textContent = statusText();

        buildTest();
        updateLiveStats();
        syncFocusUI();
        requestAnimationFrame(updateCaret);

        if (focus) {
            el.input.focus({ preventScroll: true });
        } else if (document.activeElement === el.input) {
            el.input.blur();
        }

        if (state.mode === 'online') fetchOnlineText();
    }

    function setDuration(duration, options = {}) {
        if (!DURATIONS.includes(duration)) return;

        state.duration = duration;
        el.modeButtons.forEach((button) => {
            button.setAttribute('aria-pressed', String(Number(button.dataset.duration) === duration));
        });

        restart({ focus: options.focus !== false });
    }

    function setMode(mode, options = {}) {
        if (!MODES.includes(mode)) return;

        onlineRequest += 1;
        state.mode = mode;

        el.testButtons.forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
        });
        el.durationGroup.hidden = mode !== 'timed';

        restart({ focus: options.focus !== false });
    }

    async function fetchOnlineText() {
        const request = ++onlineRequest;
        if (state.mode !== 'online') return;

        el.status.textContent = 'Fetching a fresh quote from the web…';

        try {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 6000);
            let data;

            try {
                const response = await fetch(ONLINE_QUOTE_URL, {
                    signal: controller.signal,
                    cache: 'no-store',
                });

                if (!response.ok) throw new Error(`Quote request failed: ${response.status}`);
                data = await response.json();
            } finally {
                window.clearTimeout(timeout);
            }

            const quote = normalizeText(data && data.quote);
            const author = normalizeText(data && data.author);

            if (!quote || quote.length < 24) throw new Error('Quote was too short.');

            if (request !== onlineRequest || state.mode !== 'online' || state.running || state.finished) {
                return;
            }

            state.onlineLabel = author;
            buildTest(quote);
            updateLiveStats();
            el.status.textContent = 'Fresh quote loaded. Start typing when you are ready.';
        } catch (error) {
            if (request !== onlineRequest || state.mode !== 'online' || state.running || state.finished) {
                return;
            }

            el.status.textContent =
                'Quote service unavailable — using an offline paragraph. Press Esc for a new one.';
        }
    }

    function syncFocusUI() {
        const focused = state.focused && !state.finished;

        el.card.classList.toggle('is-focused', focused);

        if (state.finished) {
            el.hint.classList.add('is-hidden');
            return;
        }

        if (focused) {
            el.hint.classList.add('is-hidden');
        } else {
            el.hintText.textContent = state.running
                ? 'Click here to keep typing'
                : 'Click here and start typing';
            el.hint.classList.remove('is-hidden');
        }
    }

    function hideHintForFocus() {
        if (state.focused) el.hint.classList.add('is-hidden');
    }

    function focusTest() {
        if (!el.results.hidden) {
            restart({ focus: true });
            return;
        }

        el.input.focus({ preventScroll: true });
        updateCaret();
    }

    /* -----------------------------------------------------
       Records
       ----------------------------------------------------- */

    function renderRecords() {
        for (const node of el.recordNums) {
            const duration = node.dataset.best;
            const best = Number(store.records[duration]) || 0;
            node.textContent = best > 0 ? String(best) : '—';
        }

        for (const bar of el.recordBars) {
            const best = Number(store.records[bar.dataset.bar]) || 0;
            const width = best > 0 ? Math.min(100, (best / 140) * 100) : 0;
            bar.style.width = `${width}%`;
        }

        for (const note of el.recordNotes) {
            const best = Number(store.records[note.dataset.note]) || 0;
            note.textContent = best > 0 ? 'Your best run' : 'No test yet';
        }

        el.testsCount.textContent = String(store.tests);
        el.avgAccuracy.textContent = store.tests > 0
            ? formatPercent(store.accuracyTotal / store.tests)
            : '—';
    }

    function resetRecords() {
        const confirmed = window.confirm('Reset all personal records and statistics? This cannot be undone.');
        if (!confirmed) return;

        store = { records: {}, tests: 0, accuracyTotal: 0, wpmTotal: 0 };
        saveStore();
        renderRecords();
    }

    /* -----------------------------------------------------
       Formatting
       ----------------------------------------------------- */

    function formatPercent(value) {
        const clamped = Math.min(100, Math.max(0, value));
        return `${Number(clamped.toFixed(1))}%`;
    }

    function formatSeconds(seconds) {
        const rounded = Number(seconds.toFixed(1));
        return `${rounded}s`;
    }

    /* -----------------------------------------------------
       Theme
       ----------------------------------------------------- */

    function currentTheme() {
        return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    }

    function applyTheme(theme, persist = true) {
        document.documentElement.dataset.theme = theme;
        el.themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
        el.themeToggle.setAttribute(
            'aria-label',
            theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
        );

        if (el.themeColor) {
            el.themeColor.setAttribute('content', theme === 'light' ? '#f4f1e8' : '#08090c');
        }

        if (persist) {
            try {
                window.localStorage.setItem(THEME_KEY, theme);
            } catch (error) {
                /* Ignore storage failures. */
            }
        }
    }

    /* -----------------------------------------------------
       Events
       ----------------------------------------------------- */

    el.input.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        if (!state.focused) {
            state.focused = true;
            syncFocusUI();
        }

        if (state.finished) {
            if (event.key === 'Tab') return;
            event.preventDefault();
            return;
        }

        if (event.key === 'Backspace') {
            event.preventDefault();
            handleBackspace();
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            return;
        }

        if (event.key.length === 1) {
            event.preventDefault();
            handleCharacter(event.key);
        }
    });

    /* Mobile keyboards sometimes report "Unidentified" on keydown. The
       input event below catches those characters. */
    el.input.addEventListener('input', (event) => {
        const value = el.input.value;

        if (!value) {
            if (event.inputType === 'deleteContentBackward') handleBackspace();
            return;
        }

        el.input.value = '';

        if (state.finished) return;

        for (const character of value) {
            handleCharacter(character);
        }
    });

    el.input.addEventListener('focus', () => {
        state.focused = true;
        syncFocusUI();
        updateCaret();
    });

    el.input.addEventListener('blur', () => {
        state.focused = false;
        syncFocusUI();
    });

    el.restartBtn.addEventListener('click', () => {
        restart({ focus: !coarsePointer });
    });

    for (const button of el.modeButtons) {
        button.addEventListener('click', () => {
            setDuration(Number(button.dataset.duration), { focus: !coarsePointer });
        });
    }

    for (const button of el.testButtons) {
        button.addEventListener('click', () => {
            setMode(button.dataset.mode, { focus: !coarsePointer });
        });
    }

    el.againBtn.addEventListener('click', () => {
        restart({ focus: true });
    });

    el.closeBtn.addEventListener('click', () => {
        restart({ focus: false });
    });

    el.resetRecords.addEventListener('click', resetRecords);

    document.querySelectorAll('[data-start]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();

            el.card.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start',
            });

            if (prefersReducedMotion) {
                focusTest();
            } else {
                window.setTimeout(focusTest, 350);
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (!el.results.hidden) {
            if (event.key === 'Escape') {
                event.preventDefault();
                restart({ focus: false });
                return;
            }

            if (event.key === 'Tab') {
                const focusable = [el.againBtn, el.closeBtn];

                if (event.shiftKey && document.activeElement === focusable[0]) {
                    event.preventDefault();
                    focusable[focusable.length - 1].focus();
                } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
                    event.preventDefault();
                    focusable[0].focus();
                }
            }

            return;
        }

        if (event.key !== 'Escape') return;

        if (state.focused) {
            event.preventDefault();
            restart({ focus: true });
            return;
        }

        if (document.activeElement === el.input || el.card.matches(':focus-within')) {
            event.preventDefault();
            restart({ focus: true });
        }
    });

    el.themeToggle.addEventListener('click', () => {
        applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
    });

    window.addEventListener('scroll', () => {
        el.header.classList.toggle('is-scrolled', window.scrollY > 8);
    }, { passive: true });

    let resizeFrame = 0;
    window.addEventListener('resize', () => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(updateCaret);
    });

    /* -----------------------------------------------------
       Init
       ----------------------------------------------------- */

    applyTheme(currentTheme(), false);
    el.header.classList.toggle('is-scrolled', window.scrollY > 8);
    renderRecords();
    buildTest();
    syncFocusUI();
    updateCaret();

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(updateCaret).catch(() => {});
    }
})();
