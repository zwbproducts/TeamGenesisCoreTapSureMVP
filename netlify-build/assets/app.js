const API = 'http://localhost:8000';
let MOCK = true; // force serverless mode (no backend required)

// Code validation state
let isUnlocked = false;
const VALID_CODES = ['TAPE-2025-PROMO', 'INSURE-NOW-2025', 'COVER-2025-SALE', 'PROTECT-BUNDLE'];

const el = (q) => document.querySelector(q);
const drop = el('#drop');
const fileInput = el('#file');
const analysis = el('#analysis');
const recommend = el('#recommend');
const chatLog = el('#chatLog');
const codeModal = el('#codeModal');
const codeInput = el('#codeInput');
const codeSubmit = el('#codeSubmit');

// Show code modal on load
window.addEventListener('load', () => {
  showCodeModal(true);
});

function showCodeModal(show) {
  codeModal.classList.toggle('hidden', !show);
}

codeSubmit.onclick = () => {
  const code = codeInput.value.trim().toUpperCase();
  if (VALID_CODES.includes(code)) {
    isUnlocked = true;
    codeModal.classList.add('hidden');
    toast('✅ Access granted! You can now upload receipts.');
  } else {
    toast('❌ Invalid code. Please try again.');
    codeInput.value = '';
    codeInput.focus();
  }
};

codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    codeSubmit.click();
  }
});

// category chip state
let selectedCategory = null;

function toast(msg){
	const t = document.createElement('div');
	t.className = 'toast';
	t.textContent = msg;
	document.body.appendChild(t);
	setTimeout(()=>{ t.remove(); }, 2200);
}

function showModal(show){
	el('#howModal').classList.toggle('hidden', !show);
}

el('#howBtn').onclick = () => showModal(true);
['#closeModal','#gotIt'].forEach(id=> el(id).onclick = () => showModal(false));

function setDrag(active){
	drop.classList.toggle('dragover', active);
}

['dragenter','dragover'].forEach(ev=> drop.addEventListener(ev, e=>{ e.preventDefault(); setDrag(true); }));
['dragleave','drop'].forEach(ev=> drop.addEventListener(ev, e=>{ e.preventDefault(); setDrag(false); }));
drop.addEventListener('drop', (e)=>{
	if(e.dataTransfer.files.length){ handleFile(e.dataTransfer.files[0]); }
});
// click drop to open picker
drop.addEventListener('click', ()=>{
	if (!isUnlocked) {
		showCodeModal(true);
		toast('Please enter your access code first.');
		return;
	}
	fileInput.removeAttribute('capture'); // prefer picker when clicking area
	fileInput.click();
});

// camera vs picker buttons
el('#cameraBtn').onclick = ()=> {
	if (!isUnlocked) {
		showCodeModal(true);
		toast('Please enter your access code first.');
		return;
	}
	fileInput.setAttribute('accept','image/*');
	fileInput.setAttribute('capture','environment');
	fileInput.click();
};
el('#chooseBtn').onclick = ()=> {
	if (!isUnlocked) {
		showCodeModal(true);
		toast('Please enter your access code first.');
		return;
	}
	fileInput.setAttribute('accept','image/*');
	fileInput.removeAttribute('capture');
	fileInput.click();
};
fileInput.onchange = ()=>{ if(fileInput.files[0]) handleFile(fileInput.files[0]); };

// make chips interactive to override category
document.querySelectorAll('.chip').forEach(chip=>{
	chip.tabIndex = 0;
	chip.addEventListener('click', ()=>selectChip(chip));
	chip.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); selectChip(chip); } });
});
function selectChip(chip){
	document.querySelectorAll('.chip').forEach(c=> c.classList.remove('active'));
	chip.classList.add('active');
	selectedCategory = chip.textContent.trim();
}

async function handleFile(file){
	analysis.classList.remove('hidden');
	analysis.innerHTML = '<div class="muted">Analyzing receipt...</div>';
	if (MOCK) {
		try {
			const rec = await analyzeInBrowser(file);
			if (selectedCategory) rec.category = selectedCategory;
			renderAnalysis(rec);
			await fetchRecommend(rec);
			return;
		} catch (e) {
			const data = localAnalyze(file);
			if (selectedCategory) data.category = selectedCategory;
			renderAnalysis(data);
			await fetchRecommend(data);
			return;
		}
	}
	const fd = new FormData();
	fd.append('receipt', file);
	try{
		const res = await fetch(`${API}/api/receipt/analyze`, { method:'POST', body:fd });
		const data = await res.json();
		if(!res.ok) throw new Error(data.detail || 'Analyze failed');
		if (selectedCategory) data.category = selectedCategory;
		renderAnalysis(data);
		await fetchRecommend(data);
	}catch(e){
		analysis.innerHTML = `<div class="muted">${e.message}</div>`;
	}
}

function renderAnalysis(d){
	analysis.innerHTML = `
		<h2>Receipt</h2>
		<div class=\"muted\">Merchant: <b>${d.merchant}</b> • Category: <b>${d.category}</b> • Total: <b>$${d.total.toFixed(2)}</b></div>
	`;
}

async function fetchRecommend(receipt){
	recommend.classList.remove('hidden');
	recommend.innerHTML = '<div class="muted">Calculating options...</div>';
	if (MOCK) {
		const data = { options: localOptions(receipt), suggested: null };
		renderOptions(receipt, data);
		return;
	}
	const res = await fetch(`${API}/api/coverage/recommend`, {
		method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(receipt)
	});
	const data = await res.json();
	if(!res.ok){ recommend.innerHTML = `<div class=\"muted\">${data.detail || 'Error'}</div>`; return; }
	renderOptions(receipt, data);
}

function renderOptions(receipt, rec){
	const opts = rec.options.map((o, i)=> `
		<div class=\"option\">
			<div>
				<div><b>${o.protection_type}</b> — ${o.coverage_period}</div>
				<div class=\"muted small\">${o.features.join(', ')}</div>
			</div>
			<div class=\"price\">$${o.premium.toFixed(2)}</div>
			<button class=\"secondary\" data-idx=\"${i}\">Select</button>
		</div>`).join('');
	recommend.innerHTML = `<h2>Coverage Options</h2>${opts}`;
	
	// Show chat section after picture upload & analysis
	const chatSection = el('#chatSection');
	chatSection.classList.remove('hidden');
	initializeChat();
	
	recommend.querySelectorAll('button[data-idx]').forEach(btn=>{
		btn.onclick = async ()=>{
			const idx = +btn.dataset.idx;
			const selected = rec.options[idx];
			if (MOCK) {
				const policyId = Math.random().toString(36).slice(2,10);
				toast(`Policy ${policyId} active — ${selected.coverage_period} at $${selected.premium}`);
				return;
			}
			const res = await fetch(`${API}/api/flow/confirm`, {
				method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ receipt, selected })
			});
			const data = await res.json();
			if(res.ok){
				toast(`Policy ${data.policy_id} active — ${data.coverage_period} at $${data.premium}`);
			} else {
				toast(data.detail || 'Confirmation failed');
			}
		};
	});
}

let chatState = { stage: 'idle', receipt: null, options: null };

// Initialize chat listeners (called only after image upload)
function initializeChat() {
  const chatSend = el('#chatSend');
  const chatInput = el('#chatInput');
  const chatLog = el('#chatLog');
  
  // Clear any existing listeners by replacing the element
  const newChatSend = chatSend.cloneNode(true);
  chatSend.parentNode.replaceChild(newChatSend, chatSend);
  
  // Add new listener
  newChatSend.onclick = async ()=>{
    const text = chatInput.value.trim();
    if(!text) return;
    chatInput.value = '';
    chatLog.innerHTML += `<div style="margin:8px 0;"><b>You:</b> ${text}</div>`;
    
    const reply = await chatRespond(text);
    chatLog.innerHTML += `<div style="margin:8px 0; color:#0E4D48;"><b>TapSure:</b> ${reply}</div>`;
    chatLog.scrollTop = chatLog.scrollHeight;
  };
  
  // Send on Enter
  chatInput.addEventListener('keydown', (e)=>{ 
    if(e.key==='Enter'){ 
      e.preventDefault(); 
      newChatSend.click(); 
    } 
  });
}

// ===== CHATBOT RECOGNIZABLE SENTENCES & QUESTION FRAMEWORK =====
const CHATBOT_PHRASES = {
  // Welcome & General
  greeting: ['hi', 'hello', 'hey', 'start', 'begin', 'welcome', 'howdy', 'greetings'],
  help: ['help', 'assist', 'support', 'what can you do', 'tell me more', 'guide me'],
  
  // Receipt & Upload
  upload: ['upload', 'receipt', 'photo', 'image', 'picture', 'scan', 'send receipt', 'attach file'],
  
  // Purchase Description
  purchase: ['bought', 'purchase', 'spent', 'paid', 'cost', 'price', 'purchased', 'item'],
  
  // Coverage Questions
  coverage: ['coverage', 'protection', 'plan', 'insurance', 'protect', 'cover', 'what protects', 'how protected'],
  
  // Selection
  select: ['option', 'choose', 'pick', 'select', 'want', 'take', 'prefer', 'like', 'best'],
  
  // Confirmation
  confirm: ['confirm', 'yes', 'done', 'thanks', 'great', 'perfect', 'activate', 'get it'],
  
  // Questions About Features
  features: ['damage', 'theft', 'accidental', 'covers', 'covered', 'protection types', 'what is covered'],
  
  // Process Questions
  process: ['how', 'works', 'process', 'steps', 'flow', 'what next', 'then what', 'after that'],
};

// Available questions the bot recognizes & can ask
const AVAILABLE_QUESTIONS = [
  '1️⃣ Would you like to upload a receipt photo?',
  '2️⃣ Or would you prefer to tell me about your purchase (item type and price)?',
  '3️⃣ Do you want to know about our coverage options first?',
  '4️⃣ What category is your purchase: Electronics, Grocery, Clothing, or Pharmacy?',
  '5️⃣ How much did you spend on this item?',
  '6️⃣ Which coverage plan interests you: 6-month, 12-month, or 24-month?',
  '7️⃣ Would you like to activate your coverage now?',
  '8️⃣ Do you have another item you\'d like to protect?',
];

function matchesPhraseGroup(message, group) {
  const lower = message.toLowerCase();
  return CHATBOT_PHRASES[group]?.some(phrase => lower.includes(phrase)) || false;
}

async function chatRespond(message) {
  const lower = message.toLowerCase();
  
  // ===== GREETING & WELCOME =====
  if (matchesPhraseGroup(message, 'greeting') || matchesPhraseGroup(message, 'help')) {
    chatState.stage = 'idle';
    return `👋 Welcome to TapSure! I'm here to help you get instant coverage for your purchases.\n\n**Here are questions you can ask me:**\n${AVAILABLE_QUESTIONS.slice(0, 3).join('\n')}\n\nWhat would you like to do?`;
  }
  
  // ===== UPLOAD INTENT =====
  if (matchesPhraseGroup(message, 'upload')) {
    return `📸 **Got it!** You want to upload a receipt.\n\n**Here's what I'll do:**\n• Scan your receipt photo\n• Extract item details\n• Show you coverage options\n\nClick the upload area above or use the Camera/File buttons. Ready?`;
  }
  
  // ===== PROCESS/HOW IT WORKS =====
  if (matchesPhraseGroup(message, 'process')) {
    return `⚙️ **Here's how TapSure works:**\n\n**Step 1:** Upload a receipt or describe your purchase\n**Step 2:** I analyze what you bought\n**Step 3:** I show you 3 coverage options (6, 12, 24 months)\n**Step 4:** You pick your plan\n**Step 5:** Your policy is instantly active!\n\n**Questions you can ask me:**\n${AVAILABLE_QUESTIONS.slice(3, 6).join('\n')}`;
  }
  
  // ===== COVERAGE INFORMATION =====
  if (matchesPhraseGroup(message, 'coverage')) {
    return `🛡️ **TapSure Coverage Includes:**\n\n📍 **Damage:** Accidental physical damage\n🚨 **Theft:** Theft or loss protection\n⚡ **Accidental:** Accidents & mishaps\n💧 **Liquid:** Water/liquid damage\n\n**What would you like to know:**\n• Tell me about your purchase (I'll show you prices)\n• Ask about specific features\n• Upload a receipt to see your plan options`;
  }
  
  // ===== FEATURE QUESTIONS =====
  if (matchesPhraseGroup(message, 'features')) {
    return `📚 **Protection Features Explained:**\n\n🔴 **Accidental Damage:** Covers drops, impacts, cracks (excludes intentional damage)\n🔴 **Theft Protection:** Covers theft, robbery, or mysterious disappearance\n🔴 **Liquid Damage:** Covers water, spills, rain, humidity damage\n🔴 **Malfunction:** Covers manufacturer defects after purchase\n\n**Questions I can answer:**\n${AVAILABLE_QUESTIONS.slice(5, 8).join('\n')}`;
  }
  
  // ===== MANUAL PURCHASE INPUT (Parse: "I bought a laptop for $800") =====
  if (matchesPhraseGroup(message, 'purchase')) {
    const priceMatch = lower.match(/\$?(\d+(?:\.\d{2})?)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : null;
    
    let category = 'Electronics';
    if (/grocery|food|market|walmart|kroger|trader|whole|safeway/i.test(lower)) category = 'Grocery';
    else if (/clothing|shirt|pants|shoes|fashion|zara|gap|h&m|nike|adidas/i.test(lower)) category = 'Clothing';
    else if (/pharma|medicine|drug|pharmacy|cvs|walgreens|boots|aspirin|vitamin/i.test(lower)) category = 'Pharmacy';
    
    if (price) {
      const rec = { 
        merchant: 'Your Purchase', 
        category, 
        items: [{name: 'Item', price, eligible: true}], 
        total: price, 
        confidence: 0.85, 
        eligibility: 'APPROVED' 
      };
      chatState.receipt = rec;
      chatState.stage = 'receipt_analyzed';
      chatState.options = localOptions(rec);
      
      return `✅ **Perfect!** I understand:\n• **Item Type:** ${category}\n• **Purchase Price:** $${price.toFixed(2)}\n\n**Here are your coverage options:**\n${chatState.options.map((o, i) => `\n**Option ${i+1}:** ${o.protection_type}\n  • Period: ${o.coverage_period}\n  • Price: $${o.premium.toFixed(2)}/month\n  • Covers: ${o.features.join(', ')}`).join('\n')}\n\n**Which option do you want? (Say "option 1", "option 2", or "option 3")**`;
    }
    
    return `💡 **I caught that you made a purchase!** But I need the price.\n\n**Can you tell me:**\n• How much did you spend?\n• What category: Electronics, Grocery, Clothing, or Pharmacy?\n\n(Example: "I spent $500 on electronics" or "I paid $1200 for a laptop")`;
  }
  
  // ===== COVERAGE SELECTION (Parse: "option 1", "option 2", etc.) =====
  if (matchesPhraseGroup(message, 'select')) {
    if (!chatState.options || chatState.options.length === 0) {
      return `📋 **Let me help!** First, upload a receipt or tell me about your purchase so I can show you coverage options.\n\n**You can say:**\n• "I bought a MacBook for $1500"\n• "I spent $300 on clothing"\n• "Upload a receipt"`;
    }
    
    const optMatch = lower.match(/option\s*([1-3])|([1-3])/);
    let idx = optMatch ? (parseInt(optMatch[1] || optMatch[2]) - 1) : 1;
    idx = Math.max(0, Math.min(idx, chatState.options.length - 1));
    
    const selected = chatState.options[idx];
    chatState.stage = 'selected_coverage';
    
    const policyId = Math.random().toString(36).slice(2, 10).toUpperCase();
    chatState.policyId = policyId;
    
    return `🎉 **Excellent choice!** Activating your **${selected.protection_type}** plan.\n\n**📋 Your Policy Details:**\n• **Policy ID:** ${policyId}\n• **Plan:** ${selected.coverage_period}\n• **Monthly Premium:** $${selected.premium.toFixed(2)}\n• **Coverage:** ${selected.features.join(', ')}\n\n✅ **Your policy is now ACTIVE!** You're fully protected.\n\n**Next steps:**\n• Your coverage is immediately active\n• You can purchase another item\n• Say "done" to finish`;
  }
  
  // ===== CONFIRMATION =====
  if (matchesPhraseGroup(message, 'confirm')) {
    if (chatState.stage === 'selected_coverage' && chatState.policyId) {
      return `✨ **Perfect!** Your policy **${chatState.policyId}** is confirmed and active.\n\n💼 **What you're covered for:**\n• Accidental damage\n• Theft & loss\n• Liquid damage\n• Malfunctions\n\n**Safe shopping!** 🛍️ Upload another receipt if you'd like to protect more items.`;
    }
    return `👍 **Got it!** Anything else I can help with?\n\n**You can:**\n• Upload another receipt\n• Ask about coverage\n• Tell me about a new purchase\n• Ask questions about protection`;
  }
  
  // ===== CATEGORY QUESTION =====
  if (matchesPhraseGroup(message, 'coverage') && lower.includes('category')) {
    return `**📦 What category is your item?**\n\n• 📱 **Electronics** - Phones, laptops, tablets, cameras\n• 🛒 **Grocery** - Food, beverages, household items\n• 👕 **Clothing** - Apparel, shoes, fashion items\n• 💊 **Pharmacy** - Medicine, supplements, health items\n\nTell me which one, or just describe your purchase!`;
  }
  
  // ===== FALLBACK WITH SUGGESTIONS =====
  return `🤖 **I'm here to help!** Here's what you can ask me:\n\n${AVAILABLE_QUESTIONS.slice(0, 4).join('\n')}\n\n**Or just describe your purchase:**\n• "I bought a phone for $600"\n• "I spent $100 on groceries"\n• "I need protection for my new laptop"`;
}
// --- In-browser OCR + parsing (no backend required) ---
async function analyzeInBrowser(file){
	if (!window.Tesseract) throw new Error('Tesseract not loaded');
	const imgUrl = URL.createObjectURL(file);
	analysis.innerHTML = '<div class="muted">OCR running in browser...</div>';
	const { data } = await Tesseract.recognize(imgUrl, 'eng', {
		logger: m => { if (m.status) analysis.innerHTML = `<div=\"muted\">${m.status} ${Math.round((m.progress||0)*100)}%</div>`; }
	});
	URL.revokeObjectURL(imgUrl);
	const text = (data && data.text) ? data.text : '';
	const receipt = parseTextToReceipt(text, (file && file.name) ? file.name : '');
	return receipt;
}

function parseTextToReceipt(text, filename){
	// try to infer merchant/category from text
	const low = `${text} ${filename}`.toLowerCase();
	let category = 'Electronics';
	let merchant = 'Unknown';
	if (/(best\s?buy|apple|samsung|sony|currys|micro\s?center)/.test(low)) { merchant='Best Buy'; category='Electronics'; }
	else if (/(walmart|kroger|tesco|aldi|safeway|whole\s?foods)/.test(low)) { merchant='Grocery Store'; category='Grocery'; }
	else if (/(zara|h&m|hm|gap|nike|adidas|uniqlo)/.test(low)) { merchant='Clothing Store'; category='Clothing'; }
	else if (/(walgreens|cvs|boots|rite\s?aid)/.test(low)) { merchant='Pharmacy'; category='Pharmacy'; }
	// total
	const totMatch = text.match(/(?:total|amount|sum)[^\d]*(\d+[\.,]?\d{0,2})/i);
	let total = totMatch ? parseFloat(totMatch[1].replace(',', '')) : undefined;
	if (!total){
		const prices = (text.match(/\d+\.\d{2}/g) || []).map(x=>parseFloat(x));
		total = prices.length ? Math.max(...prices) : (category==='Electronics'?199.99:49.99);
	}
	return { merchant, category, items:[{name:'Item', price: total, eligible:true}], total, confidence:0.6, eligibility:'APPROVED', raw_text: text.slice(0,2000) };
}

// --- Local mock helpers (fallback) ---
function localAnalyze(file){
	const name = ((file && file.name) ? file.name : '').toLowerCase();
	let category = 'Electronics';
	let merchant = 'Unknown';
	if (/(bestbuy|apple|samsung|sony)/.test(name)) { merchant='Best Buy'; category='Electronics'; }
	else if (/(walmart|kroger|tesco|aldi)/.test(name)) { merchant='Grocery Store'; category='Grocery'; }
	else if (/(gap|nike|zara|hm|h&m)/.test(name)) { merchant='Clothing Store'; category='Clothing'; }
	const total = category==='Electronics' ? 199.99 : 49.99;
	return { merchant, category, items:[{name:'Item', price: total, eligible:true}], total, confidence:0.4, eligibility:'APPROVED' };
}

function localOptions(receipt){
	const table = {
		Electronics: { base: 0.12, features:['Damage','Theft','Accidental'] },
		Grocery: { base: 0.02, features:['Spoilage','Delivery Loss'] },
		Clothing: { base: 0.05, features:['Damage','Theft'] },
		Pharmacy: { base: 0.04, features:['Damage','Loss'] },
		Other: { base: 0.06, features:['Damage','Theft'] },
	};
	const meta = table[receipt.category] || table.Other;
	const total = receipt.total || ((receipt.items && receipt.items.reduce) ? receipt.items.reduce((s,i)=>s+i.price,0) : 0);
	const mk = (m, mult) => ({ coverage_period: `${m} months`, premium: +(total*meta.base*mult).toFixed(2), protection_type: receipt.category==='Electronics'?'Comprehensive':'Standard', features: meta.features });
	return [ mk(6,0.45), mk(12,0.75), mk(24,1.1) ];
}
