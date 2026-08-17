```js
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

        // Cevabı hemen başlat
        await interaction.deferReply();

        try {

            // Cache'deki üyelerden role sahip olanları bul
            const roleMembers = role.members;

            const memberCount = roleMembers.size;

            // Üyeleri isme göre sırala
            const sortedMembers = [...roleMembers.values()]
                .sort((a, b) =>
                    a.displayName.localeCompare(
                        b.displayName,
                        'tr'
                    )
                );

            let memberList;

            if (memberCount === 0) {

                memberList =
                    '❌ Bu role sahip kimse bulunamadı.';

            } else {

                memberList = sortedMembers
                    .map(
                        (member, index) =>
                            `${index + 1}. ${member}`
                    )
                    .join('\n');

            }

            // Discord embed açıklaması maksimum 4096 karakter
            if (memberList.length > 3600) {

                const visibleMembers = [];

                let currentLength = 0;

                for (let i = 0; i < sortedMembers.length; i++) {

                    const line =
                        `${i + 1}. ${sortedMembers[i]}\n`;

                    if (
                        currentLength +
                        line.length >
                        3500
                    ) {
                        break;
                    }

                    visibleMembers.push(line);

                    currentLength += line.length;
                }

                memberList =
                    visibleMembers.join('') +
                    `\n... ve **${memberCount - visibleMembers.length} kişi daha** var.`;
            }

            const embed =
                new EmbedBuilder()

                    .setColor(
                        role.color || 0x5865F2
                    )

                    .setTitle(
                        `🎭 ${role.name} Rol Bilgisi`
                    )

                    .setDescription(
                        `👥 **Toplam Üye:** \`${memberCount}\` kişi\n\n` +

                        `👤 **Role Sahip Üyeler:**\n` +

                        memberList
                    )

                    .addFields({

                        name: '🆔 Rol ID',

                        value:
                            `\`${role.id}\``,

                        inline: true

                    })

                    .addFields({

                        name: '🎨 Rol Rengi',

                        value:
                            role.hexColor,

                        inline: true

                    })

                    .setFooter({

                        text:
                            `CashBot • ${interaction.guild.name}`

                    })

                    .setTimestamp();

            await interaction.editReply({

                embeds: [
                    embed
                ]

            });

        } catch (error) {

            console.error(
                '❌ Rol bilgi hatası:',
                error
            );

            await interaction.editReply({

                content:
                    '❌ Rol bilgileri alınırken bir hata oluştu.'

            });

        }
    }
};
```
