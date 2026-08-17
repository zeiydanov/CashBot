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

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

function loadData() {

    if (!fs.existsSync(dataPath)) {
        return {};
    }

    try {

        return JSON.parse(
            fs.readFileSync(dataPath, 'utf8')
        );

    } catch (error) {

        console.error(
            'economy.json okunamadı:',
            error
        );

        return {};
    }
}

function formatRemaining(milliseconds) {

    if (milliseconds <= 0) {
        return '🎁 Hazır!';
    }

    const totalSeconds =
        Math.ceil(milliseconds / 1000);

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    return (
        `⏳ ${hours} saat ${minutes} dakika ${seconds} saniye`
    );
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName('istatistik')
        .setDescription('CashBot istatistiklerini gösterir.')
        .addUserOption(option =>
            option
                .setName('kullanici')
                .setDescription('İstatistiklerini görmek istediğin kişi.')
                .setRequired(false)
        ),

    async execute(interaction) {

        const user =
            interaction.options.getUser('kullanici') ||
            interaction.user;

        const data = loadData();

        // ==============================
        // KULLANICI VERİSİ
        // ==============================

        const userData =
            data[user.id] || {
                money: 0,
                xp: 0,
                lastDaily: 0
            };

        const money =
            typeof userData.money === 'number'
                ? userData.money
                : 0;

        const xp =
            typeof userData.xp === 'number'
                ? userData.xp
                : 0;

        const lastDaily =
            typeof userData.lastDaily === 'number'
                ? userData.lastDaily
                : 0;

        // ==============================
        // LEVEL
        // ==============================

        const level =
            Math.floor(xp / 1000) + 1;

        const currentLevelXp =
            xp % 1000;

        const remainingXp =
            1000 - currentLevelXp;

        // ==============================
        // XP İLERLEME ÇUBUĞU
        // ==============================

        const progress =
            Math.floor(
                (currentLevelXp / 1000) * 10
            );

        const progressBar =
            '🟩'.repeat(progress) +
            '⬜'.repeat(10 - progress);

        // ==============================
        // GÜNLÜK ÖDÜL
        // ==============================

        let dailyStatus;

        if (!lastDaily) {

            dailyStatus =
                '🎁 **Hazır!**';

        } else {

            const nextDaily =
                lastDaily + DAILY_COOLDOWN;

            const remaining =
                nextDaily - Date.now();

            dailyStatus =
                formatRemaining(remaining);
        }

        // ==============================
        // CASH SIRALAMASI
        // ==============================

        const moneyRanking =
            Object.entries(data)
                .map(([id, info]) => ({
                    id: id,
                    money:
                        typeof info.money === 'number'
                            ? info.money
                            : 0
                }))
                .filter(
                    item => item.money > 0
                )
                .sort(
                    (a, b) => b.money - a.money
                );

        const moneyRank =
            moneyRanking.findIndex(
                item => item.id === user.id
            );

        // ==============================
        // XP SIRALAMASI
        // ==============================

        const xpRanking =
            Object.entries(data)
                .map(([id, info]) => ({
                    id: id,
                    xp:
                        typeof info.xp === 'number'
                            ? info.xp
                            : 0
                }))
                .filter(
                    item => item.xp > 0
                )
                .sort(
                    (a, b) => b.xp - a.xp
                );

        const xpRank =
            xpRanking.findIndex(
                item => item.id === user.id
            );

        // ==============================
        // RANK METİNLERİ
        // ==============================

        const moneyRankText =
            moneyRank === -1
                ? 'Sıralamada yok'
                : `#${moneyRank + 1}`;

        const xpRankText =
            xpRank === -1
                ? 'Sıralamada yok'
                : `#${xpRank + 1}`;

        // ==============================
        // EMBED
        // ==============================

        const embed =
            new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📊 Oyuncu İstatistikleri')
                .setDescription(
                    `👤 **Kullanıcı:** ${user}\n\n` +

                    `💰 **Cash:** \`${money.toLocaleString('tr-TR')} Cash\`\n` +
                    `🏆 **Cash Sıralaması:** \`${moneyRankText}\`\n\n` +

                    `⭐ **Toplam XP:** \`${xp.toLocaleString('tr-TR')} XP\`\n` +
                    `📈 **XP Sıralaması:** \`${xpRankText}\`\n\n` +

                    `🏅 **Seviye:** \`${level}\`\n` +
                    `${progressBar}\n` +
                    `📊 **Seviye İlerlemesi:** \`${currentLevelXp} / 1000 XP\`\n` +
                    `🎯 **Sonraki Seviye:** \`${remainingXp} XP\`\n\n` +

                    `🎁 **Günlük Ödül:** ${dailyStatus}`
                )
                .setThumbnail(
                    user.displayAvatarURL()
                )
                .setFooter({
                    text:
                        'CashBot • Oyuncu İstatistikleri'
                })
                .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};