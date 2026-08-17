const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolbilgi')
        .setDescription('Bir rol hakkında detaylı bilgi verir.')
        .addRoleOption(option =>
            option
                .setName('rol')
                .setDescription('Bilgisini görmek istediğin rolü seç.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const role = interaction.options.getRole('rol');

        const embed = new EmbedBuilder()
            .setColor(role.color || 0x5865F2)
            .setTitle('🎭 Rol Bilgisi')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                {
                    name: '📌 Rol Adı',
                    value: `${role.name}`,
                    inline: true
                },
                {
                    name: '🆔 Rol ID',
                    value: `\`${role.id}\``,
                    inline: true
                },
                {
                    name: '👥 Üye Sayısı',
                    value: `${role.members.size}`,
                    inline: true
                },
                {
                    name: '🎨 Rol Rengi',
                    value: role.hexColor,
                    inline: true
                },
                {
                    name: '📅 Oluşturulma',
                    value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`,
                    inline: true
                },
                {
                    name: '📢 Mention',
                    value: `${role}`,
                    inline: true
                },
                {
                    name: '⚙️ Yönetilebilir mi?',
                    value: role.managed ? '❌ Hayır' : '✅ Evet',
                    inline: true
                },
                {
                    name: '📍 Pozisyon',
                    value: `${role.position}`,
                    inline: true
                }
            )
            .setFooter({
                text: `CashBot • ${interaction.guild.name}`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};