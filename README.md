# 📍 Whisper of Memory

**Whisper** is an anonymous voice-based social platform that lets users record and share memories using their voice, tied to real-world locations on a map. Each voice is a “whisper” — a short, emotional message, story, or confession, left anonymously for others to discover.

---

## 🚀 Features

- 🎙️ **Voice Pinning**: Record and pin a voice message to your current location on the map.
- 🗺️ **Emotional Map**: Explore voice pins shared by others around you.
- 🎭 **Anonymity**: Users remain anonymous when sharing or listening to voices.
- 🎧 **Random Discovery**: Listen to a random voice pinned nearby (within 100 meters) or from anywhere in the system.
- 💬 **Comment & Reply**: Interact with voice messages through voice/text comments and replies.
- 🧡 **Emotional Reactions**: React with stickers or emojis based on how the voice makes you feel.
- 👥 **Anonymous Friendship**: Send and accept friend requests without revealing identity.
- 📊 **User Stats**: Track your activity, emotional impact, and user interactions.

---

## 🛠️ Tech Stack

| Component     | Technology            |
|---------------|------------------------|
| **Frontend**  | Next.js / React Native |
| **Backend**   | NestJS (REST API)      |
| **Database**  | PostgreSQL + Prisma    |
| **Maps**      | Mapbox API             |
| **Auth**      | JWT / OAuth            |
| **Audio Storage** | AWS S3 / Firebase Storage |
| **Emotion Detection** | (Optional) AI model or user-selected emotion stickers |

---

## 🏁 Quick Setup (Local)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/whisper-app.git

# 2. Install dependencies
cd whisper-app
npm install

# 3. Configure environment variables
cp .env.example .env
# Update your DB

# 4. Start development server
npm run dev
