let activeUser = null;
let autoPresentationTimer = null;
let autoStepIndex = 0;
let speechFontSize = 17;
let wisdomIndex = 0;
let speechStopwatchSeconds = 0;
let speechStopwatchInterval = null;
let svgRotation = 0;
let svgZoom = 1;
let isSlideView = false;
const slideSequence = ["all", "book", "pattern", "tech"];

const ALWAYS_ACTIVE_USER = {
    name: "9-B o‘quvchisi (77)",
    login: "77",
    pass: "77",
    bestScore: 0
};

/* KUN HIKMATLARI */
const wisdomQuotes = [
    { text: "“Bilim — insonni yuksaltiruvchi eng qudratli kuchdir.”", author: "— Alisher Navoiy" },
    { text: "“Kitob — barcha bunyodkorlik, yaratuvchilik va aql-idrokning, ilmu donishning asosidir.”", author: "— Amir Temur" },
    { text: "“Ilm-fan va zamonaviy texnologiyalarni egallagan yoshlar kelajak bunyodkorlaridir.”", author: "— 11-maktab 9-\"B\" sinf shiori" },
    { text: "“O‘z tarixini va milliy qadriyatlarini bilgan xalqning kelajagi buyukdir.”", author: "— Xalq hikmati" }
];

function nextWisdomQuote() {
    wisdomIndex = (wisdomIndex + 1) % wisdomQuotes.length;
    document.getElementById("wisdomQuoteText").textContent = wisdomQuotes[wisdomIndex].text;
    document.getElementById("wisdomQuoteAuthor").textContent = wisdomQuotes[wisdomIndex].author;
}

/* SINF VA LOYIHA ESLATMALARI */
function loadNotes() {
    const raw = localStorage.getItem("school11_baxt_9b_notes");
    const defaults = [
        "Sinf oldida nutqni 2 daqiqa ichida aniq va ravon yetkazish.",
        "Viktorina natijasiga ko‘ra elektron sertifikatni chop etish."
    ];
    if (!raw) {
        localStorage.setItem("school11_baxt_9b_notes", JSON.stringify(defaults));
        return defaults;
    }
    return JSON.parse(raw);
}

function saveNotes(list) {
    localStorage.setItem("school11_baxt_9b_notes", JSON.stringify(list));
}

function renderProjectNotes() {
    const notes = loadNotes();
    const ul = document.getElementById("projectNotesList");
    ul.innerHTML = "";
    notes.forEach((n, idx) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>• ${n}</span>
            <button type="button" class="note-del-btn" onclick="removeProjectNote(${idx})">&times;</button>
        `;
        ul.appendChild(li);
    });
}

function addProjectNote(e) {
    e.preventDefault();
    const input = document.getElementById("projectNoteInput");
    const val = input.value.trim();
    if (!val) return;
    const notes = loadNotes();
    notes.unshift(val);
    saveNotes(notes);
    input.value = "";
    renderProjectNotes();
}

function removeProjectNote(idx) {
    const notes = loadNotes();
    notes.splice(idx, 1);
    saveNotes(notes);
    renderProjectNotes();
}

/* FOYDALANUVCHILAR */
function loadUsers() {
    const raw = localStorage.getItem("school11_baxt_9b_users");
    const defaults = [
        { ...ALWAYS_ACTIVE_USER },
        { name: "9-B o‘quvchisi", login: "9b_sinf", pass: "11maktab", bestScore: 0 }
    ];
    if (!raw) {
        localStorage.setItem("school11_baxt_9b_users", JSON.stringify(defaults));
        return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.some(u => u.login === "77")) {
        parsed.unshift({ ...ALWAYS_ACTIVE_USER });
    }
    return parsed;
}

function saveUsers(users) {
    localStorage.setItem("school11_baxt_9b_users", JSON.stringify(users));
}

function switchAuth(mode) {
    const isLogin = mode === "login";
    document.getElementById("loginForm").classList.toggle("hidden", !isLogin);
    document.getElementById("registerForm").classList.toggle("hidden", isLogin);
    document.getElementById("loginTabBtn").classList.toggle("active", isLogin);
    document.getElementById("registerTabBtn").classList.toggle("active", !isLogin);
    document.getElementById("loginMessage").textContent = "";
    document.getElementById("registerMessage").textContent = "";
}

function fillDemoCredentials() {
    document.getElementById("loginInput").value = "77";
    document.getElementById("passwordInput").value = "77";
    document.getElementById("loginMessage").textContent = "";
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const login = document.getElementById("regLogin").value.trim();
    const pass = document.getElementById("regPass").value.trim();
    const msg = document.getElementById("registerMessage");

    const users = loadUsers();
    if (users.some(u => u.login.toLowerCase() === login.toLowerCase())) {
        msg.className = "form-msg";
        msg.textContent = "Bu login allaqachon mavjud. Boshqa login kiriting.";
        return;
    }

    users.push({ name, login, pass, bestScore: 0 });
    saveUsers(users);

    msg.className = "form-msg ok";
    msg.textContent = "Ro‘yxatdan o‘tish muvaffaqiyatli! Kirish oynasiga o‘tilmoqda...";

    setTimeout(() => {
        switchAuth("login");
        document.getElementById("loginInput").value = login;
        document.getElementById("passwordInput").value = pass;
        document.getElementById("registerForm").reset();
    }, 800);
}

function handleLogin(e) {
    e.preventDefault();
    const login = document.getElementById("loginInput").value.trim();
    const pass = document.getElementById("passwordInput").value.trim();
    const msg = document.getElementById("loginMessage");

    const users = loadUsers();
    let found = users.find(u => u.login === login && u.pass === pass);

    if (!found && login === "77" && pass === "77") {
        found = { ...ALWAYS_ACTIVE_USER };
        users.unshift(found);
        saveUsers(users);
    }

    if (!found) {
        msg.className = "form-msg";
        msg.textContent = "Login yoki parol noto‘g‘ri!";
        return;
    }

    activeUser = found;
    document.getElementById("userChip").textContent = found.name;
    document.getElementById("profileName").textContent = found.name;
    document.getElementById("profileLogin").textContent = found.login;
    document.getElementById("profileLoginTime").textContent = new Date().toLocaleTimeString("uz-UZ");
    document.getElementById("profileBestScore").textContent = found.bestScore || 0;

    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("portalApp").classList.remove("hidden");

    renderProjectNotes();
    renderTeamMembers();
    renderComments();
    renderLeaderboard();
    filterQuizByCategory("all");
}

function handleLogout() {
    stopAutoPresentation();
    stopQuizTimer();
    stopSpeechAudio();
    pauseSpeechStopwatch();
    activeUser = null;
    document.getElementById("loginInput").value = "";
    document.getElementById("passwordInput").value = "";
    document.getElementById("portalApp").classList.add("hidden");
    document.getElementById("authScreen").classList.remove("hidden");
}

/* SAHIFALAR, MAVZU VA TO'LIQ EKRAN */
function openPage(pageKey) {
    if (pageKey !== "composition") stopAutoPresentation();
    if (pageKey !== "speech") {
        stopSpeechAudio();
        pauseSpeechStopwatch();
    }

    document.querySelectorAll(".page").forEach(sec => sec.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.page === pageKey);
    });
    document.getElementById("page-" + pageKey).classList.add("active");
}

function changeColorScheme(scheme) {
    document.body.classList.remove("theme-emerald", "theme-dark");
    if (scheme === "emerald") document.body.classList.add("theme-emerald");
    if (scheme === "dark") document.body.classList.add("theme-dark");
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

/* MATN NUSXALASH */
function copyAnswer() {
    const text = document.getElementById("mainStudentAnswer").textContent.trim();
    const feedback = document.getElementById("copyFeedback");
    navigator.clipboard.writeText(text).then(() => {
        feedback.textContent = "Nusxalandi!";
        setTimeout(() => { feedback.textContent = ""; }, 2000);
    }).catch(() => {
        feedback.textContent = "Matnni qo‘lda nusxalang.";
    });
}

/* KOMPOZITSIYA, AYLANTIRISH/KATTALASHTIRISH VA SLAYD REJIMI */
const partDetails = {
    all: {
        title: "✨ Barcha elementlar uyg‘unligi",
        desc: "Biz kitob, milliy naqshlar va raqamli texnologiyalar tasvirini birlashtirdik. Kitob ilm-ma’rifatni, naqshlar milliy o‘zligimizni, texnologiyalar esa innovatsion taraqqiyotni anglatadi."
    },
    book: {
        title: "📖 Kitob — Ilm-ma’rifat",
        desc: "Kitob ilm-ma’rifatni anglatadi. U bilim va ma’naviy yuksalishning asosiy manbaidir."
    },
    pattern: {
        title: "💠 Milliy naqshlar — Milliy o‘zlik",
        desc: "Naqshlar milliy o‘zligimizni anglatadi. Ular xalqimizning boy madaniy merosi va qadriyatlarini aks ettiradi."
    },
    tech: {
        title: "💻 Raqamli texnologiyalar — Innovatsion taraqqiyot",
        desc: "Texnologiyalar esa innovatsion taraqqiyotni anglatadi. Ular bilim va qadriyatlarni zamonaviy rivojlanish bilan bog‘laydi."
    }
};

function applySvgTransform() {
    const svg = document.getElementById("mainDesignSvg");
    svg.style.transform = `scale(${svgZoom.toFixed(2)}) rotate(${svgRotation}deg)`;
}

function rotateSvg(deg) {
    svgRotation += deg;
    applySvgTransform();
}

function zoomSvg(delta) {
    svgZoom = Math.min(1.6, Math.max(0.7, svgZoom + delta));
    applySvgTransform();
}

function resetSvgTransform() {
    svgRotation = 0;
    svgZoom = 1;
    applySvgTransform();
}

function selectPart(part) {
    document.getElementById("inspectorTitle").textContent = partDetails[part].title;
    document.getElementById("inspectorDesc").textContent = partDetails[part].desc;

    document.querySelectorAll(".selector-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.part === part);
    });

    const layers = {
        book: document.getElementById("layerBook"),
        pattern: document.getElementById("layerPattern"),
        tech: document.getElementById("layerTech")
    };

    Object.keys(layers).forEach(key => {
        layers[key].classList.toggle("svg-layer--dim", part !== "all" && part !== key);
    });

    const idx = slideSequence.indexOf(part);
    if (idx !== -1) {
        autoStepIndex = idx;
        document.getElementById("slideCounterText").textContent = `Slayd ${autoStepIndex + 1} / ${slideSequence.length}`;
    }
}

function toggleSlideView() {
    isSlideView = !isSlideView;
    document.getElementById("studioBox").classList.toggle("studio-box--slide", isSlideView);
    document.getElementById("slideNav").classList.toggle("hidden", !isSlideView);
    document.getElementById("slideModeBtn").textContent = isSlideView ? "📋 Oddiy ko‘rinish" : "🖥️ Slayd rejimi";
    selectPart(slideSequence[autoStepIndex]);
}

function nextSlideStep() {
    autoStepIndex = (autoStepIndex + 1) % slideSequence.length;
    selectPart(slideSequence[autoStepIndex]);
}

function prevSlideStep() {
    autoStepIndex = (autoStepIndex - 1 + slideSequence.length) % slideSequence.length;
    selectPart(slideSequence[autoStepIndex]);
}

function toggleAutoPresentation() {
    if (autoPresentationTimer) {
        stopAutoPresentation();
    } else {
        const sequence = ["book", "pattern", "tech", "all"];
        let idx = 0;
        document.getElementById("autoPlayBtn").textContent = "⏹️ To‘xtatish";
        selectPart(sequence[idx]);

        autoPresentationTimer = setInterval(() => {
            idx = (idx + 1) % sequence.length;
            selectPart(sequence[idx]);
        }, 3000);
    }
}

function stopAutoPresentation() {
    if (autoPresentationTimer) {
        clearInterval(autoPresentationTimer);
        autoPresentationTimer = null;
    }
    const btn = document.getElementById("autoPlayBtn");
    if (btn) btn.textContent = "▶️ Avtomatik taqdimot";
}

/* GALEREYA LIGHTBOX VA RASM YUKLASH */
const galleryArts = {
    book: `<svg viewBox="0 0 240 150"><rect width="240" height="150" fill="whitesmoke"/><path d="M35,95 Q77,76 120,100 Q163,76 205,95 L205,120 Q163,101 120,125 Q77,101 35,120 Z" fill="midnightblue"/><path d="M42,88 Q77,70 120,94 Q163,70 198,88 L198,108 Q163,90 120,114 Q77,90 42,108 Z" fill="white" stroke="teal" stroke-width="3"/><line x1="120" y1="94" x2="120" y2="125" stroke="gold" stroke-width="3"/></svg>`,
    pattern: `<svg viewBox="0 0 240 150"><rect width="240" height="150" fill="whitesmoke"/><g transform="translate(120, 75)"><rect x="-38" y="-38" width="76" height="76" fill="none" stroke="teal" stroke-width="4"/><rect x="-38" y="-38" width="76" height="76" fill="none" stroke="gold" stroke-width="4" transform="rotate(45)"/><circle cx="0" cy="0" r="18" fill="midnightblue"/></g></svg>`,
    tech: `<svg viewBox="0 0 240 150"><rect width="240" height="150" fill="whitesmoke"/><rect x="85" y="40" width="70" height="70" rx="12" fill="midnightblue" stroke="gold" stroke-width="3"/><line x1="120" y1="40" x2="120" y2="15" stroke="teal" stroke-width="3"/><line x1="120" y1="110" x2="120" y2="135" stroke="teal" stroke-width="3"/><line x1="85" y1="75" x2="55" y2="75" stroke="teal" stroke-width="3"/><line x1="155" y1="75" x2="185" y2="75" stroke="teal" stroke-width="3"/><text x="120" y="82" text-anchor="middle" fill="gold" font-size="18" font-weight="bold">&lt;/&gt;</text></svg>`,
    combo: `<svg viewBox="0 0 240 150"><rect width="240" height="150" fill="whitesmoke"/><g transform="translate(120, 58)"><rect x="-24" y="-24" width="48" height="48" fill="none" stroke="teal" stroke-width="3"/><rect x="-24" y="-24" width="48" height="48" fill="none" stroke="gold" stroke-width="3" transform="rotate(45)"/></g><line x1="120" y1="34" x2="120" y2="14" stroke="midnightblue" stroke-width="3"/><circle cx="120" cy="11" r="5" fill="gold"/><path d="M50,110 Q85,95 120,114 Q155,95 190,110 L190,128 Q155,113 120,132 Q85,113 50,128 Z" fill="midnightblue"/></svg>`
};

function handleGalleryUpload(e) {
    e.preventDefault();
    const title = document.getElementById("customImgTitle").value.trim();
    const fileInput = document.getElementById("customImgFile");
    const file = fileInput.files[0];
    if (!file || !title) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const dataUrl = evt.target.result;
        const grid = document.getElementById("galleryGrid");
        const card = document.createElement("div");
        card.className = "gallery-card";
        card.innerHTML = `
            <div class="gallery-card__thumb">
                <img src="${dataUrl}" alt="${title}">
            </div>
            <div class="gallery-card__caption">
                <strong>${title}</strong>
                <span>Yuklangan rasm</span>
            </div>
        `;
        card.onclick = () => openCustomImageLightbox(title, dataUrl);
        grid.prepend(card);
        e.target.reset();
    };
    reader.readAsDataURL(file);
}

function openCustomImageLightbox(title, dataUrl) {
    document.getElementById("lightboxTitle").textContent = title;
    document.getElementById("lightboxDesc").textContent = "11-maktab 9-\"B\" sinf loyihasi uchun yuklangan tasvir.";
    document.getElementById("lightboxArt").innerHTML = `<img src="${dataUrl}" alt="${title}">`;
    document.getElementById("lightbox").classList.remove("hidden");
}

function openLightbox(title, desc, artKey) {
    document.getElementById("lightboxTitle").textContent = title;
    document.getElementById("lightboxDesc").textContent = desc;
    document.getElementById("lightboxArt").innerHTML = galleryArts[artKey];
    document.getElementById("lightbox").classList.remove("hidden");
}

function closeLightbox() {
    document.getElementById("lightbox").classList.add("hidden");
}

function closeLightboxOutside(e) {
    if (e.target.id === "lightbox") closeLightbox();
}

/* GURUH A'ZOLARI (QO'SHISH, TAHRIRLASH, O'CHIRISH) */
function loadMembers() {
    const raw = localStorage.getItem("school11_baxt_9b_members");
    const defaults = [
        { name: "Guruh sardori", role: "G‘oya va taqdimot", desc: "Loyiha mazmuni va sinf oldidagi taqdimotni muvofiqlashtirish." },
        { name: "Dizayn mutaxassisi", role: "Milliy naqsh va kompozitsiya", desc: "Kitob, milliy naqsh va texnologiyalar uyg‘unligini yaratish." },
        { name: "Tadqiqotchi", role: "Ilm-ma’rifat va taraqqiyot", desc: "Mavzu yuzasidan ma’lumot va savollarni tayyorlash." }
    ];
    if (!raw) {
        localStorage.setItem("school11_baxt_9b_members", JSON.stringify(defaults));
        return defaults;
    }
    return JSON.parse(raw);
}

function saveMembers(list) {
    localStorage.setItem("school11_baxt_9b_members", JSON.stringify(list));
}

function renderTeamMembers() {
    const members = loadMembers();
    const grid = document.getElementById("teamCardsGrid");
    grid.innerHTML = "";

    members.forEach((m, index) => {
        const card = document.createElement("div");
        card.className = "member-card";
        card.innerHTML = `
            <div class="member-card__role">${m.role}</div>
            <h3>${m.name}</h3>
            <p>${m.desc || "11-maktab 9-\"B\" sinf 2-guruh a’zosi."}</p>
            <div class="member-card__actions">
                <button type="button" class="member-card__edit" onclick="editTeamMember(${index})">✏️ Tahrirlash</button>
                <button type="button" class="member-card__del" onclick="removeTeamMember(${index})">O‘chirish</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function addTeamMember(e) {
    e.preventDefault();
    const name = document.getElementById("memberNameInput").value.trim();
    const role = document.getElementById("memberRoleInput").value.trim();
    if (!name || !role) return;

    const members = loadMembers();
    members.push({ name, role, desc: "11-maktab 9-\"B\" sinf 2-guruh a’zosi." });
    saveMembers(members);

    document.getElementById("memberNameInput").value = "";
    document.getElementById("memberRoleInput").value = "";
    renderTeamMembers();
}

function editTeamMember(index) {
    const members = loadMembers();
    const current = members[index];
    const newName = prompt("Yangi ism-familiyani kiriting:", current.name);
    if (newName === null) return;
    const newRole = prompt("Yangi vazifani kiriting:", current.role);
    if (newRole === null) return;

    if (newName.trim()) members[index].name = newName.trim();
    if (newRole.trim()) members[index].role = newRole.trim();
    saveMembers(members);
    renderTeamMembers();
}

function removeTeamMember(index) {
    const members = loadMembers();
    members.splice(index, 1);
    saveMembers(members);
    renderTeamMembers();
}

/* 30 TALIK O'ZBEKISTON VIKTORINASI + MASLAHAT */
const originalQuizQuestions = [
    { cat: "symbols", q: "O‘zbekiston Respublikasining poytaxti qaysi shahar?", options: ["Samarqand", "Toshkent", "Buxoro"], ans: 1, hint: "Respublikaning markaziy ma’muriy shahri." },
    { cat: "symbols", q: "O‘zbekiston Respublikasining Davlat bayrog‘ida nechta rang mavjud?", options: ["3 ta asosiy rang (va oq/qizil hoshiyalar)", "5 ta rang", "2 ta rang"], ans: 0, hint: "Moviy, oq, yashil ranglar va qizil hoshiyalar." },
    { cat: "symbols", q: "O‘zbekiston Davlat gerbida qaysi qush tasvirlangan?", options: ["Burgut", "Humo qushi", "Turna"], ans: 1, hint: "Baxt va erkinlik ramzi bo‘lgan afsonaviy qush." },
    { cat: "symbols", q: "O‘zbekiston Davlat madhiyasi matni muallifi kim?", options: ["Erkin Vohidov", "Abdulla Oripov", "Hamid Olimjon"], ans: 1, hint: "O‘zbekiston Qahramoni, taniqli shoir." },
    { cat: "symbols", q: "O‘zbekiston Davlat madhiyasi musiqasi muallifi kim?", options: ["Mutal Burhonov", "Sulaymon Yudakov", "Jaloliddin Mirzayev"], ans: 0, hint: "Mashhur o‘zbek bastakori." },
    { cat: "symbols", q: "O‘zbekiston milliy valyutasi qanday nomlanadi?", options: ["So‘m", "Tanga", "Somoniy"], ans: 0, hint: "1994-yil iyul oyida muomalaga kiritilgan." },
    { cat: "geography", q: "O‘zbekistonning eng uzun daryosi qaysi?", options: ["Chirchiq", "Sirdaryo", "Zarafshon"], ans: 1, hint: "Sirdaryo viloyati nomiga ham o‘z nomini bergan." },
    { cat: "geography", q: "Registon maydoni qaysi shaharda joylashgan?", options: ["Xiva", "Samarqand", "Qo‘qon"], ans: 1, hint: "Ulug‘bek, Sherdor va Tillakori madrasalari joylashgan maydon." },
    { cat: "geography", q: "Ichan-Qal’a tarixiy majmuasi qaysi shaharda joylashgan?", options: ["Xiva", "Termiz", "Marg‘ilon"], ans: 0, hint: "Xorazm viloyatidagi qadimiy shahar-muzey." },
    { cat: "geography", q: "Poi Kalon majmuasi qaysi shaharda joylashgan?", options: ["Buxoro", "Toshkent", "Andijon"], ans: 0, hint: "Minorai Kalon joylashgan qadimiy shahar." },
    { cat: "geography", q: "O‘zbekistonning eng baland cho‘qqisi qaysi?", options: ["Hazrati Sulton", "Chimyon", "Katta Chimyon"], ans: 0, hint: "Hisor tizmasida joylashgan cho‘qqi (4643 m)." },
    { cat: "history", q: "Buyuk alloma Abu Ali ibn Sino qayerda tug‘ilgan?", options: ["Afshona (Buxoro viloyati)", "Xiva (Xorazm viloyati)", "Shahrisabz (Qashqadaryo viloyati)"], ans: 0, hint: "Peshko‘ tumanidagi qishloq." },
    { cat: "history", q: "“Al-Qonun fit-tibb” asarining muallifi kim?", options: ["Mirzo Ulug‘bek", "Abu Ali ibn Sino", "Alisher Navoiy"], ans: 1, hint: "Tibbiyot ilmining sultoni." },
    { cat: "history", q: "Samarqandda rasadxona qurdirgan buyuk astronom va davlat arbobi kim?", options: ["Amir Temur", "Mirzo Ulug‘bek", "Zahiriddin Muhammad Bobur"], ans: 1, hint: "“Ziji jadidi Ko‘ragoniy” muallifi." },
    { cat: "history", q: "“Xamsa” dostonini o‘zbek tilida birinchi bo‘lib yaratgan ulug‘ shoir kim?", options: ["Alisher Navoiy", "Boborahim Mashrab", "Ogahiy"], ans: 0, hint: "Turkiy tilning ulug‘ mutafakkiri." },
    { cat: "history", q: "Algebra faniga asos solgan buyuk vatandoshimiz kim?", options: ["Abu Rayhon Beruniy", "Muhammad al-Xorazmiy", "Imom al-Buxoriy"], ans: 1, hint: "“Algoritm” atamasi uning nomi bilan bog‘liq." },
    { cat: "history", q: "“Boburnoma” asarining muallifi kim?", options: ["Zahiriddin Muhammad Bobur", "Sharafiddin Ali Yazdiy", "Abdurauf Fitrat"], ans: 0, hint: "Shoir, sarkarda va davlat arbobi." },
    { cat: "geography", q: "O‘zbekiston hududida nechta viloyat mavjud (Qoraqalpog‘iston Respublikasi va Toshkent shahridan tashqari)?", options: ["10 ta", "12 ta", "14 ta"], ans: 1, hint: "Sirdaryo, Jizzax, Samarqand, Buxoro va boshqa viloyatlar." },
    { cat: "symbols", q: "O‘zbekiston Respublikasi tarkibidagi suveren respublika qaysi?", options: ["Qoraqalpog‘iston Respublikasi", "Farg‘ona Respublikasi", "Surxon Respublikasi"], ans: 0, hint: "Poytaxti Nukus shahri." },
    { cat: "geography", q: "O‘zbekiston qaysi qit’ada joylashgan?", options: ["Yevropa", "Osiyo", "Afrika"], ans: 1, hint: "Markaziy Osiyo markazida." },
    { cat: "history", q: "Amir Temur davlatining poytaxti qaysi shahar bo‘lgan?", options: ["Samarqand", "Urganch", "Namangan"], ans: 0, hint: "Sohibqiron saltanatining markazi." },
    { cat: "symbols", q: "O‘zbekistonning davlat tili qaysi til?", options: ["O‘zbek tili", "Qoraqalpoq tili", "Fors tili"], ans: 0, hint: "1989-yil 21-oktabrda davlat tili maqomi berilgan." },
    { cat: "symbols", q: "O‘zbekiston Respublikasi Mustaqillik kuni qaysi sanada nishonlanadi?", options: ["1-sentabr", "8-dekabr", "21-mart"], ans: 0, hint: "Kuzning ilk kuni." },
    { cat: "symbols", q: "O‘zbekiston Respublikasi Konstitutsiyasi kuni qaysi sanada nishonlanadi?", options: ["9-may", "8-dekabr", "1-oktabr"], ans: 1, hint: "Qishning ilk oyi — dekabrda." },
    { cat: "symbols", q: "Navro‘z umumxalq bayrami qaysi sanada keng nishonlanadi?", options: ["21-mart", "14-yanvar", "1-iyun"], ans: 0, hint: "Bahorgi tengkunlik bayrami." },
    { cat: "geography", q: "O‘zbekistonning eng yirik cho‘llaridan biri qaysi?", options: ["Qizilqum", "Gobi", "Sahroi Kabir"], ans: 0, hint: "Amudaryo va Sirdaryo oralig‘idagi cho‘l." },
    { cat: "geography", q: "Orol dengizi O‘zbekistonning qaysi mintaqasida joylashgan?", options: ["Shimoliy-g‘arbiy qismida (Qoraqalpog‘iston hududida)", "Janubiy-sharqiy qismida", "Markaziy Farg‘onada"], ans: 0, hint: "Respublikaning shimoliy-g‘arbiy qismida." },
    { cat: "geography", q: "Milliy hunarmandchilikda keng qo‘llaniladigan an’anaviy mato qaysi?", options: ["Atlas va adras", "Kasmir", "Baxmal-ipak"], ans: 0, hint: "Marg‘ilon va Rishton bilan bog‘liq milliy matolar." },
    { cat: "history", q: "O‘zbekistonning “Ko‘hna va navqiron” shahri sifatida tanilgan qadimiy shaharlaridan biri?", options: ["Samarqand", "Chirchiq", "Guliston"], ans: 0, hint: "2750 yillik tarixga ega shahar." },
    { cat: "history", q: "Milliy qadriyatlar, ilm-fan va zamonaviy texnologiyalar uyg‘unligi yoshlarimizga nimani beradi?", options: ["O‘zlikni saqlagan holda taraqqiyotga erishishni", "Tarixni unutishni", "Bilim olishdan voz kechishni"], ans: 0, hint: "Loyihamizning asosiy g‘oyasi." }
];

let currentCategory = "all";
let activeQuizList = [...originalQuizQuestions];
let wrongQuestionsList = [];
let qIndex = 0;
let score = 0;
let answeredCurrent = false;
let quizSeconds = 0;
let quizTimerInterval = null;

function startQuizTimer() {
    stopQuizTimer();
    quizSeconds = 0;
    updateTimerDisplay();
    quizTimerInterval = setInterval(() => {
        quizSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopQuizTimer() {
    if (quizTimerInterval) {
        clearInterval(quizTimerInterval);
        quizTimerInterval = null;
    }
}

function updateTimerDisplay() {
    const mins = String(Math.floor(quizSeconds / 60)).padStart(2, "0");
    const secs = String(quizSeconds % 60).padStart(2, "0");
    document.getElementById("quizTimerBadge").textContent = `⏱️ ${mins}:${secs}`;
}

function filterQuizByCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.cat === cat);
    });

    activeQuizList = cat === "all"
        ? [...originalQuizQuestions]
        : originalQuizQuestions.filter(item => item.cat === cat);

    restartQuiz();
}

function restartQuiz() {
    document.getElementById("certificatePanel").classList.add("hidden");
    if (currentCategory === "all") {
        activeQuizList = [...originalQuizQuestions];
    } else {
        activeQuizList = originalQuizQuestions.filter(item => item.cat === currentCategory);
    }
    wrongQuestionsList = [];
    qIndex = 0;
    score = 0;
    answeredCurrent = false;
    document.getElementById("quizSummaryCard").classList.add("hidden");
    document.getElementById("quizActiveCard").classList.remove("hidden");
    updateScoreBadge();
    startQuizTimer();
    renderQuiz();
}

function retryWrongQuestions() {
    if (wrongQuestionsList.length === 0) return;
    document.getElementById("certificatePanel").classList.add("hidden");
    activeQuizList = [...wrongQuestionsList];
    wrongQuestionsList = [];
    qIndex = 0;
    score = 0;
    answeredCurrent = false;
    document.getElementById("quizSummaryCard").classList.add("hidden");
    document.getElementById("quizActiveCard").classList.remove("hidden");
    updateScoreBadge();
    startQuizTimer();
    renderQuiz();
}

function shuffleQuiz() {
    document.getElementById("certificatePanel").classList.add("hidden");
    for (let i = activeQuizList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeQuizList[i], activeQuizList[j]] = [activeQuizList[j], activeQuizList[i]];
    }
    wrongQuestionsList = [];
    qIndex = 0;
    score = 0;
    answeredCurrent = false;
    document.getElementById("quizSummaryCard").classList.add("hidden");
    document.getElementById("quizActiveCard").classList.remove("hidden");
    updateScoreBadge();
    startQuizTimer();
    renderQuiz();
}

function updateScoreBadge() {
    document.getElementById("quizScoreBadge").textContent = `Ball: ${score} / ${activeQuizList.length}`;
}

function showQuizHint() {
    const item = activeQuizList[qIndex];
    const hintBox = document.getElementById("quizHintBox");
    hintBox.textContent = "💡 Maslahat: " + (item.hint || "Javob variantlarini diqqat bilan solishtiring.");
    hintBox.classList.remove("hidden");
}

function renderQuiz() {
    const item = activeQuizList[qIndex];
    answeredCurrent = false;

    document.getElementById("quizProgress").textContent = `Savol ${qIndex + 1} / ${activeQuizList.length}`;
    document.getElementById("quizQuestion").textContent = item.q;
    document.getElementById("quizFeedback").textContent = "";

    const hintBox = document.getElementById("quizHintBox");
    hintBox.classList.add("hidden");
    hintBox.textContent = "";

    const nextBtn = document.getElementById("nextQuizBtn");
    nextBtn.classList.add("hidden");
    nextBtn.textContent = qIndex < activeQuizList.length - 1 ? "Keyingi savol" : "Natijani ko‘rish";

    const wrap = document.getElementById("quizOptions");
    wrap.innerHTML = "";
    item.options.forEach((opt, idx) => {
        const b = document.createElement("button");
        b.className = "quiz-opt-btn";
        b.textContent = opt;
        b.onclick = () => checkQuiz(idx);
        wrap.appendChild(b);
    });
}

function checkQuiz(idx) {
    if (answeredCurrent) return;
    answeredCurrent = true;

    const item = activeQuizList[qIndex];
    const fb = document.getElementById("quizFeedback");
    document.querySelectorAll(".quiz-opt-btn").forEach(btn => { btn.disabled = true; });

    if (idx === item.ans) {
        score++;
        updateScoreBadge();
        fb.style.color = "teal";
        fb.textContent = "To‘g‘ri javob! (+1 ball)";
    } else {
        wrongQuestionsList.push(item);
        fb.style.color = "crimson";
        fb.textContent = `Noto‘g‘ri. To‘g‘ri javob: ${item.options[item.ans]}`;
    }

    document.getElementById("nextQuizBtn").classList.remove("hidden");
}

function nextQuiz() {
    if (qIndex < activeQuizList.length - 1) {
        qIndex++;
        renderQuiz();
    } else {
        showQuizSummary();
    }
}

function showQuizSummary() {
    stopQuizTimer();
    document.getElementById("quizActiveCard").classList.add("hidden");
    document.getElementById("quizSummaryCard").classList.remove("hidden");

    const percent = Math.round((score / activeQuizList.length) * 100);
    const mins = String(Math.floor(quizSeconds / 60)).padStart(2, "0");
    const secs = String(quizSeconds % 60).padStart(2, "0");

    document.getElementById("finalScoreText").textContent = `${score} / ${activeQuizList.length} ball (${percent}%)`;
    document.getElementById("finalTimeText").textContent = `Sarflangan vaqt: ${mins}:${secs}`;

    const retryBtn = document.getElementById("retryWrongBtn");
    if (wrongQuestionsList.length > 0) {
        retryBtn.classList.remove("hidden");
        retryBtn.textContent = `Xato savollarni qayta ishlash (${wrongQuestionsList.length} ta)`;
    } else {
        retryBtn.classList.add("hidden");
    }

    let comment = "Yana bir bor urinib ko‘ring, bilim bilan natija yanada yaxshilanadi!";
    if (percent >= 80) {
        comment = "A’lo natija! O‘zbekiston tarixi va madaniyati bo‘yicha bilimingiz juda kuchli.";
    } else if (percent >= 50) {
        comment = "Yaxshi natija! Yana bir oz mashq qilsangiz, eng yuqori ballga chiqasiz.";
    }
    document.getElementById("finalCommentText").textContent = comment;

    if (currentCategory === "all" && activeUser && score > (activeUser.bestScore || 0)) {
        activeUser.bestScore = score;
        document.getElementById("profileBestScore").textContent = score;
        const users = loadUsers().map(u => u.login === activeUser.login ? { ...u, bestScore: score } : u);
        saveUsers(users);
        renderLeaderboard();
    }
}

/* REYTING JADVALI */
function renderLeaderboard() {
    const users = loadUsers().slice().sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));
    const tbody = document.getElementById("leaderboardBody");
    tbody.innerHTML = "";

    users.forEach((u, index) => {
        const medal = index === 0 ? "🥇 1" : index === 1 ? "🥈 2" : index === 2 ? "🥉 3" : `${index + 1}`;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${medal}</strong></td>
            <td>${u.name}</td>
            <td>${u.login}</td>
            <td><strong>${u.bestScore || 0} / 30</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

/* SERTIFIKAT GENERATORI (UNIKAL ID BILAN) */
function generateCertificateId() {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `11M-9B-2026-${rand}`;
}

function openCertificateSection() {
    const total = activeQuizList.length || 1;
    const displayScore = score > 0 ? score : (activeUser && activeUser.bestScore ? activeUser.bestScore : 0);
    const percent = Math.round((displayScore / total) * 100);
    const mins = String(Math.floor(quizSeconds / 60)).padStart(2, "0");
    const secs = String(quizSeconds % 60).padStart(2, "0");
    const defaultName = activeUser ? activeUser.name : "9-B o‘quvchisi";

    document.getElementById("certUniqueId").textContent = generateCertificateId();
    document.getElementById("certStudentNameInput").value = defaultName;
    document.getElementById("certDisplayName").textContent = defaultName;
    document.getElementById("certDisplayScore").textContent = `${displayScore} / ${total} ball (${percent}%)`;
    document.getElementById("certDisplayTime").textContent = `${mins}:${secs}`;
    document.getElementById("certDisplayDate").textContent = new Date().toLocaleDateString("uz-UZ");
    updateCertificateTeacher();

    document.getElementById("certificatePanel").classList.remove("hidden");
    document.getElementById("certificatePanel").scrollIntoView({ behavior: "smooth" });
}

function updateCertificateName() {
    const val = document.getElementById("certStudentNameInput").value.trim();
    document.getElementById("certDisplayName").textContent = val || "9-B o‘quvchisi";
}

function updateCertificateTeacher() {
    const val = document.getElementById("certTeacherNameInput").value.trim();
    document.getElementById("certDisplayTeacher").textContent = val || "9-B sinf rahbari";
}

function closeCertificateSection() {
    document.getElementById("certificatePanel").classList.add("hidden");
}

function printCertificate() {
    updateCertificateName();
    updateCertificateTeacher();
    window.print();
}

/* NUTQ SHRIFTI, SEKUNDOMER VA OVOZLI O'QISH */
function changeSpeechSize(delta) {
    speechFontSize = Math.min(28, Math.max(14, speechFontSize + delta));
    document.getElementById("speechCard").style.fontSize = speechFontSize + "px";
    document.getElementById("speechSizeLabel").textContent = speechFontSize + "px";
}

function toggleSpeechStopwatch() {
    const btn = document.getElementById("speechStartBtn");
    if (speechStopwatchInterval) {
        pauseSpeechStopwatch();
    } else {
        btn.textContent = "⏸️ Pauza";
        speechStopwatchInterval = setInterval(() => {
            speechStopwatchSeconds++;
            updateSpeechStopwatchDisplay();
        }, 1000);
    }
}

function pauseSpeechStopwatch() {
    if (speechStopwatchInterval) {
        clearInterval(speechStopwatchInterval);
        speechStopwatchInterval = null;
    }
    const btn = document.getElementById("speechStartBtn");
    if (btn) btn.textContent = "▶️ Boshlash";
}

function resetSpeechStopwatch() {
    pauseSpeechStopwatch();
    speechStopwatchSeconds = 0;
    updateSpeechStopwatchDisplay();
}

function updateSpeechStopwatchDisplay() {
    const mins = String(Math.floor(speechStopwatchSeconds / 60)).padStart(2, "0");
    const secs = String(speechStopwatchSeconds % 60).padStart(2, "0");
    document.getElementById("speechStopwatchDisplay").textContent = `${mins}:${secs}`;
}

function toggleSpeechAudio() {
    if (!("speechSynthesis" in window)) {
        alert("Brauzeringiz ovozli o‘qishni qo‘llab-quvvatlamaydi.");
        return;
    }
    if (window.speechSynthesis.speaking) {
        stopSpeechAudio();
    } else {
        const text = document.getElementById("speechCard").innerText;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "uz-UZ";
        utterance.onend = () => {
            document.getElementById("ttsBtn").textContent = "🔊 Ovozli o‘qish";
        };
        document.getElementById("ttsBtn").textContent = "⏹️ To‘xtatish";
        window.speechSynthesis.speak(utterance);
    }
}

function stopSpeechAudio() {
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    const btn = document.getElementById("ttsBtn");
    if (btn) btn.textContent = "🔊 Ovozli o‘qish";
}

/* IZOHLAR DAFTARI VA QIDIRUV */
function loadComments() {
    const raw = localStorage.getItem("school11_baxt_9b_comments");
    const defaults = [
        { author: "9-B sinf o‘quvchisi", text: "Kitob, milliy naqsh va texnologiyalar uyg‘unligi juda chiroyli chiqqan!", date: "22.11.2026" }
    ];
    if (!raw) {
        localStorage.setItem("school11_baxt_9b_comments", JSON.stringify(defaults));
        return defaults;
    }
    return JSON.parse(raw);
}

function renderComments() {
    const searchInput = document.getElementById("commentSearchInput");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const list = loadComments().filter(item =>
        !query ||
        item.author.toLowerCase().includes(query) ||
        item.text.toLowerCase().includes(query)
    );

    const wrap = document.getElementById("commentsList");
    wrap.innerHTML = "";

    if (list.length === 0) {
        wrap.innerHTML = `<p class="small-note">Qidiruv bo‘yicha izoh topilmadi.</p>`;
        return;
    }

    list.forEach(item => {
        const div = document.createElement("div");
        div.className = "comment-item";
        div.innerHTML = `
            <div class="comment-item__head">
                <strong>${item.author}</strong>
                <span>${item.date}</span>
            </div>
            <p>${item.text}</p>
        `;
        wrap.appendChild(div);
    });
}

function addGuestComment(e) {
    e.preventDefault();
    const author = document.getElementById("commentAuthorInput").value.trim();
    const text = document.getElementById("commentTextInput").value.trim();
    if (!author || !text) return;

    const list = loadComments();
    list.unshift({
        author,
        text,
        date: new Date().toLocaleDateString("uz-UZ")
    });
    localStorage.setItem("school11_baxt_9b_comments", JSON.stringify(list));

    document.getElementById("commentAuthorInput").value = "";
    document.getElementById("commentTextInput").value = "";
    renderComments();
}

/* PAROL O'ZGARTIRISH, EKSPORT, .JSON FAYL VA IMPORT */
function changeUserPassword(e) {
    e.preventDefault();
    const oldPass = document.getElementById("oldPassInput").value.trim();
    const newPass = document.getElementById("newPassInput").value.trim();
    const msg = document.getElementById("passChangeMsg");

    if (!activeUser || activeUser.pass !== oldPass) {
        msg.className = "form-msg";
        msg.textContent = "Joriy parol noto‘g‘ri!";
        return;
    }

    activeUser.pass = newPass;
    const users = loadUsers().map(u => u.login === activeUser.login ? { ...u, pass: newPass } : u);
    saveUsers(users);

    msg.className = "form-msg ok";
    msg.textContent = "Parol muvaffaqiyatli yangilandi!";
    e.target.reset();
}

function buildExportPayload() {
    return JSON.stringify({
        members: loadMembers(),
        comments: loadComments(),
        notes: loadNotes()
    }, null, 2);
}

function exportProjectData() {
    const jsonStr = buildExportPayload();
    const msg = document.getElementById("dataTransferMsg");

    navigator.clipboard.writeText(jsonStr).then(() => {
        msg.textContent = "Loyiha ma’lumotlari (JSON) buferga nusxalandi!";
        setTimeout(() => { msg.textContent = ""; }, 3000);
    }).catch(() => {
        document.getElementById("importBox").classList.remove("hidden");
        document.getElementById("importJsonArea").value = jsonStr;
        msg.textContent = "Quyidagi maydondan JSON matnini nusxalang.";
    });
}

function downloadJsonFile() {
    const jsonStr = buildExportPayload();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "11-maktab-9b-loyiha.json";
    a.click();
    URL.revokeObjectURL(url);

    const msg = document.getElementById("dataTransferMsg");
    msg.textContent = "11-maktab-9b-loyiha.json fayli yuklab olindi!";
    setTimeout(() => { msg.textContent = ""; }, 3000);
}

function toggleImportBox() {
    document.getElementById("importBox").classList.toggle("hidden");
}

function importProjectData() {
    const raw = document.getElementById("importJsonArea").value.trim();
    const msg = document.getElementById("dataTransferMsg");
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.members)) saveMembers(parsed.members);
        if (Array.isArray(parsed.comments)) localStorage.setItem("school11_baxt_9b_comments", JSON.stringify(parsed.comments));
        if (Array.isArray(parsed.notes)) saveNotes(parsed.notes);
        renderTeamMembers();
        renderComments();
        renderProjectNotes();
        msg.textContent = "Ma’lumotlar muvaffaqiyatli yuklandi!";
        document.getElementById("importBox").classList.add("hidden");
    } catch {
        msg.textContent = "Xato JSON format!";
    }
}
