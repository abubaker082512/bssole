import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'adminbssole@gmail.com';

export async function sendOrderConfirmationEmail(order: any, customerEmail: string) {
  const itemsList = order.items?.map((item: any) => 
    `${item.product_name || 'Product'} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n') || 'No items';

  const customerMailOptions = {
    from: `"BS Sole" <${process.env.SMTP_USER || 'noreply@bssole.com'}>`,
    to: customerEmail,
    subject: `Order Confirmed - #${order.id?.slice(0, 8)}`,
    text: `Thank you for your order!

Order ID: ${order.id?.slice(0, 8)}
Total: $${order.total_amount || order.total || 0}

Items:
${itemsList}

Shipping Address:
${order.shipping_address || 'N/A'}

We'll notify you once your order is shipped.

- BS Sole Team`,
  };

  return transporter.sendMail(customerMailOptions);
}

export async function sendAdminOrderNotification(order: any, customerEmail: string) {
  const itemsList = order.items?.map((item: any) => 
    `${item.product_name || 'Product'} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n') || 'No items';

  const adminMailOptions = {
    from: `"BS Sole System" <${process.env.SMTP_USER || 'noreply@bssole.com'}>`,
    to: ADMIN_EMAIL,
    subject: `NEW ORDER - #${order.id?.slice(0, 8)} from ${customerEmail}`,
    text: `New order received!

Order ID: ${order.id?.slice(0, 8)}
Customer Email: ${customerEmail}
Total: $${order.total_amount || order.total || 0}

Items:
${itemsList}

Shipping Address:
${order.shipping_address || 'N/A'}

Payment Method: ${order.payment_method || 'COD'}
Status: ${order.status || 'pending'}

- BS Sole System`,
  };

  return transporter.sendMail(adminMailOptions);
}