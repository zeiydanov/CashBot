const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kayitpanel')
        .setDescription('Mülakat kayıt panelini gönderir.'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📋 OLD RP Kayıt Başvurusu')
            .setDescription(
                'Sunucumuza katılmak için aşağıdaki **Kayıt Ol** butonuna bas.\n\n' +
                'Başvuru formunda aşağıdaki bilgiler istenecektir:\n\n' +
                '👤 **İsim / Soyisim**\n' +
                '🎂 **Yaş**\n' +
                '🎮 **FiveM / Oyun ID**\n' +
                '🕐 **Günlük Aktiflik**\n' +
                '🎙️ **Mikrofon Durumu**\n' +
                '📜 **RP Deneyimi**\n\n' +
                'Başvurun oluşturulduktan sonra kayıt yetkilileri seninle ilgilenecektir.'
            )
            .setFooter({
                text: 'CashBot • Kayıt Sistemi'
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('kayit_baslat')
                    .setLabel('Kayıt Ol')
                    .setEmoji('📋')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};