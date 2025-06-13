(() => {
    // Prevent multiple injections
    if (window.hasBeenScanned) return;
    window.hasBeenScanned = true;

    fetch(chrome.runtime.getURL('data/boycott.json'))
        .then(response => response.json())
        .then(boycottList => {
            let foundCount = 0;
            const bodyText = document.body.innerText.toLowerCase();

            const foundBrands = boycottList.filter(item => 
                bodyText.includes(item.brand.toLowerCase())
            );

            // Create a non-intrusive notification panel
            const panel = document.createElement('div');
            panel.style.cssText = `
                position: fixed; top: 20px; right: 20px; width: 300px;
                background: white; border: 1px solid #ccc; border-radius: 8px;
                padding: 16px; z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: sans-serif;
            `;

            let panelContent = `<h3 style="margin:0 0 10px 0; font-size: 16px;">Boycott Scan Results</h3>`;
            if (foundBrands.length > 0) {
                panelContent += `<p style="margin:0 0 10px 0; font-size:14px;">Found ${foundBrands.length} brand(s) on this page to be aware of:</p><ul style="margin:0; padding-left: 20px;">`;
                foundBrands.forEach(item => {
                    panelContent += `<li style="margin-bottom: 8px;"><strong>${item.brand}</strong>: ${item.reason}</li>`;
                });
                panelContent += `</ul>`;
            } else {
                panelContent += `<p style="margin:0; font-size:14px;">No targeted brands found on this page.</p>`;
            }
            
            const closeButton = `<button style="position:absolute; top:8px; right:8px; border:none; background:none; font-size:20px; cursor:pointer;">&times;</button>`;
            panel.innerHTML = panelContent + closeButton;

            document.body.appendChild(panel);
            panel.querySelector('button').onclick = () => { panel.remove(); window.hasBeenScanned = false; };
        });
})();