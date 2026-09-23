const axios = require('axios');

const AUTH_TOKEN = 'Bearer YOUR_BEARER_TOKEN';

const URL_PVP = 'https://api.remanga.org/api/v2/events/card-battle/pvp/match/';

const PVP_INTERVAL = 30000;         
const NETWORK_ERROR_DELAY = 15000;  

const headers = {
    'Authorization': AUTH_TOKEN,
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Content-Type': 'application/json',
    'Origin': 'https://remanga.org',
    'Referer': 'https://remanga.org',
    'Accept': 'application/json, text/plain, */*'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let lastPvpTime = 0;

async function mainLoop() {
    console.log('Работаем!');
    
    while (true) {
        const now = Date.now();

        if (now - lastPvpTime >= PVP_INTERVAL) {
            
            console.log('\n⚔️ [PvP] Отправка запроса на дуэль...');
            try {
                const response = await axios.post(URL_PVP, {}, { headers });
                if (response.status === 200 || response.status === 201) {
                    console.log(`[PvP Успех] Дуэль завершена!`);
                }
                lastPvpTime = Date.now();
            } catch (error) {
                handleError(error, 'PvP');
                if (error.response && error.response.status === 401) process.exit(1);
                if (error.response) lastPvpTime = Date.now();
            }
        }
        await sleep(1000);
    }
}


function handleError(error, mode) {
    if (error.response) {
        console.error(`[-] [${mode}] Ошибка сервера (Код ${error.response.status})`);
    } else if (error.request) {
        console.error(`🌐 [${mode}] Ошибка сети на телефоне. Повтор через 15 секунд...`);
        return sleep(NETWORK_ERROR_DELAY);
    }
}

mainLoop();
