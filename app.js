(() => {
  const contentPane = document.getElementById("content-pane");
  const folderTreeEl = document.getElementById("folder-tree");
  const addressPathEl = document.getElementById("address-path");
  const statusTextEl = document.getElementById("status-text");
  const backBtn = document.getElementById("back-btn");
  const upBtn = document.getElementById("up-btn");
  const downloadAllBtn = document.getElementById("download-all-btn");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");

  let manifest = null;
  let currentPath = []; // array of folder names below root, e.g. ["Knife", "Chroma"]
  const history = [];

  const PINNED_FOLDER = "Standard Weapons";

  function sortedFolders(folders) {
    return [...folders].sort((a, b) => {
      if (a.name === PINNED_FOLDER) return -1;
      if (b.name === PINNED_FOLDER) return 1;
      return a.name.localeCompare(b.name);
    });
  }

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
    showModal("RIVALS Vault", "Nice try. This window can't be closed.");
  });

  function findNode(path) {
    let node = manifest;
    for (const segment of path) {
      node = node.folders.find((f) => f.name === segment);
      if (!node) return null;
    }
    return node;
  }

  function buildTree(node, path, container) {
    sortedFolders(node.folders).forEach((folder) => {
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

  async function downloadAllInFolder(node, zipName) {
    const originalLabel = downloadAllBtn.textContent;
    downloadAllBtn.disabled = true;
    downloadAllBtn.textContent = "Zipping...";
    try {
      const zip = new JSZip();
      await Promise.all(
        node.files.map(async (file) => {
          const res = await fetch(file.path);
          const blob = await res.blob();
          zip.file(file.name, blob);
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${zipName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showModal("Download All", "Something went wrong zipping these files. Try again.");
      console.error(err);
    } finally {
      downloadAllBtn.disabled = false;
      downloadAllBtn.textContent = originalLabel;
    }
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

    sortedFolders(node.folders).forEach((folder) => {
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

    if (node.files.length > 0) {
      downloadAllBtn.hidden = false;
      downloadAllBtn.textContent = `⬇ Download All (${node.files.length})`;
      const zipName = currentPath.length ? currentPath[currentPath.length - 1] : "images";
      downloadAllBtn.onclick = () => downloadAllInFolder(node, zipName);
    } else {
      downloadAllBtn.hidden = true;
      downloadAllBtn.onclick = null;
    }
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
