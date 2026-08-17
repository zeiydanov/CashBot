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
        .setName('givemoney')
        .setDescription('Bir kullanıcıya Cash verir.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        )
        .addUserOption(option =>
            option
                .setName('kullanici')
                .setDescription('Cash verilecek kullanıcı.')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('miktar')
                .setDescription('Verilecek Cash miktarı.')
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

        data[user.id].money += amount;

        saveData(data);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('💰 Cash Verildi')
            .setDescription(
                '👤 **Kullanıcı:** ' +
                user +
                '\n' +
                '💵 **Verilen:** `' +
                amount.toLocaleString('tr-TR') +
                ' Cash`' +
                '\n\n' +
                '💰 **Yeni Bakiye:** `' +
                data[user.id].money.toLocaleString('tr-TR') +
                ' Cash`'
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