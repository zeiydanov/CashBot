const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolbilgi')
        .setDescription('Bir role sahip kişileri gösterir.')
        .addRoleOption(option =>
            option
                .setName('rol')
                .setDescription('Bilgisini görmek istediğin rolü seç.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const role = interaction.options.getRole('rol');

        // Roldeki üyeleri al
        const members = role.members;

        // Üye sayısı
        const memberCount = members.size;

        // Üyeleri listele
        let memberList;

        if (memberCount === 0) {
            memberList = 'Bu role sahip hiç kimse yok.';
        } else {
            memberList = members
                .map(member => `• ${member}`)
                .join('\n');
        }

        // Discord embed açıklama sınırını aşmasını önle
        if (memberList.length > 4000) {
            memberList =
                members
                    .map(member => `• ${member}`)
                    .join('\n')
                    .substring(0, 3900) +
                '\n\n... ve diğer üyeler.';
        }

        const embed = new EmbedBuilder()
            .setColor(role.color || 0x5865F2)
            .setTitle(`🎭 ${role.name} Rol Bilgisi`)
            .setDescription(
                `👥 **Bu role sahip kişi sayısı:** \`${memberCount}\`\n\n` +
                `**👤 Role Sahip Üyeler:**\n${memberList}`
            )
            .addFields(
                {
                    name: '🆔 Rol ID',
                    value: `\`${role.id}\``,
                    inline: true
                },
                {
                    name: '🎨 Rol Rengi',
                    value: role.hexColor,
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