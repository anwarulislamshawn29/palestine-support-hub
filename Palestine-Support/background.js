// --- HOURLY UPDATE LOGIC ---
async function updateContent() {
    // Update Word of the Hour
    try {
        const wordResponse = await fetch(chrome.runtime.getURL('data/word.json'));
        if (!wordResponse.ok) throw new Error('Network response was not ok for word.json.');
        const words = await wordResponse.json();
        const wordResult = await chrome.storage.local.get('lastWordIndex');
        const lastWordIndex = typeof wordResult.lastWordIndex === 'number' ? wordResult.lastWordIndex : -1;
        const nextWordIndex = (lastWordIndex + 1) % words.length;
        const newWord = words[nextWordIndex];
        await chrome.storage.local.set({ wordOfTheHour: newWord, lastWordIndex: nextWordIndex });
        console.log('Word of the Hour updated:', newWord.term);
    } catch (error) {
        console.error('Failed to update Word of the Hour:', error);
    }

    // Update Quran Verse of the Hour
    try {
        const verseResponse = await fetch(chrome.runtime.getURL('data/quran_verses.json'));
        if (!verseResponse.ok) throw new Error('Network response was not ok for quran_verses.json.');
        const verses = await verseResponse.json();
        const verseResult = await chrome.storage.local.get('lastVerseIndex');
        const lastVerseIndex = typeof verseResult.lastVerseIndex === 'number' ? verseResult.lastVerseIndex : -1;
        const nextVerseIndex = (lastVerseIndex + 1) % verses.length;
        const newVerse = verses[nextVerseIndex];
        await chrome.storage.local.set({ quranVerse: newVerse, lastVerseIndex: nextVerseIndex });
        console.log('Quran Verse of the Hour updated:', newVerse.verse);
    } catch (error) {
        console.error('Failed to update Quran Verse:', error);
    }
}


// --- EXTENSION LIFECYCLE LISTENERS ---
chrome.runtime.onInstalled.addListener(() => {
    console.log('Palestine Support Hub installed.');
    updateContent(); // Set the first word and verse on install
    chrome.alarms.create('hourlyUpdate', { delayInMinutes: 1, periodInMinutes: 60 });
    chrome.alarms.create('dailyUpdate', { delayInMinutes: 2, periodInMinutes: 1440 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyUpdate') {
        triggerDailyNotification();
    }
    if (alarm.name === 'hourlyUpdate') {
        updateContent();
    }
});


// --- NOTIFICATION LOGIC ---
const NOTIFICATION_RSS_URL = 'https://www.palestinechronicle.com/feed/';
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

async function getOffscreenDocument() {
    if (await chrome.offscreen.hasDocument()) { return; }
    await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: ['DOM_PARSER'],
        justification: 'Parse XML from RSS feed for notifications',
    });
}

async function getLatestHeadline() {
    await getOffscreenDocument();
    try {
        const headline = await chrome.runtime.sendMessage({
            action: 'parse-rss-for-headline',
            url: NOTIFICATION_RSS_URL,
        });
        return headline || 'Check in for daily updates and actions.';
    } catch (error) {
        console.error('Error fetching headline for notification:', error);
        return 'A new day, a new chance for solidarity.';
    }
}

async function triggerDailyNotification() {
    const latestMessage = await getLatestHeadline();
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon128.png',
        title: 'Palestine Support Hub',
        message: latestMessage,
        priority: 2
    });
}