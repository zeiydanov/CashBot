const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const {
    ACHIEVEMENTS,
    loadData,
    getUser
} = require('../utils/achievements');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('basarimlar')
        .setDescription('Başarımlarını görüntüle.'),

    async execute(interaction) {

        const data = loadData();

        const user =
            getUser(
                data,
                interaction.user.id
            );

        const level =
            Math.floor(user.xp / 1000) + 1;

        const achievements =
            Object.entries(ACHIEVEMENTS);

        let description = '';

        for (const [id, achievement] of achievements) {

            const unlocked =
                user.achievements.includes(id);

            let progress = '';

            if (id === 'ilk_adim') {

                progress =
                    unlocked
                        ? '✅ Tamamlandı'
                        : '🔒 İlk günlük ödülünü al';

            }

            if (id === 'zengin') {

                progress =
                    unlocked
                        ? '✅ Tamamlandı'
                        : `📊 ${Math.min(user.money, 100000).toLocaleString('tr-TR')} / 100.000 Cash`;

            }

            if (id === 'usta') {

                progress =
                    unlocked
                        ? '✅ Tamamlandı'
                        : `📊 Level ${Math.min(level, 10)} / 10`;

            }

            if (id === 'sansli') {

                progress =
                    unlocked
                        ? '✅ Tamamlandı'
                        : `📊 ${Math.min(user.diceWins, 10)} / 10 galibiyet`;

            }

            if (id === 'savasci') {

                progress =
                    unlocked
                        ? '✅ Tamamlandı'
                        : `📊 ${Math.min(user.diceWins, 50)} / 50 galibiyet`;
            }

            description +=
                `${achievement.name}\n` +
                `> ${achievement.description}\n` +
                `${progress}\n` +
                `🎁 Ödül: **${achievement.reward.toLocaleString('tr-TR')} Cash**\n\n`;
        }

        const completed =
            user.achievements.length;

        const embed =
            new EmbedBuilder()
                .setColor(0xFEE75C)
                .setTitle('🏆 Başarımlar')
                .setDescription(
                    `👤 ${interaction.user}\n\n` +
                    `🏆 **Tamamlanan:** ${completed}/${achievements.length}\n\n` +
                    description
                )
                .setThumbnail(
                    interaction.user.displayAvatarURL()
                )
                .setFooter({
                    text: 'CashBot • Başarımlar'
                })
                .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};