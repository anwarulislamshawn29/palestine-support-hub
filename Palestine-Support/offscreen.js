// This script has ONE job: listen for a message from the background script,
// fetch an RSS feed, parse it, and send back the first headline.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Check if the message is the one we're expecting
    if (request.action === 'parse-rss-for-headline') {
        
        fetch(request.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(text => {
                // Use DOMParser to parse the XML string
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'application/xml');
                
                // Find the first <item> and get its <title>
                const firstItem = doc.querySelector('item');
                const headline = firstItem?.querySelector('title')?.textContent || null;
                
                // Send the headline back to the background script
                sendResponse(headline);
            })
            .catch(error => {
                console.error('Offscreen document parsing error:', error);
                // Send null back in case of an error
                sendResponse(null);
            });

        // Return true to indicate that the response will be sent asynchronously
        return true;
    }
});