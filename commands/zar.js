const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zar')
        .setDescription('Şansını dene ve zar at!')
        .addIntegerOption(option =>
            option
                .setName('adet')
                .setDescription('Atılacak zar sayısı (1-10)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        ),

    async execute(interaction) {

        const cashRoleId = process.env.DICE_ROLE_ID;
        const homieRoleId = process.env.DICE_ROLE_ID_2;

        const isAdmin =
            interaction.member.permissions.has(
                PermissionFlagsBits.Administrator
            );

        const hasCashRole =
            cashRoleId &&
            interaction.member.roles.cache.has(cashRoleId);

        const hasHomieRole =
            homieRoleId &&
            interaction.member.roles.cache.has(homieRoleId);

        // Cash VEYA Homie VEYA Administrator
        if (!isAdmin && !hasCashRole && !hasHomieRole) {
            return interaction.reply({
                content:
                    '❌ Bu komutu kullanmak için **Cash**, **Homie** rolüne veya **Administrator** yetkisine sahip olmalısın.',
                ephemeral: true
            });
        }

        const adet =
            interaction.options.getInteger('adet') || 1;

        const zarlar = [];

        for (let i = 0; i < adet; i++) {
            zarlar.push(
                Math.floor(Math.random() * 6) + 1
            );
        }

        const toplam = zarlar.reduce(
            (sum, zar) => sum + zar,
            0
        );

        const sonuc = zarlar
            .map((zar, index) =>
                `🎲 **Zar ${index + 1}:** ${zar}`
            )
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🎲 CASHBOT ZAR')
            .setDescription(
                `**${interaction.user.username}** zar attı!\n\n` +
                `${sonuc}\n\n` +
                `➕ **Toplam: ${toplam}**`
            )
            .setFooter({
                text: 'CashBot • Zar Sistemi'
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};