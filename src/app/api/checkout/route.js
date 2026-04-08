import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(req) {
  // Lazy init: only runs at request time, not during build
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { cart, buyerEmail, buyerName, total } = await req.json();

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });
    }

    const itemsHtml = cart
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align:center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align:right;">$${item.price.toLocaleString('es-AR')}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align:right; font-weight:600;">$${(item.price * item.quantity).toLocaleString('es-AR')}</td>
        </tr>`
      )
      .join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: 'Inter', Arial, sans-serif; background: #f8f9fa; margin:0; padding:0;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1A73E8, #0d47a1); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px;">🛒 Nueva Orden Recibida</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">desarrollodesoftware.ar</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px;">
            <h2 style="color: #202124; font-size: 18px; margin: 0 0 8px;">¡Tenés una nueva compra!</h2>
            <p style="color: #5f6368; margin: 0 0 24px;">El siguiente cliente realizó un pedido en tu tienda.</p>

            <!-- Buyer info -->
            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #1A73E8; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Datos del Comprador</h3>
              <p style="margin: 4px 0; color: #202124;"><strong>Email:</strong> ${buyerEmail}</p>
              ${buyerName ? `<p style="margin: 4px 0; color: #202124;"><strong>Nombre:</strong> ${buyerName}</p>` : ''}
            </div>

            <!-- Order table -->
            <h3 style="color: #1A73E8; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Detalle del Pedido</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; font-size: 13px; color: #5f6368;">Producto</th>
                  <th style="padding: 12px; text-align: center; font-size: 13px; color: #5f6368;">Cantidad</th>
                  <th style="padding: 12px; text-align: right; font-size: 13px; color: #5f6368;">Precio unit.</th>
                  <th style="padding: 12px; text-align: right; font-size: 13px; color: #5f6368;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Total -->
            <div style="background: #f0f7ff; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;">
              <span style="font-size: 18px; color: #202124; font-weight: 500;">Total de la orden</span>
              <span style="font-size: 24px; color: #1A73E8; font-weight: 700;">$${total.toLocaleString('es-AR')}</span>
            </div>

            <!-- CTA -->
            <div style="text-align: center; padding: 16px; background: #fff3cd; border-radius: 12px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⚡ <strong>Acción requerida:</strong> Contactá al comprador en
                <a href="mailto:${buyerEmail}" style="color: #1A73E8;">${buyerEmail}</a>
                para coordinar la entrega y el pago.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e8eaed;">
            <p style="margin: 0; color: #9aa0a6; font-size: 12px;">
              Este correo fue generado automáticamente por <strong>desarrollodesoftware.ar</strong>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar al administrador
    const { data, error } = await resend.emails.send({
      from: 'Tienda desarrollodesoftware.ar <onboarding@resend.dev>',
      to: ['alberto.campagna@bue.edu.ar'],
      subject: `🛒 Nueva orden de $${total.toLocaleString('es-AR')} — ${buyerEmail}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 200 });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Error procesando la orden' }, { status: 500 });
  }
}
