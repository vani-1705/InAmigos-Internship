// ===== KEYS & CONFIG =====
// ⚠️  API key is injected from config.js (which reads from .env via a build/server step).
//     Never hardcode your API key here. Use window.ENV.GROQ_API_KEY instead.
const DASH_KEY  = 'ia_dashboard';
const MEM_KEY   = 'ia_memory';
const CHATS_KEY = 'ia_chats';

// API key is read from config.js (loaded before this script in index.html)
const GROQ_API_KEY = (window.ENV && window.ENV.GROQ_API_KEY) || '';

const IA_SYSTEM_PROMPT = `You are the InAmigos AI Assistant — the official chatbot of InAmigos Foundation, a youth-led Indian NGO.

KEY FACTS ABOUT INAMIGOS FOUNDATION:
- Founded: September 23, 2020 by Mr. Govind Shukla
- Headquarters: Bilaspur, Chhattisgarh, India
- Type: Section 8 registered NGO
- Certifications: 80G & 12A (tax-exempt donations), CSR-1 registered, NITI Aayog registered, ISO 9001:2015
- Reach: 28 states across India, 50,000+ beneficiaries, 30,000+ interns trained
- Team: 250+ permanent members

SIX FLAGSHIP PROJECTS:
1. Project SEVA – Food distribution, clothing donations, essential supplies for underprivileged
2. Project Bachpanshala – Education support, school supplies, mentorship for underprivileged children
3. Project Udaan – Women empowerment, skill development, career guidance, entrepreneurship
4. Project Prakriti – Tree plantation, cleanliness drives, environmental sustainability
5. Project Jeev – Animal welfare, rescue initiatives, feeding programs
6. Project Vikas – Youth internships, skill building, professional development (30,000+ trained)

CONTACT & LINKS:
- Phone: +91 626 730 9902
- Email: support@inamigosfoundation.org.in
- Website: inamigosfoundation.org.in
- Volunteer form: forms.gle/AB4c1hLaDDmtrKGU7
- Join Team: inamigosfoundation.org.in/became-volunteer
- Donate (Razorpay): rzp.io/l/kWQ87HP
- Instagram: instagram.com/inamigos/
- Facebook: facebook.com/inamigos.inamigos

OUR MISSION: To uplift underprivileged communities through education, skill development, healthcare awareness, environmental sustainability, and social support programs.
OUR VISION: An inclusive society where every individual can learn, grow, and achieve their potential regardless of background.

CORE VALUES: Compassion, Integrity, Inclusion, Sustainability, Empowerment.

Answer helpfully, warmly, and with enthusiasm about InAmigos. Keep replies concise but informative. Use bullet points where helpful. Always end with an encouraging note or a call to action. If you don't know something specific, direct them to contact@inamigosfoundation.org.in.`;

// ===== STORAGE HELPERS =====
function getDash() {
  let d = JSON.parse(localStorage.getItem(DASH_KEY) || 'null');
  if (!d) d = { since: new Date().toLocaleDateString(), visits: 0, chats: 0, activity: [] };
  return d;
}
function saveDash(d) { localStorage.setItem(DASH_KEY, JSON.stringify(d)); }
function logActivity(msg) {
  const d = getDash();
  d.activity.unshift({ msg, time: new Date().toLocaleString() });
  if (d.activity.length > 40) d.activity = d.activity.slice(0, 40);
  saveDash(d);
}
function incVisit() { const d = getDash(); d.visits++; saveDash(d); logActivity('Visited the website'); }
function incChat()  { const d = getDash(); d.chats++;  saveDash(d); }

function getSavedChats() { return JSON.parse(localStorage.getItem(CHATS_KEY) || '[]'); }
function setSavedChats(c) { localStorage.setItem(CHATS_KEY, JSON.stringify(c)); }

function saveCurrentChat() {
  if (!chatMessages.length) { alert('No chat to save yet!'); return; }
  const chats = getSavedChats();
  const firstUser = chatMessages.find(m => m.role === 'user');
  const title = firstUser ? firstUser.text.slice(0, 48) : 'Conversation';
  chats.unshift({ id: Date.now(), title, date: new Date().toLocaleString(), messages: chatMessages.slice() });
  setSavedChats(chats);
  renderSavedChats();
  logActivity('Saved a chat: "' + title.slice(0, 30) + '"');
  alert('✅ Chat saved to Memory!');
}

function deleteSavedChat(id) {
  if (!confirm('Delete this chat?')) return;
  setSavedChats(getSavedChats().filter(c => c.id !== id));
  renderSavedChats();
}

function openSavedChat(id) {
  const chat = getSavedChats().find(c => c.id === id);
  if (!chat) return;
  chatMessages = chat.messages.slice();
  chatOpen = true;
  document.getElementById('chatPanel').classList.add('open');
  renderChatUI();
  setTimeout(() => {
    const box = document.getElementById('chatMsgs');
    if (box) box.scrollTop = box.scrollHeight;
  }, 80);
}

function renderSavedChats() {
  const container = document.getElementById('savedChatsList');
  if (!container) return;
  const chats = getSavedChats();
  if (!chats.length) {
    container.innerHTML = '<p class="empty-msg">No saved chats yet.<br>Chat with the AI and tap 💾 Save Chat.</p>';
    return;
  }
  container.innerHTML = '';
  chats.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'chat-item';
    item.innerHTML = `
      <div class="chat-item-info" onclick="openSavedChat(${chat.id})" style="cursor:pointer;">
        <div class="chat-item-title">${chat.title}</div>
        <div class="chat-item-date">🕐 ${chat.date}</div>
      </div>
      <div class="chat-item-btns">
        <button class="btn-open-chat" onclick="openSavedChat(${chat.id})">Open</button>
        <button class="btn-del-chat" onclick="deleteSavedChat(${chat.id})">Delete</button>
      </div>`;
    container.appendChild(item);
  });
}

function startNewChatFromMemory() { startNewChat(); toggleChat(); }

// ===== MEMORY =====
function getMemory() { return JSON.parse(localStorage.getItem(MEM_KEY) || 'null'); }
function setMemory(m) { localStorage.setItem(MEM_KEY, JSON.stringify(m)); }

function saveUserMemory() {
  const m = {
    name:     document.getElementById('memName').value.trim(),
    age:      document.getElementById('memAge').value.trim(),
    email:    document.getElementById('memEmail').value.trim(),
    interest: document.getElementById('memInterest').value,
    saved:    new Date().toLocaleDateString()
  };
  setMemory(m);
  const msg = document.getElementById('memorySavedMsg');
  msg.textContent = '✅ Saved! AI Assistant will remember you.';
  logActivity('Updated personal details in Memory');
  setTimeout(() => { msg.textContent = ''; }, 3500);
}

function loadMemoryForm() {
  const m = getMemory();
  if (!m) return;
  document.getElementById('memName').value     = m.name     || '';
  document.getElementById('memAge').value      = m.age      || '';
  document.getElementById('memEmail').value    = m.email    || '';
  document.getElementById('memInterest').value = m.interest || '';
}

// ===== NAVIGATION =====
function showSection(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-page') === id);
  });
  window.scrollTo(0, 0);
  if (id === 'memory') { loadMemoryForm(); renderSavedChats(); }
  logActivity('Visited ' + id + ' page');
}

function toggleMobile() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMobile()  { document.getElementById('mobileMenu').classList.remove('open'); }

// ===== DONATE MODAL =====
function openDonateModal()  { document.getElementById('donateModal').classList.add('open'); }
function closeDonateModal() { document.getElementById('donateModal').classList.remove('open'); }
document.getElementById('donateModal').addEventListener('click', function(e) {
  if (e.target === this) closeDonateModal();
});

// ===== FAQs =====
function toggleFaq(el) {
  const ans = el.nextElementSibling;
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-q').forEach(q => {
    q.classList.remove('open');
    q.nextElementSibling.classList.remove('open');
  });
  if (!isOpen) {
    el.classList.add('open');
    ans.classList.add('open');
  }
}

// ===== CONTACT FORM =====
function submitContactForm() {
  const name = document.getElementById('cfName').value.trim();
  const email = document.getElementById('cfEmail').value.trim();
  const msg = document.getElementById('cfMsg').value.trim();
  if (!name || !email || !msg) { alert('Please fill in all fields.'); return; }
  const success = document.getElementById('cfSuccess');
  success.style.display = 'block';
  document.getElementById('cfName').value = '';
  document.getElementById('cfEmail').value = '';
  document.getElementById('cfSubject').value = '';
  document.getElementById('cfMsg').value = '';
  logActivity('Submitted contact form');
  setTimeout(() => { success.style.display = 'none'; }, 4000);
}

// ===== AI CHAT =====
let chatMessages = [];
let chatOpen = false;

function openChat() {
  chatOpen = true;
  document.getElementById('chatPanel').classList.add('open');
  if (!chatMessages.length) greetUser();
}
function closeChat() {
  chatOpen = false;
  document.getElementById('chatPanel').classList.remove('open');
}
function toggleChat() { chatOpen ? closeChat() : openChat(); }

function greetUser() {
  const mem = getMemory();
  const greeting = mem && mem.name
    ? `Namaste, ${mem.name}! 🙏 Welcome back to InAmigos! You were interested in ${mem.interest || 'our programs'}. How can I help you today?`
    : 'Namaste! 🙏 I am the InAmigos AI Assistant. Ask me about our projects, volunteering, internships, donations, or anything about InAmigos Foundation!';
  chatMessages = [{ role: 'ai', text: greeting }];
  renderChatUI();
}

function startNewChat() {
  chatMessages = [];
  greetUser();
  logActivity('Started a new AI chat');
}

function renderChatUI() {
  const box = document.getElementById('chatMsgs');
  box.innerHTML = '';
  chatMessages.forEach(m => {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (m.role === 'user' ? 'user' : 'ai');
    div.textContent = m.text;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

function appendMsg(role, text) {
  chatMessages.push({ role, text });
  const box = document.getElementById('chatMsgs');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + (role === 'user' ? 'user' : 'ai');
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

async function sendMsg() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.disabled = true;

  appendMsg('user', text);
  incChat();
  logActivity('Sent AI message: "' + text.slice(0, 40) + '"');

  const typingDiv = appendMsg('ai', 'Typing...');
  typingDiv.className = 'chat-msg typing';

  try {
    const messages = chatMessages
      .filter(m => m.text !== 'Typing...')
      .slice(0, -1)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

    messages.push({ role: 'user', content: text });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 600,
        messages: [
          { role: 'system', content: IA_SYSTEM_PROMPT },
          ...messages
        ]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'API error');
    }

    const data = await res.json();
    let reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Empty response');

    typingDiv.className = 'chat-msg ai';
    typingDiv.textContent = reply;
    chatMessages[chatMessages.length - 1] = { role: 'ai', text: reply };

  } catch (err) {
    console.error('AI error:', err);
    typingDiv.className = 'chat-msg ai';
    typingDiv.textContent = 'Sorry, the AI is temporarily unavailable. Please contact us directly at support@inamigosfoundation.org.in or call +91 626 730 9902 💛';
    chatMessages[chatMessages.length - 1] = { role: 'ai', text: typingDiv.textContent };
  }

  input.disabled = false;
  input.focus();
  document.getElementById('chatMsgs').scrollTop = document.getElementById('chatMsgs').scrollHeight;
}

// ===== INIT =====
incVisit();
showSection('home');
