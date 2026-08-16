const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const { sendLog } = require('../utils/logger');

const warningsPath = path.join(
    __dirname,
    '..',
    'data',
    'warnings.json'
);

function loadWarnings() {
    if (!fs.existsSync(warningsPath)) {
        fs.writeFileSync(warningsPath, '{}');
    }

    try {
        return JSON.parse(
            fs.readFileSync(warningsPath, 'utf8')
        );
    } catch (error) {
        console.error('Warn dosyası okunamadı:', error);

        fs.writeFileSync(warningsPath, '{}');

        return {};
    }
}

function saveWarnings(data) {
    fs.writeFileSync(
        warningsPath,
        JSON.stringify(data, null, 4)
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Bir üyeyi uyarır.')
        .addUserOption(option =>
            option
                .setName('uye')
                .setDescription('Uyarılacak üye')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('sebep')
                .setDescription('Uyarı sebebi')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('uye');
        const reason = interaction.options.getString('sebep');

        const warnings = loadWarnings();

        if (!warnings[user.id]) {
            warnings[user.id] = [];
        }

        warnings[user.id].push({
            reason: reason,
            moderator: interaction.user.id,
            moderatorTag: interaction.user.tag,
            date: new Date().toISOString()
        });

        saveWarnings(warnings);

        // Önce count oluşturuluyor
        const count = warnings[user.id].length;

        // Sonra log gönderiliyor
        await sendLog(interaction.client, {
            action: 'WARN',
            user: user,
            moderator: interaction.user,
            reason: reason,
            details: `Toplam warn: ${count}`
        });

        await interaction.reply({
            content:
                `⚠️ **${user.tag}** uyarıldı.\n\n` +
                `📝 Sebep: **${reason}**\n` +
                `🔢 Toplam uyarı: **${count}**\n` +
                `👮 Yetkili: **${interaction.user.tag}**`
        });
    }
};