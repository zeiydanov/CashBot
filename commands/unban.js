const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Banlı bir kullanıcının banını kaldırır.')
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('Banı kaldırılacak kullanıcının Discord IDsi')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const id = interaction.options.getString('id');

        if (!/^\d{17,20}$/.test(id)) {
            return interaction.reply({
                content: '❌ Geçerli bir Discord kullanıcı IDsi gir.',
                ephemeral: true
            });
        }

        try {
            const user = await interaction.client.users.fetch(id);

            await interaction.guild.members.unban(
                id,
                `Unban: ${interaction.user.tag}`
            );
await sendLog(interaction.client, {
    action: 'UNBAN',
    user,
    moderator: interaction.user,
    reason: `Unban: ${interaction.user.tag}`
});
            await interaction.reply(
                `🔓 **${user.tag}** kullanıcısının banı kaldırıldı.`
            );
        } catch (error) {
            console.error(error);

            await interaction.reply({
                content: '❌ Kullanıcı bulunamadı veya bu sunucuda banlı değil.',
                ephemeral: true
            });
        }
    }
};
