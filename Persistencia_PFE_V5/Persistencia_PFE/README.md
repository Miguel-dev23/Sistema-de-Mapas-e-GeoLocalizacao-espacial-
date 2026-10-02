# Persistencia_PFE

Atividade 4 · Geolocation, localStorage e Drag and Drop.

Um mini GPS que mostra sua localização real, guarda a última posição no
`localStorage` e a apaga quando você arrasta o 📝 até a 🗑️.

## Como funciona

- **Geolocation:** `navigator.geolocation.getCurrentPosition()` captura latitude, longitude e precisão, exibidas num visor estilo GPS.
- **Persistência:** a última posição é salva no `localStorage`. Ao recarregar a página aparece
  *"Sua última localização salva foi: [lat, long]"* e o marcador volta ao mapa.
- **Drag and Drop:** o papel (canto superior esquerdo) arrastado até a lixeira (canto inferior direito) limpa o `localStorage`.
  Também funciona por toque (celular) e pelo teclado (foque o papel e pressione Enter).
- **Mapa:** Leaflet com mapa base do CARTO (dados do OpenStreetMap) e Esri como reserva.

## Como executar

A geolocalização só funciona em contexto seguro, então **não abra o arquivo direto (`file://`)**.

- No VS Code: botão direito em `index.html` → **Open with Live Server**; ou
- Publique no GitHub Pages (Settings → Pages → branch `main`), que usa HTTPS.

Clique em **Atualizar localização** e permita o acesso no navegador.

## Estrutura

```text
Persistencia_PFE/
├── CSS/style.css
├── JS/script.js
├── index.html
└── README.md
```
