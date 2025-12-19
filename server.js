const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto'); // หัวใจสำคัญสำหรับ RSA
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// --- CONFIGURATION ---
const ABA_PAYWAY_MERCHANT_ID = 'ec461056';
const ABA_PAYWAY_URL = 'https://checkout-sandbox.payway.com.kh/api/checkout/v2/payment';

// --- [จุดสำคัญ] วาง Private Key ของคุณที่นี่ ---
// ห้ามให้ใครเห็นรหัสในส่วนนี้เด็ดขาด
const PRIVATE_KEY = ``-

// --- TELEGRAM CONFIG ---
const TELEGRAM_TOKEN = '7577129821:AAF-ZEZJakHhPaejHVKphfoSmBXQ2cK0qH0';
const CHAT_ID = '7299129094';

/**
 * ฟังก์ชันสร้าง Signature ด้วย RSA Private Key (SHA512)
 * แทนที่การใช้ HMAC แบบเดิม
 */
function createAbaSignature(values) {
    const dataToSign = values.join('');
    try {
        const sign = crypto.createSign('RSA-SHA512');
        sign.update(dataToSign);
        // ผลลัพธ์ต้องส่งกลับเป็น Base64 ตามที่ ABA กำหนด
        return sign.sign(PRIVATE_KEY, 'base64');
    } catch (err) {
        console.error("Signing Error:", err);
        return null;
    }
}

app.post('/create-order', async (req, res) => {
    try {
        const order = req.body;
        const req_time = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
        const tran_id = "NXW-" + Date.now();
        const amount = parseFloat(order.total).toFixed(2);

        const firstName = order.customer.firstName || '';
        const lastName = order.customer.lastName || '';
        const email = order.customer.email || '';
        const phone = order.customer.phone || '';
        const return_url = 'https://hnungh.github.io/mpjbard/confirm.html';

        // ลำดับข้อมูล 15 ตัวแปร ตามมาตรฐาน PayWay v2
        const hashData = [
            req_time, 
            ABA_PAYWAY_MERCHANT_ID, 
            tran_id, 
            amount, 
            '', // items (ว่างไว้)
            '', // shipping (ว่างไว้)
            firstName, 
            lastName, 
            email, 
            phone, 
            'purchase', // type
            '', // payment_option (ว่างไว้)
            return_url, 
            '', // cancel_url (ว่างไว้)
            ''  // continue_success_url (ว่างไว้)
        ];

        // สร้าง Signature (Digital Signature)
        const hash = createAbaSignature(hashData);

        if (!hash) throw new Error("Could not generate RSA signature");

        // แจ้งเตือน Telegram
        const tgMsg = `🛍️ **ออเดอร์ใหม่ (รอชำระ RSA)**\nID: ${tran_id}\nลูกค้า: ${firstName} ${lastName}\nยอด: ฿${amount}`;
        axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID, text: tgMsg, parse_mode: 'Markdown'
        }).catch(e => console.log("Telegram Error"));

        // ส่งข้อมูลกลับไปให้ Frontend
        res.json({
            success: true,
            aba_params: {
                req_time,
                merchant_id: ABA_PAYWAY_MERCHANT_ID,
                tran_id,
                amount,
                hash, // ส่งรหัสที่เซ็นด้วย RSA กลับไป
                firstname: firstName,
                lastname: lastName,
                email,
                phone,
                type: 'purchase',
                return_url,
                api_url: ABA_PAYWAY_URL
            }
        });

    } catch (error) {
        console.error('Backend Process Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
ORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running wit
