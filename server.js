const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const MERCHANT_ID = 'ec461056';
const API_URL = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';

// ใช้คีย์เดิมที่คุณมี (ตรวจสอบให้มั่นใจว่าไม่มี Space ปิดท้ายบรรทัด)
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCxG8SNKny1lWln5Yqn4jqVqRnws87ywRcr6Mk9pyWMU2FBQDQQ
b1uURfS47CAXoBsM6/m+oRZ5TOZd+t4T/6Hu/mqHKAOvV+QlmmUqLFcV6YQ7GMej
3M4sEZPk+lL5gEDeTVQG2iG60T9lXghPKSLAMMAA1FrPp4iY1yOmjNYB1wIDAQAB
AoGAFa+8QBA2nWInuitJxf02G5L4FFi4G6fYJ1jFojEq2wVvWww6Xn7Rkb+FKUrv
MmVjmo/0kJ/sqWVorz5OM4MG+BFkZ9R3Yqstxg61SHUyC4HvseevYbfMGWQvitwF
fVSFBvKw2jpHYP1lILvcwDg9XC+v+HsR80vtDX8p66fnQjUCQQDf51vXSVIlUANh
GGU8QPR5crW7Bb1OARM5ccB0wLrP+oKpl2rDHFa1B/x9rMxCx7MdrdulMbM4yqNb
qraA1SONAkEAyn8nObhzdQOm5osPsBUWXQh1+PfAp1wwK7XxmbdbEygNlj+/IQNn
lYFpFuHNGg8tTbicHBi9Ts2mvmn3RzAP8wJAaTriBhd2nQSy4eJGSgA5Jg8MbB5x
bwTAVUIp8nVWF0MkP7JjQdnCwohDWYlp4oTaoLtCPKxUD//ksMNVzMzfTQJACCBO
LKzQRVPeMMZH3OMbwKQER/d5Tb4PWNG2XlrTVtN2qB7qxqJiV8eXtgldt7wAL2xH
J4F+p1jtZhrOh5bQLQJBALA182ePiF4+UlT5D5WEZpas4GyXumguivVGMjIoFt18
xOofBdCJU8fLaoEX248WRN/0WOZdomZeF91+CHC/ARM=
-----END RSA PRIVATE KEY-----`;

function createAbaSignature(values) {
    // กฎเหล็กของ ABA: นำค่ามาต่อกันโดยตรง (ค่าว่างก็ต่อแบบว่าง)
    const rawData = values.join('');
    console.log("--- DEBUG: Data to Sign ---");
    console.log(rawData); // ดูค่านี้ใน Render Logs ว่าเรียงถูกไหม
    console.log("---------------------------");
    
    try {
        const sign = crypto.createSign('RSA-SHA512');
        sign.update(rawData);
        return sign.sign({
            key: PRIVATE_KEY,
            padding: crypto.constants.RSA_PKCS1_PADDING // มาตรฐานสำหรับ .key แบบเดิม
        }, 'base64');
    } catch (err) {
        console.error("Signature Error:", err);
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

        // 15 ตัวแปรตามคู่มือ (ห้ามขาดแม้แต่ตัวเดียว)
        const params = [
            req_time, MERCHANT_ID, tran_id, amount,
            '', // items
            '', // shipping
            firstName, lastName, email, phone,
            'purchase',
            '', // payment_option
            return_url,
            '', // cancel_url
            ''  // continue_success_url
        ];

        const hash = createAbaSignature(params);

        res.json({
            success: true,
            aba_params: {
                req_time, merchant_id: MERCHANT_ID, tran_id, amount, hash,
                firstname: firstName, lastname: lastName, email, phone,
                type: 'purchase', return_url,
                items: '', shipping: '', payment_option: '', cancel_url: '', continue_success_url: '',
                api_url: API_URL
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => console.log('Server Live with Debug Mode'));
