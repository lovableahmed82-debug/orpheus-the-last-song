
(() => {
  "use strict";

  const story = window.ORPHEUS_STORY;

  if (!story || !story.scenes || !story.start) {
    document.body.innerHTML =
      '<p style="padding:24px;color:white;background:#100d17">Game error: story.js could not be loaded.</p>';
    return;
  }

  const $ = (id) => document.getElementById(id);

  const ui = {
    title: $("title-screen"),
    story: $("story-screen"),
    ending: $("ending-screen"),

    start: $("start-button"),
    playAgain: $("play-again-button"),

    chapter: $("chapter-number"),
    menu: $("menu-button"),
    menuOverlay: $("menu-overlay"),
    resume: $("resume-button"),
    restart: $("restart-button"),
    closeMenu: $("close-menu-button"),

    viewport: $("scene-viewport"),
    background: $("scene-background"),
    light: $("scene-light"),
    caption: $("scene-caption"),
    transition: $("scene-transition"),

    dialoguePanel: $("dialogue-panel"),
    portrait: $("speaker-portrait"),
    portraitImage: $("speaker-image"),
    portraitPlaceholder: $("portrait-placeholder"),
    speakerRole: $("speaker-role"),
    speakerName: $("speaker-name"),
    emotion: $("emotion-indicator"),
    dialogue: $("dialogue-text"),
    choices: $("choice-container"),
    continue: $("continue-button"),
    progress: $("progress-label"),

    endingSymbol: $("ending-symbol"),
    endingTitle: $("ending-title"),
    endingDescription: $("ending-description"),

    notice: $("game-notice"),
    music: $("music-player"),
    sound: $("sound-player"),

    orpheusSprite: $("orpheus-sprite"),
    orpheusImage: $("orpheus-image"),
    eurydiceSprite: $("eurydice-sprite"),
    eurydiceImage: $("eurydice-image")
  };

  const state = {
    current: null,
    visited: [],
    choicesMade: 0,
    flags: {},
    stats: {},
    busy: false,
    menuOpen: false,
    lastScene: null,
    lastBackground: null
  };

  const backgrounds = {
    mountain: `
      radial-gradient(ellipse at 72% 32%, rgba(202,157,117,.28), transparent 35%),
      linear-gradient(180deg, #51404a 0%, #8a625e 44%, #40303b 72%, #17121d 100%)
    `,
    forest: `
      radial-gradient(ellipse at 50% 35%, rgba(191,155,105,.2), transparent 42%),
      linear-gradient(90deg, #101b1a 0%, #304038 25%, #655344 50%, #26342c 75%, #101714 100%)
    `,
    meadow: `
      radial-gradient(ellipse at 50% 28%, rgba(255,213,147,.65), transparent 40%),
      linear-gradient(180deg, #8c7c78 0%, #d0a87c 45%, #596348 72%, #202b27 100%)
    `,
    forest_dusk: `
      radial-gradient(ellipse at 68% 38%, rgba(153,88,83,.23), transparent 42%),
      linear-gradient(180deg, #34252f 0%, #65404a 43%, #30232e 73%, #130f18 100%)
    `,
    mourning: `
      radial-gradient(ellipse at 50% 40%, rgba(100,68,82,.18), transparent 45%),
      linear-gradient(180deg, #171420, #35232e 45%, #100d16 100%)
    `,
    temple: `
      radial-gradient(ellipse at 50% 25%, rgba(226,186,122,.28), transparent 38%),
      linear-gradient(180deg, #44303a, #8b6855 48%, #33252e 100%)
    `,
    cavern: `
      radial-gradient(ellipse at 48% 75%, rgba(130,88,83,.18), transparent 45%),
      linear-gradient(180deg, #17141d, #31242d 55%, #0a0a10 100%)
    `,
    styx: `
      radial-gradient(ellipse at 50% 80%, rgba(79,110,112,.32), transparent 45%),
      linear-gradient(180deg, #171922, #29353d 48%, #0a1118 100%)
    `,
    gates: `
      radial-gradient(ellipse at 50% 55%, rgba(166,104,76,.2), transparent 40%),
      linear-gradient(180deg, #211a25, #493039 48%, #120e17 100%)
    `,
    throne: `
      radial-gradient(ellipse at 50% 40%, rgba(126,75,88,.28), transparent 42%),
      linear-gradient(180deg, #29202c, #49313c 50%, #100c15 100%)
    `,
    underworld_path: `
      radial-gradient(ellipse at 85% 35%, rgba(203,157,106,.24), transparent 32%),
      linear-gradient(90deg, #100f18, #29212d 48%, #4b3740 75%, #211821 100%)
    `,
    sunrise: `
      radial-gradient(ellipse at 52% 26%, rgba(255,224,169,.72), transparent 43%),
      linear-gradient(180deg, #8c7881, #d6a986 45%, #8d776c 70%, #34413a 100%)
    `
  };

  const emotionSymbols = {
    mysterious: "✧",
    gentle: "◇",
    warm: "☼",
    happy: "✦",
    tender: "♡",
    amused: "✧",
    nostalgic: "❋",
    thoughtful: "◇",
    loving: "♡",
    ominous: "◈",
    afraid: "!",
    desperate: "!",
    grief: "◇",
    broken: "◇",
    solemn: "✧",
    pleading: "♡",
    reverent: "✧",
    defiant: "✦",
    hopeful: "✧",
    resolute: "✦",
    cold: "❄",
    moved: "♡",
    stern: "◈",
    grateful: "✧",
    determined: "✦",
    tense: "!",
    fear: "!",
    careful: "◇",
    wonder: "✧",
    awe: "✦",
    emotional: "♡",
    compassionate: "♡",
    conflicted: "◇",
    warning: "!",
    strained: "◇",
    soft: "♡",
    worried: "!",
    reassuring: "♡",
    suspense: "!",
    tragic: "◇",
    triumphant: "✦",
    overwhelmed: "♡",
    joyful: "☼",
    heartbroken: "◇"
  };

  const statLabels = {
    affection: "Love",
    courage: "Courage",
    fear: "Fear",
    trust: "Trust",
    humility: "Humility",
    pride: "Pride",
    compassion: "Compassion"
  };

  function resetState() {
    state.current = story.start;
    state.visited = [];
    state.choicesMade = 0;
    state.flags = {};
    state.stats = {
      affection: 0,
      courage: 0,
      fear: 0,
      trust: 0,
      humility: 0,
      pride: 0,
      compassion: 0
    };
    state.busy = false;
    state.menuOpen = false;
    state.lastScene = null;
    state.lastBackground = null;
  }

  function getScene(id) {
    const scene = story.scenes[id];

    if (!scene) {
      console.error("Missing story scene:", id);
      showNotice("A story scene could not be found.");
      return null;
    }

    return scene;
  }

  function showScreen(screen) {
    ui.title.hidden = screen !== "title";
    ui.story.hidden = screen !== "story";
    ui.ending.hidden = screen !== "ending";
  }

  function showNotice(message) {
    ui.notice.textContent = message;
    ui.notice.classList.add("visible");

    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => {
      ui.notice.classList.remove("visible");
    }, 2400);
  }

  function changeBackground(scene) {
    const name = scene.background || "mountain";

    ui.viewport.dataset.scene = name;

    const background = backgrounds[name];

    if (background) {
      ui.background.style.backgroundImage = background;
    } else {
      ui.background.style.backgroundImage =
        "linear-gradient(180deg,#29202b,#100d17)";
    }

    if (state.lastBackground !== name) {
      ui.background.style.animation = "none";
      void ui.background.offsetWidth;
      ui.background.style.animation = "";
      state.lastBackground = name;
    }
  }

  function setCharacterImage(image, sprite, path) {
    if (!image || !sprite) return;

    if (!path) {
      image.removeAttribute("src");
      sprite.hidden = true;
      return;
    }

    image.onerror = () => {
      sprite.hidden = true;
      showNotice("A character image could not be loaded.");
    };

    image.onload = () => {
      sprite.hidden = false;
    };

    image.src = path;
    sprite.hidden = false;
  }

  function updateCharacters(scene) {
    const characterImages = window.ORPHEUS_ASSETS?.characters || {};

    const showOrpheus =
      scene.speaker === "orpheus" ||
      scene.speaker === "eurydice" ||
      scene.background === "underworld_path" ||
      scene.background === "sunrise";

    const showEurydice =
      scene.background === "sunrise" ||
      (
        scene.background === "underworld_path" &&
        state.visited.includes("return_01")
      );

    setCharacterImage(
      ui.orpheusImage,
      ui.orpheusSprite,
      showOrpheus ? characterImages.orpheus : ""
    );

    setCharacterImage(
      ui.eurydiceImage,
      ui.eurydiceSprite,
      showEurydice ? characterImages.eurydice : ""
    );
  }

  function updatePortrait(speakerId, emotion) {
    const character = story.characters[speakerId] || {
      name: speakerId || "The Storyteller",
      role: "VOICE OF LEGEND",
      portrait: ""
    };

    ui.speakerName.textContent = character.name;
    ui.speakerRole.textContent = character.role || "VOICE OF LEGEND";
    ui.emotion.textContent = emotionSymbols[emotion] || "✧";

    const portraitPath =
      character.portrait ||
      window.ORPHEUS_ASSETS?.portraits?.[speakerId] ||
      "";

    ui.portraitImage.onload = () => {
      ui.portraitImage.hidden = false;
      ui.portraitPlaceholder.hidden = true;
    };

    ui.portraitImage.onerror = () => {
      ui.portraitImage.hidden = true;
      ui.portraitPlaceholder.hidden = false;
    };

    if (portraitPath) {
      ui.portraitImage.src = portraitPath;
    } else {
      ui.portraitImage.removeAttribute("src");
      ui.portraitImage.hidden = true;
      ui.portraitPlaceholder.hidden = false;
    }
  }

  function conditionIsMet(condition) {
    if (!condition) return true;

    switch (condition) {
      case "trusting_path":
        return (
          state.stats.trust >= 2 ||
          state.stats.courage >= 2
        );

      case "sacrifice_path":
        return (
          state.stats.affection >= 2 ||
          state.stats.compassion >= 2
        );

      default:
        return Boolean(state.flags[condition]);
    }
  }

  function applyEffects(effects = {}) {
    for (const [key, amount] of Object.entries(effects)) {
      if (typeof amount !== "number") continue;

      state.stats[key] = (state.stats[key] || 0) + amount;
    }
  }

  function applyChoice(choice) {
    applyEffects(choice.effects);

    if (choice.flag) {
      state.flags[choice.flag] = true;
    }

    state.choicesMade += 1;
  }

  function renderChoices(scene) {
    ui.choices.replaceChildren();

    const choices = (scene.choices || []).filter((choice) =>
      conditionIsMet(choice.condition)
    );

    ui.continue.hidden = Boolean(choices.length);

    choices.forEach((choice) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "choice-button";
      button.textContent = choice.text;

      button.addEventListener("click", () => {
        if (state.busy || state.menuOpen) return;

        applyChoice(choice);
        navigate(choice.next);
      });

      ui.choices.appendChild(button);
    });

    if (scene.choices && choices.length === 0) {
      ui.continue.hidden = true;
      showNotice("No available choices in this scene.");
    }
  }

  function updateProgress(scene) {
    const index = state.visited.length;
    const total = Object.keys(story.scenes).length;

    ui.progress.textContent =
      "SCENE " + index + " / " + total;
  }

  function renderScene(id) {
    const scene = getScene(id);
    if (!scene) return;

    state.current = id;
    state.visited.push(id);

    showScreen("story");

    ui.chapter.textContent =
      story.chapters[scene.chapter] || "THE JOURNEY";

    changeBackground(scene);
    updateCharacters(scene);
    updatePortrait(scene.speaker, scene.emotion);

    ui.caption.textContent = scene.caption || "";
    ui.dialogue.textContent = scene.text || "";

    ui.choices.replaceChildren();
    ui.dialoguePanel.scrollTop = 0;

    renderChoices(scene);
    updateProgress(scene);

    if (scene.ending) {
      showEnding(scene);
    }
  }

  function showEnding(scene) {
    const endingKey = scene.ending;
    const ending = {
      title: scene.endingTitle || "The Last Song",
      description: scene.endingDescription || scene.text || "",
      symbol: endingKey === "together" ? "☼" :
        endingKey === "sacrifice" ? "♡" : "◇"
    };

    ui.endingTitle.textContent = ending.title;
    ui.endingDescription.textContent = ending.description;
    ui.endingSymbol.textContent = ending.symbol;

    showScreen("ending");
    stopMusic();
  }

  function stopMusic() {
    if (!ui.music) return;

    ui.music.pause();
    ui.music.currentTime = 0;
  }

  function navigate(nextId) {
    if (!nextId) return;

    if (!story.scenes[nextId]) {
      showNotice("The next scene is missing.");
      console.error("Invalid next scene:", nextId);
      return;
    }

    if (state.busy) return;

    state.busy = true;
    ui.transition.classList.add("active");

    window.setTimeout(() => {
      renderScene(nextId);

      window.setTimeout(() => {
        ui.transition.classList.remove("active");
        state.busy = false;
      }, 120);
    }, 320);
  }

  function continueStory() {
    if (state.busy || state.menuOpen) return;

    const scene = getScene(state.current);
    if (!scene) return;

    if (scene.choices && scene.choices.some((c) =>
      conditionIsMet(c.condition)
    )) {
      return;
    }

    if (scene.next) {
      navigate(scene.next);
      return;
    }

    if (scene.ending) {
      showEnding(scene);
      return;
    }

    showNotice("The story will continue in a future scene.");
  }

  function startGame() {
    resetState();
    showScreen("story");
    ui.menuOverlay.hidden = true;
    renderScene(story.start);
  }

  function openMenu() {
    if (ui.story.hidden || state.busy) return;

    state.menuOpen = true;
    ui.menuOverlay.hidden = false;
  }

  function closeMenu() {
    state.menuOpen = false;
    ui.menuOverlay.hidden = true;
  }

  function restartGame() {
    closeMenu();
    stopMusic();
    startGame();
  }

  ui.start.addEventListener("click", startGame);
  ui.playAgain.addEventListener("click", startGame);

  ui.continue.addEventListener("click", continueStory);

  ui.menu.addEventListener("click", openMenu);
  ui.resume.addEventListener("click", closeMenu);
  ui.closeMenu.addEventListener("click", closeMenu);
  ui.restart.addEventListener("click", restartGame);

  ui.menuOverlay.addEventListener("click", (event) => {
    if (event.target === ui.menuOverlay) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !ui.menuOverlay.hidden) {
      closeMenu();
      return;
    }

    if (
      (event.key === "Enter" || event.key === " ") &&
      !ui.story.hidden &&
      !ui.menuOpen &&
      !ui.continue.hidden &&
      event.target.tagName !== "BUTTON"
    ) {
      event.preventDefault();
      continueStory();
    }
  });

  /*
   * Optional assets can be added later in this format:
   *
   * window.ORPHEUS_ASSETS = {
   *   characters: {
   *     orpheus: "assets/orpheus.png",
   *     eurydice: "assets/eurydice.png"
   *   },
   *   portraits: {
   *     orpheus: "assets/orpheus-portrait.png",
   *     eurydice: "assets/eurydice-portrait.png"
   *   }
   * };
   */

  resetState();
  showScreen("title");

  console.info("ORPHEUS: THE LAST SONG — engine initialized.");
})();
