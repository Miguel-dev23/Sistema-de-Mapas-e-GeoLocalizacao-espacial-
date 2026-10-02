const STORAGE_KEY = "ultimaLocalizacao";
const CENTRO_PADRAO = [-14.235, -51.925]; // Brasil
const ZOOM_PADRAO = 4;

const el = {
    lat: document.getElementById("lat"),
    lon: document.getElementById("lon"),
    precisao: document.getElementById("precisao"),
    status: document.getElementById("status"),
    ultima: document.getElementById("ultimaLocalizacao"),
    mensagem: document.getElementById("mensagem"),
    botao: document.getElementById("btnLocalizacao"),
    papel: document.getElementById("papel"),
    lixeira: document.getElementById("lixeira"),
};

let map = null;
let marcadorAtual = null;
let marcadorSalvo = null;

/* ---------- localStorage (com tratamento de erros) ---------- */

function lerSalva() {
    try {
        const bruto = localStorage.getItem(STORAGE_KEY);
        if (!bruto) return null;
        const d = JSON.parse(bruto);
        if (typeof d.latitude !== "number" || typeof d.longitude !== "number") return null;
        return d;
    } catch (e) {
        console.error("Erro ao ler localStorage:", e);
        return null;
    }
}

function salvar(dados) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
        return true;
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);
        return false;
    }
}

function apagar() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { console.error(e); }
}

/* ---------- Interface ---------- */

function definirStatus(texto, erro = false) {
    el.status.textContent = texto;
    el.status.classList.toggle("erro", erro);
}

function definirMensagem(texto, erro = false) {
    el.mensagem.textContent = texto;
    el.mensagem.classList.toggle("erro", erro);
}

function mostrarUltimaSalva() {
    const d = lerSalva();
    if (!d) {
        el.ultima.textContent = "Nenhuma localização salva ainda.";
        return;
    }
    el.ultima.textContent =
        `Sua última localização salva foi: ${d.latitude.toFixed(6)}, ${d.longitude.toFixed(6)}` +
        (d.data ? ` (em ${d.data})` : "");
}

function mostrarNoLcd(lat, lon, precisao) {
    el.lat.textContent = lat.toFixed(6);
    el.lon.textContent = lon.toFixed(6);
    el.precisao.textContent = precisao != null ? `±${Math.round(precisao)} m` : "-- m";
}

function limparLcd() {
    el.lat.textContent = "--.------";
    el.lon.textContent = "--.------";
    el.precisao.textContent = "-- m";
}

/* ---------- Mapa ---------- */

function iniciarMapa() {
    const div = document.getElementById("map");
    if (typeof L === "undefined") {
        div.innerHTML = "<p style='padding:20px'>Não foi possível carregar o mapa. Verifique sua internet.</p>";
        return;
    }
    map = L.map("map").setView(CENTRO_PADRAO, ZOOM_PADRAO);
    // O servidor tile.openstreetmap.org bloqueia muitos projetos de estudo (erro 403).
    // Por isso usamos o CARTO como principal e o Esri como reserva.
    const principal = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 19,
        referrerPolicy: "origin",
    }).addTo(map);

    let trocou = false;
    principal.on("tileerror", () => {
        if (trocou) return;
        trocou = true;
        map.removeLayer(principal);
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Tiles &copy; Esri",
            maxZoom: 19,
        }).addTo(map);
    });
}

function marcarSalvaNoMapa(d) {
    if (!map) return;
    if (marcadorSalvo) map.removeLayer(marcadorSalvo);
    marcadorSalvo = L.marker([d.latitude, d.longitude])
        .addTo(map)
        .bindPopup("💾 Última localização salva");
    map.setView([d.latitude, d.longitude], 15);
}

function marcarAtualNoMapa(lat, lon) {
    if (!map) return;
    if (marcadorSalvo) { map.removeLayer(marcadorSalvo); marcadorSalvo = null; }
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`<strong>📍 Você está aqui</strong><br>${lat.toFixed(6)}, ${lon.toFixed(6)}`)
        .openPopup();
    map.setView([lat, lon], 16);
}

function limparMapa() {
    if (!map) return;
    [marcadorAtual, marcadorSalvo].forEach(m => m && map.removeLayer(m));
    marcadorAtual = marcadorSalvo = null;
    map.setView(CENTRO_PADRAO, ZOOM_PADRAO);
}

/* ---------- Geolocation ---------- */

function pegarLocalizacao() {
    if (!navigator.geolocation) {
        definirStatus("Geolocalização não suportada neste navegador.", true);
        return;
    }
    if (!window.isSecureContext) {
        definirStatus("Abra via https:// ou localhost (Live Server). Não funciona com file://.", true);
        return;
    }

    el.botao.disabled = true;
    definirStatus("Buscando satélites...");
    definirMensagem("");

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            mostrarNoLcd(latitude, longitude, accuracy);

            const ok = salvar({
                latitude,
                longitude,
                data: new Date().toLocaleString("pt-BR"),
            });
            definirStatus(ok ? "Sinal obtido. Posição salva." : "Sinal obtido, mas não foi possível salvar.", !ok);
            mostrarUltimaSalva();
            marcarAtualNoMapa(latitude, longitude);
            el.botao.disabled = false;
        },
        (erro) => {
            const msgs = {
                1: "Permissão negada. Libere a localização no navegador.",
                2: "Posição indisponível no momento.",
                3: "Tempo esgotado ao buscar o sinal.",
            };
            definirStatus(msgs[erro.code] || "Erro ao obter localização.", true);
            el.botao.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

/* ---------- Drag and Drop ---------- */

function jogarPapelNaLixeira() {
    apagar();
    mostrarUltimaSalva();
    limparLcd();
    limparMapa();
    definirStatus("Memória do aparelho apagada.");
    definirMensagem("🗑️ Localização salva apagada com sucesso!");

    el.lixeira.classList.add("balanca");
    el.papel.classList.add("sumiu");
    setTimeout(() => {
        el.lixeira.classList.remove("balanca");
        el.papel.classList.remove("sumiu");
    }, 500);
}

// Mouse (HTML5 Drag and Drop)
el.papel.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", "papel");
    e.dataTransfer.effectAllowed = "move";
    el.papel.classList.add("arrastando");
    definirMensagem("Solte o papel dentro da lixeira 🗑️");
});
el.papel.addEventListener("dragend", () => {
    el.papel.classList.remove("arrastando");
    el.lixeira.classList.remove("sobre");
});
el.lixeira.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    el.lixeira.classList.add("sobre");
});
el.lixeira.addEventListener("dragleave", () => el.lixeira.classList.remove("sobre"));
el.lixeira.addEventListener("drop", (e) => {
    e.preventDefault();
    el.lixeira.classList.remove("sobre");
    if (e.dataTransfer.getData("text/plain") === "papel") jogarPapelNaLixeira();
});

// Teclado (acessibilidade)
el.papel.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        jogarPapelNaLixeira();
    }
});

// Toque (celular não dispara o Drag and Drop nativo)
let fantasma = null;

function sobreLixeira(x, y) {
    const r = el.lixeira.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

el.papel.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    fantasma = document.createElement("div");
    fantasma.className = "fantasma";
    fantasma.textContent = "📝";
    fantasma.style.left = t.clientX + "px";
    fantasma.style.top = t.clientY + "px";
    document.body.appendChild(fantasma);
    el.papel.classList.add("arrastando");
}, { passive: true });

el.papel.addEventListener("touchmove", (e) => {
    if (!fantasma) return;
    e.preventDefault();
    const t = e.touches[0];
    fantasma.style.left = t.clientX + "px";
    fantasma.style.top = t.clientY + "px";
    el.lixeira.classList.toggle("sobre", sobreLixeira(t.clientX, t.clientY));
}, { passive: false });

function terminarToque(e) {
    if (!fantasma) return;
    const t = e.changedTouches[0];
    const acertou = sobreLixeira(t.clientX, t.clientY);
    fantasma.remove();
    fantasma = null;
    el.papel.classList.remove("arrastando");
    el.lixeira.classList.remove("sobre");
    if (acertou) jogarPapelNaLixeira();
}
el.papel.addEventListener("touchend", terminarToque);
el.papel.addEventListener("touchcancel", terminarToque);

/* ---------- Início ---------- */

el.botao.addEventListener("click", pegarLocalizacao);

iniciarMapa();
mostrarUltimaSalva();

const salva = lerSalva();
if (salva) {
    mostrarNoLcd(salva.latitude, salva.longitude, null);
    definirStatus("Última posição conhecida carregada da memória.");
    marcarSalvaNoMapa(salva);
}
