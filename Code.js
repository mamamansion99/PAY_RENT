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
const ADMIN_GROUP_ID   = PROPS.getProperty('ADMIN_GROUP_ID') || ''; // OA group to receive alerts
const LINE_NOTIFY_TOKEN= PROPS.getProperty('LINE_NOTIFY_TOKEN') || '';

// เลขบัญชีธนาคารหอพัก (digits only, no dashes)
const RECEIVER_ACCOUNTS = {
  // KBank – ชั้น 1
  '0911848961':  { code: 'KKK+', bank: 'KBank', label: 'KBank ชั้น 1' },

  // KBank – ชั้น 2  (บัญชี 214-3-83688-9 → MAK+)
  '2143836889':  { code: 'MAK+', bank: 'KBank', label: 'KBank ชั้น 2 (MAK+)' },

  // Krungsri – ชั้น 3
  '5111482754':  { code: 'KGSI', bank: 'BAY',   label: 'Krungsri ชั้น 3' },

  // GSB – ชั้น 4–5
  '050711087200': { code: 'GSB', bank: 'GSB',  label: 'GSB ชั้น 5' },

  // GSB – ชั้น 4–5
  '7602351442': { code: 'TTB', bank: 'TTB',  label: 'TTB ชั้น 4' },

  // Additional account mapping
  '1818203205': { code: 'KBIZ', bank: 'KBIZ', label: 'KBIZ' }
};

/***** ENTRYPOINT *****/
function doPost(e){
  const headers = e?.headers || {};
  const params = e?.parameter || {};
  let body = {};
  try{
    body = JSON.parse(e?.postData?.contents || '{}');
  }catch(err){
    body = {};
  }
  const provided = headers['X-Worker-Secret'] ||
    headers['x-worker-secret'] ||
    body.workerSecret ||
    params.workerSecret ||
    params.worker_secret ||
    '';
  if (provided !== WORKER_SECRET) {
    return ContentService.createTextOutput(JSON.stringify({ ok:false, error:'forbidden' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Direct OCR trigger (e.g., from n8n)
  if (body && body.action === 'ocr') {
    const fileId = body.fileId || body.file_id || body.id || '';
    const room = body.room || '';
    const ym = body.ym || '';
    const lineUserId = body.lineUserId || body.line_user_id || '';
    const slipUrl = body.slipUrl || (fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : '');
    if (!fileId) {
      return ContentService.createTextOutput(JSON.stringify({ ok:false, error:'missing_fileId' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    try{
      const result = tryMatchAndConfirm_PR_({ room, ym, lineUserId, fileId, slipUrl });
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }catch(err){
      return ContentService.createTextOutput(JSON.stringify({
        ok:false,
        error:'ocr_failed',
        message:String(err)
      })).setMimeType(ContentService.MimeType.JSON);
    }
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
    const ym = getBillingYmForNow_();
    const monthLabel = formatRentMonthTh_(ym);
    const room = findRoomByLineId_PR_(userId);

    if (room) {
      setRentStep_(userId, 'await_slip', { ym, room });
      return push_(userId, [{ type:'text', text:`เดือน: ${monthLabel}\nห้อง: ${room}\nส่งสลิปได้เลยค่ะ` }]);
    }
    setRentStep_(userId, 'await_room', { ym });
    return push_(userId, [{ type:'text', text:`เดือน: ${monthLabel}\nพิมพ์เบอร์ห้อง (เช่น A101)` }]);
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

// คืนค่า YM สำหรับรอบบิลปัจจุบัน (จ่ายล่วงหน้าเดือนถัดไปตั้งแต่วันที่ 24 เป็นต้นไป)
function getBillingYmForNow_(){
  const now = new Date();
  const tz  = 'Asia/Bangkok';
  const y   = Number(Utilities.formatDate(now, tz, 'yyyy'));
  const m   = Number(Utilities.formatDate(now, tz, 'MM')) - 1; // 0-based
  const d   = Number(Utilities.formatDate(now, tz, 'dd'));

  let targetY = y;
  let targetM = m;
  if (d >= 24) {
    targetM += 1;
    if (targetM > 11) { targetM = 0; targetY += 1; }
  }
  return targetY + '-' + String(targetM + 1).padStart(2,'0'); // YYYY-MM
}

function ymToDate_(ym){
  const [yStr, mStr] = String(ym || '').split('-');
  const y = Number(yStr);
  const m = Number(mStr) - 1;
  if (!y || isNaN(m)) return new Date();
  return new Date(y, Math.max(0, Math.min(11, m)), 1);
}

function formatRentMonthTh_(ym){
  const d = ymToDate_(ym);
  const yearText = Utilities.formatDate(d, 'Asia/Bangkok', 'yyyy');
  const monthLabel = formatMonthLabel_(d, 'thai');
  return `${monthLabel} ${yearText}`;
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

  if (data.act === 'howto') {
    // โชว์โหลดระหว่างเตรียมคอนเทนต์ (ปรับเวลาตามจริง)
    startLoading_(userId, 6);

    // ตัวอย่างขั้นต่ำ: ส่งข้อความ + รูปเดียว (ปิดรูปถ้ายังไม่ได้ตั้งค่า URL)
    const HOWTO_IMAGE_URL = 'https://.../howto_rent_payment_step.jpg'; // TODO: ใส่ URL จริง
    const hasImage = HOWTO_IMAGE_URL && !HOWTO_IMAGE_URL.includes('...');
    const messages = [
      { type:'text', text:'ขั้นตอนการชำระค่าเช่า:\n1) เลือกเดือนให้ตรงรอบบิล\n2) โอน/สแกน QR ตามยอดบิล\n3) อัปโหลดสลิปในแชทนี้ แล้วรอยืนยันผล' }
    ];
    if (hasImage) {
      messages.push({ type:'image', originalContentUrl: HOWTO_IMAGE_URL, previewImageUrl: HOWTO_IMAGE_URL });
    }
    return push_(userId, messages);
  }

}

/***** IMAGE HANDLER *****/
function onImage_(ev){
  const userId    = ev.source?.userId || '';
  const messageId = ev.message?.id;
  if (!userId || !messageId) return;

  const flow = getRentFlow_(userId);
  if (flow.step !== 'await_slip' || !flow.ym) {
    return push_(userId, [{ type:'text', text:'กรุณาเริ่มที่ “จ่ายค่าเช่า” ก่อนนะคะ' }]);
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
function sendLineNotify_PR_(message){
  if (!LINE_NOTIFY_TOKEN) return;
  try{
    UrlFetchApp.fetch('https://notify-api.line.me/api/notify',{
      method:'post',
      headers:{ Authorization:'Bearer '+LINE_NOTIFY_TOKEN },
      payload:{ message:String(message||'').slice(0,1200) },
      muteHttpExceptions:true
    });
  }catch(e){ console.error('LINE_NOTIFY_FAIL', e); }
}
function adminNotify_PR_(text){
  const msg = String(text||'').slice(0,1200);
  let ok = false;
  if (ADMIN_GROUP_ID){
    try{ push_(ADMIN_GROUP_ID, [{ type:'text', text: msg }]); ok = true; }
    catch(e){ console.error('ADMIN_PUSH_FAIL', e); }
  }
  if (!ok) sendLineNotify_PR_(msg);
}
function notifyGroupPaymentMatched_PR_({ room, amountDue, billId, ocrAmount, slipId, confidence, status }){
  if (!ADMIN_GROUP_ID && !LINE_NOTIFY_TOKEN) return;
  const title = status === 'matched_auto' ? '💵 รับสลิปค่าเช่า' : '⚠️ สลิปต้องตรวจสอบ';
  const lines = [
    room ? `ห้อง: ${room}` : '',
    billId ? `บิล: ${billId}` : '',
    amountDue!=null ? `ยอดบิล: ${Number(amountDue).toLocaleString()}` : '',
    ocrAmount!=null ? `ยอดจากสลิป: ${Number(ocrAmount).toLocaleString()}` : '',
    confidence!=null ? `ความมั่นใจ: ${Math.round(Number(confidence)*100)}%` : '',
    slipId ? `SlipID: ${slipId}` : '',
    status ? `สถานะ: ${status}` : ''
  ].filter(Boolean).join('\n');
  const msg = [title, lines].filter(Boolean).join('\n');
  adminNotify_PR_(msg);
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

  // Helper: allow masked digits (X) to stand in for any digit, scanning for tails
  function maskedTailScore(accNumber, maskedText){
    const accDigits = onlyDigits_(accNumber);
    const masked = String(maskedText || '').replace(/[^0-9xX]/g,'');
    if (!masked || masked.length < 4) return 0;
    const maxLen = Math.min(accDigits.length, 6); // focus on tail 4–6
    for (let len = maxLen; len >= 4; len--){
      const tail = accDigits.slice(-len);
      const limit = masked.length - len;
      for (let i=0; i<=limit; i++){
        let ok = true;
        for (let k=0; k<len; k++){
          const ch = masked[i+k];
          if (!(ch === tail[k] || ch === 'x' || ch === 'X')) { ok = false; break; }
        }
        if (ok) return len; // longest-first search, so return immediately
      }
    }
    return 0;
  }

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

    // Try masked-tail match (e.g., XXX-3-83688-X) – prefer longer tails
    const maskedScore = maskedTailScore(acc, raw);
    if (maskedScore >= 4 && bestScore < (1 + 0.25 * maskedScore)) {
      bestScore = 1 + 0.25 * maskedScore; // 4→2.0, 5→2.25, 6→2.5
      bestKey = acc;
      return;
    }
  });

  // Require at least a 6-digit tail (score>=2) or better to avoid false positives from 4-digit overlaps
  if (!bestKey || bestScore < 2) return null;
  const meta = RECEIVER_ACCOUNTS[bestKey];
  return Object.assign({ accountNumber: bestKey }, meta);
}

// Look up bank/account metadata by our account code (e.g., MAK+, GSB)
function findAccountMetaByCode_(code){
  const want = String(code || '').trim().toUpperCase();
  if (!want) return null;
  for (const accNo in RECEIVER_ACCOUNTS){
    const meta = RECEIVER_ACCOUNTS[accNo];
    if (!meta) continue;
    const metaCode = String(meta.code || '').trim().toUpperCase();
    if (metaCode === want){
      return {
        accountNumber: accNo,
        code: meta.code,
        bank: meta.bank,
        label: meta.label || ''
      };
    }
  }
  return null;
}

/***** OCR + PARSE *****/
function visionOcrFromBlob_PR_(blob, featureType){
  if (!GCV_API_KEY) throw new Error('Missing GCV_API_KEY');
  const b64  = Utilities.base64Encode(blob.getBytes());
  const url = 'https://vision.googleapis.com/v1/images:annotate?key=' + encodeURIComponent(GCV_API_KEY);
  const payload = { requests: [{
    image:{ content:b64 },
    features:[{type: featureType || 'DOCUMENT_TEXT_DETECTION'}],
    imageContext:{ languageHints:['th','en'] }
  }]};
  const res = UrlFetchApp.fetch(url,{
    method:'post', contentType:'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions:true
  });
  if (res.getResponseCode() >= 300) throw new Error('Vision '+res.getResponseCode()+' '+res.getContentText());
  const data = JSON.parse(res.getContentText());
  const resp = data.responses && data.responses[0];
  // prefer fullTextAnnotation, fallback to textAnnotations[0]
  return resp?.fullTextAnnotation?.text || resp?.textAnnotations?.[0]?.description || '';
}

function ocrSlipFromFileId_PR_(fileId){
  const blob = DriveApp.getFileById(fileId).getBlob();
  return visionOcrFromBlob_PR_(blob, 'DOCUMENT_TEXT_DETECTION');
}

function scaleImageForOcr_PR_(blob, factor){
  try{
    const img = ImagesService.open(blob);
    const w = img.getWidth(), h = img.getHeight();
    if (!w || !h) return null;
    const newW = Math.min(Math.round(w * factor), 2200);
    const newH = Math.min(Math.round(h * factor), 2200);
    if (newW <= w && newH <= h) return null;
    return img.resize(newW, newH).getBlob();
  }catch(e){
    console.error('scaleImageForOcr_PR_', e);
    return null;
  }
}

function driveOcrText_PR_(blob){
  // Use Drive OCR as a last resort for faint/low-contrast slips
  let docId = '';
  try{
    const created = Drive.Files.insert(
      { title: 'tmp-slip-ocr', mimeType: 'application/vnd.google-apps.document' },
      blob,
      { ocr:true, ocrLanguage:'th' }
    );
    docId = created.id || '';
    if (!docId) return '';
    const doc = DocumentApp.openById(docId);
    return doc.getBody().getText() || '';
  }catch(e){
    console.error('driveOcrText_PR_', e);
    return '';
  }finally{
    if (docId){
      try{ Drive.Files.remove(docId); }catch(e1){ try{ Drive.Files.trash(docId); }catch(e2){} }
    }
  }
}

function ocrSlipWithFallbacks_PR_(fileId){
  const file = DriveApp.getFileById(fileId);
  const origBlob = file.getBlob();
  const attempts = [];
  const hasAmount = (ocrObj) => !!(ocrObj && ocrObj.amount != null);
  const results = [];
  const wrap = (obj) => Object.assign({ attempts, rawText: combineOcrRawText_PR_(results) }, obj);

  function attempt(label, fn){
    try{
      const raw = fn() || '';
      const ocr = raw ? parseThaiSlip_PR_(raw) : null;
      attempts.push(label + (raw ? '' : ' (empty)'));
      const result = { source: label, raw, ocr };
      if (raw) results.push(result);
      return result;
    }catch(e){
      attempts.push(label + ' (err)');
      console.error('OCR attempt failed', label, e);
      return null;
    }
  }

  attempt('vision', () => visionOcrFromBlob_PR_(origBlob, 'DOCUMENT_TEXT_DETECTION'));

  const bigger = scaleImageForOcr_PR_(origBlob, 1.6);
  if (bigger){
    attempt('vision_scaled', () => visionOcrFromBlob_PR_(bigger, 'DOCUMENT_TEXT_DETECTION'));
  }

  attempt('vision_text', () => visionOcrFromBlob_PR_(origBlob, 'TEXT_DETECTION'));

  let best = pickBestOcrResult_PR_(results);
  const needsDriveFallback =
    !hasAmount(best?.ocr) ||
    !best?.ocr?.txDate ||
    String(best?.raw || '').length < 180;
  if (needsDriveFallback) {
    attempt('drive_ocr', () => driveOcrText_PR_(origBlob));
    best = pickBestOcrResult_PR_(results);
  }

  if (best) return wrap(best);
  return wrap({ source:'vision', raw:'', ocr:null });
}

function scoreOcrResult_PR_(result){
  if (!result || !result.raw) return -1;
  const ocr = result.ocr || {};
  let score = Math.min(String(result.raw || '').length, 5000) / 1000;
  if (ocr.amount != null) score += 8;
  if (ocr.txDate) score += 4;
  if (ocr.txTime) score += 1;
  if (ocr.txId) score += 2;
  if (ocr.receiverAccountNumber) score += 4;
  if (ocr.receiverBank || ocr.bank) score += 1.5;
  return score;
}

function pickBestOcrResult_PR_(results){
  const list = (results || []).filter(r => r && r.raw);
  if (!list.length) return null;
  return list.slice().sort((a,b) => {
    const scoreDiff = scoreOcrResult_PR_(b) - scoreOcrResult_PR_(a);
    if (scoreDiff !== 0) return scoreDiff;
    return String(b.raw || '').length - String(a.raw || '').length;
  })[0];
}

function limitCellText_PR_(text, maxLen){
  const s = String(text || '');
  const n = maxLen || 45000;
  if (s.length <= n) return s;
  return s.slice(0, n - 80) + '\n...[truncated for Google Sheets cell limit]';
}

function combineOcrRawText_PR_(results){
  const seen = {};
  const parts = [];
  (results || []).forEach(r => {
    const raw = String(r && r.raw || '').trim();
    if (!raw) return;
    const key = raw.replace(/\s+/g, ' ').slice(0, 500);
    if (seen[key]) return;
    seen[key] = true;
    parts.push(`--- ${r.source || 'ocr'} ---\n${raw}`);
  });
  return limitCellText_PR_(parts.join('\n\n'), 45000);
}

const TH_MONTHS_PR = {'ม.ค.':1,'มกราคม':1,'ก.พ.':2,'กุมภาพันธ์':2,'มี.ค.':3,'มีนาคม':3,'เม.ย.':4,'เมษายน':4,'พ.ค.':5,'พฤษภาคม':5,'มิ.ย.':6,'มิถุนายน':6,'ก.ค.':7,'กรกฎาคม':7,'ส.ค.':8,'สิงหาคม':8,'ก.ย.':9,'กันยายน':9,'ต.ค.':10,'ตุลาคม':10,'พ.ย.':11,'พฤศจิกายน':11,'ธ.ค.':12,'ธันวาคม':12};
function thaiYearToCE_PR_(y){ y=Number(y); return y>2400? y-543 : y; }

function parseThaiSlip_PR_(raw){
  // --- keep newlines; compress spaces only ---
  const text0 = String(raw || '').replace(/\u200B/g, '');
  const text  = text0.replace(/[^\S\r\n]+/g, ' ').trim(); // อย่าลบ \n

  const toNum = (s) => {
    // Normalize common OCR quirks like "4.900.00" (dot as thousands + dot as decimal)
    const cleaned = String(s || '').replace(/[^\d.,]/g, '');
    if (!cleaned) return NaN;

    const parts = cleaned.split(/[.,]/);
    if (parts.length > 2) {
      // Keep the last part as decimal, merge the rest as integer
      const decimal = parts.pop();
      const intPart = parts.join('');
      const merged = `${intPart}.${decimal}`;
      const v = Number(merged);
      if (isFinite(v)) return v;
    }

    // Fallback: treat comma as thousands separator, last dot/comma as decimal
    const normalized = cleaned.replace(/,/g, '');
    const v = Number(normalized);
    if (isFinite(v)) return v;

    // Last resort: strip all punctuation
    const plain = cleaned.replace(/[.,]/g, '');
    const v2 = Number(plain);
    return isFinite(v2) ? v2 : NaN;
  };

  const NEG = /(ค่\s*า\s*ธ\s*ร\s*ร\s*ม\s*เ\s*นี\s*ย\s*ม|ค่าธรรมเนียม|fee|charge|ค่าบริการ|ค่าทำเนียม)/i;
  const CURR = /(บาท|THB)/i;
  const LABEL = /(จำนวนเงิน(?:ที่\s*ชำระ)?|ยอดชำระ|ยอดรวมสุทธิ|ยอดรวม|amount\s*paid|total\s*amount|amount|จำนวน\s*[:=])/i;

  // split to lines for line-based proximity
  const lines = text.split(/\r?\n/)
    .map(s => s.replace(/(\d)[ \u00A0]+(?=[\d,\.])/g, '$1').trim()) // รวมเลขที่ถูก OCR แยกด้วยช่องว่าง
    .filter(Boolean);

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

  // Fallback: scan entire slip text for our receiver accounts even if no "เข้าบัญชี" label was detected
  if (!receiver) {
    receiver = detectReceiverAccountFromText_(text);
  }

  if (!fromBank || !toBank) {
    const generic = detectBankCodeFromText_(text);
    if (!fromBank) fromBank = generic;
    if (!toBank)   toBank   = generic;
  }

  // If labels missing: infer by top→bottom order of bank mentions (most slips list sender first, receiver second)
  if (!fromBank || !toBank) {
    const banks = [];
    lines.forEach(ln => {
      const b = detectBankCodeFromText_(ln);
      if (b && banks[banks.length-1] !== b) banks.push(b);
    });
    if (!fromBank && banks.length) fromBank = banks[0];
    if (!toBank && banks.length >= 2) toBank = banks[banks.length-1];
    else if (!toBank && banks.length) toBank = banks[0];
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

  // 3.5) PASS D: fallback เก็บเลขที่ “ดูเหมือนยอดเงิน” แม้ไม่มี label/currency (กรณี OCR พังคำว่า จำนวนเงิน)
  // เลือกเฉพาะตัวที่มีจุด/คอมมา หรือจำนวนหลักไม่เกิน 7 (กันเลขบัญชี/อ้างอิงที่ยาวเกิน)
  const moneyishPunct = [];
  const moneyishPlain = [];
  for (const seg of lines) {
    if (isFeeLine(seg)) continue;
    const nums = seg.match(/\b\d[\d,\.]{0,12}\d\b/g);
    if (!nums) continue;
    for (const s of nums) {
      const v = toNum(s);
      if (!isFinite(v) || v <= 0) continue;
      const digitCount = (s.match(/\d/g) || []).length;
      const hasPunct = /[.,]/.test(s);
      if (digitCount >= 9 && !hasPunct) continue; // น่าจะเป็น ref/account มากกว่า
      if (hasPunct) moneyishPunct.push(v);
      else if (digitCount <= 7) moneyishPlain.push(v);
    }
  }
  if (moneyishPunct.length) {
    const v = moneyishPunct.sort((a,b)=>b-a)[0];
    return finalize(v, text);
  }
  if (moneyishPlain.length) {
    const v = moneyishPlain.sort((a,b)=>b-a)[0];
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
function genReceiptId_PR_(){
  const ts = Utilities.formatDate(new Date(),'Asia/Bangkok',"yyyyMMddHHmmss");
  const r = Math.floor(Math.random()*9000)+1000;
  return `RCPT${ts}${r}`;
}
function appendReceiptLedger_PR_(entry){
  try {
    const sh = openRevenueSheetByName_PR_('Receipts_Ledger');
    const hdr = getHeaders_PR_(sh);
    const writes = [];
    const setValueForKey = (key, value) => {
      if (!key || key === 'ReceiptID' || key === 'SlipID') return;
      const idx = idxOf_PR_(hdr, key);
      if (idx > -1) {
        writes.push({ col: idx + 1, value: value ?? '' });
      }
    };
    const setNumberForKey = (key, value) => {
      if (value == null) return setValueForKey(key, '');
      setValueForKey(key, Number(value));
    };

    setValueForKey('Date', entry.date || new Date());
    setValueForKey('YM', entry.ym || '');
    setValueForKey('TxnType', entry.txnType || '');
    setValueForKey('Category', entry.category || '');
    setNumberForKey('Amount', entry.amount);
    setValueForKey('BankAccountCode', entry.bankAccountCode || '');
    setValueForKey('BillID', entry.billId || '');
    setValueForKey('SlipLink', entry.slipLink || '');
    setValueForKey('BankTxnID', entry.bankTxnId || '');
    setValueForKey('LineUserId', entry.lineUserId || '');
    setValueForKey('Source', entry.source || '');
    setValueForKey('Note', entry.note || '');

    const startRow = 2;
    const maxRows = Math.max(sh.getMaxRows(), startRow);
    const checkCols = Math.min(Math.max(hdr.length - 1, 1), 13);
    const rowsToCheck = Math.max(maxRows - startRow + 1, 1);
    const dataCheck = sh.getRange(startRow, 2, rowsToCheck, checkCols).getValues();
    let lastDataRow = startRow - 1;
    for (let i = dataCheck.length - 1; i >= 0; i--) {
      const rowValues = dataCheck[i];
      if (rowValues.some((cell) => cell !== '' && cell != null)) {
        lastDataRow = startRow + i;
        break;
      }
    }
    const targetRow = Math.max(lastDataRow + 1, startRow);
    if (targetRow > sh.getMaxRows()) {
      sh.insertRowsAfter(sh.getMaxRows(), targetRow - sh.getMaxRows());
    }

    writes.forEach(({ col, value }) => {
      sh.getRange(targetRow, col).setValue(value);
    });

    console.log('appendReceiptLedger_PR_: appended row', { row: targetRow, billId: entry.billId, amount: entry.amount });
    return targetRow;
  } catch (err) {
    console.error('appendReceiptLedger_PR_ failed', err, entry);
    return '';
  }
}

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



function updateBillWithSlip_PR_({ rowIndex, slipId, markStatus, bankMatchStatus, accountCode }){
  const sh  = openRevenueSheetByName_PR_('Horga_Bills');
  const hdr = getHeaders_PR_(sh);
  const cStatus    = idxOf_PR_(hdr,'status');
  const cPaidAt    = idxOf_PR_(hdr,'paidat');
  const cSlip      = idxOf_PR_(hdr,'slipid');
  const cBankMatch = idxOf_PR_(hdr,'bankmatchstatus');
  const cAccount   = idxOf_PR_(hdr,'account');
  if (cSlip>-1)     sh.getRange(rowIndex, cSlip+1).setValue(slipId);
  if (cPaidAt>-1)   sh.getRange(rowIndex, cPaidAt+1).setValue(new Date());
  if (cStatus>-1)   sh.getRange(rowIndex, cStatus+1).setValue(markStatus||'Slip Received');
  if (cBankMatch>-1 && bankMatchStatus) sh.getRange(rowIndex, cBankMatch+1).setValue(bankMatchStatus);
  if (cAccount>-1 && accountCode) sh.getRange(rowIndex, cAccount+1).setValue(accountCode);
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
  ocrAccountNo,
  ocrRawText
}){
  const sh  = openRevenueSheetByName_PR_('Payments_Inbox');
  const hdr = getHeaders_PR_(sh);
  const hdrNorm = hdr.map(h => String(h||'').toLowerCase().replace(/[^a-z0-9]/g,''));
  const findCol = (keys) => {
    const arr = Array.isArray(keys) ? keys : [keys];
    for (const k of arr) {
      const norm = String(k||'').toLowerCase().replace(/[^a-z0-9]/g,'');
      const idx = hdrNorm.findIndex(h => h.indexOf(norm) !== -1);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const cSt = findCol('matchstatus');
  const cId = findCol('matchedbillid');
  const cCf = findCol('confidence');
  const cNt = findCol('notes');

  // amount/bank columns (loose matching: underscores/spaces ignored)
  const cOCR = findCol(['ocr_amount','ocramount']);
  // Bill amount: prefer explicit Bill_Amount, else AmountDue as fallback
  let cBA  = findCol(['bill_amount','billamount','bill amt','bill']);
  if (cBA < 0) cBA = findCol(['amountdue','amount_due','amount due']);
  // If still missing Bill_Amount, create the column at the end to guarantee write
  if (cBA < 0) {
    const newCol = sh.getLastColumn() + 1;
    sh.insertColumnAfter(sh.getLastColumn());
    sh.getRange(1, newCol).setValue('Bill_Amount');
    cBA = newCol - 1; // zero-based
    hdrNorm.push('billamount');
  }
  const cDL  = findCol(['amount_delta','delta']);
  const cBk      = findCol('ocr_bank');
  const cAccCode = findCol(['ocr_accountcode','ocr_acctcode','ocr_code']);
  const cAccNo   = findCol(['ocr_accountno','ocr_acctno','ocr_accno']);
  let cRaw        = findCol(['ocr_rawtext','ocrrawtext','raw_ocr','rawocr','ocr_text','ocrtext']);
  if (ocrRawText !== undefined && cRaw < 0) {
    const newCol = sh.getLastColumn() + 1;
    sh.insertColumnAfter(sh.getLastColumn());
    sh.getRange(1, newCol).setValue('OCR_RawText');
    cRaw = newCol - 1;
  }

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
  setNum(cOCR, ocrAmount);
  setNum(cBA , billAmount);
  setNum(cDL , _delta);

  if (cBk>-1)      sh.getRange(rowIndex, cBk+1).setValue(ocrBank || '');
  if (cAccCode>-1) sh.getRange(rowIndex, cAccCode+1).setValue(ocrAccountCode || '');
  if (cAccNo>-1)   sh.getRange(rowIndex, cAccNo+1).setValue(ocrAccountNo || '');
  if (cRaw>-1 && ocrRawText !== undefined) sh.getRange(rowIndex, cRaw+1).setValue(limitCellText_PR_(ocrRawText, 45000));
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
  let billBank = normalizeBankFromCodeOrBank_PR_(billAccountCode);
  const ocrBank = normalizeBankFromCodeOrBank_PR_(ocrMetaObj?.bank || ocrMetaObj?.code);
  if (!billBank && ocrBank) {
    billBank = ocrBank;
  }
  if (!billBank) return 'receiver_unknown';
  if (!ocrBank || ocrBank === 'NON_MATCH') return 'receiver_non_match';
  if (billBank === ocrBank) return 'receiver_matched';
  return 'receiver_mismatch';
}

// Merge OCR receiver info with bill metadata when OCR is missing/weak
function resolveOcrMetaWithBill_(ocrMetaObj, billAccountCode){
  const fallback = findAccountMetaByCode_(billAccountCode);
  const normalizedOcrBank = normalizeBankFromCodeOrBank_PR_(ocrMetaObj?.bank || ocrMetaObj?.code);
  const bank = normalizedOcrBank ||
               normalizeBankFromCodeOrBank_PR_(fallback?.bank || fallback?.code) ||
               'UNKNOWN';

  const hasOcrCode = !!(ocrMetaObj && ocrMetaObj.code && ocrMetaObj.code !== 'NON_MATCH');
  const hasOcrAcc  = !!(ocrMetaObj && ocrMetaObj.acc  && ocrMetaObj.acc  !== 'NON_MATCH');

  const code = hasOcrCode ? ocrMetaObj.code : (fallback ? fallback.code : (ocrMetaObj?.code || 'NON_MATCH'));
  const acc  = hasOcrAcc  ? ocrMetaObj.acc  : (fallback ? fallback.accountNumber : (ocrMetaObj?.acc  || 'NON_MATCH'));

  const usedFallback = !!(fallback && (!hasOcrCode || !hasOcrAcc || !normalizedOcrBank));

  return {
    bank,
    code: code || 'NON_MATCH',
    acc:  acc  || 'NON_MATCH',
    usedFallback
  };
}

function isValidDate_PR_(d){
  return d instanceof Date && !isNaN(d.getTime());
}

function makeDateFromBillMonth_PR_(billYm, day){
  const m = String(billYm || '').match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const dd = Number(day);
  if (!y || mo < 1 || mo > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(y, mo - 1, dd);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== dd) return null;
  return d;
}

function normalizeOcrDateForBillMonth_PR_(ocr, billYm){
  if (!ocr || !billYm || !/^\d{4}-\d{2}$/.test(String(billYm))) return ocr;
  const billDate = ymToDate_(billYm);
  const billYear = billDate.getFullYear();
  const billMonth = billDate.getMonth();

  if (isValidDate_PR_(ocr.txDate)) {
    const txYear = ocr.txDate.getFullYear();
    const txMonth = ocr.txDate.getMonth();
    const txDay = ocr.txDate.getDate();

    // Vision can misread one digit in the Buddhist year. If month/day are
    // usable, anchor the year to the selected bill cycle instead of trusting
    // one noisy OCR digit.
    if (txMonth === billMonth && txYear !== billYear && Math.abs(txYear - billYear) <= 2) {
      const corrected = new Date(billYear, txMonth, txDay);
      if (isValidDate_PR_(corrected)) {
        return Object.assign({}, ocr, {
          txDate: corrected,
          txDateOcrOriginal: Utilities.formatDate(ocr.txDate, 'Asia/Bangkok', 'yyyy-MM-dd'),
          txDateCorrection: `year corrected to ${billYear} from selected bill month ${billYm}`
        });
      }
    }
    return ocr;
  }

  // If OCR mangles the Thai month text but still captures "day ... year - time",
  // recover only the day and use the selected bill month for month/year.
  const raw = String(ocr.rawText || '');
  const m = raw.match(/\b([0-3]?\d)(?![,\d])[\s\S]{1,16}?((?:25|20)\d{2})\s*[-–]\s*([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (!m) return ocr;
  const recovered = makeDateFromBillMonth_PR_(billYm, m[1]);
  if (!recovered) return ocr;
  return Object.assign({}, ocr, {
    txDate: recovered,
    txTime: `${String(m[3]).padStart(2, '0')}:${m[4]}`,
    txDateOcrOriginal: m[0],
    txDateCorrection: `date recovered from selected bill month ${billYm}`
  });
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
  let ocr = null, ocrOk = false, ocrSource = 'vision', ocrRawText = '';
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
      const ocrResult = ocrSlipWithFallbacks_PR_(fileId);
      ocr = ocrResult ? ocrResult.ocr : null;
      ocr = normalizeOcrDateForBillMonth_PR_(ocr, ym);
      ocrRawText = ocrResult ? (ocrResult.rawText || ocrResult.raw || '') : '';
      ocrSource = ocrResult ? (ocrResult.source || 'vision') : 'vision';
      const ocrPassTrail = (ocrResult && ocrResult.attempts && ocrResult.attempts.length)
        ? ` [${ocrResult.attempts.join(' -> ')}]`
        : '';
      const ocrDateNote = ocr?.txDateCorrection ? ` (${ocr.txDateCorrection})` : '';
      ocrOk = !!(ocr && (ocr.amount!=null || ocr.txDate || ocr.txId || ocr.bank));

      updateInboxMatchResult_PR_({
        rowIndex: inbox.rowIndex,
        status: 'pending_ocr',
        matchedBillId: '',
        confidence: '',
        note: `OCR(${ocrSource}): amount=${ocr?.amount ?? ''}, date=${ocr?.txDate? Utilities.formatDate(ocr.txDate,'Asia/Bangkok','yyyy-MM-dd') : ''}${ocrDateNote}, bank=${ocr?.bank ?? ''}, ref=${ocr?.txId ?? ''}${ocrPassTrail}`,
        ocrAmount: (ocr && ocr.amount!=null)? Number(ocr.amount): null,
        ocrBank: ocrMeta().bank,
        ocrAccountCode: ocrMeta().code,
        ocrAccountNo:   ocrMeta().acc,
        ocrRawText
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
  const ocrMetaRaw = ocrMeta();
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
      ocrBank: ocrMetaRaw.bank,
      ocrAccountCode: ocrMetaRaw.code || 'NON_MATCH',
      ocrAccountNo:   ocrMetaRaw.acc  || 'NON_MATCH'
    });
    enqueueReview_PR_({
      room, declaredAmount, reason:'no_open_bill',
      slipId: inbox.slipId, note:'auto-queued', lineUserId
    });
    adminNotify_PR_([
      '⚠️ สลิปไม่มีบิลที่เปิดอยู่',
      room ? `ห้อง: ${room}` : '',
      declaredAmount!=null ? `OCR Amount: ${Number(declaredAmount).toLocaleString()}` : '',
      ocrMetaRaw.bank ? `ธนาคารจากสลิป: ${ocrMetaRaw.bank}` : '',
      inbox.slipId ? `SlipID: ${inbox.slipId}` : ''
    ].filter(Boolean).join('\n'));
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
      ocrBank: ocrMetaRaw.bank,
      ocrAccountCode: ocrMetaRaw.code || 'NON_MATCH',
      ocrAccountNo:   ocrMetaRaw.acc  || 'NON_MATCH'
    });
    enqueueReview_PR_({
      room, declaredAmount, reason:'ambiguous_candidates',
      slipId: inbox.slipId, lineUserId
    });
    adminNotify_PR_([
      '⚠️ สลิปเจอบิลหลายใบ (ambiguous)',
      room ? `ห้อง: ${room}` : '',
      declaredAmount!=null ? `OCR Amount: ${Number(declaredAmount).toLocaleString()}` : '',
      inbox.slipId ? `SlipID: ${inbox.slipId}` : ''
    ].filter(Boolean).join('\n'));
    return { ok:false, reason:'ambiguous' };
  }

  // 4) We have a single candidate
  const cand    = found.candidate;
  const billAmt = Number(cand.amountDue);
  let conf      = 0.70;
  const billAccountCode = getBillAccountByRow_PR_(cand.rowIndex);
  const mergedOcrMeta   = resolveOcrMetaWithBill_(ocrMetaRaw, billAccountCode);
  const ocrBankRaw      = ocrMetaRaw.bank || 'UNKNOWN';
  const ocrCodeRaw      = ocrMetaRaw.code || 'NON_MATCH';
  const ocrAccRaw       = ocrMetaRaw.acc  || 'NON_MATCH';
  const normalizedBank = normalizeBankFromCodeOrBank_PR_(billAccountCode) ||
                         normalizeBankFromCodeOrBank_PR_(mergedOcrMeta.bank) ||
                         normalizeBankFromCodeOrBank_PR_(mergedOcrMeta.code);
  const accountCodeToWrite = normalizedBank || billAccountCode || mergedOcrMeta.code || mergedOcrMeta.acc || '';
  const bankMatchStatus = deriveBankMatchStatus_PR_(accountCodeToWrite, mergedOcrMeta);
  const receiverNote    = mergedOcrMeta.usedFallback ? ' (receiver inferred from bill account; OCR missing)' : '';

  // If OCR worked, compare amounts
  if (ocrOk && ocr.amount!=null){
    const delta = Math.abs(Number(ocr.amount) - billAmt);

    if (delta > 3){
      updateInboxMatchResult_PR_({
        rowIndex: inbox.rowIndex,
        status: 'amount_mismatch',
        matchedBillId: cand.billId,
        confidence: 0.4,
        note: `OCR amount=${ocr.amount}; bill=${billAmt}; Δ=${delta}${receiverNote}`,
        ocrAmount: Number(ocr.amount),
        billAmount: billAmt,
        ocrBank: ocrBankRaw,
        ocrAccountCode: ocrCodeRaw,
        ocrAccountNo:   ocrAccRaw
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
      adminNotify_PR_([
        '⚠️ ยอดสลิปไม่ตรงบิล',
        room ? `ห้อง: ${room}` : '',
        `บิล: ${cand.billId}`,
        `ยอดบิล: ${billAmt.toLocaleString()}`,
        `ยอดสลิป: ${Number(ocr.amount).toLocaleString()}`,
        `ต่างกัน: ${delta.toLocaleString()}`,
        inbox.slipId ? `SlipID: ${inbox.slipId}` : ''
      ].filter(Boolean).join('\n'));
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

  // Guard: missing/invalid bill amount → manual review (avoid #NUM! with blanks)
  if (!Number.isFinite(billAmt)) {
    updateInboxMatchResult_PR_({
      rowIndex: inbox.rowIndex,
      status: 'no_bill_amount',
      matchedBillId: cand.billId || '',
      confidence: 0.35,
      note: 'Bill amount missing/invalid → manual review',
      ocrAmount: declaredAmount,
      billAmount: null,
      ocrBank: ocrBankRaw,
      ocrAccountCode: ocrCodeRaw,
      ocrAccountNo:   ocrAccRaw
    });
    enqueueReview_PR_({
      room,
      billId: cand.billId,
      declaredAmount: declaredAmount,
      amountDue: null,
      reason: 'no_bill_amount',
      slipId: inbox.slipId,
      note: 'auto-queued (no bill amount)',
      lineUserId
    });
    return { ok:false, reason:'no_bill_amount' };
  }

  // Guard: still no usable OCR at all → send to manual review
  const hasOcrAmount = (ocrOk && ocr && ocr.amount != null);
  if (!hasOcrAmount){
    updateInboxMatchResult_PR_({
      rowIndex: inbox.rowIndex,
      status: 'no_ocr_data',
      matchedBillId: cand.billId || '',
      confidence: 0.35,
      note: `Missing OCR amount (${ocrSource}) → manual review${receiverNote}`,
      ocrAmount: (ocr && ocr.amount!=null)? Number(ocr.amount): null,
      billAmount: billAmt,
      ocrBank: ocrBankRaw,
      ocrAccountCode: ocrCodeRaw,
      ocrAccountNo:   ocrAccRaw
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
    adminNotify_PR_([
      '⚠️ สลิปไม่มี OCR amount',
      room ? `ห้อง: ${room}` : '',
      `บิล: ${cand.billId}`,
      `ยอดบิล: ${billAmt.toLocaleString()}`,
      inbox.slipId ? `SlipID: ${inbox.slipId}` : ''
    ].filter(Boolean).join('\n'));
    return { ok:false, reason:'no_ocr_data' };
  }

  // 5) Success path — mark bill, write amounts & delta
  // If receiver bank/account mismatched → send to review instead of auto-match
  if (bankMatchStatus !== 'receiver_matched') {
    updateInboxMatchResult_PR_({
      rowIndex: inbox.rowIndex,
      status:'receiver_mismatch',
      matchedBillId: cand.billId,
      confidence: 0.45,
      note: `Bank/account mismatch (${bankMatchStatus})${receiverNote}`,
      ocrAmount: (ocr && ocr.amount!=null)? Number(ocr.amount): null,
      billAmount: billAmt,
      ocrBank: ocrBankRaw,
      ocrAccountCode: ocrCodeRaw,
      ocrAccountNo:   ocrAccRaw
    });
    enqueueReview_PR_({
      room,
      billId: cand.billId,
      declaredAmount: (ocr && ocr.amount!=null)? Number(ocr.amount): null,
      amountDue: billAmt,
      reason: 'receiver_mismatch',
      slipId: inbox.slipId,
      note: 'auto-queued (receiver mismatch)',
      lineUserId
    });
    adminNotify_PR_([
      '⚠️ สลิป receiver mismatch',
      room ? `ห้อง: ${room}` : '',
      `บิล: ${cand.billId}`,
      `บิลธนาคาร: ${billAccountCode || '-'}`,
      ocrBankRaw ? `ธนาคารจากสลิป: ${ocrBankRaw}` : '',
      inbox.slipId ? `SlipID: ${inbox.slipId}` : ''
    ].filter(Boolean).join('\n'));
    return { ok:false, reason:'receiver_mismatch' };
  }

  updateBillWithSlip_PR_({
    rowIndex: cand.rowIndex,
    slipId: inbox.slipId,
    markStatus:'Slip Received',
    bankMatchStatus,
    accountCode: accountCodeToWrite
  });

  const matchNote = ocrOk
    ? `OCR OK; bank=${ocr.bank||''}; ref=${ocr.txId||''}${ocr?.txDateCorrection ? '; ' + ocr.txDateCorrection : ''}${receiverNote}`
    : `Matched using selected month (no OCR data)${receiverNote}`;

  updateInboxMatchResult_PR_({
    rowIndex: inbox.rowIndex,
    status:'matched',
    matchedBillId: cand.billId,
    confidence: conf,
    note: matchNote,
    ocrAmount: (ocr && ocr.amount!=null)? Number(ocr.amount): null,
    billAmount: billAmt,
    ocrBank: ocrBankRaw,
    ocrAccountCode: ocrCodeRaw,
    ocrAccountNo:   ocrAccRaw
    // Amount_Delta will be computed in the updater if both provided
  });
  notifyGroupPaymentMatched_PR_({
    room,
    amountDue: cand.amountDue,
    billId: cand.billId,
    ocrAmount: (ocr && ocr.amount!=null)? Number(ocr.amount): null,
    slipId: inbox.slipId,
    confidence: conf,
    status: 'matched_auto'
  });
  const ledgerRow = appendReceiptLedger_PR_({
    ym: String(cand.month || '').trim(),
    txnType: 'RentPayment',
    category: 'RENT_PAYMENT',
    amount: cand.amountDue,
    bankAccountCode: billAccountCode,
    billId: cand.billId,
    slipId: inbox.slipId,
    slipLink: slipUrl,
    bankTxnId: ocr?.txId || '',
    lineUserId,
    source: 'PAY_RENT',
    note: matchNote
  });
  if (!ledgerRow) {
    console.warn('receipt ledger append failed for slip', inbox.slipId);
  }

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
