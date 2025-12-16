const API = 'http://localhost:8000';
let MOCK = true; // force serverless mode (no backend required)

const el = (q) => document.querySelector(q);
const drop = el('#drop');
const fileInput = el('#file');
const analysis = el('#analysis');
const recommend = el('#recommend');
const chatLog = el('#chatLog');

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
  fileInput.removeAttribute('capture'); // prefer picker when clicking area
  fileInput.click();
});

// camera vs picker buttons
el('#cameraBtn').onclick = ()=> {
  fileInput.setAttribute('accept','image/*');
  fileInput.setAttribute('capture','environment');
  fileInput.click();
};
el('#chooseBtn').onclick = ()=> {
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
    analysis.innerHTML = `<div class=\"muted\">${e.message}</div>`;
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

el('#chatSend').onclick = async ()=>{
  const text = el('#chatInput').value.trim();
  if(!text) return;
  el('#chatInput').value = '';
  chatLog.innerHTML += `<div><b>You:</b> ${text}</div>`;
  if (MOCK) {
    const lower = text.toLowerCase();
    let reply = "Upload a receipt, we analyze it, suggest coverage, and you confirm.";
    if (!/how|help|what/i.test(text)) reply = "Got it. Upload a receipt image and pick a plan.";
    chatLog.innerHTML += `<div><b>Agent:</b> ${reply}</div>`;
    return;
  }
  try{
    const res = await fetch(`${API}/api/chat`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:text}) });
    const data = await res.json();
    chatLog.innerHTML += `<div><b>Agent:</b> ${data.reply}</div>`;
  }catch(e){ chatLog.innerHTML += `<div class='muted'>Error</div>`; }
};
// send on Enter
el('#chatInput').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); el('#chatSend').click(); } });

// --- In-browser OCR + parsing (no backend required) ---
async function analyzeInBrowser(file){
  if (!window.Tesseract) throw new Error('Tesseract not loaded');
  const imgUrl = URL.createObjectURL(file);
  analysis.innerHTML = '<div class="muted">OCR running in browser...</div>';
  const { data } = await Tesseract.recognize(imgUrl, 'eng', {
    logger: m => { if (m.status) analysis.innerHTML = `<div class=\"muted\">${m.status} ${Math.round((m.progress||0)*100)}%</div>`; }
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
