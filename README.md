# Telegram to WhatsApp Message Forwarder

A Node.js script that automatically forwards messages from Telegram channels/groups to WhatsApp groups using a WhatsApp API gateway.

## Features

- 🔄 **Automatic Forwarding**: Forwards messages from Telegram to WhatsApp in real-time
- 🛡️ **Access Control**: Restrict forwarding to specific Telegram chat IDs
- 📱 **Multi-Platform Support**: Works with Telegram channels, groups, and supergroups
- 🚀 **Production Ready**: Includes PM2 ecosystem configuration for deployment
- 📝 **Rich Message Support**: Handles text messages, captions, and various message types
- ⚡ **High Performance**: Built with Telegraf for efficient Telegram Bot API handling

## Prerequisites

Before setting up this project, you'll need:

- **Node.js** (v16 or higher)
- **Telegram Bot Token** - Create a bot via [@BotFather](https://t.me/botfather)
- **WhatsApp API Gateway** - Access to a WhatsApp Business API service
- **WhatsApp Group ID** - The target WhatsApp group where messages will be forwarded

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd forwarder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

## Configuration

Create a `.env` file in the project root with the following variables:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Allowed Telegram Chat IDs (comma-separated, optional)
# Leave empty to forward from all chats
ALLOWED_CHAT_IDS=123456789,-987654321

# WhatsApp API Configuration
WA_API_URL=https://your-whatsapp-api-gateway.com/api/send
WA_API_KEY=your_whatsapp_api_key_here
WA_GROUP_ID=your_whatsapp_group_id_here
```

### Environment Variables Explained

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from @BotFather | ✅ | `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz` |
| `ALLOWED_CHAT_IDS` | Comma-separated list of allowed Telegram chat IDs | ❌ | `123456789,-987654321,555666777` |
| `WA_API_URL` | Your WhatsApp API gateway endpoint | ✅ | `https://api.whatsapp.com/v1/send` |
| `WA_API_KEY` | Authentication key for WhatsApp API | ✅ | `your_api_key_here` |
| `WA_GROUP_ID` | Target WhatsApp group ID | ✅ | `120363025502345678` |

## Usage

### Development Mode

Run the script directly with Node.js:

```bash
node telegram-to-wa.js
```

### Production Mode (Recommended)

Use PM2 for production deployment:

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Monitor the application
pm2 monit

# View logs
pm2 logs tg-wa-bridge

# Restart the application
pm2 restart tg-wa-bridge

# Stop the application
pm2 stop tg-wa-bridge
```

## How It Works

1. **Telegram Bot Setup**: The script creates a Telegram bot instance using your bot token
2. **Message Listening**: Listens for incoming messages and channel posts from Telegram
3. **Access Control**: Filters messages based on `ALLOWED_CHAT_IDS` (if configured)
4. **Message Processing**: Extracts text content from messages and captions
5. **WhatsApp Forwarding**: Sends formatted messages to your WhatsApp API gateway
6. **Logging**: Provides detailed logging for monitoring and debugging

### Message Format

Messages are formatted before forwarding to WhatsApp:

- **Channel Posts**: `📣 [Channel Name]\n[Message Content]`
- **Group Messages**: `💬 [Chat/User Name]\n[Message Content]`

## Security Considerations

- **Environment Variables**: Never commit your `.env` file to version control
- **API Keys**: Keep your API keys secure and rotate them regularly
- **Access Control**: Use `ALLOWED_CHAT_IDS` to restrict which Telegram chats can forward messages
- **Rate Limiting**: Be aware of API rate limits for both Telegram and WhatsApp APIs

## Troubleshooting

### Common Issues

1. **"Missing env vars" error**
   - Ensure all required environment variables are set in your `.env` file
   - Check for typos in variable names

2. **Bot not responding**
   - Verify your Telegram bot token is correct
   - Ensure the bot has been added to the target chats
   - Check bot permissions in the chats

3. **WhatsApp API errors**
   - Verify your WhatsApp API credentials
   - Check if the target group ID is correct
   - Ensure your WhatsApp API service is active

4. **Permission denied errors**
   - Make sure the bot has permission to read messages in the source chats
   - Check if the bot is an admin in the target WhatsApp group

### Logs

The application provides detailed logging:

- **Success logs**: Show successful message forwarding with metadata
- **Error logs**: Display API errors and response details
- **Startup logs**: Confirm successful bot initialization

## Development

### Project Structure

```
forwarder/
├── telegram-to-wa.js      # Main application script
├── ecosystem.config.js     # PM2 configuration
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
├── .env.example          # Environment variables template
└── README.md             # This file
```

### Dependencies

- **telegraf**: Modern Telegram Bot API framework
- **axios**: HTTP client for WhatsApp API calls
- **dotenv**: Environment variable management

### Adding New Features

To extend the functionality:

1. **New Message Types**: Modify the `pickText()` function to handle additional content types
2. **Custom Formatting**: Update the message formatting in `forwardToWA()` calls
3. **Additional APIs**: Add new API integrations alongside the existing WhatsApp forwarding

## License

This project is licensed under the ISC License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the logs for error details
3. Ensure all configuration is correct
4. Open an issue in the repository

## Changelog

### v1.0.0
- Initial release
- Basic Telegram to WhatsApp forwarding
- Support for channels and groups
- Access control via chat IDs
- PM2 production configuration
