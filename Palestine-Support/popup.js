document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const CACHE_DURATION_MINUTES = 15;
    const NEWS_PER_PAGE = 5; // Number of articles to show per page
    const ALL_RSS_FEEDS = [
        { name: 'Palestine Chronicle', url: 'https://www.palestinechronicle.com/feed/', keywords: null },
        { name: 'Mondoweiss', url: 'https://mondoweiss.net/feed/', keywords: ['palestine', 'gaza', 'hamas', 'al-aqsa', 'west bank', 'palestinian'] },
        { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', keywords: ['palestine', 'gaza', 'hamas', 'al-aqsa', 'west bank', 'palestinian'] },
        { name: 'Electronic Intifada', url: 'https://electronicintifada.net/taxonomy/term/10233/feed/', keywords: null }


    ];

    let allArticles = []; // Master list of all fetched articles
    let currentPage = 1;
    let totalPages = 0;
    let words = [];
    const dailyMessages = [
        "Quote of the Day: 'We will not submit to the logic of the colonizer.' - Dareen Tatour",
        "Message of Hope: Solidarity is our strength. Together, our voices are powerful.",
        "Fact of the Day: The keffiyeh is a traditional headdress that symbolizes Palestinian nationalism.",
        "Did You Know? The olive tree is a symbol of peace and resilience in Palestinian culture.",
        "Today's Reminder: Every action counts. Share news, raise awareness, and stand in solidarity.",
        "Quote: 'Injustice anywhere is a threat to justice everywhere.' - Martin Luther King Jr.",
        "Message: The struggle for freedom is universal. Let's amplify the voices of the oppressed.",
        "Fact: The Palestinian flag represents the struggle for self-determination and national identity.",
        "Today's Thought: 'To be free is not merely to cast off one's chains, but to live in a way that respects and enhances the freedom of others.' - Nelson Mandela",
        "Reminder: Support Palestinian artists, writers, and creators. Their voices matter.",
        "Quote: 'Freedom is never voluntarily given by the oppressor; it must be demanded by the oppressed.' - Martin Luther King Jr.",
        "Message: The Palestinian cause is a human rights issue. Let's advocate for justice and equality.",
        "Fact: The Palestinian resistance is rooted in a rich history of culture, art, and community resilience.",
        "Today's Reminder: Solidarity is not just a word; it's a commitment to justice and equality for all.",
        "Quote: 'In the end, we will remember not the words of our enemies, but the silence of our friends.' - Martin Luther King Jr.",
        "Message: Every day is an opportunity to learn, share, and stand up for human rights.",
        "Fact: The Palestinian struggle is a testament to the power of resilience and hope in the face of adversity.",
        "Today's Thought: 'The arc of the moral universe is long, but it bends towards justice.' - Theodore Parker",
        "Reminder: Engage with Palestinian literature, music, and art to understand their culture and history.",
        "Quote: 'Justice delayed is justice denied.' - William E. Gladstone",
        "Message: The fight for justice is ongoing. Let's keep the conversation alive and advocate for change.",
        "Fact: The Palestinian right of return is a fundamental aspect of their struggle for self-determination.",
        "Today's Reminder: 'An injustice anywhere is a threat to justice everywhere.' - Martin Luther King Jr.",
        "Quote: 'The future belongs to those who believe in the beauty of their dreams.' - Eleanor Roosevelt",
        "Message: 'We are all part of the same struggle for justice and freedom.' - Angela Davis",
        "Fact: The Palestinian resistance is not just a political struggle; it's a cultural and social movement.",
        "Today's Thought: 'The only way to deal with injustice is to confront it head-on.' - Desmond Tutu",
        "Reminder: 'Injustice anywhere is a threat to justice everywhere.' - Martin Luther King Jr.",
        "Quote: 'The greatest glory in living lies not in never falling, but in rising every time we fall.' - Nelson Mandela",
        "Message: 'We are not free until all of us are free.' - Audre Lorde",
        "Fact: The Palestinian struggle is deeply rooted in a rich cultural heritage that spans thousands of years.",
        "Today's Reminder: 'The only way to deal with injustice is to confront it head-on.' - Desmond Tutu",
        "Quote: 'The arc of the moral universe is long, but it bends towards justice.' - Theodore Parker",
        "Message: 'We are all part of the same struggle for justice and freedom.' - Angela Davis",
        "Fact: The Palestinian resistance is not just a political struggle; it's a cultural and social movement.",
        "Today's Thought: 'The only way to deal with injustice is to confront it head-on.' - Desmond Tutu"
    ];
   const SHARE_URL = encodeURIComponent("https://chrome.google.com/webstore/your-extension-url");
    const SHARE_TEXT = encodeURIComponent("I'm using the Palestine Support Hub Chrome extension to stay informed and show solidarity. Join me! #FreePalestine");

    // --- ELEMENT SELECTORS ---
    const newsFeed = document.getElementById('news-feed');
    const newsLoader = document.getElementById('news-feed-loader');
    const nextWordBtn = document.getElementById('next-word-btn');
    const dailyMessageText = document.querySelector('.message-text');
    const paginationControls = document.getElementById('pagination-controls');
    const pageNumbersContainer = document.getElementById('page-numbers');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');

    // --- THEME & TAB MANAGEMENT (UNCHANGED) ---
    const setTheme = (themeName) => { document.body.className = `${themeName}-theme`; chrome.storage.sync.set({ theme: themeName }); };
    document.getElementById('light-theme-btn').addEventListener('click', () => setTheme('light'));
    document.getElementById('dark-theme-btn').addEventListener('click', () => setTheme('dark'));
    document.getElementById('green-theme-btn').addEventListener('click', () => setTheme('green'));
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.tab);
            tabContents.forEach(content => content.classList.remove('active'));
            target.classList.add('active');
        });
    });

    // --- DYNAMIC CONTENT ---
    const displayDailyMessage = () => { if(dailyMessageText) { const randomIndex = Math.floor(Math.random() * dailyMessages.length); dailyMessageText.textContent = dailyMessages[randomIndex]; }};
    const renderWord = (word) => {
        const wordCard = document.getElementById('word-card');
        if (!word || !wordCard) { if(wordCard) wordCard.style.display = 'none'; return; }
        wordCard.style.display = 'block';
        wordCard.querySelector('.word-term').textContent = word.term;
        wordCard.querySelector('.word-arabic').textContent = word.arabic;
        wordCard.querySelector('.word-definition').textContent = word.definition;
    };
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60; if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    // --- WORD OF THE HOUR ---
    const loadWords = async () => {
        try {
            const response = await fetch(chrome.runtime.getURL('data/word.json'));
            words = await response.json();
        } catch (error) { console.error("Could not load words data:", error); }
    };
    const handleNextWord = async () => {
        if (words.length === 0) return;
        const result = await chrome.storage.local.get('lastWordIndex');
        const lastIndex = typeof result.lastWordIndex === 'number' ? result.lastWordIndex : -1;
        const nextIndex = (lastIndex + 1) % words.length;
        const newWord = words[nextIndex];
        renderWord(newWord);
        await chrome.storage.local.set({ wordOfTheHour: newWord, lastWordIndex: nextIndex });
    };

    // --- NEWS LOGIC ---
    const createArticleElement = (article) => {
        const articleEl = document.createElement('div'); articleEl.className = 'news-card';
        const linkEl = document.createElement('a'); linkEl.href = article.link; linkEl.target = '_blank'; linkEl.rel = 'noopener noreferrer';
        const imageContainer = document.createElement('div'); imageContainer.className = 'news-image-container';
        if (article.image) {
            const img = document.createElement('img'); img.src = article.image; img.alt = article.title; img.className = 'news-image';
            img.onerror = () => { imageContainer.innerHTML = `<span class="news-image-error">Image<br>failed to load</span>`; };
            imageContainer.appendChild(img);
        } else { imageContainer.innerHTML = `<span class="news-image-error">No image<br>provided</span>`; }
        linkEl.appendChild(imageContainer);
        const contentEl = document.createElement('div'); contentEl.className = 'news-content';
        const titleEl = document.createElement('p'); titleEl.className = 'news-title'; titleEl.textContent = article.title; contentEl.appendChild(titleEl);
        const metaEl = document.createElement('div'); metaEl.className = 'news-meta';
        const domain = new URL(article.link).hostname;
        const faviconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=32`;
        const relativeTime = timeAgo(new Date(article.pubDate));
        metaEl.innerHTML = `<img src="${faviconUrl}" class="news-source-favicon" alt="${article.source} favicon"><span class="news-source">${article.source}</span><span class="news-time">${relativeTime}</span>`;
        contentEl.appendChild(metaEl); linkEl.appendChild(contentEl); articleEl.appendChild(linkEl);
        return articleEl;
    };
    
    const displayPage = (page) => {
        currentPage = page;
        newsFeed.innerHTML = '';
        newsFeed.scrollTop = 0; // Scroll to top of feed on page change
        
        const start = (currentPage - 1) * NEWS_PER_PAGE;
        const end = start + NEWS_PER_PAGE;
        const pageArticles = allArticles.slice(start, end);

        pageArticles.forEach(article => {
            newsFeed.appendChild(createArticleElement(article));
        });

        updatePaginationControls();
    };

    const updatePaginationControls = () => {
        pageNumbersContainer.innerHTML = ''; // Clear old page numbers
        totalPages = Math.ceil(allArticles.length / NEWS_PER_PAGE);

        if (totalPages <= 1) {
            paginationControls.style.display = 'none';
            return;
        }
        paginationControls.style.display = 'flex';

        // Create page number buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageNumberBtn = document.createElement('button');
            pageNumberBtn.textContent = i;
            pageNumberBtn.className = 'page-number';
            if (i === currentPage) {
                pageNumberBtn.classList.add('active');
            }
            pageNumberBtn.addEventListener('click', () => displayPage(i));
            pageNumbersContainer.appendChild(pageNumberBtn);
        }

        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    };
    
    const parseRSS = (xmlString, sourceName) => {
        const parser = new DOMParser(); const doc = parser.parseFromString(xmlString, "application/xml");
        const items = doc.querySelectorAll("item"); let articles = [];
        items.forEach(item => {
            let imageUrl = null;
            const mediaContent = item.querySelector('content, media\\:content');
            if (mediaContent && mediaContent.getAttribute('url')) { imageUrl = mediaContent.getAttribute('url'); }
            if (!imageUrl) { const enclosure = item.querySelector('enclosure'); if (enclosure && enclosure.getAttribute('type')?.startsWith('image')) { imageUrl = enclosure.getAttribute('url'); } }
            if (!imageUrl) { const description = item.querySelector('description')?.textContent; if (description) { const descDoc = parser.parseFromString(description, 'text/html'); const imgTag = descDoc.querySelector('img'); if (imgTag && imgTag.src) { imageUrl = imgTag.src; } } }
            const title = item.querySelector("title")?.textContent || "No Title";
            const keywords = ALL_RSS_FEEDS.find(f => f.name === sourceName).keywords;
            if (!keywords || keywords.some(k => title.toLowerCase().includes(k))) {
                articles.push({ title: title, link: item.querySelector("link")?.textContent || "#", pubDate: new Date(item.querySelector("pubDate")?.textContent || Date.now()).toISOString(), source: sourceName, image: imageUrl });
            }
        });
        return articles;
    };
    
    const loadNews = async () => {
        newsLoader.style.display = 'block';
        paginationControls.style.display = 'none';
        
        chrome.storage.local.get(['cachedNews', 'cacheTime'], (result) => {
            const { cachedNews, cacheTime } = result;
            const now = Date.now();
            if (cachedNews && cacheTime && (now - cacheTime < CACHE_DURATION_MINUTES * 60 * 1000)) {
                allArticles = cachedNews;
                newsLoader.style.display = 'none';
                displayPage(1);
            }
        });
        try {
            const allPromises = ALL_RSS_FEEDS.map(feed => fetch(feed.url).then(response => response.text()));
            const allResults = await Promise.all(allPromises);
            let freshArticles = [];
            allResults.forEach((xmlString, index) => {
                const articles = parseRSS(xmlString, ALL_RSS_FEEDS[index].name);
                freshArticles = freshArticles.concat(articles);
            });
            freshArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            allArticles = freshArticles;
            newsLoader.style.display = 'none';
            displayPage(1);
            chrome.storage.local.set({ cachedNews: allArticles, cacheTime: Date.now() });
        } catch (error) {
            console.error('Error fetching news:', error);
            if (newsLoader) { newsLoader.textContent = 'Failed to load news. Check connection.'; }
        }
    };

    const setupSocialSharing = () => {
        document.getElementById('share-twitter').href = `https://twitter.com/intent/tweet?text=${SHARE_TEXT}`;
        document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${SHARE_URL}`;
        document.getElementById('share-whatsapp').href = `https://api.whatsapp.com/send?text=${SHARE_TEXT}`;
    };

    const renderQuranVerse = (verse) => {
    const quranCard = document.getElementById('quran-card');
    if (!verse || !quranCard) {
        if (quranCard) quranCard.style.display = 'none';
        return;
    }
    quranCard.style.display = 'block';
    quranCard.querySelector('.quran-verse-ref').textContent = `(Surah ${verse.verse})`;
    quranCard.querySelector('.quran-arabic').textContent = verse.arabic;
    quranCard.querySelector('.quran-english').textContent = verse.english;
};

    // --- INITIALIZATION ---
    const init = () => {
        chrome.storage.sync.get('theme', data => setTheme(data.theme || 'light'));
        displayDailyMessage();
        setInterval(displayDailyMessage, 30000);
        
        loadNews();
        loadWords();
        setupSocialSharing();
        
        chrome.storage.local.get('wordOfTheHour', (result) => {
        renderWord(result.wordOfTheHour);
    });
// Get Quran Verse of the Hour
    chrome.storage.local.get('quranVerse', (result) => {
        renderQuranVerse(result.quranVerse);
    });
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.wordOfTheHour) {
                renderWord(changes.wordOfTheHour.newValue);
            }
            if (changes.quranVerse) {
                renderQuranVerse(changes.quranVerse.newValue);
            }
        });

        if (nextWordBtn) { nextWordBtn.addEventListener('click', handleNextWord); }
        if(prevPageBtn) { prevPageBtn.addEventListener('click', () => { if(currentPage > 1) displayPage(currentPage - 1); }); }
        if(nextPageBtn) { nextPageBtn.addEventListener('click', () => { if(currentPage < totalPages) displayPage(currentPage + 1); }); }
    };
    

    init();
});