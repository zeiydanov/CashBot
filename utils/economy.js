const fs = require('fs');
const path = require('path');

const dataPath = path.join(
    __dirname,
    '..',
    'data',
    'economy.json'
);

// ==========================================
// DOSYAYI HAZIRLA
// ==========================================

function ensureFile() {

    const folder =
        path.dirname(dataPath);

    if (!fs.existsSync(folder)) {

        fs.mkdirSync(folder, {
            recursive: true
        });
    }

    if (!fs.existsSync(dataPath)) {

        fs.writeFileSync(
            dataPath,
            '{}',
            'utf8'
        );
    }
}

// ==========================================
// VERİ OKU
// ==========================================

function loadEconomy() {

    ensureFile();

    try {

        const raw =
            fs.readFileSync(
                dataPath,
                'utf8'
            );

        if (!raw.trim()) {
            return {};
        }

        return JSON.parse(raw);

    } catch (error) {

        console.error(
            '❌ Economy okuma hatası:',
            error
        );

        return {};
    }
}

// ==========================================
// VERİ KAYDET
// ==========================================

function saveEconomy(data) {

    ensureFile();

    try {

        const tempPath =
            dataPath + '.tmp';

        fs.writeFileSync(
            tempPath,
            JSON.stringify(
                data,
                null,
                4
            ),
            'utf8'
        );

        fs.renameSync(
            tempPath,
            dataPath
        );

        return true;

    } catch (error) {

        console.error(
            '❌ Economy kaydetme hatası:',
            error
        );

        return false;
    }
}

// ==========================================
// KULLANICI VERİSİ
// ==========================================

function getUser(data, userId) {

    if (!data[userId]) {

        data[userId] = {

            money: 0,

            xp: 0,

            lastDaily: 0
        };
    }

    data[userId].money =
        Number(data[userId].money) || 0;

    data[userId].xp =
        Number(data[userId].xp) || 0;

    data[userId].lastDaily =
        Number(data[userId].lastDaily) || 0;

    return data[userId];
}

// ==========================================
// BAKİYE
// ==========================================

function getBalance(userId) {

    const data =
        loadEconomy();

    if (!data[userId]) {
        return 0;
    }

    return Number(
        data[userId].money
    ) || 0;
}

// ==========================================
// PARA VER
// ==========================================

function addMoney(userId, amount) {

    const data =
        loadEconomy();

    const user =
        getUser(
            data,
            userId
        );

    amount =
        Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        return {

            success: false,

            balance: user.money
        };
    }

    user.money += amount;

    const saved =
        saveEconomy(data);

    if (!saved) {

        return {

            success: false,

            balance: user.money - amount
        };
    }

    return {

        success: true,

        balance: user.money
    };
}

// ==========================================
// PARA AL
// ==========================================

function removeMoney(userId, amount) {

    const data =
        loadEconomy();

    const user =
        getUser(
            data,
            userId
        );

    amount =
        Number(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        return {

            success: false,

            balance: user.money
        };
    }

    if (
        user.money < amount
    ) {

        return {

            success: false,

            balance: user.money
        };
    }

    const oldBalance =
        user.money;

    user.money -= amount;

    const saved =
        saveEconomy(data);

    if (!saved) {

        return {

            success: false,

            balance: oldBalance
        };
    }

    return {

        success: true,

        balance: user.money
    };
}

// ==========================================
// PARA SIFIRLA
// ==========================================

function resetEconomy(userId) {

    const data =
        loadEconomy();

    if (!data[userId]) {

        data[userId] = {

            money: 0,

            xp: 0,

            lastDaily: 0
        };

    } else {

        data[userId].money = 0;
    }

    const saved =
        saveEconomy(data);

    return {

        success: saved,

        balance: 0,

        user: data[userId]
    };
}

// ==========================================
// EXPORT
// ==========================================

module.exports = {

    dataPath,

    ensureFile,

    loadEconomy,

    saveEconomy,

    getUser,

    getBalance,

    addMoney,

    removeMoney,

    resetEconomy

};