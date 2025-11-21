/************************************************************************************
 * HOWTO BUTTON – IMPLEMENTATION NOTES (คู่มือในคอมเมนต์)
 *
 * เป้าหมาย:
 *   เมื่อผู้ใช้กดปุ่ม "วิธีชำระ" (postback: act=howto) ให้ส่งคอนเทนต์อธิบายขั้นตอนการชำระ
 *   อาจเป็น: ข้อความ (text), รูปภาพ (image), อัลบั้มรูป (flex carousel), วิดีโอสั้น, หรือไฟล์ PDF
 *
 * จุดที่ต้องแก้:
 *   1) ใน onPostback_ เคส data.act === 'howto'
 *   2) เติม payload ที่ต้องการ (เลือก 1 หรือหลายแบบผสมได้) แล้วใช้ push_(userId, messages)
 *
 * ทรัพยากรสื่อ (Media hosting) – เลือกหนึ่ง:
 *   - แบบ A: ฝากไฟล์ไว้บน Google Drive แล้วใช้ลิงก์แบบ public (เช่น https://drive.google.com/uc?export=view&id=FILE_ID)
 *   - แบบ B: ฝากไฟล์บน Cloudflare Pages/Workers หรือโฮสต์ของคุณเอง (เสถียรและโหลดไว)
 *   - แบบ C: เก็บใน LINE Content (ต้องอัปโหลดผ่าน Messaging API ก่อน จึงจะมี URL ให้)
 *
 * แนะนำโฟลว์ UX:
 *   - เริ่มด้วย startLoading_(userId, 6) เพื่อโชว์กำลังโหลด
 *   - ส่ง "แผ่นพับสรุปขั้นตอน" เป็นรูปเดียว หรืออัลบั้ม 2–4 รูป
 *   - ปิดท้ายด้วยปุ่มลิงก์ "ดาวน์โหลดคู่มือ (PDF)" หรือ "ดูวิดีโอสั้น (30 วิ)"
 *
 * ========================= ตัวอย่างโค้ดที่หยิบใช้ได้ทันที =========================
 *
 * [A] ส่ง "ข้อความ" + "รูปภาพเดี่ยว" อธิบายขั้นตอน
 * ------------------------------------------------------------------
 * const HOWTO_IMAGE_URL = 'https://.../howto_rent_payment_step.jpg'; // TODO: ใส่ URL จริง
 * push_(userId, [
 *   { type:'text', text:'ขั้นตอนการชำระค่าเช่า:\n1) เลือกเดือนที่ต้องการ\n2) โอน/สแกน QR\n3) อัปโหลดสลิปในแชทนี้\n— หมายเหตุ: ยอดต้องตรงตามบิล' },
 *   { type:'image', originalContentUrl: HOWTO_IMAGE_URL, previewImageUrl: HOWTO_IMAGE_URL }
 * ]);
 *
 * [B] ส่ง "อัลบั้ม 2–3 รูป" แบบ Flex Carousel (ภาพแต่ละใบมีคำอธิบายใต้ภาพ)
 * ------------------------------------------------------------------
 * // โครง Flex – ถ้าต้องการปรับ caption/ลิงก์ กดที่ altText/contents
 * const carousel = {
 *   type: 'flex',
 *   altText: 'ขั้นตอนการชำระ (สไลด์)',
 *   contents: {
 *     type: 'carousel',
 *     contents: [
 *       {
 *         type: 'bubble',
 *         hero: {
 *           type: 'image',
 *           url: 'https://.../step1_select_month.jpg', // TODO
 *           size: 'full', aspectRatio: '20:13', aspectMode: 'cover'
 *         },
 *         body: { type:'box', layout:'vertical', contents:[
 *           { type:'text', text:'ขั้นตอนที่ 1: เลือกเดือน', weight:'bold' },
 *           { type:'text', text:'กดเลือกเดือนให้ตรงรอบบิล', size:'sm', color:'#666666', wrap:true }
 *         ]}
 *       },
 *       {
 *         type: 'bubble',
 *         hero: { type:'image', url:'https://.../step2_transfer.jpg', size:'full', aspectRatio:'20:13', aspectMode:'cover' },
 *         body: { type:'box', layout:'vertical', contents:[
 *           { type:'text', text:'ขั้นตอนที่ 2: โอน/สแกน QR', weight:'bold' },
 *           { type:'text', text:'โอนตามยอดบิลให้พอดี', size:'sm', color:'#666666', wrap:true }
 *         ]}
 *       },
 *       {
 *         type: 'bubble',
 *         hero: { type:'image', url:'https://.../step3_upload_slip.jpg', size:'full', aspectRatio:'20:13', aspectMode:'cover' },
 *         body: { type:'box', layout:'vertical', contents:[
 *           { type:'text', text:'ขั้นตอนที่ 3: อัปโหลดสลิป', weight:'bold' },
 *           { type:'text', text:'ส่งภาพสลิปในแชทนี้ แล้วรอยืนยัน', size:'sm', color:'#666666', wrap:true }
 *         ]}
 *       }
 *     ]
 *   }
 * };
 * push_(userId, [ carousel ]);
 *
 * [C] ส่ง "วิดีโอสั้น" (ต้องมีทั้ง originalContentUrl และ previewImageUrl)
 * ------------------------------------------------------------------
 * push_(userId, [{
 *   type:'video',
 *   originalContentUrl:'https://.../howto_30s.mp4',  // TODO
 *   previewImageUrl:'https://.../howto_cover.jpg'    // TODO
 * }]);
 *
 * [D] ส่ง "เอกสาร PDF คู่มือ" เป็นลิงก์ให้กด
 * ------------------------------------------------------------------
 * const HOWTO_PDF_URL = 'https://.../howto_payment_guide.pdf'; // TODO
 * push_(userId, [{
 *   type:'flex',
 *   altText:'ดาวน์โหลดคู่มือการชำระ',
 *   contents:{
 *     type:'bubble',
 *     body:{ type:'box', layout:'vertical', spacing:'md', contents:[
 *       { type:'text', text:'คู่มือการชำระค่าเช่า', weight:'bold', size:'lg' },
 *       { type:'text', text:'ไฟล์ PDF สรุปขั้นตอนทั้งหมด', size:'sm', color:'#666' }
 *     ]},
 *     footer:{ type:'box', layout:'vertical', contents:[
 *       { type:'button', style:'primary',
 *         action:{ type:'uri', label:'ดาวน์โหลด PDF', uri: HOWTO_PDF_URL } }
 *     ]}
 *   }
 * }]);
 *
 * [E] ผสมหลายแบบ: เริ่มด้วยข้อความสรุป → รูป/คารูเซล → ปิดด้วยลิงก์ PDF
 * ------------------------------------------------------------------
 * // เรียก push_ ทีละชุด (หรือใส่หลาย message ในครั้งเดียวก็ได้)
 *
 * ความปลอดภัย/ประสบการณ์ผู้ใช้:
 *   - ใส่ startLoading_(userId, 6) ก่อนโหลด/อ่านไฟล์ เพื่อ UX ลื่นขึ้น
 *   - ถ้าใช้ Google Drive ลิงก์ ควรปรับ sharing เป็น "Anyone with the link – Viewer"
 *   - ไฟล์รูปควรกว้าง ≥ 1024px เพื่อความคมชัดบนมือถือ
 *
 ************************************************************************************/


/***** CONFIG *****/
const PROPS = PropertiesService.getScriptProperties();
const TOKEN = PROPS.getProperty('CHANNEL_ACCESS_TOKEN');
const WORKER_SECRET = PROPS.getProperty('WORKER_SECRET') || '';
const REVENUE_SHEET_ID = PROPS.getProperty('REVENUE_SHEET_ID');
const SLIP_FOLDER_ID   = PROPS.getProperty('SLIP_FOLDER_ID');
const TEMP_SLIP_FOLDER_ID = PROPS.getProperty('TEMP_SLIP_FOLDER_ID');
const GCV_API_KEY      = PROPS.getProperty('GCV_API_KEY'); // Vision
const SHEET_ID         = PROPS.getProperty('SHEET_ID');    // Sheet with Rooms mapping

// เลขบัญชีธนาคารหอพัก (digits only, no dashes)
const RECEIVER_ACCOUNTS = {
  // KBank – ชั้น 1
  '0911848961':  { code: 'KKK+', bank: 'KBank', label: 'KBank ชั้น 1' },

  // KBank – ชั้น 2  (บัญชี 214-3-83688-9 → MAK+)
  '2143836889':  { code: 'MAK+', bank: 'KBank', label: 'KBank ชั้น 2 (MAK+)' },

  // Krungsri – ชั้น 3
  '5111482754':  { code: 'KGSI', bank: 'BAY',   label: 'Krungsri ชั้น 3' },

  // GSB – ชั้น 4–5
  '050711087200': { code: 'GSB5', bank: 'GSB',  label: 'GSB ชั้น 4–5' },

  // Additional account mapping
  '1818203205': { code: 'KBIZ', bank: 'KBIZ', label: 'KBIZ' }
};

/***** ENTRYPOINT *****/
function doPost(e){
  const headers = e?.headers || {};
  const body = JSON.parse(e?.postData?.contents || '{}');
  const provided = headers['X-Worker-Secret'] || headers['x-worker-secret'] || body.workerSecret || '';
  if (provided !== WORKER_SECRET) {
    return ContentService.createTextOutput(JSON.stringify({ ok:false, error:'forbidden' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const events = Array.isArray(body.events) ? body.events : [];
  events.forEach(ev=>{
    try{
      if (ev.type === 'message' && ev.message?.type === 'text')  return onText_(ev);
      if (ev.type === 'message' && ev.message?.type === 'image') return onImage_(ev);
      if (ev.type === 'postback')                                 return onPostback_(ev);
    }catch(err){ console.error('ERR', err, JSON.stringify(ev)); }
  });
  return ContentService.createTextOutput('OK');
}

/***** FLOW STATE *****/
function setRentStep_(userId, step, extra){
  const cache = CacheService.getUserCache();
  const obj = Object.assign({ step }, extra || {});
  cache.put(userId + ':rent_flow', JSON.stringify(obj), 2*60*60);
}
function getRentFlow_(userId){
  const cache = CacheService.getUserCache();
  try{ return JSON.parse(cache.get(userId + ':rent_flow') || '{}'); }catch(e){ return {}; }
}
function clearRentFlow_(userId){
  const cache = CacheService.getUserCache();
  cache.remove(userId + ':rent_flow');
}

/***** TEXT HANDLER *****/
function onText_(ev){
  const userId = ev.source?.userId || '';
  const text = (ev.message?.text || '').trim();
  if (!userId) return;

  // Entry point
  if (/^(ชำระค่าเช่า|จ่ายค่าเช่า|pay\s*rent|ค่าเช่า)$/i.test(text)) {
    // เริ่ม flow เลือกเดือน
    setRentStep_(userId, 'await_month', {});
    // แสดงตัวเลือกเดือน (ไม่ใส่ปุ่มอื่น เพื่อลดความซ้ำ)
    return push_(userId, [ buildMonthPickerFlex_() ]);
  }

  // ถามห้องในกรณีที่ยังไม่มี mapping
  const flow = getRentFlow_(userId);
  if (flow.step === 'await_room') {
    const room = text.toUpperCase().replace(/\s/g,'');
    if (!/^[A-Z]?\d{3,4}$/.test(room)) {
      return push_(userId, [{ type:'text', text:'รูปแบบห้องไม่ถูกต้อง ลองอีกครั้ง เช่น A101' }]);
    }
    setRentStep_(userId, 'await_slip', Object.assign({}, flow, { room }));
    return push_(userId, [{ type:'text', text:`ห้อง ${room}\nโปรดส่ง “รูปสลิปค่าเช่า” 1 รูปได้เลย` }]);
  }
}

// ชื่อเดือนภาษาไทย (เต็ม)
const TH_FULL_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
];

function firstDayOfMonth_(d){
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths_(d, delta){
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

// โหมด label: 'thai' = ชื่อเดือนไทย, 'numeric' = 09/2025
function formatMonthLabel_(d, mode){
  const y = d.getFullYear();
  const m = d.getMonth();
  if (mode === 'numeric') return String(m+1).padStart(2,'0') + '/' + y;
  return TH_FULL_MONTHS[m];
}

function buildMonthPickerFlex_(){
  const now  = new Date();
  const cur  = firstDayOfMonth_(now);
  const prev = addMonths_(cur, -1);
  const next = addMonths_(cur, +1);
  const mode = 'thai'; // เปลี่ยนเป็น 'numeric' ได้ถ้าต้องการ 09/2025

  const labelPrev = formatMonthLabel_(prev, mode); // (บนสุด)
  const labelThis = formatMonthLabel_(cur,  mode); // (กลาง)
  const labelNext = formatMonthLabel_(next, mode); // (ล่าง)

  return {
    "type": "flex",
    "altText": "เลือกเดือนที่ต้องการชำระ",
    "contents": {
      "type": "bubble",
      "header": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          { "type": "text", "text": "เลือกเดือนที่ต้องการชำระ", "weight": "bold", "size": "lg" },
          { "type": "text", "text": "กดเลือกหนึ่งตัวเลือกด้านล่าง", "size": "sm", "color": "#666666" }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "spacing": "md",
        "contents": [
          // บนสุด: เดือนที่แล้ว
          { "type": "button", "style": "secondary",
            "action": { "type": "postback", "label": labelPrev, "data": "act=quick_month&rel=prev&scope=payrent" } },

          // กลาง: เดือนนี้ (ไฮไลต์เป็น primary)
          { "type": "button", "style": "primary",
            "action": { "type": "postback", "label": labelThis, "data": "act=quick_month&rel=this&scope=payrent" } },

          // ล่าง: เดือนถัดไป
          { "type": "button", "style": "secondary",
            "action": { "type": "postback", "label": labelNext, "data": "act=quick_month&rel=next&scope=payrent" } }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          // ปุ่มช่วยเหลือ: วิธีชำระ / ขั้นตอนการชำระ
          { "type": "button", "height": "sm", "style": "link",
            "action": { "type": "postback", "label": "วิธีชำระ", "data": "act=howto&scope=payrent" } },
          { "type": "text", "text": "ระบบจะผูกกับ LINE ID เพื่อระบุห้อง", "size": "xs", "color": "#999999" }
        ]
      }
    }
  };
}




/***** POSTBACK HANDLER (single!) *****/
function onPostback_(ev){
  const userId = ev.source?.userId || '';
  const data = parseKv_(ev.postback?.data || '');
  if (!userId) return;

  // Ensure act exists → never silent
  if (!data.act) {
    return push_(userId, [{ type:'text', text:'ได้รับ postback แต่ไม่มีพารามิเตอร์ act' }]);
  }

  // Pick a specific month (from datetimepicker)
  if (data.act === 'pick_month') {
    startLoading_(userId, 8);

    const date = ev.postback?.params?.date || '';
    if (!date) {
      return push_(userId, [{ type:'text', text:'โปรดเลือกด้วยปุ่มด้านล่าง: เดือนนี้ / เดือนที่แล้ว / เดือนถัดไป' }]);
    }
    const ym = date.slice(0,7); // YYYY-MM
    const room = findRoomByLineId_PR_(userId);
    if (room) {
      setRentStep_(userId, 'await_slip', { ym, room });
      return push_(userId, [{ type:'text', text:`เดือน: ${ym}\nห้อง: ${room}\nส่งสลิปได้เลยค่ะ` }]);
    }
    setRentStep_(userId, 'await_room', { ym });
    return push_(userId, [{ type:'text', text:`เดือน: ${ym}\nพิมพ์เบอร์ห้อง (เช่น A101)` }]);
  }

  // Quick month (this/prev/next) → convert to ym
  if (data.act === 'quick_month') {
    startLoading_(userId, 8);

    const ym = resolveQuickMonthToYM_(data.rel || 'this');
    const room = findRoomByLineId_PR_(userId);
    if (room) {
      setRentStep_(userId, 'await_slip', { ym, room });
      return push_(userId, [{ type:'text', text:`เดือน: ${ym}\nห้อง: ${room}\nส่งสลิปได้เลยค่ะ` }]);
    }
    setRentStep_(userId, 'await_room', { ym });
    return push_(userId, [{ type:'text', text:`เดือน: ${ym}\nพิมพ์เบอร์ห้อง (เช่น A101)` }]);
  }

  // Upload button → enforce month selected first
  if (data.act === 'upload') {
    const flow = getRentFlow_(userId);
    if (!flow.step || (flow.step !== 'await_slip' && flow.step !== 'await_room')) {
      setRentStep_(userId, 'await_month', {});
      return push_(userId, [{ type:'text', text:'กรุณา “เลือกเดือน…” ก่อน แล้วค่อยอัปโหลดสลิปค่ะ' }]);
    }
    const room = flow.room || findRoomByLineId_PR_(userId);
    if (room) {
      setRentStep_(userId, 'await_slip', Object.assign({}, flow, { room }));
      return push_(userId, [{ type:'text', text:`ห้อง: ${room}\nส่งสลิปได้เลยค่ะ` }]);
    }
    setRentStep_(userId, 'await_room', Object.assign({}, flow));
    return push_(userId, [{ type:'text', text:'พิมพ์เบอร์ห้องของคุณ (เช่น A101)' }]);
  }

  if (data.act === 'status') return push_(userId, [{ type:'text', text:'กำลังดึงสถานะล่าสุด…' }]);
  if (data.act === 'faq')    return push_(userId, [{ type:'text', text:'คำถามพบบ่อย: ยอด/กำหนดชำระ/ส่งสลิป ฯลฯ' }]);
  if (data.act === 'howto')  return push_(userId, [{ type:'text', text:'วิธีชำระเงิน: 1) สแกน QR 2) โอน 3) อัปโหลดสลิปในแชทนี้' }]);

    // ใน onPostback_(ev) …
  if (data.act === 'howto') {
    // 1) โชว์โหลดระหว่างเตรียมคอนเทนต์ (ปรับเวลาตามจริง)
    startLoading_(userId, 6);

    // 2) ตัวอย่างขั้นต่ำ: ส่งข้อความ + รูปเดียว (เลือกใช้อย่างใดอย่างหนึ่งด้านบนแทนได้)
    const HOWTO_IMAGE_URL = 'https://.../howto_rent_payment_step.jpg'; // TODO: ใส่ URL จริง
    return push_(userId, [
      { type:'text', text:'ขั้นตอนการชำระค่าเช่า:\n1) เลือกเดือนให้ตรงรอบบิล\n2) โอน/สแกน QR ตามยอดบิล\n3) อัปโหลดสลิปในแชทนี้ แล้วรอยืนยันผล' },
      { type:'image', originalContentUrl: HOWTO_IMAGE_URL, previewImageUrl: HOWTO_IMAGE_URL }
    ]);
  }

}

/***** IMAGE HANDLER *****/
function onImage_(ev){
  const userId    = ev.source?.userId || '';
  const messageId = ev.message?.id;
  if (!userId || !messageId) return;

  const flow = getRentFlow_(userId);
  if (flow.step !== 'await_slip' || !flow.ym) {
    return push_(userId, [{ type:'text', text:'กรุณาเริ่มที่ “จ่ายค่าเช่า” และ “เลือกเดือน” ก่อนนะคะ' }]);
  }

  startLoading_(userId, 5);
  try{
    const blob = fetchLineBlob_(messageId);
    const type = (blob.getContentType() || '').toLowerCase();
    const size = blob.getBytes().length;

    if (!/^image\/(jpeg|png)$/.test(type)) {
      return push_(userId, [{ type:'text', text:'รองรับเฉพาะภาพ jpg/png ค่ะ' }]);
    }
    if (size > 10*1024*1024) {
      return push_(userId, [{ type:'text', text:'ไฟล์ใหญ่เกิน 10MB ค่ะ' }]);
    }

    const ts  = Utilities.formatDate(new Date(),'Asia/Bangkok',"yyyy-MM-dd'T'HH-mm-ss");
    const ext = type === 'image/png' ? 'png' : 'jpg';
    blob.setName(`${(flow.room||'ROOM')}_SLIP_${ts}.${ext}`);
    const tempFileId = DriveApp.getFolderById(TEMP_SLIP_FOLDER_ID).createFile(blob).getId();
    const publicUrl  = `https://drive.google.com/uc?export=view&id=${tempFileId}`;

    const result = tryMatchAndConfirm_PR_({
      room: (flow.room||'').toUpperCase(),
      slipUrl: publicUrl,
      lineUserId: userId,
      fileId: tempFileId,
      ym: flow.ym || ''
    });

    clearRentFlow_(userId);

    if (result.ok){
      try{
        // ใช้เดือนจาก bill ที่จับคู่ได้ก่อน (แม่นสุด) ถ้าไม่มี ค่อย fallback ไป flow.ym
        var ymForFolder = result.matchedMonth || (flow.ym || '');
        var targetFolderId = getOrCreateMonthFolder_(SLIP_FOLDER_ID, ymForFolder);
        moveFileToFolder_PR_(tempFileId, TEMP_SLIP_FOLDER_ID, targetFolderId);
      }catch(e){}
      return push_(userId, [{ type:'text', text:'✅ รับสลิปแล้ว ยืนยันการชำระเรียบร้อย ขอบคุณค่ะ' }]);
    }
    if (result.reason === 'no_open_bill' || result.reason === 'amount_mismatch' || result.reason === 'ocr_missing' || result.reason === 'ambiguous' || result.reason === 'no_ocr_data'){
      try{
        // เลือกปีจาก flow.ym ถ้ามี; ถ้าไม่มี ให้เดาจากเวลาปัจจุบัน
        var ymForPending = (flow.ym || Utilities.formatDate(new Date(),'Asia/Bangkok','yyyy-MM'));
        var pendingFolderId = getOrCreatePendingFolder_(SLIP_FOLDER_ID, ymForPending);
        moveFileToFolder_PR_(tempFileId, TEMP_SLIP_FOLDER_ID, pendingFolderId);
      }catch(e){}
    }
    return push_(userId, [{ type:'text', text:'⏳ ได้รับสลิปแล้ว กำลังตรวจสอบโดยเจ้าหน้าที่' }]);

  }catch(e){
    console.error('RENT_SLIP_ERR', e);
    return push_(userId, [{ type:'text', text:'บันทึกไฟล์ไม่สำเร็จ โปรดลองใหม่ค่ะ' }]);
  }
}

/***** HELPERS: LINE + MISC *****/
function push_(to, messages){
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push',{
    method:'post',
    headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+TOKEN },
    payload: JSON.stringify({ to, messages }),
    muteHttpExceptions:true
  });
}
function startLoading_(chatId, seconds){
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/chat/loading/start',{
      method:'post',
      headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+TOKEN },
      payload: JSON.stringify({ chatId, loadingSeconds: Math.max(5, Math.min(seconds||5,60)) }),
      muteHttpExceptions:true
    });
  } catch(e){}
}
function parseKv_(q){
  const o={}; (q||'').split('&').forEach(p=>{
    if(!p) return; const i=p.indexOf('=');
    if(i<0){o[decodeURIComponent(p)]='';return;}
    o[decodeURIComponent(p.slice(0,i))]=decodeURIComponent(p.slice(i+1));
  }); return o;
}
function resolveQuickMonthToYM_(rel){
  const now = new Date();
  let y = now.getFullYear(), m = now.getMonth(); // 0-11
  if (rel === 'prev') { m = m-1; if (m<0){ m=11; y--; } }
  if (rel === 'next') { m = m+1; if (m>11){ m=0; y++; } }
  return y + '-' + String(m+1).padStart(2,'0');
}

/***** MEDIA FETCH *****/
function fetchLineBlob_(messageId){
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const res = UrlFetchApp.fetch(url, {
    method:'get',
    headers:{ Authorization:'Bearer '+TOKEN },
    muteHttpExceptions:true
  });
  if (res.getResponseCode() >= 300) throw new Error('LINE_MEDIA_FETCH '+res.getResponseCode());
  return res.getBlob();
}

function onlyDigits_(s) {
  return String(s || '').replace(/\D/g, '');
}

// Detect bank code from a piece of text (generic)
function detectBankCodeFromText_(s) {
  if (/กสิกร|Kasikorn|KBank/i.test(s))           return 'KBank';
  if (/กรุงเทพ|Bangkok Bank|BBL/i.test(s))      return 'BBL';
  if (/กรุงศรี|Krungsri|BAY/i.test(s))          return 'BAY';
  if (/กรุงไทย|Krungthai|KTB/i.test(s))         return 'KTB';
  if (/ไทยพาณิชย์|SCB/i.test(s))               return 'SCB';
  if (/ออมสิน|GSB/i.test(s))                    return 'GSB';
  if (/พร้อมเพย์|PromptPay/i.test(s))           return 'PromptPay';
  return '';
}

// Detect which of our RECEIVER_ACCOUNTS appears in the text.
// Match full number first, then 6-digit tail, then 4-digit tail.
function detectReceiverAccountFromText_(text) {
  const digits = onlyDigits_(text);
  const raw    = String(text || '');
  if (!digits) return null;

  let bestKey = null;
  let bestScore = 0;

  Object.keys(RECEIVER_ACCOUNTS).forEach(acc => {
    if (digits.indexOf(acc) >= 0) {
      if (bestScore < 3) { bestScore = 3; bestKey = acc; }
      return;
    }
    const tail6 = acc.slice(-6);
    const tail4 = acc.slice(-4);
    if (digits.indexOf(tail6) >= 0 && bestScore < 2) {
      bestScore = 2; bestKey = acc; return;
    }
    if (digits.indexOf(tail4) >= 0 && bestScore < 1.2) {
      bestScore = 1.2; bestKey = acc; return;
    }
    // new: match masked accounts that still reveal 4 digits (allow x/digits between)
    const seqPattern = tail4.split('').map(ch => ch + '[\\dxX]*').join('');
    const re = new RegExp(seqPattern, 'i');
    if (re.test(raw) && bestScore < 1) {
      bestScore = 1; bestKey = acc; return;
    }
  });

  if (!bestKey) return null;
  const meta = RECEIVER_ACCOUNTS[bestKey];
  return Object.assign({ accountNumber: bestKey }, meta);
}

/***** OCR + PARSE *****/
function ocrSlipFromFileId_PR_(fileId){
  if (!GCV_API_KEY) throw new Error('Missing GCV_API_KEY');
  const blob = DriveApp.getFileById(fileId).getBlob();
  const b64  = Utilities.base64Encode(blob.getBytes());
  const url = 'https://vision.googleapis.com/v1/images:annotate?key=' + encodeURIComponent(GCV_API_KEY);
  const payload = { requests: [{
    image:{ content:b64 },
    features:[{type:'DOCUMENT_TEXT_DETECTION'}],
    imageContext:{ languageHints:['th','en'] }
  }]};
  const res = UrlFetchApp.fetch(url,{
    method:'post', contentType:'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions:true
  });
  if (res.getResponseCode() >= 300) throw new Error('Vision '+res.getResponseCode()+' '+res.getContentText());
  const data = JSON.parse(res.getContentText());
  return data.responses?.[0]?.fullTextAnnotation?.text || '';
}

const TH_MONTHS_PR = {'ม.ค.':1,'มกราคม':1,'ก.พ.':2,'กุมภาพันธ์':2,'มี.ค.':3,'มีนาคม':3,'เม.ย.':4,'เมษายน':4,'พ.ค.':5,'พฤษภาคม':5,'มิ.ย.':6,'มิถุนายน':6,'ก.ค.':7,'กรกฎาคม':7,'ส.ค.':8,'สิงหาคม':8,'ก.ย.':9,'กันยายน':9,'ต.ค.':10,'ตุลาคม':10,'พ.ย.':11,'พฤศจิกายน':11,'ธ.ค.':12,'ธันวาคม':12};
function thaiYearToCE_PR_(y){ y=Number(y); return y>2400? y-543 : y; }

function parseThaiSlip_PR_(raw){
  // --- keep newlines; compress spaces only ---
  const text0 = String(raw || '').replace(/\u200B/g, '');
  const text  = text0.replace(/[^\S\r\n]+/g, ' ').trim(); // อย่าลบ \n

  const toNum = (s) => {
    const cleaned = String(s || '').replace(/,/g,'').replace(/(,|\.)$/, '');
    const v = Number(cleaned.replace(',', '.'));
    return isFinite(v) ? v : NaN;
  };

  const NEG = /(ค่\s*า\s*ธ\s*ร\s*ร\s*ม\s*เ\s*นี\s*ย\s*ม|ค่าธรรมเนียม|fee|charge|ค่าบริการ|ค่าทำเนียม)/i;
  const CURR = /(บาท|THB)/i;
  const LABEL = /(จำนวนเงิน(?:ที่\s*ชำระ)?|ยอดชำระ|ยอดรวมสุทธิ|ยอดรวม|amount\s*paid|total\s*amount|amount)/i;

  // split to lines for line-based proximity
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  // NEW: try to identify sender/receiver bank + receiver account
  let fromBank = '';
  let toBank   = '';
  let receiver = null; // { accountNumber, code, bank, label }

  for (let i = 0; i < lines.length; i++) {
    const ln   = lines[i];
    const next = lines[i+1] || '';

    if (!fromBank && /(จากบัญชี|ผู้โอน|จาก บัญชี|from account|from)/i.test(ln)) {
      fromBank = detectBankCodeFromText_(ln + ' ' + next) || fromBank;
    }

    if (!toBank && /(เข้าบัญชี|ผู้รับเงิน|ปลายทาง|ไปยังบัญชี|to account|to)/i.test(ln)) {
      const combined = ln + ' ' + next;
      toBank = detectBankCodeFromText_(combined) || toBank;
      if (!receiver) receiver = detectReceiverAccountFromText_(combined);
    }
  }

  if (!fromBank || !toBank) {
    const generic = detectBankCodeFromText_(text);
    if (!fromBank) fromBank = generic;
    if (!toBank)   toBank   = generic;
  }

  // helper: is a line a "fee/commission" line?
  const isFeeLine = (s) => NEG.test(s);

  // 1) PASS A: anchor by label → pick number on same line (or the next line), but ignore fee-lines
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!LABEL.test(ln)) continue;

    // candidate lines to search numbers: same line + next line (บางสลิปขึ้นบรรทัดใหม่)
    const pool = [ln];
    if (i + 1 < lines.length) pool.push(lines[i + 1]);

    for (const seg of pool) {
      if (isFeeLine(seg)) continue; // ข้ามบรรทัดค่าธรรมเนียม
      // หาเลขที่ติด/ใกล้ "บาท|THB" ก่อน
      let m = seg.match(/\b([0-9]{1,3}(?:,[0-9]{3})*(?:[.,]\d{1,2})?)\b(?:\s*(?:บาท|THB))\b/i);
      if (!m) m = seg.match(/\b(?:บาท|THB)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:[.,]\d{1,2})?)\b/i);
      // ถ้าไม่เจอคู่กับสกุลเงิน ให้เอาเลข “ตัวแรก” ที่ไม่ใช่ 0 ในบรรทัดนี้
      if (!m) m = seg.match(/\b(?!0+(?:[.,]0+)?\b)([0-9]{1,3}(?:,[0-9]{3})*(?:[.,]\d{1,2})?)\b/);

      if (m) {
        const v = toNum(m[1]);
        if (isFinite(v) && v > 0) {
          // ได้ยอดแล้ว → ข้ามขั้นตอนอื่น
          return finalize(v, text);
        }
      }
    }
  }

  // 2) PASS B: หาเลขที่ "ติด" บาท/THB (ทั้งก่อนหรือหลัง) และไม่ใช่บรรทัดค่าธรรมเนียม
  for (const seg of lines) {
    if (isFeeLine(seg)) continue;
    let m = seg.match(/\b([0-9]{1,3}(?:,[0-9]{3})*(?:[.,]\d{1,2})?)\b(?:\s*(?:บาท|THB))\b/i);
    if (!m) m = seg.match(/\b(?:บาท|THB)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:[.,]\d{1,2})?)\b/i);
    if (m) {
      const v = toNum(m[1]);
      if (isFinite(v) && v > 0) return finalize(v, text);
    }
  }

  // 3) PASS C: เก็บเลขทั้งหมดในบรรทัดที่มีคำว่า "จำนวนเงิน/ยอดชำระ/amount/total" (ไม่ต้องติด THB) ที่ไม่ใช่บรรทัดค่าธรรมเนียม
  const loose = [];
  for (const seg of lines) {
    if (isFeeLine(seg)) continue;
    if (!LABEL.test(seg) && !CURR.test(seg)) continue;
    const nums = seg.match(/\b(?!0+(?:[.,]0+)?\b)([0-9]{1,3}(?:,[0-9]{3})*(?:[.,]\d{1,2})?)\b/g);
    if (!nums) continue;
    for (const s of nums) {
      const v = toNum(s);
      if (isFinite(v) && v > 0) loose.push(v);
    }
  }
  if (loose.length) {
    // เลือกค่าที่มากที่สุดในบรรทัด anchor (กัน 89/705 นำหน้า)
    const v = loose.sort((a,b)=>b-a)[0];
    return finalize(v, text);
  }

  // 4) ถ้ายังไม่เจอเลย → คืน amount=null แต่ยังพยายามเดา bank/date/time/ref ตามเดิม
  return finalize(null, text);

  // --- helper: append date/time/bank/ref parsing ---
  function finalize(amount, fullText){
    let txDate=null, txTime=null, txId=null, bank=null;

    const TH_MONTHS_PR = {'ม.ค.':1,'มกราคม':1,'ก.พ.':2,'กุมภาพันธ์':2,'มี.ค.':3,'มีนาคม':3,'เม.ย.':4,'เมษายน':4,'พ.ค.':5,'พฤษภาคม':5,'มิ.ย.':6,'มิถุนายน':6,'ก.ค.':7,'กรกฎาคม':7,'ส.ค.':8,'สิงหาคม':8,'ก.ย.':9,'กันยายน':9,'ต.ค.':10,'ตุลาคม':10,'พ.ย.':11,'พฤศจิกายน':11,'ธ.ค.':12,'ธันวาคม':12};
    function thaiYearToCE_PR_(y){ y=Number(y); return y>2400? y-543 : (y<100? (y+2000) : y); }

    let d=fullText.match(/\b([0-3]?\d)\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(\d{2,4})\b/);
    if (d){ const day=Number(d[1]); const mo=TH_MONTHS_PR[d[2]]; const y=thaiYearToCE_PR_(d[3]); if(mo){ try{ txDate=new Date(y,mo-1,day);}catch{} } }

    const t = fullText.match(/\b([01]?\d|2[0-3])[:\.]([0-5]\d)\b/);
    if (t) txTime = `${String(t[1]).padStart(2,'0')}:${t[2]}`;

    const refREs = [
      /(หมายเลขอ้างอิง|เลขที่อ้างอิง|reference|ref\.?|transaction id|trace id)\s*[:\-]?\s*([A-Za-z0-9\-]{6,})/i,
      /\bFT[A-Z0-9\-]{6,}\b/i
    ];
    for (const re of refREs) {
      const mm = fullText.match(re);
      if (mm) { txId = (mm[2] || mm[0]).replace(/^(หมายเลขอ้างอิง|เลขที่อ้างอิง|reference|ref\.?|transaction id|trace id)\s*[:\-]?\s*/i,'').trim(); break; }
    }

    const mainBank = toBank || fromBank || detectBankCodeFromText_(fullText);
    const recv = receiver || detectReceiverAccountFromText_(fullText);

    return {
      rawText: fullText,
      amount: (amount!=null ? Number(amount) : null),
      txDate,
      txTime,
      txId,
      bank: mainBank,
      fromBank,
      toBank,
      receiverAccountNumber: recv ? recv.accountNumber : '',
      receiverAccountCode:   recv ? recv.code          : '',
      receiverBank:          recv ? recv.bank          : mainBank
    };
  }
}






/***** SHEETS HELPERS *****/
function monthKey_PR_(d){ return Utilities.formatDate(d||new Date(),'Asia/Bangkok','yyyy-MM'); }
function getHeaders_PR_(sh){ const c=sh.getLastColumn(); return c? sh.getRange(1,1,1,c).getValues()[0].map(h=>String(h||'').trim()):[]; }
function idxOf_PR_(hdr, key){ const keyL=key.toLowerCase(); const lower=hdr.map(h=>h.toLowerCase()); for (let i=0;i<lower.length;i++) if (lower[i].indexOf(keyL)!==-1) return i; return -1; }
function openRevenueSheetByName_PR_(name){
  const ss = SpreadsheetApp.openById(REVENUE_SHEET_ID);
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Sheet not found in Revenue file: '+name);
  return sh;
}
function genSlipId_PR_(){ const ts=Utilities.formatDate(new Date(),'Asia/Bangkok',"yyyyMMdd-HHmmss"); const r=Math.floor(Math.random()*9000)+1000; return `SLIP-${ts}-${r}`; }

function recordSlipToInbox_PR_({ lineUserId, room, slipUrl, declaredAmount, note }){
  const sh  = openRevenueSheetByName_PR_('Payments_Inbox');
  const hdr = getHeaders_PR_(sh);
  const cSlipID=idxOf_PR_(hdr,'slipid'), cRecvAt=idxOf_PR_(hdr,'received'), cUser=idxOf_PR_(hdr,'lineuserid'),
        cRoom=idxOf_PR_(hdr,'room'), cAmtDecl=idxOf_PR_(hdr,'amountdecl'), cUrl=idxOf_PR_(hdr,'slipurl'),
        cMatchSt=idxOf_PR_(hdr,'matchstatus'), cNotes=idxOf_PR_(hdr,'notes');
  const slipId = genSlipId_PR_();
  const row = new Array(hdr.length).fill('');
  if (cSlipID>-1) row[cSlipID]=slipId;
  if (cRecvAt>-1) row[cRecvAt]=new Date();
  if (cUser>-1)   row[cUser]=lineUserId||'';
  if (cRoom>-1)   row[cRoom]=(room||'').toUpperCase();
  if (cAmtDecl>-1)row[cAmtDecl]=(declaredAmount!=null? Number(declaredAmount):'');
  if (cUrl>-1)    row[cUrl]=slipUrl||'';
  if (cMatchSt>-1)row[cMatchSt]='pending';
  if (cNotes>-1)  row[cNotes]=note||'';
  const next = sh.getLastRow()+1;
  sh.getRange(next,1,1,hdr.length).setValues([row]);
  return { slipId, rowIndex: next };
}

function findCandidateBill_PR_({ room, declaredAmount, ym }) {
  const sh  = openRevenueSheetByName_PR_('Horga_Bills');
  const hdr = getHeaders_PR_(sh);
  const lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 2) return null;

  const cBill  = idxOf_PR_(hdr,'billid');
  const cRoom  = idxOf_PR_(hdr,'room');
  const cMonth = idxOf_PR_(hdr,'month');
  const cAmt   = idxOf_PR_(hdr,'amountdue');
  const cStatus= idxOf_PR_(hdr,'status');
  const cSlip  = idxOf_PR_(hdr,'slipid');

  const vals       = sh.getRange(2,1,lastRow-1,lastCol).getValues();
  const wantRoom   = String(room||'').trim().toUpperCase();
  const wantYM     = String(ym||'').trim();                       // มาจากปุ่มที่ผู้ใช้เลือก
  const currentYM  = monthKey_PR_(new Date());

  const cand = [];
  for (let i=0;i<vals.length;i++){
    const r       = vals[i];
    const rRoom   = String(r[cRoom]||'').toUpperCase().trim();
    const rMonth  = normalizeYM_(r[cMonth]);                      // ← Normalize สำคัญ
    if (rRoom !== wantRoom) continue;

    // unpaid เท่านั้น
    const rStatus = String(r[cStatus]||'').toLowerCase().trim();
    const unpaid  = !(rStatus === 'paid' || rStatus === 'จ่ายแล้ว' || String(r[cSlip]||'').trim());
    if (!unpaid) continue;

    // ถ้าผู้ใช้เลือกเดือนมาแล้ว → บังคับให้ตรงเดือนนั้นเท่านั้น
    if (wantYM && rMonth !== wantYM) continue;

    const amt   = Number(r[cAmt]||0);
    let score   = wantYM ? 2 : (rMonth === currentYM ? 2 : 1);    // ถ้าไม่ได้เลือกเดือน ให้เอนเอียงเดือนปัจจุบัน
    if (declaredAmount != null && Math.abs(amt - Number(declaredAmount)) < 0.5) score += 2;

    cand.push({
      rowIndex: i+2,
      billId:   String(r[cBill]||'').trim(),
      month:    rMonth,
      amountDue: amt,
      score
    });
  }

  if (!cand.length) return null;
  cand.sort((a,b)=>b.score-a.score);
  const top  = cand[0].score;
  const ties = cand.filter(x=>x.score===top);
  if (ties.length > 1) return { ambiguous:true, candidates:ties };
  return { candidate: cand[0] };
}



function updateBillWithSlip_PR_({ rowIndex, slipId, markStatus, bankMatchStatus }){
  const sh  = openRevenueSheetByName_PR_('Horga_Bills');
  const hdr = getHeaders_PR_(sh);
  const cStatus    = idxOf_PR_(hdr,'status');
  const cPaidAt    = idxOf_PR_(hdr,'paidat');
  const cSlip      = idxOf_PR_(hdr,'slipid');
  const cBankMatch = idxOf_PR_(hdr,'bankmatchstatus');
  if (cSlip>-1)     sh.getRange(rowIndex, cSlip+1).setValue(slipId);
  if (cPaidAt>-1)   sh.getRange(rowIndex, cPaidAt+1).setValue(new Date());
  if (cStatus>-1)   sh.getRange(rowIndex, cStatus+1).setValue(markStatus||'Slip Received');
  if (cBankMatch>-1 && bankMatchStatus) sh.getRange(rowIndex, cBankMatch+1).setValue(bankMatchStatus);
}

function updateInboxMatchResult_PR_({
  rowIndex,
  status,
  matchedBillId,
  confidence,
  note,
  ocrAmount,
  billAmount,
  delta,
  ocrBank,
  ocrAccountCode,
  ocrAccountNo
}){
  const sh  = openRevenueSheetByName_PR_('Payments_Inbox');
  const hdr = getHeaders_PR_(sh);

  const cSt = idxOf_PR_(hdr,'matchstatus');
  const cId = idxOf_PR_(hdr,'matchedbillid');
  const cCf = idxOf_PR_(hdr,'confidence');
  const cNt = idxOf_PR_(hdr,'notes');

  // new columns
  const cOCR = idxOf_PR_(hdr,'ocr_amount');       // also accept case-insensitive match
  const cOCR2= idxOf_PR_(hdr,'ocramount');
  const cBA  = idxOf_PR_(hdr,'bill_amount');
  const cBA2 = idxOf_PR_(hdr,'billamount');
  const cDL  = idxOf_PR_(hdr,'amount_delta');
  const cDL2 = idxOf_PR_(hdr,'delta');
  const cBk      = idxOf_PR_(hdr,'ocr_bank');
  const cAccCode = idxOf_PR_(hdr,'ocr_accountcode');
  const cAccNo   = idxOf_PR_(hdr,'ocr_accountno');

  // compute delta if not provided
  let _delta = delta;
  if (_delta == null && (ocrAmount != null) && (billAmount != null)) {
    _delta = Number(billAmount) - Number(ocrAmount);
  }

  if (cSt>-1) sh.getRange(rowIndex, cSt+1).setValue(status||'');
  if (cId>-1) sh.getRange(rowIndex, cId+1).setValue(matchedBillId||'');
  if (cCf>-1) sh.getRange(rowIndex, cCf+1).setValue(confidence!=null? Number(confidence):'');
  if (cNt>-1) sh.getRange(rowIndex, cNt+1).setValue(note||'');

  // write amounts (any of the accepted header names)
  const setNum = (colIdx, v) => { if (colIdx>-1) sh.getRange(rowIndex, colIdx+1).setValue(v!=null? Number(v):''); };
  setNum(cOCR>-1? cOCR : cOCR2, ocrAmount);
  setNum(cBA >-1? cBA  : cBA2 , billAmount);
  setNum(cDL >-1? cDL  : cDL2 , _delta);

  if (cBk>-1)      sh.getRange(rowIndex, cBk+1).setValue(ocrBank || '');
  if (cAccCode>-1) sh.getRange(rowIndex, cAccCode+1).setValue(ocrAccountCode || '');
  if (cAccNo>-1)   sh.getRange(rowIndex, cAccNo+1).setValue(ocrAccountNo || '');
}


function enqueueReview_PR_({ room, billId, declaredAmount, amountDue, reason, slipId, note, lineUserId }){
  const sh  = openRevenueSheetByName_PR_('Review_Queue');
  const hdr = getHeaders_PR_(sh);
  const row = new Array(hdr.length).fill('');
  const set = (key,val)=>{ const i=idxOf_PR_(hdr,key); if(i>-1) row[i]=val; };
  set('CreatedAt', new Date());
  set('Room', (room||'').toUpperCase());
  set('BillID', billId||'');
  set('AmountDecl', declaredAmount!=null? Number(declaredAmount):'');
  set('AmountDue',  amountDue!=null? Number(amountDue):'');
  set('Reason', reason||'');
  set('SlipID', slipId||'');
  if (note) set('Notes', note);
  set('LineUserID', lineUserId||'');
  sh.getRange(sh.getLastRow()+1,1,1,hdr.length).setValues([row]);
}

/***** MATCH CORE (drop-in) *****/
function getBillAccountByRow_PR_(rowIndex){
  try{
    const sh  = openRevenueSheetByName_PR_('Horga_Bills');
    const hdr = getHeaders_PR_(sh);
    const cAcc = idxOf_PR_(hdr, 'account');
    if (cAcc < 0) return '';
    return String(sh.getRange(rowIndex, cAcc+1).getValue() || '').trim().toUpperCase();
  }catch(e){ return ''; }
}

function normalizeBankFromCodeOrBank_PR_(val){
  const v = String(val || '').trim().toUpperCase();
  if (!v) return '';
  if (v.indexOf('GSB') !== -1) return 'GSB';
  if (v.indexOf('KKB') !== -1 || v.indexOf('KKK') !== -1 || v.indexOf('KKBANK') !== -1) return 'KBANK';
  if (v.indexOf('BAY') !== -1 || v.indexOf('KGSI') !== -1) return 'BAY';
  if (v.indexOf('TMK') !== -1 || v.indexOf('MAK') !== -1) return 'KBANK';
  if (v.indexOf('KBIZ') !== -1) return 'KBIZ';
  return v;
}

function deriveBankMatchStatus_PR_(billAccountCode, ocrMetaObj){
  const billBank = normalizeBankFromCodeOrBank_PR_(billAccountCode);
  const ocrBank  = normalizeBankFromCodeOrBank_PR_(ocrMetaObj?.bank || ocrMetaObj?.code);
  if (!billBank) return '';
  if (!ocrBank || ocrBank === 'NON_MATCH') return 'receiver_non_match';
  if (billBank === ocrBank) return 'receiver_matched';
  return 'receiver_mismatch';
}

function tryMatchAndConfirm_PR_(args){
  const ym         = String(args.ym || '').trim();
  const room       = (args.room || '').toUpperCase().trim();
  const slipUrl    = args.slipUrl || '';
  const lineUserId = args.lineUserId || '';
  const fileId     = args.fileId || '';

  // 1) Create inbox row first
  const inbox = recordSlipToInbox_PR_({
    lineUserId, room, slipUrl, declaredAmount:null, note:'auto-created by PAY_RENT'
  });

  // 2) OCR
  let ocr = null, ocrOk = false;
  const ocrMeta = () => {
    if (!ocr) return { bank:'UNKNOWN', code:'NON_MATCH', acc:'NON_MATCH' };
    const bank = ocr.receiverBank || ocr.bank || 'UNKNOWN';
    if (ocr.receiverAccountNumber) {
      return {
        bank,
        code: ocr.receiverAccountCode || '',
        acc: ocr.receiverAccountNumber
      };
    }
    // Explicitly mark missing/mismatched receiver account
    return { bank, code:'NON_MATCH', acc:'NON_MATCH' };
  };
  if (fileId){
    try{
      const raw = ocrSlipFromFileId_PR_(fileId);
      ocr = parseThaiSlip_PR_(raw);
      ocrOk = !!(ocr && (ocr.amount!=null || ocr.txDate || ocr.txId || ocr.bank));

      updateInboxMatchResult_PR_({
        rowIndex: inbox.rowIndex,
        status: 'pending_ocr',
        matchedBillId: '',
        confidence: '',
        note: `OCR: amount=${ocr?.amount ?? ''}, date=${ocr?.txDate? Utilities.formatDate(ocr.txDate,'Asia/Bangkok','yyyy-MM-dd') : ''}, bank=${ocr?.bank ?? ''}, ref=${ocr?.txId ?? ''}`,
        ocrAmount: (ocr && ocr.amount!=null)? Number(ocr.amount): null,
        ocrBank: ocrMeta().bank,
        ocrAccountCode: ocrMeta().code,
        ocrAccountNo:   ocrMeta().acc
      });

    }catch(e){
      console.error('OCR_FAILED', e);
      updateInboxMatchResult_PR_({
        rowIndex: inbox.rowIndex,
        status: 'ocr_missing',
        matchedBillId: '',
        confidence: 0.2,
        note: 'OCR failed – matching by selected month',
        ocrAmount: null,
        ocrBank: 'UNKNOWN',
        ocrAccountCode: 'NON_MATCH',
        ocrAccountNo: 'NON_MATCH'
      });
      ocr = null;
      ocrOk = false;
    }
  } else {
    updateInboxMatchResult_PR_({
      rowIndex: inbox.rowIndex,
      status:'no_ocr_source',
      matchedBillId:'',
      confidence:'',
      note:'No fileId → skip OCR',
      ocrAmount: null,
      ocrBank: 'UNKNOWN',
      ocrAccountCode: 'NON_MATCH',
      ocrAccountNo: 'NON_MATCH'
    });
  }

  // 3) Try to find a bill candidate using OCR amount (if any) + selected month
  const declaredAmount = (ocr && ocr.amount!=null)? Number(ocr.amount): null;
  const found = findCandidateBill_PR_({ room, declaredAmount, ym });

  if (!found){
    updateInboxMatchResult_PR_({
      rowIndex: inbox.rowIndex,
      status: 'no_open_bill',
      matchedBillId: '',
      confidence: 0.0,
      note: ocrOk ? 'no_open_bill (have OCR)' : 'no_open_bill (no/failed OCR)',
      ocrAmount: declaredAmount,
      ocrBank: ocrMeta().bank,
      ocrAccountCode: ocrMeta().code || 'NON_MATCH',
      ocrAccountNo:   ocrMeta().acc  || 'NON_MATCH'
    });
    enqueueReview_PR_({
      room, declaredAmount, reason:'no_open_bill',
      slipId: inbox.slipId, note:'auto-queued', lineUserId
    });
    return { ok:false, reason:'no_open_bill', slipId: inbox.slipId };
  }

  if (found.ambiguous){
    updateInboxMatchResult_PR_({
      rowIndex: inbox.rowIndex,
      status: 'ambiguous',
      matchedBillId: '',
      confidence: 0.3,
      note: 'multiple candidates' + (ocrOk?' (have OCR)':' (no/failed OCR)'),
      ocrAmount: declaredAmount,
      ocrBank: ocrMeta().bank,
      ocrAccountCode: ocrMeta().code || 'NON_MATCH',
      ocrAccountNo:   ocrMeta().acc  || 'NON_MATCH'
    });
    enqueueReview_PR_({
      room, declaredAmount, reason:'ambiguous_candidates',
      slipId: inbox.slipId, lineUserId
    });
    return { ok:false, reason:'ambiguous' };
  }

  // 4) We have a single candidate
  const cand    = found.candidate;
  const billAmt = Number(cand.amountDue);
  let conf      = 0.70;
  const billAccountCode = getBillAccountByRow_PR_(cand.rowIndex);
  const bankMatchStatus = deriveBankMatchStatus_PR_(billAccountCode, ocrMeta());

  // If OCR worked, compare amounts
  if (ocrOk && ocr.amount!=null){
    const delta = Math.abs(Number(ocr.amount) - billAmt);

    if (delta > 3){
      updateInboxMatchResult_PR_({
        rowIndex: inbox.rowIndex,
        status: 'amount_mismatch',
        matchedBillId: cand.billId,
        confidence: 0.4,
        note: `OCR amount=${ocr.amount}; bill=${billAmt}; Δ=${delta}`,
        ocrAmount: Number(ocr.amount),
        billAmount: billAmt,
        ocrBank: ocrMeta().bank,
        ocrAccountCode: ocrMeta().code,
        ocrAccountNo:   ocrMeta().acc
      });
      enqueueReview_PR_({
        room, billId:cand.billId,
        declaredAmount: Number(ocr.amount),
        amountDue: billAmt,
        reason:'amount_mismatch',
        slipId: inbox.slipId,
        note:'blocked auto-match',
        lineUserId
      });
      return { ok:false, reason:'amount_mismatch' };
    }

    conf = delta < 0.5 ? 0.98 : 0.90;
  }

  // Slight confidence boost if tx month matches bill month
  if (ocrOk && ocr.txDate){
    const billMonth = String(cand.month || '');
    const txMonth   = Utilities.formatDate(ocr.txDate,'Asia/Bangkok','yyyy-MM');
    if (billMonth === txMonth) conf = Math.min(0.99, conf + 0.02);
  }

  // Guard: still no usable OCR at all → send to manual review
  const hasOcrAmount = (ocrOk && ocr && ocr.amount != null);
  if (!hasOcrAmount){
    updateInboxMatchResult_PR_({
      rowIndex: inbox.rowIndex,
      status: 'no_ocr_data',
      matchedBillId: cand.billId || '',
      confidence: 0.35,
      note: 'Missing OCR amount → manual review',
      ocrAmount: (ocr && ocr.amount!=null)? Number(ocr.amount): null,
      billAmount: billAmt,
      ocrBank: ocrMeta().bank,
      ocrAccountCode: ocrMeta().code || 'NON_MATCH',
      ocrAccountNo:   ocrMeta().acc  || 'NON_MATCH'
    });
    enqueueReview_PR_({
      room,
      billId: cand.billId,
      declaredAmount: (ocr && ocr.amount!=null)? Number(ocr.amount): null,
      amountDue: billAmt,
      reason: 'no_ocr_data',
      slipId: inbox.slipId,
      note: 'auto-queued (no OCR data)',
      lineUserId
    });
    return { ok:false, reason:'no_ocr_data' };
  }

  // 5) Success path — mark bill, write amounts & delta
  updateBillWithSlip_PR_({
    rowIndex: cand.rowIndex,
    slipId: inbox.slipId,
    markStatus:'Slip Received',
    bankMatchStatus
  });

  const matchNote = ocrOk
    ? `OCR OK; bank=${ocr.bank||''}; ref=${ocr.txId||''}`
    : 'Matched using selected month (no OCR data)';

  updateInboxMatchResult_PR_({
    rowIndex: inbox.rowIndex,
    status:'matched',
    matchedBillId: cand.billId,
    confidence: conf,
    note: matchNote,
    ocrAmount: (ocr && ocr.amount!=null)? Number(ocr.amount): null,
    billAmount: billAmt,
    ocrBank: ocrMeta().bank,
    ocrAccountCode: ocrMeta().code,
    ocrAccountNo:   ocrMeta().acc
    // Amount_Delta will be computed in the updater if both provided
  });

  return {
    ok:true,
    slipId: inbox.slipId,
    matchedBillId: cand.billId,
    amountDue: cand.amountDue,
    matchedMonth: String(cand.month || '')
  };
}


/***** DRIVE MOVE *****/
function moveFileToFolder_PR_(fileId, srcFolderId, destFolderId){
  if (!fileId || !destFolderId) throw new Error('moveFileToFolder_PR_: missing ids');
  try{
        Drive.Files.update({}, fileId, null, {
      addParents: destFolderId,
      removeParents: srcFolderId || '',
      supportsAllDrives: true
    });
  } catch (e) {
    const file = DriveApp.getFileById(fileId);
    DriveApp.getFolderById(destFolderId).addFile(file);
    if (srcFolderId) {
      try { DriveApp.getFolderById(srcFolderId).removeFile(file); } catch (e2) {}
    }
  }
}

/***** ROOM MAPPING *****/
function findRoomByLineId_PR_(lineId){
  try{
    if (!SHEET_ID) return '';
    const ss  = SpreadsheetApp.openById(SHEET_ID);
    const sh  = ss.getSheetByName('Rooms');
    if (!sh) return '';
    const vals = sh.getDataRange().getValues();
    if (!vals || vals.length < 2) return '';

    const head  = vals.shift().map(h => String(h||'').trim().toLowerCase());
    const cRoom = head.findIndex(h => h.includes('room'));
    const cUser = head.findIndex(h => (h.includes('line') && h.includes('id')) || h === 'lineuserid' || h === 'line_user_id');
    if (cRoom < 0 || cUser < 0) return '';

    for (const r of vals){
      const cellId = String(r[cUser]||'').trim();
      if (cellId && cellId === lineId){
        const room = String(r[cRoom]||'').trim().toUpperCase();
        if (room) return room;
      }
    }
    return '';
  }catch(e){
    console.error('findRoomByLineId_PR_ error:', e);
    return '';
  }
}

function normalizeYM_(val){
  // Date จริง
  if (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val)) {
    return Utilities.formatDate(val, 'Asia/Bangkok', 'yyyy-MM');
  }
  // ตัวเลข yyyymm (เผื่อมีการเก็บเป็น 202510)
  if (typeof val === 'number' && isFinite(val)) {
    const s = String(Math.round(val));
    if (s.length === 6) return s.slice(0,4) + '-' + s.slice(4).padStart(2,'0');
  }
  // สตริงหลายรูปแบบ -> ดึงปี/เดือนหน้า
  const s = String(val||'').trim();
  // 2025-10, 2025/10, 2025 10
  let m = s.match(/^(\d{4})[\/\-\s]?([01]?\d)$/);
  if (m) return m[1] + '-' + String(m[2]).padStart(2,'0');
  // 2025-10-xx หรือ 2025/10/xx
  m = s.match(/^(\d{4})[\/\-]([01]?\d)[\/\-]\d{1,2}$/);
  if (m) return m[1] + '-' + String(m[2]).padStart(2,'0');
  return '';
}

/***** FOLDER HELPERS (AUTO-CREATE YEAR/MONTH) *****/
function ensureFolder_(parentFolderId, name){
  const parent = DriveApp.getFolderById(parentFolderId);
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next().getId();
  return parent.createFolder(name).getId();
}

function getOrCreateMonthFolder_(rootFolderId, ym){
  // ym รูปแบบ "YYYY-MM"
  const m = String(ym||'').match(/^(\d{4})-([01]\d)$/);
  if (!m) return rootFolderId; // ถ้า ym ไม่ชัด ให้ตกไปที่ root
  const year  = m[1];
  const month = m[1] + '-' + m[2]; // "YYYY-MM"
  const yearId  = ensureFolder_(rootFolderId, year);
  const monthId = ensureFolder_(yearId, month);
  return monthId;
}

function getOrCreatePendingFolder_(rootFolderId, ym){
  // กรณี match ไม่ได้/รอตรวจ → เก็บไว้ที่ "YYYY/00_Pending"
  const year = (String(ym||'').slice(0,4).match(/^\d{4}$/) ? String(ym).slice(0,4) :
               Utilities.formatDate(new Date(),'Asia/Bangkok','yyyy'));
  const yearId = ensureFolder_(rootFolderId, year);
  return ensureFolder_(yearId, '00_Pending');
}
