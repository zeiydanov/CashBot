const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('CashBot bağlantısını kontrol eder.'),

    async execute(interaction) {
        await interaction.reply(`🏓 Pong! Gecikme: ${interaction.client.ws.ping}ms`);
    }
};