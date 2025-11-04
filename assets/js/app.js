/* assets/js/app.js */
/* Helpers */
function fmt(n){ try{ return Number(n).toLocaleString('en-US'); }catch(e){return n} }
function unfmt(str){ if(str===undefined||str===null) return NaN; let s = String(str).replace(/,/g,'').trim(); if(s==='') return NaN; return Number(s); }

/* Elements (assumes index.html has these IDs) */
const price18Input = document.getElementById('price18');
const price24Input = document.getElementById('price24');
const tabs = document.querySelectorAll('.tab');
const modes = document.querySelectorAll('.mode');
const parsianCalcBtn = document.getElementById('parsianCalc');
const shamshCalcBtn = document.getElementById('shamshCalc');

/* Persisted state keys */
const KEY_DARK = 'goldcal_dark';
const KEY_LAST_TAB = 'goldcal_lastTab';
const KEY_LAST_PRICE18 = 'goldcal_price18';
const KEY_LAST_PRICE24 = 'goldcal_price24';

/* sync price 18 <-> 24 */
function syncFrom18(){ const v=unfmt(price18Input.value); if(isNaN(v)){ price24Input.value=''; updateActivePriceDisplay(); return; } const p24 = v*(24/18); price24Input.value = fmt(Math.round(p24)); updateActivePriceDisplay(); localStorage.setItem(KEY_LAST_PRICE18, price18Input.value); localStorage.setItem(KEY_LAST_PRICE24, price24Input.value); }
function syncFrom24(){ const v=unfmt(price24Input.value); if(isNaN(v)){ price18Input.value=''; updateActivePriceDisplay(); return; } const p18 = v*(18/24); price18Input.value = fmt(Math.round(p18)); updateActivePriceDisplay(); localStorage.setItem(KEY_LAST_PRICE18, price18Input.value); localStorage.setItem(KEY_LAST_PRICE24, price24Input.value); }

price18Input.addEventListener('input', (e)=>{ const raw = e.target.value.replace(/,/g,''); if(raw===''||isNaN(Number(raw))){ price18Input.value = raw; return; } price18Input.value = fmt(Number(raw)); syncFrom18(); });
price24Input.addEventListener('input', (e)=>{ const raw = e.target.value.replace(/,/g,''); if(raw===''||isNaN(Number(raw))){ price24Input.value = raw; return; } price24Input.value = fmt(Number(raw)); syncFrom24(); });

/* tabs + lazy rendering */
tabs.forEach(t=>{
  t.addEventListener('click', ()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const mode = t.dataset.mode;
    modes.forEach(m=> m.style.display = (m.dataset.mode === mode ? '' : 'none'));
    localStorage.setItem(KEY_LAST_TAB, mode);
    updateActivePriceDisplay();
    // lazy: if user opened parsian/shamsh and table empty, render once (only when price provided)
    if(mode === 'parsian'){
      const wrap = document.getElementById('parsianTableWrap');
      if(wrap && wrap.innerHTML.trim()==='') { document.getElementById('parsianCalc').click(); }
    } else if(mode === 'shamsh'){
      const wrap = document.getElementById('shamshTableWrap');
      if(wrap && wrap.innerHTML.trim()==='') { document.getElementById('shamshCalc').click(); }
    }
  });
});

/* weights */
const weights = [0.05,0.07,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9,0.95,1.0,1.1,1.15,1.2,1.25,1.3,1.35,1.4,1.45,1.5,1.55,1.6,1.65,1.7,1.75,1.8,1.85,1.9,1.95,2.0,3.0,4.0];

/* Parsian (same IDs as original file) */
const parsianTolToggle = document.getElementById('parsianTolToggle');
const parsianTolSelect = document.getElementById('parsianTol');
const parsianTableWrap = document.getElementById('parsianTableWrap');
const parsianPurity = document.getElementById('parsianPurity');
const parsianPurityCustom = document.getElementById('parsianPurityCustom');
const parsianCustomWeight = document.getElementById('parsianCustomWeight');
let parsianTol = 0;

/* Shamsh */
const shamshTolToggle = document.getElementById('shamshTolToggle');
const shamshTolSelect = document.getElementById('shamshTol');
const shamshTableWrap = document.getElementById('shamshTableWrap');
const shamshPurity = document.getElementById('shamshPurity');
const shamshPurityCustom = document.getElementById('shamshPurityCustom');
const shamshCustomWeight = document.getElementById('shamshCustomWeight');
let shamshTol = 0;

/* Fabrication */
const fabCalcBtn = document.getElementById('fabCalc');
const fabWeightInput = document.getElementById('fabWeight');
const fabWageInput = document.getElementById('fabWage');
const fabProfitInput = document.getElementById('fabProfit');
const fabFinal = document.getElementById('fabFinal');
const fabPure = document.getElementById('fabPure');
const fabWageOut = document.getElementById('fabWageOut');
const fabProfitOut = document.getElementById('fabProfitOut');
const fabTaxOut = document.getElementById('fabTax');
const fabTolOut = document.getElementById('fabTol');
const fabPurity = document.getElementById('fabPurity');
const fabPurityCustom = document.getElementById('fabPurityCustom');

/* Toggle behaviors */
parsianTolToggle.addEventListener('click', ()=>{
  parsianTolToggle.classList.toggle('active');
  const active = parsianTolToggle.classList.contains('active');
  parsianTolSelect.style.display = active ? '' : 'none';
  parsianTol = active ? (parseInt(parsianTolSelect.value,10) || 0) : 0;
});
parsianTolSelect.addEventListener('change', ()=> { if(parsianTolToggle.classList.contains('active')) parsianTol = parseInt(parsianTolSelect.value,10) || 0; });

shamshTolToggle.addEventListener('click', ()=>{
  shamshTolToggle.classList.toggle('active');
  const active = shamshTolToggle.classList.contains('active');
  shamshTolSelect.style.display = active ? '' : 'none';
  shamshTol = active ? (parseInt(shamshTolSelect.value,10) || 0) : 0;
});
shamshTolSelect.addEventListener('change', ()=> { if(shamshTolToggle.classList.contains('active')) shamshTol = parseInt(shamshTolSelect.value,10) || 0; });

parsianPurity.addEventListener('change', ()=> parsianPurityCustom.style.display = parsianPurity.value==='custom' ? 'block' : 'none');
shamshPurity.addEventListener('change', ()=> shamshPurityCustom.style.display = shamshPurity.value==='custom' ? 'block' : 'none');
fabPurity.addEventListener('change', ()=> fabPurityCustom.style.display = fabPurity.value==='custom' ? 'block' : 'none');

/* compute helpers */
function parsianGetPricePerGram(){
  let p18 = unfmt(price18Input.value);
  if(isNaN(p18)){
    const p24 = unfmt(price24Input.value);
    if(isNaN(p24)) return NaN;
    p18 = p24 * (18/24);
    price18Input.value = fmt(Math.round(p18));
  }
  const purity = (parsianPurity.value==='custom'? Number(parsianPurityCustom.value) : Number(parsianPurity.value)) || 18;
  return (p18 * (purity/18));
}
function shamshGetPricePerGram(){
  let p24 = unfmt(price24Input.value);
  if(isNaN(p24)){
    const p18 = unfmt(price18Input.value);
    if(isNaN(p18)) return NaN;
    p24 = p18 * (24/18);
    price24Input.value = fmt(Math.round(p24));
  }
  const purity = (shamshPurity.value==='custom'? Number(shamshPurityCustom.value) : Number(shamshPurity.value)) || 24;
  return (p24 * (purity/24));
}
function getPriceForPurity(purity){
  const p18 = unfmt(price18Input.value);
  const p24 = unfmt(price24Input.value);
  if(!isNaN(p18)) return p18*(purity/18);
  if(!isNaN(p24)) return p24*(purity/24);
  return NaN;
}

/* render functions (lazy: called on click only) */
function renderParsianTable(filteredWeight){
  const pricePerGram = parsianGetPricePerGram();
  if(isNaN(pricePerGram)){ parsianTableWrap.innerHTML = '<div style="padding:12px;color:#b00;font-weight:900">لطفاً قیمت ۱۸ یا ۲۴ را وارد کنید.</div>'; return; }
  let html = '<table aria-label="جدول پارسیان"><thead><tr><th>وزن (گرم)</th><th>قیمت نهایی</th></tr></thead><tbody>';
  const list = filteredWeight ? [Number(filteredWeight)] : weights;
  list.forEach(w=>{
    const goldCost = +(w * pricePerGram);
    const wage1 = 50000; const tax = +((goldCost + wage1) * 0.1);
    const wage2 = 50000;
    const total = Math.round(goldCost + wage1 + tax + wage2 + (parsianTol||0));
    html += `<tr><td>${w.toFixed(3)}</td><td class="price-cell">${fmt(total)} تومان</td></tr>`;
  });
  html += '</tbody></table>';
  parsianTableWrap.innerHTML = html;
}

function renderShamshTable(filteredWeight){
  const pricePerGram = shamshGetPricePerGram();
  if(isNaN(pricePerGram)){ shamshTableWrap.innerHTML = '<div style="padding:12px;color:#b00;font-weight:900">لطفاً قیمت ۱۸ یا ۲۴ را وارد کنید.</div>'; return; }
  let html = '<table aria-label="جدول شمش"><thead><tr><th>وزن (گرم)</th><th>قیمت نهایی</th></tr></thead><tbody>';
  const list = filteredWeight ? [Number(filteredWeight)] : weights;
  list.forEach(w=>{
    const goldCost = +(w * pricePerGram);
    const ojrat = (w >= 1.0) ? 250000 : 220000;
    const base = goldCost + ojrat; const tax = +(base * 0.1);
    const total = Math.round(base + tax + (shamshTol||0));
    html += `<tr><td>${w.toFixed(3)}</td><td class="price-cell">${fmt(total)} تومان</td></tr>`;
  });
  html += '</tbody></table>';
  shamshTableWrap.innerHTML = html;
}

/* fabrication */
function fabricateCalculate(){
  const weight = parseFloat(fabWeightInput.value);
  const purity = (fabPurity.value==='custom'? Number(fabPurityCustom.value) : Number(fabPurity.value)) || 18;
  const pricePerGram = getPriceForPurity(purity);
  const wagePercent = parseFloat(fabWageInput.value);
  const profitPercent = parseFloat(fabProfitInput.value);
  if(isNaN(weight) || isNaN(pricePerGram) || isNaN(wagePercent) || isNaN(profitPercent)){
    fabFinal.textContent = '⚠️ لطفاً مقادیر معتبر وارد کنید.';
    return;
  }
  const pure = +(weight * pricePerGram);
  const wage = +(pure * (wagePercent/100));
  const profit = +((pure + wage) * (profitPercent/100));
  const tax = +(0.1 * (wage + profit));
  const tol = 0;
  const total = Math.round(pure + wage + profit + tax + tol);
  fabFinal.textContent = fmt(total) + ' تومان';
  fabPure.textContent = fmt(Math.round(pure)) + ' تومان';
  fabWageOut.textContent = fmt(Math.round(wage)) + ' تومان';
  fabProfitOut.textContent = fmt(Math.round(profit)) + ' تومان';
  fabTaxOut.textContent = fmt(Math.round(tax)) + ' تومان';
  fabTolOut.textContent = fmt(tol) + ' تومان';
  updateTimestamp();
}

/* timestamp, theme, persistence */
const timeToggleTop = document.getElementById('timeToggleTop');
const topTimestamp = document.getElementById('topTimestamp');
let topTimeVisible = false;
timeToggleTop && timeToggleTop.addEventListener('click', ()=>{
  timeToggleTop.classList.toggle('active');
  topTimeVisible = timeToggleTop.classList.contains('active');
  topTimestamp.style.display = topTimeVisible ? '' : 'none';
});

const themeToggle = document.getElementById('themeToggle');
if(localStorage.getItem(KEY_DARK) === 'true'){ document.documentElement.classList.add('dark'); themeToggle && themeToggle.classList.add('active'); }
themeToggle && themeToggle.addEventListener('click', ()=>{
  themeToggle.classList.toggle('active');
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem(KEY_DARK, isDark ? 'true' : 'false');
});

/* active price display */
function updateActivePriceDisplay(){
  const active = document.querySelector('.tab.active').dataset.mode;
  let pricePerGram = NaN, purity = 18;
  if(active==='parsian'){ purity = (parsianPurity.value==='custom'? Number(parsianPurityCustom.value): Number(parsianPurity.value)) || 18; const p18 = unfmt(price18Input.value); if(!isNaN(p18)) pricePerGram = p18*(purity/18); else { const p24 = unfmt(price24Input.value); if(!isNaN(p24)) pricePerGram = p24*(purity/24); } }
  else if(active==='shamsh'){ purity = (shamshPurity.value==='custom'? Number(shamshPurityCustom.value): Number(shamshPurity.value)) || 24; const p24 = unfmt(price24Input.value); if(!isNaN(p24)) pricePerGram = p24*(purity/24); else { const p18 = unfmt(price18Input.value); if(!isNaN(p18)) pricePerGram = p18*(purity/18); } }
  else { purity = (fabPurity.value==='custom'? Number(fabPurityCustom.value): Number(fabPurity.value)) || 18; const p18 = unfmt(price18Input.value); if(!isNaN(p18)) pricePerGram = p18*(purity/18); else { const p24 = unfmt(price24Input.value); if(!isNaN(p24)) pricePerGram = p24*(purity/24); } }
  document.getElementById('activePriceDisplay').textContent = isNaN(pricePerGram) ? 'قیمت وارد نشده' : (fmt(Math.round(pricePerGram)) + ' تومان (عیار ' + purity + ')');
}

/* timestamp update */
function updateTimestamp(){ topTimestamp.textContent = (new Date()).toLocaleString(); localStorage.setItem('goldcal_lastTime', topTimestamp.textContent); }

/* bind calc buttons */
parsianCalcBtn && parsianCalcBtn.addEventListener('click', ()=>{
  const w = parsianCustomWeight.value.trim();
  renderParsianTable(w? Number(w) : null);
  updateTimestamp(); updateActivePriceDisplay();
});
shamshCalcBtn && shamshCalcBtn.addEventListener('click', ()=>{
  const w = shamshCustomWeight.value.trim();
  renderShamshTable(w? Number(w) : null);
  updateTimestamp(); updateActivePriceDisplay();
});
fabCalcBtn && fabCalcBtn.addEventListener('click', ()=>{ fabricateCalculate(); updateActivePriceDisplay(); });

/* restore last state */
(function init(){
  const lastTab = localStorage.getItem(KEY_LAST_TAB);
  if(lastTab){ document.querySelectorAll('.tab').forEach(t=> { if(t.dataset.mode===lastTab) t.click(); }); }
  const last18 = localStorage.getItem(KEY_LAST_PRICE18);
  const last24 = localStorage.getItem(KEY_LAST_PRICE24);
  if(last18) price18Input.value = last18;
  if(last24) price24Input.value = last24;
  updateActivePriceDisplay();
})();

/* simple service worker registration (sw.js at site root or /assets/js/sw.js) */
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(()=>{/*ignore*/});
  });
}

/* Enter key support */
document.body.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ const active = document.querySelector('.tab.active').dataset.mode; if(active==='parsian') parsianCalcBtn && parsianCalcBtn.click(); else if(active==='shamsh') shamshCalcBtn && shamshCalcBtn.click(); else fabCalcBtn && fabCalcBtn.click(); } });
