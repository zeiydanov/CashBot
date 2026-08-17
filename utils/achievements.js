const fs = require('fs');
const path = require('path');

const dataPath = path.join(
    __dirname,
    '..',
    'data',
    'economy.json'
);

const ACHIEVEMENTS = {

    ilk_adim: {
        name: '🎁 İlk Adım',
        description: 'İlk günlük ödülünü al.',
        reward: 500
    },

    zengin: {
        name: '💰 Zengin',
        description: '100.000 Cash miktarına ulaş.',
        reward: 5000
    },

    usta: {
        name: '⭐ Usta',
        description: 'Level 10 seviyesine ulaş.',
        reward: 5000
    },

    sansli: {
        name: '🎲 Şanslı',
        description: '10 zar savaşı kazan.',
        reward: 2500
    },

    savasci: {
        name: '⚔️ Savaşçı',
        description: '50 zar savaşı kazan.',
        reward: 10000
    }
};

function loadData() {

    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, '{}');
    }

    try {

        return JSON.parse(
            fs.readFileSync(dataPath, 'utf8')
        );

    } catch {

        return {};
    }
}

function saveData(data) {

    fs.writeFileSync(
        dataPath,
        JSON.stringify(data, null, 4)
    );
}

function getUser(data, userId) {

    if (!data[userId]) {

        data[userId] = {
            money: 0,
            xp: 0,
            lastDaily: 0,
            achievements: [],
            diceWins: 0,
            diceBattles: 0
        };
    }

    if (!Array.isArray(data[userId].achievements)) {
        data[userId].achievements = [];
    }

    if (typeof data[userId].diceWins !== 'number') {
        data[userId].diceWins = 0;
    }

    if (typeof data[userId].diceBattles !== 'number') {
        data[userId].diceBattles = 0;
    }

    if (typeof data[userId].money !== 'number') {
        data[userId].money = 0;
    }

    if (typeof data[userId].xp !== 'number') {
        data[userId].xp = 0;
    }

    return data[userId];
}

function checkAchievements(userId, data = null) {

    if (!data) {
        data = loadData();
    }

    const user = getUser(data, userId);

    const unlocked = [];

    const level =
        Math.floor(user.xp / 1000) + 1;

    function unlock(id) {

        if (user.achievements.includes(id)) {
            return;
        }

        user.achievements.push(id);

        const achievement =
            ACHIEVEMENTS[id];

        user.money += achievement.reward;

        unlocked.push({
            id,
            name: achievement.name,
            description: achievement.description,
            reward: achievement.reward
        });
    }

    if (user.lastDaily > 0) {
        unlock('ilk_adim');
    }

    if (user.money >= 100000) {
        unlock('zengin');
    }

    if (level >= 10) {
        unlock('usta');
    }

    if (user.diceWins >= 10) {
        unlock('sansli');
    }

    if (user.diceWins >= 50) {
        unlock('savasci');
    }

    saveData(data);

    return unlocked;
}

module.exports = {
    ACHIEVEMENTS,
    loadData,
    saveData,
    getUser,
    checkAchievements
};