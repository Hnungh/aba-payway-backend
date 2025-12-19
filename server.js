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
