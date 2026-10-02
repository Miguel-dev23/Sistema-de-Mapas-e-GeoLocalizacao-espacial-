const STORAGE_KEY = "ultimaLocalizacao";

const coordenadasElement = document.getElementById("coordenadas");
const ultimaLocalizacaoElement = document.getElementById("ultimaLocalizacao");
const btnLocalizacao = document.getElementById("btnLocalizacao");
const papel = document.getElementById("papel");
const lixeira = document.getElementById("lixeira");
const mensagem = document.getElementById("mensagem");

let map = L.map("map").setView([-23.5505, -46.6333], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let marcador = null;

function mostrarUltimaLocalizacao() {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);

    if (!dadosSalvos) {
        ultimaLocalizacaoElement.textContent =
            "Nenhuma localização salva ainda.";
        return;
    }

    try {
        const dados = JSON.parse(dadosSalvos);

        ultimaLocalizacaoElement.textContent =
            `Sua última localização salva foi: ${dados.latitude}, ${dados.longitude}`;
    } catch (erro) {
        console.error("Erro ao ler localização:", erro);
        ultimaLocalizacaoElement.textContent =
            "Não foi possível ler a localização salva.";
    }
}

function pegarLocalizacao() {
    if (!navigator.geolocation) {
        coordenadasElement.textContent =
            "Geolocalização não é suportada pelo navegador.";
        return;
    }

    coordenadasElement.textContent =
        "Obtendo sua localização...";

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            coordenadasElement.textContent =
                `Latitude: ${latitude.toFixed(6)} | Longitude: ${longitude.toFixed(6)}`;

            const localizacao = {
                latitude,
                longitude,
                data: new Date().toLocaleString("pt-BR")
            };

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(localizacao)
            );

            mostrarUltimaLocalizacao();

            map.setView([latitude, longitude], 16);

            if (marcador !== null) {
                map.removeLayer(marcador);
            }

            marcador = L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup(`
                    <strong>📍 Você está aqui!</strong><br>
                    Latitude: ${latitude.toFixed(6)}<br>
                    Longitude: ${longitude.toFixed(6)}
                `)
                .openPopup();
        },
        function (erro) {
            console.error(erro);

            switch (erro.code) {
                case 1:
                    coordenadasElement.textContent =
                        "Permissão de localização negada.";
                    break;
                case 2:
                    coordenadasElement.textContent =
                        "Não foi possível obter sua localização.";
                    break;
                case 3:
                    coordenadasElement.textContent =
                        "Tempo limite para obter localização.";
                    break;
                default:
                    coordenadasElement.textContent =
                        "Erro ao obter localização.";
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

btnLocalizacao.addEventListener("click", pegarLocalizacao);

papel.addEventListener("dragstart", function (event) {
    event.dataTransfer.setData("text/plain", "papel");
    mensagem.textContent =
        "Arraste o papel até a lixeira 🗑️";
});

lixeira.addEventListener("dragover", function (event) {
    event.preventDefault();
    lixeira.classList.add("drag-over");
});

lixeira.addEventListener("dragleave", function () {
    lixeira.classList.remove("drag-over");
});

lixeira.addEventListener("drop", function (event) {
    event.preventDefault();
    lixeira.classList.remove("drag-over");

    const objeto = event.dataTransfer.getData("text/plain");

    if (objeto === "papel") {
        localStorage.removeItem(STORAGE_KEY);

        ultimaLocalizacaoElement.textContent =
            "Nenhuma localização salva ainda.";

        coordenadasElement.textContent =
            "Localização salva apagada.";

        mensagem.textContent =
            "🗑️ Localização apagada com sucesso!";

        if (marcador !== null) {
            map.removeLayer(marcador);
            marcador = null;
        }

        map.setView([-23.5505, -46.6333], 5);
    }
});

mostrarUltimaLocalizacao();
pegarLocalizacao();
