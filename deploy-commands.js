require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

const commandsPath = path.join(__dirname, 'commands');

const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (command.data && command.execute) {
        commands.push(command.data.toJSON());
    }
}

console.log(`📦 Bulunan komut sayısı: ${commands.length}`);

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// İki sunucunun ID'sini al
const guildIds = [
    process.env.GUILD_ID,
    process.env.GUILD_ID_2
].filter(Boolean);

(async () => {
    try {
        console.log(`🔄 ${guildIds.length} sunucuda slash komutları yenileniyor...`);

        for (const guildId of guildIds) {
            console.log(`📡 Sunucuya yükleniyor: ${guildId}`);

            await rest.put(
                Routes.applicationGuildCommands(
                    process.env.CLIENT_ID,
                    guildId
                ),
                {
                    body: commands
                }
            );

            console.log(`✅ Komutlar yüklendi: ${guildId}`);
        }

        console.log('🎉 Tüm sunucularda slash komutları başarıyla yenilendi!');
    } catch (error) {
        console.error('❌ HATA:');
        console.error(error);
    }
})();