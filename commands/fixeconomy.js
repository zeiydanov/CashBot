const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const economy = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-sıfırla')
        .setDescription('Bir kullanıcının Cash bakiyesini sıfırlar.')
        .addUserOption(option =>
            option
                .setName('kullanici')
                .setDescription('Bakiyesi sıfırlanacak kullanıcı')
                .setRequired(true)
        ),

    async execute(interaction) {

        if (
            !interaction.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return interaction.reply({
                content: '❌ Bu komutu sadece **Administrator** yetkisine sahip yetkililer kullanabilir.',
                ephemeral: true
            });
        }

        const user =
            interaction.options.getUser('kullanici');

        const result =
            economy.resetEconomy(
                user.id
            );

        if (!result.success) {

            return interaction.reply({
                content: '❌ Bakiye sıfırlanırken ekonomi dosyasına kayıt yapılamadı.',
                ephemeral: true
            });
        }

        // GERÇEKTEN 0 OLDUĞUNU KONTROL ET
        const verifiedBalance =
            economy.getBalance(user.id);

        if (verifiedBalance !== 0) {

            console.error(
                `❌ ${user.id} için bakiye sıfırlama doğrulanamadı. Bakiye: ${verifiedBalance}`
            );

            return interaction.reply({
                content:
                    '❌ Bakiye sıfırlama doğrulanamadı. Economy dosyasını kontrol et.',
                ephemeral: true
            });
        }

        const embed =
            new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle('🗑️ BAKİYE SIFIRLANDI')
                .setDescription(
                    `👤 **Kullanıcı:** ${user}\n\n` +
                    `💰 **Eski bakiye:** Sıfırlandı\n` +
                    `💵 **Yeni bakiye:** \`0 Cash\``
                )
                .setFooter({
                    text: `İşlemi yapan: ${interaction.user.tag}`
                })
                .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};