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

module.exports = {

    data: new SlashCommandBuilder()
        .setName('xp-siralama')
        .setDescription('En yüksek XP sahibi oyuncuları gösterir.'),

    async execute(interaction) {

        const data = loadData();

        // ==============================
        // XP SIRALAMASI
        // ==============================

        const users = Object.entries(data)
            .map(([id, userData]) => {

                const xp =
                    typeof userData.xp === 'number'
                        ? userData.xp
                        : 0;

                return {
                    id: id,
                    xp: xp
                };

            })
            .filter(user => user.xp > 0)
            .sort((a, b) => b.xp - a.xp);

        // ==============================
        // İLK 10
        // ==============================

        const topUsers = users.slice(0, 10);

        let description = '';

        for (let i = 0; i < topUsers.length; i++) {

            const user = topUsers[i];

            let member;

            try {

                member =
                    await interaction.guild.members
                        .fetch(user.id);

            } catch {

                member = null;
            }

            // Botları sıralamaya dahil etme
            if (member?.user?.bot) {
                continue;
            }

            const username =
                member
                    ? member.user.username
                    : `<@${user.id}>`;

            const level =
                Math.floor(user.xp / 1000) + 1;

            let medal = '';

            if (i === 0) {

                medal = '🥇';

            } else if (i === 1) {

                medal = '🥈';

            } else if (i === 2) {

                medal = '🥉';

            } else {

                medal = `**${i + 1}.**`;
            }

            description +=
                `${medal} ${username} — **${user.xp.toLocaleString('tr-TR')} XP** • Level **${level}**\n`;
        }

        if (!description) {

            description =
                '💤 Henüz sıralamada gösterilecek oyuncu bulunmuyor.';
        }

        // ==============================
        // KULLANICININ SIRASI
        // ==============================

        const myIndex =
            users.findIndex(
                user =>
                    user.id === interaction.user.id
            );

        let myRankText = '';

        if (myIndex !== -1) {

            const myXP =
                users[myIndex].xp;

            const myLevel =
                Math.floor(myXP / 1000) + 1;

            myRankText =
                `\n📊 **Senin Sıralaman:** \`#${myIndex + 1}\`\n` +
                `⭐ **XP:** \`${myXP.toLocaleString('tr-TR')} XP\`\n` +
                `🏆 **Level:** \`${myLevel}\``;

        } else {

            myRankText =
                '\n📊 **Senin Sıralaman:** Henüz sıralamada değilsin.';
        }

        // ==============================
        // EMBED
        // ==============================

        const embed =
            new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('⭐ XP SIRALAMASI')
                .setDescription(
                    '🏆 **En yüksek XP sahibi oyuncular**\n\n' +
                    description +
                    myRankText
                )
                .setFooter({
                    text:
                        'CashBot • XP Sıralaması'
                })
                .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};