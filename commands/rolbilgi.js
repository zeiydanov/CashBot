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
        const role = interaction.options.getRole('rol');

        // Discord'un "düşünüyor..." süresini hemen başlat
        await interaction.deferReply();

        try {
            // Üyeleri Discord'dan al
            const members = await interaction.guild.members.fetch({
                withPresences: false
            });

            // Role sahip üyeleri bul
            const roleMembers = members.filter(member =>
                member.roles.cache.has(role.id)
            );

            const memberCount = roleMembers.size;

            // Üyeleri sırala
            const sortedMembers = [...roleMembers.values()]
                .sort((a, b) => a.displayName.localeCompare(b.displayName));

            // Listeyi oluştur
            let memberList = sortedMembers
                .map((member, index) => `${index + 1}. ${member}`)
                .join('\n');

            if (memberCount === 0) {
                memberList = '❌ Bu role sahip kimse bulunamadı.';
            }

            // Discord embed açıklama limiti
            if (memberList.length > 3800) {
                memberList =
                    memberList.substring(0, 3600) +
                    `\n\n... **${memberCount} kişi** bulundu. Liste çok uzun olduğu için tamamı gösterilemedi.`;
            }

            const embed = new EmbedBuilder()
                .setColor(role.color || 0x5865F2)
                .setTitle(`🎭 ${role.name}`)
                .setDescription(
                    `👥 **Toplam:** \`${memberCount} kişi\`\n\n` +
                    `👤 **Role Sahip Üyeler:**\n${memberList}`
                )
                .addFields({
                    name: '🆔 Rol ID',
                    value: `\`${role.id}\``,
                    inline: true
                })
                .setFooter({
                    text: `CashBot • ${interaction.guild.name}`
                })
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {
            console.error('ROL BİLGİ HATASI:', error);

            await interaction.editReply({
                content:
                    '❌ Üyeler alınırken hata oluştu. Discord Developer Portal üzerinden **Server Members Intent** özelliğinin açık olduğundan emin ol.'
            });
        }
    }
};