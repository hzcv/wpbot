import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay, fetchLatestBaileysVersion, downloadContentFromMessage, downloadMediaMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';
import readline from 'readline';
import PQueue from 'p-queue';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== MASTER ADMIN CONFIGURATION ====================
const ALLOWED_ADMIN_NUMBERS = ["", ""];
const MASTER_ADMIN_NUMBER = "";
const MASTER_ADMIN_JID = "@s.whatsapp.net";
const BOT_OWNER_NAME = "SAIYAN";

// ==================== WEATHER API CONFIG ====================
const WEATHER_API_KEY = "b41d9746056a36ece89e2d492ea23667"; // Get from openweathermap.org

// ==================== AI CONFIGURATION ====================
const GEMINI_API_KEY = "AQ.Ab8RN6KcGoskaFiqedPr4UgJ4_gzxlApnXCN0fhK3nx8jLMcEg";
const AI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ==================== FUNNY AUTO-REPLY MESSAGES DATABASE ====================
const FUNNY_REPLIES = [
"😏🔥 Tera confidence dekh ke WiFi bhi disconnect ho gaya!",
"🤣💀 Tu itna smart hai ki Google bhi tujhe search kar raha hai... mistakes ke liye.",
"😜☕ Bhai, pehle chai pee le, phir logic ki baat karenge.",
"🧠😂 Tera brain update ho raha hai kya? Loading screen hi nahi ja rahi.",
"💀🎯 Aaj phir facts aur teri baatein alag-alag direction mein jaa rahi hain.",
"🤣🚑 Itna roast mat kara, ambulance wale dost ban jayenge.",
"😎🔥 Tu argument nahi karta, bas confidence se galat hota hai.",
"🤪📶 Tera network aur teri soch — dono weak signal pe chal rahe hain.",
"😂🪞 Mirror bhi tujhe dekh ke bole: Main kya karu iska?",
"💀🎪 Tu circus join kar le, natural talent waste ho raha hai.",
"😝⚡ Bhai speed toh teri mast hai, bas direction missing hai.",
"🤣🎓 Tu knowledge nahi deta, plot twists deta hai.",
"😎🍿 Main wait kar raha hoon kab teri baat sense banegi.",
"💀🚀 Tera logic NASA bhejo, shayad kisi aur planet pe kaam kare.",
"😂🔋 Confidence 100%, accuracy 2%.",
"🤪🎯 Tu target miss nahi karta... target tujhe miss karta hai.",
"😆🔥 Aaj phir tu apne hi joke ka victim ban gaya.",
"💀📢 Breaking News: Teri baat sunke logic ne resignation de diya.",
"🤣🧯 Bhai thoda chill, tera ego overheat ho raha hai.",
"😎⚔️ Tu debate karne aata hai ya comedy show chalane?",
"💀🤣 Tera brain airplane mode pe hai kya?",
"😏🔥 Tu itna confuse hai ki GPS bhi tujhe locate na kare.",
"🤣🎯 Bhai, tu point prove nahi karta, point lose karta hai.",
"💀📉 Tera IQ aur stock market crash mein competition chal raha hai.",
"😜🧠 Brain hai tere paas, bas attendance kam lagti hai.",
"😂🚪 Tu jab logic room mein aata hai, logic bahar nikal jaata hai.",
"🤣🍿 Teri baatein sunke popcorn bhi stale ho gaya.",
"💀🎤 Mic de do isko, galat confidence ka world record banana hai.",
"😏⚡ Tu shortcut dhoondte-dhoondte destination hi bhool gaya.",
"🤣🚧 Warning: Excess confidence ahead.",
"💀🧩 Tu puzzle nahi hai, missing pieces ka collection hai.",
"😂📡 Signal full, understanding zero.",
"🤪🔥 Bhai, tu roast nahi hota... tu self-roast machine hai.",
"💀🚀 Tera logic gravity se bhi zyada girta hai.",
"😆🎓 Education system tujhe dekh ke rethink kar raha hai.",
"🤣🤝 Tu dost kam, daily entertainment package zyada hai.",
"💀😂 Teri wajah se memes berozgar ho jayenge.",
"😏🍵 Bhai, tere secrets safe hain. Mujhe bhi samajh nahi aate.",
"🤣📖 Teri life story fiction section mein milni chahiye.",
"💀🎭 Tu drama create nahi karta, drama summon karta hai.",
"💀 Bhai, tu unique hai... aur shukr hai.",
"🤣 Tu bolta reh, comedy free mil rahi hai.",
"😏 Aaj phir reality se tera breakup ho gaya kya?",
"🔥 Tu legend hai... warning label ke saath.",
"😂 Tere ideas dekh ke autocorrect bhi surrender kar deta hai.",
"😭🤣 Bhai, tu impossible ko possible nahi karta... possible ko impossible karta hai.",
"💀 Tere thoughts buffering mein hi acche lagte hain.",
"😂 Tu answer nahi deta, side quest shuru kar deta hai.",
"😏 Teri confidence ki warranty kitni hai?",
"🤣 Bhai, tu proof hai ki survival aur intelligence alag cheezein hain.",
"💀 Tera brain update available hai, install kab karega?",
"🔥 Tu trend follow nahi karta, mistakes repeat karta hai.",
"😂 Google bhi tere sawaal dekh ke therapy leta hoga.",
"🤣 Tera logic trial version pe chal raha hai.",
"💀 Bhai, tu reason nahi, warning hai.",
"💀👑 King banne nikla tha, meme ban ke wapas aa gaya.",
"🤣⚰️ Tere comeback se zyada strong toh mere excuses hain.",
"🔥💀 Tu argument nahi haar raha... argument tujhe reject kar raha hai.",
"😏🚮 Teri opinion recycle bin mein bhi accept na ho.",
"🤣🌎 Agar confidence se kaam hota, tu duniya ka emperor hota."
];

const FUNNY_WELCOMES = [
    "🎉🥳 Naya member aaya hai! Welcome to the party baby!",
    "🎊😍 SAIYAN family me swagat hai mere yaar!",
    "🔥🤣 Ab maza ayega, naya dost aaya hai!",
    "🦁😎 Welcome sher! Sher bano, bakra nahi!",
    "💪😂 Naya fighter join kiya! Let's go!",
    "🌟🥳 Welcome superstar! Apni value rakh!"
];

const FUNNY_GOODBYES = [
    "😭😢 Rone ka time nahi, wapis aana mere bhai!",
    "👋😢 Ja rahe ho? Take care, bestie!",
    "🎭😭 Hamlet vibes: To be or not to be... but tu gaya!",
    "🕊️😢 Fly high! Wapas aana WhatsApp pe!"
];

// ==================== ANTI-CRASH ====================
process.on('uncaughtException', (err) => console.log(`[ANTI-CRASH] Ignored: ${err.message}`));
process.on('unhandledRejection', (reason) => {});
process.on('warning', (w) => console.warn('[WARNING]', w.message));
process.setMaxListeners(0);

// ==================== ENHANCED AI FUNCTION ====================
async function getAIResponse(userMessage, userName) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "AQ.Ab8RN6KcGoskaFiqedPr4UgJ4_gzxlApnXCN0fhK3nx8jLMcEg") {
        return FUNNY_REPLIES[Math.floor(Math.random() * FUNNY_REPLIES.length)];
    }
    
    try {
        const response = await axios.post(AI_API_URL, {
            contents: [{
                parts: [{
                    text: `You are a funny, sassy, and friendly WhatsApp bot named "SAIYAN BOT". 
                    User ${userName} said: "${userMessage}"
                    
                    Rules:
                    1. Keep response under 100 words
                    2. Be very funny and use Hindi/English mix (Hinglish)
                    3. Add laughing emojis (😂, 🤣, 😆, 😝, 🤪)
                    4. Be super positive and energetic
                    5. Never be rude, just playful
                    6. Call yourself "SAIYAN Bot" in responses`
                }]
            }]
        }, { timeout: 15000 });
        
        const aiReply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (aiReply) return aiReply;
        return FUNNY_REPLIES[Math.floor(Math.random() * FUNNY_REPLIES.length)];
    } catch (err) {
        console.log(`[AI ERROR] ${err.message}`);
        return FUNNY_REPLIES[Math.floor(Math.random() * FUNNY_REPLIES.length)];
    }
}

// ==================== WEATHER FUNCTION ====================
async function getWeather(city) {
    if (!WEATHER_API_KEY || WEATHER_API_KEY === "YOUR_OPENWEATHER_API_KEY") {
        return "⚠️ Weather API key not configured. Please set WEATHER_API_KEY in code.";
    }
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric`;
        const response = await axios.get(url, { timeout: 10000 });
        const data = response.data;
        const weatherText = `🌤️ Weather in ${data.name}, ${data.sys.country}
🌡️ Temperature: ${data.main.temp}°C (Feels like ${data.main.feels_like}°C)
💧 Humidity: ${data.main.humidity}%
💨 Wind: ${data.wind.speed} m/s
📝 Condition: ${data.weather[0].description}
☀️ Min: ${data.main.temp_min}°C | Max: ${data.main.temp_max}°C`;
        return weatherText;
    } catch (err) {
        return `❌ Could not fetch weather for "${city}". Error: ${err.message}`;
    }
}

// ==================== BRANDING ====================
let BOT_NAME = "❤️SAIYAN❤️";
const BOT_OWNER_DISPLAY = "SAIYAN";

// ==================== QUEUE ENGINE ====================
const HSEE = {
    attackQueue: new PQueue({ concurrency: 50, interval: 50, intervalCap: 50 }),
    normalQueue: new PQueue({ concurrency: 20, interval: 50, intervalCap: 20 }),
    async runAttack(task) {
        try {
            return await this.attackQueue.add(task);
        } catch(e) { return null; }
    },
    async runNormal(task) {
        try {
            return await this.normalQueue.add(task);
        } catch(e) { return null; }
    },
    clearAll() {
        this.attackQueue.clear();
        this.normalQueue.clear();
    }
};

// ==================== GLOBAL CONFIG ====================
const ROLES_FILE = './data/roles.json';
const BOTS_FILE = './data/bots.json';
const CONFIG_FILE = './data/config.json';
const NAME_LOCKS_FILE = './data/nameLocks.json';
const MESSAGE_FILE = './message.txt';
const TARGET_FILE = './target.txt';
const OWNER_FILE = './data/owner.json';
const AUTO_ADD_FILE = './data/autoAdd.json';
const AUTO_REPLY_FILE = './data/autoReply.json';
const AUTO_REPLY_ALL_FILE = './data/autoReplyAll.json';
const BOT_CONFIG_FILE = './data/botConfig.json';
const WELCOME_MSGS_FILE = './data/welcomeMsgs.json';
const GOODBYE_MSGS_FILE = './data/goodbyeMsgs.json';

const defaultRoles = { admins: [], subAdmins: [] };
const defaultConfig = { prefix: '!', panelPort: 3000, botName: BOT_NAME, aiEnabled: true };
const defaultWelcomeMsgs = { default: FUNNY_WELCOMES[0] };
const defaultGoodbyeMsgs = { default: FUNNY_GOODBYES[0] };

function safeReadJSON(path, def) {
    try {
        if (fs.existsSync(path)) return JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch(e) {}
    return def;
}
function safeWriteJSON(path, data) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
    } catch(e) {}
}

function loadMessagesFromFile() {
    if (!fs.existsSync(MESSAGE_FILE)) {
        const sampleMsgs = [
            `🔥 HELLO! This is SAIYAN BOT`,
            `💀 SAIYAN Bot is Online!`,
            `⚡ Speed Mode Active!`,
            `🎯 Target Acquired!`,
            `🚀 Super Fast Replies!`,
            `😎 Chill Karo, Main Hoon Na!`,
            `🦾 Beep Boop! Bot Mode ON!`,
            `💰 Rich Vibes Only!`
        ];
        fs.writeFileSync(MESSAGE_FILE, sampleMsgs.join('\n'));
        return sampleMsgs;
    }
    const content = fs.readFileSync(MESSAGE_FILE, 'utf8');
    return content.split('\n').filter(line => line.trim().length > 0);
}

function loadTargetFromFile() {
    if (!fs.existsSync(TARGET_FILE)) {
        fs.writeFileSync(TARGET_FILE, "");
        return null;
    }
    const content = fs.readFileSync(TARGET_FILE, 'utf8').trim();
    if (!content) return null;
    let target = content;
    if (!target.includes('@')) {
        target = target + '@s.whatsapp.net';
    }
    return target;
}

let ownerNumber = MASTER_ADMIN_NUMBER;
function loadOwner() {
    const data = safeReadJSON(OWNER_FILE, { owner: MASTER_ADMIN_NUMBER });
    ownerNumber = data.owner || MASTER_ADMIN_NUMBER;
    return ownerNumber;
}
function saveOwner(number) {
    ownerNumber = number;
    safeWriteJSON(OWNER_FILE, { owner: number });
}

let roles = safeReadJSON(ROLES_FILE, defaultRoles);
let globalConfig = safeReadJSON(CONFIG_FILE, defaultConfig);
let GLOBAL_PREFIX = globalConfig.prefix;
let nameLocks = safeReadJSON(NAME_LOCKS_FILE, {});
let botConfig = safeReadJSON(BOT_CONFIG_FILE, defaultConfig);
let welcomeMessages = safeReadJSON(WELCOME_MSGS_FILE, defaultWelcomeMsgs);
let goodbyeMessages = safeReadJSON(GOODBYE_MSGS_FILE, defaultGoodbyeMsgs);

function saveNameLocks() { safeWriteJSON(NAME_LOCKS_FILE, nameLocks); }
function updatePrefix(newPrefix) {
    GLOBAL_PREFIX = newPrefix;
    globalConfig.prefix = newPrefix;
    safeWriteJSON(CONFIG_FILE, globalConfig);
}
function updateBotName(newName) {
    BOT_NAME = newName;
    botConfig.botName = newName;
    safeWriteJSON(BOT_CONFIG_FILE, botConfig);
}
function setAIEnabled(enabled) {
    botConfig.aiEnabled = enabled;
    safeWriteJSON(BOT_CONFIG_FILE, botConfig);
}
function isAIEnabled() {
    return botConfig.aiEnabled !== false;
}
function setWelcomeMessage(groupJid, message) {
    welcomeMessages[groupJid] = message;
    safeWriteJSON(WELCOME_MSGS_FILE, welcomeMessages);
}
function getWelcomeMessage(groupJid) {
    return welcomeMessages[groupJid] || welcomeMessages.default || FUNNY_WELCOMES[0];
}
function setGoodbyeMessage(groupJid, message) {
    goodbyeMessages[groupJid] = message;
    safeWriteJSON(GOODBYE_MSGS_FILE, goodbyeMessages);
}
function getGoodbyeMessage(groupJid) {
    return goodbyeMessages[groupJid] || goodbyeMessages.default || FUNNY_GOODBYES[0];
}

// Auto Add Configuration
let autoAddGroups = safeReadJSON(AUTO_ADD_FILE, {});

// Auto Reply Configuration
let autoReplies = safeReadJSON(AUTO_REPLY_FILE, {});
let autoReplyAllMsgs = safeReadJSON(AUTO_REPLY_ALL_FILE, {});

// ==================== JID FUNCTIONS ====================
function normalizeJid(jid) {
    if (!jid) return '';
    let cleanNumber = jid.replace(/[^0-9]/g, '');
    return cleanNumber + '@s.whatsapp.net';
}
function extractNumber(jid) {
    if (!jid) return '';
    let numbers = jid.match(/\d+/g);
    if (numbers) return numbers.join('');
    return '';
}
function formatNumberWithName(number, name) {
    if (name && name !== number) {
        return `${name} (${number})`;
    }
    return number;
}

// ==================== ADMIN PERMISSION CHECK ====================
const hasPerm = (jid) => {
    const senderNumber = extractNumber(jid);
    const isAuthorized = ALLOWED_ADMIN_NUMBERS.includes(senderNumber);
    if (!isAuthorized) {
        console.log(`[AUTH CHECK] Unauthorized: ${senderNumber}`);
    } else {
        console.log(`[AUTH CHECK] Authorized Admin: ${senderNumber}`);
    }
    return isAuthorized;
};

function isMasterAdmin(jid) {
    const senderNumber = extractNumber(jid);
    return senderNumber === MASTER_ADMIN_NUMBER;
}
const isAdmin = (jid) => {
    const senderNumber = extractNumber(jid);
    if (hasPerm(jid)) return true;
    return roles.admins.some(a => extractNumber(a) === senderNumber);
};
const isSubAdmin = (jid) => {
    const senderNumber = extractNumber(jid);
    if (hasPerm(jid)) return false;
    return roles.subAdmins.some(s => extractNumber(s) === senderNumber);
};

function addAdmin(jid) {
    const norm = normalizeJid(jid);
    if (hasPerm(jid)) return false;
    if (!roles.admins.includes(norm)) {
        roles.admins.push(norm);
        safeWriteJSON(ROLES_FILE, roles);
        return true;
    }
    return false;
}
function removeAdmin(jid) {
    const norm = normalizeJid(jid);
    if (hasPerm(jid)) return false;
    roles.admins = roles.admins.filter(a => a !== norm);
    safeWriteJSON(ROLES_FILE, roles);
    return true;
}
function addSubAdmin(jid) {
    const norm = normalizeJid(jid);
    if (hasPerm(jid)) return false;
    if (!roles.subAdmins.includes(norm)) {
        roles.subAdmins.push(norm);
        safeWriteJSON(ROLES_FILE, roles);
        return true;
    }
    return false;
}
function removeSubAdmin(jid) {
    const norm = normalizeJid(jid);
    roles.subAdmins = roles.subAdmins.filter(s => s !== norm);
    safeWriteJSON(ROLES_FILE, roles);
}

// ==================== GROUP UNLOCK FUNCTIONS ====================
function unlockGroup(groupJid) {
    if (nameLocks[groupJid]) {
        delete nameLocks[groupJid];
        saveNameLocks();
        return true;
    }
    return false;
}

function isGroupLocked(groupJid) {
    return !!nameLocks[groupJid];
}

// ==================== EMOJIS ====================
const emojiArrays = {
    n1:['🔥','💥','⚡'], n2:['🌑','🌒','🌓'], n3:['🛑','🚧','🚨'], n4:['📀','💿','📸'],
    n5:['🕛','🕧','🕐'], n6:['❤️','🧡','💛'], n7:['💟','🕉️','☮️'], n8:['💀','👻','🎃'],
    n9:['🦅','🕊️','🐉'], n10:['🚀','🛸','🎈'], n11:['⚙️','🔧','🛠️'], n12:['🔮','💎','🎁'],
    n13:['🎯','🏆','⭐'], n14:['◼️','◻️','▪️']
};
const globalEmojiList = Object.values(emojiArrays).flat();

// ==================== MESSAGE STORE ====================
const storeMessages = new Map();

// ==================== BOT SESSION ====================
class BotSession {
    constructor(botId, phone, manager) {
        this.displayId = botId === 'Bot_1' ? 'SAIYAN BOT' : botId.replace('Bot_', 'BOT ');
        this.internalId = botId;
        this.phoneNumber = phone;
        this.manager = manager;
        this.authPath = `./auth/${botId}`;
        this.sock = null;
        this.connected = false;
        this.isSuppressed = false;
        this.activeName = new Map();
        this.activeSpam = new Map();
        this.activeSpamFast = new Map();
        this.activePfp = new Map();
        this.activeTarget = new Map();
        this.activeSlide = new Map();
        this.activeTagall = new Map();
        this.activeAutoReply = new Map();
        this.activeTargetReply = new Map();
        this.activePcspm = new Map();
        this.activeStspm = new Map();
        this.activeReplyAll = new Map();
        this.activeDesc = new Map();
        this.activeTxt = new Map();
        this.activeFileSpam = new Map();
        this.activeInboxSpam = new Map();
        this.activeSpamInbox = new Map();
        this.activeSpamGroup = new Map();
        this.activeAutoType = new Map();
        this.autoReactEmoji = null;
        this.pairingRequested = false;
        this.pairingRetryCount = 0;
        this.startTime = Date.now();
        this.profileUpdated = false;
        this.liveTime = null;
        this.liveTimer = null;
    }

    async enforceNameLock(groupJid, newName) {
        const lockedName = nameLocks[groupJid];
        if (lockedName && newName !== lockedName) {
            try { await this.sock.groupUpdateSubject(groupJid, lockedName); } catch(err) {}
        }
    }

    async autoAddMember(groupJid, participant) {
        if (autoAddGroups[groupJid] && autoAddGroups[groupJid].enabled) {
            try {
                const metadata = await this.sock.groupMetadata(groupJid);
                const isAdmin = metadata.participants.some(p => p.id === participant && (p.admin === 'admin' || p.admin === 'superadmin'));
                if (!isAdmin) {
                    await delay(2000);
                    await this.sock.groupParticipantsUpdate(groupJid, [participant], 'add').catch(() => {});
                    console.log(`[AUTO-ADD] Added ${participant} back to ${groupJid}`);
                }
            } catch(err) {
                console.log(`[AUTO-ADD ERROR] ${err.message}`);
            }
        }
    }

    async autoReplyToMessage(from, sender, msg, text, responseTime) {
        try {
            const senderName = extractNumber(sender);
            const isGroupChat = from.endsWith('@g.us');
            
            if (!isAIEnabled()) return;
            
            if (isGroupChat && autoReplies[from] && autoReplies[from].enabled && autoReplies[from].text) {
                const randomEmoji = globalEmojiList[Math.floor(Math.random() * globalEmojiList.length)];
                const replyMsg = `╔══════════════════════════════════╗
║               SAIYAN BOT             ║
╠══════════════════════════════════════╣
👋 Hello @${senderName}

${randomEmoji} ${autoReplies[from].text}

⚡ Response Time: ${responseTime}ms
╚══════════════════════════════════════╝
> Made by ${BOT_OWNER_DISPLAY}`;
                await this.send(from, replyMsg, [sender], msg);
                console.log(`[AUTO-REPLY] Replied to ${senderName} in ${from} with custom text`);
                return;
            }
            
            if (isGroupChat && autoReplyAllMsgs.enabled && autoReplyAllMsgs.text) {
                const randomEmoji = globalEmojiList[Math.floor(Math.random() * globalEmojiList.length)];
                const replyMsg = `╔══════════════════════════════════╗
║               SAIYAN BOT             ║
╠══════════════════════════════════════╣
👋 Hello @${senderName}

${randomEmoji} ${autoReplyAllMsgs.text}

⚡ Response Time: ${responseTime}ms
╚══════════════════════════════════════╝
> Made by ${BOT_OWNER_DISPLAY}`;
                await this.send(from, replyMsg, [sender], msg);
                console.log(`[AUTO-REPLY-ALL] Replied to ${senderName} in ${from}`);
                return;
            }
            
            if (isGroupChat && isAIEnabled()) {
                const funnyResponse = await getAIResponse(text, senderName);
                const randomEmoji = globalEmojiList[Math.floor(Math.random() * globalEmojiList.length)];
                const replyMsg = `╔══════════════════════════════════╗
║               SAIYAN BOT             ║
╠══════════════════════════════════════╣
👋 Hello @${senderName}

${randomEmoji} ${funnyResponse}

⚡ Response Time: ${responseTime}ms
╚══════════════════════════════════════╝
> Made by ${BOT_OWNER_DISPLAY}`;
                await this.send(from, replyMsg, [sender], msg);
                console.log(`[AUTO-REPLY] Replied to ${senderName} in ${from}`);
            }
        } catch (err) {
            console.log(`[AUTO-REPLY ERROR] ${err.message}`);
        }
    }

    async autoReactToMessage(from, msgKey) {
        try {
            if (from.endsWith('@g.us')) {
                const emoji = this.autoReactEmoji || globalEmojiList[Math.floor(Math.random() * globalEmojiList.length)];
                await this.sock.sendMessage(from, { react: { text: emoji, key: msgKey } });
            }
        } catch(err) {}
    }

    async sendEmoji(from, emoji, count = 1) {
        try {
            const emojiMsg = emoji.repeat(count);
            await this.send(from, emojiMsg);
            return true;
        } catch(err) {
            return false;
        }
    }

    // ==================== AUTO-TYPING METHODS ====================
    async startAutoTypeInbox(targetNumber, customName = null, delayMs = 3000) {
        const messages = loadMessagesFromFile();
        if (messages.length === 0) return false;
        let targetJid = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
        const sessionKey = `autotype_inbox_${targetJid}`;
        if (this.activeAutoType.has(sessionKey)) return false;
        
        this.activeAutoType.set(sessionKey, { active: true, target: targetJid, messages: [...messages], index: 0, delay: delayMs, name: customName, isGroup: false });
        
        (async () => {
            while (this.activeAutoType.has(sessionKey) && this.connected) {
                const session = this.activeAutoType.get(sessionKey);
                if (!session || !session.active) break;
                const msg = session.messages[session.index % session.messages.length];
                const displayName = session.name || extractNumber(targetJid);
                const formattedMsg = `📨 To: ${displayName}\n\n${msg}`;
                await this.sock.sendPresenceUpdate('composing', targetJid).catch(() => {});
                const typingTime = Math.min(Math.max(msg.length * 30, 1000), 5000);
                await delay(typingTime);
                await this.sock.sendPresenceUpdate('paused', targetJid).catch(() => {});
                await this.send(targetJid, formattedMsg);
                session.index++;
                this.activeAutoType.set(sessionKey, session);
                await delay(session.delay);
            }
        })();
        return true;
    }
    
    async startAutoTypeGroup(groupJid, targetNumber, customName = null, delayMs = 3000) {
        const messages = loadMessagesFromFile();
        if (messages.length === 0) return false;
        let targetMention = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
        const sessionKey = `autotype_group_${groupJid}_${targetMention}`;
        if (this.activeAutoType.has(sessionKey)) return false;
        
        this.activeAutoType.set(sessionKey, { active: true, group: groupJid, target: targetMention, messages: [...messages], index: 0, delay: delayMs, name: customName, isGroup: true });
        
        (async () => {
            while (this.activeAutoType.has(sessionKey) && this.connected) {
                const session = this.activeAutoType.get(sessionKey);
                if (!session || !session.active) break;
                const msg = session.messages[session.index % session.messages.length];
                const displayName = session.name || extractNumber(targetMention);
                const formattedMsg = `📨 @${extractNumber(targetMention)} (${displayName})\n\n${msg}`;
                await this.sock.sendPresenceUpdate('composing', groupJid).catch(() => {});
                const typingTime = Math.min(Math.max(msg.length * 30, 1000), 5000);
                await delay(typingTime);
                await this.sock.sendPresenceUpdate('paused', groupJid).catch(() => {});
                await this.send(groupJid, formattedMsg, [targetMention]);
                session.index++;
                this.activeAutoType.set(sessionKey, session);
                await delay(session.delay);
            }
        })();
        return true;
    }
    
    async stopAutoType(targetNumber, isGroup = false, groupJid = null) {
        if (isGroup && groupJid) {
            let targetMention = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
            const sessionKey = `autotype_group_${groupJid}_${targetMention}`;
            this.activeAutoType.delete(sessionKey);
            return true;
        } else {
            let targetJid = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
            const sessionKey = `autotype_inbox_${targetJid}`;
            this.activeAutoType.delete(sessionKey);
            return true;
        }
    }

    async handleMessageDelete(groupJid, deletedKey) {
        try {
            const deletedMsg = storeMessages.get(deletedKey.id);
            if (deletedMsg && deletedMsg.message) {
                let msgText = "📷 Media Message";
                let mediaBuffer = null;
                let isMedia = false;
                let mediaType = null;
                
                if (deletedMsg.message.conversation) {
                    msgText = deletedMsg.message.conversation;
                } else if (deletedMsg.message.extendedTextMessage?.text) {
                    msgText = deletedMsg.message.extendedTextMessage.text;
                } else if (deletedMsg.message.imageMessage) {
                    isMedia = true;
                    mediaType = 'image';
                    msgText = deletedMsg.message.imageMessage.caption || "📷 Image";
                    try {
                        const stream = await downloadContentFromMessage(deletedMsg.message.imageMessage, 'image');
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }
                        mediaBuffer = buffer;
                    } catch(e) { console.log(`[MEDIA DL ERROR] ${e.message}`); }
                } else if (deletedMsg.message.videoMessage) {
                    isMedia = true;
                    mediaType = 'video';
                    msgText = deletedMsg.message.videoMessage.caption || "🎥 Video";
                    try {
                        const stream = await downloadContentFromMessage(deletedMsg.message.videoMessage, 'video');
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }
                        mediaBuffer = buffer;
                    } catch(e) { console.log(`[MEDIA DL ERROR] ${e.message}`); }
                } else if (deletedMsg.message.stickerMessage) {
                    isMedia = true;
                    mediaType = 'sticker';
                    msgText = "🎭 Sticker";
                    try {
                        const stream = await downloadContentFromMessage(deletedMsg.message.stickerMessage, 'sticker');
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }
                        mediaBuffer = buffer;
                    } catch(e) { console.log(`[MEDIA DL ERROR] ${e.message}`); }
                }
                
                const sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
                const senderName = extractNumber(sender);
                const groupMeta = await this.sock.groupMetadata(groupJid).catch(() => null);
                const groupName = groupMeta?.subject || groupJid;
                
                if (isMedia && mediaBuffer) {
                    const mediaMsg = {
                        text: `╭───【 🚨 ANTI DELETE RESTORED 】───╮
│
│ 👤 User: @${senderName}
│ 📍 Group: ${groupName}
│ 📝 Caption: ${msgText.substring(0, 100)}
│ ⏱️ Time: ${new Date().toLocaleTimeString()}
│
╰──────────────────────────╯`
                    };
                    
                    if (mediaType === 'image') {
                        await this.sock.sendMessage(groupJid, { image: mediaBuffer, caption: mediaMsg.text, mentions: [sender] });
                    } else if (mediaType === 'video') {
                        await this.sock.sendMessage(groupJid, { video: mediaBuffer, caption: mediaMsg.text, mentions: [sender] });
                    } else if (mediaType === 'sticker') {
                        await this.sock.sendMessage(groupJid, { sticker: mediaBuffer });
                        await this.sock.sendMessage(groupJid, { text: `🚨 Deleted sticker from @${senderName} restored!`, mentions: [sender] });
                    }
                } else {
                    const alertMsg = `╭───【 🚨 ANTI DELETE RESTORED 】───╮
│
│ 👤 User: @${senderName}
│ 📍 Group: ${groupName}
│ 📝 Message: ${msgText.substring(0, 150)}
│ ⏱️ Time: ${new Date().toLocaleTimeString()}
│
╰──────────────────────────╯`;
                    
                    await this.sock.sendMessage(groupJid, { text: alertMsg, mentions: [sender] });
                }
                console.log(`[ANTI-DELETE] Restored ${isMedia ? mediaType : 'text'} from ${senderName} in ${groupName}`);
            }
        } catch(err) {
            console.log(`[ANTI-DELETE ERROR] ${err.message}`);
        }
    }

    async handleGroupParticipantUpdate(groupJid, update) {
        try {
            const groupMeta = await this.sock.groupMetadata(groupJid).catch(() => null);
            const memberCount = groupMeta?.participants?.length || 0;
            
            if (update.action === 'add') {
                for (const participant of update.participants) {
                    const welcomeMsg = getWelcomeMessage(groupJid);
                    const msg = `╭───【 🎉 WELCOME 】───╮
│
│ ${welcomeMsg}
│ 👤 @${extractNumber(participant)}
│ 📊 Members: ${memberCount}
│ 🤖 Bot: ${BOT_OWNER_DISPLAY}
│
╰──────────────────────────╯`;
                    await this.send(groupJid, msg, [participant]);
                }
            } else if (update.action === 'remove') {
                for (const participant of update.participants) {
                    const goodbyeMsg = getGoodbyeMessage(groupJid);
                    const msg = `╭───【 👋 GOODBYE 】───╮
│
│ ${goodbyeMsg}
│ 👤 @${extractNumber(participant)}
│ 📊 Members: ${memberCount}
│
╰──────────────────────────╯`;
                    await this.send(groupJid, msg, [participant]);
                    await this.autoAddMember(groupJid, participant);
                }
            }
        } catch(err) {
            console.log(`[GROUP UPDATE ERROR] ${err.message}`);
        }
    }

    async getGroupInfo(groupJid) {
        try {
            const metadata = await this.sock.groupMetadata(groupJid);
            const inviteCode = await this.sock.groupInviteCode(groupJid).catch(() => null);
            const inviteLink = inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : "Can't generate invite link";
            return {
                id: groupJid,
                name: metadata.subject,
                description: metadata.desc || "No description",
                owner: metadata.owner,
                memberCount: metadata.participants.length,
                created: metadata.creation,
                inviteLink: inviteLink
            };
        } catch(err) {
            return null;
        }
    }

    async startLiveTime(groupJid, durationSeconds) {
        if (this.liveTimer) clearInterval(this.liveTimer);
        this.liveTime = Date.now() + (durationSeconds * 1000);
        
        const updateLiveTime = async () => {
            const remaining = Math.max(0, Math.floor((this.liveTime - Date.now()) / 1000));
            const hours = Math.floor(remaining / 3600);
            const minutes = Math.floor((remaining % 3600) / 60);
            const seconds = remaining % 60;
            let timeStr = '';
            if (hours > 0) timeStr += `${hours}h `;
            if (minutes > 0 || hours > 0) timeStr += `${minutes}m `;
            timeStr += `${seconds}s`;
            const statusMsg = `╭───【 ⏱️ LIVE TIME STATUS 】───╮
│
│ 🤖 Bot: ${this.displayId}
│ ⏰ Remaining: ${timeStr}
│ 📊 Status: ${remaining > 0 ? '🟢 ACTIVE' : '🔴 EXPIRED'}
│ 🤖 ${BOT_OWNER_DISPLAY}
│
╰──────────────────────────╯`;
            await this.send(groupJid, statusMsg).catch(() => {});
            if (remaining <= 0 && this.liveTimer) {
                clearInterval(this.liveTimer);
                this.liveTimer = null;
                this.liveTime = null;
            }
        };
        await updateLiveTime();
        this.liveTimer = setInterval(updateLiveTime, 60000);
        return true;
    }

    async stopLiveTime() {
        if (this.liveTimer) {
            clearInterval(this.liveTimer);
            this.liveTimer = null;
        }
        this.liveTime = null;
        return true;
    }

    async connect() {
        if (!fs.existsSync(this.authPath)) fs.mkdirSync(this.authPath, { recursive: true });
        const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
        const { version } = await fetchLatestBaileysVersion();
        
        this.sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            mobile: false,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            syncFullHistory: false,
            getMessage: async (key) => storeMessages.get(key.id)?.message || { conversation: `(⚡) ${BOT_NAME} (⚡)` }
        });

        this.sock.ev.on('creds.update', saveCreds);
        this.sock.ev.on('call', async (calls) => {
            for (const call of calls) if (call.status === 'offer') try { await this.sock.rejectCall(call.id, call.from); } catch(e) {}
        });

        this.sock.ev.on('group-metadata.update', async ({ id, metadata }) => {
            if (metadata.subject && nameLocks[id]) await this.enforceNameLock(id, metadata.subject);
        });

        this.sock.ev.on('messages.upsert', ({ messages }) => {
            for (const msg of messages) {
                if (msg.key && msg.message) {
                    storeMessages.set(msg.key.id, msg);
                    setTimeout(() => storeMessages.delete(msg.key.id), 60000);
                }
            }
        });

        this.sock.ev.on('messages.delete', async (data) => {
            if (data.keys && data.keys[0] && data.keys[0].remoteJid?.endsWith('@g.us')) {
                for (const key of data.keys) {
                    await this.handleMessageDelete(key.remoteJid, key);
                }
            }
        });

        this.sock.ev.on('group-participants.update', async (update) => {
            await this.handleGroupParticipantUpdate(update.id, update);
        });

        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                this.connected = false;
                const code = (lastDisconnect?.error instanceof Boom) ? lastDisconnect.error.output.statusCode : 500;
                if (code !== DisconnectReason.loggedOut && code !== 401) {
                    setTimeout(() => this.connect(), 5000);
                } else {
                    if (fs.existsSync(this.authPath)) fs.rmSync(this.authPath, { recursive: true, force: true });
                    this.pairingRequested = false;
                    this.pairingRetryCount = 0;
                    setTimeout(() => this.connect(), 3000);
                }
            } else if (connection === 'open') {
                this.connected = true;
                this.startTime = Date.now();
                this.pairingRetryCount = 0;
                console.log(`✅ [${this.displayId}] ONLINE!`);
                if (this.manager.onBotOnline) this.manager.onBotOnline(this.internalId);
            }
        });

        this.sock.ev.on('messages.upsert', m => this.handleMsg(m));

        // ==================== PAIRING CODE WITH EXTENDED EXPIRY ====================
        const credsExist = fs.existsSync(`${this.authPath}/creds.json`);
        if (!credsExist && this.phoneNumber && !this.pairingRequested) {
            this.pairingRequested = true;
            
            // Wait 3 seconds before requesting pairing code to ensure socket is ready
            await delay(3000);
            
            // Retry mechanism for pairing code
            const requestPairingWithRetry = async (retryCount = 0) => {
                try {
                    console.log(`[${this.displayId}] Requesting pairing code for ${this.phoneNumber} (Attempt ${retryCount + 1})`);
                    
                    // Request pairing code with a longer expiry by using the phone number directly
                    const code = await this.sock.requestPairingCode(this.phoneNumber);
                    
                    console.log(`\n🔐 PAIRING CODE FOR ${this.displayId}: ${code}`);
                    console.log(`⏰ This code will remain valid for approximately 5 minutes!\n`);
                    
                    // Store pairing code in a file for reference
                    const pairingInfo = {
                        botId: this.internalId,
                        phoneNumber: this.phoneNumber,
                        code: code,
                        timestamp: Date.now(),
                        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes expiry
                    };
                    if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
                    fs.writeFileSync(`./data/pairing_${this.internalId}.json`, JSON.stringify(pairingInfo, null, 2));
                    
                    this.pairingRetryCount = 0;
                    return true;
                } catch (err) {
                    console.log(`[${this.displayId}] Pairing error: ${err.message}`);
                    
                    if (retryCount < 3) {
                        console.log(`[${this.displayId}] Retrying pairing in 5 seconds... (Attempt ${retryCount + 2})`);
                        await delay(5000);
                        return requestPairingWithRetry(retryCount + 1);
                    } else {
                        console.log(`[${this.displayId}] Failed to get pairing code after 3 attempts.`);
                        console.log(`[${this.displayId}] Please check the phone number and try again.`);
                        this.pairingRequested = false;
                        return false;
                    }
                }
            };
            
            await requestPairingWithRetry();
        }
    }

    async send(jid, text, mentions = [], quoted = null, imageUrl = null, stickerUrl = null) {
        if (!this.connected) return;
        let msgPayload = { text: text, mentions: mentions.length ? mentions : undefined };
        if (imageUrl && fs.existsSync(imageUrl)) {
            msgPayload = { image: fs.readFileSync(imageUrl), caption: text, mentions: mentions.length ? mentions : undefined };
        } else if (stickerUrl && fs.existsSync(stickerUrl)) {
            msgPayload = { sticker: fs.readFileSync(stickerUrl) };
        }
        await this.sock.sendMessage(jid, msgPayload, quoted ? { quoted } : {}).catch(()=>{});
    }

    async startInboxFileSpam(targetNumber, interval = 10000, customName = null) {
        const messages = loadMessagesFromFile();
        if (messages.length === 0) return false;
        let targetJid = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
        const spamKey = `inbox_${targetJid}`;
        if (this.activeInboxSpam.has(spamKey)) return false;
        this.activeInboxSpam.set(spamKey, { active: true, target: targetJid, interval: interval, name: customName });
        (async () => {
            let idx = 0;
            while (this.activeInboxSpam.has(spamKey) && this.connected) {
                try {
                    const msg = messages[idx % messages.length];
                    const displayName = customName || extractNumber(targetJid);
                    const formattedMsg = `📨 To: ${displayName}\n\n${msg}`;
                    await this.send(targetJid, formattedMsg);
                    idx++;
                    await delay(interval);
                } catch(err) { await delay(5000); }
            }
        })();
        return true;
    }

    async stopInboxFileSpam(targetNumber) {
        let targetJid = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
        this.activeInboxSpam.delete(`inbox_${targetJid}`);
        return true;
    }

    async startGroupFileSpam(groupJid, targetNumber, interval = 10000, customName = null) {
        const messages = loadMessagesFromFile();
        if (messages.length === 0) return false;
        let targetMention = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
        const spamKey = `group_${groupJid}_${targetMention}`;
        if (this.activeFileSpam.has(spamKey)) return false;
        this.activeFileSpam.set(spamKey, { active: true, group: groupJid, target: targetMention, interval: interval, name: customName });
        (async () => {
            let idx = 0;
            while (this.activeFileSpam.has(spamKey) && this.connected) {
                try {
                    const msg = messages[idx % messages.length];
                    const displayName = customName || extractNumber(targetMention);
                    const formattedMsg = `📨 @${extractNumber(targetMention)} (${displayName})\n\n${msg}`;
                    await this.send(groupJid, formattedMsg, [targetMention]);
                    idx++;
                    await delay(interval);
                } catch(err) { await delay(5000); }
            }
        })();
        return true;
    }

    async stopGroupFileSpam(groupJid, targetNumber) {
        let targetMention = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
        this.activeFileSpam.delete(`group_${groupJid}_${targetMention}`);
        return true;
    }

    async stopAllGroupSpam(groupJid) {
        const toDelete = [];
        for (const key of this.activeFileSpam.keys()) {
            if (key.startsWith(`group_${groupJid}_`)) {
                toDelete.push(key);
            }
        }
        for (const key of toDelete) {
            this.activeFileSpam.delete(key);
        }
        return toDelete.length;
    }

    async startCustomSpamInbox(targetNumber, message, interval = 10000, customName = null) {
        let targetJid = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
        const spamKey = `custom_inbox_${targetJid}`;
        if (this.activeSpamInbox.has(spamKey)) return false;
        this.activeSpamInbox.set(spamKey, { active: true, target: targetJid, message: message, interval: interval, name: customName });
        (async () => {
            while (this.activeSpamInbox.has(spamKey) && this.connected) {
                try {
                    const displayName = customName || extractNumber(targetJid);
                    const formattedMsg = `📨 To: ${displayName}\n\n${message}`;
                    await this.send(targetJid, formattedMsg);
                    await delay(interval);
                } catch(err) { await delay(5000); }
            }
        })();
        return true;
    }

    async stopCustomSpamInbox(targetNumber) {
        let targetJid = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
        this.activeSpamInbox.delete(`custom_inbox_${targetJid}`);
        return true;
    }

    async startCustomSpamGroup(groupJid, targetNumber, message, interval = 10000, customName = null) {
        let targetMention = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
        const spamKey = `custom_group_${groupJid}_${targetMention}`;
        if (this.activeSpamGroup.has(spamKey)) return false;
        this.activeSpamGroup.set(spamKey, { active: true, group: groupJid, target: targetMention, message: message, interval: interval, name: customName });
        (async () => {
            while (this.activeSpamGroup.has(spamKey) && this.connected) {
                try {
                    const displayName = customName || extractNumber(targetMention);
                    const formattedMsg = `📨 @${extractNumber(targetMention)} (${displayName})\n\n${message}`;
                    await this.send(groupJid, formattedMsg, [targetMention]);
                    await delay(interval);
                } catch(err) { await delay(5000); }
            }
        })();
        return true;
    }

    async stopCustomSpamGroup(groupJid, targetNumber) {
        let targetMention = targetNumber.includes('@') ? targetNumber : targetNumber + '@s.whatsapp.net';
        this.activeSpamGroup.delete(`custom_group_${groupJid}_${targetMention}`);
        return true;
    }

    async handleMsg({ messages, type }) {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message) return;
        
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = isGroup ? msg.key.participant : from;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        const isCmd = text.startsWith(GLOBAL_PREFIX);
        const command = isCmd ? text.slice(GLOBAL_PREFIX.length).trim().split(' ')[0].toLowerCase() : "";
        const args = text.split(/ +/).slice(1);
        const quotedMsg = msg.message.extendedTextMessage?.contextInfo;
        const replyJid = quotedMsg?.participant ? normalizeJid(quotedMsg.participant) : null;
        const isMain = this.internalId === this.manager.getMainBotId();
        const responseTime = Date.now() - (msg.messageTimestamp * 1000 || Date.now());

        if (!msg.key.fromMe) await this.autoReactToMessage(from, msg.key);
        
        // Auto-reply only for groups
        if (!msg.key.fromMe && !isCmd && isGroup && isAIEnabled()) {
            await this.autoReplyToMessage(from, sender, msg, text, responseTime);
        }

        // ==================== WEATHER COMMAND ====================
        if (isCmd && command === 'weather') {
            const city = args.join(' ');
            if (!city) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}weather <city name>

📌 Examples:
├── ${GLOBAL_PREFIX}weather London
├── ${GLOBAL_PREFIX}weather New York
└── ${GLOBAL_PREFIX}weather Mumbai

🌡️ Get current weather information for any city!`);
                return;
            }
            await this.send(from, `🌍 Fetching weather for "${city}"...`);
            const weatherInfo = await getWeather(city);
            await this.send(from, weatherInfo);
            return;
        }

        // ==================== AUTO-TYPING COMMANDS ====================
        if (isCmd && command === 'autotyp') {
            const targetNumber = args[0];
            let customName = null;
            let delayTime = 3000;
            
            if (!targetNumber) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}autotyp <number> [name] [delay_ms]

📌 Examples:
├── ${GLOBAL_PREFIX}autotyp 919536764960
├── ${GLOBAL_PREFIX}autotyp 919536764960 "Raj Sharma"
├── ${GLOBAL_PREFIX}autotyp 919536764960 "Raj" 5000
└── ${GLOBAL_PREFIX}autotyp 919536764960 4000

⌨️ Auto-types messages from message.txt with typing indicator!
💡 Use ${GLOBAL_PREFIX}stopautotyp <number> to stop`);
                return;
            }
            
            let idx = 1;
            if (args[1] && isNaN(parseInt(args[1]))) {
                customName = args.slice(1).join(' ');
                idx = args.length;
            }
            if (args[idx] && !isNaN(parseInt(args[idx]))) {
                delayTime = parseInt(args[idx]);
            }
            
            const success = await this.startAutoTypeInbox(targetNumber, customName, delayTime);
            if (success) {
                const msgCount = loadMessagesFromFile().length;
                const displayTarget = customName ? `${customName} (${targetNumber})` : targetNumber;
                await this.send(from, `⌨️ AUTO-TYPING STARTED (INBOX)

🎯 Target: ${displayTarget}
⏱️ Delay: ${delayTime}ms between messages
📄 Messages: ${msgCount} lines
🖊️ Typing indicator: ENABLED

✅ Bot will type and send each message from message.txt!
🔴 Use ${GLOBAL_PREFIX}stopautotyp ${targetNumber} to stop.`);
            } else {
                await this.send(from, `❌ Failed to start! Already running for this target or no messages in message.txt.`);
            }
            return;
        }
        
        if (isCmd && command === 'autotypgroup') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            const targetNumber = args[0];
            let customName = null;
            let delayTime = 3000;
            
            if (!targetNumber && replyJid) {
                const fallbackTarget = extractNumber(replyJid);
                if (fallbackTarget) {
                    let idx = 0;
                    if (args[0] && !isNaN(parseInt(args[0]))) {
                        delayTime = parseInt(args[0]);
                    } else if (args[0]) {
                        customName = args.join(' ');
                        idx = args.length;
                    }
                    if (args[idx] && !isNaN(parseInt(args[idx]))) delayTime = parseInt(args[idx]);
                    const success = await this.startAutoTypeGroup(from, fallbackTarget, customName, delayTime);
                    if (success) {
                        const msgCount = loadMessagesFromFile().length;
                        const displayTarget = customName ? `${customName} (${fallbackTarget})` : fallbackTarget;
                        await this.send(from, `⌨️ AUTO-TYPING STARTED (GROUP)

🎯 Target: ${displayTarget}
⏱️ Delay: ${delayTime}ms
📄 Messages: ${msgCount} lines
🖊️ Typing indicator: ENABLED

✅ Bot will type and mention @${fallbackTarget} with each message!
🔴 Use ${GLOBAL_PREFIX}stopautotypgroup ${fallbackTarget} to stop.`, [`${fallbackTarget}@s.whatsapp.net`]);
                    } else {
                        await this.send(from, `❌ Failed to start!`);
                    }
                    return;
                }
            }
            
            if (!targetNumber) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}autotypgroup <number> [name] [delay_ms]

📌 Examples:
├── ${GLOBAL_PREFIX}autotypgroup 919536764960
├── ${GLOBAL_PREFIX}autotypgroup 919536764960 "Raj Sharma"
├── ${GLOBAL_PREFIX}autotypgroup 919536764960 5000
└── Reply to user's message and use ${GLOBAL_PREFIX}autotypgroup

⌨️ Auto-types messages with mention in group!`);
                return;
            }
            
            let idx = 1;
            if (args[1] && isNaN(parseInt(args[1]))) {
                customName = args.slice(1).join(' ');
                idx = args.length;
            }
            if (args[idx] && !isNaN(parseInt(args[idx]))) {
                delayTime = parseInt(args[idx]);
            }
            
            const success = await this.startAutoTypeGroup(from, targetNumber, customName, delayTime);
            if (success) {
                const msgCount = loadMessagesFromFile().length;
                const displayTarget = customName ? `${customName} (${targetNumber})` : targetNumber;
                await this.send(from, `⌨️ AUTO-TYPING STARTED (GROUP)

🎯 Target: ${displayTarget}
⏱️ Delay: ${delayTime}ms
📄 Messages: ${msgCount} lines
🖊️ Typing indicator: ENABLED

✅ Bot will type and mention @${targetNumber} with each message!
🔴 Use ${GLOBAL_PREFIX}stopautotypgroup ${targetNumber} to stop.`, [`${targetNumber}@s.whatsapp.net`]);
            } else {
                await this.send(from, `❌ Failed to start! Already running for this target or no messages.`);
            }
            return;
        }
        
        if (isCmd && command === 'stopautotyp') {
            const targetNumber = args[0];
            if (!targetNumber) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}stopautotyp <number>

📌 Example: ${GLOBAL_PREFIX}stopautotyp 919536764960

🛑 Stops auto-typing for the specified inbox target.`);
                return;
            }
            await this.stopAutoType(targetNumber, false);
            await this.send(from, `🛑 AUTO-TYPING STOPPED (INBOX)

✅ Stopped auto-typing for +${targetNumber}`);
            return;
        }
        
        if (isCmd && command === 'stopautotypgroup') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            const targetNumber = args[0];
            if (!targetNumber) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}stopautotypgroup <number>

📌 Example: ${GLOBAL_PREFIX}stopautotypgroup 919536764960

🛑 Stops auto-typing for the specified target in this group.`);
                return;
            }
            await this.stopAutoType(targetNumber, true, from);
            await this.send(from, `🛑 AUTO-TYPING STOPPED (GROUP)

✅ Stopped auto-typing for +${targetNumber} in this group.`);
            return;
        }

        // ==================== ADMIN MANAGEMENT BY NUMBER ====================
        if (isCmd && command === 'addadmin') {
            if (!hasPerm(sender)) {
                await this.send(from, `❌ ACCESS DENIED! Only master admins can use this command.`);
                return;
            }
            const targetNum = args[0]?.replace(/\D/g, '');
            if (!targetNum) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}addadmin <number>

📌 Example: ${GLOBAL_PREFIX}addadmin 919876543210

👑 Adds a new admin by phone number.`);
                return;
            }
            const targetJid = targetNum + '@s.whatsapp.net';
            if (addAdmin(targetJid)) {
                await this.send(from, `✅ ADMIN ADDED!

👑 Number: +${targetNum}
🔓 Now has full admin access to bot commands.`);
            } else {
                await this.send(from, `❌ Failed to add admin! Already an admin or invalid.`);
            }
            return;
        }
        
        if (isCmd && command === 'removeadmin') {
            if (!hasPerm(sender)) {
                await this.send(from, `❌ ACCESS DENIED! Only master admins can use this command.`);
                return;
            }
            const targetNum = args[0]?.replace(/\D/g, '');
            if (!targetNum) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}removeadmin <number>

📌 Example: ${GLOBAL_PREFIX}removeadmin 919876543210

👑 Removes an admin by phone number.`);
                return;
            }
            const targetJid = targetNum + '@s.whatsapp.net';
            if (removeAdmin(targetJid)) {
                await this.send(from, `🗑️ ADMIN REMOVED!

👑 Number: +${targetNum}
🔒 Admin privileges revoked.`);
            } else {
                await this.send(from, `❌ Failed to remove admin! Not an admin or invalid.`);
            }
            return;
        }
        
        if (isCmd && command === 'addsubadmin') {
            if (!hasPerm(sender)) {
                await this.send(from, `❌ ACCESS DENIED! Only master admins can use this command.`);
                return;
            }
            const targetNum = args[0]?.replace(/\D/g, '');
            if (!targetNum) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}addsubadmin <number>

📌 Example: ${GLOBAL_PREFIX}addsubadmin 919876543210

🛡️ Adds a sub-admin by phone number.`);
                return;
            }
            const targetJid = targetNum + '@s.whatsapp.net';
            if (addSubAdmin(targetJid)) {
                await this.send(from, `✅ SUB-ADMIN ADDED!

🛡️ Number: +${targetNum}
🔓 Has limited bot access.`);
            } else {
                await this.send(from, `❌ Failed to add sub-admin! Already a sub-admin or invalid.`);
            }
            return;
        }
        
        if (isCmd && command === 'removesubadmin') {
            if (!hasPerm(sender)) {
                await this.send(from, `❌ ACCESS DENIED! Only master admins can use this command.`);
                return;
            }
            const targetNum = args[0]?.replace(/\D/g, '');
            if (!targetNum) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}removesubadmin <number>

📌 Example: ${GLOBAL_PREFIX}removesubadmin 919876543210

🛡️ Removes a sub-admin by phone number.`);
                return;
            }
            const targetJid = targetNum + '@s.whatsapp.net';
            removeSubAdmin(targetJid);
            await this.send(from, `🗑️ SUB-ADMIN REMOVED!

🛡️ Number: +${targetNum}
🔒 Sub-admin privileges revoked.`);
            return;
        }

        // ==================== SET BOT NAME COMMAND ====================
        if (isCmd && command === 'setbotname') {
            if (!hasPerm(sender)) {
                await this.send(from, `❌ ACCESS DENIED! Only admins can use this command.`);
                return;
            }
            const newName = args.join(' ');
            if (!newName) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}setbotname <new_name>

📌 Example: ${GLOBAL_PREFIX}setbotname 🔥 SAIYAN BOT 🔥

🤖 Changes the bot's display name.`);
                return;
            }
            updateBotName(newName);
            await this.send(from, `✅ BOT NAME UPDATED!

🤖 New Name: ${newName}
💡 Changes will reflect in menus and auto-replies.`);
            return;
        }

        // ==================== AI TOGGLE COMMANDS ====================
        if (isCmd && command === 'aion') {
            if (!hasPerm(sender)) {
                await this.send(from, `❌ ACCESS DENIED! Only admins can use this command.`);
                return;
            }
            setAIEnabled(true);
            await this.send(from, `🤖 AI MODE ACTIVATED!

✅ Bot will now use AI/funny replies for all group messages.
💡 Use ${GLOBAL_PREFIX}aioff to disable.`);
            return;
        }
        
        if (isCmd && command === 'aioff') {
            if (!hasPerm(sender)) {
                await this.send(from, `❌ ACCESS DENIED! Only admins can use this command.`);
                return;
            }
            setAIEnabled(false);
            await this.send(from, `🤖 AI MODE DEACTIVATED!

❌ Bot will no longer auto-reply to messages.
💡 Use ${GLOBAL_PREFIX}aion to re-enable.`);
            return;
        }

        // ==================== CUSTOM WELCOME/GOODBYE COMMANDS ====================
        if (isCmd && command === 'setwelcome') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            if (!hasPerm(sender)) {
                await this.send(from, `❌ ACCESS DENIED! Only admins can use this command.`);
                return;
            }
            const welcomeText = args.join(' ');
            if (!welcomeText) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}setwelcome <message>

📌 Example: ${GLOBAL_PREFIX}setwelcome 🎉 Welcome to our family, @user!

🎊 Sets custom welcome message for new members. Use @user as placeholder.`);
                return;
            }
            setWelcomeMessage(from, welcomeText);
            await this.send(from, `✅ WELCOME MESSAGE SET!

🎊 New welcome message for this group:
${welcomeText}

💡 Use @user to mention the new member.`);
            return;
        }
        
        if (isCmd && command === 'setgoodbye') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            if (!hasPerm(sender)) {
                await this.send(from, `❌ ACCESS DENIED! Only admins can use this command.`);
                return;
            }
            const goodbyeText = args.join(' ');
            if (!goodbyeText) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}setgoodbye <message>

📌 Example: ${GLOBAL_PREFIX}setgoodbye 👋 Goodbye @user, take care!

👋 Sets custom goodbye message when members leave.`);
                return;
            }
            setGoodbyeMessage(from, goodbyeText);
            await this.send(from, `✅ GOODBYE MESSAGE SET!

👋 New goodbye message for this group:
${goodbyeText}`);
            return;
        }

        // ==================== LIVE DATE/TIME COMMAND ====================
        if (isCmd && command === 'livetime') {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.toLocaleString('default', { month: 'long' });
            const date = now.getDate();
            const day = now.toLocaleString('default', { weekday: 'long' });
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hours12 = hours % 12 || 12;
            
            const timeInfo = `╭───【 🕐 LIVE DATE & TIME 】───╮
│
│ 📅 Date: ${day}, ${date} ${month} ${year}
│ 🕐 Time: ${hours12}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')} ${ampm}
│ 📆 Year: ${year}
│ 📆 Month: ${month}
│ 📅 Day: ${day}
│
├───【 BOT INFO 】───
│ 🤖 Bot Name: ${BOT_NAME}
│ 👑 Owner: ${BOT_OWNER_DISPLAY}
│ ⏱️ Bot Uptime: ${Math.floor((Date.now() - this.startTime)/1000/3600)}h ${Math.floor((Date.now() - this.startTime)/1000/60)%60}m
│
╰──────────────────────────╯`;
            await this.send(from, timeInfo);
            return;
        }

        // ==================== INBOX AUTO-REPLY COMMANDS ====================
        if (isCmd && command === 'autoreplyinbox') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            const targetNumber = args[0];
            const replyText = args.slice(1).join(' ');
            
            if (!targetNumber || !replyText) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}autoreplyinbox <number> <text>

📌 Examples:
├── ${GLOBAL_PREFIX}autoreplyinbox 919536764960 Hello brother!
└── ${GLOBAL_PREFIX}autoreplyinbox 919876543210 Welcome to my bot!

💡 Sets custom auto-reply for a specific number (inbox/DM)
💡 Bot will auto-reply when that number sends a message in private chat!`);
                return;
            }
            
            const cleanNumber = targetNumber.replace(/\D/g, '');
            const targetJid = cleanNumber + '@s.whatsapp.net';
            
            if (!autoReplies[targetJid]) autoReplies[targetJid] = {};
            autoReplies[targetJid] = { enabled: true, text: replyText };
            safeWriteJSON(AUTO_REPLY_FILE, autoReplies);
            
            await this.send(from, `✅ INBOX AUTO-REPLY SET!

🎯 Target: +${cleanNumber}
📝 Reply: ${replyText}
💡 Bot will auto-reply when this number sends a private message!
💡 Use ${GLOBAL_PREFIX}autoreplyinboxoff ${targetNumber} to disable`);
            return;
        }

        if (isCmd && command === 'autoreplyinboxoff') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            const targetNumber = args[0];
            if (!targetNumber) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}autoreplyinboxoff <number>

📌 Example: ${GLOBAL_PREFIX}autoreplyinboxoff 919536764960`);
                return;
            }
            
            const cleanNumber = targetNumber.replace(/\D/g, '');
            const targetJid = cleanNumber + '@s.whatsapp.net';
            
            if (autoReplies[targetJid]) {
                delete autoReplies[targetJid];
                safeWriteJSON(AUTO_REPLY_FILE, autoReplies);
                await this.send(from, `🔇 INBOX AUTO-REPLY DISABLED!

✅ Auto-reply turned off for +${cleanNumber}`);
            } else {
                await this.send(from, `❌ No auto-reply set for +${cleanNumber}!`);
            }
            return;
        }

        // ==================== MENU COMMAND ====================
        if (isCmd && command === 'menu') {
            const groupMeta = isGroup ? await this.sock.groupMetadata(from).catch(() => null) : null;
            const memberCount = groupMeta?.participants?.length || 0;
            
            const menuText = `╔══════════════════════════════════════════════════════════════════════════╗
║                        ✨ SAIYAN BOT ✨                                ║
║                   🚀 PREMIUM WHATSAPP BOT V6.0 🚀                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  🏠 【 BASIC COMMANDS 】                                                  ║
║  ├──► ${GLOBAL_PREFIX}menu        - 📖 Show this help menu                     ║
║  ├──► ${GLOBAL_PREFIX}status      - 📊 Show bot status & info                 ║
║  ├──► ${GLOBAL_PREFIX}live <sec>  - ⏱️ Show live time status                 ║
║  ├──► ${GLOBAL_PREFIX}stoplive    - 🛑 Stop live time tracking               ║
║  ├──► ${GLOBAL_PREFIX}wipe        - 🧹 Clear memory cache                    ║
║  ├──► ${GLOBAL_PREFIX}livetime    - 🕐 Show current date/time/year/month     ║
║  ├──► ${GLOBAL_PREFIX}weather <city> - 🌤️ Get weather info                     ║
║  └──► ${GLOBAL_PREFIX}emoji <e> <count> - 😀 Send emoji spam                 ║
║                                                                          ║
║  📋 【 GROUP INFO 】                                                      ║
║  ├──► ${GLOBAL_PREFIX}grupolink    - 🔗 Get group invite link                ║
║  ├──► ${GLOBAL_PREFIX}groupinfo    - 📊 Get full group information         ║
║  ├──► ${GLOBAL_PREFIX}groupid      - 🆔 Get group JID                      ║
║  └──► ${GLOBAL_PREFIX}groupname    - 📛 Get group name                     ║
║                                                                          ║
║  🚀 【 SPAM ATTACKS 】                                                     ║
║  ├──► ${GLOBAL_PREFIX}spam <text>              - 🐌 Slow spam (12-25s)            ║
║  ├──► ${GLOBAL_PREFIX}spamfast [delay] <text>  - ⚡ Fast spam (custom ms)        ║
║  ├──► ${GLOBAL_PREFIX}stopspam                 - ⏹️ Stop slow spam                ║
║  ├──► ${GLOBAL_PREFIX}stopspamfast             - ⏹️ Stop fast spam                ║
║  ├──► ${GLOBAL_PREFIX}name <text>              - 📛 Group name spam               ║
║  ├──► ${GLOBAL_PREFIX}stopname                 - ⏹️ Stop name spam                ║
║  ├──► ${GLOBAL_PREFIX}desc <text>              - 📝 Group desc spam               ║
║  ├──► ${GLOBAL_PREFIX}stopdesc                 - ⏹️ Stop desc spam                ║
║  ├──► ${GLOBAL_PREFIX}target @user             - 🎯 Target specific user          ║
║  ├──► ${GLOBAL_PREFIX}stoptarget               - ⏹️ Stop target attack            ║
║  ├──► ${GLOBAL_PREFIX}dtx <text> [delay]       - ⚙️ DTX text spam                 ║
║  └──► ${GLOBAL_PREFIX}stopall                  - 🛑 STOP ALL ATTACKS              ║
║                                                                          ║
║  📨 【 MESSAGE SPAM 】                                                    ║
║  ├──► ${GLOBAL_PREFIX}sendinbox <num> [name] [delay] - 📨 DM from message.txt    ║
║  ├──► ${GLOBAL_PREFIX}spaminbox <num> <msg> [name] [delay] - 💬 Custom DM spam   ║
║  ├──► ${GLOBAL_PREFIX}stopinbox <num>          - ⏹️ Stop DM spam                 ║
║  ├──► ${GLOBAL_PREFIX}sendgroupmsg <num> [name] [delay] - 👥 Group mention spam  ║
║  ├──► ${GLOBAL_PREFIX}spamgroup <num> <msg> [name] [delay] - 💬 Custom group spam║
║  ├──► ${GLOBAL_PREFIX}stopgroupmsg <num>       - ⏹️ Stop group spam              ║
║  ├──► ${GLOBAL_PREFIX}stopallgroupmsg          - ⏹️ Stop ALL group spam          ║
║  ├──► ${GLOBAL_PREFIX}showmsgs                 - 📄 Show message file            ║
║  ├──► ${GLOBAL_PREFIX}addmsg <text>            - ➕ Add to message file          ║
║  ├──► ${GLOBAL_PREFIX}clearmsgs                - 🗑️ Clear message file           ║
║  ├──► ${GLOBAL_PREFIX}settarget <num> [name]   - 🎯 Set default target           ║
║  └──► ${GLOBAL_PREFIX}showtarget               - 👁️ Show default target          ║
║                                                                          ║
║  ⌨️ 【 AUTO-TYPING 】 (NEW!)                                              ║
║  ├──► ${GLOBAL_PREFIX}autotyp <num> [name] [delay]  - ⌨️ Type in inbox           ║
║  ├──► ${GLOBAL_PREFIX}autotypgroup <num> [name] [delay] - ⌨️ Type in group       ║
║  ├──► ${GLOBAL_PREFIX}stopautotyp <num>              - 🛑 Stop inbox typing      ║
║  └──► ${GLOBAL_PREFIX}stopautotypgroup <num>         - 🛑 Stop group typing      ║
║                                                                          ║
║  🤖 【 AI & FUNNY REPLIES 】                                              ║
║  ├──► ${GLOBAL_PREFIX}aion                - 🤖 Enable AI replies                 ║
║  ├──► ${GLOBAL_PREFIX}aioff               - ❌ Disable AI replies                ║
║  ├──► ${GLOBAL_PREFIX}setbotname <name>   - 🏷️ Set bot name                     ║
║  ├──► ${GLOBAL_PREFIX}setwelcome <msg>    - 🎊 Set custom welcome message       ║
║  └──► ${GLOBAL_PREFIX}setgoodbye <msg>    - 👋 Set custom goodbye message       ║
║                                                                          ║
║  🤖 【 AUTO REPLY 】                                                      ║
║  ├──► ${GLOBAL_PREFIX}autoreply <text>    - 📝 Set auto-reply for this group   ║
║  ├──► ${GLOBAL_PREFIX}autoreplyoff       - 🔇 Turn off group auto-reply        ║
║  ├──► ${GLOBAL_PREFIX}autoreplyall <text> - 🌍 Set global auto-reply           ║
║  ├──► ${GLOBAL_PREFIX}autoreplyalloff    - 🔇 Turn off global auto-reply       ║
║  ├──► ${GLOBAL_PREFIX}autoreplyinbox <num> <text> - 📨 Set inbox auto-reply    ║
║  └──► ${GLOBAL_PREFIX}autoreplyinboxoff <num> - 🔇 Turn off inbox auto-reply   ║
║                                                                          ║
║  👑 【 ADMIN MANAGEMENT 】                                                ║
║  ├──► ${GLOBAL_PREFIX}addadmin <num>     - 👑 Add admin by number              ║
║  ├──► ${GLOBAL_PREFIX}removeadmin <num>  - 🗑️ Remove admin by number           ║
║  ├──► ${GLOBAL_PREFIX}addsubadmin <num>  - 🛡️ Add sub-admin by number          ║
║  ├──► ${GLOBAL_PREFIX}removesubadmin <num> - 🗑️ Remove sub-admin by number     ║
║  ├──► ${GLOBAL_PREFIX}sub               - 🔰 Add sub-admin (reply)            ║
║  └──► ${GLOBAL_PREFIX}rmsub             - 🗑️ Remove sub-admin (reply)         ║
║                                                                          ║
║  🤖 【 BOT MANAGEMENT 】                                                  ║
║  ├──► ${GLOBAL_PREFIX}addbot <num>   - 🤖 Add new bot node                  ║
║  ├──► ${GLOBAL_PREFIX}pre <prefix>   - 🔧 Change command prefix            ║
║  ├──► ${GLOBAL_PREFIX}sup <bot_id>   - 🔇 Suppress bot                     ║
║  ├──► ${GLOBAL_PREFIX}uplift <bot_id> - 🔊 Unsuppress bot                  ║
║  ├──► ${GLOBAL_PREFIX}auto <emoji>   - 🎨 Set auto-react emoji             ║
║  └──► ${GLOBAL_PREFIX}rmadmin        - 💀 Remove admin (reply/tag)          ║
║                                                                          ║
║  🛡️ 【 GROUP MANAGEMENT 】                                                ║
║  ├──► ${GLOBAL_PREFIX}tagall [txt]    - 📢 Tag all with optional text        ║
║  ├──► ${GLOBAL_PREFIX}kickall       - 🧹 Kick all non-admin members         ║
║  ├──► ${GLOBAL_PREFIX}lockname <name>  - 🔒 Lock group name                 ║
║  ├──► ${GLOBAL_PREFIX}unlockname       - 🔓 Unlock group name               ║
║  ├──► ${GLOBAL_PREFIX}unlockgroup      - 🔓 Unlock group (same as unlockname)║
║  ├──► ${GLOBAL_PREFIX}autoAdd on/off   - 🤖 Auto add removed members        ║
║  ├──► ${GLOBAL_PREFIX}leave            - 👋 Bot leave group                 ║
║  ├──► ${GLOBAL_PREFIX}dele             - 🗑️ Delete quoted message           ║
║  ├──► ${GLOBAL_PREFIX}deleall          - 🗑️ Delete all bot messages         ║
║  └──► ${GLOBAL_PREFIX}pin              - 📌 Delete target message           ║
║                                                                          ║
║  🎨 【 MEDIA SPAM 】                                                      ║
║  ├──► ${GLOBAL_PREFIX}pcspm     - 🖼️ Spam replied image                     ║
║  ├──► ${GLOBAL_PREFIX}stspm     - 🎭 Spam replied sticker                   ║
║  └──► ${GLOBAL_PREFIX}stopmedia  - ⏹️ Stop all media spam                   ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║  📊 GROUP INFO: ${memberCount} Members | 🤖 Owner: ${BOT_OWNER_DISPLAY}      ║
║  🛡️ Anti-Delete: ACTIVE | 🤖 AI: ${isAIEnabled() ? 'ACTIVE' : 'OFF'}      ║
╚══════════════════════════════════════════════════════════════════════════╝`;
            await this.send(from, menuText);
            return;
        }

        // ==================== STATUS COMMAND ====================
        if (isCmd && command === 'status') {
            const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const upt = process.uptime();
            const hrs = Math.floor(upt/3600), mins = Math.floor((upt%3600)/60);
            let botUptime = '0h 0m';
            for (let b of this.manager.bots.values()) {
                if (b.connected) {
                    const bu = Math.floor((Date.now() - b.startTime)/1000);
                    botUptime = `${Math.floor(bu/3600)}h ${Math.floor((bu%3600)/60)}m`;
                    break;
                }
            }
            let list = '';
            for (let b of this.manager.bots.values()) {
                list += `├── ${b.connected?'🟢 ONLINE':'🔴 OFFLINE'} ${b.displayId} ${b.isSuppressed?'🔇 SUPPRESSED':''}\n`;
            }
            
            let groupInfo = '';
            if (isGroup) {
                const groupMeta = await this.sock.groupMetadata(from).catch(() => null);
                const memberCount = groupMeta?.participants?.length || 0;
                const isLocked = nameLocks[from] ? `🔒 LOCKED: ${nameLocks[from]}` : '🔓 UNLOCKED';
                groupInfo = `\n📊 GROUP INFO\n├── Group: ${groupMeta?.subject || from}\n├── Members: ${memberCount}\n├── Name Lock: ${isLocked}\n└── Admin Access: ${hasPerm(sender) ? '✅ FULL' : '❌ NONE'}\n`;
            }
            
            const statusText = `╔════════════════════════════════════════════════════════════════╗
║                    ✨ BOT STATUS DASHBOARD ✨                    ║
╠════════════════════════════════════════════════════════════════╣
║  🤖 BOT NODES                                                   ║
${list}
╠════════════════════════════════════════════════════════════════╣
║  💻 SYSTEM INFO                                                 ║
║  ├── RAM Usage: ${ram}MB                                                    ║
║  ├── Server Uptime: ${hrs}h ${mins}m                                            ║
║  └── Bot Uptime: ${botUptime}                                                ║
╠════════════════════════════════════════════════════════════════╣
║  👑 OWNER & ADMINS                                               ║
║  ├── Owner: 🔒 Hidden                                              ║
║  ├── Owner Name: ${BOT_OWNER_DISPLAY}                                        ║
║  └── Allowed Admins: 🔒 Hidden                                 ║
╠════════════════════════════════════════════════════════════════╣
║  🧠 FEATURES STATUS                                              ║
║  ├── AI Status: ${isAIEnabled() ? (GEMINI_API_KEY !== "AQ.Ab8RN6KcGoskaFiqedPr4UgJ4_gzxlApnXCN0fhK3nx8jLMcEg" ? '✅ ACTIVE' : '🎭 FUNNY MODE') : '❌ DISABLED'}   ║
║  ├── Anti-Delete: ✅ ACTIVE                                      ║
║  ├── Auto-Reply Group: ${autoReplies[from]?.enabled ? '✅ ACTIVE' : '❌ OFF'}        ║
║  └── Auto-Reply Global: ${autoReplyAllMsgs.enabled ? '✅ ACTIVE' : '❌ OFF'}         ║${groupInfo}
╚════════════════════════════════════════════════════════════════╝`;
            await this.send(from, statusText);
            return;
        }

        // ==================== LIVE COMMAND ====================
        if (isCmd && command === 'live') {
            const duration = parseInt(args[0]);
            if (!duration || isNaN(duration)) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}live <seconds>

📌 Example: ${GLOBAL_PREFIX}live 3600 (1 hour)

⏱️ Shows live time status every minute!`);
                return;
            }
            await this.startLiveTime(from, duration);
            await this.send(from, `⏱️ LIVE TIME TRACKING STARTED!

🤖 Bot: ${this.displayId}
⏰ Duration: ${Math.floor(duration/3600)}h ${Math.floor((duration%3600)/60)}m ${duration%60}s

✅ Status updates every minute!
💡 Use ${GLOBAL_PREFIX}stoplive to stop tracking`);
            return;
        }

        if (isCmd && command === 'stoplive') {
            await this.stopLiveTime();
            await this.send(from, `⏱️ LIVE TIME TRACKING STOPPED!

✅ No more live time updates!
> Made by ${BOT_OWNER_DISPLAY}`);
            return;
        }

        // ==================== EMOJI COMMAND ====================
        if (isCmd && command === 'emoji') {
            const emoji = args[0];
            const count = parseInt(args[1]) || 5;
            if (!emoji) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}emoji <emoji> [count]

📌 Examples:
├── ${GLOBAL_PREFIX}emoji 😂
├── ${GLOBAL_PREFIX}emoji 🔥 10
└── ${GLOBAL_PREFIX}emoji ❤️ 20

💡 Sends emoji spam in chat!`);
                return;
            }
            await this.sendEmoji(from, emoji, Math.min(count, 50));
            await this.send(from, `😀 EMOJI SPAM SENT!

📤 Emoji: ${emoji}
🔢 Count: ${Math.min(count, 50)}
✅ Done!`);
            return;
        }

        // ==================== GROUP INFO COMMANDS ====================
        if (isCmd && command === 'grupolink') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            const groupInfo = await this.getGroupInfo(from);
            if (groupInfo) {
                const linkMsg = `╭───【 🔗 GROUP INVITE LINK 】───╮
│
│ 📛 Group: ${groupInfo.name}
│ 🔗 Link: ${groupInfo.inviteLink}
│ 👑 Owner: ${extractNumber(groupInfo.owner)}
│
╰──────────────────────────╯`;
                await this.send(from, linkMsg);
            } else {
                await this.send(from, `❌ Failed to get group invite link! Make sure bot is admin.`);
            }
            return;
        }

        if (isCmd && command === 'groupinfo') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            const groupInfo = await this.getGroupInfo(from);
            if (groupInfo) {
                const infoMsg = `╭───【 📊 GROUP INFORMATION 】───╮
│
│ 📛 Name: ${groupInfo.name}
│ 🆔 ID: ${groupInfo.id}
│ 📝 Description: ${groupInfo.description || 'No description'}
│ 👑 Owner: @${extractNumber(groupInfo.owner)}
│ 👥 Members: ${groupInfo.memberCount}
│ 🔗 Invite Link: ${groupInfo.inviteLink}
│
╰──────────────────────────╯`;
                await this.send(from, infoMsg, [groupInfo.owner]);
            } else {
                await this.send(from, `❌ Failed to get group info!`);
            }
            return;
        }

        if (isCmd && command === 'groupid') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            await this.send(from, `╭───【 🆔 GROUP ID 】───╮
│
│ 📛 ${from}
│
╰──────────────────────────╯`);
            return;
        }

        if (isCmd && command === 'groupname') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            const groupInfo = await this.getGroupInfo(from);
            if (groupInfo) {
                await this.send(from, `╭───【 📛 GROUP NAME 】───╮
│
│ ${groupInfo.name}
│
╰──────────────────────────╯`);
            } else {
                await this.send(from, `❌ Failed to get group name!`);
            }
            return;
        }

        // ==================== AUTO REPLY COMMANDS ====================
        if (isCmd && command === 'autoreply') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            const replyText = args.join(' ');
            if (!replyText) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}autoreply <text>

📌 Examples:
├── ${GLOBAL_PREFIX}autoreply Hello, welcome to the group!
├── ${GLOBAL_PREFIX}autoreply Thanks for the message!
└── ${GLOBAL_PREFIX}autoreplyoff to disable

💡 Sets auto-reply for this group only!`);
                return;
            }
            autoReplies[from] = { enabled: true, text: replyText };
            safeWriteJSON(AUTO_REPLY_FILE, autoReplies);
            await this.send(from, `✅ AUTO-REPLY SET FOR THIS GROUP!

📝 Reply: ${replyText}
💡 Bot will auto-reply to all messages in this group!
💡 Use ${GLOBAL_PREFIX}autoreplyoff to disable`);
            return;
        }

        if (isCmd && command === 'autoreplyoff') {
            if (!isGroup) {
                await this.send(from, `❌ This command only works in groups!`);
                return;
            }
            if (autoReplies[from]) {
                delete autoReplies[from];
                safeWriteJSON(AUTO_REPLY_FILE, autoReplies);
                await this.send(from, `🔇 AUTO-REPLY DISABLED FOR THIS GROUP!

✅ Bot will no longer auto-reply in this group.`);
            } else {
                await this.send(from, `❌ No auto-reply is set for this group!`);
            }
            return;
        }

        if (isCmd && command === 'autoreplyall') {
            const replyText = args.join(' ');
            if (!replyText) {
                await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}autoreplyall <text>

📌 Examples:
├── ${GLOBAL_PREFIX}autoreplyall Hello everyone!
├── ${GLOBAL_PREFIX}autoreplyall Welcome to my bot!
└── ${GLOBAL_PREFIX}autoreplyalloff to disable

💡 Sets global auto-reply for ALL groups!`);
                return;
            }
            autoReplyAllMsgs = { enabled: true, text: replyText };
            safeWriteJSON(AUTO_REPLY_ALL_FILE, autoReplyAllMsgs);
            await this.send(from, `🌍 GLOBAL AUTO-REPLY SET!

📝 Reply: ${replyText}
💡 Bot will auto-reply to all messages in ALL groups!
💡 Use ${GLOBAL_PREFIX}autoreplyalloff to disable`);
            return;
        }

        if (isCmd && command === 'autoreplyalloff') {
            autoReplyAllMsgs = { enabled: false, text: null };
            safeWriteJSON(AUTO_REPLY_ALL_FILE, autoReplyAllMsgs);
            await this.send(from, `🔇 GLOBAL AUTO-REPLY DISABLED!

✅ Bot will no longer auto-reply globally.`);
            return;
        }

        // ==================== ADMIN PERMISSION CHECK FOR REMAINING COMMANDS ====================
        if (isCmd && !hasPerm(sender)) {
            if (command !== 'menu' && command !== 'status' && command !== 'livetime' && command !== 'weather' && command !== 'autotyp' && command !== 'autotypgroup' && command !== 'stopautotyp' && command !== 'stopautotypgroup' && command !== 'live' && command !== 'stoplive' && command !== 'grupolink' && command !== 'groupinfo' && command !== 'groupid' && command !== 'groupname') {
                await this.send(from, `❌ ACCESS DENIED!

Only authorized admins can use this command.

🔒 Admin list is hidden.

📱 Your Number: +${extractNumber(sender)}

> Contact Owner: ${BOT_OWNER_DISPLAY}`);
            }
            return;
        }

        if (!this.isSuppressed && isCmd && hasPerm(sender)) {
            await this.executeInternal(from, command, sender, msg, args, quotedMsg, isMain);
        }
    }

    async executeInternal(from, command, sender, msg, args, quotedMsg, isMain) {
        const replyJid = quotedMsg?.participant ? normalizeJid(quotedMsg.participant) : null;
        const mentioned = quotedMsg?.mentionedJid || [];
        const isGroup = from.endsWith('@g.us');

        switch(command) {
            case 'stopall':
                this.activeName.clear();
                this.activeSpam.clear();
                this.activeSpamFast.clear();
                this.activeTarget.clear();
                this.activeSlide.clear();
                this.activeTagall.clear();
                this.activeAutoReply.clear();
                this.activeTargetReply.clear();
                this.activePcspm.clear();
                this.activeStspm.clear();
                this.activeReplyAll.clear();
                this.activeDesc.clear();
                this.activeTxt.clear();
                this.activeFileSpam.clear();
                this.activeInboxSpam.clear();
                this.activeSpamInbox.clear();
                this.activeSpamGroup.clear();
                for (let k of this.activePfp.keys()) if (k.startsWith('pfp_')) this.activePfp.delete(k);
                HSEE.clearAll();
                await this.send(from, `🛑 ALL ATTACKS STOPPED

✅ All spam and attacks have been terminated!

Status:
├── Name Spam: STOPPED
├── Desc Spam: STOPPED
├── Custom Spam: STOPPED
├── Fast Spam: STOPPED
├── Target Attack: STOPPED
├── DM Spam: STOPPED
├── Group Spam: STOPPED
├── Custom DM Spam: STOPPED
├── Custom Group Spam: STOPPED
├── Media Spam: STOPPED
└── TagAll: STOPPED

> Ready for new commands!`);
                break;

            case 'stopspamfast':
                this.activeSpamFast.delete(`${from}_spamfast`);
                await this.send(from, "⏹️ FAST SPAM STOPPED\n\n✅ Fast spam attack has been terminated.");
                break;

            case 'stopname':
                this.activeName.delete(from);
                await this.send(from, "⏹️ NAME SPAM STOPPED\n\n✅ Group name spam has been stopped.");
                break;

            case 'stopspam':
                this.activeSpam.delete(from);
                await this.send(from, "⏹️ CUSTOM SPAM STOPPED\n\n✅ Custom text spam has been stopped.");
                break;

            case 'stoptarget':
                this.activeTarget.delete(`${from}_target`);
                await this.send(from, "⏹️ TARGET ATTACK STOPPED\n\n✅ Target attack has been stopped.");
                break;

            case 'stopdesc':
                this.activeDesc.delete(from);
                await this.send(from, "⏹️ DESC SPAM STOPPED\n\n✅ Group description spam has been stopped.");
                break;

            case 'stopreplyall':
                this.activeReplyAll.delete(from);
                await this.send(from, "⏹️ REPLYALL STOPPED\n\n✅ ReplyAll attack has been stopped.");
                break;

            case 'stopmedia':
                this.activePcspm.clear();
                this.activeStspm.clear();
                await this.send(from, "⏹️ MEDIA SPAM STOPPED\n\n✅ All media spam (image/sticker) has been stopped.");
                break;

            case 'stopinbox':
                let targetNumInbox = args[0];
                if (!targetNumInbox) {
                    const targetFile = loadTargetFromFile();
                    if (targetFile) targetNumInbox = extractNumber(targetFile);
                }
                if (targetNumInbox) {
                    await this.stopInboxFileSpam(targetNumInbox);
                    await this.stopCustomSpamInbox(targetNumInbox);
                    await this.send(from, `⏹️ INBOX SPAM STOPPED

✅ All DM spam stopped for: +${targetNumInbox}`);
                } else {
                    await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}stopinbox <number>

📌 Example: ${GLOBAL_PREFIX}stopinbox 919536764960`);
                }
                break;

            case 'stopgroupmsg':
                if (!isGroup) return this.send(from, `❌ This command only works in groups!`);
                let targetNumGroup = args[0];
                if (!targetNumGroup && replyJid) targetNumGroup = extractNumber(replyJid);
                if (targetNumGroup) {
                    await this.stopGroupFileSpam(from, targetNumGroup);
                    await this.stopCustomSpamGroup(from, targetNumGroup);
                    await this.send(from, `⏹️ GROUP MSG SPAM STOPPED

✅ All group message spam stopped for target: +${targetNumGroup}
💡 Use ${GLOBAL_PREFIX}stopallgroupmsg to stop ALL group spam`);
                } else {
                    await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}stopgroupmsg <target_number>

📌 Examples:
├── ${GLOBAL_PREFIX}stopgroupmsg 919536764960
└── Reply to target message then use command`);
                }
                break;

            case 'stopallgroupmsg':
                if (!isGroup) return this.send(from, `❌ This command only works in groups!`);
                const stoppedCount = await this.stopAllGroupSpam(from);
                await this.send(from, `⏹️ ALL GROUP SPAM STOPPED

✅ Stopped ${stoppedCount} spam session(s) in this group!
💡 This group is now clean from all message spam`);
                break;

            case 'autoAdd':
                if (!isGroup) return this.send(from, `❌ This command only works in groups!`);
                const setting = args[0]?.toLowerCase();
                if (setting !== 'on' && setting !== 'off') {
                    await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}autoAdd on/off

📌 Examples:
├── ${GLOBAL_PREFIX}autoAdd on  - Enable auto-add
└── ${GLOBAL_PREFIX}autoAdd off - Disable auto-add

💡 When enabled, bot will automatically re-add removed members!`);
                    return;
                }
                if (!autoAddGroups[from]) autoAddGroups[from] = { enabled: false };
                autoAddGroups[from].enabled = (setting === 'on');
                safeWriteJSON(AUTO_ADD_FILE, autoAddGroups);
                await this.send(from, `${setting === 'on' ? '✅' : '❌'} AUTO-ADD ${setting === 'on' ? 'ENABLED' : 'DISABLED'}

🤖 Bot will ${setting === 'on' ? 'automatically add removed members' : 'not auto-add members'}
💡 Status: ${setting === 'on' ? 'ACTIVE' : 'INACTIVE'}`);
                break;

            case 'lockname':
                if (!isGroup) return this.send(from, `❌ Only groups can be name locked!`);
                const newLockedName = args.join(' ');
                if (!newLockedName) return this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}lockname <group name>`);
                nameLocks[from] = newLockedName;
                saveNameLocks();
                try {
                    await this.sock.groupUpdateSubject(from, newLockedName);
                    await this.send(from, `🔒 GROUP NAME LOCKED

✅ Group name locked to: ${newLockedName}
🔐 Nobody can change the group name now!`);
                } catch(e) {
                    await this.send(from, `⚠️ LOCK SET BUT NEED ADMIN

✅ Lock set but failed to change name. Bot needs admin rights.`);
                }
                break;

            case 'unlockname':
            case 'unlockgroup':
                if (!isGroup) return this.send(from, `❌ Only groups!`);
                if (nameLocks[from]) {
                    delete nameLocks[from];
                    saveNameLocks();
                    await this.send(from, `🔓 GROUP UNLOCKED!

✅ Name lock removed. Anyone can change group name now!`);
                } else {
                    await this.send(from, `❌ No active lock on this group!`);
                }
                break;

            case 'sendinbox':
                let targetNumber = args[0];
                let customName = null;
                let interval = 10000;
                
                if (targetNumber) {
                    let idx = 1;
                    if (args[1] && isNaN(parseInt(args[1]))) {
                        customName = args.slice(1).join(' ');
                        idx = args.length;
                    }
                    if (args[idx] && !isNaN(parseInt(args[idx]))) {
                        interval = parseInt(args[idx]);
                    }
                }
                
                if (!targetNumber) {
                    const targetFile = loadTargetFromFile();
                    if (targetFile) targetNumber = extractNumber(targetFile);
                    if (!targetNumber) {
                        await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}sendinbox <phone_number> [name] [delay_ms]

📌 Examples:
├── ${GLOBAL_PREFIX}sendinbox 919536764960
├── ${GLOBAL_PREFIX}sendinbox 919536764960 "Raj Sharma"
├── ${GLOBAL_PREFIX}sendinbox 919536764960 "Raj Kumar Sharma" 5000
└── ${GLOBAL_PREFIX}sendinbox (uses target.txt)

💡 Save number in target.txt file for default target!
💡 Name can be multiple words and any length!`);
                        return;
                    }
                }
                
                const success = await this.startInboxFileSpam(targetNumber, interval, customName);
                if (success) {
                    const msgCount = loadMessagesFromFile().length;
                    const displayTarget = customName ? `${customName} (${targetNumber})` : targetNumber;
                    await this.send(from, `📨 INBOX SPAM STARTED

🎯 Target: ${displayTarget}
⏱️ Interval: ${interval}ms
📄 Messages: ${msgCount} lines

✅ Bot will now send messages from message.txt to the target!
⚠️ Use ${GLOBAL_PREFIX}stopinbox ${targetNumber} to stop.`);
                } else {
                    await this.send(from, `❌ FAILED TO START

Possible reasons:
├── Already running for this target
├── No messages in message.txt
└── Bot not connected

💡 Use ${GLOBAL_PREFIX}showmsgs to check messages`);
                }
                break;

            case 'spaminbox':
                let spamInboxTarget = args[0];
                let spamInboxMessage = "";
                let spamInboxName = null;
                let spamInboxInterval = 10000;
                
                if (!spamInboxTarget) {
                    await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}spaminbox <number> <message> [name] [delay]

📌 Examples:
├── ${GLOBAL_PREFIX}spaminbox 919536764960 "Hello how are you?"
├── ${GLOBAL_PREFIX}spaminbox 919536764960 "Hello" "Raj Kumar Sharma" 5000
└── ${GLOBAL_PREFIX}spaminbox 919536764960 "Hi there" 3000

💡 Name can be multiple words and any length!`);
                    return;
                }
                
                let msgParts = [];
                let i = 1;
                let foundDelay = false;
                
                while (i < args.length) {
                    if (!foundDelay && args[i] && !isNaN(parseInt(args[i])) && parseInt(args[i]) > 0) {
                        spamInboxInterval = parseInt(args[i]);
                        foundDelay = true;
                        i++;
                        continue;
                    }
                    if (!foundDelay && spamInboxName === null && args[i] && args[i].match(/[a-zA-Z]/) && i === args.length - 1 && !spamInboxMessage) {
                        spamInboxName = args[i];
                        i++;
                        continue;
                    }
                    msgParts.push(args[i]);
                    i++;
                }
                
                spamInboxMessage = msgParts.join(' ');
                if (!spamInboxMessage) {
                    await this.send(from, `❌ Please provide a message to spam!
                    
Example: ${GLOBAL_PREFIX}spaminbox 919536764960 "Hello world"`);
                    return;
                }
                
                const successInbox = await this.startCustomSpamInbox(spamInboxTarget, spamInboxMessage, spamInboxInterval, spamInboxName);
                if (successInbox) {
                    const displayTarget = spamInboxName ? `${spamInboxName} (${spamInboxTarget})` : spamInboxTarget;
                    await this.send(from, `💬 CUSTOM INBOX SPAM STARTED!

🎯 Target: ${displayTarget}
📝 Message: ${spamInboxMessage.substring(0, 100)}${spamInboxMessage.length > 100 ? '...' : ''}
⏱️ Interval: ${spamInboxInterval}ms

✅ Bot will now send your custom message!
⚠️ Use ${GLOBAL_PREFIX}stopinbox ${spamInboxTarget} to stop.`);
                } else {
                    await this.send(from, `❌ Failed to start! Already running for this target.`);
                }
                break;

            case 'sendgroupmsg':
                if (!isGroup) return this.send(from, `❌ This command only works in groups!`);
                let targetNumberGroup = args[0];
                let groupName = null;
                let groupInterval = 10000;
                
                if (targetNumberGroup) {
                    let idx = 1;
                    if (args[1] && isNaN(parseInt(args[1]))) {
                        groupName = args.slice(1).join(' ');
                        idx = args.length;
                    }
                    if (args[idx] && !isNaN(parseInt(args[idx]))) {
                        groupInterval = parseInt(args[idx]);
                    }
                }
                
                if (!targetNumberGroup && replyJid) targetNumberGroup = extractNumber(replyJid);
                if (!targetNumberGroup) {
                    await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}sendgroupmsg <target_number> [name] [interval_ms]

📌 Examples:
├── ${GLOBAL_PREFIX}sendgroupmsg 919536764960
├── ${GLOBAL_PREFIX}sendgroupmsg 919536764960 "Raj Sharma"
├── ${GLOBAL_PREFIX}sendgroupmsg 919536764960 "Raj Kumar Sharma" 5000
└── Reply to user's message and use ${GLOBAL_PREFIX}sendgroupmsg

💡 Name can be multiple words and any length!`);
                    return;
                }
                
                const successGroup = await this.startGroupFileSpam(from, targetNumberGroup, groupInterval, groupName);
                if (successGroup) {
                    const msgCount = loadMessagesFromFile().length;
                    const displayTarget = groupName ? `${groupName} (${targetNumberGroup})` : targetNumberGroup;
                    await this.send(from, `📨 GROUP MSG SPAM STARTED

🎯 Targeting: ${displayTarget}
⏱️ Interval: ${groupInterval}ms
📄 Messages: ${msgCount} lines

✅ Bot will now send messages with mentions!
⚠️ Use ${GLOBAL_PREFIX}stopgroupmsg ${targetNumberGroup} to stop.`, [targetNumberGroup + '@s.whatsapp.net']);
                } else {
                    await this.send(from, `❌ FAILED TO START

Possible reasons:
├── Already running for this target
├── No messages in message.txt
└── Bot not connected`);
                }
                break;

            case 'spamgroup':
                if (!isGroup) return this.send(from, `❌ This command only works in groups!`);
                let spamGroupTarget = args[0];
                let spamGroupMessage = "";
                let spamGroupName = null;
                let spamGroupInterval = 10000;
                
                if (!spamGroupTarget) {
                    await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}spamgroup <number> <message> [name] [delay]

📌 Examples:
├── ${GLOBAL_PREFIX}spamgroup 919536764960 "Hello how are you?"
├── ${GLOBAL_PREFIX}spamgroup 919536764960 "Hello" "Raj Kumar Sharma" 5000
└── ${GLOBAL_PREFIX}spamgroup 919536764960 "Hi there" 3000

💡 Name can be multiple words and any length!`);
                    return;
                }
                
                let msgPartsGroup = [];
                let gi = 1;
                let foundDelayGroup = false;
                
                while (gi < args.length) {
                    if (!foundDelayGroup && args[gi] && !isNaN(parseInt(args[gi])) && parseInt(args[gi]) > 0) {
                        spamGroupInterval = parseInt(args[gi]);
                        foundDelayGroup = true;
                        gi++;
                        continue;
                    }
                    if (!foundDelayGroup && spamGroupName === null && args[gi] && args[gi].match(/[a-zA-Z]/) && gi === args.length - 1 && !spamGroupMessage) {
                        spamGroupName = args[gi];
                        gi++;
                        continue;
                    }
                    msgPartsGroup.push(args[gi]);
                    gi++;
                }
                
                spamGroupMessage = msgPartsGroup.join(' ');
                if (!spamGroupMessage) {
                    await this.send(from, `❌ Please provide a message to spam!
                    
Example: ${GLOBAL_PREFIX}spamgroup 919536764960 "Hello world"`);
                    return;
                }
                
                const successSpamGroup = await this.startCustomSpamGroup(from, spamGroupTarget, spamGroupMessage, spamGroupInterval, spamGroupName);
                if (successSpamGroup) {
                    const displayTarget = spamGroupName ? `${spamGroupName} (${spamGroupTarget})` : spamGroupTarget;
                    await this.send(from, `💬 CUSTOM GROUP SPAM STARTED!

🎯 Targeting: ${displayTarget}
📝 Message: ${spamGroupMessage.substring(0, 100)}${spamGroupMessage.length > 100 ? '...' : ''}
⏱️ Interval: ${spamGroupInterval}ms

✅ Bot will now send your custom message with mention!
⚠️ Use ${GLOBAL_PREFIX}stopgroupmsg ${spamGroupTarget} to stop.`, [spamGroupTarget + '@s.whatsapp.net']);
                } else {
                    await this.send(from, `❌ Failed to start! Already running for this target.`);
                }
                break;

            case 'showmsgs':
                const messages = loadMessagesFromFile();
                let msgList = messages.map((m, i) => `${i+1}. ${m.substring(0, 60)}${m.length > 60 ? '...' : ''}`).join('\n');
                await this.send(from, `📄 MESSAGE FILE (message.txt)

📊 Total Messages: ${messages.length}

📝 Messages List:
${msgList.substring(0, 1500)}

💡 Commands:
├── ${GLOBAL_PREFIX}addmsg <text> - Add new message
├── ${GLOBAL_PREFIX}clearmsgs - Clear all messages
├── ${GLOBAL_PREFIX}sendinbox <number> - Send these messages
└── ${GLOBAL_PREFIX}spaminbox <number> <msg> - Send custom message

> Bot Owner: ${BOT_OWNER_DISPLAY}`);
                break;

            case 'addmsg':
                const newMsg = args.join(' ');
                if (!newMsg) {
                    await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}addmsg <your message here>

📌 Examples:
├── ${GLOBAL_PREFIX}addmsg Hello, how are you?
├── ${GLOBAL_PREFIX}addmsg Welcome to my group!
└── ${GLOBAL_PREFIX}addmsg This is a test message`);
                    return;
                }
                fs.appendFileSync(MESSAGE_FILE, '\n' + newMsg);
                await this.send(from, `✅ MESSAGE ADDED!

📝 Added: ${newMsg.substring(0, 100)}${newMsg.length > 100 ? '...' : ''}
📊 Total messages: ${loadMessagesFromFile().length}

💡 Use ${GLOBAL_PREFIX}showmsgs to view all messages`);
                break;

            case 'clearmsgs':
                fs.writeFileSync(MESSAGE_FILE, "");
                await this.send(from, `🗑️ ALL MESSAGES CLEARED!

✅ Message file (message.txt) has been cleared!
⚠️ Add new messages using ${GLOBAL_PREFIX}addmsg <text>`);
                break;

            case 'settarget':
                const targetNumSet = args[0];
                let targetSetName = null;
                if (args[1]) {
                    targetSetName = args.slice(1).join(' ');
                }
                if (!targetNumSet) {
                    await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}settarget <phone_number> [name]

📌 Examples:
├── ${GLOBAL_PREFIX}settarget 919536764960
├── ${GLOBAL_PREFIX}settarget 919536764960 "Raj Sharma"
└── ${GLOBAL_PREFIX}settarget 919876543210

💡 This saves default target for ${GLOBAL_PREFIX}sendinbox command!
💡 Name can be multiple words and any length!`);
                    return;
                }
                const targetData = targetSetName ? `${targetNumSet}|${targetSetName}` : targetNumSet;
                fs.writeFileSync(TARGET_FILE, targetData);
                const displaySetTarget = targetSetName ? `${targetSetName} (${targetNumSet})` : targetNumSet;
                await this.send(from, `✅ DEFAULT TARGET SET!

🎯 Target: ${displaySetTarget}
💡 Use ${GLOBAL_PREFIX}sendinbox without number to use this target
💡 Use ${GLOBAL_PREFIX}showtarget to view current target`);
                break;

            case 'showtarget':
                const targetShowRaw = fs.existsSync(TARGET_FILE) ? fs.readFileSync(TARGET_FILE, 'utf8').trim() : null;
                let targetShowNum = null;
                let targetShowName = null;
                if (targetShowRaw && targetShowRaw.includes('|')) {
                    const parts = targetShowRaw.split('|');
                    targetShowNum = parts[0];
                    targetShowName = parts[1];
                } else if (targetShowRaw) {
                    targetShowNum = targetShowRaw;
                }
                if (targetShowNum) {
                    const displayTargetShow = targetShowName ? `${targetShowName} (${targetShowNum})` : targetShowNum;
                    await this.send(from, `🎯 DEFAULT TARGET

📱 ${displayTargetShow}
💡 Use ${GLOBAL_PREFIX}sendinbox to spam this target
💡 Use ${GLOBAL_PREFIX}settarget <number> to change`);
                } else {
                    await this.send(from, `❌ NO DEFAULT TARGET SET

💡 Use ${GLOBAL_PREFIX}settarget <number> to set a default target
💡 Or use ${GLOBAL_PREFIX}sendinbox <number> directly`);
                }
                break;

            case 'addbot':
                if (!isMain) return;
                let phone = args[0]?.replace(/\D/g,'');
                if(!phone) return this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}addbot <phone_number>

📌 Example: ${GLOBAL_PREFIX}addbot 919536764960

💡 Bot will request pairing code!`);
                this.manager.counter++;
                const newId = `Bot_${this.manager.counter}`;
                await this.send(from, `⚡ INITIALIZING NEW BOT NODE...

🤖 ID: ${newId}
📱 Phone: ${phone}
⏳ Requesting pairing code...`);
                const newBot = new BotSession(newId, phone, this.manager);
                this.manager.bots.set(newId, newBot);
                await newBot.connect();
                this.manager.save();
                await this.send(from, `🛸 NEW BOT ACTIVATED!

🤖 Node ID: ${newId}
📱 Phone: ${phone}
✅ Status: ONLINE

> Total bots: ${this.manager.bots.size}`);
                break;

            case 'pre':
                if(!args[0]) return this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}pre <prefix>

📌 Examples:
├── ${GLOBAL_PREFIX}pre !
├── ${GLOBAL_PREFIX}pre /
├── ${GLOBAL_PREFIX}pre .
└── ${GLOBAL_PREFIX}pre ?

💡 Current prefix: ${GLOBAL_PREFIX}`);
                updatePrefix(args[0]);
                await this.send(from, `✅ COMMAND PREFIX CHANGED!

🔧 New Prefix: ${args[0]}
💡 All commands now start with ${args[0]}

Example: ${args[0]}menu`);
                break;

            case 'wipe':
                if(storeMessages.has(from)) storeMessages.delete(from);
                HSEE.clearAll();
                await this.send(from, `🧹 MEMORY WIPED!

✅ Chat memory cleared
✅ Attack queues cleared
✅ Cache reset

> Bot is fresh and ready!`);
                break;

            case 'rmadmin':
                const toRemove = mentioned.length ? mentioned : (replyJid?[replyJid]:[]);
                for(let j of toRemove) removeAdmin(j);
                await this.send(from, `💀 ADMIN(S) REMOVED!

✅ Admin privileges revoked
👑 Only master admins remain

> Affected: ${toRemove.length} user(s)`);
                break;

            case 'sub':
                if(replyJid) {
                    addSubAdmin(replyJid);
                    await this.send(from, `🔰 SUB-ADMIN ADDED!

✅ User has been granted sub-admin privileges!
🔧 Sub-admins have limited access

> Added: ${extractNumber(replyJid)}`, [replyJid]);
                } else {
                    await this.send(from, `❌ Reply to a user to add as sub-admin!`);
                }
                break;

            case 'rmsub':
                if(replyJid) {
                    removeSubAdmin(replyJid);
                    await this.send(from, `🗑️ SUB-ADMIN REMOVED!

✅ Sub-admin privileges revoked!
👑 Master admins only now

> Removed: ${extractNumber(replyJid)}`);
                } else {
                    await this.send(from, `❌ Reply to a user to remove sub-admin!`);
                }
                break;

            case 'sup':
                const supBot = this.manager.bots.get(`Bot_${args[0]}`);
                if(supBot) {
                    supBot.isSuppressed = true;
                    await this.send(from, `🔇 BOT SUPPRESSED

🤖 Bot: ${supBot.displayId}
🔇 Status: SUPPRESSED

✅ Bot will not respond to commands
💡 Use ${GLOBAL_PREFIX}uplift ${args[0]} to activate`);
                } else {
                    await this.send(from, `❌ Bot not found! Available: Bot_1, Bot_2, etc`);
                }
                break;

            case 'uplift':
                const liftBot = this.manager.bots.get(`Bot_${args[0]}`);
                if(liftBot) {
                    liftBot.isSuppressed = false;
                    await this.send(from, `🔊 BOT ACTIVATED

🤖 Bot: ${liftBot.displayId}
🔊 Status: ACTIVE

✅ Bot is ready to respond!`);
                } else {
                    await this.send(from, `❌ Bot not found! Available: Bot_1, Bot_2, etc`);
                }
                break;

            case 'auto':
                this.autoReactEmoji = args[0] || '🔥';
                await this.send(from, `✅ AUTO-REACT SET

🎨 Emoji: ${this.autoReactEmoji}
💡 Bot will react to all messages with this emoji!`);
                break;

            case 'kickall':
                if(!isGroup) return this.send(from, `❌ This command only works in groups!`);
                const meta = await this.sock.groupMetadata(from);
                const participants = meta.participants.filter(p => p.admin !== 'admin' && p.admin !== 'superadmin').map(p=>p.id);
                for(let i=0; i<participants.length; i+=5) {
                    await this.sock.groupParticipantsUpdate(from, participants.slice(i,i+5), 'remove').catch(()=>{});
                    await delay(2000);
                }
                await this.send(from, `🧹 KICKALL COMPLETE!

✅ Kicked ${participants.length} members!
👑 Only admins remain in group

> Total members removed: ${participants.length}`);
                break;

            case 'tagall':
                if(!isGroup) return this.send(from, `❌ This command only works in groups!`);
                const tagAllText = args.join(' ') || "📢 ATTENTION ALL MEMBERS!";
                const grp = await this.sock.groupMetadata(from);
                const all = grp.participants.map(p=>p.id);
                const tagId = `${from}_tagall`;
                this.activeTagall.set(tagId, true);
                (async()=>{
                    for(let i=0;i<5 && this.activeTagall.has(tagId);i++) {
                        await this.send(from, `${tagAllText}\n\n${all.map(p=>`@${extractNumber(p)}`).join(' ')}\n\n> Tagged by SAIYAN BOT`, all);
                        await delay(3000);
                    }
                    this.activeTagall.delete(tagId);
                })();
                await this.send(from, `🔔 TAGALL STARTED!

👥 Total members: ${all.length}
📝 Message: ${tagAllText}
⚠️ Sending 5 rounds of mentions!`);
                break;

            case 'dele':
                if(quotedMsg?.stanzaId) await this.sock.sendMessage(from, { delete: { remoteJid: from, fromMe: true, id: quotedMsg.stanzaId } }).catch(()=>{});
                break;

            case 'pin':
                if(quotedMsg?.stanzaId) {
                    await delay(2000);
                    await this.sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: quotedMsg.stanzaId, participant: quotedMsg.participant } }).catch(()=>{});
                }
                break;

            case 'deleall':
                const allMsgs = Array.from(storeMessages.values()).filter(m => m.key.remoteJid === from && m.key.fromMe);
                for(let m of allMsgs) {
                    await this.sock.sendMessage(from, { delete: m.key }).catch(()=>{});
                    await delay(300);
                }
                await this.send(from, `🗑️ DELETED ${allMsgs.length} BOT MESSAGES!

✅ All bot messages removed from this chat!`);
                break;

            case 'leave':
                if(isGroup) {
                    await this.send(from, `👋 LEAVING GROUP...

Goodbye! It was nice being here!
> Made by ${BOT_OWNER_DISPLAY}`);
                    await delay(1000);
                    await this.sock.groupLeave(from).catch(()=>{});
                } else {
                    await this.send(from, `❌ This command only works in groups!`);
                }
                break;

            case 'target':
                const targs = mentioned.length ? mentioned : (replyJid?[replyJid]:[]);
                if(targs.length) {
                    this.activeTarget.set(`${from}_target`, { targets: targs.map(normalizeJid) });
                    await this.send(from, `🎯 TARGET LOCKED!

✅ Target set: ${targs.map(t => `@${extractNumber(t)}`).join(', ')}
💡 Use ${GLOBAL_PREFIX}stoptarget to stop targeting`);
                } else {
                    await this.send(from, `❌ Tag or reply to a user to set target!

📌 Examples:
├── @user ${GLOBAL_PREFIX}target
└── Reply to message then ${GLOBAL_PREFIX}target`);
                }
                break;

            case 'desc':
                if(!isGroup) return this.send(from, `❌ This command only works in groups!`);
                const baseDesc = args.join(' ') || BOT_NAME;
                if(this.activeDesc.has(from)) return this.send(from, `⚠️ Desc spam already running! Use ${GLOBAL_PREFIX}stopdesc to stop.`);
                this.activeDesc.set(from, true);
                (async()=>{
                    while(this.activeDesc.has(from) && this.connected) {
                        const randEmoji = globalEmojiList[Math.floor(Math.random()*globalEmojiList.length)];
                        await HSEE.runAttack(async()=>{
                            if(this.activeDesc.has(from)) await this.sock.groupUpdateDescription(from, `${baseDesc} ${randEmoji}`).catch(()=>{});
                        });
                        await delay(Math.random()*1500+1500);
                    }
                })();
                await this.send(from, `📝 DESC SPAM STARTED!

📄 Text: ${baseDesc}
⚡ Interval: 1.5-3 seconds
💡 Use ${GLOBAL_PREFIX}stopdesc to stop!`);
                break;

            case 'name':
                const nameText = args.join(' ') || BOT_NAME;
                if(this.activeName.has(from)) return this.send(from, `⚠️ Name spam already running! Use ${GLOBAL_PREFIX}stopname to stop.`);
                this.activeName.set(from, true);
                (async()=>{
                    while(this.activeName.has(from) && this.connected) {
                        await HSEE.runAttack(async()=>{
                            if(this.activeName.has(from)) {
                                const e = globalEmojiList[Math.floor(Math.random()*globalEmojiList.length)];
                                await this.sock.groupUpdateSubject(from, `${e} ${nameText} ${e}`).catch(()=>{});
                            }
                        });
                        await delay(Math.random()*4000+5000);
                    }
                })();
                await this.send(from, `⚡ NAME SPAM STARTED!

📛 Name: ${nameText}
⚡ Interval: 5-9 seconds
💡 Use ${GLOBAL_PREFIX}stopname to stop!`);
                break;

            case 'spam':
                let spamMsg = args.join(' ');
                if(!spamMsg) return this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}spam <text>

📌 Example: ${GLOBAL_PREFIX}spam Hello everyone!
💡 Message will be sent every 12-25 seconds`);
                this.activeSpam.set(from, true);
                (async()=>{
                    while(this.activeSpam.has(from) && this.connected) {
                        const e1=globalEmojiList[Math.floor(Math.random()*globalEmojiList.length)];
                        const e2=globalEmojiList[Math.floor(Math.random()*globalEmojiList.length)];
                        await HSEE.runAttack(async()=>{
                            if(this.activeSpam.has(from)) await this.send(from, `${e1} ${spamMsg} ${e2}`);
                        });
                        await delay(Math.random()*13000+12000);
                    }
                })();
                await this.send(from, `✅ SLOW SPAM ACTIVE!

📝 Message: ${spamMsg}
⚡ Interval: 12-25 seconds
💡 Use ${GLOBAL_PREFIX}stopspam to stop!`);
                break;

            case 'spamfast':
                let sfDelay = 2000;
                let sfText = BOT_NAME;
                if(args.length) {
                    const match = args[0].toLowerCase().match(/^(\d+)(ms|s)?$/);
                    if(match) {
                        sfDelay = match[2]==='s'?parseInt(match[1])*1000:parseInt(match[1]);
                        args.shift();
                    }
                    if(args.length) sfText = args.join(' ');
                }
                const sfKey = `${from}_spamfast`;
                if(this.activeSpamFast.has(sfKey)) return this.send(from, `⚠️ Fast spam already running! Use ${GLOBAL_PREFIX}stopspamfast to stop.`);
                this.activeSpamFast.set(sfKey, true);
                (async()=>{
                    while(this.activeSpamFast.has(sfKey) && this.connected) {
                        await HSEE.runAttack(async()=>{
                            if(this.activeSpamFast.has(sfKey)) await this.send(from, sfText);
                        });
                        await delay(sfDelay);
                    }
                })();
                await this.send(from, `🚀 FAST SPAM ACTIVE!

📝 Message: ${sfText}
⚡ Delay: ${sfDelay}ms
💡 Use ${GLOBAL_PREFIX}stopspamfast to stop!`);
                break;

            case 'pcspm':
                const pcImg = quotedMsg?.quotedMessage?.imageMessage;
                if(!pcImg) return this.send(from, `❌ Reply to an image to spam it!

📌 How to use:
1. Find an image message
2. Reply to it
3. Type ${GLOBAL_PREFIX}pcspm`);
                this.activePcspm.set(from, true);
                const pcStream = await downloadContentFromMessage(pcImg, 'image');
                let pcBuf = Buffer.from([]);
                for await (const ch of pcStream) pcBuf = Buffer.concat([pcBuf, ch]);
                (async()=>{
                    while(this.activePcspm.has(from) && this.connected) {
                        await this.sock.sendMessage(from, { image: pcBuf }).catch(()=>{});
                        await delay(Math.random()*1000+1500);
                    }
                })();
                await this.send(from, `📸 IMAGE SPAM STARTED!

🖼️ Spamming replied image
⚡ Interval: 1.5-2.5 seconds
💡 Use ${GLOBAL_PREFIX}stopmedia to stop!`);
                break;

            case 'stspm':
                const stMsg = quotedMsg?.quotedMessage?.stickerMessage;
                if(!stMsg) return this.send(from, `❌ Reply to a sticker to spam it!

📌 How to use:
1. Find a sticker message
2. Reply to it
3. Type ${GLOBAL_PREFIX}stspm`);
                this.activeStspm.set(from, true);
                const stStream = await downloadContentFromMessage(stMsg, 'sticker');
                let stBuf = Buffer.from([]);
                for await (const ch of stStream) stBuf = Buffer.concat([stBuf, ch]);
                (async()=>{
                    while(this.activeStspm.has(from) && this.connected) {
                        await this.sock.sendMessage(from, { sticker: stBuf }).catch(()=>{});
                        await delay(Math.random()*500+1500);
                    }
                })();
                await this.send(from, `🎭 STICKER SPAM STARTED!

🖼️ Spamming replied sticker
⚡ Interval: 1.5-2 seconds
💡 Use ${GLOBAL_PREFIX}stopmedia to stop!`);
                break;

            case 'dtx':
                let dtxDelay = 100;
                let dtxText = "";
                if(args.length) {
                    const match = args[args.length-1].toLowerCase().match(/^(\d+)(ms|s)?$/);
                    if(match) {
                        dtxDelay = match[2]==='s'?parseInt(match[1])*1000:parseInt(match[1]);
                        args.pop();
                    }
                    dtxText = args.join(' ');
                }
                if(dtxText) {
                    const dtxId = `${from}_dtx`;
                    this.activeTxt.set(dtxId, true);
                    (async()=>{
                        while(this.activeTxt.has(dtxId) && this.connected) {
                            await HSEE.runAttack(async()=>{
                                if(this.activeTxt.has(dtxId)) await this.send(from, dtxText);
                            });
                            await delay(dtxDelay);
                        }
                    })();
                    await this.send(from, `⚙️ DTX SPAM ACTIVE!

📝 Text: ${dtxText}
⚡ Delay: ${dtxDelay}ms
💡 Use ${GLOBAL_PREFIX}stopall to stop!`);
                } else {
                    await this.send(from, `❌ USAGE: ${GLOBAL_PREFIX}dtx <text> [delay]

📌 Examples:
├── ${GLOBAL_PREFIX}dtx Hello
├── ${GLOBAL_PREFIX}dtx Hi 500ms
└── ${GLOBAL_PREFIX}dtx Hey 2s`);
                }
                break;
        }
    }
}

// ==================== BOT MANAGER ====================
class BotManager {
    constructor() {
        this.bots = new Map();
        this.counter = 1;
        loadOwner();
    }

    async init() {
        const saved = safeReadJSON(BOTS_FILE, { counter: 1, bots: [] });
        this.counter = saved.counter || 1;
        
        if (saved.bots.length > 0) {
            console.log(`\n🔌 Restoring ${BOT_NAME} Fleet (${saved.bots.length} Nodes)...`);
            for (const b of saved.bots) {
                const session = new BotSession(b.id, b.phone, this);
                this.bots.set(b.id, session);
                await session.connect();
                await delay(2000);
            }
        } else {
            console.log(`\n🤖 [ ${BOT_NAME} SETUP ] No nodes found. Setup Primary Node.`);
            const rlSetup = readline.createInterface({ input: process.stdin, output: process.stdout });
            const phone = (await new Promise(r => rlSetup.question('📱 Enter Bot Phone (with country code, e.g., 919536764960): ', r))).replace(/\D/g, '');
            if (!phone) {
                console.error('❌ Phone number is required. Exiting.');
                process.exit(1);
            }
            const session = new BotSession('Bot_1', phone, this);
            this.bots.set('Bot_1', session);
            await session.connect();
            rlSetup.close();
            this.save();
        }
        
        console.log(`\n✅ Admin Security Enabled`);
        console.log(`🔒 Admin numbers hidden\n`);
        
        if (!fs.existsSync(MESSAGE_FILE)) {
            const sampleMsgs = [
                `🔥 Welcome to SAIYAN BOT 🔥`,
                `⚡ Powered by Advanced WhatsApp Bot ⚡`,
                `🚀 Unlimited Messages System Active 🚀`,
                `💀 Made by SAIYAN BOT 💀`,
                `😎 Chill Mode ON! Enjoy the bot!`
            ];
            fs.writeFileSync(MESSAGE_FILE, sampleMsgs.join('\n'));
            console.log(`📄 Created ${MESSAGE_FILE} with sample messages`);
        }
        
        console.log(`📄 Messages loaded from: ${MESSAGE_FILE}`);
        console.log(`📊 Total messages: ${loadMessagesFromFile().length}`);
        console.log(`🤖 Bot Name: ${BOT_NAME}`);
        console.log(`👑 Bot Owner: ${BOT_OWNER_DISPLAY}`);
        console.log(`🛡️ Anti-Delete: ACTIVE (Restores Deleted Messages & Media)`);
        console.log(`🧠 AI Status: ${isAIEnabled() ? (GEMINI_API_KEY !== "AQ.Ab8RN6KcGoskaFiqedPr4UgJ4_gzxlApnXCN0fhK3nx8jLMcEg" ? 'ACTIVE' : 'FUNNY REPLIES MODE ACTIVE') : 'DISABLED'}`);
        console.log(`🔓 Group Unlock: ${GLOBAL_PREFIX}unlockname or ${GLOBAL_PREFIX}unlockgroup`);
        console.log(`⌨️ Auto-Typing: ${GLOBAL_PREFIX}autotyp <number> [name] [delay]`);
        console.log(`🌤️ Weather: ${GLOBAL_PREFIX}weather <city> (requires API key)`);
    }

    save() {
        safeWriteJSON(BOTS_FILE, {
            counter: this.counter,
            bots: [...this.bots.values()].map(b => ({ id: b.internalId, phone: b.phoneNumber }))
        });
    }

    getMainBotId() {
        for (const [id, bot] of this.bots.entries()) {
            if (bot.connected) return id;
        }
        return 'Bot_1';
    }
}

// ==================== PREMIUM ADMIN PANEL ====================
async function startWebPanel(manager) {
    const app = express();
    const server = createServer(app);
    const io = new Server(server);
    let PORT = process.env.PORT || 20028;

    app.get('/', (req, res) => {
        res.send(`<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SAIYAN BOT | Premium Admin Panel</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    min-height: 100vh;
                    margin: 0;
                    overflow-x: hidden;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    position: relative;
                    background: #000;
                }

                /* Background Image */
                body::before {
                    content: "";
                    position: fixed;
                    top: -10%;
                    left: -10%;
                    width: 120%;
                    height: 120%;
                    background-image: url('https://i.pinimg.com/736x/fe/cf/cc/fecfcc12191d1d1d74c18b4d7fa029b4.jpg');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    z-index: -2;

                    animation: premiumSwing 20s ease-in-out infinite;
                    transform-origin: center center;
                    will-change: transform;
                }

                /* Dark overlay */
                body::after {
                    content: "";
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.55);
                    z-index: -1;
                }

                /* Premium slow 3D swing */
                @keyframes premiumSwing {
                    0% {
                       transform: perspective(1200px) rotateY(-4deg) rotateX(1deg) scale(1.08);
                    }

                    25% {
                        transform: perspective(1200px) rotateY(0deg) rotateX(-1deg) scale(1.10);
                    }

                    50% {
                        transform: perspective(1200px) rotateY(4deg) rotateX(1deg) scale(1.08);
                    }

                    75% {
                        transform: perspective(1200px) rotateY(0deg) rotateX(-1deg) scale(1.10);
                    }

                    100% {
                         transform: perspective(1200px) rotateY(-4deg) rotateX(1deg) scale(1.08);
                    }
                }
                }
                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    font-size: 2.5rem;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                .header p {
                    color: rgba(255,255,255,0.8);
                    margin-top: 10px;
                }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .card {
                    background: rgba(20,20,20,0.45);
                    backdrop-filter: blur(3px);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 20px;
                }
                .card-title {
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: white;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid rgba(255,255,255,0.2);
                }
                .bot-item {
                    background: rgba(0,0,0,0.3);
                    border-radius: 12px;
                    padding: 10px;
                    margin-bottom: 10px;
                    color: white;
                }
                .status-online { color: #4ade80; }
                .status-offline { color: #f87171; }
                .button-group {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 15px;
                }
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    color: white;
                }
                .btn-danger { background: #ef4444; }
                .btn-warning { background: #f59e0b; }
                .btn-info { background: #3b82f6; }
                .btn-success { background: #10b981; }
                .console {
                    background: rgba(0,0,0,0.7);
                    border-radius: 12px;
                    padding: 15px;
                    height: 250px;
                    overflow-y: auto;
                    font-family: monospace;
                    font-size: 0.8rem;
                    color: #4ade80;
                }
                .message-item {
                    background: rgba(0,0,0,0.3);
                    padding: 5px 10px;
                    margin-bottom: 5px;
                    border-radius: 6px;
                    color: #ddd;
                    font-size: 0.8rem;
                }
            </style>
            <script src="/socket.io/socket.io.js"></script>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✨ SAIYAN BOT ✨</h1>
                    <p>Premium Admin Control Panel | Anti-Delete Active | AI Powered | Auto-Typing</p>
                </div>
                <div class="grid">
                    <div class="card">
                        <div class="card-title">📊 System Status</div>
                        <div id="systemInfo" style="color: #ddd; line-height: 1.8;"></div>
                        <div id="datetime" style="color: #4ade80; margin-top: 10px;"></div>
                    </div>
                    <div class="card">
                        <div class="card-title">🤖 Bot Nodes</div>
                        <div id="bots"></div>
                        <div class="button-group">
                            <button class="btn btn-danger" onclick="sendStop('stopall')">🛑 STOP ALL</button>
                            <button class="btn btn-warning" onclick="sendStop('stopspam')">⏹️ Stop Spam</button>
                            <button class="btn btn-info" onclick="sendStop('stopname')">⏹️ Stop Name</button>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-title">📝 Message File</div>
                        <div id="messagesInfo"></div>
                        <div id="messagesList"></div>
                        <div class="button-group">
                            <button class="btn btn-success" onclick="refreshMessages()">🔄 Refresh</button>
                            <button class="btn btn-warning" onclick="sendStop('clearmsgs')">🗑️ Clear</button>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-title">💻 Live Console</div>
                    <div id="console" class="console"></div>
                </div>
            </div>
            <script>
                const socket = io();
                const consoleDiv = document.getElementById('console');
                socket.on('console', (msg) => {
                    const line = document.createElement('div');
                    line.textContent = msg;
                    consoleDiv.appendChild(line);
                    consoleDiv.scrollTop = consoleDiv.scrollHeight;
                });
                function updateDateTime() {
                    document.getElementById('datetime').innerHTML = '🕐 ' + new Date().toLocaleString();
                }
                setInterval(updateDateTime, 1000);
                updateDateTime();
                async function fetchSystemInfo() {
                    const res = await fetch('/api/system');
                    const data = await res.json();
                    document.getElementById('systemInfo').innerHTML = \`
                        💾 RAM: \${data.ram}MB<br>
                        ⏱️ Server Uptime: \${data.uptime}<br>
                        🤖 Bot Uptime: \${data.botUptime}<br>
                        👑 Owner: \${data.owner}<br>
                        🧠 AI: \${data.aiStatus}
                    \`;
                }
                async function fetchBots() {
                    const res = await fetch('/api/bots');
                    const bots = await res.json();
                    const html = bots.map(b => \`
                        <div class="bot-item">
                            <strong>\${b.name}</strong> - 
                            \${b.connected ? '<span class="status-online">🟢 ONLINE</span>' : '<span class="status-offline">🔴 OFFLINE</span>'}
                            \${b.suppressed ? '🔇' : '🔊'} | 📱 \${b.number || 'Unknown'}
                        </div>
                    \`).join('');
                    document.getElementById('bots').innerHTML = html || 'No bots';
                }
                async function refreshMessages() {
                    const res = await fetch('/api/messages');
                    const data = await res.json();
                    document.getElementById('messagesInfo').innerHTML = \`📄 Total: \${data.count} messages\`;
                    const html = data.messages.slice(0, 10).map((m, i) => \`<div class="message-item">\${i+1}. \${m.substring(0, 60)}\${m.length > 60 ? '...' : ''}</div>\`).join('');
                    document.getElementById('messagesList').innerHTML = html;
                }
                window.sendStop = (cmd) => socket.emit('stopCommand', { command: cmd });
                setInterval(() => { fetchBots(); fetchSystemInfo(); }, 3000);
                fetchBots(); fetchSystemInfo(); refreshMessages();
            </script>
        </body>
        </html>`);
    });

    app.get('/api/bots', (req, res) => {
        const bots = [];
        for (let b of manager.bots.values()) {
            bots.push({
                id: b.internalId,
                name: b.displayId,
                connected: b.connected,
                suppressed: b.isSuppressed,
                number: b.phoneNumber
            });
        }
        res.json(bots);
    });

    app.get('/api/system', (req, res) => {
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const upt = process.uptime();
        let botUptime = '0h 0m';
        for (let b of manager.bots.values()) {
            if (b.connected) {
                const bu = Math.floor((Date.now() - b.startTime)/1000);
                botUptime = `${Math.floor(bu/3600)}h ${Math.floor((bu%3600)/60)}m`;
                break;
            }
        }
        res.json({
            ram,
            uptime: `${Math.floor(upt/3600)}h ${Math.floor((upt%3600)/60)}m`,
            botUptime,
            owner: ownerNumber,
            aiStatus: isAIEnabled() ? (GEMINI_API_KEY && GEMINI_API_KEY !== "AQ.Ab8RN6KcGoskaFiqedPr4UgJ4_gzxlApnXCN0fhK3nx8jLMcEg" ? '✅ Active' : '🎭 Funny Mode') : '❌ Disabled'
        });
    });

    app.get('/api/messages', (req, res) => {
        const messages = loadMessagesFromFile();
        res.json({ count: messages.length, messages: messages });
    });

    const originalLog = console.log;
    console.log = function(...args) {
        originalLog(...args);
        io.emit('console', args.map(a => String(a)).join(' '));
    };

    io.on('connection', (socket) => {
        console.log('👑 Admin panel connected');
        socket.on('stopCommand', ({ command }) => {
            for (let bot of manager.bots.values()) {
                if (bot.connected) {
                    const groups = [...bot.activeSpam.keys(), ...bot.activeName.keys(), ...bot.activeTarget.keys()];
                    if (groups.length) bot.executeInternal(groups[0], command, 'admin@panel', null, [], null, true);
                }
            }
        });
    });

    server.listen(PORT, () => console.log(`🌐 Admin Panel: http://localhost:${PORT}`));
}

// ==================== STARTUP ====================
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log(`║ ⚡ SAIYAN BOT V6.0 (PREMIUM EDITION) ⚡`);
console.log(`║ 👑 Made by SAIYAN                                               ║`);
console.log(`║ 📱 Allowed Admins: 🔒 Hidden                                    ║`);
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

const manager = new BotManager();
await manager.init();
startWebPanel(manager);

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    process.exit(0);
});
