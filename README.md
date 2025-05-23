<div align="center">
  <img src="./banner/mixxai.png" alt="MixxAI - Advanced AI Conversation Platform built on Strapi CMS" width="100%"/>
  <h1>MixxAI - Advanced AI Conversation Platform</h1>
  <p>🤖 Powerful | ⚡ Fast | 🔒 Secure | 🌐 Scalable</p>
  
  <p>
    <a href="https://github.com/witwork/mixxai/stargazers">
      <img src="https://img.shields.io/github/stars/witworkapp/mixxai?style=for-the-badge" alt="Stars" />
    </a>
    <a href="https://github.com/witwork/mixxai/network/members">
      <img src="https://img.shields.io/github/forks/witworkapp/mixxai?style=for-the-badge" alt="Forks" />
    </a>
    <a href="https://github.com/witwork/mixxai/issues">
      <img src="https://img.shields.io/github/issues/witworkapp/mixxai?style=for-the-badge" alt="Issues" />
    </a>
    <a href="https://witworkapp.com">
      <img src="https://img.shields.io/badge/Website-WitWork-blue?style=for-the-badge" alt="Website" />
    </a>
    <a href="https://strapi.io">
      <img src="https://img.shields.io/badge/Powered%20by-Strapi-8e75ff?style=for-the-badge&logo=strapi&logoColor=white" alt="Powered by Strapi" />
    </a>
  </p>
</div>

## 📋 Overview

**MixxAI** is a complete AI conversation platform built on [Strapi CMS](https://strapi.io) that lets you seamlessly integrate powerful chatbot capabilities into your applications. Built with performance, security, and scalability in mind, MixxAI helps businesses deliver exceptional conversational experiences through a customized headless CMS approach.

### Key Features

- ✅ **Multiple AI Models Integration** - OpenAI GPT, Google Gemini, and more
- ✅ **Complete User Management** - Authentication, permissions, and roles
- ✅ **Subscription System** - Apple In-App Purchase support built-in
- ✅ **Conversation History** - Store and analyze all interactions
- ✅ **Enterprise Security** - Data encryption and privacy controls
- ✅ **Easy Deployment** - One-click installation via Docker
- ✅ **Strapi-Powered** - Built on the leading open-source headless CMS

## 🚀 Quick Installation

Get your MixxAI server running with our automated installation script:

```bash
wget -O mixxai.sh https://raw.githubusercontent.com/witwork/mixxai/main/mixxai.sh && sudo bash mixxai.sh
```

### System Requirements

- **OS**: Ubuntu 24.04 LTS
- **CPU**: 2+ cores recommended
- **RAM**: 1GB minimum (2GB+ recommended)
- **Storage**: 10GB free disk space
- **Privileges**: Root or sudo access
- **Network**: Internet connection

## ⚙️ Manual Installation Options

### Docker Installation

```bash
# Create project directory
mkdir -p ~/mixxai-server && cd ~/mixxai-server

# Create and edit docker-compose.yml and .env files
# Then run:
docker-compose up -d
```

### Source Code Installation

```bash
git clone https://github.com/witwork/mixxai.git
cd mixxai
yarn install
yarn build
yarn start
```

### Environment Configuration

MixxAI requires proper environment variables configuration for optimal operation. Create a `.env` file in your project directory with the following structure:

```
# Database Configuration
DATABASE_CLIENT=postgres
DATABASE_NAME=mixxai_db
DATABASE_USERNAME=your_database_user
DATABASE_PASSWORD=strong_password_here

# Server Configuration
HOST=0.0.0.0
PORT=1337

# Security Keys (Generate random secure strings)
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=random_string_here
ADMIN_JWT_SECRET=random_string_here
TRANSFER_TOKEN_SALT=random_string_here

# Email Configuration (Optional)
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_HOST=smtp.provider.com
SMTP_PORT=587

# Apple Subscription (Optional)
APPLE_SHARED_SECRET=your_apple_shared_secret
```

#### Generating Secure Keys

For security, generate random strings for your keys:

```bash
# On Linux/macOS
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|:--------:|
| `DATABASE_CLIENT` | Database type (postgres) | ✅ |
| `DATABASE_NAME` | Database name | ✅ |
| `DATABASE_USERNAME` | Database user | ✅ |
| `DATABASE_PASSWORD` | Database password | ✅ |
| `HOST` | Host to bind the server | ✅ |
| `PORT` | Port to bind the server | ✅ |
| `APP_KEYS` | Used to encrypt cookies | ✅ |
| `API_TOKEN_SALT` | Used to generate API tokens | ✅ |
| `ADMIN_JWT_SECRET` | Used to authenticate admin users | ✅ |
| `TRANSFER_TOKEN_SALT` | Used for data transfer tokens | ✅ |
| `SMTP_USERNAME` | SMTP username for sending emails | ❌ |
| `SMTP_PASSWORD` | SMTP password | ❌ |
| `SMTP_HOST` | SMTP host | ❌ |
| `SMTP_PORT` | SMTP port | ❌ |
| `APPLE_SHARED_SECRET` | Secret key for Apple IAP validation | ❌ |


## 📚 Documentation

- [API Documentation](https://docs.witworkapp.com/mixxai/api)
- [Configuration Guide](https://docs.witworkapp.com/mixxai/config)
- [Integration Examples](https://docs.witworkapp.com/mixxai/examples)
- [Security Best Practices](https://docs.witworkapp.com/mixxai/security)
- [Strapi Documentation](https://docs.strapi.io)

## 🏢 About WitWork

<div align="center">
  <img src="./banner/wwa.png" alt="WitWork - AI & App Development Solutions" width="70%"/>
</div>

WitWork specializes in creating AI-powered solutions and mobile applications that solve real business problems. Our team combines technical expertise with a deep understanding of user experience to deliver products that exceed expectations.

## 🌟 Our Products

<div align="center">
  <table>
    <tr>
      <td align="center" width="50%">
        <img src="./banner/witvpn.png" alt="WitVPN - super fast, secure, stable & free VPN proxy for Android and iOS" width="80%"/><br/>
        <h3>WitVPN</h3>
        <p>WitVPN - super fast, secure, stable & free VPN proxy for Android and iOS</p>
        <p>
          <a href="https://codecanyon.net/item/witvpn-super-fast-secure-stable-free-vpn-proxy-for-ios/36750397">iOS App</a> | 
          <a href="https://codecanyon.net/item/witvpn-super-fast-secure-stable-free-vpn-proxy-for-android/28944594">Android App</a>
        </p>
      </td>
      <td align="center" width="50%">
        <img src="./banner/strongvpn.png" alt="StrongVPN - IKEv2 Source Code on Custom VPS for Android and iOS" width="80%"/><br/>
        <h3>StrongVPN</h3>
        <p>StrongVPN - IKEv2 Source Code on Custom VPS for Android and iOS</p>
        <p>
          <a href="https://witworkapp.gumroad.com/l/StrongVPN-IKEv2-Android">Android App</a> | 
          <a href="https://witworkapp.gumroad.com/l/StrongVPN-IKEv2-iOS">iOS App</a>
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <img src="./banner/mixxai.png" alt="MixxAI - Advanced AI Conversation Platform" width="80%"/><br/>
        <h3>MixxAI</h3>
        <p>Advanced AI Conversation Platform</p>
        <p>
          <a href="https://github.com/witwork/mixxai">GitHub Repo</a>
        </p>
      </td>
      <td align="center" width="50%">
        <img src="./banner/witbooster.png" alt="WitBooster - TikTok Followers Growth Tool" width="80%"/><br/>
        <h3>WitBooster</h3>
        <p>TikTok Followers Growth Tool</p>
        <p>
          <a href="https://codecanyon.net/item/witbooster-free-app-to-grow-real-tiktok-video-followers-for-android/29953109">Android App</a>
        </p>
      </td>
    </tr>
  </table>
</div>

## 📞 Contact & Support

<div align="center">
  <h3>🌐 Follow Us</h3>
  <p>
    <a href="https://witworkapp.com">
      <img src="https://img.shields.io/badge/Website-witworkapp.com-blue?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Website" />
    </a>
    <a href="mailto:hello@witworkapp.com">
      <img src="https://img.shields.io/badge/Email-hello@witworkapp.com-red?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" />
    </a>
  </p>
  
  <h3>🔗 Social Media</h3>
  <p>
    <a href="https://www.facebook.com/witworkapp">
      <img src="https://img.shields.io/badge/Facebook-witworkapp-1877F2?style=for-the-badge&logo=facebook&logoColor=white" alt="Facebook" />
    </a>
    <a href="https://www.instagram.com/witworkapp/">
      <img src="https://img.shields.io/badge/Instagram-@witworkapp-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" />
    </a>
    <a href="https://twitter.com/witworkapp">
      <img src="https://img.shields.io/badge/Twitter-@witworkapp-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter" />
    </a>
  </p>
  <p>
    <a href="https://www.tiktok.com/@wit_work_app">
      <img src="https://img.shields.io/badge/TikTok-@wit__work__app-000000?style=for-the-badge&logo=tiktok&logoColor=white" alt="TikTok" />
    </a>
    <a href="https://www.threads.com/@witworkapp">
      <img src="https://img.shields.io/badge/Threads-@witworkapp-000000?style=for-the-badge&logo=threads&logoColor=white" alt="Threads" />
    </a>
  </p>
  
  <h3>👩‍💻 Developer Platforms</h3>
  <p>
    <a href="https://github.com/witwork">
      <img src="https://img.shields.io/badge/GitHub-witworkapp-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
    </a>
    <a href="https://dribbble.com/WitWorkApp">
      <img src="https://img.shields.io/badge/Dribbble-WitWorkApp-EA4C89?style=for-the-badge&logo=dribbble&logoColor=white" alt="Dribbble" />
    </a>
  </p>
  
  <h3>🛒 Marketplaces</h3>
  <p>
    <a href="https://codecanyon.net/user/witworkapp/portfolio">
      <img src="https://img.shields.io/badge/CodeCanyon-Portfolio-7FC400?style=for-the-badge&logo=envato&logoColor=white" alt="CodeCanyon" />
    </a>
    <a href="https://witworkapp.gumroad.com/">
      <img src="https://img.shields.io/badge/Gumroad-witworkapp-FF90E8?style=for-the-badge&logo=gumroad&logoColor=white" alt="Gumroad" />
    </a>
  </p>
</div>

## 🔧 System Architecture

MixxAI extends Strapi's content management capabilities with custom AI conversation features including:

- AI model integrations (OpenAI GPT, Google Gemini)
- Enhanced user management and authentication
- Subscription handling with Apple In-App Purchase support
- Real-time conversation processing and analysis
- Data security and privacy controls

## 📄 License

MixxAI is available under the MIT License. See the [LICENSE](LICENSE) file for more information.

## 🙏 Acknowledgments

MixxAI is built on [Strapi](https://strapi.io), the leading open-source headless CMS. We acknowledge and thank the Strapi team for their excellent work.

---

<div align="center">
  <p>© 2024 WitWork. All rights reserved.</p>
  <p>
    <a href="https://witworkapp.com/privacy">Privacy Policy</a> | 
    <a href="https://witworkapp.com/terms">Terms of Service</a>
  </p>
</div>