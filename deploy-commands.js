require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIG
// ==========================================

// 1. SUNUCUDA CASHBOT KULLANABİLECEK ROL
const FIRST_GUILD_ACCESS_ROLE_ID =
    '1516432684396843139';

// ==========================================
// COMMANDS
// ==========================================

const commandsPath =
    path.join(
        __dirname,
        'commands'
    );

if (!fs.existsSync(commandsPath)) {

    console.error(
        '❌ commands klasörü bulunamadı!'
    );

    process.exit(1);
}

const commandFiles =
    fs
        .readdirSync(commandsPath)
        .filter(
            file =>
                file.endsWith('.js')
        );

// ==========================================
// COMMAND AYIRMA
// ==========================================

const allCommands = [];

const normalCommands = [];

const moderationCommands = [];

// ==========================================
// MODERASYON KOMUTU TESPİTİ
// ==========================================

function isModerationCommand(
    command
) {

    if (!command) {
        return false;
    }

    // --------------------------------------
    // moderation: true
    // --------------------------------------

    if (
        command.moderation === true
    ) {

        return true;
    }

    // --------------------------------------
    // isModeration: true
    // --------------------------------------

    if (
        command.isModeration === true
    ) {

        return true;
    }

    // --------------------------------------
    // category: 'moderation'
    // --------------------------------------

    if (
        typeof command.category === 'string' &&
        command.category.toLowerCase() ===
            'moderation'
    ) {

        return true;
    }

    // --------------------------------------
    // data.category
    // --------------------------------------

    if (
        typeof command.data?.category === 'string' &&
        command.data.category.toLowerCase() ===
            'moderation'
    ) {

        return true;
    }

    return false;
}

// ==========================================
// COMMANDLARI OKU
// ==========================================

for (
    const file of commandFiles
) {

    const filePath =
        path.join(
            commandsPath,
            file
        );

    try {

        delete require.cache[
            require.resolve(filePath)
        ];

        const command =
            require(filePath);

        if (
            !command.data ||
            !command.execute
        ) {

            console.log(
                `⚠️ ${file} atlandı: data veya execute eksik.`
            );

            continue;
        }

        const json =
            command.data.toJSON();

        allCommands.push({
            command,
            json,
            file
        });

        if (
            isModerationCommand(
                command
            )
        ) {

            moderationCommands.push({
                command,
                json,
                file
            });

            console.log(
                `🛡️ Moderasyon komutu: /${command.data.name}`
            );

        } else {

            normalCommands.push({
                command,
                json,
                file
            });

            console.log(
                `✅ Normal komut: /${command.data.name}`
            );
        }

    } catch (error) {

        console.error(
            `❌ Komut yüklenemedi: ${file}`
        );

        console.error(error);
    }
}

// ==========================================
// ÖZET
// ==========================================

console.log('');
console.log(
    '=========================================='
);

console.log(
    `📦 Toplam komut: ${allCommands.length}`
);

console.log(
    `👤 Normal komut: ${normalCommands.length}`
);

console.log(
    `🛡️ Moderasyon komutu: ${moderationCommands.length}`
);

console.log(
    '=========================================='
);

console.log('');

// ==========================================
// ENV
// ==========================================

if (
    !process.env.TOKEN
) {

    console.error(
        '❌ TOKEN bulunamadı!'
    );

    process.exit(1);
}

if (
    !process.env.CLIENT_ID
) {

    console.error(
        '❌ CLIENT_ID bulunamadı!'
    );

    process.exit(1);
}

if (
    !process.env.GUILD_ID
) {

    console.error(
        '❌ GUILD_ID bulunamadı!'
    );

    process.exit(1);
}

// ==========================================
// SUNUCULAR
// ==========================================

const firstGuildId =
    process.env.GUILD_ID;

const secondGuildId =
    process.env.GUILD_ID_2;

// ==========================================
// REST
// ==========================================

const rest =
    new REST({
        version: '10'
    }).setToken(
        process.env.TOKEN
    );

// ==========================================
// DEPLOY
// ==========================================

(async () => {

    try {

        // ==================================
        // 1. SUNUCU
        // ==================================

        // 1. sunucuya SADECE normal
        // komutları yüklüyoruz.
        //
        // Moderasyon komutları burada
        // register edilmeyecek.
        //
        // Böylece kullanıcılar / menüsünde
        // moderasyon komutlarını görmeyecek.

        console.log('');
        console.log(
            '=========================================='
        );

        console.log(
            '🏠 1. SUNUCU KOMUT YÜKLEME'
        );

        console.log(
            `🆔 ${firstGuildId}`
        );

        console.log(
            `🔐 Erişim rolü: ${FIRST_GUILD_ACCESS_ROLE_ID}`
        );

        console.log(
            `👤 Yüklenecek normal komut: ${normalCommands.length}`
        );

        console.log(
            `🛡️ Engellenen moderasyon komutu: ${moderationCommands.length}`
        );

        console.log(
            '=========================================='
        );

        await rest.put(

            Routes.applicationGuildCommands(

                process.env.CLIENT_ID,

                firstGuildId

            ),

            {
                body:
                    normalCommands.map(
                        item =>
                            item.json
                    )
            }
        );

        console.log(
            '✅ 1. sunucu komutları yüklendi.'
        );

        console.log(
            '🛡️ Moderasyon komutları 1. sunucuya yüklenmedi.'
        );

        // ==================================
        // 2. SUNUCU
        // ==================================

        if (
            secondGuildId
        ) {

            console.log('');
            console.log(
                '=========================================='
            );

            console.log(
                '🏠 2. SUNUCU KOMUT YÜKLEME'
            );

            console.log(
                `🆔 ${secondGuildId}`
            );

            console.log(
                '🔓 Mevcut sistem korunuyor.'
            );

            console.log(
                `📦 Yüklenecek toplam komut: ${allCommands.length}`
            );

            console.log(
                '=========================================='
            );

            // 2. SUNUCUYA TÜM KOMUTLAR
            //
            // Buraya 1. sunucu filtresi uygulanmaz.
            // Homie sistemi korunur.

            await rest.put(

                Routes.applicationGuildCommands(

                    process.env.CLIENT_ID,

                    secondGuildId

                ),

                {
                    body:
                        allCommands.map(
                            item =>
                                item.json
                        )
                }
            );

            console.log(
                '✅ 2. sunucu komutları yüklendi.'
            );

            console.log(
                '🔓 2. sunucunun mevcut komut sistemi korunuyor.'
            );
        }

        // ==================================
        // TAMAMLANDI
        // ==================================

        console.log('');
        console.log(
            '=========================================='
        );

        console.log(
            '🎉 COMMAND DEPLOY TAMAMLANDI'
        );

        console.log(
            '=========================================='
        );

        console.log(
            `🏠 1. Sunucu: ${firstGuildId}`
        );

        console.log(
            `👤 Normal komut: ${normalCommands.length}`
        );

        console.log(
            `🛡️ Moderasyon komutu: 0`
        );

        if (
            secondGuildId
        ) {

            console.log(
                `🏠 2. Sunucu: ${secondGuildId}`
            );

            console.log(
                `📦 Toplam komut: ${allCommands.length}`
            );
        }

        console.log('');
        console.log(
            `🔐 1. Sunucu CashBot rolü: ${FIRST_GUILD_ACCESS_ROLE_ID}`
        );

        console.log('');
        console.log(
            '=========================================='
        );

    } catch (error) {

        console.error('');
        console.error(
            '=========================================='
        );

        console.error(
            '❌ COMMAND DEPLOY HATASI'
        );

        console.error(
            '=========================================='
        );

        console.error(error);

        process.exit(1);
    }

})();