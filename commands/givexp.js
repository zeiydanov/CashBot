const {
    SlashCommandBuilder,
    PermissionFlagsBits,
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('givexp')
        .setDescription('Bir kullanıcıya XP verir.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        )
        .addUserOption(option =>
            option
                .setName('kullanici')
                .setDescription('XP verilecek kullanıcı.')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('miktar')
                .setDescription('Verilecek XP miktarı.')
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {

        const user =
            interaction.options.getUser('kullanici');

        const amount =
            interaction.options.getInteger('miktar');

        const data = loadData();

        if (!data[user.id]) {
            data[user.id] = {
                money: 0,
                xp: 0
            };
        }

        const oldLevel =
            Math.floor(
                data[user.id].xp / 1000
            ) + 1;

        data[user.id].xp += amount;

        const newLevel =
            Math.floor(
                data[user.id].xp / 1000
            ) + 1;

        saveData(data);

        let levelMessage = '';

        if (newLevel > oldLevel) {
            levelMessage =
                '\n\n🎉 **LEVEL ATLADI!**\n' +
                '🏆 Yeni seviye: `' +
                newLevel +
                '`';
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('⭐ XP Verildi')
            .setDescription(
                '👤 **Kullanıcı:** ' +
                user +
                '\n' +
                '⭐ **Verilen:** `' +
                amount.toLocaleString('tr-TR') +
                ' XP`' +
                '\n' +
                '🏆 **Yeni Seviye:** `' +
                newLevel +
                '`' +
                '\n' +
                '⭐ **Toplam XP:** `' +
                data[user.id].xp.toLocaleString('tr-TR') +
                ' XP`' +
                levelMessage
            )
            .setFooter({
                text:
                    'Yetkili: ' +
                    interaction.user.tag
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};