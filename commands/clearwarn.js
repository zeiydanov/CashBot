const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '..', 'data', 'warnings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarn')
        .setDescription('Bir kullanıcının tüm uyarılarını siler.')
        .addUserOption(option =>
            option
                .setName('uye')
                .setDescription('Uyarıları silinecek üye')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('uye');

        if (!fs.existsSync(warningsPath)) {
            return interaction.reply({
                content: '❌ Warn veritabanı bulunamadı.',
                ephemeral: true
            });
        }

        const warnings = JSON.parse(
            fs.readFileSync(warningsPath, 'utf8')
        );

        if (!warnings[user.id] || warnings[user.id].length === 0) {
            return interaction.reply({
                content: `ℹ️ **${user.tag}** kullanıcısının silinecek warnı yok.`,
                ephemeral: true
            });
        }

        const count = warnings[user.id].length;

        delete warnings[user.id];

        fs.writeFileSync(
            warningsPath,
            JSON.stringify(warnings, null, 4)
        );

        await interaction.reply(
            `🧹 **${user.tag}** kullanıcısının **${count}** uyarısı temizlendi.\n` +
            `👮 Yetkili: **${interaction.user.tag}**`
        );
    }
};