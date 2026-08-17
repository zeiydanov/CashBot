const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const dataPath = path.join(
    __dirname,
    '..',
    'data',
    'economy.json'
);

// ==========================================
// GÜNLÜK ÖDÜL AYARLARI
// ==========================================

const DAILY_MONEY = 250;
const DAILY_XP = 1000;

const DAILY_COOLDOWN =
    24 * 60 * 60 * 1000;

// ==========================================
// VERİLERİ YÜKLE
// ==========================================

function loadData() {

    // data klasörü yoksa oluştur
    if (!fs.existsSync(path.dirname(dataPath))) {

        fs.mkdirSync(
            path.dirname(dataPath),
            {
                recursive: true
            }
        );
    }

    // economy.json yoksa oluştur
    if (!fs.existsSync(dataPath)) {

        fs.writeFileSync(
            dataPath,
            '{}'
        );
    }

    try {

        return JSON.parse(
            fs.readFileSync(
                dataPath,
                'utf8'
            )
        );

    } catch (error) {

        console.error(
            '❌ Economy verisi okunamadı:',
            error
        );

        return {};
    }
}

// ==========================================
// VERİLERİ KAYDET
// ==========================================

function saveData(data) {

    fs.writeFileSync(
        dataPath,
        JSON.stringify(
            data,
            null,
            4
        )
    );
}

// ==========================================
// KULLANICI VERİSİ OLUŞTUR
// ==========================================

function createUser(data, userId) {

    if (!data[userId]) {

        data[userId] = {
            money: 0,
            xp: 0,
            lastDaily: 0
        };

    }

    // Eksik alanları tamamla

    if (
        typeof data[userId].money !== 'number'
    ) {

        data[userId].money =
            Number(
                data[userId].money
            ) || 0;

    }

    if (
        typeof data[userId].xp !== 'number'
    ) {

        data[userId].xp =
            Number(
                data[userId].xp
            ) || 0;

    }

    if (
        typeof data[userId].lastDaily !== 'number'
    ) {

        data[userId].lastDaily = 0;

    }

    return data[userId];
}

// ==========================================
// KALAN SÜRE
// ==========================================

function formatTime(milliseconds) {

    const totalSeconds =
        Math.ceil(
            milliseconds / 1000
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    return {
        hours,
        minutes,
        seconds
    };
}

// ==========================================
// KOMUT
// ==========================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName('gunluk')

        .setDescription(
            'Günlük 250 Cash ve 1000 XP ödülünü al.'
        )

        // NORMAL OYUNCULAR KULLANABİLİR
        .setDefaultMemberPermissions(null),

    // ==========================================
    // ÇALIŞTIR
    // ==========================================

    async execute(interaction) {

        try {

            const userId =
                interaction.user.id;

            // ==========================================
            // VERİLER
            // ==========================================

            const data =
                loadData();

            const userData =
                createUser(
                    data,
                    userId
                );

            const now =
                Date.now();

            // ==========================================
            // SON GÜNLÜK ÖDÜL
            // ==========================================

            const lastDaily =
                Number(
                    userData.lastDaily
                ) || 0;

            const timeSinceLastDaily =
                now - lastDaily;

            // ==========================================
            // COOLDOWN
            // ==========================================

            if (
                lastDaily > 0 &&
                timeSinceLastDaily <
                DAILY_COOLDOWN
            ) {

                const remaining =
                    DAILY_COOLDOWN -
                    timeSinceLastDaily;

                const time =
                    formatTime(
                        remaining
                    );

                const cooldownEmbed =
                    new EmbedBuilder()

                        .setColor(
                            0xED4245
                        )

                        .setTitle(
                            '⏰ GÜNLÜK ÖDÜL HAZIR DEĞİL'
                        )

                        .setDescription(

                            '🎁 Günlük ödülünü zaten aldın.\n\n' +

                            '⏳ **Tekrar alabilmek için:**\n\n' +

                            '`' +
                            time.hours +
                            ' saat ' +
                            time.minutes +
                            ' dakika ' +
                            time.seconds +
                            ' saniye` beklemelisin.'

                        )

                        .addFields({

                            name:
                                '🎁 Günlük Ödül',

                            value:
                                '💰 **250 Cash**\n' +
                                '⭐ **1000 XP**'

                        })

                        .setFooter({

                            text:
                                'CashBot • Günlük Ödül'

                        })

                        .setTimestamp();

                return interaction.reply({

                    embeds: [
                        cooldownEmbed
                    ],

                    ephemeral: true

                });
            }

            // ==========================================
            // ESKİ XP
            // ==========================================

            const oldXp =
                Math.max(
                    0,
                    Number(
                        userData.xp
                    ) || 0
                );

            // ==========================================
            // ESKİ SEVİYE
            // ==========================================

            const oldLevel =
                Math.floor(
                    oldXp / 1000
                ) + 1;

            // ==========================================
            // ÖDÜLLERİ VER
            // ==========================================

            userData.money +=
                DAILY_MONEY;

            userData.xp +=
                DAILY_XP;

            userData.lastDaily =
                now;

            // ==========================================
            // YENİ SEVİYE
            // ==========================================

            const newLevel =
                Math.floor(
                    userData.xp / 1000
                ) + 1;

            // ==========================================
            // VERİLERİ KAYDET
            // ==========================================

            saveData(data);

            // ==========================================
            // LEVEL ATLAMA
            // ==========================================

            let levelMessage = '';

            if (
                newLevel > oldLevel
            ) {

                levelMessage =

                    '\n\n' +

                    '🎉 **LEVEL ATLADIN!**\n' +

                    '🏆 Yeni seviyen: `' +
                    newLevel +
                    '`';

            }

            // ==========================================
            // YENİ SEVİYEDE XP
            // ==========================================

            const currentLevelXp =
                userData.xp % 1000;

            // ==========================================
            // İLERLEME
            // ==========================================

            const progress =
                Math.floor(
                    (currentLevelXp / 1000) * 10
                );

            const progressBar =
                '🟩'.repeat(
                    progress
                ) +

                '⬜'.repeat(
                    10 - progress
                );

            // ==========================================
            // BAŞARILI EMBED
            // ==========================================

            const embed =
                new EmbedBuilder()

                    .setColor(
                        0x57F287
                    )

                    .setTitle(
                        '🎁 GÜNLÜK ÖDÜLÜNÜ ALDIN!'
                    )

                    .setDescription(

                        '👤 **Kullanıcı:** ' +
                        interaction.user +
                        '\n\n' +

                        '🎁 **Bugünkü Ödüllerin**\n\n' +

                        '💰 **Cash:** `+250 Cash`\n' +

                        '⭐ **XP:** `+1000 XP`\n\n' +

                        '━━━━━━━━━━━━━━━━━━\n\n' +

                        '💵 **Yeni Bakiye:**\n' +
                        '`' +
                        userData.money.toLocaleString(
                            'tr-TR'
                        ) +
                        ' Cash`\n\n' +

                        '⭐ **Toplam XP:**\n' +
                        '`' +
                        userData.xp.toLocaleString(
                            'tr-TR'
                        ) +
                        ' XP`\n\n' +

                        '🏆 **Seviye:** `' +
                        newLevel +
                        '`\n\n' +

                        '📈 **Seviye İlerlemesi:**\n' +

                        progressBar +

                        '\n`' +
                        currentLevelXp +
                        ' / 1000 XP`' +

                        levelMessage

                    )

                    .setThumbnail(

                        interaction.user.displayAvatarURL({
                            size: 256
                        })

                    )

                    .setFooter({

                        text:
                            'CashBot • Günlük Ödül'

                    })

                    .setTimestamp();

            // ==========================================
            // CEVAP
            // ==========================================

            await interaction.reply({

                embeds: [
                    embed
                ]

            });

        } catch (error) {

            console.error(
                '❌ GÜNLÜK KOMUTU HATASI:',
                error
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction.followUp({

                    content:
                        '❌ Günlük ödül verilirken bir hata oluştu.',

                    ephemeral: true

                });

            } else {

                await interaction.reply({

                    content:
                        '❌ Günlük ödül verilirken bir hata oluştu.',

                    ephemeral: true

                });

            }

        }

    }

};