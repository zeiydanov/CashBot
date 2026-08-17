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
        fs.writeFileSync(dataPath, '{}');
    }

    return JSON.parse(
        fs.readFileSync(dataPath, 'utf8')
    );
}

function saveData(data) {

    fs.writeFileSync(
        dataPath,
        JSON.stringify(data, null, 4)
    );
}

function getUser(data, id) {

    if (!data[id]) {

        data[id] = {
            money: 0,
            xp: 0,
            lastDaily: 0,
            achievements: [],
            diceWins: 0,
            diceBattles: 0
        };
    }

    if (typeof data[id].money !== 'number') {
        data[id].money = 0;
    }

    return data[id];
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName('paragonder')
        .setDescription('Başka bir kullanıcıya Cash gönder.')
        .addUserOption(option =>
            option
                .setName('kullanici')
                .setDescription('Cash göndereceğin kişi.')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('miktar')
                .setDescription('Göndereceğin Cash miktarı.')
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction) {

        const receiver =
            interaction.options.getUser('kullanici');

        const amount =
            interaction.options.getInteger('miktar');

        const sender =
            interaction.user;

        if (receiver.id === sender.id) {

            return interaction.reply({
                content:
                    '❌ Kendine Cash gönderemezsin.',
                ephemeral: true
            });
        }

        if (receiver.bot) {

            return interaction.reply({
                content:
                    '❌ Botlara Cash gönderemezsin.',
                ephemeral: true
            });
        }

        const data = loadData();

        const senderData =
            getUser(data, sender.id);

        const receiverData =
            getUser(data, receiver.id);

        if (senderData.money < amount) {

            return interaction.reply({
                content:
                    `❌ Yeterli Cash'in yok.\n\n` +
                    `💰 Bakiyen: **${senderData.money.toLocaleString('tr-TR')} Cash**\n` +
                    `💸 Göndermek istediğin: **${amount.toLocaleString('tr-TR')} Cash**`,
                ephemeral: true
            });
        }

        senderData.money -= amount;

        receiverData.money += amount;

        saveData(data);

        const embed =
            new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('💸 Cash Transferi')
                .setDescription(
                    `💰 **Cash transferi başarılı!**\n\n` +

                    `👤 **Gönderen:** ${sender}\n` +
                    `🎯 **Alıcı:** ${receiver}\n\n` +

                    `💵 **Miktar:** ` +
                    `\`${amount.toLocaleString('tr-TR')} Cash\`\n\n` +

                    `💰 **Yeni Bakiyen:** ` +
                    `\`${senderData.money.toLocaleString('tr-TR')} Cash\``
                )
                .setFooter({
                    text:
                        'CashBot • Cash Transfer'
                })
                .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};