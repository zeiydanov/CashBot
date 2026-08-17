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
        .setName('zenginler')
        .setDescription('En çok Cash sahibi oyuncuları gösterir.'),

    async execute(interaction) {

        const data = loadData();

        // ==============================
        // KULLANICILARI HAZIRLA
        // ==============================

        const users = Object.entries(data)
            .map(([id, userData]) => {

                return {
                    id: id,
                    money:
                        typeof userData.money === 'number'
                            ? userData.money
                            : 0
                };

            })
            .filter(user => user.money > 0)
            .sort((a, b) => b.money - a.money);

        // ==============================
        // İLK 10
        // ==============================

        const topUsers = users.slice(0, 10);

        // ==============================
        // LİSTE
        // ==============================

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

            // Botları gösterme
            if (member?.user?.bot) {
                continue;
            }

            const username =
                member
                    ? member.user.username
                    : `<@${user.id}>`;

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
                `${medal} ${username} — **${user.money.toLocaleString('tr-TR')} Cash**\n`;
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

            const myMoney =
                users[myIndex].money;

            myRankText =
                `\n📊 **Senin Sıralaman:** \`#${myIndex + 1}\`\n` +
                `💰 **Bakiyen:** \`${myMoney.toLocaleString('tr-TR')} Cash\``;

        } else {

            myRankText =
                '\n📊 **Senin Sıralaman:** Henüz sıralamada değilsin.';
        }

        // ==============================
        // EMBED
        // ==============================

        const embed =
            new EmbedBuilder()
                .setColor(0xFEE75C)
                .setTitle('💰 CASH ZENGİNLERİ')
                .setDescription(
                    '🏆 **En çok Cash sahibi oyuncular**\n\n' +
                    description +
                    myRankText
                )
                .setFooter({
                    text:
                        'CashBot • Ekonomi Sıralaması'
                })
                .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};