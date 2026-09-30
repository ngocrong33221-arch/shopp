/* ============================================================
   web-effects.js — Music player (auto-injected by shared.js)
   Luxury Gold & Obsidian Black Music Player with Equalizer Animation
   ============================================================ */
(() => {
  if (document.querySelector('.music-player')) return;

  /* Inject music player CSS */
  const style = document.createElement('style');
  style.textContent = `
    .music-player {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      width: min(320px, calc(100vw - 44px));
      padding: 12px 16px;
      border: 1px solid rgba(212, 175, 55, 0.28);
      border-radius: 14px;
      background: rgba(10, 10, 14, 0.94);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 0 24px rgba(212, 175, 55, 0.12);
      animation: musicIn 0.5s 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
    }
    .music-player:hover {
      border-color: rgba(250, 227, 140, 0.5);
      transform: translateY(-2px);
    }
    @keyframes musicIn {
      from { opacity: 0; transform: translateY(24px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Equalizer Bars */
    .music-eq {
      display: flex;
      align-items: flex-end;
      gap: 2.5px;
      height: 24px;
      padding-bottom: 2px;
      flex-shrink: 0;
    }
    .music-eq-bar {
      width: 3px;
      height: 6px;
      background: linear-gradient(180deg, #ffd700, #d4af37);
      border-radius: 2px;
      box-shadow: 0 0 6px rgba(212, 175, 55, 0.4);
      transition: height 0.2s ease;
    }
    .music-player.playing .music-eq-bar:nth-child(1) { animation: eqBounce 0.85s infinite ease-in-out alternate; }
    .music-player.playing .music-eq-bar:nth-child(2) { animation: eqBounce 1.1s infinite 0.2s ease-in-out alternate; }
    .music-player.playing .music-eq-bar:nth-child(3) { animation: eqBounce 0.75s infinite 0.4s ease-in-out alternate; }
    .music-player.playing .music-eq-bar:nth-child(4) { animation: eqBounce 0.95s infinite 0.1s ease-in-out alternate; }
    @keyframes eqBounce {
      0%   { height: 4px; }
      50%  { height: 20px; }
      100% { height: 10px; }
    }

    .music-info {
      flex: 1;
      min-width: 0;
    }
    .music-kicker {
      font: 9px 'JetBrains Mono', monospace;
      letter-spacing: 0.12em;
      color: #d4af37;
      text-transform: uppercase;
      margin-bottom: 2px;
      font-weight: 600;
    }
    .music-title {
      display: block;
      font: 13px 'Inter', sans-serif;
      font-weight: 500;
      color: #f7f7fa;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .music-toggle {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 9px;
      background: rgba(212, 175, 55, 0.08);
      color: #ffd700;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      flex-shrink: 0;
    }
    .music-toggle:hover {
      background: linear-gradient(135deg, #f7d46b, #d4af37);
      color: #060608;
      border-color: #ffd700;
      box-shadow: 0 0 14px rgba(212, 175, 55, 0.45);
      transform: scale(1.05);
    }
    .music-toggle:active {
      transform: scale(0.95);
    }
    @media (max-width: 480px) {
      .music-player { right: 14px; bottom: 14px; }
    }
  `;
  document.head.append(style);

  /* Build Player */
  const player = document.createElement('div');
  player.className = 'music-player';
  player.innerHTML = `
    <div class="music-eq">
      <div class="music-eq-bar"></div>
      <div class="music-eq-bar"></div>
      <div class="music-eq-bar"></div>
      <div class="music-eq-bar"></div>
    </div>
    <div class="music-info">
      <p class="music-kicker" id="musicKicker">NHẠC NỀN</p>
      <span class="music-title">Tập Yêu Đi</span>
    </div>
    <button class="music-toggle" id="musicToggle" type="button" aria-label="Bật nhạc">
      <svg id="iconPlay" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <svg id="iconPause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
    </button>
    <audio loop preload="metadata" style="display:none">
      <source src="${encodeURI('Tập Yêu Đi.mp3')}" type="audio/mpeg">
    </audio>
  `;
  document.body.append(player);

  const audio     = player.querySelector('audio');
  const toggle    = document.getElementById('musicToggle');
  const iconPlay  = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  const kicker    = document.getElementById('musicKicker');
  const musicPreferenceKey = 'cn_music_enabled';

  function syncUI() {
    const playing = !audio.paused;
    iconPlay.style.display  = playing ? 'none' : '';
    iconPause.style.display = playing ? ''     : 'none';
    player.classList.toggle('playing', playing);
  }

  toggle.addEventListener('click', () => {
    if (audio.paused) {
      localStorage.setItem(musicPreferenceKey, 'true');
      audio.play().catch(() => {
        kicker.textContent = 'BẤM ĐỂ PHÁT';
      });
    } else {
      localStorage.setItem(musicPreferenceKey, 'false');
      audio.pause();
    }
  });

  audio.addEventListener('play',  syncUI);
  audio.addEventListener('pause', syncUI);
  audio.addEventListener('error', () => {
    kicker.textContent = 'LỖI TẢI NHẠC';
    toggle.disabled = true;
  });

  if (localStorage.getItem(musicPreferenceKey) !== 'false') {
    audio.play().catch(() => {
      kicker.textContent = 'BẤM ĐỂ PHÁT';
    });
  }
})();
