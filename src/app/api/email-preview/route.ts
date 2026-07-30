import { NextRequest, NextResponse } from 'next/server'

/**
 * Base template wrapper for email preview
 */
function getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitação de Auxílios</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: left;
            padding: 20px 0;
            border-bottom: 1px solid #e2e8f0;
            margin-bottom: 20px;
        }
        .header img {
            max-width: 40%;
            height: auto;
        }
        .content {
            background: #f8fafc;
            padding: 30px 20px;
            border-radius: 8px;
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .info-row {
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-label {
            font-weight: bold;
            color: #64748b;
        }
        .info-value {
            color: #1e293b;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin: 10px 0;
        }
        .status-autorizada {
            background: #d1fae5;
            color: #065f46;
        }
        .status-rejeitada {
            background: #fee2e2;
            color: #991b1b;
        }
        .status-comprovada {
            background: #dbeafe;
            color: #1e40af;
        }
        .footer {
            text-align: center;
            color: #64748b;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #6366f1;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        ul, ol {
            margin-left: 0;
            padding-left: 24px;
        }
        ul {
            list-style-type: disc;
        }
        ol {
            list-style-type: decimal;
        }
        li {
            margin: 4px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://cosemspb.org/wp-content/uploads/2024/01/cosemspb_logo2024.png" alt="COSEMS PB" />
    </div>
    <div class="content">
        ${content}
    </div>
    <div class="footer">
        <p>Este é um e-mail automático. Por favor, não responda.</p>
        <p>© ${new Date().getFullYear()} COSEMS PB - Todos os direitos reservados</p>
        <p>Gostou do sistema? Quer fazer uma sugestão, crítica ou reportar um erro? Fale com o desenvolvedor - <a href="https://wa.me/5583999020647">Clique aqui</a></p>
    </div>
</body>
</html>
    `.trim()
}

export async function POST(request: NextRequest) {
    try {
        const { content } = await request.json()

        if (!content) {
            return new NextResponse('Content is required', { status: 400 })
        }

        const html = getBaseTemplate(content)

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
        })
    } catch (error) {
        console.error('Preview error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
