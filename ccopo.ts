window.addEventListener("load", e => {
    if (!window.location.pathname.includes("ccopo")) {
        const iframe = document.getElementsByName("iframe_a").item(0) as HTMLIFrameElement;
        if (window.location.hash) {
            iframe.src = window.location.hash.slice(1).replace(/^\//, "");
        }
        const dom = document.querySelector(".left-panel .wrapper");
        const links: HTMLAnchorElement[] = [];
        window.addEventListener("hashchange", () => {
            links.forEach(l => l.classList.remove("high-lighted"));
            (document.querySelectorAll(".left-panel a") as NodeListOf<HTMLAnchorElement>).forEach(a => {
                if (a.href.endsWith(window.location.hash.slice(1))) a.classList.add("high-lighted")
            });
        });
        for (const i of lesson_data) {
            if (!i.url) {
                const b = document.createElement("b");
                b.innerText = i.name;
                dom.appendChild(b);
                continue;
            }
            const a = document.createElement("a");
            links.push(a);
            a.href = i.url.replace(/^\//, "");
            if (iframe.src === a.href) a.classList.add("high-lighted");
            a.target = "iframe_a";
            a.innerText = i.name;
            a.addEventListener("click", e => {
                window.location.hash = i.url;
            });
            dom.appendChild(a);
        }
        return;
    }
    function shuffle(n: number) {
        let arr: number[] = new Array(n).fill(0).map((_, i) => i);
        for (let i = arr.length - 1; i >= 0; i--) {
            let temRandom = Math.floor(Math.random() * i);
            [arr[i], arr[temRandom]] = [arr[temRandom], arr[i]];
        }
        return arr;
    }
    const hashed_data = Object.fromEntries(Object.values(raw_data).map(e =>
        [e.unicode, { latin: e.latin, phonetique: e.phonetique }]
    ));
    function char2latin(char: string) {
        return hashed_data[char.charCodeAt(0)]?.latin.replaceAll("-", "") ?? char;
    }
    function addRubyForStr(str: string) {
        let s = "";
        let rt = "";
        for (let idx = 0; idx < str.length; idx++) {
            const c = str[idx];
            if (rt) {// annotation mode xxx@yy@
                if (c === "@") {// second @
                    s += rt + "</rt><rp>)</rp></ruby>"; rt = "";
                } else { // yy
                    rt += c;
                }
            } else {
                // normal mode
                if (c === " ") {
                    s += "&nbsp;&nbsp;";
                } else if (c === "@") {//enter annotation mode
                    rt = "<rp>(</rp><rt>";
                } else if (str[idx + 1] === "@") {
                    s += "<ruby>" + c;
                } else {
                    s += "<ruby>" + c + "<rp>(</rp><rt>" + char2latin(c) + "</rt><rp>)</rp></ruby>";
                }
            }
        }
        return s;
    }
    const divChoice = document.querySelectorAll("div[data-choice]");
    divChoice.forEach(div => {
        let substep = 0;
        const wordList = div.getAttribute("data-choice").split("|").map(s => s.split(" ").map(e => e.replace(/\:/g, " ")));
        const order = shuffle(wordList[0].length << 1);
        function nextQuestion() {
            const order2 = shuffle(wordList[0].length);
            const container = document.createElement("div");
            container.classList.add("choice-container");
            const item = document.createElement("div");
            item.classList.add("choice-item");
            const id = order[substep];
            if (!isFinite(id)) { div.lastElementChild.innerHTML = `已答对：${order.length}/${order.length} - 恭喜你完成了该练习所有题目！`; return; }
            div.innerHTML = "";
            item.innerText = wordList[id & 1][id >> 1];
            container.appendChild(item);
            const wrapper = document.createElement("div");
            container.classList.add("choice-item-wrapper");
            container.appendChild(wrapper);

            for (const i of order2) {
                const op = wordList[(id + 1) & 1][i];
                const option = document.createElement("div");
                option.innerText = op;
                option.classList.add("choice-option");
                option.addEventListener("click", ev => {
                    if (wordList[(id + 1) & 1][id >> 1] !== op) {
                        option.classList.add("error");
                    } else {
                        option.classList.add("correct");
                        setTimeout(() => {
                            substep++;
                            nextQuestion();
                        }, 200);
                    }
                });
                wrapper.appendChild(option);
            }
            div.appendChild(container);
            const text = document.createElement("span");
            text.innerText = "已答对：" + substep + "/" + order.length;
            div.appendChild(text);
        }
        nextQuestion();
    });

    const divWord = document.querySelectorAll("div[data-word],div[data-sentence]");
    divWord.forEach(div => {
        const isWord = div.getAttribute("data-word");
        const wordList = (div.getAttribute("data-word") || div.getAttribute("data-sentence")).split(isWord ? "," : ";;").map(s => s.split(":"));
        const container = document.createElement("div");
        container.classList.add(isWord ? "word-container" : "sentence-container");
        for (const [word, chinese] of wordList) {
            const item1 = document.createElement("div");
            item1.classList.add(isWord ? "word-item" : "sentence-item");
            const item2 = document.createElement("div");
            item2.classList.add(isWord ? "word-item" : "sentence-item");
            item1.innerHTML = addRubyForStr(word);//annotated_word.join("");
            item2.innerHTML = chinese;
            container.appendChild(item1);
            container.appendChild(item2);
        }
        div.appendChild(container);
        const option = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        option.appendChild(checkbox);
        option.appendChild(document.createTextNode("显示拉丁注音"));
        checkbox.checked = !!div.getAttribute("data-word-ruby");
        const event = () => {
            if (checkbox.checked) {
                container.classList.remove("noruby");
            } else {
                container.classList.add("noruby");
            }
        };
        checkbox.addEventListener("change", event);
        event();
        div.appendChild(option);
    });

    const divSelect = document.querySelectorAll("div[data-select]");
    divSelect.forEach(div => {
        const wordList = div.getAttribute("data-select").split(";;").map(s => s.split("|"));
        let id = 0;
        function nextQuestion() {
            const container = document.createElement("div");
            container.classList.add("select-container");
            const nanto = wordList[id];
            if (!nanto) { div.lastElementChild.innerHTML = `已答对：${wordList.length}/${wordList.length} - 恭喜你完成了该练习所有题目！`; return; }
            div.innerHTML = "";
            const nantober = document.createElement("div");
            let subId = 0;
            for (const option of nanto) {
                if (!subId) {
                    const p = document.createElement("p");
                    p.innerText = option;
                    nantober.appendChild(p);
                } else {
                    const label = document.createElement("label");
                    const radio = document.createElement("input");
                    radio.type = "radio";
                    radio.name = "select" + id;
                    label.appendChild(radio);
                    const prefix = "0ABCDEFGHIJKLMNOPQ"[subId] + ". ";
                    if (option.startsWith("*")) {
                        label.appendChild(document.createTextNode(prefix + option.slice(1)));
                    } else {
                        label.appendChild(document.createTextNode(prefix + option));
                    }
                    radio.addEventListener("change", e => {
                        if (option.startsWith("*")) {
                            label.classList.add("correct");
                            setTimeout(() => {
                                id++;
                                nextQuestion();
                            }, 200);
                        } else { label.classList.add("error"); }
                    });
                    nantober.appendChild(label);
                }
                subId++;
            }
            container.appendChild(nantober);
            div.appendChild(container);
            const text = document.createElement("span");
            text.innerText = "已答对：" + id + "/" + wordList.length;
            div.appendChild(text);
        }
        nextQuestion();
    });

    const divFill = document.querySelectorAll("div[data-fill]");
    divFill.forEach(div => {
        const wordList = div.getAttribute("data-fill").split(";;").map(s => s.split("|"));
        const isWord = !!div.getAttribute("data-is-word");
        let id = 0;
        function nextQuestion() {
            const container = document.createElement("div");
            container.classList.add("fill-container");
            const nanto = wordList[id];
            if (!nanto) {
                div.lastElementChild.innerHTML = `已答对：${wordList.length}/${wordList.length} - 恭喜你完成了该练习所有题目！`;
                return;
            }
            div.innerHTML = "";
            const nantober = document.createElement("div");
            const body = document.createElement("div");
            body.classList.add(isWord ? "choice-item" : "sentence-item");
            nantober.appendChild(body);
            body.innerText = nanto[0];
            const nanv = nanto.slice(1);
            const input = document.createElement("input");
            nantober.appendChild(input);
            const check = document.createElement("button");
            check.innerText = '检查';
            const fn = e => {
                if (e.key && e.key !== "Enter") { input.classList.remove("error"); input.classList.remove("correct"); return; }
                if (nanv.includes(input.value.trim())) {
                    input.classList.add("correct");
                    setTimeout(() => {
                        id++;
                        if (!wordList[id]) { check.disabled = true; check.innerText = "完成"; }
                        nextQuestion();
                    }, 200);
                } else { input.classList.add("error"); }
            };
            check.addEventListener("click", fn);
            input.addEventListener("keydown", fn);
            nantober.appendChild(check);
            container.appendChild(nantober);
            div.appendChild(container);
            const text = document.createElement("span");
            text.innerText = "已答对：" + id + "/" + wordList.length;
            div.appendChild(text);
            if (id) input.focus();
        }
        nextQuestion();
    });

    const divInput = document.querySelectorAll("div[data-input]");
    divInput.forEach(div => {
        const colorTable = ["red", "purple", "green", "gray"];
        let colorPtr = 0;
        const wordList = div.getAttribute("data-input");
        div.innerHTML = "<p>请点击下方按钮输入低趣语字符</p>";
        const inputSearchDom = div.parentElement;
        for (const char of wordList) {
            if (char === "|") { colorPtr++; continue; }
            const btn = document.createElement("button");
            btn.innerText = char === " " ? "空格" : char;
            btn.style.color = colorTable[colorPtr];
            btn.addEventListener("click", () => {
                const input = inputSearchDom.querySelector("input");
                const val = input.value;
                const start = input.selectionStart;
                const end = input.selectionEnd;
                input.value = val.substring(0, start) + char + val.substring(end);
                input.selectionStart = input.selectionEnd = this._selEnd = start + char.length;
                input.focus();
            });
            btn.classList.add("dichuu-serif");
            btn.classList.add("dichuu-input-btn");
            div.appendChild(btn);
        }
    });

    
    const divAlphabet = document.querySelectorAll("div[data-alphabet]");
    divAlphabet.forEach(div => {
        for (const char of div.getAttribute("data-alphabet")) {
            const el = document.createElement("div");
            const el1 = document.createElement("span");
            const el2 = document.createElement("span");
            el2.innerHTML = el1.innerHTML = addRubyForStr(char);
            el1.classList.add("dichuu-serif");
            el2.classList.add("dichuu-hand");
            el.classList.add("alphabet");
            el.appendChild(el1);
            el.appendChild(document.createTextNode(" "));
            el.appendChild(el2);
            div.appendChild(el);
        }
    });

    const currentLesson = window.location.pathname.match(/\/[a-z0-9]+\/[a-z0-9]+.html$/)[0];
    const lessons = lesson_data.map(e => e.url).filter(e => e);
    const lessonId = lessons.indexOf(currentLesson);

    const prev_page = document.createElement("button");
    prev_page.innerText = "上一课"; prev_page.classList.add("page");

    prev_page.addEventListener("click", () => {
        if (lessons[lessonId - 1]) {
            window.location.href = ".." + lessons[lessonId - 1];
            window.parent.location.hash = lessons[lessonId - 1];
        } else alert("已是第一课！");
    })
    document.body.appendChild(prev_page);

    const next_page = document.createElement("button");
    next_page.innerText = "下一课"; next_page.classList.add("page");
    next_page.addEventListener("click", () => {
        if (lessons[lessonId + 1]) {
            window.location.href = ".." + lessons[lessonId + 1];
            window.parent.location.hash = lessons[lessonId + 1];
        }
        else alert("已是最后一课！");
    })
    document.body.appendChild(next_page);
});
const lesson_data = [
    { name: "A0: 入门教程" },
    { url: "/a0/ccopo1.html", name: "1. 低趣语简介" },
    { url: "/a0/ccopo2.html", name: "2. 单元音与辅音1" },
    { url: "/a0/ccopo3.html", name: "3. 单元音与辅音2" },
    { url: "/a0/ccopo4.html", name: "4. 复元音与辅音" },
    { url: "/a0/ccopo5.html", name: "5. 复习1" },
    { url: "/a0/ccopo6.html", name: "6. 动词变位" },
    { url: "/a0/ccopo7.html", name: "7. 问候语" },
    { url: "/a0/ccopo8.html", name: "8. 描述位置" },
    { url: "/a0/ccopo9.html", name: "9. 询问位置" },
    { url: "/a0/ccopo10.html", name: "10. 复习2" },
    { name: "A1: 初级教程" },
    { url: "/a1/ccopo11.html", name: "11. 天书与水文" },
    { url: "/a1/ccopo12.html", name: "12. 动词原型" },
    { url: "/a1/ccopo13.html", name: "13. 动词" },
    { url: "/a1/ccopo14.html", name: "14. 一般动词" },
    { url: "/a1/ccopo15.html", name: "15. 复习3" },
    { url: "/a1/ccopo16.html", name: "16. 动词时态" },
    { url: "/a1/ccopo17.html", name: "17. 表达数量" },
    { url: "/a1/ccopo18.html", name: "18. 询问价格" },
    { url: "/a1/ccopo19.html", name: "19. 时间与日期" },
    { url: "/a1/ccopo20.html", name: "20. 复习4:字母总结" },
    { name: "后续课程施工(摆烂)中..." },

];

const raw_data = {
    "a": {
        "latin": "a",
        "phonetique": "a",
        "unicode": 61440
    },
    "o": {
        "latin": "o",
        "phonetique": "o",
        "unicode": 61441
    },
    "e": {
        "latin": "e",
        "phonetique": "ɛ",
        "unicode": 61442
    },
    "i": {
        "latin": "i",
        "phonetique": "i",
        "unicode": 61443
    },
    "u": {
        "latin": "u",
        "phonetique": "u",
        "unicode": 61444
    },
    "ii": {
        "latin": "ii",
        "phonetique": "ẓ",
        "unicode": 61445
    },
    "uu": {
        "latin": "uu",
        "phonetique": "y",
        "unicode": 61446
    },
    "ee": {
        "latin": "ee",
        "phonetique": "ɤ",
        "unicode": 61447
    },
    "ai": {
        "latin": "ai",
        "phonetique": "aɪ",
        "unicode": 61448
    },
    "ao": {
        "latin": "ao",
        "phonetique": "ɑʊ",
        "unicode": 61449
    },
    "an": {
        "latin": "an",
        "phonetique": "an",
        "unicode": 61450
    },
    "ah": {
        "latin": "ah",
        "phonetique": "ɑŋ",
        "unicode": 61451
    },
    "on": {
        "latin": "on",
        "phonetique": "ʊŋ",
        "unicode": 61452
    },
    "ez": {
        "latin": "ez",
        "phonetique": "eɪ",
        "unicode": 61453
    },
    "eu": {
        "latin": "eu",
        "phonetique": "əʊ",
        "unicode": 61454
    },
    "er": {
        "latin": "er",
        "phonetique": "ɚ",
        "unicode": 61455
    },
    "ia": {
        "latin": "ia",
        "phonetique": "ja",
        "unicode": 61456
    },
    "ie": {
        "latin": "ie",
        "phonetique": "jɛ",
        "unicode": 61457
    },
    "iu": {
        "latin": "iu",
        "phonetique": "jəʊ",
        "unicode": 61458
    },
    "ui": {
        "latin": "ui",
        "phonetique": "weɪ",
        "unicode": 61459
    },
    "ne": {
        "latin": "ne",
        "phonetique": "ən",
        "unicode": 61460
    },
    "ni": {
        "latin": "ni",
        "phonetique": "in",
        "unicode": 61461
    },
    "b": {
        "latin": "b",
        "phonetique": "p",
        "unicode": 61462
    },
    "c": {
        "latin": "c",
        "phonetique": "ʦʰ",
        "unicode": 61463
    },
    "d": {
        "latin": "d",
        "phonetique": "t",
        "unicode": 61464
    },
    "f": {
        "latin": "f",
        "phonetique": "f",
        "unicode": 61465
    },
    "g": {
        "latin": "g",
        "phonetique": "k",
        "unicode": 61466
    },
    "h": {
        "latin": "h",
        "phonetique": "x",
        "unicode": 61467
    },
    "j": {
        "latin": "j",
        "phonetique": "ʨ",
        "unicode": 61468
    },
    "k": {
        "latin": "k",
        "phonetique": "kʰ",
        "unicode": 61469
    },
    "l": {
        "latin": "l",
        "phonetique": "l",
        "unicode": 61470
    },
    "m": {
        "latin": "m",
        "phonetique": "m",
        "unicode": 61471
    },
    "p": {
        "latin": "p",
        "phonetique": "pʰ",
        "unicode": 61472
    },
    "q": {
        "latin": "q",
        "phonetique": "ʨʰ",
        "unicode": 61473
    },
    "r": {
        "latin": "r",
        "phonetique": "ʁ",
        "unicode": 61474
    },
    "s": {
        "latin": "s",
        "phonetique": "s",
        "unicode": 61475
    },
    "z": {
        "latin": "z",
        "phonetique": "ʦ",
        "unicode": 61476
    },
    "t": {
        "latin": "t",
        "phonetique": "tʰ",
        "unicode": 61477
    },
    "v": {
        "latin": "v",
        "phonetique": "v",
        "unicode": 61478
    },
    "cc": {
        "latin": "cc",
        "phonetique": "ɕ",
        "unicode": 61479
    },
    "gg": {
        "latin": "gg",
        "phonetique": "ŋ",
        "unicode": 61480
    },
    "jr": {
        "latin": "jr",
        "phonetique": "ʒ",
        "unicode": 61481
    },
    "n": {
        "latin": "n",
        "phonetique": "n",
        "unicode": 61482
    },
    "hq": {
        "latin": "hq",
        "phonetique": "ʁ",
        "unicode": 61483
    },
    "zr": {
        "latin": "zr",
        "phonetique": "z",
        "unicode": 61484
    },
    "ian": {
        "latin": "ian",
        "phonetique": "jεn",
        "unicode": 61485
    },
    "uun": {
        "latin": "uun",
        "phonetique": "yn",
        "unicode": 61486
    },
    "luGge": {
        "latin": "lu",
        "phonetique": "lu",
        "unicode": 61488
    },
    "ceGge": {
        "latin": "ce",
        "phonetique": "sɛ",
        "unicode": 61489
    },
    "deGge": {
        "latin": "de",
        "phonetique": "tɛ",
        "unicode": 61490
    },
    "miGge": {
        "latin": "mi",
        "phonetique": "mi",
        "unicode": 61491
    },
    "fionGge": {
        "latin": "fion",
        "phonetique": "fjʊŋ",
        "unicode": 61492
    },
    "guGge": {
        "latin": "gu",
        "phonetique": "ku",
        "unicode": 61493
    },
    "naGge": {
        "latin": "na",
        "phonetique": "ŋa",
        "unicode": 61494
    },
    "biGge": {
        "latin": "bi",
        "phonetique": "pi",
        "unicode": 61495
    },
    "werGge": {
        "latin": "wer",
        "phonetique": "wɚ",
        "unicode": 61496
    },
    "neuGge": {
        "latin": "neu",
        "phonetique": "nəʊ",
        "unicode": 61497
    },
    "ane": {
        "latin": "ane",
        "phonetique": "ən",
        "unicode": 61498
    },
    "dne": {
        "latin": "dne",
        "phonetique": "tən",
        "unicode": 61499
    },
    "wne": {
        "latin": "wne",
        "phonetique": "wən",
        "unicode": 61500
    },
    "sne": {
        "latin": "sne",
        "phonetique": "sən",
        "unicode": 61501
    },
    "oor": {
        "latin": "oor",
        "phonetique": "oɚ",
        "unicode": 61502
    },
    "ua": {
        "latin": "ua",
        "phonetique": "wa",
        "unicode": 61503
    },
    "uhh": {
        "latin": "uhh",
        "phonetique": "u",
        "unicode": 61504
    },
    "rr": {
        "latin": "rr",
        "phonetique": "ɚ",
        "unicode": 61505
    },
    "ion": {
        "latin": "ion",
        "phonetique": "jʊŋ",
        "unicode": 61506
    },
    "pu": {
        "latin": "pu-",
        "phonetique": "pʰu",
        "unicode": 61507
    },
    "ra": {
        "latin": "ra-",
        "phonetique": "ʁa",
        "unicode": 61508
    },
    "re": {
        "latin": "re-",
        "phonetique": "ʁe",
        "unicode": 61509
    },
    "pa": {
        "latin": "pa-",
        "phonetique": "pʰa",
        "unicode": 61510
    },
    "pe": {
        "latin": "pe-",
        "phonetique": "pʰe",
        "unicode": 61511
    },
    "ba": {
        "latin": "ba-",
        "phonetique": "pa",
        "unicode": 61512
    },
    "bu": {
        "latin": "bu-",
        "phonetique": "pu",
        "unicode": 61513
    },
    "bra": {
        "latin": "bra-",
        "phonetique": "pʁa",
        "unicode": 61514
    },
    "bre": {
        "latin": "bre-",
        "phonetique": "pʁe",
        "unicode": 61515
    },
    "pra": {
        "latin": "pra-",
        "phonetique": "pʰʁa",
        "unicode": 61516
    },
    "pre": {
        "latin": "pre-",
        "phonetique": "pʰʁe",
        "unicode": 61517
    },
    "xoMuuciichhe": {
        "latin": "-xo",
        "phonetique": "kʰo",
        "unicode": 61518
    },
    "xneMuuciichhe": {
        "latin": "-xne",
        "phonetique": "kʰən",
        "unicode": 61519
    },
    "xiMuuciichhe": {
        "latin": "-xi",
        "phonetique": "kʰi",
        "unicode": 61520
    },
    "xaMuuciichhe": {
        "latin": "-xa",
        "phonetique": "kʰa",
        "unicode": 61521
    },
    "xiuMuuciichhe": {
        "latin": "-xiu",
        "phonetique": "kʰjəʊ",
        "unicode": 61522
    },
    "doMuuciichhe": {
        "latin": "do",
        "phonetique": "to",
        "unicode": 61523
    },
    "dneMuuciichhe": {
        "latin": "dne",
        "phonetique": "tən",
        "unicode": 61524
    },
    "diMuuciichhe": {
        "latin": "di",
        "phonetique": "ti",
        "unicode": 61525
    },
    "daMuuciichhe": {
        "latin": "da",
        "phonetique": "ta",
        "unicode": 61526
    },
    "diuMuuciichhe": {
        "latin": "diu",
        "phonetique": "tjəʊ",
        "unicode": 61527
    },
    "deMuuciichhe": {
        "latin": "de",
        "phonetique": "tɛ",
        "unicode": 61528
    },
    "roMuuciichhe": {
        "latin": "hqo",
        "phonetique": "ʁo",
        "unicode": 61529
    },
    "rneMuuciichhe": {
        "latin": "hqne",
        "phonetique": "ʁən",
        "unicode": 61530
    },
    "riMuuciichhe": {
        "latin": "hqi",
        "phonetique": "ʁi",
        "unicode": 61531
    },
    "raMuuciichhe": {
        "latin": "hqa",
        "phonetique": "ʁa",
        "unicode": 61532
    },
    "riuMuuciichhe": {
        "latin": "hqiu",
        "phonetique": "ʁjəʊ",
        "unicode": 61533
    },
    "reMuuciichhe": {
        "latin": "hqe",
        "phonetique": "ʁɛ",
        "unicode": 61534
    },
    "soMuuciichhe": {
        "latin": "so",
        "phonetique": "so",
        "unicode": 61535
    },
    "sneMuuciichhe": {
        "latin": "sne",
        "phonetique": "sən",
        "unicode": 61536
    },
    "siMuuciichhe": {
        "latin": "si",
        "phonetique": "si",
        "unicode": 61537
    },
    "saMuuciichhe": {
        "latin": "sa",
        "phonetique": "sa",
        "unicode": 61538
    },
    "siuMuuciichhe": {
        "latin": "siu",
        "phonetique": "sjəʊ",
        "unicode": 61539
    },
    "seMuuciichhe": {
        "latin": "se",
        "phonetique": "sɛ",
        "unicode": 61540
    },
    "lup": {
        "latin": "lup",
        "phonetique": "lupʰ",
        "unicode": 61541
    },
    "ple": {
        "latin": "ple",
        "phonetique": "pʰlɛ",
        "unicode": 61542
    },
    "ala": {
        "latin": "ala",
        "phonetique": "ala",
        "unicode": 61543
    },
    "lo": {
        "latin": "-lo",
        "phonetique": "lo",
        "unicode": 61544
    },
    "to": {
        "latin": "to",
        "phonetique": "tʰo",
        "unicode": 61545
    },
    "mi": {
        "latin": "-mi",
        "phonetique": "mi",
        "unicode": 61546
    },
    "lu": {
        "latin": "-lu",
        "phonetique": "lu",
        "unicode": 61547
    },
    "dou": {
        "latin": "dou",
        "phonetique": "təʊ",
        "unicode": 61548
    },
    "te": {
        "latin": "te",
        "phonetique": "tʰɛ",
        "unicode": 61549
    },
    "tui": {
        "latin": "tui",
        "phonetique": "tʰweɪ",
        "unicode": 61550
    },
    "lui": {
        "latin": "lui",
        "phonetique": "lweɪ",
        "unicode": 61551
    },
    "ta": {
        "latin": "ta",
        "phonetique": "tʰa",
        "unicode": 61552
    },
    "xe": {
        "latin": "xe",
        "phonetique": "xɛ",
        "unicode": 61553
    },
    "puu": {
        "latin": "puu",
        "phonetique": "pʰy",
        "unicode": 61554
    },
    "hui": {
        "latin": "hui",
        "phonetique": "xweɪ",
        "unicode": 61555
    },
    "we": {
        "latin": "we",
        "phonetique": "wɛ",
        "unicode": 61556
    },
    "sii": {
        "latin": "sii-",
        "phonetique": "sẓ",
        "unicode": 61557
    },
    "cco": {
        "latin": "cco",
        "phonetique": "ɕo",
        "unicode": 61558
    },
    "cci": {
        "latin": "cci",
        "phonetique": "ɕi",
        "unicode": 61559
    },
    "ccez": {
        "latin": "ccez",
        "phonetique": "ɕeɪ",
        "unicode": 61560
    },
    "tou": {
        "latin": "tou",
        "phonetique": "tʰəʊ",
        "unicode": 61561
    },
    "ler": {
        "latin": "ler",
        "phonetique": "lɚ",
        "unicode": 61562
    },
    "qui": {
        "latin": "qui",
        "phonetique": "kʰi",
        "unicode": 61563
    },
    "rie": {
        "latin": "hqie",
        "phonetique": "ʁjɛ",
        "unicode": 61564
    },
    "nai": {
        "latin": "nai",
        "phonetique": "ŋaɪ",
        "unicode": 61565
    },
    "od": {
        "latin": "od-",
        "phonetique": "ot",
        "unicode": 61566
    },
    "doto": {
        "latin": "-do",
        "phonetique": "to",
        "unicode": 61567
    },
    "buv": {
        "latin": "buv",
        "phonetique": "puv",
        "unicode": 61568
    },
    "fa": {
        "latin": "fa",
        "phonetique": "fa",
        "unicode": 61569
    },
    "setto": {
        "latin": "se-",
        "phonetique": "sɛ",
        "unicode": 61570
    },
    "ccot": {
        "latin": "cco-",
        "phonetique": "ɕo",
        "unicode": 61571
    },
    "lile": {
        "latin": "li",
        "phonetique": "li",
        "unicode": 61572
    },
    "li": {
        "latin": "li",
        "phonetique": "li",
        "unicode": 61573
    },
    "res": {
        "latin": "res",
        "phonetique": "ʁɛs",
        "unicode": 61574
    },
    "son": {
        "latin": "son",
        "phonetique": "sʊŋ",
        "unicode": 61575
    },
    "hon": {
        "latin": "hon",
        "phonetique": "xʊŋ",
        "unicode": 61576
    },
    "mon": {
        "latin": "mon",
        "phonetique": "mʊŋ",
        "unicode": 61577
    },
    "ros": {
        "latin": "ros",
        "phonetique": "ʁos",
        "unicode": 61578
    },
    "zeq": {
        "latin": "ze-",
        "phonetique": "ʦɛ",
        "unicode": 61579
    },
    "wo": {
        "latin": "wo",
        "phonetique": "wo",
        "unicode": 61580
    },
    "leu": {
        "latin": "leu",
        "phonetique": "ləʊ",
        "unicode": 61581
    },
    "fon": {
        "latin": "fon",
        "phonetique": "fʊŋ",
        "unicode": 61582
    },
    "ggon": {
        "latin": "ggon",
        "phonetique": "ŋʊŋ",
        "unicode": 61583
    },
    "voMuuciichhe": {
        "latin": "vo",
        "phonetique": "vo",
        "unicode": 61584
    },
    "vneMuuciichhe": {
        "latin": "vne",
        "phonetique": "vən",
        "unicode": 61585
    },
    "viMuuciichhe": {
        "latin": "vi",
        "phonetique": "vi",
        "unicode": 61586
    },
    "vaMuuciichhe": {
        "latin": "va",
        "phonetique": "va",
        "unicode": 61587
    },
    "viuMuuciichhe": {
        "latin": "viu",
        "phonetique": "vjəʊ",
        "unicode": 61588
    },
    "veMuuciichhe": {
        "latin": "ve",
        "phonetique": "vɛ",
        "unicode": 61589
    },
    "loMuuciichhe": {
        "latin": "lo",
        "phonetique": "lo",
        "unicode": 61590
    },
    "lneMuuciichhe": {
        "latin": "lne",
        "phonetique": "lən",
        "unicode": 61591
    },
    "liMuuciichhe": {
        "latin": "li",
        "phonetique": "li",
        "unicode": 61592
    },
    "laMuuciichhe": {
        "latin": "la",
        "phonetique": "la",
        "unicode": 61593
    },
    "liuMuuciichhe": {
        "latin": "liu",
        "phonetique": "ljəʊ",
        "unicode": 61594
    },
    "leMuuciichhe": {
        "latin": "le",
        "phonetique": "lɛ",
        "unicode": 61595
    },
    "poMuuciichhe": {
        "latin": "po",
        "phonetique": "pʰo",
        "unicode": 61596
    },
    "pneMuuciichhe": {
        "latin": "pne",
        "phonetique": "pʰən",
        "unicode": 61597
    },
    "piMuuciichhe": {
        "latin": "pi",
        "phonetique": "pʰi",
        "unicode": 61598
    },
    "paMuuciichhe": {
        "latin": "pa",
        "phonetique": "pʰa",
        "unicode": 61599
    },
    "piuMuuciichhe": {
        "latin": "piu",
        "phonetique": "pʰjəʊ",
        "unicode": 61600
    },
    "peMuuciichhe": {
        "latin": "pe",
        "phonetique": "pʰɛ",
        "unicode": 61601
    },
    "qoMuuciichhe": {
        "latin": "qo",
        "phonetique": "ʨʰo",
        "unicode": 61602
    },
    "qneMuuciichhe": {
        "latin": "qne",
        "phonetique": "ʨʰən",
        "unicode": 61603
    },
    "qiMuuciichhe": {
        "latin": "qi",
        "phonetique": "ʨʰi",
        "unicode": 61604
    },
    "qaMuuciichhe": {
        "latin": "qa",
        "phonetique": "ʨʰa",
        "unicode": 61605
    },
    "qiuMuuciichhe": {
        "latin": "qiu",
        "phonetique": "ʨʰjəʊ",
        "unicode": 61606
    },
    "qeMuuciichhe": {
        "latin": "qe",
        "phonetique": "ʨʰɛ",
        "unicode": 61607
    },
    "foMuuciichhe": {
        "latin": "fo",
        "phonetique": "fo",
        "unicode": 61608
    },
    "fneMuuciichhe": {
        "latin": "fne",
        "phonetique": "fən",
        "unicode": 61609
    },
    "fiMuuciichhe": {
        "latin": "fi",
        "phonetique": "fi",
        "unicode": 61610
    },
    "faMuuciichhe": {
        "latin": "fa",
        "phonetique": "fa",
        "unicode": 61611
    },
    "fiuMuuciichhe": {
        "latin": "fiu",
        "phonetique": "fjəʊ",
        "unicode": 61612
    },
    "feMuuciichhe": {
        "latin": "fe",
        "phonetique": "fɛ",
        "unicode": 61613
    },
    "moMuuciichhe": {
        "latin": "mo",
        "phonetique": "mo",
        "unicode": 61614
    },
    "mneMuuciichhe": {
        "latin": "mne",
        "phonetique": "mən",
        "unicode": 61615
    },
    "miMuuciichhe": {
        "latin": "mi",
        "phonetique": "mi",
        "unicode": 61616
    },
    "maMuuciichhe": {
        "latin": "ma",
        "phonetique": "ma",
        "unicode": 61617
    },
    "miuMuuciichhe": {
        "latin": "miu",
        "phonetique": "mjəʊ",
        "unicode": 61618
    },
    "meMuuciichhe": {
        "latin": "me",
        "phonetique": "mɛ",
        "unicode": 61619
    },
    "boMuuciichhe": {
        "latin": "bo",
        "phonetique": "po",
        "unicode": 61620
    },
    "bneMuuciichhe": {
        "latin": "bne",
        "phonetique": "pən",
        "unicode": 61621
    },
    "biMuuciichhe": {
        "latin": "bi",
        "phonetique": "pi",
        "unicode": 61622
    },
    "baMuuciichhe": {
        "latin": "ba",
        "phonetique": "pa",
        "unicode": 61623
    },
    "biuMuuciichhe": {
        "latin": "biu",
        "phonetique": "pjəʊ",
        "unicode": 61624
    },
    "beMuuciichhe": {
        "latin": "be",
        "phonetique": "pɛ",
        "unicode": 61625
    },
    "chhoMuuciichhe": {
        "latin": "chho",
        "phonetique": "ʦʰo",
        "unicode": 61626
    },
    "chhneMuuciichhe": {
        "latin": "chhne",
        "phonetique": "ʦʰən",
        "unicode": 61627
    },
    "chhiMuuciichhe": {
        "latin": "chhi",
        "phonetique": "ʦʰi",
        "unicode": 61628
    },
    "chhaMuuciichhe": {
        "latin": "chha",
        "phonetique": "ʦʰa",
        "unicode": 61629
    },
    "chhiuMuuciichhe": {
        "latin": "chhiu",
        "phonetique": "ʦʰjəʊ",
        "unicode": 61630
    },
    "chheMuuciichhe": {
        "latin": "chhe",
        "phonetique": "ʦʰɛ",
        "unicode": 61631
    },
    "ccoMuuciichhe": {
        "latin": "cco",
        "phonetique": "ɕo",
        "unicode": 61632
    },
    "ccneMuuciichhe": {
        "latin": "ccne",
        "phonetique": "ɕən",
        "unicode": 61633
    },
    "cciMuuciichhe": {
        "latin": "cci",
        "phonetique": "ɕi",
        "unicode": 61634
    },
    "ccaMuuciichhe": {
        "latin": "cca",
        "phonetique": "ɕa",
        "unicode": 61635
    },
    "cciuMuuciichhe": {
        "latin": "cciu",
        "phonetique": "ɕjəʊ",
        "unicode": 61636
    },
    "cce": {
        "latin": "cce",
        "phonetique": "ɕɛ",
        "unicode": 61637
    },
    "zroMuuciichhe": {
        "latin": "zro",
        "phonetique": "zo",
        "unicode": 61638
    },
    "zrneMuuciichhe": {
        "latin": "zrne",
        "phonetique": "zən",
        "unicode": 61639
    },
    "zriMuuciichhe": {
        "latin": "zri",
        "phonetique": "zi",
        "unicode": 61640
    },
    "zraMuuciichhe": {
        "latin": "zra",
        "phonetique": "za",
        "unicode": 61641
    },
    "zriuMuuciichhe": {
        "latin": "zriu",
        "phonetique": "zjəʊ",
        "unicode": 61642
    },
    "zreMuuciichhe": {
        "latin": "zre",
        "phonetique": "zɛ",
        "unicode": 61643
    },
    "zoMuuciichhe": {
        "latin": "zo",
        "phonetique": "ʦo",
        "unicode": 61644
    },
    "zneMuuciichhe": {
        "latin": "zne",
        "phonetique": "ʦən",
        "unicode": 61645
    },
    "ziMuuciichhe": {
        "latin": "zi",
        "phonetique": "ʦi",
        "unicode": 61646
    },
    "zaMuuciichhe": {
        "latin": "za",
        "phonetique": "ʦa",
        "unicode": 61647
    },
    "ziuMuuciichhe": {
        "latin": "ziu",
        "phonetique": "ʦjəʊ",
        "unicode": 61648
    },
    "zeMuuciichhe": {
        "latin": "ze",
        "phonetique": "ʦɛ",
        "unicode": 61649
    },
    "koMuuciichhe": {
        "latin": "ko",
        "phonetique": "kʰo",
        "unicode": 61650
    },
    "kneMuuciichhe": {
        "latin": "kne",
        "phonetique": "kʰən",
        "unicode": 61651
    },
    "kiMuuciichhe": {
        "latin": "ki",
        "phonetique": "kʰi",
        "unicode": 61652
    },
    "kaMuuciichhe": {
        "latin": "ka",
        "phonetique": "kʰa",
        "unicode": 61653
    },
    "kiuMuuciichhe": {
        "latin": "kiu",
        "phonetique": "kʰjəʊ",
        "unicode": 61654
    },
    "keMuuciichhe": {
        "latin": "ke",
        "phonetique": "kʰɛ",
        "unicode": 61655
    },
    "goMuuciichhe": {
        "latin": "go",
        "phonetique": "ko",
        "unicode": 61656
    },
    "gneMuuciichhe": {
        "latin": "gne",
        "phonetique": "kən",
        "unicode": 61657
    },
    "giMuuciichhe": {
        "latin": "gi",
        "phonetique": "ki",
        "unicode": 61658
    },
    "gaMuuciichhe": {
        "latin": "ga",
        "phonetique": "ka",
        "unicode": 61659
    },
    "giuMuuciichhe": {
        "latin": "giu",
        "phonetique": "kjəʊ",
        "unicode": 61660
    },
    "geMuuciichhe": {
        "latin": "ge",
        "phonetique": "kɛ",
        "unicode": 61661
    },
    "toMuuciichhe": {
        "latin": "to",
        "phonetique": "tʰo",
        "unicode": 61662
    },
    "tneMuuciichhe": {
        "latin": "tne",
        "phonetique": "tʰən",
        "unicode": 61663
    },
    "tiMuuciichhe": {
        "latin": "ti",
        "phonetique": "tʰi",
        "unicode": 61664
    },
    "taMuuciichhe": {
        "latin": "ta",
        "phonetique": "tʰa",
        "unicode": 61665
    },
    "tiuMuuciichhe": {
        "latin": "tiu",
        "phonetique": "tʰjəʊ",
        "unicode": 61666
    },
    "teMuuciichhe": {
        "latin": "te",
        "phonetique": "tʰɛ",
        "unicode": 61667
    },
    "jroMuuciichhe": {
        "latin": "jro",
        "phonetique": "ʒo",
        "unicode": 61668
    },
    "jrneMuuciichhe": {
        "latin": "jrne",
        "phonetique": "ʒən",
        "unicode": 61669
    },
    "jriMuuciichhe": {
        "latin": "jri",
        "phonetique": "ʒi",
        "unicode": 61670
    },
    "jraMuuciichhe": {
        "latin": "jra",
        "phonetique": "ʒa",
        "unicode": 61671
    },
    "jriuMuuciichhe": {
        "latin": "jriu",
        "phonetique": "ʒjəʊ",
        "unicode": 61672
    },
    "jre": {
        "latin": "jre",
        "phonetique": "ʒɛ",
        "unicode": 61673
    },
    "mah": {
        "latin": "mah",
        "phonetique": "mɑŋ",
        "unicode": 61674
    },
    "wi": {
        "latin": "wi",
        "phonetique": "wi",
        "unicode": 61675
    },
    "pon": {
        "latin": "pon",
        "phonetique": "pʰʊŋ",
        "unicode": 61676
    },
    "foto": {
        "latin": "fo",
        "phonetique": "fo",
        "unicode": 61677
    },
    "geb": {
        "latin": "geb",
        "phonetique": "kɛp",
        "unicode": 61678
    },
    "ccon": {
        "latin": "ccon",
        "phonetique": "ɕʊŋ",
        "unicode": 61679
    },
    "bai": {
        "latin": "bai",
        "phonetique": "paɪ",
        "unicode": 61680
    },
    "nah": {
        "latin": "nah",
        "phonetique": "ŋɑŋ",
        "unicode": 61681
    },
    "seb": {
        "latin": "seb",
        "phonetique": "sɛp",
        "unicode": 61682
    },
    "nan": {
        "latin": "nan",
        "phonetique": "ŋan",
        "unicode": 61683
    },
    "oMuuciichhe": {
        "latin": "-o",
        "phonetique": "o",
        "unicode": 61684
    },
    "aMuuciichhe": {
        "latin": "-a",
        "phonetique": "a",
        "unicode": 61685
    },
    "iMuuciichhe": {
        "latin": "-i",
        "phonetique": "i",
        "unicode": 61686
    },
    "no": {
        "latin": "no",
        "phonetique": "ŋo",
        "unicode": 61687
    },
    "lne": {
        "latin": "lne",
        "phonetique": "lən",
        "unicode": 61688
    },
    "le": {
        "latin": "le",
        "phonetique": "lɛ",
        "unicode": 61689
    },
    "win": {
        "latin": "win",
        "phonetique": "win",
        "unicode": 61690
    },
    "min": {
        "latin": "min",
        "phonetique": "min",
        "unicode": 61691
    },
    "semo": {
        "latin": "se-",
        "phonetique": "sɛ",
        "unicode": 61692
    },
    "dan": {
        "latin": "dan",
        "phonetique": "tan",
        "unicode": 61693
    },
    "wan": {
        "latin": "wan",
        "phonetique": "wan",
        "unicode": 61694
    },
    "gan": {
        "latin": "gan",
        "phonetique": "kan",
        "unicode": 61695
    },
    "ran": {
        "latin": "ran",
        "phonetique": "ʁan",
        "unicode": 61696
    },
    "kan": {
        "latin": "kan",
        "phonetique": "kʰan",
        "unicode": 61697
    },
    "can": {
        "latin": "can",
        "phonetique": "ʦʰan",
        "unicode": 61698
    },
    "ter": {
        "latin": "ter",
        "phonetique": "tʰɚ",
        "unicode": 61699
    },
    "qak": {
        "latin": "qa-",
        "phonetique": "ʨʰa",
        "unicode": 61700
    },
    "korr": {
        "latin": "korr",
        "phonetique": "kʰoɚ",
        "unicode": 61701
    },
    "waj": {
        "latin": "waj",
        "phonetique": "waʨ",
        "unicode": 61702
    },
    "tan": {
        "latin": "tan",
        "phonetique": "tʰan",
        "unicode": 61703
    },
    "mes": {
        "latin": "mes",
        "phonetique": "mɛs",
        "unicode": 61704
    },
    "cne": {
        "latin": "cne",
        "phonetique": "ʦʰən",
        "unicode": 61705
    },
    "po": {
        "latin": "-po",
        "phonetique": "pʰo",
        "unicode": 61706
    },
    "ogu": {
        "latin": "gu",
        "phonetique": "ku",
        "unicode": 61707
    },
    "ogo": {
        "latin": "go",
        "phonetique": "ko",
        "unicode": 61708
    },
    "oga": {
        "latin": "ga",
        "phonetique": "ka",
        "unicode": 61709
    },
    "bo": {
        "latin": "bo",
        "phonetique": "po",
        "unicode": 61710
    },
    "der": {
        "latin": "der",
        "phonetique": "tɚ",
        "unicode": 61711
    },
    "harr": {
        "latin": "harr",
        "phonetique": "xaɚ",
        "unicode": 61712
    },
    "ruWumo": {
        "latin": "ru",
        "phonetique": "ʁu",
        "unicode": 61713
    },
    "como": {
        "latin": "co-",
        "phonetique": "ʦʰo",
        "unicode": 61714
    },
    "des": {
        "latin": "de-",
        "phonetique": "tɛ",
        "unicode": 61715
    },
    "ko": {
        "latin": "ko",
        "phonetique": "kʰo",
        "unicode": 61716
    },
    "sui": {
        "latin": "sui",
        "phonetique": "sweɪ",
        "unicode": 61717
    },
    "zru": {
        "latin": "zru",
        "phonetique": "zu",
        "unicode": 61718
    },
    "vu": {
        "latin": "vu",
        "phonetique": "vu",
        "unicode": 61719
    },
    "be": {
        "latin": "be",
        "phonetique": "pɛ",
        "unicode": 61720
    },
    "mo": {
        "latin": "mo",
        "phonetique": "mo",
        "unicode": 61721
    },
    "mao": {
        "latin": "mao",
        "phonetique": "mɑʊ",
        "unicode": 61722
    },
    "hquu": {
        "latin": "hquu",
        "phonetique": "ʁy",
        "unicode": 61723
    },
    "hqer": {
        "latin": "hqer",
        "phonetique": "ʁɚ",
        "unicode": 61724
    },
    "hqo": {
        "latin": "hqo",
        "phonetique": "ʁo",
        "unicode": 61725
    },
    "keurr": {
        "latin": "keurr",
        "phonetique": "kʰəʊɚ",
        "unicode": 61726
    },
    "pez": {
        "latin": "pez",
        "phonetique": "pʰeɪ",
        "unicode": 61727
    },
    "beetto": {
        "latin": "be-",
        "phonetique": "pɛ",
        "unicode": 61728
    },
    "oho": {
        "latin": "oh-",
        "phonetique": "ox",
        "unicode": 61729
    },
    "ku": {
        "latin": "ku",
        "phonetique": "kʰu",
        "unicode": 61730
    },
    "va": {
        "latin": "va",
        "phonetique": "va",
        "unicode": 61731
    },
    "kne": {
        "latin": "kne",
        "phonetique": "kʰən",
        "unicode": 61732
    },
    "gee": {
        "latin": "gee",
        "phonetique": "kɤ",
        "unicode": 61733
    },
    "van": {
        "latin": "van",
        "phonetique": "van",
        "unicode": 61734
    },
    "con": {
        "latin": "con",
        "phonetique": "ʦʰʊŋ",
        "unicode": 61735
    },
    "ga": {
        "latin": "ga",
        "phonetique": "ka",
        "unicode": 61736
    },
    "wai": {
        "latin": "wai",
        "phonetique": "waɪ",
        "unicode": 61737
    },
    "wez": {
        "latin": "wez",
        "phonetique": "weɪ",
        "unicode": 61738
    },
    "won": {
        "latin": "won",
        "phonetique": "wʊŋ",
        "unicode": 61739
    },
    "liv": {
        "latin": "liv",
        "phonetique": "liv",
        "unicode": 61740
    },
    "gge": {
        "latin": "gge",
        "phonetique": "ŋɛ",
        "unicode": 61741
    },
    "luu": {
        "latin": "luu",
        "phonetique": "ly",
        "unicode": 61742
    },
    "vuq": {
        "latin": "vu",
        "phonetique": "vuʨʰ",
        "unicode": 61743
    }
}