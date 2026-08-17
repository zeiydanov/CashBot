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

        console.log('==============================');
        console.log('🎭 /rolbilgi çalıştı!');
        console.log(`👤 Kullanıcı: ${interaction.user.tag}`);
        console.log(`🏠 Sunucu: ${interaction.guild.name}`);

        const role = interaction.options.getRole('rol');

        console.log(`🎯 Rol: ${role.name}`);
        console.log(`🆔 Rol ID: ${role.id}`);
        console.log(`👥 Cache üye sayısı: ${role.members.size}`);

        await interaction.reply({
            content: '⏳ Rol bilgileri hazırlanıyor...'
        });

        try {

            const roleMembers = role.members;

            const sortedMembers = [...roleMembers.values()]
                .sort((a, b) =>
                    a.displayName.localeCompare(
                        b.displayName,
                        'tr'
                    )
                );

            const memberCount = sortedMembers.length;

            console.log(`✅ Role sahip üye sayısı: ${memberCount}`);

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

            // Discord açıklama limiti
            if (memberList.length > 3500) {

                const visibleMembers = [];

                let currentLength = 0;

                for (let i = 0; i < sortedMembers.length; i++) {

                    const line =
                        `${i + 1}. ${sortedMembers[i]}\n`;

                    if (
                        currentLength + line.length >
                        3400
                    ) {
                        break;
                    }

                    visibleMembers.push(line);

                    currentLength += line.length;
                }

                const remaining =
                    memberCount -
                    visibleMembers.length;

                memberList =
                    visibleMembers.join('') +
                    `\n... ve **${remaining} kişi daha** var.`;

            }

            const embed =
                new EmbedBuilder()

                    .setColor(
                        role.color || 0x5865F2
                    )

                    .setTitle(
                        `🎭 ${role.name}`
                    )

                    .setDescription(
                        `👥 **Toplam:** \`${memberCount}\` kişi\n\n` +
                        `👤 **Role Sahip Üyeler:**\n${memberList}`
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

                content: null,

                embeds: [
                    embed
                ]

            });

            console.log('✅ /rolbilgi başarıyla tamamlandı.');
            console.log('==============================');

        } catch (error) {

            console.error(
                '❌ /rolbilgi HATASI:',
                error
            );

            await interaction.editReply({

                content:
                    '❌ Rol bilgileri alınırken hata oluştu.',

                embeds: []

            });
        }
    }
};
```
