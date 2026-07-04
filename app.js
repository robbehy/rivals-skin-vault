(() => {
  const contentPane = document.getElementById("content-pane");
  const folderTreeEl = document.getElementById("folder-tree");
  const addressPathEl = document.getElementById("address-path");
  const statusTextEl = document.getElementById("status-text");
  const backBtn = document.getElementById("back-btn");
  const upBtn = document.getElementById("up-btn");
  const clockEl = document.getElementById("clock");
  const startBtn = document.getElementById("start-btn");
  const startMenu = document.getElementById("start-menu");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");

  let manifest = null;
  let currentPath = []; // array of folder names below root, e.g. ["Knife", "Chroma"]
  const history = [];

  function showModal(title, message) {
    modalTitle.textContent = title;
    modalBody.textContent = message;
    modalOverlay.classList.add("open");
  }

  function closeModal() {
    modalOverlay.classList.remove("open");
  }

  document.getElementById("modal-ok").addEventListener("click", closeModal);
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("close-btn").addEventListener("click", () => {
    showModal("RIVALS Skin Vault", "Nice try. This window can't be closed.");
  });

  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startMenu.classList.toggle("open");
  });

  document.addEventListener("click", () => startMenu.classList.remove("open"));
  startMenu.addEventListener("click", (e) => e.stopPropagation());

  startMenu.addEventListener("click", (e) => {
    const item = e.target.closest(".start-menu-item");
    if (!item) return;
    const action = item.dataset.action;
    startMenu.classList.remove("open");
    if (action === "home") {
      navigateTo([]);
    } else if (action === "about") {
      showModal(
        "About RIVALS Skin Vault",
        "A humble PNG storage cabinet for RIVALS weapon skins. Click any file to download it. Est. 2026."
      );
    } else if (action === "shutdown") {
      showModal("Shut Down", "It is now safe to close this browser tab.");
    }
  });

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    clockEl.textContent = `${hours}:${minutes} ${ampm}`;
  }
  updateClock();
  setInterval(updateClock, 1000 * 30);

  function findNode(path) {
    let node = manifest;
    for (const segment of path) {
      node = node.folders.find((f) => f.name === segment);
      if (!node) return null;
    }
    return node;
  }

  function buildTree(node, path, container) {
    node.folders.forEach((folder) => {
      const folderPath = [...path, folder.name];
      const row = document.createElement("div");
      row.className = "tree-node";
      row.style.paddingLeft = `${path.length * 14 + 4}px`;
      row.textContent = `📁 ${folder.name}`;
      if (
        currentPath.length === folderPath.length &&
        folderPath.every((seg, i) => seg === currentPath[i])
      ) {
        row.classList.add("active");
      }
      row.addEventListener("click", () => navigateTo(folderPath));
      container.appendChild(row);
      buildTree(folder, folderPath, container);
    });
  }

  function renderSidebar() {
    folderTreeEl.innerHTML = "";
    const rootRow = document.createElement("div");
    rootRow.className = "tree-node";
    rootRow.textContent = "🖴 images";
    if (currentPath.length === 0) rootRow.classList.add("active");
    rootRow.addEventListener("click", () => navigateTo([]));
    folderTreeEl.appendChild(rootRow);
    buildTree(manifest, [], folderTreeEl);
  }

  function triggerDownload(file) {
    const a = document.createElement("a");
    a.href = file.path;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function renderContent() {
    const node = findNode(currentPath);
    contentPane.innerHTML = "";

    if (!node) {
      contentPane.innerHTML = `<div class="empty-state">Folder not found.</div>`;
      statusTextEl.textContent = "0 object(s)";
      return;
    }

    const totalItems = node.folders.length + node.files.length;

    if (totalItems === 0) {
      contentPane.innerHTML = `<div class="empty-state">This folder is empty.<br />Drop some PNGs into it and re-run the manifest generator.</div>`;
    }

    node.folders.forEach((folder) => {
      const item = document.createElement("div");
      item.className = "icon-item";
      const count = folder.folders.length + folder.files.length;
      item.innerHTML = `
        <div class="icon-glyph">📁</div>
        <div class="icon-label">${folder.name}</div>
        <div class="icon-sub">${count} item(s)</div>
      `;
      item.addEventListener("click", () => navigateTo([...currentPath, folder.name]));
      contentPane.appendChild(item);
    });

    node.files.forEach((file) => {
      const item = document.createElement("div");
      item.className = "icon-item";
      item.innerHTML = `
        <img class="icon-thumb" src="${file.path}" alt="${file.name}" loading="lazy" />
        <div class="icon-label">${file.name}</div>
        <div class="icon-sub">${file.size}</div>
      `;
      item.addEventListener("click", () => triggerDownload(file));
      contentPane.appendChild(item);
    });

    statusTextEl.textContent = `${totalItems} object(s)`;
  }

  function renderAddress() {
    addressPathEl.textContent = ["images", ...currentPath].join(" \\ ");
  }

  function render() {
    renderSidebar();
    renderContent();
    renderAddress();
  }

  function navigateTo(path, { record = true } = {}) {
    if (record) history.push(currentPath);
    currentPath = path;
    render();
  }

  backBtn.addEventListener("click", () => {
    if (history.length === 0) return;
    const prev = history.pop();
    navigateTo(prev, { record: false });
  });

  upBtn.addEventListener("click", () => {
    if (currentPath.length === 0) return;
    navigateTo(currentPath.slice(0, -1));
  });

  fetch("manifest.json")
    .then((res) => {
      if (!res.ok) throw new Error("manifest.json not found");
      return res.json();
    })
    .then((data) => {
      manifest = data;
      render();
    })
    .catch((err) => {
      contentPane.innerHTML = `<div class="empty-state">Could not load manifest.json.<br />Run <code>node scripts/generate-manifest.js</code> first.</div>`;
      console.error(err);
    });
})();
