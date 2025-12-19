const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// --- CONFIGURATION (ใส่ข้อมูลของคุณที่นี่) ---
const TELEGRAM_TOKEN = '7577129821:AAF-ZEZJakHhPaejHVKphfoSmBXQ2cK0qH0';
const CHAT_ID = '7299129094';

app.post('/create-order', async (req, res) => {
    const order = req.body;
    
    // 1. สร้างข้อความสำหรับแจ้งเตือนใน Telegram
    const message = `
🛍️ **ออเดอร์ใหม่เข้าแล้ว!**
--------------------------
🆔 Order ID: ${order.order_id || 'N/A'}
👤 ลูกค้า: ${order.customer.firstName} ${order.customer.lastName}
📞 โทร: ${order.customer.phone}
📍 ที่อยู่: ${order.customer.address}
--------------------------
📦 รายการสินค้า:
${order.items.map(item => `- ${item.name} (${item.size}) x${item.qty}`).join('\n')}
--------------------------
💰 ยอดรวมทั้งสิ้น: ฿${order.total.toLocaleString()}
    `;

    try {
        // 2. ส่งข้อมูลเข้า Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });

        // 3. ตอบกลับหน้าเว็บว่าสำเร็จ
        res.status(200).json({
            success: true,
            message: "Order received and notification sent!",
            order_id: order.order_id
        });

    } catch (error) {
        console.error('Telegram Error:', error);
        res.status(500).json({ success: false, error: "Failed to send notification" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto'); // เพิ่มตัวนี้เพื่อทำ Hash
const app = express();

app.use(cors());
app.use(express.json());

// --- ABA PAYWAY CONFIG (ใส่ข้อมูลที่ได้จากอีเมล) ---
const ABA_PAYWAY_MERCHANT_ID = 'ec461056';
const ABA_PAYWAY_API_KEY = '';
const ABA_PAYWAY_URL = 'https://checkout-sandbox.payway.com.kh/api/checkout/v2/payment';

// --- TELEGRAM CONFIG ---
const TELEGRAM_TOKEN = 'TOKEN_เดิมของคุณ';
const CHAT_ID = 'CHAT_ID_เดิมของคุณ';

// ฟังก์ชันสร้าง Hash ตามมาตรฐาน ABA PayWay
function createAbaHash(values) {
    const stringToHash = values.join('');
    return crypto.createHmac('sha512', ABA_PAYWAY_API_KEY)
                 .update(stringToHash)
                 .digest('base64');
}

app.post('/create-order', async (req, res) => {
    const order = req.body;
    const req_time = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14); // รูปแบบ YYYYMMDDHHmmss
    const tran_id = order.order_id;
    const amount = order.total.toFixed(2); // ต้องมีทศนิยม 2 ตำแหน่งตามกฎ ABA

    // 1. เตรียมข้อมูลสำหรับส่งไป ABA
    const firstName = order.customer.firstName;
    const lastName = order.customer.lastName;
    const email = order.customer.email;
    const phone = order.customer.phone;
    
    // เรียงลำดับข้อมูลเพื่อทำ Hash (ห้ามสลับลำดับ!)
    const hashData = [
        req_time, 
        ABA_PAYWAY_MERCHANT_ID, 
        tran_id, 
        amount, 
        '', // items (ถ้าไม่ส่งให้ว่างไว้)
        '', // shipping
        firstName, 
        lastName, 
        email, 
        phone, 
        'purchase', // type
        '', // payment_option
        'https://your-website.com/confirm.html', // return_url
        '', // cancel_url
        ''  // continue_success_url
    ];

    const hash = createAbaHash(hashData);

    // 2. ส่งแจ้งเตือนเข้า Telegram (เหมือนเดิม)
    const message = `🛍️ **ออเดอร์ใหม่ (รอชำระเงิน)**\nID: ${tran_id}\nลูกค้า: ${firstName}\nยอด: ฿${amount}`;
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
    } catch (e) { console.log("Telegram Error"); }

    // 3. ส่งข้อมูลทั้งหมดกลับไปที่ Frontend เพื่อให้หน้าเว็บทำการ Redirect ไป ABA
    res.json({
        success: true,
        aba_params: {
            req_time,
            merchant_id: ABA_PAYWAY_MERCHANT_ID,
            tran_id,
            amount,
            hash,
            firstName,
            lastName,
            email,
            phone,
            type: 'purchase',
            return_url: hashData[11],
            api_url: ABA_PAYWAY_URL
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
