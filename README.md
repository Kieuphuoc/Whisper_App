![fe-profile](https://github.com/user-attachments/assets/d3c8fcf1-b8a6-4b84-ab90-6dd46e38ba17)![fe-cluster](https://github.com/user-attachments/assets/3b765756-ec7c-406b-a944-1d345267526b)# 📍 Whisper of Memory

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
- 
<img width="207" height="448" alt="image" src="https://github.com/user-attachments/assets/de49b0ac-4445-4983-b2f2-2065b6926f92" />
<img width="207" height="448" alt="image" src="https://github.com/user-attachments/assets/36eb3498-13cc-46c8-ae0a-cd16bdfe25a8" />
<img width="207" height="448" alt="image" src="https://github.com/user-attachments/assets/002564b1-dd45-4da6-991c-2dc3c596b748" />
<img width="207" height="448" alt="image" src="https://github.com/user-attachments/assets/d0c3ca32-058f-4e9e-bef3-be8604f7e5b9" />
<img width="207" height="448" alt="image" src="https://github.com/user-attachments/assets/9b993982-113e-46c9-98ee-c32a56a09a6a" />

---

## 🛠️ Tech Stack

| Component     | Technology            |
|---------------|------------------------|
| **Frontend**  | React Native           |
| **Backend**   | NestJS (REST API)      |
| **Database**  | PostgreSQL + Prisma    |
| **Maps**      | React Native Map       |
| **Auth**      | JWT                    |
| **Audio Storage** | Cloudinary              |
| **Emotion Detection** | (Optional) AI model or user-selected emotion stickers |

---

## 🏁 Quick Setup (Local)

```bash
# 1. Clone the repository
git clone https://github.com/Kieuphuoc/whisper-app.git

# 2. Install dependencies
cd whisper-app
npm install

# 3. Configure environment variables
cp .env.example .env
# Update your DB

# 4. Start development server
npm start
