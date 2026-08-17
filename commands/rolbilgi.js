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
                .setDescription('Üyelerini görmek istediğin rolü seç.')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const role = interaction.options.getRole('rol');

        try {
            // Sunucudaki tüm üyeleri çek
            const members = await interaction.guild.members.fetch();

            // Seçilen role sahip üyeleri bul
            const roleMembers = members.filter(member =>
                member.roles.cache.has(role.id)
            );

            const memberCount = roleMembers.size;

            let memberList;

            if (memberCount === 0) {
                memberList = '❌ Bu role sahip hiç kimse bulunamadı.';
            } else {
                memberList = roleMembers
                    .map(member => `• ${member}`)
                    .join('\n');
            }

            // Discord embed açıklama limiti
            if (memberList.length > 3800) {
                const visibleMembers = roleMembers
                    .map(member => `• ${member}`)
                    .join('\n');

                memberList =
                    visibleMembers.substring(0, 3700) +
                    `\n\n... ve daha fazla üye var. **Toplam: ${memberCount} kişi**`;
            }

            const embed = new EmbedBuilder()
                .setColor(role.color || 0x5865F2)
                .setTitle(`🎭 ${role.name} Rol Bilgisi`)
                .setDescription(
                    `👥 **Role sahip kişi sayısı:** \`${memberCount}\`\n\n` +
                    `👤 **Role Sahip Üyeler:**\n${memberList}`
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

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {
            console.error('Rol bilgisi hatası:', error);

            await interaction.editReply({
                content: '❌ Üyeler alınırken bir hata oluştu. Botun **Server Members Intent** yetkisinin açık olduğundan emin ol.'
            });
        }
    }
};