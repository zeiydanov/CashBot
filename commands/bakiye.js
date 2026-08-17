const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const economy = require('../utils/economy');

module.exports = {

    data: new SlashCommandBuilder()

        .setName('bakiye')

        .setDescription(
            'Cash bakiyeni gösterir.'
        )

        .addUserOption(option =>
            option
                .setName('kullanici')
                .setDescription(
                    'Bakiyesini görmek istediğin kullanıcı'
                )
                .setRequired(false)
        ),

    async execute(interaction) {

        const user =
            interaction.options.getUser('kullanici') ||
            interaction.user;

        // SADECE economy.json oku
        const data =
            economy.loadEconomy();

        // Kullanıcı economy.json içinde yoksa 0
        const userData =
            data[user.id];

        const balance =
            userData
                ? Number(userData.money) || 0
                : 0;

        const embed =
            new EmbedBuilder()

                .setColor(0x57F287)

                .setTitle(
                    '💰 CASH BAKİYESİ'
                )

                .setDescription(

                    `👤 **Kullanıcı:** ${user}\n\n` +

                    `💵 **Bakiye:** \`${balance.toLocaleString('tr-TR')} Cash\``

                )

                .setThumbnail(
                    user.displayAvatarURL({
                        dynamic: true
                    })
                )

                .setFooter({
                    text:
                        'CashBot • Economy'
                })

                .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};