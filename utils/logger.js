const { EmbedBuilder } = require('discord.js');

async function sendLog(client, {
    action,
    user,
    moderator,
    reason,
    details
}) {
    try {
        const channelId = process.env.LOG_CHANNEL_ID;

        if (!channelId) {
            console.log('⚠️ LOG_CHANNEL_ID .env içinde bulunamadı.');
            return;
        }

        const channel = await client.channels.fetch(channelId).catch(() => null);

        if (!channel) {
            console.log('⚠️ Log kanalı bulunamadı.');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`📋 Moderasyon Log — ${action}`)
            .addFields(
                {
                    name: '👤 Kullanıcı',
                    value: user ? `${user.tag}\n\`${user.id}\`` : 'Bilinmiyor',
                    inline: true
                },
                {
                    name: '👮 Yetkili',
                    value: moderator
                        ? `${moderator.tag}\n\`${moderator.id}\``
                        : 'Bilinmiyor',
                    inline: true
                },
                {
                    name: '📝 Sebep',
                    value: reason || 'Sebep belirtilmedi.',
                    inline: false
                }
            )
            .setTimestamp();

        if (details) {
            embed.addFields({
                name: 'ℹ️ Detay',
                value: details,
                inline: false
            });
        }

        await channel.send({
            embeds: [embed]
        });

    } catch (error) {
        console.error('❌ Log gönderilemedi:', error);
    }
}

module.exports = { sendLog };