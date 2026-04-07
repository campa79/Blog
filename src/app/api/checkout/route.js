import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { cart, buyerEmail, total } = await req.json();

    // Configuración de nodemailer. 
    // Por defecto usaremos una cuenta de prueba de Ethereal para que funcione "out of the box".
    // Para producción con Gmail, usarás:
    // host: "smtp.gmail.com",
    // port: 465,
    // secure: true,
    // auth: { user: "TU_GMAIL", pass: "TU_APP_PASSWORD" }
    
    let testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    const itemsHtml = cart.map(item => `<li>${item.quantity}x ${item.name} ($${item.price} c/u)</li>`).join('');

    const mailOptions = {
      from: '"Tech Store" <noreply@desarrollodesoftware.ar>',
      to: "alberto.campagna@bue.edu.ar", // El correo del administrador
      subject: "¡Nueva Compra en tu Tienda!",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #1A73E8;">¡Has recibido una nueva orden!</h2>
          <p>El usuario <strong>${buyerEmail}</strong> acaba de realizar una compra.</p>
          <h3>Detalle de la compra:</h3>
          <ul>
            ${itemsHtml}
          </ul>
          <h3>Total pagado: $${total}</h3>
          <p>Por favor comunicate con el comprador (${buyerEmail}) para coordinar la entrega.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Mensaje de prueba enviado: %s", info.messageId);
    console.log("URL de vista previa: %s", nodemailer.getTestMessageUrl(info));

    return NextResponse.json({ success: true, previewUrl: nodemailer.getTestMessageUrl(info) }, { status: 200 });
  } catch (error) {
    console.error("Error enviando email:", error);
    return NextResponse.json({ error: "Error enviando email" }, { status: 500 });
  }
}
