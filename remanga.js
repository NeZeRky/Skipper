const axios = require('axios');

const AUTH_TOKEN = process.env.AUTH_TOKEN;

const URL_RAID = 'https://api.remanga.org/api/v2/events/card-battle/locations/10/raid/';
const URL_PVP = 'https://api.remanga.org/api/v2/events/card-battle/pvp/match/';

const PVP_INTERVAL = 30000;         
const ENERGY_SLEEP_TIME = 1800000;  
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
let nextRaidTime = 0;

async function mainLoop() {
    console.log('📱 Бот успешно запущен!');
    
    while (true) {
        const now = Date.now();

        // PvP Check (Every 30 seconds)
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
        
        // Check Raid (Energy Spill)
        if (now >= nextRaidTime) {
            const timeString = new Intl.DateTimeFormat('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
            }).format(Date.now());

            console.log('\n🛡 [Рейд] Отправка отряда в бой...' + "[" + timeString + "]");
            try {
                const response = await axios.post(URL_RAID, {}, { headers });
                if (response.status === 200 || response.status === 201) {
                    timeString = new Intl.DateTimeFormat('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                    }).format(Date.now());
                    console.log(`[Рейд Успех] Бой выигран! Очки начислены.` + "[" + timeString + "]");
                }
                await sleep(5000 + Math.random() * 3000); // Пауза между рейдами
                continue; 
            } catch (error) {
                handleError(error, 'Рейд');
                if (error.response) {
                    if (error.response.status === 401) process.exit(1);
                    
                    const status = error.response.status;
                    const errorText = JSON.stringify(error.response.data).toLowerCase();

                    // If code 400 or in the text of energy tokens - we fall asleep
                    if (status === 400 || errorText.includes('energy') || errorText.includes('энерг')) {
                        console.log(`\n🔋 [Рейд] Энергия на нуле. Рейды спят 30 минут. PvP продолжает работать.`);
                        raidActive = false;
                    //    setTimeout(() => { raidActive = true; }, ENERGY_SLEEP_TIME);
                        nextRaidTime = Date.now() + ENERGY_SLEEP_TIME; 
                    } else {
                        // If any other server error occurs, we try in a minute
                        raidActive = false;
                        nextRaidTime = Date.now() + 60000;
                    //    setTimeout(() => { raidActive = true; }, 60000);
                    }
                }
            }
        }
        await sleep(1000);
    }
}


function handleError(error, mode) {
    if (error.response) {
        console.error(`[-] [${mode}] Ошибка сервера (Код ${error.response.status})`);
    } else if (error.request) {
        console.error(`🌐 [${mode}] Повтор через 15 секунд...`);
        return sleep(NETWORK_ERROR_DELAY);
    }
}

mainLoop();