const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const economy = require('../utils/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-ver')
        .setDescription('Bir kullanıcıya Cash verir.')
        .addUserOption(option =>
            option
                .setName('kullanici')
                .setDescription('Cash verilecek kullanıcı')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('miktar')
                .setDescription('Verilecek Cash miktarı')
                .setMinValue(1)
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

        const amount =
            interaction.options.getInteger('miktar');

        const newBalance =
            economy.addMoney(
                user.id,
                amount
            );

        const embed =
            new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('💸 PARA VERİLDİ')
                .setDescription(
                    `👤 **Kullanıcı:** ${user}\n\n` +
                    `💰 **Verilen:** \`${amount.toLocaleString('tr-TR')} Cash\`\n` +
                    `💵 **Yeni bakiye:** \`${newBalance.toLocaleString('tr-TR')} Cash\``
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