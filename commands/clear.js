const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Kanaldaki mesajları siler.')
        .addIntegerOption(option =>
            option
                .setName('miktar')
                .setDescription('Silinecek mesaj sayısı')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const miktar = interaction.options.getInteger('miktar');

        await interaction.deferReply({ ephemeral: true });

        const messages = await interaction.channel.bulkDelete(miktar, true);

        await interaction.editReply(
            `🧹 **${messages.size}** mesaj silindi.`
        );
    }
};