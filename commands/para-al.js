const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const economy = require('../utils/economy');

module.exports = {

    data: new SlashCommandBuilder()

        .setName('para-al')

        .setDescription(
            'Bir kullanıcıdan Cash alır.'
        )

        .addUserOption(option =>
            option
                .setName('kullanici')
                .setDescription(
                    'Cash alınacak kullanıcı'
                )
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('miktar')
                .setDescription(
                    'Alınacak Cash miktarı'
                )
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction) {

        // ==========================================
        // YETKİ KONTROLÜ
        // ==========================================

        if (
            !interaction.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {

            return interaction.reply({

                content:
                    '❌ Bu komutu sadece **Administrator** yetkisine sahip yetkililer kullanabilir.',

                ephemeral: true
            });
        }

        // ==========================================
        // BİLGİLER
        // ==========================================

        const user =
            interaction.options.getUser(
                'kullanici'
            );

        const amount =
            interaction.options.getInteger(
                'miktar'
            );

        // ==========================================
        // PARA AL
        // ==========================================

        const result =
            economy.removeMoney(
                user.id,
                amount
            );

        // ==========================================
        // BAŞARISIZ
        // ==========================================

        if (!result.success) {

            return interaction.reply({

                content:

                    `❌ **${user.username}** kullanıcısından ${amount.toLocaleString('tr-TR')} Cash alınamadı.\n\n` +

                    `💰 Mevcut bakiye: \`${result.balance.toLocaleString('tr-TR')} Cash\``,

                ephemeral: true
            });
        }

        // ==========================================
        // BAŞARILI
        // ==========================================

        const embed =
            new EmbedBuilder()

                .setColor(0xED4245)

                .setTitle(
                    '💸 PARA ALINDI'
                )

                .setDescription(

                    `👤 **Kullanıcı:** ${user}\n\n` +

                    `💰 **Alınan:** \`${amount.toLocaleString('tr-TR')} Cash\`\n\n` +

                    `💵 **Yeni bakiye:** \`${result.balance.toLocaleString('tr-TR')} Cash\``
                )

                .setFooter({

                    text:
                        `İşlemi yapan: ${interaction.user.tag}`

                })

                .setTimestamp();

        return interaction.reply({

            embeds: [
                embed
            ]
        });
    }
};