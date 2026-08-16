const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Ticket panelini oluşturur.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setTitle('🎫 CashBot Destek Merkezi')
            .setDescription(
                'Aşağıdaki kategorilerden size uygun olanı seçerek destek talebi oluşturabilirsiniz.\n\n' +
                '💬 **Destek Talebi**\n' +
                'Genel yardım ve sorularınız için.\n\n' +
                '💰 **Donate**\n' +
                'Donate işlemleri ve satın alımlar için.\n\n' +
                '🚨 **Şikayet**\n' +
                'Oyuncu veya sunucu şikayetleri için.\n\n' +
                '🛠️ **Teknik Destek**\n' +
                'Teknik sorunlar ve bağlantı problemleri için.'
            )
            .setFooter({
                text: 'CashBot • Destek Sistemi'
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_destek')
                    .setLabel('Destek Talebi')
                    .setEmoji('💬')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('ticket_donate')
                    .setLabel('Donate')
                    .setEmoji('💰')
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId('ticket_sikayet')
                    .setLabel('Şikayet')
                    .setEmoji('🚨')
                    .setStyle(ButtonStyle.Danger),

                new ButtonBuilder()
                    .setCustomId('ticket_teknik')
                    .setLabel('Teknik Destek')
                    .setEmoji('🛠️')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: '✅ Ticket paneli oluşturuldu.',
            ephemeral: true
        });
    }
};