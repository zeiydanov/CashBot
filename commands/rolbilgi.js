const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolbilgi')
        .setDescription('Bir role sahip kisileri gosterir.')
        .addRoleOption(option =>
            option
                .setName('rol')
                .setDescription('Uyelerini gormek istedigin rolu sec.')
                .setRequired(true)
        ),

    async execute(interaction) {

        const role = interaction.options.getRole('rol');

        await interaction.deferReply();

        try {

            const members = await interaction.guild.members.fetch();

            const roleMembers = members.filter(member =>
                member.roles.cache.has(role.id)
            );

            const sortedMembers = Array.from(roleMembers.values())
                .sort((a, b) =>
                    a.displayName.localeCompare(b.displayName)
                );

            const memberCount = sortedMembers.length;

            console.log('=================================');
            console.log('ROL BILGI');
            console.log('Rol: ' + role.name);
            console.log('Rol ID: ' + role.id);
            console.log('Uye sayisi: ' + memberCount);
            console.log('Sorgulayan: ' + interaction.user.tag);
            console.log('=================================');

            if (memberCount === 0) {

                const emptyEmbed =
                    new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle('Rol Bilgisi')
                        .setDescription(
                            'Rol: <@&' +
                            role.id +
                            '>\n\n' +
                            'Bu role sahip kimse bulunamadi.'
                        )
                        .setFooter({
                            text: 'CashBot'
                        })
                        .setTimestamp();

                await interaction.editReply({
                    embeds: [emptyEmbed]
                });

                return;
            }

            const lines = sortedMembers.map((member, index) => {

                return (
                    (index + 1) +
                    '. ' +
                    member.user.username +
                    ' - ' +
                    member
                );

            });

            let description =
                'Rol: <@&' +
                role.id +
                '>\n\n' +
                'Toplam: **' +
                memberCount +
                ' kisi**\n\n' +
                '**Role Sahip Uyeler:**\n';

            const maxLength = 3800;

            for (const line of lines) {

                if (
                    description.length +
                    line.length +
                    1 >
                    maxLength
                ) {

                    description +=
                        '\n\nListe cok uzun oldugu icin tamamı gosterilemedi.';

                    break;
                }

                description += line + '\n';
            }

            const embed =
                new EmbedBuilder()
                    .setColor(
                        role.color || 0x5865F2
                    )
                    .setTitle(
                        'Rol Bilgisi - ' +
                        role.name
                    )
                    .setDescription(
                        description
                    )
                    .addFields(
                        {
                            name: 'Toplam Uye',
                            value:
                                String(memberCount),
                            inline: true
                        },
                        {
                            name: 'Rol ID',
                            value:
                                role.id,
                            inline: true
                        }
                    )
                    .setFooter({
                        text:
                            'CashBot - Rol Bilgi'
                    })
                    .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(
                'ROL BILGI HATASI:',
                error
            );

            await interaction.editReply({

                content:
                    'Rol uyeleri alinirken hata olustu. ' +
                    'Botun Server Members Intent ayarini kontrol et.'

            });
        }
    }
};