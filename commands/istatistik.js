const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const economy = require('../utils/economy');

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

// ==========================================
// SÜRE FORMAT
// ==========================================

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

// ==========================================
// KOMUT
// ==========================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName('istatistik')

        .setDescription(
            'CashBot oyuncu istatistiklerini gösterir.'
        )

        .addUserOption(option =>
            option
                .setName('kullanici')
                .setDescription(
                    'İstatistiklerini görmek istediğin kişi.'
                )
                .setRequired(false)
        ),

    async execute(interaction) {

        // ==========================================
        // KULLANICI
        // ==========================================

        const user =
            interaction.options.getUser('kullanici') ||
            interaction.user;

        // ==========================================
        // ECONOMY.JSON OKU
        // ==========================================

        const data =
            economy.loadEconomy();

        // ==========================================
        // KULLANICI VERİSİ
        // ==========================================

        const userData =
            data[user.id] || null;

        // ==========================================
        // CASH
        // ==========================================

        // Kullanıcı economy.json içinde yoksa 0
        // Kullanıcı varsa sadece money değerini oku.

        const money =
            userData
                ? Number(userData.money) || 0
                : 0;

        // ==========================================
        // XP
        // ==========================================

        const xp =
            userData
                ? Number(userData.xp) || 0
                : 0;

        // ==========================================
        // DAILY
        // ==========================================

        const lastDaily =
            userData
                ? Number(userData.lastDaily) || 0
                : 0;

        // ==========================================
        // LEVEL
        // ==========================================

        const level =
            Math.floor(
                xp / 1000
            ) + 1;

        const currentLevelXp =
            xp % 1000;

        const remainingXp =
            1000 - currentLevelXp;

        // ==========================================
        // XP BAR
        // ==========================================

        const progress =
            Math.min(
                10,
                Math.floor(
                    (currentLevelXp / 1000) * 10
                )
            );

        const progressBar =
            '🟩'.repeat(progress) +
            '⬜'.repeat(
                10 - progress
            );

        // ==========================================
        // DAILY DURUMU
        // ==========================================

        let dailyStatus;

        if (!lastDaily) {

            dailyStatus =
                '🎁 **Hazır!**';

        } else {

            const nextDaily =
                lastDaily +
                DAILY_COOLDOWN;

            dailyStatus =
                formatRemaining(
                    nextDaily - Date.now()
                );
        }

        // ==========================================
        // CASH SIRALAMASI
        // ==========================================

        const moneyRanking =

            Object.entries(data)

                .map(([id, info]) => ({

                    id,

                    money:
                        Number(info?.money) || 0

                }))

                // 0 Cash olanları sıralamaya dahil etme
                .filter(
                    item =>
                        item.money > 0
                )

                .sort(
                    (a, b) =>
                        b.money - a.money
                );

        const moneyRank =
            moneyRanking.findIndex(
                item =>
                    item.id === user.id
            );

        // ==========================================
        // XP SIRALAMASI
        // ==========================================

        const xpRanking =

            Object.entries(data)

                .map(([id, info]) => ({

                    id,

                    xp:
                        Number(info?.xp) || 0

                }))

                .filter(
                    item =>
                        item.xp > 0
                )

                .sort(
                    (a, b) =>
                        b.xp - a.xp
                );

        const xpRank =
            xpRanking.findIndex(
                item =>
                    item.id === user.id
            );

        // ==========================================
        // SIRALAMA
        // ==========================================

        const moneyRankText =

            money <= 0 || moneyRank === -1

                ? 'Sıralamada yok'

                : `#${moneyRank + 1}`;

        const xpRankText =

            xp <= 0 || xpRank === -1

                ? 'Sıralamada yok'

                : `#${xpRank + 1}`;

        // ==========================================
        // EMBED
        // ==========================================

        const embed =

            new EmbedBuilder()

                .setColor(
                    0x5865F2
                )

                .setTitle(
                    '📊 OYUNCU İSTATİSTİKLERİ'
                )

                .setDescription(

                    `👤 **Kullanıcı:** ${user}\n\n` +

                    `💰 **Cash:** \`${money.toLocaleString('tr-TR')} Cash\`\n` +

                    `🏆 **Cash Sıralaması:** \`${moneyRankText}\`\n\n` +

                    `⭐ **Toplam XP:** \`${xp.toLocaleString('tr-TR')} XP\`\n` +

                    `📈 **XP Sıralaması:** \`${xpRankText}\`\n\n` +

                    `🏅 **Seviye:** \`${level}\`\n\n` +

                    `${progressBar}\n` +

                    `📊 **Seviye İlerlemesi:** \`${currentLevelXp} / 1000 XP\`\n` +

                    `🎯 **Sonraki Seviye:** \`${remainingXp} XP\`\n\n` +

                    `🎁 **Günlük Ödül:** ${dailyStatus}`

                )

                .setThumbnail(
                    user.displayAvatarURL({
                        dynamic: true
                    })
                )

                .setFooter({

                    text:
                        'CashBot • Oyuncu İstatistikleri'

                })

                .setTimestamp();

        // ==========================================
        // GÖNDER
        // ==========================================

        return interaction.reply({

            embeds: [
                embed
            ]
        });
    }
};