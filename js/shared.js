let audioInstance = null;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject Page Transition Overlay
  const overlay = document.createElement("div");
  overlay.className = "page-transition-overlay";
  document.body.prepend(overlay);

  // 2. Inject Ambient Particle Layer if not present
  let ambientLayer = document.querySelector(".ambient");

  if (!ambientLayer) {
    ambientLayer = document.createElement("div");
    ambientLayer.className = "ambient";
    ambientLayer.setAttribute("aria-hidden", "true");

    ambientLayer.innerHTML = `
      <span class="aura aura-one"></span>
      <span class="aura aura-two"></span>
      <span class="aura aura-three"></span>
      <div id="particleLayer" class="particle-layer"></div>
    `;

    document.body.appendChild(ambientLayer);
  }

  // 3. Detect current chapter
  const mainJourney = document.querySelector("main.journey");
  const chapter = mainJourney
    ? parseInt(mainJourney.getAttribute("data-chapter"), 10)
    : 0;

  // 4. Inject Progress Indicator (Chapters 1 to 6)
  if (mainJourney && chapter >= 1 && chapter <= 6) {
    const progressPill = document.createElement("div");
    progressPill.className = "progress-indicator";

    progressPill.innerHTML = `Chapter ${chapter} of 7 <span aria-hidden="true" class="progress-heart-container" style="color: var(--pink); display: inline-flex; align-items: center; margin-left: 0.3rem; vertical-align: middle; width: 0.95rem; height: 0.95rem;"><svg viewBox="0 0 24 24" fill="currentColor" style="width: 100%; height: 100%;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>`;

    document.body.appendChild(progressPill);
  }

  // 5. Initialize Background Music
  initBackgroundMusic(chapter);

  // 6. Spawn Ambient Particles
  createAmbientParticles();

  // 7. Trigger Page Load Animations
  setTimeout(() => {
    overlay.classList.add("is-loaded");

    if (mainJourney) {
      mainJourney.classList.add("is-active");
    }
  }, 100);
});


// ============================================================
// AMBIENT PARTICLES
// ============================================================

function createAmbientParticles() {
  const particleLayer = document.getElementById("particleLayer");

  if (!particleLayer) return;

  const symbols = ["✦", "♡", "·", "✧"];
  const fragment = document.createDocumentFragment();

  const count = window.innerWidth < 600 ? 18 : 35;

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement("span");

    particle.className = "particle";
    particle.textContent = symbols[index % symbols.length];

    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${12 + Math.random() * 15}s`;
    particle.style.animationDelay = `${Math.random() * -20}s`;
    particle.style.opacity = `${0.2 + Math.random() * 0.5}`;
    particle.style.fontSize = `${0.6 + Math.random() * 0.9}rem`;

    fragment.appendChild(particle);
  }

  particleLayer.appendChild(fragment);
}


// ============================================================
// BACKGROUND MUSIC
// ============================================================

function initBackgroundMusic(chapter) {
  if (typeof BirthdayConfig === "undefined" || !BirthdayConfig.musicUrl) {
    return;
  }

  // Only Chapters 1–7 use the background music.
  if (chapter < 1 || chapter > 7) {
    return;
  }

  let audio = document.getElementById("global-background-music");

  if (!audio) {
    audio = document.createElement("audio");

    audio.id = "global-background-music";
    audio.loop = true;
    audio.preload = "auto";
    audio.src = BirthdayConfig.musicUrl;

    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");

    document.body.appendChild(audio);
  }

  audioInstance = audio;

  // ----------------------------------------------------------
  // CHAPTER 1
  // ----------------------------------------------------------
  // Chapter 1 must remain silent until the user clicks
  // the "Open Gift" button.
  //
  // Start completely fresh whenever Chapter 1 is opened.
  // ----------------------------------------------------------

  if (chapter === 1) {
    sessionStorage.removeItem("musicPlaying");
    sessionStorage.removeItem("musicTime");

    audio.currentTime = 0;
    audio.volume = 1.0;

    setupChapterOneMusicStart();

    return;
  }

  // ----------------------------------------------------------
  // CHAPTERS 2–7
  // ----------------------------------------------------------
  // Restore the music position and continue playing.
  // ----------------------------------------------------------

  audio.volume = 1.0;

  const savedTime = sessionStorage.getItem("musicTime");
  const isPlaying = sessionStorage.getItem("musicPlaying");

  if (savedTime !== null) {
    const parsedTime = parseFloat(savedTime);

    if (!Number.isNaN(parsedTime)) {
      audio.currentTime = parsedTime;
    }
  }

  // Continuously remember the current playback position.
  audio.addEventListener("timeupdate", () => {
    sessionStorage.setItem("musicTime", audio.currentTime);
  });

  if (isPlaying === "true") {
    attemptPlayMusic();
  }
}


// ============================================================
// CHAPTER 1 MUSIC START
// ============================================================

function setupChapterOneMusicStart() {
  const openGiftButton = document.getElementById("openGiftButton");

  if (!openGiftButton) {
    return;
  }

  openGiftButton.addEventListener("click", () => {
    startGlobalMusic();
  });
}


// ============================================================
// START MUSIC
// ============================================================

function startGlobalMusic() {
  if (!audioInstance) {
    return;
  }

  // Music is ALWAYS 100% volume.
  audioInstance.volume = 1.0;

  sessionStorage.setItem("musicPlaying", "true");

  attemptPlayMusic();
}


// ============================================================
// PLAY MUSIC
// ============================================================

function attemptPlayMusic() {
  if (!audioInstance) {
    return;
  }

  // Music is ALWAYS 100% volume.
  audioInstance.volume = 1.0;

  audioInstance.setAttribute("playsinline", "true");
  audioInstance.setAttribute("webkit-playsinline", "true");

  audioInstance.play()
    .then(() => {
      // Make absolutely sure volume remains at 100%.
      audioInstance.volume = 1.0;

      console.log("Background music started successfully.");
      removeMusicUnlockListeners();
    })
    .catch((error) => {
      console.log("Music playback was blocked. Waiting for user interaction:", error.message);

      addMusicUnlockListeners();
    });
}


// ============================================================
// AUDIO UNLOCK FALLBACK
// ============================================================

const musicUnlockEvents = [
  "click",
  "touchstart",
  "pointerdown",
  "keydown"
];

function handleMusicUnlock() {
  if (!audioInstance) {
    return;
  }

  audioInstance.volume = 1.0;

  audioInstance.play()
    .then(() => {
      audioInstance.volume = 1.0;

      console.log("Background music unlocked successfully.");

      removeMusicUnlockListeners();
    })
    .catch(() => {
      // Keep waiting for another user interaction.
    });
}

function addMusicUnlockListeners() {
  musicUnlockEvents.forEach((eventName) => {
    document.addEventListener(
      eventName,
      handleMusicUnlock,
      { passive: true }
    );
  });
}

function removeMusicUnlockListeners() {
  musicUnlockEvents.forEach((eventName) => {
    document.removeEventListener(
      eventName,
      handleMusicUnlock,
      { passive: true }
    );
  });
}


// ============================================================
// PAGE TRANSITION
// ============================================================

function navigateWithTransition(url) {
  const overlay = document.querySelector(".page-transition-overlay");

  if (overlay) {
    overlay.classList.remove("is-loaded");
    overlay.classList.add("is-exiting");
  }

  // Save the exact music position before leaving the page.
  if (audioInstance) {
    sessionStorage.setItem("musicTime", audioInstance.currentTime);
    sessionStorage.setItem("musicPlaying", "true");
  }

  setTimeout(() => {
    window.location.href = url;
  }, 780);
}


// ============================================================
// MUSIC COMPATIBILITY HELPERS
// ============================================================
//
// These functions are retained so other scripts that may call
// fadeOutMusic() or fadeInMusic() do not break.
//
// There is NO volume fading anymore.
// Music always uses 100% volume.
// ============================================================

function fadeOutMusic() {
  if (!audioInstance) {
    return;
  }

  audioInstance.volume = 1.0;
  audioInstance.pause();

  sessionStorage.setItem("musicPlaying", "false");
  sessionStorage.setItem("musicTime", audioInstance.currentTime);
}


function fadeInMusic() {
  if (!audioInstance) {
    return;
  }

  audioInstance.volume = 1.0;

  sessionStorage.setItem("musicPlaying", "true");

  audioInstance.play()
    .then(() => {
      audioInstance.volume = 1.0;
    })
    .catch((error) => {
      console.log("Unable to resume background music:", error.message);
    });
}
